import { BASE, CHILL, CORPSE_TTL, FIELD, SPIT_HEIGHT, SPIT_TTL, TRACER_TTL } from '@/game/data/constants';
import { healPulse, strike } from '@/game/engine/attacks';
import { damageBase, damageTroop, damageZombie } from '@/game/engine/damage';
import { baseStopY, distance, isActive, isAliveTroop, isAliveZombie, zombieReach } from '@/game/engine/queries';
import { attackInterval, thorns, troopLifetime } from '@/game/engine/evolution';
import { troopRange } from '@/game/engine/scenario';
import { blockedByField, hitField } from '@/game/engine/spells';
import { createZombie } from '@/game/engine/world';
import type { TroopEntity, World, ZombieEntity } from '@/game/types';

// Folga para arredondamentos de posição ao checar alcance.
const SLACK = 1;

export function combat(world: World, dt: number): void {
  for (const troop of world.troops) troop.sinceAttack += dt;
  world.base.sinceShot += dt;
  if (!isActive(world)) {
    // As armas terminam de recarregar (e as animações de tiro acabam) fora da partida.
    for (const troop of world.troops) troop.cooldown = Math.max(0, troop.cooldown - dt);
    return;
  }
  for (const troop of world.troops) {
    troop.chill = Math.max(0, troop.chill - dt);
    expire(world, troop, dt);
    troopAttack(world, troop, dt);
  }
  baseAttack(world, dt);
  // Laço por índice: as larvas novas entram no fim da lista
  for (let i = 0; i < world.zombies.length; i++) {
    const zombie = world.zombies[i];
    zombieAttack(world, zombie, dt);
    toxicAura(world, zombie, dt);
    brood(world, zombie, dt);
  }
}

// Larvas saem espalhadas em volta de quem as solta.
const BROOD_SPREAD = 20;

/** Casulo e Rainha: soltam larvas de tempos em tempos enquanto vivem (entram na conta da onda). */
function brood(world: World, zombie: ZombieEntity, dt: number): void {
  const spawner = zombie.def.spawner;
  if (!spawner || zombie.state === 'dead' || zombie.burrowed) return;
  zombie.spawnTimer -= dt;
  if (zombie.spawnTimer > 0) return;
  zombie.spawnTimer += spawner.every;
  for (let i = 0; i < spawner.count; i++) {
    const larva = createZombie(world, spawner.into);
    larva.x = Math.max(FIELD.minX, Math.min(FIELD.maxX, zombie.x + (i - (spawner.count - 1) / 2) * BROOD_SPREAD * 2));
    larva.y = zombie.y + BROOD_SPREAD;
    world.zombies.push(larva);
  }
  world.totalThisWave += spawner.count;
  world.events.push({ type: 'zombieSpawned', zombie: spawner.into });
}

/** Mutante e Diretor: ferem sem parar as tropas por perto (o dano sobe com a fase, como o golpe). */
function toxicAura(world: World, zombie: ZombieEntity, dt: number): void {
  const toxic = zombie.def.toxic;
  if (!toxic || zombie.state === 'dead' || zombie.burrowed) return;
  const dps = toxic.dps * (zombie.damage / zombie.def.damage);
  for (const troop of world.troops) {
    if (troop.hp > 0 && distance(zombie.x, zombie.y, troop.x, troop.y) <= toxic.radius) damageTroop(world, troop, dps * dt, 0, false);
  }
}

/** Torreta: some sozinha no fim do tempo de vida (vira escombros, sem contar como derrota). */
function expire(world: World, troop: TroopEntity, dt: number): void {
  if (troop.hp <= 0 || troop.deployTimer > 0) return;
  troop.age += dt;
  if (!troop.def.lifetime || troop.age < troopLifetime(troop)) return;
  troop.hp = 0;
  troop.target = null;
  world.effects.push({ kind: 'corpse', unit: troop.def.id, x: troop.x, y: troop.y, dirX: troop.dirX, dirY: troop.dirY, ttl: CORPSE_TTL });
}

function troopAttack(world: World, troop: TroopEntity, dt: number): void {
  if (troop.hp <= 0 || troop.deployTimer > 0 || troop.def.role === 'structure') return;
  troop.cooldown -= dt;
  if (troop.cooldown > 0) return;
  // Congelada: o intervalo entre ataques fica maior
  const interval = attackInterval(troop) * (troop.chill > 0 ? CHILL.attackSlow : 1);
  if (troop.def.role === 'support') {
    troop.cooldown = healPulse(world, troop) ? interval : 0;
    if (troop.cooldown > 0) troop.sinceAttack = 0;
    return;
  }
  const target = troop.target;
  if (!isAliveZombie(target) || distance(troop.x, troop.y, target.x, target.y) > troopRange(world, troop) + SLACK) {
    troop.cooldown = 0;
    return;
  }
  troop.cooldown += interval;
  troop.sinceAttack = 0;
  strike(world, troop, target);
}

function baseAttack(world: World, dt: number): void {
  const base = world.base;
  if (base.hp <= 0) return;
  base.cooldown -= dt;
  if (base.cooldown > 0) return;
  if (!isAliveZombie(base.target)) {
    base.cooldown = 0;
    return;
  }
  base.cooldown += BASE.attackInterval;
  base.sinceShot = 0;
  world.effects.push({ kind: 'tracer', fromX: BASE.gunX, fromY: BASE.gunY, toX: base.target.x, toY: base.target.y, ttl: TRACER_TTL });
  damageZombie(world, base.target, base.damage, true, 'firearm');
  world.events.push({ type: 'attack', source: 'base' });
}

/** Cuspidor: o ácido voa do zumbi até o alvo (o dano entra na hora, como os tiros). */
function spit(world: World, zombie: ZombieEntity, toX: number, toY: number): void {
  if (!zombie.def.ranged) return;
  world.effects.push({ kind: 'spit', fromX: zombie.x, fromY: zombie.y - SPIT_HEIGHT, toX, toY, ttl: SPIT_TTL });
}

function zombieAttack(world: World, zombie: ZombieEntity, dt: number): void {
  // Atordoado (Granada evoluída) não ataca
  if (zombie.state !== 'attacking' || zombie.stun > 0) return;
  zombie.cooldown -= dt;
  if (zombie.cooldown > 0) return;
  const target = zombie.target;
  if (target) {
    if (!isAliveTroop(target) || distance(zombie.x, zombie.y, target.x, target.y) > zombieReach(zombie.def) + SLACK) {
      zombie.cooldown = 0;
      return;
    }
    zombie.cooldown += zombie.def.attackInterval;
    spit(world, zombie, target.x, target.y - SPIT_HEIGHT / 2);
    damageTroop(world, target, zombie.damage, zombie.def.chill ?? 0);
    thorns(world, target, zombie);
    return;
  }
  const field = zombie.def.leaper ? null : blockedByField(world, zombie);
  if (field) {
    zombie.cooldown += zombie.def.attackInterval;
    hitField(field, zombie.damage);
    return;
  }
  if (zombie.y < baseStopY(zombie.def) - SLACK) {
    zombie.cooldown = 0;
    return;
  }
  zombie.cooldown += zombie.def.attackInterval;
  spit(world, zombie, zombie.x, BASE.frontY);
  damageBase(world, zombie.damage);
}
