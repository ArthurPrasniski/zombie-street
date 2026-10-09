import { ACT_LEVEL_CAPS, cardMaxLevel, FRONTIER_LEVEL_STEP } from '@/game/data/balance';
import { frontierWorld, MUTATION, THREAT } from '@/game/data/frontier';
import { generateStage, STAGE_COUNT, stageZombies } from '@/game/data/stages';
import { CAMPAIGN_WORLDS, globalStage, worldDef } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { createWorld, createZombie } from '@/game/engine/world';
import { initialProgress, isStageUnlocked } from '@/state/progress';
import { recordStars, stageStars } from '@/state/stars';

import { SETUP } from './helpers';

const firstFrontier = STAGE_COUNT + 1;

describe('Fronteira infinita (seção 18.5)', () => {
  it('depois da campanha, cada mundo é um planeta gerado e sempre igual', () => {
    expect(STAGE_COUNT).toBe(CAMPAIGN_WORLDS * 10);
    const a = worldDef(CAMPAIGN_WORLDS + 7);
    const b = worldDef(CAMPAIGN_WORLDS + 7);
    expect(a).toEqual(b);
    expect('planet' in a).toBe(true);
    expect(JSON.stringify(generateStage(globalStage(CAMPAIGN_WORLDS + 3, 5)))).toBe(JSON.stringify(generateStage(globalStage(CAMPAIGN_WORLDS + 3, 5))));
  });

  it('gera fases muito além da campanha, com chefe e evento', () => {
    const stage = generateStage(firstFrontier + 999);
    expect(stage.waves).toHaveLength(5);
    expect(ZOMBIES[stage.waves[4].spawns[0].zombie].isBoss).toBe(true);
    expect(stage.waves[1].event).toBeDefined();
  });

  it('ameaças: Enxame põe mais zumbis; Rápida deixa todos mais rápidos', () => {
    const swarm = Array.from({ length: 40 }, (_, i) => i).find((i) => frontierWorld(i, 0).threat === 'swarm')!;
    const sw = CAMPAIGN_WORLDS + swarm;
    const stage = generateStage(globalStage(sw, 1));
    const plain = 5 + 1 + Math.floor(50 / 3);
    expect(stage.waves[0].spawns.length).toBeGreaterThan(plain);

    const fast = Array.from({ length: 40 }, (_, i) => i).find((i) => frontierWorld(i, 0).threat === 'fast')!;
    const world = createWorld(generateStage(globalStage(CAMPAIGN_WORLDS + fast, 1)), SETUP);
    const tier = frontierWorld(fast, 0).tier;
    expect(createZombie(world, 'walker').def.speed).toBeCloseTo(ZOMBIES.walker.speed * (1 + THREAT.fastSpeed * tier));
  });

  it('o chefe da Fronteira vem mutado', () => {
    const giant = Array.from({ length: 40 }, (_, i) => i).find((i) => frontierWorld(i, 0).mutation === 'giant')!;
    const w = CAMPAIGN_WORLDS + giant;
    const world = createWorld(generateStage(globalStage(w, 10)), SETUP);
    const boss = createZombie(world, worldDef(w).boss);
    expect(boss.def.hp).toBeCloseTo(ZOMBIES[worldDef(w).boss].hp * MUTATION.giantHp);
    // Fora da Fronteira, nada muda
    const campaign = createWorld(generateStage(10), SETUP);
    expect(createZombie(campaign, 'brute').def).toBe(ZOMBIES.brute);
  });

  it('fases da Fronteira liberam sem limite; as estrelas crescem junto; o teto de nível sobe', () => {
    const p = { ...initialProgress(), highestCleared: STAGE_COUNT + 37 };
    expect(isStageUnlocked(p, STAGE_COUNT + 38)).toBe(true);
    expect(isStageUnlocked(p, STAGE_COUNT + 39)).toBe(false);
    const withStar = recordStars(p, STAGE_COUNT + 30, 3);
    expect(stageStars(withStar, STAGE_COUNT + 30)).toBe(3);
    expect(cardMaxLevel(STAGE_COUNT)).toBe(ACT_LEVEL_CAPS[2] + FRONTIER_LEVEL_STEP);
    expect(cardMaxLevel(STAGE_COUNT + 10)).toBe(ACT_LEVEL_CAPS[2] + FRONTIER_LEVEL_STEP * 2);
  });
});

it('as sheets da fase cobrem todo zumbi que pode aparecer (campanha e Fronteira)', () => {
  for (const s of [1, 25, 58, 89, 115, 120, 121, 133, 157, 260, 999]) {
    const loaded = new Set(stageZombies(s));
    for (const wave of generateStage(s).waves) for (const spawn of wave.spawns) expect(loaded.has(spawn.zombie)).toBe(true);
    // Filhotes (divisão, larvas) também
    for (const id of loaded) {
      const child = ZOMBIES[id].split?.into ?? ZOMBIES[id].spawner?.into;
      if (child) expect(loaded.has(child)).toBe(true);
    }
  }
});
