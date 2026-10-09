import { DEBRIS, DUSTSTORM, METEORS, SPORES } from '@/game/data/events';
import { generateStage } from '@/game/data/stages';
import { WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { damageZombie } from '@/game/engine/damage';
import { triggerEvent, troopRange, weatherSpeed } from '@/game/engine/scenario';
import type { Area } from '@/game/types';

import { addTroop, addZombie, fightingWorld, simulate } from './helpers';

const shells = (areas: Area[]) => areas.filter((a): a is Extract<Area, { kind: 'shell' }> => a.kind === 'shell');

describe('Ato 3 (seção 18.3)', () => {
  it('4 mundos espaciais com zumbi e chefe próprios', () => {
    expect(WORLDS.slice(8).map((w) => w.id)).toEqual(['station', 'moon', 'mars', 'hive']);
    expect(generateStage(90).waves[4].spawns[0].zombie).toBe('commander');
    expect(generateStage(120).waves[4].spawns[0].zombie).toBe('queen');
  });

  it('Cosmonauta passa por cima da barricada e vai direto na base', () => {
    const world = fightingWorld();
    world.base.damage = 0;
    addTroop(world, 'barricade', 300, 500);
    const cosmo = addZombie(world, 'cosmonaut', 300, 300);
    simulate(world, 20);
    expect(cosmo.target).toBeNull();
    expect(cosmo.y).toBeGreaterThan(700);
  });

  it('Xenos vêm em trios, entrando juntos', () => {
    const spawns = generateStage(101).waves[0].spawns.filter((s) => s.zombie === 'xeno');
    expect(spawns.length % 3).toBe(0);
    expect(spawns[0].delay).toBe(spawns[1].delay);
    expect(spawns[1].delay).toBe(spawns[2].delay);
  });

  it('Casulo brota no campo e solta uma larva a cada 4 s, que entra na conta da onda', () => {
    const world = fightingWorld();
    world.totalThisWave = 10;
    const pod = addZombie(world, 'pod', 300, 0);
    const plant = ZOMBIES.pod.plant!;
    const fresh = addZombie(world, 'pod', 0, 0);
    expect(fresh.y === 0 || (fresh.y >= plant.minY && fresh.y <= plant.maxY)).toBe(true);
    world.zombies = [pod];
    simulate(world, 4.1);
    expect(world.zombies.filter((z) => z.def.id === 'larva')).toHaveLength(1);
    expect(world.totalThisWave).toBe(11);
  });

  it('Rainha solta 2 larvas a cada 6 s; Titã Marciano corre o dobro com pouca vida', () => {
    const world = fightingWorld();
    world.base.damage = 0;
    addZombie(world, 'queen', 300, 100);
    simulate(world, 6.1);
    expect(world.zombies.filter((z) => z.def.id === 'larva')).toHaveLength(2);

    const calm = fightingWorld();
    const angry = fightingWorld();
    const a = addZombie(calm, 'marsTitan', 300, 0);
    const b = addZombie(angry, 'marsTitan', 300, 0);
    damageZombie(angry, b, b.maxHp * 0.6);
    simulate(calm, 1);
    simulate(angry, 1);
    expect(b.y).toBeCloseTo(a.y * 2, 0);
  });

  it('Verme Lunar anda por baixo da terra e surge perto da base', () => {
    const world = fightingWorld();
    const worm = addZombie(world, 'lunarWorm', 300, -40);
    expect(worm.burrowed).toBe(true);
    while (worm.burrowed) simulate(world, 0.1);
    expect(worm.y).toBeGreaterThanOrEqual(ZOMBIES.lunarWorm.burrow!.minY);
  });

  it('eventos: detritos, meteoros, poeira e esporos', () => {
    const world = fightingWorld();
    triggerEvent(world, 'debris');
    expect(shells(world.areas)).toHaveLength(DEBRIS.count);
    triggerEvent(world, 'meteors');
    expect(shells(world.areas).filter((s) => s.style === 'meteor')).toHaveLength(METEORS.count);
    const sniper = addTroop(world, 'sniper', 300, 700);
    triggerEvent(world, 'duststorm');
    expect(weatherSpeed(world)).toBe(DUSTSTORM.speedFactor);
    expect(troopRange(world, sniper)).toBeCloseTo(sniper.def.range * DUSTSTORM.rangeFactor);
    const before = world.totalThisWave = 5;
    triggerEvent(world, 'spores');
    expect(world.zombies.filter((z) => z.def.id === 'pod')).toHaveLength(SPORES.count);
    expect(world.totalThisWave).toBe(before + SPORES.count);
  });
});
