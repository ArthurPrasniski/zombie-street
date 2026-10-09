import { CARD_UNLOCKS, TROOPS } from '@/game/data/cards';
import { EVOLUTIONS } from '@/game/data/evolutions';
import { strike } from '@/game/engine/attacks';
import { attackInterval, chainJumps, knockbackOf } from '@/game/engine/evolution';
import { nearestTroop } from '@/game/engine/queries';
import { generateStage } from '@/game/data/stages';
import { createWorld } from '@/game/engine/world';
import { migrateProgress } from '@/state/migrate';
import { initialProgress, isCardUnlocked } from '@/state/progress';
import type { CardLevels } from '@/game/types';

import { addTroop, addZombie, fightingWorld } from './helpers';

const lost = (z: { hp: number; maxHp: number }) => z.maxHp - z.hp;
const still = (world: ReturnType<typeof fightingWorld>, id: 'walker' | 'android' | 'brute', x: number, y: number) => {
  const z = addZombie(world, id, x, y);
  z.def = { ...z.def, speed: 0 };
  return z;
};

describe('armas do Ato 2 (seção 18.4)', () => {
  it('liberam nas fases 53, 58, 65 e 74', () => {
    expect([CARD_UNLOCKS.drone, CARD_UNLOCKS.tesla, CARD_UNLOCKS.laser, CARD_UNLOCKS.titan]).toEqual([53, 58, 65, 74]);
    expect(isCardUnlocked({ ...initialProgress(), highestCleared: 52 }, 'drone')).toBe(false);
    expect(isCardUnlocked({ ...initialProgress(), highestCleared: 53 }, 'drone')).toBe(true);
  });

  it('Drone: só quem ataca de longe o alcança', () => {
    const world = fightingWorld();
    addTroop(world, 'drone', 300, 600);
    expect(nearestTroop(world, 300, 560, 120)).toBeNull();
    expect(nearestTroop(world, 300, 560, 120, false, true)?.def.id).toBe('drone');
  });

  it('Torre Tesla: o raio pula para até 3 zumbis, mais fraco a cada pulo; robôs levam o dobro', () => {
    const world = fightingWorld();
    const tesla = addTroop(world, 'tesla', 300, 700);
    const first = still(world, 'walker', 300, 520);
    const chain = [still(world, 'walker', 360, 520), still(world, 'android', 420, 520), still(world, 'walker', 480, 520)];
    const far = still(world, 'walker', 100, 200);
    strike(world, tesla, first);
    const { falloff } = TROOPS.tesla.chain!;
    expect(lost(first)).toBeCloseTo(tesla.damage);
    expect(lost(chain[0])).toBeCloseTo(tesla.damage * falloff);
    expect(lost(chain[1])).toBeCloseTo(tesla.damage * falloff ** 2 * 2);
    expect(lost(chain[2])).toBeCloseTo(tesla.damage * falloff ** 3);
    expect(far.hp).toBe(far.maxHp);
    expect(world.effects.some((e) => e.kind === 'zap' && e.points.length === 10)).toBe(true);
  });

  it('Cabo Laser: o raio atravessa a fila e não é tiro (o Androide leva tudo)', () => {
    const world = fightingWorld();
    const laser = addTroop(world, 'laser', 300, 700);
    const line = Array.from({ length: 7 }, (_, i) => still(world, 'android', 300, 600 - i * 30));
    strike(world, laser, line[0]);
    expect(line.filter((z) => lost(z) > 0)).toHaveLength(TROOPS.laser.pierce!.max);
    expect(lost(line[0])).toBeCloseTo(laser.damage);
    expect(world.effects.some((e) => e.kind === 'tracer' && e.style === 'laser')).toBe(true);
  });

  it('Exotraje Titã: empurra o zumbi para trás; o chefe não sai do lugar', () => {
    const world = fightingWorld();
    const titan = addTroop(world, 'titan', 300, 600);
    const zombie = still(world, 'walker', 300, 560);
    strike(world, titan, zombie);
    expect(zombie.y).toBeCloseTo(560 - TROOPS.titan.knockback!);
    const boss = still(world, 'brute', 300, 560);
    strike(world, titan, boss);
    expect(boss.y).toBe(560);
  });

  it('evoluções: Drone mais rápido, Tesla pula mais, Laser atravessa mais, Titã empurra mais', () => {
    const world = fightingWorld();
    expect(attackInterval(addTroop(world, 'drone', 300, 700, 10))).toBeCloseTo(TROOPS.drone.attackInterval / (1 + EVOLUTIONS.drone[0]));
    expect(chainJumps(addTroop(world, 'tesla', 300, 700, 20))).toBe(TROOPS.tesla.chain!.jumps + EVOLUTIONS.tesla[1]);
    expect(knockbackOf(addTroop(world, 'titan', 300, 700, 10))).toBe(TROOPS.titan.knockback! + EVOLUTIONS.titan[0]);
  });
});

it('carta nova num save antigo entra no nível 1 (sem NaN no dano)', () => {
  const oldLevels = { sniper: 5, sheriff: 2 } as unknown as CardLevels;
  expect(migrateProgress({ cardLevels: oldLevels }, 8).cardLevels.drone).toBe(1);
  const world = createWorld(generateStage(1), { deck: ['drone', 'tesla', 'laser', 'titan', 'sniper', 'sheriff', 'dog', 'grenade'], cardLevels: oldLevels });
  expect(world.cardLevels.drone).toBe(1);
  expect(world.cardLevels.sniper).toBe(5);
});
