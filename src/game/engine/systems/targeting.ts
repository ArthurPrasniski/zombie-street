import { BASE } from '@/game/data/constants';
import { faceUpfield, isActive, nearestZombie } from '@/game/engine/queries';
import { troopRange } from '@/game/engine/scenario';
import type { World } from '@/game/types';

/** Atiradores e a metralhadora da base miram o zumbi mais próximo no alcance. O corpo a corpo escolhe no movement. */
export function targeting(world: World, _dt: number): void {
  if (!isActive(world)) return;
  for (const troop of world.troops) {
    if (troop.hp <= 0 || troop.deployTimer > 0 || troop.def.role !== 'ranged') continue;
    troop.target = nearestZombie(world, troop.x, troop.y, troopRange(world, troop));
    if (!troop.target) faceUpfield(troop);
  }
  world.base.target = world.base.hp > 0 ? nearestZombie(world, BASE.gunX, BASE.gunY, BASE.range) : null;
}
