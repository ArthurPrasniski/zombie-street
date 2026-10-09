import { CHILL } from '@/game/data/constants';
import { playCard } from '@/game/engine/cards';
import { damageZombie } from '@/game/engine/damage';
import { areas } from '@/game/engine/systems/areas';
import { combat } from '@/game/engine/systems/combat';
import { movement } from '@/game/engine/systems/movement';
import { targeting } from '@/game/engine/systems/targeting';

import { addTroop, addZombie, fightingWorld, giveCard } from './helpers';

const STEP = 1 / 60;

describe('tropas novas', () => {
  it('Médica cura as tropas feridas no alcance, e não gasta o pulso se ninguém precisa', () => {
    const world = fightingWorld();
    const medic = addTroop(world, 'medic', 300, 700);
    const near = addTroop(world, 'sheriff', 340, 700);
    const far = addTroop(world, 'sheriff', 300, 400);
    combat(world, STEP);
    expect(medic.cooldown).toBe(0);
    near.hp = 10;
    far.hp = 10;
    combat(world, STEP);
    expect(near.hp).toBeGreaterThan(10);
    expect(far.hp).toBe(10);
  });

  it('Besta: o virote atravessa e acerta até 4 zumbis em linha', () => {
    const world = fightingWorld();
    addTroop(world, 'crossbow', 300, 700);
    const line = [600, 560, 520, 480, 440].map((y) => addZombie(world, 'brute', 300, y));
    const aside = addZombie(world, 'brute', 420, 560);
    targeting(world, 0);
    combat(world, STEP);
    expect(line.filter((z) => z.hp < z.maxHp)).toHaveLength(4);
    expect(aside.hp).toBe(aside.maxHp);
  });

  it('Bombeiro queima o alvo e até mais 5 zumbis perto dele', () => {
    const world = fightingWorld();
    addTroop(world, 'firefighter', 300, 700);
    const group = [0, 1, 2, 3, 4, 5, 6].map((i) => addZombie(world, 'brute', 280 + i * 8, 600));
    targeting(world, 0);
    combat(world, STEP);
    expect(group.filter((z) => z.hp < z.maxHp)).toHaveLength(6);
    expect(world.effects.some((e) => e.kind === 'flame')).toBe(true);
  });

  it('Torreta some no fim do tempo de vida, sem contar como tropa caída', () => {
    const world = fightingWorld();
    const turret = addTroop(world, 'turret', 300, 700);
    for (let i = 0; i < 26 * 60; i++) combat(world, STEP);
    expect(turret.hp).toBe(0);
    expect(world.events.some((e) => e.type === 'troopDown')).toBe(false);
  });

  it('chefes param na Torreta (construção)', () => {
    const world = fightingWorld();
    const turret = addTroop(world, 'turret', 300, 600);
    const boss = addZombie(world, 'riot', 300, 520);
    movement(world, STEP);
    expect(boss.target).toBe(turret);
  });

  it('Mina explode quando um zumbi chega perto e some', () => {
    const world = fightingWorld();
    world.blood = 10;
    giveCard(world, 'landmine');
    expect(playCard(world, 0, 300, 400)).toBe(true);
    const zombie = addZombie(world, 'walker', 300, 300);
    areas(world, STEP);
    expect(world.areas).toHaveLength(1);
    zombie.y = 380;
    areas(world, STEP);
    expect(zombie.hp).toBeLessThan(zombie.maxHp);
    expect(world.areas).toHaveLength(0);
  });
});

describe('zumbis novos', () => {
  it('armadura desconta de cada golpe direto, mas não do fogo', () => {
    const world = fightingWorld(); // fase 1: sem escalonamento
    const cop = addZombie(world, 'cop', 300, 300);
    const armor = cop.def.armor ?? 0;
    damageZombie(world, cop, 10);
    expect(cop.maxHp - cop.hp).toBe(10 - armor);
    damageZombie(world, cop, 2);
    expect(cop.maxHp - cop.hp).toBe(10 - armor + 1);
    damageZombie(world, cop, 3, false);
    expect(cop.maxHp - cop.hp).toBe(10 - armor + 1 + 3);
  });

  it('Inchado explode ao morrer e fere as tropas por perto', () => {
    const world = fightingWorld();
    const near = addTroop(world, 'sheriff', 300, 560);
    const far = addTroop(world, 'sheriff', 300, 760);
    const bloater = addZombie(world, 'bloater', 300, 520);
    damageZombie(world, bloater, 1e6);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });

  it('golpe do Congelado deixa a tropa mais lenta para atacar', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700);
    const frost = addZombie(world, 'frost', 300, 670);
    frost.state = 'attacking';
    frost.target = sheriff;
    combat(world, STEP);
    expect(sheriff.chill).toBeGreaterThan(0);
    addZombie(world, 'brute', 300, 500);
    targeting(world, 0);
    sheriff.cooldown = 0;
    combat(world, STEP);
    expect(sheriff.cooldown).toBeCloseTo(sheriff.def.attackInterval * CHILL.attackSlow, 1);
  });
});
