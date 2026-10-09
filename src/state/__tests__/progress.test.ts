import { CARD_MAX_LEVEL, cardUpgradeCost, starBonus } from '@/game/data/balance';
import { STARTER_DECK, TROOPS } from '@/game/data/cards';
import { STAGE_COUNT } from '@/game/data/stages';
import { migrateProgress } from '@/state/migrate';
import { stageStars, starReward, totalStars, worldStars } from '@/state/stars';
import { canUpgradeTruck, nextTruckCost, upgradeTruck } from '@/state/truck';
import { bossKills, emptyRecord, isSeen, recordMatch, totalKills, zombieKills } from '@/state/bestiary';
import { truckPartCost } from '@/game/data/truck';
import {
  addCash, addToDeck, canUpgradeCard, clearStage, initialProgress, isCardUnlocked, isDeckComplete, isStageUnlocked,
  nextCardCost, removeFromDeck, selectStage, upgradeCard,
} from '@/state/progress';

const fresh = () => initialProgress();

describe('níveis das cartas', () => {
  it('sem dinheiro suficiente não altera nada', () => {
    const p = { ...fresh(), cash: 29 };
    expect(upgradeCard(p, 'sniper')).toBe(p);
  });

  it('com dinheiro desconta o custo certo e sobe 1 nível', () => {
    const p = { ...fresh(), cash: 100 };
    const next = upgradeCard(p, 'sniper');
    expect(next.cash).toBe(100 - cardUpgradeCost(TROOPS.sniper, 1));
    expect(next.cardLevels.sniper).toBe(2);
    expect(next.cardLevels.dog).toBe(1);
  });

  it('no nível máximo (30) não sobe mais', () => {
    const p = { ...fresh(), cash: 1e12, cardLevels: { ...fresh().cardLevels, dog: CARD_MAX_LEVEL } };
    expect(nextCardCost(p, 'dog')).toBeNull();
    expect(upgradeCard(p, 'dog')).toBe(p);
  });

  it('carta bloqueada não pode ser melhorada', () => {
    const p = { ...fresh(), cash: 1e6 };
    expect(canUpgradeCard(p, 'shotgun')).toBe(false);
  });
});

describe('desbloqueios', () => {
  it('Bruno libera ao vencer a fase 3; Ataque aéreo, a fase 6', () => {
    expect(isCardUnlocked(fresh(), 'sniper')).toBe(true);
    expect(isCardUnlocked({ ...fresh(), highestCleared: 2 }, 'shotgun')).toBe(false);
    expect(isCardUnlocked({ ...fresh(), highestCleared: 3 }, 'shotgun')).toBe(true);
    expect(isCardUnlocked({ ...fresh(), highestCleared: 5 }, 'airstrike')).toBe(false);
    expect(isCardUnlocked({ ...fresh(), highestCleared: 6 }, 'airstrike')).toBe(true);
  });
});

describe('deck', () => {
  it('começa com o deck inicial de 8', () => {
    expect(fresh().deck).toEqual(STARTER_DECK);
  });

  it('remover tira a carta e deixa o deck incompleto', () => {
    const next = removeFromDeck(fresh(), STARTER_DECK[2]);
    expect(next.deck).toHaveLength(7);
    expect(next.deck).not.toContain(STARTER_DECK[2]);
    expect(isDeckComplete(next)).toBe(false);
  });

  it('adicionar põe a carta da coleção no espaço que ficou vazio', () => {
    const p = { ...fresh(), highestCleared: 3 };
    const next = addToDeck(removeFromDeck(p, STARTER_DECK[2]), 'shotgun', 2);
    expect(next.deck[2]).toBe('shotgun');
    expect(isDeckComplete(next)).toBe(true);
    expect(new Set(next.deck).size).toBe(8);
  });

  it('não adiciona com o deck cheio, carta repetida ou bloqueada', () => {
    const p = { ...fresh(), highestCleared: 3 };
    expect(addToDeck(p, 'shotgun')).toBe(p);
    const seven = removeFromDeck(p, STARTER_DECK[0]);
    expect(addToDeck(seven, STARTER_DECK[1])).toBe(seven);
    expect(addToDeck(seven, 'airstrike')).toBe(seven);
  });

  it('remover carta que não está no deck não muda nada', () => {
    const p = fresh();
    expect(removeFromDeck(p, 'airstrike')).toBe(p);
  });
});

describe('fases', () => {
  it('vencer a fase 3 libera a fase 4; repetir a fase 2 depois não reduz highestCleared', () => {
    let p = clearStage({ ...fresh(), highestCleared: 2 }, 3);
    expect(isStageUnlocked(p, 4)).toBe(true);
    expect(isStageUnlocked(p, 5)).toBe(false);
    p = clearStage(p, 2);
    expect(p.highestCleared).toBe(3);
  });

  it('guarda a melhor marca de estrelas e paga só as estrelas novas', () => {
    let p = clearStage(fresh(), 1, 2);
    expect(stageStars(p, 1)).toBe(2);
    expect(p.cash).toBe(starBonus(1, 2));
    // Repetir com menos estrelas não muda a marca nem paga
    const same = clearStage(p, 1, 1);
    expect(stageStars(same, 1)).toBe(2);
    expect(same.cash).toBe(p.cash);
    expect(starReward(p, 1, 3)).toBe(starBonus(1, 1));
    p = clearStage(p, 1, 3);
    expect(stageStars(p, 1)).toBe(3);
    expect(p.cash).toBe(starBonus(1, 3));
  });

  it('soma as estrelas do mundo e do jogo', () => {
    let p = clearStage(fresh(), 1, 3);
    p = clearStage(p, 2, 2);
    p = clearStage(p, 11, 1);
    expect(worldStars(p, 0)).toBe(5);
    expect(worldStars(p, 1)).toBe(1);
    expect(totalStars(p)).toBe(6);
  });

  it('só seleciona fases liberadas', () => {
    const p = fresh();
    expect(selectStage(p, 3)).toBe(p);
    expect(selectStage({ ...p, highestCleared: 2 }, 3).currentStage).toBe(3);
  });

  it('addCash ignora zero', () => {
    const p = fresh();
    expect(addCash(p, 30).cash).toBe(30);
    expect(addCash(p, 0)).toBe(p);
  });
});

describe('oficina', () => {
  it('sobe a peça descontando o custo; sem dinheiro não muda nada', () => {
    const poor = { ...fresh(), cash: 59 };
    expect(upgradeTruck(poor, 'hull')).toBe(poor);
    const p = upgradeTruck({ ...fresh(), cash: 100 }, 'hull');
    expect(p.truck.hull).toBe(1);
    expect(p.cash).toBe(100 - truckPartCost('hull', 0));
  });

  it('o Tanque para no nível 5', () => {
    const p = { ...fresh(), cash: 1e9, truck: { hull: 0, gun: 0, tank: 5 } };
    expect(nextTruckCost(p, 'tank')).toBeNull();
    expect(canUpgradeTruck(p, 'tank')).toBe(false);
    expect(upgradeTruck(p, 'tank')).toBe(p);
  });
});

describe('bestiário', () => {
  it('soma vistos, abates por tipo e cartas jogadas da partida', () => {
    let p = recordMatch(fresh(), { seen: ['walker', 'brute'], kills: { walker: 10, brute: 1 }, cardsPlayed: 7 });
    p = recordMatch(p, { seen: ['walker', 'runner'], kills: { walker: 5 }, cardsPlayed: 3 });
    expect(p.seen).toEqual(['walker', 'brute', 'runner']);
    expect(zombieKills(p, 'walker')).toBe(15);
    expect(totalKills(p)).toBe(16);
    expect(bossKills(p)).toBe(1);
    expect(p.cardsPlayed).toBe(10);
    expect(isSeen(p, 'yeti')).toBe(false);
  });

  it('partida vazia não muda nada', () => {
    const p = fresh();
    expect(recordMatch(p, emptyRecord())).toBe(p);
  });
});

describe('migração do save', () => {
  it('v4 (sem bestiário): os zumbis das fases alcançadas viram vistos; v5 limpa ids desconhecidos', () => {
    const old = migrateProgress({ highestCleared: 9 }, 4);
    expect(old.seen).toEqual(expect.arrayContaining(['walker', 'runner', 'brute', 'spitter']));
    expect(old.seen).not.toContain('cop');
    expect(old.kills).toEqual({});
    const v5 = migrateProgress({ seen: ['walker', 'tank', 'walker'], kills: { walker: 4, tank: 9, cop: -1 }, cardsPlayed: 12 }, 5);
    expect(v5.seen).toEqual(['walker']);
    expect(v5.kills).toEqual({ walker: 4 });
    expect(v5.cardsPlayed).toBe(12);
  });

  it('v3 (sem oficina): a caminhonete começa sem melhoria; v4 corrige níveis fora do limite', () => {
    expect(migrateProgress({ cash: 1 }, 3).truck).toEqual({ hull: 0, gun: 0, tank: 0 });
    expect(migrateProgress({ truck: { hull: 3, gun: -2, tank: 99 } }, 4).truck).toEqual({ hull: 3, gun: 0, tank: 5 });
  });

  it('v1 (idle): leva dinheiro, fases e níveis dos 3 heróis para as cartas', () => {
    const v1 = { cash: 302, heroLevels: { sniper: 4, sheriff: 2, chainsaw: 60 }, currentStage: 2, highestCleared: 1, lastSeenAt: 0 };
    const p = migrateProgress(v1, 1);
    expect(p.cash).toBe(302);
    expect(p.highestCleared).toBe(1);
    expect(p.cardLevels.sniper).toBe(4);
    expect(p.cardLevels.chainsaw).toBe(CARD_MAX_LEVEL);
    expect(p.cardLevels.dog).toBe(1);
    expect(p.deck).toEqual(STARTER_DECK);
  });

  it('v2 (sem estrelas): cada fase já vencida começa com 1 estrela', () => {
    const p = migrateProgress({ cash: 10, highestCleared: 3 }, 2);
    expect(p.stars.slice(0, 5)).toEqual([1, 1, 1, 0, 0]);
    expect(p.stars).toHaveLength(STAGE_COUNT);
  });

  it('v3: mantém as estrelas salvas e corrige valores inválidos', () => {
    const p = migrateProgress({ highestCleared: 2, stars: [3, 0, 7, 'x'] }, 3);
    expect(p.stars.slice(0, 4)).toEqual([3, 1, 3, 0]);
  });

  it('save inválido vira progresso novo', () => {
    expect(migrateProgress(null, 1)).toEqual(fresh());
  });

  it('mantém deck incompleto salvo, mas troca deck com carta desconhecida ou repetida', () => {
    const seven = STARTER_DECK.slice(1);
    expect(migrateProgress({ deck: seven }, 1).deck).toEqual(seven);
    expect(migrateProgress({ deck: ['sniper', 'sniper'] }, 1).deck).toEqual(STARTER_DECK);
    expect(migrateProgress({ deck: ['tank'] }, 1).deck).toEqual(STARTER_DECK);
  });
});
