import { cardPower } from '@/game/data/balance';
import { FIELD, FLAME_TTL, HEAL_TTL, TRACER_TTL, ZAP_TTL } from '@/game/data/constants';
import { damageZombie, healTroop } from '@/game/engine/damage';
import { distance, faceTowards, isTargetable } from '@/game/engine/queries';
import { afterStrike, chainJumps, extraTargets, healBase, knockbackOf } from '@/game/engine/evolution';
import { troopRange } from '@/game/engine/scenario';
import type { DamageKind, TroopEntity, World, ZombieEntity } from '@/game/types';

/** Escopeta e lança-chamas: até `count` zumbis vivos perto do alvo, do mais perto para o mais longe. */
function splashTargets(world: World, target: ZombieEntity, count: number, radius: number): ZombieEntity[] {
  return world.zombies
    .filter((z) => z !== target && isTargetable(z) && distance(z.x, z.y, target.x, target.y) <= radius)
    .sort((a, b) => distance(a.x, a.y, target.x, target.y) - distance(b.x, b.y, target.x, target.y))
    .slice(0, count);
}

/** Besta: zumbis numa faixa ao longo da linha do tiro, até o alcance, do mais perto ao mais longe. */
function pierceTargets(world: World, troop: TroopEntity, target: ZombieEntity, width: number, max: number): ZombieEntity[] {
  const len = distance(troop.x, troop.y, target.x, target.y) || 1;
  const ux = (target.x - troop.x) / len;
  const uy = (target.y - troop.y) / len;
  return world.zombies
    .filter((z) => {
      if (!isTargetable(z)) return false;
      const along = (z.x - troop.x) * ux + (z.y - troop.y) * uy;
      const across = Math.abs((z.x - troop.x) * uy - (z.y - troop.y) * ux);
      return along >= 0 && along <= troopRange(world, troop) && across <= width;
    })
    .sort((a, b) => distance(troop.x, troop.y, a.x, a.y) - distance(troop.x, troop.y, b.x, b.y))
    .slice(0, max);
}

/**
 * Torre Tesla: o raio acerta o alvo e pula para o zumbi mais perto ainda não atingido, perdendo
 * força a cada pulo. O efeito liga a torre e todos os atingidos.
 */
function chainLightning(world: World, troop: TroopEntity, target: ZombieEntity, chain: { radius: number; falloff: number }): void {
  const hit: ZombieEntity[] = [target];
  let damage = troop.damage;
  damageZombie(world, target, damage, true, 'electric');
  for (let i = 0; i < chainJumps(troop); i++) {
    const last = hit[hit.length - 1];
    const next = world.zombies
      .filter((z) => isTargetable(z) && !hit.includes(z) && distance(last.x, last.y, z.x, z.y) <= chain.radius)
      .sort((a, b) => distance(last.x, last.y, a.x, a.y) - distance(last.x, last.y, b.x, b.y))[0];
    if (!next) break;
    damage *= chain.falloff;
    damageZombie(world, next, damage, true, 'electric');
    hit.push(next);
  }
  world.effects.push({ kind: 'zap', points: [troop.x, troop.y - ZAP_HEIGHT, ...hit.flatMap((z) => [z.x, z.y - ZAP_CHEST])], ttl: ZAP_TTL });
}

// Alturas (acima dos pés) de onde sai e onde chega o raio da Torre Tesla.
const ZAP_HEIGHT = 58;
const ZAP_CHEST = 26;

/** Exotraje Titã: empurra o zumbi para longe dele (os chefes não saem do lugar). */
function knockBack(troop: TroopEntity, target: ZombieEntity, amount: number): void {
  if (target.def.isBoss || target.state === 'dead') return;
  const d = distance(troop.x, troop.y, target.x, target.y) || 1;
  target.x = Math.max(FIELD.minX, Math.min(FIELD.maxX, target.x + ((target.x - troop.x) / d) * amount));
  target.y = Math.max(FIELD.minY, Math.min(FIELD.maxY, target.y + ((target.y - troop.y) / d) * amount));
}

/** Tipo do golpe da tropa: arma de fogo, elétrico (Torre Tesla) ou o resto. */
export const damageKind = (troop: TroopEntity): DamageKind => (troop.def.electric ? 'electric' : troop.def.firearm ? 'firearm' : 'other');

/** Ataque de uma tropa que já tem alvo no alcance (tiro, chamas, virote; com área ou atravessando). */
export function strike(world: World, troop: TroopEntity, target: ZombieEntity): void {
  const def = troop.def;
  faceTowards(troop, target.x, target.y);
  const shot = { fromX: troop.x, fromY: troop.y, toX: target.x, toY: target.y };
  if (def.fx === 'flame') world.effects.push({ kind: 'flame', ...shot, ttl: FLAME_TTL });
  else if (def.fx === 'bolt') world.effects.push({ kind: 'tracer', ...shot, ttl: TRACER_TTL * 2, style: 'bolt' });
  else if (def.fx === 'laser') world.effects.push({ kind: 'tracer', ...shot, ttl: TRACER_TTL * 1.5, style: 'laser' });
  else if (def.firearm) world.effects.push({ kind: 'tracer', ...shot, ttl: TRACER_TTL });
  const more = extraTargets(troop);
  const kind = damageKind(troop);
  if (def.chain) {
    chainLightning(world, troop, target, def.chain);
  } else if (def.pierce) {
    for (const z of pierceTargets(world, troop, target, def.pierce.width, def.pierce.max + more)) damageZombie(world, z, troop.damage, true, kind);
  } else {
    const splash = def.splash ? splashTargets(world, target, def.splash.targets + more, def.splash.radius) : [];
    damageZombie(world, target, troop.damage, true, kind);
    for (const extra of splash) damageZombie(world, extra, troop.damage, true, kind);
  }
  if (knockbackOf(troop) > 0) knockBack(troop, target, knockbackOf(troop));
  afterStrike(world, troop, target);
  world.events.push({ type: 'attack', source: def.id });
}

/** Médica: cura as tropas feridas no alcance (ela também). Devolve false se ninguém precisava. */
export function healPulse(world: World, medic: TroopEntity): boolean {
  const amount = (medic.def.heal ?? 0) * cardPower(medic.level);
  let healed = false;
  for (const troop of world.troops) {
    if (troop.hp <= 0 || troop.hp >= troop.maxHp || distance(medic.x, medic.y, troop.x, troop.y) > medic.def.range) continue;
    healTroop(troop, amount);
    world.effects.push({ kind: 'heal', x: troop.x, y: troop.y, ttl: HEAL_TTL });
    healed = true;
  }
  // Evoluída, também cura a base
  if (healBase(world, medic)) healed = true;
  if (healed) world.events.push({ type: 'attack', source: medic.def.id });
  return healed;
}
