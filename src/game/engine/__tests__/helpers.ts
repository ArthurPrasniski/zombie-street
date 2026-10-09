import { CARD_IDS, STARTER_DECK, TROOPS } from '@/game/data/cards';
import { FIXED_STEP } from '@/game/data/constants';
import { generateStage } from '@/game/data/stages';
import { stepWorld } from '@/game/engine/systems';
import { createTroop, createWorld, createZombie, type MatchSetup } from '@/game/engine/world';
import type { CardId, CardLevels, GameEvent, StageDef, TroopEntity, TroopId, World, ZombieEntity, ZombieId } from '@/game/types';

export const LEVEL_1 = Object.fromEntries(CARD_IDS.map((id) => [id, 1])) as CardLevels;
export const SETUP: MatchSetup = { deck: STARTER_DECK, cardLevels: LEVEL_1 };

export function makeWorld(stage: StageDef = generateStage(1), seed = 1): World {
  return createWorld(stage, SETUP, seed);
}

/** Mundo já em combate, sem a pausa inicial e sem ondas pendentes. */
export function fightingWorld(stage: StageDef = generateStage(1)): World {
  const world = makeWorld(stage);
  world.phase = 'fighting';
  world.spawnCursor = Number.MAX_SAFE_INTEGER;
  world.totalThisWave = Number.MAX_SAFE_INTEGER;
  return world;
}

export function addZombie(world: World, id: ZombieId, x: number, y: number): ZombieEntity {
  const zombie = createZombie(world, id);
  zombie.x = x;
  zombie.y = y;
  world.zombies.push(zombie);
  return zombie;
}

export function addTroop(world: World, id: TroopId, x: number, y: number, level = 1): TroopEntity {
  const troop = createTroop(world, TROOPS[id], level, x, y);
  troop.deployTimer = 0;
  world.troops.push(troop);
  return troop;
}

/** Coloca a carta no espaço 0 da mão, para o teste não depender do embaralhamento. */
export function giveCard(world: World, card: CardId): void {
  world.queue = world.queue.filter((c) => c !== card);
  if (world.hand.includes(card)) world.hand[world.hand.indexOf(card)] = world.hand[0];
  world.queue.push(world.hand[0]);
  world.hand[0] = card;
}

/** Roda passos fixos e devolve todos os eventos, esvaziando a fila a cada passo. */
export function simulate(world: World, seconds: number, opts: { until?: (e: GameEvent) => boolean; bot?: (w: World) => void } = {}): GameEvent[] {
  const all: GameEvent[] = [];
  const steps = Math.round(seconds / FIXED_STEP);
  for (let i = 0; i < steps; i++) {
    opts.bot?.(world);
    stepWorld(world, FIXED_STEP);
    for (const event of world.events) {
      all.push(event);
      if (opts.until?.(event)) return all;
    }
    world.events.length = 0;
  }
  return all;
}

export { simpleBot } from '@/game/engine/bot';
