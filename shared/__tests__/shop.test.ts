import { COIN_PACKS, coinPackCoins, COINS_PER_GEM, gemPack, GEM_PACKS, progressFactor } from '../catalog';
import { acceptXp, canClaim, PASS_DAILY_XP, PASS_TIERS, passReward, seasonEnd, seasonOf, stageXp, survivalXp, tierOf, XP_PER_TIER } from '../pass';

describe('loja (GDD seção 19)', () => {
  it('cada pacote de gemas tem um produto único', () => {
    const ids = GEM_PACKS.map((p) => p.productId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(gemPack('zr_gems_500')?.gems).toBe(500);
    expect(gemPack('nada')).toBeUndefined();
  });

  it('moedas por gemas crescem com a fase e com o bônus do pacote', () => {
    expect(progressFactor(1)).toBe(1);
    expect(coinPackCoins('sack', 1)).toBe(COIN_PACKS.sack.gems * COINS_PER_GEM);
    expect(coinPackCoins('sack', 51)).toBe(Math.round(COIN_PACKS.sack.gems * COINS_PER_GEM * 5));
    // O pacote maior rende mais moedas por gema
    const perGem = (pack: 'sack' | 'vault') => coinPackCoins(pack, 30) / COIN_PACKS[pack].gems;
    expect(perGem('vault')).toBeGreaterThan(perGem('sack'));
  });
});

describe('Passe de Batalha (GDD seção 19.3)', () => {
  it('temporada é o mês (UTC) e termina no começo do mês seguinte', () => {
    expect(seasonOf(new Date('2026-10-31T23:59:59Z'))).toBe('2026-10');
    expect(seasonEnd('2026-12').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('nível pelo XP, com teto de 30', () => {
    expect(tierOf(0)).toBe(0);
    expect(tierOf(XP_PER_TIER * 3 + 50)).toBe(3);
    expect(tierOf(1e9)).toBe(PASS_TIERS);
  });

  it('XP das partidas e o teto do dia', () => {
    expect(stageXp(true, 3)).toBeGreaterThan(stageXp(true, 1));
    expect(stageXp(false, 0)).toBeLessThan(stageXp(true, 1));
    expect(survivalXp(1000)).toBe(100);
    expect(acceptXp(500, PASS_DAILY_XP - 100)).toBe(100);
    expect(acceptXp(500, PASS_DAILY_XP)).toBe(0);
  });

  it('prêmios: gemas em alguns níveis, moedas crescendo com o progresso; premium vale mais', () => {
    expect(passReward(30, 'premium', 1)).toEqual({ kind: 'gems', amount: 150 });
    const free = passReward(3, 'free', 10);
    const premium = passReward(3, 'premium', 10);
    expect(free.kind).toBe('coins');
    expect(premium.amount).toBeGreaterThan(free.amount);
    expect(passReward(3, 'free', 60).amount).toBeGreaterThan(free.amount);
  });

  it('só resgata nível alcançado, uma vez, e a premium só com o passe', () => {
    const xp = XP_PER_TIER * 5;
    expect(canClaim(xp, 5, 'free', [], false)).toBe(true);
    expect(canClaim(xp, 6, 'free', [], false)).toBe(false);
    expect(canClaim(xp, 5, 'free', [5], false)).toBe(false);
    expect(canClaim(xp, 5, 'premium', [], false)).toBe(false);
    expect(canClaim(xp, 5, 'premium', [], true)).toBe(true);
  });
});
