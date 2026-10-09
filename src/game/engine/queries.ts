import { BASE, ZOMBIE_AGGRO, ZOMBIE_REACH } from '@/game/data/constants';
import type { TroopEntity, World, ZombieDef, ZombieEntity } from '@/game/types';

export const distance = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/** Partida em andamento (os sistemas param na vitória e na derrota). */
export const isActive = (world: World) => world.phase === 'intermission' || world.phase === 'fighting';

/** Vira a unidade para o ponto (usado para escolher a vista: frente, costas ou lado). */
export function faceTowards(unit: { x: number; y: number; dirX: number; dirY: number }, x: number, y: number): void {
  const d = Math.hypot(x - unit.x, y - unit.y);
  if (d < 0.001) return;
  unit.dirX = (x - unit.x) / d;
  unit.dirY = (y - unit.y) / d;
}

/** Sem alvo, a tropa volta a olhar para o topo do campo, de onde vêm os zumbis. */
export function faceUpfield(unit: { dirX: number; dirY: number }): void {
  unit.dirX = 0;
  unit.dirY = -1;
}

/** Pode ser alvo: vivo e fora da terra (o Escavador enterrado não pode ser atingido). */
export const isTargetable = (z: ZombieEntity): boolean => z.state !== 'dead' && !z.burrowed;
export const isAliveZombie = (z: ZombieEntity | null): z is ZombieEntity => z !== null && isTargetable(z);
export const isAliveTroop = (t: TroopEntity | null): t is TroopEntity => t !== null && t.hp > 0;

/** Zumbi alvo mais perto a até `maxDistance`; `accept` filtra (ex.: só os que a tropa alcança). */
export function nearestZombie(world: World, x: number, y: number, maxDistance: number, accept?: (z: ZombieEntity) => boolean): ZombieEntity | null {
  let best: ZombieEntity | null = null;
  let bestDistance = maxDistance;
  for (const zombie of world.zombies) {
    if (!isTargetable(zombie) || (accept && !accept(zombie))) continue;
    const d = distance(x, y, zombie.x, zombie.y);
    if (d <= bestDistance) {
      best = zombie;
      bestDistance = d;
    }
  }
  return best;
}

export function zombiesWithin(world: World, x: number, y: number, radius: number): ZombieEntity[] {
  return world.zombies.filter((z) => isTargetable(z) && distance(x, y, z.x, z.y) <= radius);
}

/** Tropa mais perto a até `maxDistance`. Tropas que voam (Drone) só entram com `canHitFlying`. */
export function nearestTroop(world: World, x: number, y: number, maxDistance: number, structuresOnly = false, canHitFlying = false): TroopEntity | null {
  let best: TroopEntity | null = null;
  let bestDistance = maxDistance;
  for (const troop of world.troops) {
    if (troop.hp <= 0 || (structuresOnly && !troop.def.building) || (troop.def.flying && !canHitFlying)) continue;
    const d = distance(x, y, troop.x, troop.y);
    if (d <= bestDistance) {
      best = troop;
      bestDistance = d;
    }
  }
  return best;
}

// ---------- Alcance dos zumbis (o Cuspidor ataca de longe) ----------

/** Distância de onde o zumbi ataca a tropa. */
export const zombieReach = (def: ZombieDef): number => def.ranged ?? ZOMBIE_REACH;

/** Distância em que o zumbi percebe as tropas (o Cuspidor enxerga um pouco além do alcance). */
export const zombieAggro = (def: ZombieDef): number => Math.max(ZOMBIE_AGGRO, (def.ranged ?? 0) * 1.2);

/** Altura onde o zumbi para para atacar a base (o Cuspidor para antes do muro). */
export const baseStopY = (def: ZombieDef): number => BASE.frontY - (def.ranged ?? 0);
