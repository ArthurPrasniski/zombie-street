import { WORLD_EVENT } from '@/game/data/events';
import { bossWave, eventDelay, regularWave, SPECIAL_ZOMBIES } from '@/game/data/stages';
import { WORLDS } from '@/game/data/worlds';
// A Sobrevivência só passa pelos mundos da campanha (os da Fronteira são gerados por fase).
import { ZOMBIES } from '@/game/data/zombies';
import type { StageDef, WaveDef, ZombieId } from '@/game/types';

// Seção 17.9: Sobrevivência, ondas sem fim.
/** Fase que precisa ser vencida para liberar o modo. */
export const SURVIVAL_UNLOCK = 10;
/** A cada quantas ondas vem um chefe, troca o cenário e acontece um evento. */
export const SURVIVAL_BOSS_EVERY = 5;
export const SURVIVAL_WORLD_EVERY = 10;
export const SURVIVAL_EVENT_EVERY = 3;
/** Bônus por onda n vencida: n x SURVIVAL_WAVE_BONUS. */
export const SURVIVAL_WAVE_BONUS = 15;

/** Mundo (0 a 4) da onda n: muda a cada 10 ondas e volta para o primeiro depois do último. */
export const survivalWorld = (n: number): number => Math.floor((n - 1) / SURVIVAL_WORLD_EVERY) % WORLDS.length;

export const survivalBonus = (n: number): number => SURVIVAL_WAVE_BONUS * n;

/**
 * Onda n com a dificuldade da fase n (nível n), o chefe a cada 5 ondas e o evento do mundo a
 * cada 3. As ondas comuns seguem o ciclo 1 a 4 das fases.
 */
export function survivalWave(n: number): WaveDef {
  const w = survivalWorld(n);
  const wave = n % SURVIVAL_BOSS_EVERY === 0 ? bossWave(n, w) : regularWave(n, w, ((n - 1) % SURVIVAL_BOSS_EVERY) + 1);
  if (n % SURVIVAL_EVENT_EVERY === 0) wave.event = { kind: WORLD_EVENT[WORLDS[w].id], at: eventDelay(n, 2) };
  return { ...wave, level: n };
}

/** Começo da Sobrevivência: só a primeira onda; as outras são criadas ao vencer cada uma. */
export function survivalStage(): StageDef {
  return { index: 0, waves: [survivalWave(1)] };
}

/** Zumbis que podem aparecer na onda n (para carregar as sheets do mundo atual). */
export function survivalZombies(n: number): ZombieId[] {
  const world = WORLDS[survivalWorld(n)];
  const ids: ZombieId[] = ['walker', 'runner', world.boss];
  if (world.zombie) ids.push(world.zombie);
  for (const entry of SPECIAL_ZOMBIES) {
    if (n < entry.from) continue;
    ids.push(entry.zombie);
    const into = ZOMBIES[entry.zombie].split?.into;
    if (into) ids.push(into);
  }
  return ids;
}
