import { cardPower } from '@/game/data/balance';
import { SPELLS, TROOPS } from '@/game/data/cards';
import { EVOLUTIONS, evolutionTier, evolutionValue, SLOW_DURATION } from '@/game/data/evolutions';
import { playCard } from '@/game/engine/cards';
import { attackInterval, troopLifetime } from '@/game/engine/evolution';
import { healPulse, strike } from '@/game/engine/attacks';
import type { CardId, TroopId } from '@/game/types';

import { addTroop, addZombie, fightingWorld, giveCard, simulate } from './helpers';

const L10 = 10;
const L20 = 20;
/** Zumbi parado (velocidade 0), para o teste não depender do movimento. */
const still = (world: ReturnType<typeof fightingWorld>, x: number, y: number, id: 'walker' | 'brute' = 'walker') => {
  const z = addZombie(world, id, x, y);
  z.def = { ...z.def, speed: 0 };
  return z;
};
const lost = (z: { hp: number; maxHp: number }) => z.maxHp - z.hp;

describe('níveis de evolução (seção 17.6)', () => {
  it('evolui no 10 e no 20', () => {
    expect([1, 9, 10, 19, 20, 30].map(evolutionTier)).toEqual([0, 0, 1, 1, 2, 2]);
    expect(evolutionValue('sniper', 9)).toBeNull();
    expect(evolutionValue('sniper', 10)).toBe(EVOLUTIONS.sniper[0]);
    expect(evolutionValue('sniper', 25)).toBe(EVOLUTIONS.sniper[1]);
  });

  it('a tropa guarda a evolução do nível', () => {
    const world = fightingWorld();
    expect(addTroop(world, 'sheriff', 300, 700, 9).evo).toBe(0);
    expect(addTroop(world, 'sheriff', 300, 700, L10).evo).toBe(1);
    expect(addTroop(world, 'sheriff', 300, 700, L20).evo).toBe(2);
  });
});

describe('tropas evoluídas', () => {
  it('Mira: o tiro atravessa zumbis atrás do alvo', () => {
    const world = fightingWorld();
    const sniper = addTroop(world, 'sniper', 300, 700, L20);
    const target = still(world, 300, 400);
    const behind = [still(world, 300, 340), still(world, 300, 300), still(world, 300, 280)];
    strike(world, sniper, target);
    expect(behind.filter((z) => lost(z) > 0)).toHaveLength(EVOLUTIONS.sniper[1]);
  });

  it('Xerife: a cada 3 tiros, um extra', () => {
    const world = fightingWorld();
    const sheriff = addTroop(world, 'sheriff', 300, 700, L10);
    const target = still(world, 300, 500, 'brute');
    for (let i = 0; i < 3; i++) strike(world, sheriff, target);
    expect(lost(target)).toBeCloseTo(sheriff.damage * 4);
  });

  it('Bruno e Lara: zumbis a mais por ataque', () => {
    const world = fightingWorld();
    const shotgun = addTroop(world, 'shotgun', 300, 700, L10);
    const target = still(world, 300, 600);
    const around = [still(world, 320, 600), still(world, 280, 600), still(world, 300, 620), still(world, 300, 580)];
    strike(world, shotgun, target);
    expect(around.filter((z) => lost(z) > 0)).toHaveLength((TROOPS.shotgun.splash?.targets ?? 0) + EVOLUTIONS.shotgun[0]);
    // Lara: o virote atravessa a fila inteira de zumbis
    const lane = fightingWorld();
    const crossbow = addTroop(lane, 'crossbow', 100, 700, L10);
    const line = Array.from({ length: 8 }, (_, i) => still(lane, 100, 600 - i * 30));
    strike(lane, crossbow, line[0]);
    expect(line.filter((z) => lost(z) > 0)).toHaveLength((TROOPS.crossbow.pierce?.max ?? 0) + EVOLUTIONS.crossbow[0]);
  });

  it('Serra: recupera parte do dano; Rex: deixa o zumbi lento', () => {
    const world = fightingWorld();
    const saw = addTroop(world, 'chainsaw', 300, 600, L10);
    saw.hp = 10;
    strike(world, saw, still(world, 300, 560, 'brute'));
    expect(saw.hp).toBeCloseTo(10 + saw.damage * EVOLUTIONS.chainsaw[0]);
    const dog = addTroop(world, 'dog', 100, 600, L20);
    const bitten = still(world, 100, 570);
    strike(world, dog, bitten);
    expect(bitten.slow).toBe(EVOLUTIONS.dog[1]);
    expect(bitten.slowTimer).toBe(SLOW_DURATION);
  });

  it('Barricada: devolve dano a quem bate', () => {
    const world = fightingWorld();
    addTroop(world, 'barricade', 300, 600, L10);
    const zombie = still(world, 300, 570, 'brute');
    zombie.def = { ...zombie.def, targetsTroops: true };
    simulate(world, 2.5);
    expect(lost(zombie)).toBeGreaterThanOrEqual(EVOLUTIONS.barricade[0] * cardPower(L10));
  });

  it('Soldado mais rápido e Torreta mais tempo', () => {
    const world = fightingWorld();
    expect(attackInterval(addTroop(world, 'soldier', 300, 700, L20))).toBeCloseTo(TROOPS.soldier.attackInterval / (1 + EVOLUTIONS.soldier[1]));
    expect(troopLifetime(addTroop(world, 'turret', 300, 700, L10))).toBe((TROOPS.turret.lifetime ?? 0) + EVOLUTIONS.turret[0]);
  });

  it('Bombeiro: deixa fogo no chão (um só por lugar)', () => {
    const world = fightingWorld();
    const ff = addTroop(world, 'firefighter', 300, 700, L10);
    const target = still(world, 300, 600, 'brute');
    strike(world, ff, target);
    strike(world, ff, target);
    expect(world.areas.filter((a) => a.kind === 'fire')).toHaveLength(1);
  });

  it('Médica: o pulso também cura a base', () => {
    const world = fightingWorld();
    const medic = addTroop(world, 'medic', 300, 700, L10);
    world.base.hp = 500;
    expect(healPulse(world, medic)).toBe(true);
    expect(world.base.hp).toBeCloseTo(500 + EVOLUTIONS.medic[0] * cardPower(L10));
  });
});

describe('armas especiais evoluídas', () => {
  const cast = (card: CardId, level: number, x = 300, y = 400) => {
    const world = fightingWorld();
    world.cardLevels = { ...world.cardLevels, [card]: level };
    world.blood = 10;
    giveCard(world, card);
    return { world, play: () => playCard(world, 0, x, y) };
  };

  it('Granada atordoa; zumbi atordoado não anda', () => {
    const { world, play } = cast('grenade', L10);
    const zombie = addZombie(world, 'brute', 300, 400);
    play();
    expect(zombie.stun).toBe(EVOLUTIONS.grenade[0]);
    const y = zombie.y;
    simulate(world, 0.5);
    expect(zombie.y).toBe(y);
  });

  it('Kit médico também cura a base', () => {
    const { world, play } = cast('medkit', L20);
    world.base.hp = 100;
    play();
    expect(world.base.hp).toBeCloseTo(100 + world.base.maxHp * EVOLUTIONS.medkit[1]);
  });

  it('Molotov dura mais, Ataque aéreo cai antes e a Mina tem raio maior', () => {
    const molotov = cast('molotov', L10);
    molotov.play();
    expect(molotov.world.areas[0]).toMatchObject({ kind: 'fire', duration: (SPELLS.molotov.duration ?? 0) + EVOLUTIONS.molotov[0] });
    const air = cast('airstrike', L20);
    air.play();
    expect(air.world.areas[0]).toMatchObject({ kind: 'airstrike', delay: EVOLUTIONS.airstrike[1], total: EVOLUTIONS.airstrike[1] });
    const mine = cast('landmine', L10);
    mine.play();
    expect(mine.world.areas[0]).toMatchObject({ kind: 'mine', radius: SPELLS.landmine.radius * (1 + EVOLUTIONS.landmine[0]) });
  });
});

const ALL: TroopId[] = Object.keys(TROOPS) as TroopId[];
it('toda carta tem os dois valores de evolução', () => {
  for (const id of [...ALL, ...(Object.keys(SPELLS) as CardId[])]) expect(EVOLUTIONS[id]).toHaveLength(2);
});
