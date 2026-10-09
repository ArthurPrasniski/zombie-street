import { BASE, ZOMBIE_SPAWN_Y } from '@/game/data/constants';
import { generateStage, SPECIAL_ZOMBIES, stageZombies } from '@/game/data/stages';
import { ZOMBIES } from '@/game/data/zombies';
import { damageZombie } from '@/game/engine/damage';
import { distance, nearestZombie, zombiesWithin } from '@/game/engine/queries';

import { addTroop, addZombie, fightingWorld, simulate } from './helpers';

describe('Cuspidor (seção 17.4)', () => {
  it('para a 150 da tropa e cospe ácido de longe', () => {
    const world = fightingWorld();
    const troop = addTroop(world, 'barricade', 300, 650);
    const spitter = addZombie(world, 'spitter', 300, 420);
    const hp = troop.hp;
    simulate(world, 12);
    expect(troop.hp).toBeLessThan(hp);
    expect(distance(spitter.x, spitter.y, troop.x, troop.y)).toBeGreaterThan(140);
  });

  it('cospe na base parado antes do muro', () => {
    const world = fightingWorld();
    const spitter = addZombie(world, 'spitter', 100, 500);
    const effects: string[] = [];
    for (let i = 0; i < 20 * 60; i++) {
      simulate(world, 1 / 60);
      for (const e of world.effects) effects.push(e.kind);
    }
    expect(spitter.y).toBeCloseTo(BASE.frontY - (ZOMBIES.spitter.ranged ?? 0), 0);
    expect(world.base.hp).toBeLessThan(world.base.maxHp);
    expect(effects).toContain('spit');
  });
});

describe('Escavador', () => {
  it('enterrado não pode ser alvo; surge em emergeY com terra voando', () => {
    const world = fightingWorld();
    const digger = addZombie(world, 'digger', 300, ZOMBIE_SPAWN_Y);
    expect(digger.burrowed).toBe(true);
    expect(nearestZombie(world, 300, 0, 1000)).toBeNull();
    expect(zombiesWithin(world, 300, 0, 1000)).toHaveLength(0);
    damageZombie(world, digger, 999);
    expect(digger.hp).toBe(digger.maxHp);
    const seen: string[] = [];
    while (digger.burrowed) {
      simulate(world, 1 / 60);
      for (const e of world.effects) seen.push(e.kind);
    }
    expect(digger.y).toBeGreaterThanOrEqual(ZOMBIES.digger.burrow?.minY ?? 0);
    expect(digger.y).toBeLessThanOrEqual(ZOMBIES.digger.burrow?.maxY ?? 0);
    expect(seen).toContain('dirt');
    expect(nearestZombie(world, 300, 0, 1000)).toBe(digger);
  });
});

describe('Divisor', () => {
  it('ao morrer vira 2 Pequenos, que entram na conta da onda', () => {
    const world = fightingWorld();
    world.totalThisWave = 5;
    const splitter = addZombie(world, 'splitter', 300, 300);
    damageZombie(world, splitter, 1e6);
    const pieces = world.zombies.filter((z) => z.def.id === 'splitling');
    expect(pieces).toHaveLength(2);
    expect(world.totalThisWave).toBe(7);
    expect(world.events).toEqual(expect.arrayContaining([{ type: 'zombieKilled', zombie: 'splitter', reward: splitter.reward }, { type: 'zombieSpawned', zombie: 'splitling' }]));
    expect(pieces[0].x).not.toBe(pieces[1].x);
  });
});

describe('Porta-escudo', () => {
  it('zumbis perto levam 40% menos de golpe direto; fogo e ele mesmo não', () => {
    const world = fightingWorld();
    const shielder = addZombie(world, 'shielder', 300, 300);
    const near = addZombie(world, 'walker', 340, 300);
    const far = addZombie(world, 'walker', 500, 300);
    damageZombie(world, near, 10);
    damageZombie(world, far, 10);
    expect(near.maxHp - near.hp).toBeCloseTo(6);
    expect(far.maxHp - far.hp).toBeCloseTo(10);
    const burnt = near.hp;
    damageZombie(world, near, 10, false);
    expect(burnt - near.hp).toBeCloseTo(10);
    // Ele mesmo só desconta a armadura
    damageZombie(world, shielder, 10);
    expect(shielder.maxHp - shielder.hp).toBeCloseTo(10 - (ZOMBIES.shielder.armor ?? 0));
  });
});

describe('ondas com zumbis especiais', () => {
  const ids = (s: number) => new Set(generateStage(s).waves.flatMap((w) => w.spawns.map((e) => e.zombie)));

  it('cada especial só aparece a partir da sua fase', () => {
    for (const { zombie, from } of SPECIAL_ZOMBIES) {
      expect(ids(from - 1).has(zombie)).toBe(false);
      expect(ids(from).has(zombie)).toBe(true);
    }
  });

  it('a fase carrega as sheets dos especiais e dos pedaços do Divisor', () => {
    expect(stageZombies(7)).not.toContain('spitter');
    expect(stageZombies(22)).toEqual(expect.arrayContaining(['spitter', 'digger', 'splitter', 'splitling']));
    expect(stageZombies(22)).not.toContain('shielder');
  });
});
