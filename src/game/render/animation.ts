import { CORPSE_TTL } from '@/game/data/constants';
import layout from '@/game/render/spriteLayout.json';
import type { RenderSnapshot, TroopId, ZombieId } from '@/game/types';

type TroopSnap = RenderSnapshot['troops'][number];
type ZombieSnap = RenderSnapshot['zombies'][number];

const T = layout.troops;
const Z = layout.zombies;
const V = layout.views;

/** Nome de cada linha das sheets, na ordem das linhas. */
export const VIEW_NAMES = ['front', 'back', 'side'] as const;
export type ViewName = (typeof VIEW_NAMES)[number];
// Até ~50° da vertical a unidade aparece de frente ou de costas; mais deitado, de perfil.
const VERTICAL_BIAS = 0.8;

// Distância andada (unidades do mundo) por quadro de caminhada, para o pé não deslizar
// (o ciclo de 8 quadros cobre a mesma distância que o antigo de 6).
const STRIDE_PER_FRAME = 6 / 8;
const ZOMBIE_STRIDE: Record<ZombieId, number> = {
  walker: 4.6, runner: 6.7, brute: 7.5, cop: 4.6, riot: 7.5, bloater: 4.6, hulk: 7.5, grunt: 5.5, general: 7.5, frost: 4.6, yeti: 7.5,
  spitter: 4.6, digger: 4.6, splitter: 4.6, splitling: 6.7, shielder: 4.6,
  android: 4.6, mutant: 4.6, astronaut: 4.6, colossus: 7.5, director: 7.5, padChief: 7.5,
  cosmonaut: 4.6, xeno: 6.7, pod: 4.6, larva: 6.7, commander: 7.5, lunarWorm: 7.5, marsTitan: 7.5, queen: 7.5,
};
const TROOP_STRIDE = 4.6;
const IDLE_FPS = 6;
const DEATH_FRAME = 0.09;
const CORPSE_FADE = 0.4;

// Ataques com 8 quadros (scripts/art/clash.mjs): o tiro sai no quadro 3; antes dele vem a
// antecipação (1 e 2), depois o coice (4 e 5) e a volta (6).
const A = T.attack.start;

/** Armas de fogo: antecipa pouco antes do tiro, dispara, coice e volta; mirando no resto. */
function gunFrame(t: TroopSnap): number {
  'worklet';
  if (t.sinceAttack < 0.06) return A + 3;
  if (t.sinceAttack < 0.12) return A + 4;
  if (t.sinceAttack < 0.18) return A + 5;
  if (t.sinceAttack < 0.26) return A + 6;
  if (!t.aiming) return -1;
  if (t.untilAttack < 0.06) return A + 2;
  if (t.untilAttack < 0.12) return A + 1;
  return A;
}

/** Motosserra: ergue e segura antes do golpe, golpeia (3) e acompanha. */
function sawFrame(t: TroopSnap): number {
  'worklet';
  if (t.sinceAttack < 0.08) return A + 3;
  if (t.sinceAttack < 0.16) return A + 4;
  if (t.sinceAttack < 0.26) return A + 5;
  if (t.sinceAttack < 0.34) return A + 6;
  if (!t.aiming) return -1;
  if (t.untilAttack < 0.1) return A + 2;
  if (t.untilAttack < 0.2) return A + 1;
  return A;
}

/** Cachorro: agacha antes, salta e morde (3), volta. */
function biteFrame(t: TroopSnap): number {
  'worklet';
  if (t.sinceAttack < 0.08) return A + 3;
  if (t.sinceAttack < 0.16) return A + 4;
  if (t.sinceAttack < 0.24) return A + 5;
  if (t.sinceAttack < 0.34) return A + 6;
  if (!t.aiming) return -1;
  if (t.untilAttack < 0.08) return A + 2;
  if (t.untilAttack < 0.16) return A + 1;
  return t.untilAttack < 0.3 ? A : -1;
}

/** Linha da sheet pela direção: descendo = frente, subindo = costas, de lado = perfil. */
export function viewRow(dirX: number, dirY: number): number {
  'worklet';
  if (Math.abs(dirY) >= Math.abs(dirX) * VERTICAL_BIAS) return dirY > 0 ? V.front : V.back;
  return V.side;
}

/** O perfil das sheets olha para a direita: espelha quando a unidade vai para a esquerda. */
export function viewFlip(row: number, dirX: number): boolean {
  'worklet';
  return row === V.side && dirX < 0;
}

export function troopFrame(t: TroopSnap, time: number, index: number): number {
  'worklet';
  if (t.kind === 'barricade') return T.idle.start + (t.hpRatio > 0.66 ? 0 : t.hpRatio > 0.33 ? 1 : 2);
  if (t.moving) return T.walk.start + (Math.floor(t.travelled / (TROOP_STRIDE * STRIDE_PER_FRAME)) % T.walk.count);
  const attack = t.kind === 'chainsaw' ? sawFrame(t) : t.kind === 'dog' ? biteFrame(t) : gunFrame(t);
  if (attack >= 0) return attack;
  return T.idle.start + (Math.floor(time * IDLE_FPS + index * 1.3) % T.idle.count);
}

export function zombieFrame(z: ZombieSnap): number {
  'worklet';
  if (z.attacking) {
    // p vai de 0 (golpe acabou de acontecer) a 1 (próximo golpe): o golpe é o quadro 3
    const p = z.attackProgress;
    const frame = p < 0.08 ? 3 : p < 0.2 ? 4 : p < 0.32 ? 5 : p < 0.45 ? 6 : p < 0.78 ? 0 : p < 0.9 ? 1 : 2;
    return Z.attack.start + frame;
  }
  const step = Math.floor(z.travelled / (ZOMBIE_STRIDE[z.kind] * STRIDE_PER_FRAME * z.scale));
  return Z.walk.start + ((step + z.uid) % Z.walk.count);
}

const isZombie = (unit: TroopId | ZombieId) => {
  'worklet';
  return ZOMBIE_STRIDE[unit as ZombieId] !== undefined;
};

/** Corpo: zumbi cai em 5 quadros; tropa usa o quadro "caída". Some no fim. */
export function corpseFrame(unit: TroopId | ZombieId, ttl: number): { frame: number; alpha: number } {
  'worklet';
  const alpha = Math.min(1, ttl / CORPSE_FADE);
  if (!isZombie(unit)) return { frame: T.down.start, alpha };
  const elapsed = CORPSE_TTL - ttl;
  return { frame: Z.death.start + Math.min(Z.death.count - 1, Math.floor(elapsed / DEATH_FRAME)), alpha };
}

/** Base: inteira, avariada, muito avariada, destruída. */
export function baseFrame(hpRatio: number): number {
  'worklet';
  return hpRatio > 0.66 ? 0 : hpRatio > 0.33 ? 1 : hpRatio > 0 ? 2 : 3;
}
