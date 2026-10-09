import { BASE, BLOOD, TROOP_FIELD } from '@/game/data/constants';
import { stepWorld } from '@/game/engine/systems';
import { cleanup } from '@/game/engine/systems/cleanup';
import { combat } from '@/game/engine/systems/combat';
import { blood } from '@/game/engine/systems/blood';
import { movement } from '@/game/engine/systems/movement';
import { targeting } from '@/game/engine/systems/targeting';
import type { World } from '@/game/types';

import { addTroop, addZombie, fightingWorld } from './helpers';

const run = (world: World, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) stepWorld(world, 1 / 60);
};

describe('sangue', () => {
  it('começa em 5, ganha 1 a cada 2,5 s e para em 10', () => {
    const world = fightingWorld();
    expect(world.blood).toBe(BLOOD.start);
    blood(world, 2.5);
    expect(world.blood).toBeCloseTo(6);
    blood(world, 100);
    expect(world.blood).toBe(10);
  });

  it('na onda 5 recarrega em dobro', () => {
    const world = fightingWorld();
    world.waveIndex = 4;
    world.blood = 0;
    blood(world, 2.5);
    expect(world.blood).toBeCloseTo(2);
  });
});

describe('tropas', () => {
  it('atirador mira o zumbi mais próximo dentro do alcance (distância em x e y)', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700);
    addZombie(world, 'walker', 300, 450);
    const closer = addZombie(world, 'walker', 340, 480);
    addZombie(world, 'walker', 300, 300); // fora do alcance de 320
    targeting(world, 0);
    expect(sheriff.target).toBe(closer);
  });

  it('tropa recém-mobilizada espera 0,5 s antes de agir', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700);
    sheriff.deployTimer = 0.5;
    const zombie = addZombie(world, 'brute', 300, 450); // fora do alcance da metralhadora da base
    zombie.def = { ...zombie.def, speed: 0 };
    run(world, 0.4);
    expect(zombie.hp).toBe(zombie.maxHp);
    run(world, 0.3);
    expect(zombie.hp).toBeLessThan(zombie.maxHp);
  });

  it('escopeta acerta o alvo e até mais 2 zumbis perto dele', () => {
    const world = fightingWorld();
    addTroop(world, 'shotgun', 300, 700);
    const group = [560, 550, 540, 530].map((y) => addZombie(world, 'brute', 300, y));
    targeting(world, 0);
    combat(world, 1 / 60);
    expect(group.filter((z) => z.hp < z.maxHp)).toHaveLength(3);
  });

  it('corpo a corpo anda até o zumbi a até 350 e para no alcance', () => {
    const world = fightingWorld();
    const serra = addTroop(world, 'chainsaw', 300, 700);
    const zombie = addZombie(world, 'brute', 300, 400);
    zombie.def = { ...zombie.def, speed: 0 };
    run(world, 6);
    expect(Math.abs(zombie.y - serra.y)).toBeCloseTo(45, 0);
    expect(serra.dirY).toBeLessThan(0);
    expect(zombie.hp).toBeLessThan(zombie.maxHp);
  });

  it('sem alvo, a tropa volta a olhar para o topo do campo', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700);
    const dog = addTroop(world, 'dog', 200, 700);
    sheriff.dirY = dog.dirY = 1;
    targeting(world, 0);
    movement(world, 1 / 60);
    expect([sheriff.dirX, sheriff.dirY]).toEqual([0, -1]);
    expect([dog.dirX, dog.dirY]).toEqual([0, -1]);
  });

  it('corpo a corpo não sai da área das tropas: desliza na borda de cima até alcançar', () => {
    const world = fightingWorld();
    const serra = addTroop(world, 'chainsaw', 100, 200);
    const zombie = addZombie(world, 'brute', 400, TROOP_FIELD.minY - 40);
    zombie.def = { ...zombie.def, speed: 0 };
    let highest = serra.y;
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(world, 1 / 60);
      highest = Math.min(highest, serra.y);
    }
    expect(highest).toBeGreaterThanOrEqual(TROOP_FIELD.minY);
    expect(zombie.hp).toBeLessThan(zombie.maxHp);
    expect(serra.moving).toBe(false);
  });

  it('nas laterais, a tropa fica dentro da área', () => {
    const world = fightingWorld();
    const dog = addTroop(world, 'dog', 300, 600);
    // Zumbi parado no canto do campo dos zumbis: o Rex vai até ele sem passar da borda
    const zombie = addZombie(world, 'brute', 570, 600);
    zombie.def = { ...zombie.def, speed: 0 };
    run(world, 4);
    expect(dog.x).toBeLessThanOrEqual(TROOP_FIELD.maxX);
    expect(dog.x).toBeGreaterThan(500);
  });

  it('não persegue zumbi no alto da arena (fora de alcance); vai no que alcança, mesmo mais longe', () => {
    const world = fightingWorld();
    const dog = addTroop(world, 'dog', 300, 260);
    const above = addZombie(world, 'brute', 300, 40);
    const below = addZombie(world, 'brute', 300, 520);
    above.def = { ...above.def, speed: 0 };
    below.def = { ...below.def, speed: 0 };
    movement(world, 1 / 60);
    expect(dog.target).toBe(below);
    expect(dog.dirY).toBeGreaterThan(0);
  });

  it('corpo a corpo sem zumbi a 350 fica parado', () => {
    const world = fightingWorld();
    const dog = addTroop(world, 'dog', 300, 700);
    addZombie(world, 'walker', 300, 100);
    movement(world, 1);
    expect(dog.y).toBe(700);
  });

  it('tropa que cai deixa corpo, emite troopDown e sai do campo', () => {
    const world = fightingWorld();
    const dog = addTroop(world, 'dog', 300, 700);
    const zombie = addZombie(world, 'walker', 300, 670);
    zombie.damage = 999;
    zombie.state = 'attacking';
    zombie.target = dog;
    combat(world, 1 / 60);
    expect(world.events).toContainEqual({ type: 'troopDown', troop: 'dog' });
    cleanup(world, 0);
    expect(world.troops).toHaveLength(0);
    expect(world.effects.some((e) => e.kind === 'corpse' && e.unit === 'dog')).toBe(true);
  });
});

describe('zumbis e base', () => {
  it('zumbis descem olhando para baixo', () => {
    const world = fightingWorld();
    const zombie = addZombie(world, 'walker', 300, 100);
    movement(world, 1);
    expect(zombie.y).toBeCloseTo(135);
    expect(zombie.dirY).toBe(1);
  });

  it('zumbi vai na tropa a até 120 e ataca', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700);
    const zombie = addZombie(world, 'walker', 310, 600);
    zombie.hp = 1e9; // não morre no caminho (o Xerife e a base atiram nele)
    run(world, 3);
    expect(zombie.target).toBe(sheriff);
    expect(sheriff.hp).toBeLessThan(sheriff.maxHp);
  });

  it('Brutamontes ignora tropas, mas para na barricada', () => {
    const world = fightingWorld();
    const dog = addTroop(world, 'dog', 300, 400);
    dog.def = { ...dog.def, speed: 0, damage: 0 };
    const brute = addZombie(world, 'brute', 300, 320);
    movement(world, 1 / 60);
    expect(brute.target).toBeNull();
    const wall = addTroop(world, 'barricade', 300, 380);
    movement(world, 1 / 60);
    expect(brute.target).toBe(wall);
  });

  it('zumbi que chega na frente da base ataca a base', () => {
    const world = fightingWorld();
    const zombie = addZombie(world, 'walker', 300, BASE.frontY - 10);
    zombie.hp = 1e9;
    run(world, 2);
    expect(zombie.y).toBe(BASE.frontY);
    expect(world.base.hp).toBeLessThan(BASE.hp);
  });

  it('a metralhadora da base atira no zumbi mais próximo a até 300', () => {
    const world = fightingWorld();
    const zombie = addZombie(world, 'brute', 300, 600);
    zombie.def = { ...zombie.def, speed: 0 };
    targeting(world, 0);
    combat(world, 1 / 60);
    expect(zombie.maxHp - zombie.hp).toBeCloseTo(BASE.damage);
    expect(world.base.sinceShot).toBe(0);
  });
});
