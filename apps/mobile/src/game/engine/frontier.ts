import { type FrontierWorld, MUTATION, THREAT } from '@/game/data/frontier';
import { worldDef, worldOf } from '@/game/data/worlds';
import type { World, ZombieDef } from '@/game/types';

// Fronteira infinita (GDD seção 18.5): ameaça da horda e mutação do chefe valem para cada zumbi
// criado na fase. Fora da Fronteira, nada muda.

/** Planeta da fase atual, ou null fora da Fronteira (e na Sobrevivência). */
export function frontierOf(world: World): FrontierWorld | null {
  if (world.mode !== 'stage') return null;
  const def = worldDef(worldOf(world.stage.index));
  return 'threat' in def ? def : null;
}

/** Definição do zumbi com a ameaça do planeta (Rápida, Blindada) e, no chefe, a mutação. */
export function frontierZombie(world: World, def: ZombieDef): ZombieDef {
  const planet = frontierOf(world);
  if (!planet) return def;
  let out = def;
  if (planet.threat === 'fast') out = { ...out, speed: out.speed * (1 + THREAT.fastSpeed * planet.tier) };
  if (planet.threat === 'armored') out = { ...out, armor: (out.armor ?? 0) + THREAT.armoredArmor * planet.tier };
  if (!out.isBoss) return out;
  switch (planet.mutation) {
    case 'giant':
      return { ...out, hp: out.hp * MUTATION.giantHp, scale: (out.scale ?? 1) * MUTATION.giantScale };
    case 'armored':
      return { ...out, armor: (out.armor ?? 0) + MUTATION.armoredArmor };
    case 'explosive':
      return { ...out, burst: { radius: MUTATION.explosiveRadius, damage: MUTATION.explosiveDamage } };
    case 'regen':
      return { ...out, regen: MUTATION.regenPerSecond };
  }
}
