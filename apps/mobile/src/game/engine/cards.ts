import { cardPower } from '@/game/data/balance';
import { evolutionValue } from '@/game/data/evolutions';
import { CARDS, isTroop } from '@/game/data/cards';
import { CRYO_SLOW, DEPLOY_ZONE, EXPLOSION_TTL, FROST_TTL, HEAL_TTL, MAX_TROOPS, SMOKE_TTL, SPELL_ZONE } from '@/game/data/constants';
import { damageZombie, healTroop } from '@/game/engine/damage';
import { distance, isActive, zombiesWithin } from '@/game/engine/queries';
import { slowZombie, stunZombie } from '@/game/engine/evolution';
import { createTroop } from '@/game/engine/world';
import type { CardDef, SpellDef, World } from '@/game/types';

const inside = (zone: typeof DEPLOY_ZONE, x: number, y: number) => x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY;

/** Tropas só na zona de mobilização; armas especiais em qualquer ponto do chão (GDD seção 3). */
export function isValidDrop(card: CardDef, x: number, y: number): boolean {
  return inside(isTroop(card) ? DEPLOY_ZONE : SPELL_ZONE, x, y);
}

export function canAfford(world: World, slot: number): boolean {
  const id = world.hand[slot];
  return id !== undefined && world.blood >= CARDS[id].cost;
}

/** Campo cheio: com MAX_TROOPS tropas vivas, só armas especiais podem ser jogadas. */
export const fieldFull = (world: World): boolean => world.troops.filter((t) => t.hp > 0).length >= MAX_TROOPS;

/**
 * Joga a carta do espaço `slot` da mão em (x, y). Desconta o sangue, aplica o efeito e
 * gira a mão: a carta vai para o fim da fila e a próxima ocupa o mesmo espaço.
 */
export function playCard(world: World, slot: number, x: number, y: number): boolean {
  if (!isActive(world) || !canAfford(world, slot)) return false;
  const id = world.hand[slot];
  const card = CARDS[id];
  if (!isValidDrop(card, x, y) || (isTroop(card) && fieldFull(world))) return false;

  world.blood -= card.cost;
  const level = world.cardLevels[id];
  if (isTroop(card)) {
    world.troops.push(createTroop(world, card, level, x, y));
    world.effects.push({ kind: 'smoke', x, y, ttl: SMOKE_TTL });
  } else {
    castSpell(world, card, level, x, y);
  }
  const next = world.queue.shift();
  if (next) world.hand[slot] = next;
  world.queue.push(id);
  world.events.push({ type: 'cardPlayed', card: id });
  return true;
}

/** Arma especial no nível dado; evoluída, ganha o efeito extra (GDD seção 17.6). */
function castSpell(world: World, spell: SpellDef, level: number, x: number, y: number): void {
  const power = cardPower(level);
  const evo = evolutionValue(spell.id, level);
  switch (spell.id) {
    case 'grenade':
      for (const zombie of zombiesWithin(world, x, y, spell.radius)) {
        damageZombie(world, zombie, (spell.damage ?? 0) * power);
        if (evo) stunZombie(zombie, evo);
      }
      world.effects.push({ kind: 'explosion', x, y, radius: spell.radius, ttl: EXPLOSION_TTL, duration: EXPLOSION_TTL });
      world.events.push({ type: 'explosion', big: false });
      return;
    case 'medkit':
      for (const troop of world.troops) {
        if (troop.hp <= 0 || distance(x, y, troop.x, troop.y) > spell.radius) continue;
        healTroop(troop, troop.maxHp * (spell.heal ?? 0) * power);
        world.effects.push({ kind: 'heal', x: troop.x, y: troop.y, ttl: HEAL_TTL });
      }
      world.effects.push({ kind: 'heal', x, y, ttl: HEAL_TTL });
      if (evo && world.base.hp > 0) world.base.hp = Math.min(world.base.maxHp, world.base.hp + world.base.maxHp * evo);
      return;
    case 'molotov': {
      const duration = (spell.duration ?? 0) + (evo ?? 0);
      world.areas.push({ kind: 'fire', uid: world.nextUid++, x, y, radius: spell.radius, dps: (spell.dps ?? 0) * power, ttl: duration, duration });
      return;
    }
    case 'airstrike': {
      const delay = evo ?? spell.delay ?? 0;
      world.areas.push({ kind: 'airstrike', uid: world.nextUid++, x, y, radius: spell.radius, damage: (spell.damage ?? 0) * power, delay, total: delay });
      return;
    }
    case 'landmine': {
      const radius = spell.radius * (1 + (evo ?? 0));
      world.areas.push({ kind: 'mine', uid: world.nextUid++, x, y, trigger: spell.trigger ?? 0, radius, damage: (spell.damage ?? 0) * power, exploded: false });
      return;
    }
    // Seção 18.4: armas especiais do Ato 3
    case 'cryo': {
      const freeze = (spell.freeze ?? 0) + (evo ?? 0);
      for (const zombie of zombiesWithin(world, x, y, spell.radius)) {
        damageZombie(world, zombie, (spell.damage ?? 0) * power);
        stunZombie(zombie, freeze);
        slowZombie(zombie, CRYO_SLOW, freeze + (spell.duration ?? 0));
      }
      world.effects.push({ kind: 'frost', x, y, radius: spell.radius, ttl: FROST_TTL });
      return;
    }
    case 'forcefield': {
      const hp = (spell.wallHp ?? 0) * power * (1 + (evo ?? 0));
      const duration = spell.duration ?? 0;
      world.areas.push({ kind: 'forcefield', uid: world.nextUid++, x, y, width: spell.width ?? 0, hp, maxHp: hp, ttl: duration, duration });
      return;
    }
    case 'blackhole': {
      const duration = spell.duration ?? 0;
      const radius = spell.radius * (1 + (evo ?? 0));
      world.areas.push({ kind: 'blackhole', uid: world.nextUid++, x, y, radius, pull: spell.pull ?? 0, damage: (spell.damage ?? 0) * power, ttl: duration, duration });
      return;
    }
    case 'orbital': {
      const delay = evo ?? spell.delay ?? 0;
      world.areas.push({ kind: 'orbital', uid: world.nextUid++, x, y, width: spell.width ?? 0, damage: (spell.damage ?? 0) * power, delay, total: delay });
      return;
    }
  }
}
