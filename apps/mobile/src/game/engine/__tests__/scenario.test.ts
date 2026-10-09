import { BLOOD } from '@/game/data/constants';
import { BLIZZARD, CAR_BOMB, EVENT_WAVES, FOG, HAY, SHELLING, WORLD_EVENT } from '@/game/data/events';
import { generateStage } from '@/game/data/stages';
import { STAGES_PER_WORLD, WORLDS } from '@/game/data/worlds';
import { triggerEvent, troopRange } from '@/game/engine/scenario';
import { blood } from '@/game/engine/systems/blood';
import { spawn } from '@/game/engine/systems/spawn';
import type { Area } from '@/game/types';

import { addTroop, addZombie, fightingWorld, simulate } from './helpers';

describe('eventos nas fases (seção 17.5)', () => {
  it('ondas 2 e 4 trazem o evento do mundo entre 3 e 8 s', () => {
    WORLDS.forEach((world, w) => {
      const stage = generateStage(w * STAGES_PER_WORLD + 4);
      stage.waves.forEach((wave, i) => {
        if (!EVENT_WAVES.includes(i + 1)) return expect(wave.event).toBeUndefined();
        expect(wave.event?.kind).toBe(WORLD_EVENT[world.id]);
        expect(wave.event?.at).toBeGreaterThanOrEqual(3);
        expect(wave.event?.at).toBeLessThanOrEqual(8);
      });
    });
  });

  it('o spawn dispara o evento uma vez só, no momento certo', () => {
    const world = fightingWorld(generateStage(5));
    world.waveIndex = 1;
    world.spawnCursor = 0;
    world.eventFired = false;
    const at = world.stage.waves[1].event?.at ?? 0;
    let fired = 0;
    for (let t = 0; t < at + 3; t += 0.1) {
      spawn(world, 0.1);
      fired += world.events.filter((e) => e.type === 'scenarioEvent').length;
      world.events.length = 0;
      if (t < at - 0.2) expect(fired).toBe(0);
    }
    expect(fired).toBe(1);
  });
});

const areasOf = <K extends Area['kind']>(areas: Area[], kind: K) => areas.filter((a): a is Extract<Area, { kind: K }> => a.kind === kind);

describe('Fardo rolando', () => {
  it('fere uma vez cada zumbi da coluna (chefe menos) e sai do campo', () => {
    const world = fightingWorld();
    triggerEvent(world, 'hay');
    const hay = areasOf(world.areas, 'hay')[0];
    const inPath = addZombie(world, 'walker', hay.x + 10, 300);
    const boss = addZombie(world, 'brute', hay.x - 10, 500);
    const away = addZombie(world, 'walker', hay.x > 300 ? hay.x - 200 : hay.x + 200, 300);
    for (const z of [inPath, boss, away]) z.def = { ...z.def, speed: 0 };
    simulate(world, 6);
    expect(inPath.maxHp - inPath.hp).toBeCloseTo(inPath.maxHp * HAY.zombieDamage);
    expect(boss.maxHp - boss.hp).toBeCloseTo(boss.maxHp * HAY.bossDamage);
    expect(away.hp).toBe(away.maxHp);
    expect(areasOf(world.areas, 'hay')).toHaveLength(0);
  });
});

describe('Carros-bomba', () => {
  it('explodem quando um zumbi chega perto e ferem zumbis e tropas no raio', () => {
    const world = fightingWorld();
    triggerEvent(world, 'carBombs');
    const cars = areasOf(world.areas, 'carBomb');
    expect(cars).toHaveLength(CAR_BOMB.count);
    const car = cars[0];
    const troop = addTroop(world, 'barricade', car.x + 60, car.y);
    const zombie = addZombie(world, 'walker', car.x, car.y + 20);
    simulate(world, 0.05);
    expect(car.exploded).toBe(true);
    expect(zombie.maxHp - zombie.hp).toBeGreaterThan(0);
    expect(troop.maxHp - troop.hp).toBeCloseTo(troop.maxHp * CAR_BOMB.troopDamage);
  });

  it('sem zumbi perto, explodem no fim do pavio', () => {
    const world = fightingWorld();
    triggerEvent(world, 'carBombs');
    simulate(world, CAR_BOMB.fuse + 0.1);
    expect(areasOf(world.areas, 'carBomb')).toHaveLength(0);
  });
});

describe('Bombardeio', () => {
  it('as bombas caem depois do aviso, uma depois da outra, e ferem tropas', () => {
    const world = fightingWorld();
    triggerEvent(world, 'shelling');
    const shells = areasOf(world.areas, 'shell');
    expect(shells).toHaveLength(SHELLING.count);
    const troop = addTroop(world, 'barricade', shells[0].x, shells[0].y);
    simulate(world, SHELLING.warning - 0.1);
    expect(troop.hp).toBe(troop.maxHp);
    simulate(world, 0.2);
    expect(troop.hp).toBeLessThan(troop.maxHp);
    expect(areasOf(world.areas, 'shell')).toHaveLength(SHELLING.count - 1);
  });
});

describe('Névoa e Nevasca', () => {
  it('na névoa os atiradores enxergam 40% menos; a Médica não muda; acaba sozinha', () => {
    const world = fightingWorld();
    const sniper = addTroop(world, 'sniper', 300, 700);
    const medic = addTroop(world, 'medic', 200, 700);
    triggerEvent(world, 'fog');
    expect(troopRange(world, sniper)).toBeCloseTo(sniper.def.range * FOG.rangeFactor);
    expect(troopRange(world, medic)).toBe(medic.def.range);
    simulate(world, FOG.duration + 0.1);
    expect(world.weather).toBeNull();
    expect(troopRange(world, sniper)).toBe(sniper.def.range);
  });

  it('na nevasca os zumbis andam e o sangue enche mais devagar', () => {
    const calm = fightingWorld();
    const cold = fightingWorld();
    triggerEvent(cold, 'blizzard');
    const a = addZombie(calm, 'walker', 300, 0);
    const b = addZombie(cold, 'walker', 300, 0);
    simulate(calm, 1);
    simulate(cold, 1);
    expect(b.y).toBeCloseTo(a.y * BLIZZARD.speedFactor, 0);
    calm.blood = cold.blood = 0;
    blood(calm, 1);
    blood(cold, 1);
    expect(cold.blood).toBeCloseTo(BLOOD.perSecond * BLIZZARD.bloodFactor);
    expect(calm.blood).toBeCloseTo(BLOOD.perSecond);
  });
});
