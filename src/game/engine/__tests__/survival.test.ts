import { BLOOD } from '@/game/data/constants';
import { zombieHp } from '@/game/data/balance';
import { isBossWave } from '@/game/data/stages';
import { survivalBonus, survivalStage, survivalWave, survivalWorld, survivalZombies } from '@/game/data/survival';
import { WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { blood } from '@/game/engine/systems/blood';
import { waveCheck } from '@/game/engine/systems/waveCheck';
import { createWorld, createZombie } from '@/game/engine/world';
import type { GameEvent } from '@/game/types';
import { initialProgress, recordSurvival } from '@/state/progress';

import { SETUP, simpleBot, simulate } from './helpers';

const survivalWorldState = () => createWorld(survivalStage(), SETUP, 1, 'survival');

describe('ondas da Sobrevivência (seção 17.9)', () => {
  it('chefe a cada 5 ondas, evento a cada 3, dificuldade da fase n', () => {
    expect([1, 4, 5, 9, 10].map((n) => isBossWave(survivalWave(n)))).toEqual([false, false, true, false, true]);
    expect([2, 3, 6].map((n) => survivalWave(n).event !== undefined)).toEqual([false, true, true]);
    expect(survivalWave(17).level).toBe(17);
  });

  it('o cenário muda a cada 10 ondas e volta ao começo depois do último mundo', () => {
    const last = WORLDS.length * 10;
    expect([1, 10, 11, 20, 21, last, last + 1].map(survivalWorld)).toEqual([0, 0, 1, 1, 2, WORLDS.length - 1, 0]);
    expect(survivalWave(15).spawns[0].zombie).toBe('riot');
    expect(survivalWave(12).spawns.some((s) => s.zombie === 'cop')).toBe(true);
  });

  it('carrega as sheets do mundo atual e dos especiais já liberados', () => {
    expect(survivalZombies(3)).toEqual(['walker', 'runner', 'brute']);
    expect(survivalZombies(12)).toEqual(expect.arrayContaining(['cop', 'riot', 'spitter']));
    expect(survivalZombies(12)).not.toContain('brute');
  });
});

describe('partida da Sobrevivência', () => {
  it('vencer a onda paga o bônus e cria a próxima, sem acabar a partida', () => {
    const world = survivalWorldState();
    world.phase = 'fighting';
    world.totalThisWave = world.killedThisWave = 3;
    waveCheck(world, 1 / 60);
    expect(world.phase).toBe('intermission');
    expect(world.waveIndex).toBe(1);
    expect(world.stage.waves).toHaveLength(2);
    expect(world.stageCash).toBe(survivalBonus(1));
    expect(world.events.some((e) => e.type === 'stageCleared')).toBe(false);
  });

  it('o zumbi tem a vida da onda atual', () => {
    const world = survivalWorldState();
    world.stage.waves = Array.from({ length: 7 }, (_, i) => survivalWave(i + 1));
    world.waveIndex = 6;
    expect(createZombie(world, 'walker').maxHp).toBeCloseTo(zombieHp(ZOMBIES.walker, 7));
  });

  it('o sangue enche em dobro só nas ondas com chefe', () => {
    const world = survivalWorldState();
    world.blood = 0;
    blood(world, 1);
    expect(world.blood).toBeCloseTo(BLOOD.perSecond);
    world.stage.waves = Array.from({ length: 5 }, (_, i) => survivalWave(i + 1));
    world.waveIndex = 4;
    world.blood = 0;
    blood(world, 1);
    expect(world.blood).toBeCloseTo(BLOOD.perSecond * BLOOD.bossWaveMultiplier);
  });

  it('quando a base cai, conta as ondas vencidas', () => {
    const world = survivalWorldState();
    world.waveIndex = 6;
    world.base.hp = 0;
    waveCheck(world, 1 / 60);
    expect(world.events).toEqual([{ type: 'survivalOver', waves: 6, cashEarned: 0 }]);
  });

  it('com o jogador simples, passa de algumas ondas e um dia a base cai', () => {
    const world = survivalWorldState();
    const events = simulate(world, 3600, { bot: simpleBot, until: (e: GameEvent) => e.type === 'survivalOver' });
    const over = events.find((e) => e.type === 'survivalOver');
    expect(over).toBeDefined();
    expect(over?.type === 'survivalOver' && over.waves).toBeGreaterThanOrEqual(5);
  });

  it('o recorde só sobe', () => {
    const p = recordSurvival(initialProgress(), 8);
    expect(p.survivalBest).toBe(8);
    expect(recordSurvival(p, 5)).toBe(p);
  });
});
