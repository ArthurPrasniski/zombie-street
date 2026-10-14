import { recordDaily } from '@/services/missions';
import { tutorialAfter } from '@/state/tutorial';
import { track } from '@/services/telemetry';
import { useEffect, useRef, useState } from 'react';

import { loadSfx, playEvent, unloadSfx } from '@/audio/sfx';
import type { ScenarioEventId } from '@/game/data/events';
import type { GameEvent, MatchStats } from '@/game/types';
import { useMatchRecord } from '@/hooks/useMatchRecord';
import { useProgressStore } from '@/state/progressStore';
import { outroFor } from '@/game/data/story';
import { isHeard } from '@/state/radio';
import { newStars } from '@/state/stars';
import { addPassXp } from '@/services/economy';
import { stageXp, survivalXp } from '@zombie-road/shared/pass';

/** Fim da partida, para os modais: vitória (com estrelas), derrota ou fim da Sobrevivência. */
type ResultStats = { stats?: MatchStats };
export type CombatResult =
  | (ResultStats & { kind: 'cleared'; stage: number; cash: number; stars: number; bonus: number; newStars: number; outro: string | null })
  | (ResultStats & { kind: 'failed'; cash: number })
  | (ResultStats & { kind: 'survival'; expedition?: boolean; waves: number; cash: number; best: number; record: boolean })
  | null;

// Quanto tempo o aviso do evento de cenário fica na tela.
const EVENT_BANNER_MS = 2600;

/**
 * Reage aos eventos do motor: som e vibração, contadores da partida (bestiário, conquistas),
 * aviso do evento de cenário e o resultado (que grava estrelas, vitória e recorde).
 */
export function useCombatEvents(training = false, expedition = false, tutorialEnabled = true) {
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
    if (!training) match.onEvent(event);
    const progress = useProgressStore.getState();
    const tutorial = event.type === 'stageCleared' ? event.stage === 1 : true;
    if (tutorialEnabled && tutorial && progress.tutorialStep < 4) {
      const next = tutorialAfter(progress.tutorialStep, event);
      if (next !== progress.tutorialStep) {
        progress.setTutorial(next);
        if (next === 1) track('tutorial_started');
      }
    }
    switch (event.type) {
      case 'scenarioEvent':
        showScenario(event.kind);
        return;
      case 'stageCleared': {
        if (training) { setResult({ stats: event.stats, kind: 'cleared', stage: event.stage, cash: 0, stars: 0, bonus: 0, newStars: 0, outro: null }); return; }
        recordDaily(1, event.stats?.kills ?? 0, Object.values(event.stats?.cards ?? {}).reduce((a, n) => a + (n ?? 0), 0));
        match.flush();
        const gained = newStars(progress, event.stage, event.stars);
        const bonus = progress.clearStage(event.stage, event.stars);
        // Fechamento do mundo no rádio (só na primeira vez que vence o chefe)
        const outro = outroFor(event.stage);
        setResult({ stats: event.stats, kind: 'cleared', stage: event.stage, cash: event.cashEarned, stars: event.stars, bonus, newStars: gained, outro: outro && !isHeard(progress, outro) ? outro : null });
        addPassXp(stageXp(true, event.stars));
        return;
      }
      case 'stageFailed':
        if (training) { setResult({ stats: event.stats, kind: 'failed', cash: 0 }); return; }
        match.flush();
        recordDaily(0, event.stats?.kills ?? 0, Object.values(event.stats?.cards ?? {}).reduce((a, n) => a + (n ?? 0), 0));
        progress.failStage(event.stage);
        setResult({ stats: event.stats, kind: 'failed', cash: event.cashEarned });
        addPassXp(stageXp(false, 0));
        return;
      case 'survivalOver': {
        recordDaily(0, event.stats?.kills ?? 0, Object.values(event.stats?.cards ?? {}).reduce((a, n) => a + (n ?? 0), 0));
        match.flush();
        const previousBest = expedition ? progress.expeditionBest : progress.survivalBest;
        const record = expedition ? progress.recordExpedition(event.waves) : progress.recordSurvival(event.waves);
        setResult({ expedition, stats: event.stats, kind: 'survival', waves: event.waves, cash: event.cashEarned, best: Math.max(previousBest, event.waves), record });
        addPassXp(survivalXp(event.waves));
        return;
      }
    }
  };

  return { result, clearResult: () => setResult(null), scenario, onEvent };
}
