import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { DECK_SIZE } from '@/game/data/cards';
import { BLOOD, STORE_SYNC_INTERVAL } from '@/game/data/constants';
import type { ScenarioEventId } from '@/game/data/events';
import { getStage } from '@/game/data/stages';
import { survivalStage } from '@/game/data/survival';
import { simpleBot } from '@/game/engine/bot';
import { fieldFull, playCard } from '@/game/engine/cards';
import { createLoop } from '@/game/engine/loop';
import { triggerEvent } from '@/game/engine/scenario';
import { createSnapshot, EMPTY_SNAPSHOT } from '@/game/engine/snapshot';
import { createWorld, createZombie } from '@/game/engine/world';
import type { CardId, GameCommand, GameEvent, RenderSnapshot, World, ZombieId } from '@/game/types';
import { useProgressStore } from '@/state/progressStore';
import { sessionFromWorld, useSessionStore } from '@/state/sessionStore';

/** Ferramentas de desenvolvimento (só em __DEV__). */
export interface DevOptions {
  /** O jogador simples dos testes joga sozinho, para ver o render no simulador. */
  autoplay?: boolean;
  /** Solta 30 zumbis de uma vez, para medir o FPS (GDD seção 14). */
  stress?: boolean;
  /** Começa em 2x, para chegar logo ao fim da fase. */
  fast?: boolean;
  /** Zumbis soltos no campo logo no começo (ex.: digger,shielder), para ver o render. */
  spawn?: ZombieId[];
  /** Evento de cenário disparado logo no começo. */
  event?: ScenarioEventId;
  /** Deck só desta partida (completa com o deck salvo até 8 cartas). */
  deck?: CardId[];
  /** Cartas jogadas no começo, em fila, no centro do campo (ex.: orbital,blackhole), para ver o efeito. */
  cast?: CardId[];
}

const STRESS_ZOMBIES = 30;
// Onde as cartas de `cast` caem (uma ao lado da outra).
const CAST_X = 180;
const CAST_STEP = 120;
const CAST_Y = 320;
// Espalha os zumbis do teste de carga pela metade de cima do campo.
const STRESS_MAX_Y = 400;

/** Que partida jogar: uma fase ou a Sobrevivência. */
export type MatchKind = { mode: 'stage'; stage: number } | { mode: 'survival' };

export interface GameLoop {
  snapshot: SharedValue<RenderSnapshot>;
  /** A UI nunca mexe no World: manda comandos, aplicados no início do próximo passo. */
  send: (command: GameCommand) => void;
}

/** Deck da partida: as cartas pedidas e o resto do deck salvo, até 8, sem repetir. */
export function matchDeck(wanted: CardId[], saved: CardId[]): CardId[] {
  return [...new Set([...wanted, ...saved])].slice(0, DECK_SIZE);
}

/** Chave do que a sessão mostra: só republica quando algo visível mudou. */
const sessionKey = (w: World) =>
  `${w.phase}|${w.waveIndex}|${w.killedThisWave}|${w.totalThisWave}|${Math.floor(w.blood)}|${w.hand.join()}|${w.queue[0]}|${w.paused}|${Math.round((w.base.hp / w.base.maxHp) * 100)}|${fieldFull(w)}`;

/**
 * Cria a partida (fase ou Sobrevivência) com o deck, os níveis e a caminhonete salvos e roda o loop a cada frame.
 * Mudar `runId` recomeça a mesma fase. Ir para segundo plano pausa.
 */
export function useGameLoop(match: MatchKind, runId: number, onEvent: (event: GameEvent) => void, dev: DevOptions = {}): GameLoop {
  const stage = match.mode === 'stage' ? match.stage : 0;
  const autoplay = dev.autoplay ?? false;
  const stress = dev.stress ?? false;
  const fast = dev.fast ?? false;
  const spawnList = (dev.spawn ?? []).join();
  const devEvent = dev.event ?? null;
  const devDeck = (dev.deck ?? []).join();
  const devCast = (dev.cast ?? []).join();
  const snapshot = useSharedValue<RenderSnapshot>(EMPTY_SNAPSHOT);
  const worldRef = useRef<World | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const saved = useProgressStore.getState();
    const { cardLevels, truck } = saved;
    const deck = devDeck ? matchDeck(devDeck.split(',') as CardId[], saved.deck) : saved.deck;
    const survival = stage === 0;
    const def = survival ? survivalStage() : getStage(stage);
    const world = createWorld(def, { deck, cardLevels, truck }, Date.now(), survival ? 'survival' : 'stage');
    worldRef.current = world;
    const loop = createLoop();
    if (fast) world.speed = 2;
    const extra: ZombieId[] = [...(stress ? Array<ZombieId>(STRESS_ZOMBIES).fill('walker') : []), ...((spawnList ? spawnList.split(',') : []) as ZombieId[])];
    for (const id of extra) {
      const zombie = createZombie(world, id);
      zombie.y = world.rng() * STRESS_MAX_Y;
      world.zombies.push(zombie);
    }
    if (devEvent) triggerEvent(world, devEvent);
    // Com zumbis soltos de propósito, começa com o sangue cheio para testar as cartas caras
    if (spawnList) world.blood = BLOOD.max;
    // Cartas jogadas na hora, uma a uma, no centro do campo (um passo do jogo entre cada)
    devCast.split(',').filter(Boolean).forEach((card, i) => {
      world.blood = BLOOD.max;
      const slot = world.hand.indexOf(card as CardId);
      if (slot >= 0) playCard(world, slot, CAST_X + i * CAST_STEP, CAST_Y);
    });

    const flushCash = () => {
      if (world.pendingCash <= 0) return;
      useProgressStore.getState().addCash(world.pendingCash);
      world.pendingCash = 0;
    };
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') world.commands.push({ type: 'setPaused', paused: true });
    });

    let last: number | null = null;
    let sinceSync = 0;
    let lastKey = '';
    let frame = 0;
    let fpsFrames = 0;
    let fpsTime = 0;
    const onFrame = (now: number) => {
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      if (__DEV__) {
        fpsFrames++;
        fpsTime += dt;
        if (fpsTime >= 1) {
          useSessionStore.setState({ fps: Math.round(fpsFrames / fpsTime) });
          fpsFrames = 0;
          fpsTime = 0;
        }
      }
      if (autoplay && !world.paused) simpleBot(world);
      loop.tick(world, dt);
      sinceSync += dt;
      if (sinceSync >= STORE_SYNC_INTERVAL) {
        sinceSync = 0;
        flushCash();
      }
      const key = sessionKey(world);
      if (key !== lastKey) {
        lastKey = key;
        useSessionStore.setState(sessionFromWorld(world));
      }
      for (const event of world.events) onEventRef.current(event);
      world.events.length = 0;
      snapshot.set(createSnapshot(world));
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);
    return () => {
      cancelAnimationFrame(frame);
      appState.remove();
      flushCash();
      worldRef.current = null;
    };
  }, [stage, runId, snapshot, autoplay, stress, fast, spawnList, devEvent, devDeck, devCast]);

  const send = (command: GameCommand) => {
    worldRef.current?.commands.push(command);
  };
  return { snapshot, send };
}
