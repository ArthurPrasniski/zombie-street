import { CARDS } from '@/game/data/cards';
import type { GameEvent } from '@/game/types';
/** Progression only follows successful engine actions; skipping never grants a reward. */
export function tutorialAfter(step: number, event: GameEvent): number {
 if (event.type === 'cardPlayed') {
  if (step === 0 && CARDS[event.card].kind === 'troop') return 1;
  if (step === 1 && event.card === 'barricade') return 2;
  if (step === 2 && CARDS[event.card].kind === 'spell') return 3;
 }
 if (step === 3 && event.type === 'stageCleared') return 4;
 return step;
}
