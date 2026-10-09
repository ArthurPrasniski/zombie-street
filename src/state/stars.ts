import { MAX_STARS, starBonus } from '@/game/data/balance';
import { globalStage, STAGES_PER_WORLD } from '@/game/data/worlds';
import type { Progress } from '@/state/progress';

// Estrelas por fase (GDD seção 17.1).

type WithStars = Pick<Progress, 'stars'>;

/** Melhor marca de estrelas da fase (0 se nunca foi vencida). */
export const stageStars = (p: WithStars, stage: number): number => p.stars[stage - 1] ?? 0;

/** Quantas estrelas a vitória acrescenta à melhor marca da fase. */
export function newStars(p: WithStars, stage: number, stars: number): number {
  return Math.max(0, Math.min(MAX_STARS, stars) - stageStars(p, stage));
}

/** Dinheiro que as estrelas novas pagam (sem mudar o progresso). */
export const starReward = (p: WithStars, stage: number, stars: number): number => starBonus(stage, newStars(p, stage, stars));

/** Guarda a melhor marca e paga o bônus. Sem estrela nova, devolve o mesmo objeto. */
export function recordStars(p: Progress, stage: number, stars: number): Progress {
  const gained = newStars(p, stage, stars);
  if (gained === 0) return p;
  // Na Fronteira a lista cresce com as fases novas
  const list = [...p.stars];
  while (list.length < stage) list.push(0);
  list[stage - 1] = stageStars(p, stage) + gained;
  return { ...p, stars: list, cash: p.cash + starBonus(stage, gained) };
}

/** Estrelas somadas das 10 fases do mundo (0 a 4). */
export function worldStars(p: WithStars, world: number): number {
  let sum = 0;
  for (let local = 1; local <= STAGES_PER_WORLD; local++) sum += stageStars(p, globalStage(world, local));
  return sum;
}

export const totalStars = (p: WithStars): number => p.stars.reduce((sum, n) => sum + n, 0);
