import { useEffect, useRef, useState } from 'react';

import { loadSfx, playEvent, unloadSfx } from '@/audio/sfx';
import type { ScenarioEventId } from '@/game/data/events';
import type { GameEvent } from '@/game/types';
import { useMatchRecord } from '@/hooks/useMatchRecord';
import { useProgressStore } from '@/state/progressStore';
import { outroFor } from '@/game/data/story';
import { isHeard } from '@/state/radio';
import { newStars } from '@/state/stars';
import { addPassXp } from '@/services/economy';
import { stageXp, survivalXp } from '@zombie-road/shared/pass';

/** Fim da partida, para os modais: vitória (com estrelas), derrota ou fim da Sobrevivência. */
export type CombatResult =
  | { kind: 'cleared'; stage: number; cash: number; stars: number; bonus: number; newStars: number; outro: string | null }
  | { kind: 'failed'; cash: number }
  | { kind: 'survival'; waves: number; cash: number; best: number; record: boolean }
  | null;

// Quanto tempo o aviso do evento de cenário fica na tela.
const EVENT_BANNER_MS = 2600;

/**
 * Reage aos eventos do motor: som e vibração, contadores da partida (bestiário, conquistas),
 * aviso do evento de cenário e o resultado (que grava estrelas, vitória e recorde).
 */
export function useCombatEvents() {
  const [result, setResult] = useState<CombatResult>(null);
  const [scenario, setScenario] = useState<ScenarioEventId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const match = useMatchRecord();

  useEffect(() => {
    loadSfx();
    return () => {
      unloadSfx();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showScenario = (kind: ScenarioEventId) => {
    setScenario(kind);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setScenario(null), EVENT_BANNER_MS);
  };

  const onEvent = (event: GameEvent) => {
    playEvent(event);
    match.onEvent(event);
    const progress = useProgressStore.getState();
    switch (event.type) {
      case 'scenarioEvent':
        showScenario(event.kind);
        return;
      case 'stageCleared': {
        match.flush();
        const gained = newStars(progress, event.stage, event.stars);
        const bonus = progress.clearStage(event.stage, event.stars);
        // Fechamento do mundo no rádio (só na primeira vez que vence o chefe)
        const outro = outroFor(event.stage);
        setResult({ kind: 'cleared', stage: event.stage, cash: event.cashEarned, stars: event.stars, bonus, newStars: gained, outro: outro && !isHeard(progress, outro) ? outro : null });
        addPassXp(stageXp(true, event.stars));
        return;
      }
      case 'stageFailed':
        match.flush();
        setResult({ kind: 'failed', cash: event.cashEarned });
        addPassXp(stageXp(false, 0));
        return;
      case 'survivalOver': {
        match.flush();
        const record = progress.recordSurvival(event.waves);
        setResult({ kind: 'survival', waves: event.waves, cash: event.cashEarned, best: Math.max(progress.survivalBest, event.waves), record });
        addPassXp(survivalXp(event.waves));
        return;
      }
    }
  };

  return { result, clearResult: () => setResult(null), scenario, onEvent };
}
