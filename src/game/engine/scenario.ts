import { BLACKOUT, BLIZZARD, CAR_BOMB, DEBRIS, DUSTSTORM, ENGINE_TEST, FOG, GAS_LEAK, HAY, METEORS, type ScenarioEventId, SHELLING, SPORES } from '@/game/data/events';
import { EXPLOSION_TTL, FIELD, WORLD_WIDTH } from '@/game/data/constants';
import { damageTroop, damageZombie } from '@/game/engine/damage';
import { distance, isTargetable, zombiesWithin } from '@/game/engine/queries';
import { randomRange } from '@/game/engine/rng';
import { createZombie } from '@/game/engine/world';
import type { Area, TroopEntity, World, ZombieEntity } from '@/game/types';

// Eventos de cenário (GDD seção 17.5). O spawn dispara; o sistema de áreas faz cada um andar.

// Colunas por onde o fardo pode rolar e faixa onde as bombas caem.
const HAY_X = { min: 90, max: 510 };
const SHELL_X = { min: 60, max: 540 };
// Tremor leve quando um carro ou uma bomba explode.
const EVENT_SHAKE = 0.3;

/** Começa o evento: cria as áreas (fardo, carros, bombas) ou o clima (névoa, nevasca). */
export function triggerEvent(world: World, kind: ScenarioEventId): void {
  world.events.push({ type: 'scenarioEvent', kind });
  switch (kind) {
    case 'hay':
      world.areas.push({ kind: 'hay', uid: world.nextUid++, x: randomRange(world.rng, HAY_X.min, HAY_X.max), y: HAY.startY, hit: [] });
      return;
    case 'carBombs':
      for (let i = 0; i < CAR_BOMB.count; i++) {
        const x = randomRange(world.rng, CAR_BOMB.minX, CAR_BOMB.maxX);
        const y = randomRange(world.rng, CAR_BOMB.minY, CAR_BOMB.maxY);
        world.areas.push({ kind: 'carBomb', uid: world.nextUid++, x, y, fuse: CAR_BOMB.fuse, exploded: false });
      }
      return;
    case 'shelling':
      dropShells(world, 'bomb');
      return;
    case 'debris':
      dropShells(world, 'debris');
      return;
    case 'meteors':
      dropShells(world, 'meteor');
      return;
    case 'duststorm':
      world.weather = { kind: 'dust', ttl: DUSTSTORM.duration, duration: DUSTSTORM.duration };
      return;
    case 'spores':
      for (let i = 0; i < SPORES.count; i++) world.zombies.push(createZombie(world, 'pod'));
      world.totalThisWave += SPORES.count;
      world.events.push({ type: 'zombieSpawned', zombie: 'pod' });
      return;
    case 'fog':
      world.weather = { kind: 'fog', ttl: FOG.duration, duration: FOG.duration };
      return;
    case 'blizzard':
      world.weather = { kind: 'blizzard', ttl: BLIZZARD.duration, duration: BLIZZARD.duration };
      return;
    case 'blackout':
      world.weather = { kind: 'blackout', ttl: BLACKOUT.duration, duration: BLACKOUT.duration };
      return;
    case 'gasLeak': {
      const x = randomRange(world.rng, HAY_X.min, HAY_X.max);
      const y = randomRange(world.rng, GAS_LEAK.minY, GAS_LEAK.maxY);
      world.areas.push({ kind: 'gas', uid: world.nextUid++, x, y, ttl: GAS_LEAK.duration, duration: GAS_LEAK.duration });
      return;
    }
    case 'engineTest':
      world.areas.push({ kind: 'jet', uid: world.nextUid++, x: ENGINE_TEST.startX, y: randomRange(world.rng, ENGINE_TEST.minY, ENGINE_TEST.maxY), hit: [] });
      return;
  }
}

// Bombardeio, detritos e meteoros: o mesmo mecanismo com números diferentes.
const SHELLS = { bomb: SHELLING, debris: DEBRIS, meteor: METEORS };
type ShellStyle = keyof typeof SHELLS;

/** Bombas (ou detritos, ou meteoros) em pontos marcados, caindo uma depois da outra. */
function dropShells(world: World, style: ShellStyle): void {
  const p = SHELLS[style];
  for (let i = 0; i < p.count; i++) {
    const x = randomRange(world.rng, SHELL_X.min, SHELL_X.max);
    const y = randomRange(world.rng, p.minY, p.maxY);
    world.areas.push({ kind: 'shell', uid: world.nextUid++, x, y, delay: p.warning + i * p.spacing, style });
  }
}

/** Dano de evento num zumbi: fração da vida máxima (menor nos chefes). */
function hitZombie(world: World, zombie: ZombieEntity, ratio: number, bossRatio: number): void {
  damageZombie(world, zombie, zombie.maxHp * (zombie.def.isBoss ? bossRatio : ratio));
}

/** Explosão de evento: fere zumbis e tropas no raio, com fogo e tremor. */
function blast(world: World, x: number, y: number, radius: number, rates: { zombieDamage: number; bossDamage: number; troopDamage: number }): void {
  for (const zombie of zombiesWithin(world, x, y, radius)) hitZombie(world, zombie, rates.zombieDamage, rates.bossDamage);
  for (const troop of world.troops) if (troop.hp > 0 && distance(x, y, troop.x, troop.y) <= radius) damageTroop(world, troop, troop.maxHp * rates.troopDamage);
  world.effects.push({ kind: 'explosion', x, y, radius, ttl: EXPLOSION_TTL, duration: EXPLOSION_TTL });
  world.events.push({ type: 'explosion', big: false });
  world.shake = Math.max(world.shake, EVENT_SHAKE);
}

/** Fardo: desce a coluna e fere uma vez cada zumbi em que passa por cima. */
function rollHay(world: World, hay: Extract<Area, { kind: 'hay' }>, dt: number): void {
  hay.y += HAY.speed * dt;
  for (const zombie of world.zombies) {
    if (!isTargetable(zombie) || hay.hit.includes(zombie.uid)) continue;
    if (Math.abs(zombie.x - hay.x) > HAY.halfWidth || Math.abs(zombie.y - hay.y) > HAY.reach) continue;
    hay.hit.push(zombie.uid);
    hitZombie(world, zombie, HAY.zombieDamage, HAY.bossDamage);
  }
}

/** Carro-bomba: explode quando um zumbi chega perto ou quando o pavio acaba. */
function tickCar(world: World, car: Extract<Area, { kind: 'carBomb' }>, dt: number): void {
  car.fuse -= dt;
  if (car.fuse > 0 && zombiesWithin(world, car.x, car.y, CAR_BOMB.trigger).length === 0) return;
  car.exploded = true;
  blast(world, car.x, car.y, CAR_BOMB.radius, CAR_BOMB);
}

/** Vazamento: a nuvem fere tropas e zumbis dentro dela (fração da vida por segundo). */
function leakGas(world: World, gas: Extract<Area, { kind: 'gas' }>, dt: number): void {
  const step = Math.min(dt, gas.ttl);
  gas.ttl -= dt;
  for (const zombie of zombiesWithin(world, gas.x, gas.y, GAS_LEAK.radius)) {
    damageZombie(world, zombie, zombie.maxHp * (zombie.def.isBoss ? GAS_LEAK.bossRate : GAS_LEAK.rate) * step, false);
  }
  for (const troop of world.troops) {
    if (troop.hp > 0 && distance(gas.x, gas.y, troop.x, troop.y) <= GAS_LEAK.radius) damageTroop(world, troop, troop.maxHp * GAS_LEAK.rate * step, 0, false);
  }
}

/** Teste de motores: o jato atravessa a linha e queima uma vez cada zumbi em que passa. */
function fireJet(world: World, jet: Extract<Area, { kind: 'jet' }>, dt: number): void {
  jet.x += ENGINE_TEST.speed * dt;
  for (const zombie of world.zombies) {
    if (!isTargetable(zombie) || jet.hit.includes(zombie.uid) || zombie.x > jet.x || Math.abs(zombie.y - jet.y) > ENGINE_TEST.halfHeight) continue;
    jet.hit.push(zombie.uid);
    hitZombie(world, zombie, ENGINE_TEST.zombieDamage, ENGINE_TEST.bossDamage);
  }
}

function tickShell(world: World, shell: Extract<Area, { kind: 'shell' }>, dt: number): void {
  shell.delay -= dt;
  const p = SHELLS[shell.style];
  if (shell.delay <= 0) blast(world, shell.x, shell.y, p.radius, p);
}

/** Avança uma área de evento. Retorna false se a área não é de evento. */
export function updateScenarioArea(world: World, area: Area, dt: number): boolean {
  if (area.kind === 'hay') rollHay(world, area, dt);
  else if (area.kind === 'carBomb') tickCar(world, area, dt);
  else if (area.kind === 'shell') tickShell(world, area, dt);
  else if (area.kind === 'gas') leakGas(world, area, dt);
  else if (area.kind === 'jet') fireJet(world, area, dt);
  else return false;
  return true;
}

/** A área de evento acabou (fardo saiu do campo, carro ou bomba explodiu). */
export function scenarioAreaDone(area: Area): boolean {
  if (area.kind === 'hay') return area.y > FIELD.maxY + HAY.reach * 2;
  if (area.kind === 'carBomb') return area.exploded;
  if (area.kind === 'shell') return area.delay <= 0;
  if (area.kind === 'gas') return area.ttl <= 0;
  if (area.kind === 'jet') return area.x > WORLD_WIDTH - ENGINE_TEST.startX;
  return false;
}

export function tickWeather(world: World, dt: number): void {
  if (!world.weather) return;
  world.weather.ttl -= dt;
  if (world.weather.ttl <= 0) world.weather = null;
}

// ---------- Efeitos do clima nos sistemas ----------

/** Alcance da tropa: os atiradores enxergam menos na névoa e no apagão. */
export function troopRange(world: World, troop: TroopEntity): number {
  if (troop.def.role !== 'ranged') return troop.def.range;
  const kind = world.weather?.kind;
  const factor = kind === 'fog' ? FOG.rangeFactor : kind === 'blackout' ? BLACKOUT.rangeFactor : kind === 'dust' ? DUSTSTORM.rangeFactor : 1;
  return troop.def.range * factor;
}

/** Multiplicador de velocidade de todas as unidades (nevasca, tempestade de poeira). */
export const weatherSpeed = (world: World): number => {
  const kind = world.weather?.kind;
  return kind === 'blizzard' ? BLIZZARD.speedFactor : kind === 'dust' ? DUSTSTORM.speedFactor : 1;
};

/** Multiplicador do sangue que enche sozinho (nevasca). */
export const weatherBlood = (world: World): number => (world.weather?.kind === 'blizzard' ? BLIZZARD.bloodFactor : 1);
