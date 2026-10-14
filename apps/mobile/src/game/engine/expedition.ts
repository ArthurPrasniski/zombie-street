import { EXPEDITION_BALANCE, EXPEDITION_BOONS, EXPEDITION_STACK_LIMIT, type ExpeditionBoon } from '@/game/data/expedition';
import { shuffle } from './rng';
import type { World } from '@/game/types';
export function boonCount(world: World, boon: ExpeditionBoon): number { return world.expedition?.picked.filter((id) => id === boon).length ?? 0; }
export function offerBoons(world: World) {
 const run = world.expedition; if (!run) return;
 run.choices = shuffle(world.rng, EXPEDITION_BOONS.filter((id) => boonCount(world,id) < EXPEDITION_STACK_LIMIT)).slice(0,3);
 if (!run.choices.length) return;
 run.pending = true; world.paused = true; world.events.push({ type: 'expeditionChoice', choices: [...run.choices] });
}
export function chooseBoon(world: World, boon: ExpeditionBoon): boolean {
 const run = world.expedition;
 if (!run?.pending || !run.choices.includes(boon)) return false;
 if (boon === 'attack') {
  const before = 1 + boonCount(world,'attack') * EXPEDITION_BALANCE.attack;
  for (const troop of world.troops) troop.damage *= (before + EXPEDITION_BALANCE.attack) / before;
 } else if (boon === 'repair') world.base.hp = Math.min(world.base.maxHp, world.base.hp + world.base.maxHp * EXPEDITION_BALANCE.repair);
 else if (boon === 'hull') { const gained = world.base.maxHp * EXPEDITION_BALANCE.hull; world.base.maxHp += gained; world.base.hp += gained; }
 run.picked.push(boon); run.pending = false; run.choices = []; world.paused = false;
 return true;
}
