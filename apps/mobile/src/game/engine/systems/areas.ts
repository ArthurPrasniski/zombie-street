import { AIRSTRIKE_SHAKE, BIG_EXPLOSION_TTL, EXPLOSION_TTL } from '@/game/data/constants';
import { damageZombie } from '@/game/engine/damage';
import { distance, isActive, isTargetable, zombiesWithin } from '@/game/engine/queries';
import { scenarioAreaDone, tickWeather, updateScenarioArea } from '@/game/engine/scenario';
import { spellAreaDone, updateSpellArea } from '@/game/engine/spells';
import { removeWhere } from '@/game/engine/systems/cleanup';
import type { Area, World } from '@/game/types';

/**
 * Molotov queima por segundo; o ataque aéreo cai depois do atraso; a mina espera um zumbi (GDD seção 6.2).
 * Também os eventos de cenário (fardo, carros-bomba, bombas) e o clima (seção 17.5).
 */
export function areas(world: World, dt: number): void {
  if (!isActive(world)) return;
  tickWeather(world, dt);
  for (const area of world.areas) {
    if (area.kind === 'fire') burn(world, area, dt);
    else if (area.kind === 'airstrike') countdown(world, area, dt);
    else if (area.kind === 'mine') mine(world, area);
    else if (!updateSpellArea(world, area, dt)) updateScenarioArea(world, area, dt);
  }
  removeWhere(world.areas, isDone);
}

function isDone(area: Area): boolean {
  if (area.kind === 'fire') return area.ttl <= 0;
  if (area.kind === 'airstrike') return area.delay <= 0;
  if (area.kind === 'mine') return area.exploded;
  return spellAreaDone(area) || scenarioAreaDone(area);
}

/** Mina: explode quando o primeiro zumbi chega a `trigger` dela e fere todos no raio. */
function mine(world: World, m: Extract<Area, { kind: 'mine' }>): void {
  if (zombiesWithin(world, m.x, m.y, m.trigger).length === 0) return;
  for (const zombie of zombiesWithin(world, m.x, m.y, m.radius)) damageZombie(world, zombie, m.damage);
  world.effects.push({ kind: 'explosion', x: m.x, y: m.y, radius: m.radius, ttl: EXPLOSION_TTL, duration: EXPLOSION_TTL });
  world.events.push({ type: 'explosion', big: false });
  m.exploded = true;
}

function burn(world: World, fire: Extract<Area, { kind: 'fire' }>, dt: number): void {
  const step = Math.min(dt, fire.ttl);
  fire.ttl -= dt;
  // Dano contínuo sem flash, para o zumbi não piscar o tempo todo.
  for (const zombie of world.zombies) {
    if (isTargetable(zombie) && distance(zombie.x, zombie.y, fire.x, fire.y) <= fire.radius) damageZombie(world, zombie, fire.dps * step, false);
  }
}

function countdown(world: World, strike: Extract<Area, { kind: 'airstrike' }>, dt: number): void {
  strike.delay -= dt;
  if (strike.delay > 0) return;
  for (const zombie of zombiesWithin(world, strike.x, strike.y, strike.radius)) damageZombie(world, zombie, strike.damage);
  world.effects.push({ kind: 'explosion', x: strike.x, y: strike.y, radius: strike.radius, ttl: BIG_EXPLOSION_TTL, duration: BIG_EXPLOSION_TTL });
  world.shake = Math.max(world.shake, AIRSTRIKE_SHAKE);
  world.events.push({ type: 'explosion', big: true });
}
