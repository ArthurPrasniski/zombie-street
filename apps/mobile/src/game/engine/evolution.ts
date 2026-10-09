import { cardPower } from '@/game/data/balance';
import { EVOLUTIONS, GROUND_FIRE, SLOW_DURATION, SNIPER_PIERCE } from '@/game/data/evolutions';
import { FLAME_TTL, TRACER_TTL } from '@/game/data/constants';
import { damageZombie, healTroop } from '@/game/engine/damage';
import { distance, isTargetable } from '@/game/engine/queries';
import type { TroopEntity, World, ZombieEntity } from '@/game/types';

// Efeitos das cartas evoluídas nas tropas (GDD seção 17.6). As armas especiais ficam em cards.ts.

/** Valor do efeito de evolução da tropa, ou null se ela ainda não evoluiu. */
export const troopEvo = (troop: TroopEntity): number | null => (troop.evo === 0 ? null : EVOLUTIONS[troop.def.id][troop.evo - 1]);

/** Zumbi mais lento por `seconds` (fica com a lentidão mais forte). */
export function slowZombie(zombie: ZombieEntity, ratio: number, seconds: number): void {
  zombie.slow = zombie.slowTimer > 0 ? Math.max(zombie.slow, ratio) : ratio;
  zombie.slowTimer = Math.max(zombie.slowTimer, seconds);
}

/** Zumbi atordoado: não anda nem ataca. */
export function stunZombie(zombie: ZombieEntity, seconds: number): void {
  zombie.stun = Math.max(zombie.stun, seconds);
}

/** Multiplicador de velocidade do zumbi: parado se atordoado, mais lento se mordido. */
export const zombieSpeedFactor = (zombie: ZombieEntity): number => (zombie.stun > 0 ? 0 : zombie.slowTimer > 0 ? 1 - zombie.slow : 1);

/** Intervalo entre ataques (Soldado e Drone evoluídos atiram mais rápido). */
export function attackInterval(troop: TroopEntity): number {
  const evo = troopEvo(troop);
  const faster = troop.def.id === 'soldier' || troop.def.id === 'drone';
  return faster && evo ? troop.def.attackInterval / (1 + evo) : troop.def.attackInterval;
}

/** Tempo em campo (a Torreta evoluída dura mais). */
export function troopLifetime(troop: TroopEntity): number {
  return (troop.def.lifetime ?? 0) + (troop.def.id === 'turret' ? (troopEvo(troop) ?? 0) : 0);
}

/** Zumbis a mais por ataque: Bruno (estouro), Lara (virote) e Cabo Laser (raio). */
export function extraTargets(troop: TroopEntity): number {
  const id = troop.def.id;
  return id === 'shotgun' || id === 'crossbow' || id === 'laser' ? (troopEvo(troop) ?? 0) : 0;
}

/** Pulos do raio da Torre Tesla (mais na evolução). */
export const chainJumps = (troop: TroopEntity): number => (troop.def.chain?.jumps ?? 0) + (troop.def.id === 'tesla' ? (troopEvo(troop) ?? 0) : 0);

/** Empurrão do Exotraje Titã (mais na evolução). */
export const knockbackOf = (troop: TroopEntity): number => (troop.def.knockback ?? 0) + (troop.def.id === 'titan' ? (troopEvo(troop) ?? 0) : 0);

/** Mira: zumbis logo atrás do alvo, na linha do tiro. */
function behind(world: World, troop: TroopEntity, target: ZombieEntity, count: number): ZombieEntity[] {
  const len = distance(troop.x, troop.y, target.x, target.y) || 1;
  const ux = (target.x - troop.x) / len;
  const uy = (target.y - troop.y) / len;
  return world.zombies
    .filter((z) => {
      if (z === target || !isTargetable(z)) return false;
      const along = (z.x - target.x) * ux + (z.y - target.y) * uy;
      const across = Math.abs((z.x - target.x) * uy - (z.y - target.y) * ux);
      return along > 0 && along <= SNIPER_PIERCE.depth && across <= SNIPER_PIERCE.width;
    })
    .sort((a, b) => distance(target.x, target.y, a.x, a.y) - distance(target.x, target.y, b.x, b.y))
    .slice(0, count);
}

/** Depois do golpe: o efeito extra de cada tropa evoluída. */
export function afterStrike(world: World, troop: TroopEntity, target: ZombieEntity): void {
  const evo = troopEvo(troop);
  troop.shots++;
  if (evo === null) return;
  switch (troop.def.id) {
    case 'sniper':
      for (const z of behind(world, troop, target, evo)) damageZombie(world, z, troop.damage, true, 'firearm');
      return;
    case 'sheriff':
      if (troop.shots % evo !== 0 || !isTargetable(target)) return;
      world.effects.push({ kind: 'tracer', fromX: troop.x, fromY: troop.y, toX: target.x, toY: target.y, ttl: TRACER_TTL });
      damageZombie(world, target, troop.damage, true, 'firearm');
      return;
    case 'chainsaw':
      healTroop(troop, troop.damage * evo);
      return;
    case 'dog':
      slowZombie(target, evo, SLOW_DURATION);
      return;
    case 'firefighter':
      groundFire(world, target.x, target.y, troop.damage, evo);
      return;
  }
}

/** Bombeiro: fogo no chão onde acertou (só um por lugar, para não empilhar a cada jato). */
function groundFire(world: World, x: number, y: number, damage: number, seconds: number): void {
  if (world.areas.some((a) => a.kind === 'fire' && distance(a.x, a.y, x, y) < GROUND_FIRE.radius)) return;
  const dps = damage * GROUND_FIRE.dpsPerDamage;
  world.areas.push({ kind: 'fire', uid: world.nextUid++, x, y, radius: GROUND_FIRE.radius, dps, ttl: Math.max(seconds, FLAME_TTL), duration: seconds });
}

/** Barricada evoluída: devolve dano a quem bate nela. */
export function thorns(world: World, troop: TroopEntity, attacker: ZombieEntity): void {
  const evo = troopEvo(troop);
  if (troop.def.id === 'barricade' && evo) damageZombie(world, attacker, evo * cardPower(troop.level));
}

/** Médica evoluída: cada pulso também cura a base. Devolve true se curou. */
export function healBase(world: World, medic: TroopEntity): boolean {
  const evo = troopEvo(medic);
  if (medic.def.id !== 'medic' || !evo || world.base.hp <= 0 || world.base.hp >= world.base.maxHp) return false;
  world.base.hp = Math.min(world.base.maxHp, world.base.hp + evo * cardPower(medic.level));
  return true;
}
