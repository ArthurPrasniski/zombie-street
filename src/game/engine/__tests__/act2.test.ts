import { ACT_LEVEL_CAPS, cardMaxLevel } from '@/game/data/balance';
import { BLACKOUT, ENGINE_TEST, GAS_LEAK } from '@/game/data/events';
import { generateStage, STAGE_COUNT } from '@/game/data/stages';
import { STAGES_PER_WORLD, WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { damageZombie } from '@/game/engine/damage';
import { triggerEvent, troopRange } from '@/game/engine/scenario';
import { migrateProgress } from '@/state/migrate';
import { initialProgress, nextCardCost } from '@/state/progress';

import { addTroop, addZombie, fightingWorld, simulate } from './helpers';

const lost = (z: { hp: number; maxHp: number }) => z.maxHp - z.hp;

describe('Ato 2 (seção 18.2)', () => {
  it('3 mundos novos, 10 fases cada, com zumbi e chefe próprios', () => {
    expect(WORLDS.slice(5, 8).map((w) => w.id)).toEqual(['tech', 'lab', 'launch']);
    expect(STAGE_COUNT).toBe(WORLDS.length * STAGES_PER_WORLD);
    const ids = new Set(generateStage(52).waves.flatMap((w) => w.spawns.map((s) => s.zombie)));
    expect(ids.has('android')).toBe(true);
    expect(generateStage(60).waves[4].spawns[0].zombie).toBe('colossus');
  });

  it('depois da fase 50, a quantidade de zumbis por onda para de crescer', () => {
    const count = (s: number) => generateStage(s).waves.map((w) => w.spawns.length);
    expect(count(75)).toEqual(count(50));
  });

  it('Androide: tiro faz metade, elétrico o dobro', () => {
    const world = fightingWorld();
    const a = addZombie(world, 'android', 300, 300);
    damageZombie(world, a, 20, true, 'firearm');
    expect(lost(a)).toBeCloseTo(10);
    const b = addZombie(world, 'android', 300, 300);
    damageZombie(world, b, 20, true, 'electric');
    expect(lost(b)).toBeCloseTo(40);
  });

  it('Astronauta: o traje segura os golpes; trincado, leva o dobro', () => {
    const world = fightingWorld();
    const z = addZombie(world, 'astronaut', 300, 300);
    expect(z.suit).toBeCloseTo(z.maxHp * (ZOMBIES.astronaut.suit?.ratio ?? 0));
    damageZombie(world, z, z.suit - 1);
    expect(z.hp).toBe(z.maxHp);
    damageZombie(world, z, 5);
    expect(z.suit).toBe(0);
    expect(lost(z)).toBeCloseTo(4 * 2);
  });

  it('Mutante: fere sem parar as tropas por perto (sem piscar)', () => {
    const world = fightingWorld();
    const near = addTroop(world, 'barricade', 300, 600);
    const far = addTroop(world, 'barricade', 100, 700);
    const mutant = addZombie(world, 'mutant', 340, 600);
    mutant.def = { ...mutant.def, speed: 0, targetsTroops: false };
    simulate(world, 2);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });

  it('Apagão diminui o alcance; Vazamento fere tropas e zumbis; o jato queima a linha', () => {
    const world = fightingWorld();
    const sniper = addTroop(world, 'sniper', 300, 700);
    triggerEvent(world, 'blackout');
    expect(troopRange(world, sniper)).toBeCloseTo(sniper.def.range * BLACKOUT.rangeFactor);

    const gasWorld = fightingWorld();
    triggerEvent(gasWorld, 'gasLeak');
    const cloud = gasWorld.areas.find((a) => a.kind === 'gas')!;
    const troop = addTroop(gasWorld, 'sniper', cloud.x, cloud.y);
    const zombie = addZombie(gasWorld, 'brute', cloud.x, cloud.y);
    zombie.def = { ...zombie.def, speed: 0 };
    simulate(gasWorld, 1);
    expect(lost(troop)).toBeCloseTo(troop.maxHp * GAS_LEAK.rate, 0);
    expect(lost(zombie)).toBeGreaterThan(0);

    const jetWorld = fightingWorld();
    // Sem a metralhadora da base, só o jato fere
    jetWorld.base.damage = 0;
    triggerEvent(jetWorld, 'engineTest');
    const jet = jetWorld.areas.find((a) => a.kind === 'jet')!;
    const inRow = addZombie(jetWorld, 'walker', 300, jet.y);
    const outRow = addZombie(jetWorld, 'walker', 300, jet.y + 200);
    for (const z of [inRow, outRow]) z.def = { ...z.def, speed: 0 };
    simulate(jetWorld, 2);
    expect(lost(inRow)).toBeCloseTo(inRow.maxHp * ENGINE_TEST.zombieDamage);
    expect(outRow.hp).toBe(outRow.maxHp);
    expect(jetWorld.areas.some((a) => a.kind === 'jet')).toBe(false);
  });

  it('o teto de nível das cartas sobe ao entrar em cada ato', () => {
    expect([0, 49, 50, 79, 80].map(cardMaxLevel)).toEqual([30, 30, 40, 40, 50]);
    const atCap = { ...initialProgress(), cardLevels: { ...initialProgress().cardLevels, dog: ACT_LEVEL_CAPS[0] } };
    expect(nextCardCost(atCap, 'dog')).toBeNull();
    expect(nextCardCost({ ...atCap, highestCleared: 50 }, 'dog')).not.toBeNull();
  });

  it('migração v8: as estrelas acompanham o número de fases', () => {
    expect(migrateProgress({ stars: [3, 2] }, 7).stars).toHaveLength(STAGE_COUNT);
  });
});
