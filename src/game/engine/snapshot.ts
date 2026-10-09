import type { RenderSnapshot, World } from '@/game/types';

export const EMPTY_SNAPSHOT: RenderSnapshot = {
  base: { hpRatio: 1, sinceShot: Number.POSITIVE_INFINITY },
  troops: [],
  zombies: [],
  effects: [],
  areas: [],
  blood: 0,
  shake: 0,
  time: 0,
  weather: null,
};

const ratio = (hp: number, maxHp: number) => (maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0);

/**
 * Cópia imutável do mundo para o render. Nunca passe entidades do World direto:
 * o Reanimated congela objetos enviados ao thread de UI.
 */
export function createSnapshot(world: World): RenderSnapshot {
  return {
    base: { hpRatio: ratio(world.base.hp, world.base.maxHp), sinceShot: world.base.sinceShot },
    troops: world.troops.map((t) => ({
      kind: t.def.id,
      uid: t.uid,
      x: t.x,
      y: t.y,
      hpRatio: ratio(t.hp, t.maxHp),
      deploying: t.deployTimer > 0,
      moving: t.moving,
      travelled: t.travelled,
      aiming: t.target !== null && t.target.state !== 'dead',
      sinceAttack: t.sinceAttack,
      untilAttack: Math.max(0, t.cooldown),
      dirX: t.dirX,
      dirY: t.dirY,
      flash: t.hitFlash > 0,
      chilled: t.chill > 0,
      evo: t.evo,
    })),
    zombies: world.zombies.map((z) => ({
      kind: z.def.id,
      uid: z.uid,
      x: z.x,
      y: z.y,
      hpRatio: ratio(z.hp, z.maxHp),
      flash: z.hitFlash > 0,
      scale: z.def.scale ?? 1,
      attacking: z.state === 'attacking',
      attackProgress: 1 - Math.max(0, z.cooldown) / z.def.attackInterval,
      travelled: z.travelled,
      dirX: z.dirX,
      dirY: z.dirY,
      burrowed: z.burrowed,
      aura: z.def.aura?.radius ?? 0,
      slowed: z.slowTimer > 0,
      stunned: z.stun > 0,
      suitRatio: z.maxSuit > 0 ? z.suit / z.maxSuit : -1,
      toxic: z.def.toxic?.radius ?? 0,
      leaper: z.def.leaper === true,
    })),
    effects: world.effects.map((e) => ({ ...e })),
    areas: world.areas.map((a) => (a.kind === 'hay' || a.kind === 'jet' ? { ...a, hit: [] } : { ...a })),
    blood: world.blood,
    shake: world.shake,
    time: world.time,
    weather: world.weather ? { ...world.weather } : null,
  };
}
