import { AIRSTRIKE_SHAKE, BIG_EXPLOSION_TTL, EXPLOSION_TTL, FIELD, WORLD_HEIGHT } from '@/game/data/constants';
import { damageZombie } from '@/game/engine/damage';
import { distance, isTargetable, zombiesWithin } from '@/game/engine/queries';
import type { Area, World, ZombieEntity } from '@/game/types';

// Armas especiais do Ato 3 que agem com o tempo (GDD seção 18.4): Escudo de Energia, Buraco
// Negro e Canhão Orbital. O sistema de áreas chama estas funções.

// Altura da parede do Escudo (faixa em y em que ela segura os zumbis).
const WALL_DEPTH = 16;

/** O zumbi está encostado na parede do Escudo (vindo de cima). */
export function blockedByField(world: World, zombie: ZombieEntity): Extract<Area, { kind: 'forcefield' }> | null {
  for (const a of world.areas) {
    if (a.kind !== 'forcefield' || a.hp <= 0) continue;
    if (Math.abs(zombie.x - a.x) <= a.width / 2 && zombie.y >= a.y - WALL_DEPTH && zombie.y <= a.y + WALL_DEPTH) return a;
  }
  return null;
}

/** Golpe de zumbi na parede: tira vida dela. */
export function hitField(field: Extract<Area, { kind: 'forcefield' }>, amount: number): void {
  field.hp = Math.max(0, field.hp - amount);
}

/** Buraco Negro: puxa os zumbis do raio para o centro; no fim, esmaga todos que estão perto. */
function tickBlackhole(world: World, hole: Extract<Area, { kind: 'blackhole' }>, dt: number): void {
  hole.ttl -= dt;
  for (const zombie of zombiesWithin(world, hole.x, hole.y, hole.radius)) {
    const d = distance(zombie.x, zombie.y, hole.x, hole.y);
    if (d < 1 || zombie.def.isBoss) continue;
    const step = Math.min(d, hole.pull * dt);
    zombie.x += ((hole.x - zombie.x) / d) * step;
    zombie.y += ((hole.y - zombie.y) / d) * step;
  }
  if (hole.ttl > 0) return;
  for (const zombie of zombiesWithin(world, hole.x, hole.y, hole.radius)) damageZombie(world, zombie, hole.damage);
  world.effects.push({ kind: 'explosion', x: hole.x, y: hole.y, radius: hole.radius * 0.7, ttl: EXPLOSION_TTL, duration: EXPLOSION_TTL });
  world.events.push({ type: 'explosion', big: false });
}

/** Canhão Orbital: depois do atraso, o raio acerta a coluna inteira do campo. */
function tickOrbital(world: World, beam: Extract<Area, { kind: 'orbital' }>, dt: number): void {
  beam.delay -= dt;
  if (beam.delay > 0) return;
  for (const zombie of world.zombies) {
    if (isTargetable(zombie) && Math.abs(zombie.x - beam.x) <= beam.width / 2 && zombie.y >= FIELD.minY) damageZombie(world, zombie, beam.damage);
  }
  for (let y = 120; y < WORLD_HEIGHT - 120; y += 160) world.effects.push({ kind: 'explosion', x: beam.x, y, radius: beam.width * 0.6, ttl: BIG_EXPLOSION_TTL, duration: BIG_EXPLOSION_TTL });
  world.shake = Math.max(world.shake, AIRSTRIKE_SHAKE);
  world.events.push({ type: 'explosion', big: true });
}

/** Avança uma área das armas do Ato 3. Retorna false se não é uma delas. */
export function updateSpellArea(world: World, area: Area, dt: number): boolean {
  if (area.kind === 'forcefield') area.ttl -= dt;
  else if (area.kind === 'blackhole') tickBlackhole(world, area, dt);
  else if (area.kind === 'orbital') tickOrbital(world, area, dt);
  else return false;
  return true;
}

/** A área acabou (parede quebrou ou o tempo passou, buraco fechou, raio caiu). */
export function spellAreaDone(area: Area): boolean {
  if (area.kind === 'forcefield') return area.ttl <= 0 || area.hp <= 0;
  if (area.kind === 'blackhole') return area.ttl <= 0;
  if (area.kind === 'orbital') return area.delay <= 0;
  return false;
}
