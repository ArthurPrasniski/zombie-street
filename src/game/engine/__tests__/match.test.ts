import { victoryBonus } from '@/game/data/balance';
import { BASE, BLOOD, INTERMISSION_DURATION } from '@/game/data/constants';
import { generateStage } from '@/game/data/stages';
import { createSnapshot } from '@/game/engine/snapshot';
import { createWorld } from '@/game/engine/world';
import { waveCheck } from '@/game/engine/systems/waveCheck';
import type { GameEvent } from '@/game/types';

import { addTroop, addZombie, fightingWorld, makeWorld, SETUP, simpleBot, simulate } from './helpers';

const TEN_MINUTES = 600;
const isEnd = (e: GameEvent) => e.type === 'stageCleared' || e.type === 'stageFailed';

describe('waveCheck', () => {
  it('a pausa inicial dura 3 s e emite waveStarted', () => {
    const world = makeWorld();
    waveCheck(world, INTERMISSION_DURATION - 0.1);
    expect(world.phase).toBe('intermission');
    waveCheck(world, 0.2);
    expect(world.phase).toBe('fighting');
    expect(world.events).toEqual([{ type: 'waveStarted', wave: 1 }]);
  });

  it('onda vencida vai para a próxima e as tropas continuam em campo', () => {
    const world = fightingWorld();
    world.totalThisWave = 6;
    world.killedThisWave = 6;
    addTroop(world, 'sheriff', 300, 600);
    waveCheck(world, 1 / 60);
    expect(world.phase).toBe('intermission');
    expect(world.waveIndex).toBe(1);
    expect(world.troops).toHaveLength(1);
  });

  it('vencer a onda 5 soma o bônus de 50 x fase e emite stageCleared', () => {
    const world = fightingWorld(generateStage(4));
    world.waveIndex = 4;
    world.stageCash = 300;
    world.totalThisWave = world.killedThisWave = 5;
    waveCheck(world, 1 / 60);
    expect(world.phase).toBe('cleared');
    expect(world.events).toEqual([{ type: 'stageCleared', stage: 4, cashEarned: 300 + victoryBonus(4), stars: 3 }]);
  });

  it('as estrelas da vitória saem da vida que sobrou na base', () => {
    for (const [hp, stars] of [[1000, 3], [700, 3], [699, 2], [350, 2], [349, 1], [1, 1]]) {
      const world = fightingWorld(generateStage(4));
      world.waveIndex = 4;
      world.base.hp = hp;
      world.totalThisWave = world.killedThisWave = 5;
      waveCheck(world, 1 / 60);
      expect(world.events[0]).toMatchObject({ type: 'stageCleared', stars });
    }
  });

  it('base em 0 encerra a partida com stageFailed e o dinheiro ganho', () => {
    const world = fightingWorld();
    world.stageCash = 42;
    world.base.hp = 0;
    waveCheck(world, 1 / 60);
    expect(world.phase).toBe('failed');
    expect(world.events).toEqual([{ type: 'stageFailed', stage: 1, cashEarned: 42 }]);
  });
});

describe('partida inteira (passos fixos, sem render)', () => {
  it('fase 1 com o deck inicial no nível 1 e um jogador simples é vencida', () => {
    const world = makeWorld(generateStage(1), 3);
    const events = simulate(world, TEN_MINUTES, { until: isEnd, bot: simpleBot });
    expect(events.find(isEnd)?.type).toBe('stageCleared');
    expect(events.filter((e) => e.type === 'waveStarted')).toHaveLength(5);
  });

  it('fase 10 sem jogar cartas: a base cai', () => {
    const world = makeWorld(generateStage(10));
    const events = simulate(world, TEN_MINUTES, { until: isEnd });
    expect(events.find(isEnd)?.type).toBe('stageFailed');
    expect(world.phase).toBe('failed');
  });

  it('stageCash = recompensas dos zumbis mortos + bônus', () => {
    const world = makeWorld(generateStage(1), 3);
    const events = simulate(world, TEN_MINUTES, { until: isEnd, bot: simpleBot });
    const kills = events.reduce((sum, e) => sum + (e.type === 'zombieKilled' ? e.reward : 0), 0);
    expect(world.stageCash).toBe(kills + victoryBonus(1));
  });

  it('é determinística com a mesma semente', () => {
    const a = makeWorld(generateStage(3), 77);
    const b = makeWorld(generateStage(3), 77);
    simulate(a, 60, { bot: simpleBot });
    simulate(b, 60, { bot: simpleBot });
    expect(createSnapshot(a)).toEqual(createSnapshot(b));
  });
});

describe('caminhonete melhorada (seção 17.3)', () => {
  it('a partida começa com a vida, o dano e o sangue das peças', () => {
    const world = createWorld(generateStage(1), { ...SETUP, truck: { hull: 2, gun: 1, tank: 2 } });
    expect(world.base.maxHp).toBe(Math.round(BASE.hp * 1.3));
    expect(world.base.hp).toBe(world.base.maxHp);
    expect(world.base.damage).toBeCloseTo(BASE.damage * 1.12);
    expect(world.blood).toBe(BLOOD.start + 2);
  });

  it('a metralhadora da base usa o dano melhorado', () => {
    const world = fightingWorld();
    world.base.damage = 25;
    const zombie = addZombie(world, 'walker', BASE.gunX, BASE.gunY - 100);
    const hp = zombie.hp;
    simulate(world, 0.05);
    expect(zombie.hp).toBeCloseTo(hp - 25);
  });
});
