import { CORPSE_TTL, DAMAGE_TEXT_HEIGHT, DAMAGE_TEXT_TTL, EXPLOSION_TTL, HIT_FLASH_DURATION } from '@/game/data/constants';
import { distance, isTargetable } from '@/game/engine/queries';
import { createZombie } from '@/game/engine/world';
import type { DamageKind, TroopEntity, World, ZombieEntity } from '@/game/types';

/**
 * Dano em zumbi (com flash e número de dano). Golpes diretos perdem a armadura do zumbi
 * (mínimo 1); o fogo contínuo (flash = false) passa direto. Ao morrer: corpo, recompensa,
 * zombieKilled e, nos que explodem, dano nas tropas por perto.
 */
export function damageZombie(world: World, zombie: ZombieEntity, amount: number, flash = true, kind: DamageKind = 'other'): void {
  if (!isTargetable(zombie) || amount <= 0) return;
  // Tipo do golpe (Androide: tiro pela metade, elétrico em dobro)
  amount *= zombie.def.resist?.[kind] ?? 1;
  if (flash) amount *= shieldFactor(world, zombie);
  if (flash && zombie.def.armor) amount = Math.max(1, amount - zombie.def.armor);
  zombie.hp -= throughSuit(zombie, amount);
  if (flash) {
    // Golpe direto: pisca e mostra o número (o fogo, contínuo, não).
    zombie.hitFlash = HIT_FLASH_DURATION;
    const head = DAMAGE_TEXT_HEIGHT * (zombie.def.scale ?? 1);
    world.effects.push({ kind: 'damageText', x: zombie.x, y: zombie.y - head, value: Math.max(1, Math.round(amount)), ttl: DAMAGE_TEXT_TTL });
  }
  if (zombie.hp > 0) return;
  zombie.hp = 0;
  zombie.state = 'dead';
  world.effects.push({ kind: 'corpse', unit: zombie.def.id, x: zombie.x, y: zombie.y, dirX: zombie.dirX, dirY: zombie.dirY, ttl: CORPSE_TTL });
  world.pendingCash += zombie.reward;
  world.stageCash += zombie.reward;
  world.killedThisWave++;
  world.events.push({ type: 'zombieKilled', zombie: zombie.def.id, reward: zombie.reward });
  splitApart(world, zombie);
  const burst = zombie.def.burst;
  if (!burst) return;
  for (const troop of world.troops) if (distance(zombie.x, zombie.y, troop.x, troop.y) <= burst.radius) damageTroop(world, troop, burst.damage);
  world.effects.push({ kind: 'explosion', x: zombie.x, y: zombie.y, radius: burst.radius, ttl: EXPLOSION_TTL, duration: EXPLOSION_TTL });
  world.events.push({ type: 'explosion', big: false });
}

/** Astronauta: o traje segura o golpe; trincado, o zumbi leva o dano multiplicado. Devolve o que chega na vida. */
function throughSuit(zombie: ZombieEntity, amount: number): number {
  const suit = zombie.def.suit;
  if (!suit) return amount;
  if (zombie.suit <= 0) return amount * suit.cracked;
  const absorbed = Math.min(zombie.suit, amount);
  zombie.suit -= absorbed;
  return (amount - absorbed) * suit.cracked;
}

// Pedaços do Divisor saem lado a lado, um pouco abaixo de onde ele caiu.
const SPLIT_SPREAD = 22;
const SPLIT_DROP = 6;

/** Porta-escudo: multiplicador do golpe direto pelo escudo mais forte por perto (ele não se protege). */
function shieldFactor(world: World, zombie: ZombieEntity): number {
  let reduction = 0;
  for (const other of world.zombies) {
    const aura = other.def.aura;
    if (!aura || other === zombie || !isTargetable(other)) continue;
    if (distance(zombie.x, zombie.y, other.x, other.y) <= aura.radius) reduction = Math.max(reduction, aura.reduction);
  }
  return 1 - reduction;
}

/** Divisor: ao morrer, vira `count` zumbis menores, que entram na conta da onda. */
function splitApart(world: World, zombie: ZombieEntity): void {
  const split = zombie.def.split;
  if (!split) return;
  for (let i = 0; i < split.count; i++) {
    const piece = createZombie(world, split.into);
    const offset = split.count > 1 ? (i / (split.count - 1) - 0.5) * 2 * SPLIT_SPREAD : 0;
    piece.x = zombie.x + offset;
    piece.y = zombie.y + SPLIT_DROP;
    world.zombies.push(piece);
  }
  world.events.push({ type: 'zombieSpawned', zombie: split.into });
  world.totalThisWave += split.count;
}

/** Dano em tropa (`chill`: segundos congelada; `flash`: pisca). Ao cair: corpo e troopDown (sai no cleanup). */
export function damageTroop(world: World, troop: TroopEntity, amount: number, chill = 0, flash = true): void {
  if (troop.hp <= 0) return;
  troop.hp -= amount;
  troop.chill = Math.max(troop.chill, chill);
  // Dano contínuo (aura tóxica, gás) não pisca
  if (flash) troop.hitFlash = HIT_FLASH_DURATION;
  if (troop.hp > 0) return;
  troop.hp = 0;
  troop.target = null;
  world.effects.push({ kind: 'corpse', unit: troop.def.id, x: troop.x, y: troop.y, dirX: troop.dirX, dirY: troop.dirY, ttl: CORPSE_TTL });
  world.events.push({ type: 'troopDown', troop: troop.def.id });
}

export function damageBase(world: World, amount: number): void {
  if (world.base.hp <= 0) return;
  world.base.hp = Math.max(0, world.base.hp - amount);
  world.events.push({ type: 'baseHit' });
}

export function healTroop(troop: TroopEntity, amount: number): void {
  if (troop.hp <= 0) return;
  troop.hp = Math.min(troop.maxHp, troop.hp + amount);
}
