import { BASE, BLOOD } from '@/game/data/constants';
import { baseStats, STOCK_TRUCK, truckPartCost } from '@/game/data/truck';

describe('peças da caminhonete (seção 17.3)', () => {
  it('sem melhoria, a base é a padrão', () => {
    expect(baseStats(STOCK_TRUCK)).toEqual({ hp: BASE.hp, damage: BASE.damage, startBlood: BLOOD.start });
  });

  it('Lataria +15% de vida por nível; Metralhadora x1,12 de dano por nível', () => {
    const stats = baseStats({ hull: 4, gun: 3, tank: 0 });
    expect(stats.hp).toBe(Math.round(BASE.hp * 1.6));
    expect(stats.damage).toBeCloseTo(BASE.damage * 1.12 ** 3);
  });

  it('Tanque: +1 de sangue inicial por nível, sem passar do máximo', () => {
    expect(baseStats({ hull: 0, gun: 0, tank: 3 }).startBlood).toBe(BLOOD.start + 3);
    expect(baseStats({ hull: 0, gun: 0, tank: 50 }).startBlood).toBe(BLOOD.max);
  });

  it('custo = round(base x crescimento^nível)', () => {
    expect(truckPartCost('hull', 0)).toBe(60);
    expect(truckPartCost('gun', 4)).toBe(Math.round(60 * 1.25 ** 4));
    expect(truckPartCost('tank', 2)).toBe(1600);
  });
});
