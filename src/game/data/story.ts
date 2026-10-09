import { STAGES_PER_WORLD } from '@/game/data/worlds';

// Seção 18: a história em 3 atos (5 + 3 + 4 mundos) e depois a Fronteira, contada por rádio.
export type Speaker = 'sheriff' | 'sniper' | 'vega' | 'static';
export type RadioMoment = 'intro' | 'outro';

/** Mundos (índices) de cada ato. */
export const ACTS: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7],
  [8, 9, 10, 11],
];
/** Primeiro mundo (índice) da Fronteira infinita. */
export const FRONTIER_WORLD = 12;

/** Ato (0 a 2) do mundo; a Fronteira conta como 3. */
export const actOf = (world: number): number => {
  const act = ACTS.findIndex((worlds) => worlds.includes(world));
  return act >= 0 ? act : ACTS.length;
};

/**
 * Mensagem de rádio do mundo (índice) no momento: abertura antes da 1ª fase e fechamento depois
 * do chefe. Na Fronteira, só a abertura do primeiro mundo. Os textos ficam em pt.radio.messages.
 */
export function radioId(world: number, moment: RadioMoment): string | null {
  if (world >= FRONTIER_WORLD) return world === FRONTIER_WORLD && moment === 'intro' ? 'frontier' : null;
  return `w${world + 1}-${moment}`;
}

/** Mensagem que toca ao começar a fase (abertura do mundo, só na 1ª fase). */
export function introFor(stage: number): string | null {
  const world = Math.floor((stage - 1) / STAGES_PER_WORLD);
  return (stage - 1) % STAGES_PER_WORLD === 0 ? radioId(world, 'intro') : null;
}

/** Mensagem que toca ao vencer a fase (fechamento do mundo, só no chefe). */
export function outroFor(stage: number): string | null {
  const world = Math.floor((stage - 1) / STAGES_PER_WORLD);
  return stage % STAGES_PER_WORLD === 0 ? radioId(world, 'outro') : null;
}
