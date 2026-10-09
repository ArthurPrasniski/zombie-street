import { CARDS, HAND_SIZE, STARTER_DECK, TROOPS } from '@/game/data/cards';
import { BLOOD, MAX_TROOPS } from '@/game/data/constants';
import { fieldFull, playCard } from '@/game/engine/cards';
import { stepWorld } from '@/game/engine/systems';

import { addTroop, addZombie, fightingWorld, giveCard, makeWorld } from './helpers';

describe('deck e mão', () => {
  it('embaralha o deck com a semente: mão de 4 + fila de 4', () => {
    const a = makeWorld(undefined, 9);
    const b = makeWorld(undefined, 9);
    expect(a.hand).toHaveLength(HAND_SIZE);
    expect(a.hand).toEqual(b.hand);
    expect([...a.hand, ...a.queue].sort()).toEqual([...STARTER_DECK].sort());
  });

  it('a carta jogada vai para o fim da fila e a próxima entra no mesmo espaço', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    giveCard(world, 'dog');
    const next = world.queue[0];
    expect(playCard(world, 0, 300, 600)).toBe(true);
    expect(world.hand[0]).toBe(next);
    expect(world.queue[world.queue.length - 1]).toBe('dog');
    expect(world.events).toContainEqual({ type: 'cardPlayed', card: 'dog' });
  });
});

describe('jogar carta', () => {
  it('tropa: desconta o sangue e surge onde foi solta, com fumaça', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    giveCard(world, 'sheriff');
    playCard(world, 0, 250, 600);
    expect(world.blood).toBe(BLOOD.max - TROOPS.sheriff.cost);
    expect(world.troops).toHaveLength(1);
    expect(world.troops[0]).toMatchObject({ x: 250, y: 600, hp: 120 });
    expect(world.effects.some((e) => e.kind === 'smoke')).toBe(true);
  });

  it('sem sangue suficiente não faz nada', () => {
    const world = fightingWorld();
    world.blood = 3.9;
    giveCard(world, 'sniper');
    expect(playCard(world, 0, 250, 600)).toBe(false);
    expect(world.troops).toHaveLength(0);
    expect(world.blood).toBe(3.9);
  });

  it('tropa fora da zona de mobilização (metade de baixo) é recusada; arma especial vale no campo todo', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    giveCard(world, 'sheriff');
    expect(playCard(world, 0, 300, 300)).toBe(false);
    giveCard(world, 'grenade');
    expect(playCard(world, 0, 300, 300)).toBe(true);
  });

  it('com 12 tropas em campo, só arma especial entra', () => {
    const world = fightingWorld();
    for (let i = 0; i < MAX_TROOPS; i++) addTroop(world, 'barricade', 60 + i * 40, 700);
    expect(fieldFull(world)).toBe(true);
    world.blood = BLOOD.max;
    giveCard(world, 'dog');
    expect(playCard(world, 0, 300, 600)).toBe(false);
    giveCard(world, 'grenade');
    expect(playCard(world, 0, 300, 300)).toBe(true);
    world.troops[0].hp = 0;
    expect(fieldFull(world)).toBe(false);
  });

  it('não joga depois que a partida acabou', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    world.phase = 'failed';
    giveCard(world, 'dog');
    expect(playCard(world, 0, 300, 600)).toBe(false);
  });

  it('nível da carta multiplica vida e dano por 1.1^(L-1)', () => {
    const world = fightingWorld();
    world.cardLevels.chainsaw = 3;
    world.blood = 10;
    giveCard(world, 'chainsaw');
    playCard(world, 0, 300, 600);
    expect(world.troops[0].maxHp).toBeCloseTo(220 * 1.1 ** 2);
    expect(world.troops[0].damage).toBeCloseTo(26 * 1.1 ** 2);
  });
});

describe('armas especiais', () => {
  it('granada: 70 de dano só a até 110 do ponto', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    const near = addZombie(world, 'brute', 300, 400);
    const far = addZombie(world, 'brute', 300, 520);
    giveCard(world, 'grenade');
    playCard(world, 0, 300, 400);
    expect(near.maxHp - near.hp).toBeCloseTo(70);
    expect(far.hp).toBe(far.maxHp);
    expect(world.events).toContainEqual({ type: 'explosion', big: false });
    expect(world.effects).toContainEqual(expect.objectContaining({ kind: 'damageText', value: 70 }));
  });

  it('kit médico cura 50% da vida máxima sem passar do máximo', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    const hurt = addTroop(world, 'chainsaw', 300, 600);
    const almost = addTroop(world, 'sheriff', 320, 600);
    hurt.hp = 50;
    almost.hp = 110;
    giveCard(world, 'medkit');
    playCard(world, 0, 310, 600);
    expect(hurt.hp).toBeCloseTo(50 + 110);
    expect(almost.hp).toBe(almost.maxHp);
  });

  it('molotov queima 25/s por 4 s e some', () => {
    const world = fightingWorld();
    world.blood = BLOOD.max;
    const zombie = addZombie(world, 'brute', 300, 300);
    zombie.def = { ...zombie.def, speed: 0 };
    giveCard(world, 'molotov');
    playCard(world, 0, 300, 300);
    for (let i = 0; i < 60 * 5; i++) stepWorld(world, 1 / 60);
    expect(zombie.maxHp - zombie.hp).toBeCloseTo(100, 0);
    expect(world.areas).toHaveLength(0);
    expect(zombie.hitFlash).toBe(0);
  });

  it('ataque aéreo só causa dano depois de 1,5 s', () => {
    const world = fightingWorld();
    world.blood = 10;
    const zombie = addZombie(world, 'brute', 300, 300);
    zombie.def = { ...zombie.def, speed: 0 };
    giveCard(world, 'airstrike');
    playCard(world, 0, 300, 300);
    for (let i = 0; i < 60; i++) stepWorld(world, 1 / 60);
    expect(zombie.hp).toBe(zombie.maxHp);
    for (let i = 0; i < 40; i++) stepWorld(world, 1 / 60);
    expect(zombie.maxHp - zombie.hp).toBeCloseTo(300);
    expect(world.shake).toBeGreaterThan(0);
  });

  it('o custo de cada carta bate com o GDD', () => {
    expect(Object.fromEntries(Object.values(CARDS).map((c) => [c.id, c.cost]))).toEqual({
      sniper: 4, sheriff: 3, shotgun: 3, chainsaw: 4, dog: 2, barricade: 3, soldier: 4, firefighter: 4, medic: 3, crossbow: 4, turret: 4,
      drone: 3, tesla: 4, laser: 4, titan: 5,
      grenade: 2, medkit: 2, molotov: 3, airstrike: 6, landmine: 2,
      cryo: 3, forcefield: 4, blackhole: 5, orbital: 6,
    });
  });
});
