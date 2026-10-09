import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { COIN_PACKS, coinPackCoins, COINS_PER_GEM, gemPack, GEM_PACKS, progressFactor } from '../src/catalog';
import { acceptXp, canClaim, PASS_DAILY_XP, PASS_TIERS, passReward, seasonEnd, seasonOf, stageXp, survivalXp, tierOf, XP_PER_TIER } from '../src/pass';

describe('loja (GDD seção 19)', () => {
  it('cada pacote de gemas tem um produto único', () => {
    const ids = GEM_PACKS.map((p) => p.productId);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(gemPack('zr_gems_500')?.gems, 500);
    assert.equal(gemPack('nada'), undefined);
  });

  it('moedas por gemas crescem com a fase e com o bônus do pacote', () => {
    assert.equal(progressFactor(1), 1);
    assert.equal(coinPackCoins('sack', 1), COIN_PACKS.sack.gems * COINS_PER_GEM);
    assert.equal(coinPackCoins('sack', 51), Math.round(COIN_PACKS.sack.gems * COINS_PER_GEM * 5));
    // O pacote maior rende mais moedas por gema
    const perGem = (pack: 'sack' | 'vault') => coinPackCoins(pack, 30) / COIN_PACKS[pack].gems;
    assert.ok(perGem('vault') > perGem('sack'));
  });
});

describe('Passe de Batalha (GDD seção 19.3)', () => {
  it('temporada é o mês (UTC) e termina no começo do mês seguinte', () => {
    assert.equal(seasonOf(new Date('2026-10-31T23:59:59Z')), '2026-10');
    assert.equal(seasonEnd('2026-12').toISOString(), '2027-01-01T00:00:00.000Z');
  });

  it('nível pelo XP, com teto de 30', () => {
    assert.equal(tierOf(0), 0);
    assert.equal(tierOf(XP_PER_TIER * 3 + 50), 3);
    assert.equal(tierOf(1e9), PASS_TIERS);
  });

  it('XP das partidas e o teto do dia', () => {
    assert.ok(stageXp(true, 3) > stageXp(true, 1));
    assert.ok(stageXp(false, 0) < stageXp(true, 1));
    assert.equal(survivalXp(1000), 100);
    assert.equal(acceptXp(500, PASS_DAILY_XP - 100), 100);
    assert.equal(acceptXp(500, PASS_DAILY_XP), 0);
  });

  it('prêmios: gemas em alguns níveis, moedas crescendo com o progresso; premium vale mais', () => {
    assert.deepEqual(passReward(30, 'premium', 1), { kind: 'gems', amount: 150 });
    const free = passReward(3, 'free', 10);
    const premium = passReward(3, 'premium', 10);
    assert.equal(free.kind, 'coins');
    assert.ok(premium.amount > free.amount);
    assert.ok(passReward(3, 'free', 60).amount > free.amount);
  });

  it('só resgata nível alcançado, uma vez, e a premium só com o passe', () => {
    const xp = XP_PER_TIER * 5;
    assert.equal(canClaim(xp, 5, 'free', [], false), true);
    assert.equal(canClaim(xp, 6, 'free', [], false), false);
    assert.equal(canClaim(xp, 5, 'free', [5], false), false);
    assert.equal(canClaim(xp, 5, 'premium', [], false), false);
    assert.equal(canClaim(xp, 5, 'premium', [], true), true);
  });
});
