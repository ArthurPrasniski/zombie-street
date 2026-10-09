import { cardPower, cardUpgradeCost, starBonus, starsFor, victoryBonus, zombieDamage, zombieHp, zombieReward } from '@/game/data/balance';
import { SPELLS, TROOPS } from '@/game/data/cards';
import { ZOMBIES } from '@/game/data/zombies';

describe('níveis das cartas (seção 10)', () => {
  it('tropa do nível 1 para o 2 custa 30; arma especial custa 25', () => {
    expect(cardUpgradeCost(TROOPS.sniper, 1)).toBe(30);
    expect(cardUpgradeCost(SPELLS.grenade, 1)).toBe(25);
  });

  it('custo do nível 10 para o 11 = round(custoBase x 1.2^9)', () => {
    expect(cardUpgradeCost(TROOPS.dog, 10)).toBe(Math.round(30 * 1.2 ** 9));
  });

  it('poder cresce 10% por nível', () => {
    expect(cardPower(1)).toBe(1);
    expect(cardPower(5)).toBeCloseTo(1.1 ** 4);
  });
});

describe('escalonamento dos zumbis por fase (seção 8)', () => {
  it('fase 1 usa os valores base', () => {
    expect(zombieHp(ZOMBIES.walker, 1)).toBe(40);
    expect(zombieDamage(ZOMBIES.walker, 1)).toBe(8);
    expect(zombieReward(ZOMBIES.walker, 1)).toBe(5);
  });

  it('fase 3 aplica as taxas e arredonda a recompensa para baixo', () => {
    expect(zombieHp(ZOMBIES.brute, 3)).toBeCloseTo(650 * (1 + 0.16 * 2 ** 1.08));
    expect(zombieDamage(ZOMBIES.brute, 3)).toBeCloseTo(30 * (1 + 0.04 * 2));
    expect(zombieReward(ZOMBIES.runner, 3)).toBe(Math.floor(6 * (1 + 0.08 * 2)));
  });

  it('a vida sobe sempre, mais rápido no começo: fase 10 ~2,7x e fase 50 ~11,7x', () => {
    const ratio = (s: number) => zombieHp(ZOMBIES.walker, s) / ZOMBIES.walker.hp;
    expect(ratio(10)).toBeCloseTo(2.7, 1);
    expect(ratio(50)).toBeCloseTo(11.7, 0);
    for (let s = 2; s <= 50; s++) expect(ratio(s)).toBeGreaterThan(ratio(s - 1));
  });
});

describe('bônus de vitória (seção 9)', () => {
  it('50 x fase', () => {
    expect(victoryBonus(7)).toBe(350);
  });
});

describe('estrelas (seção 17.1)', () => {
  it('3 estrelas com 70% ou mais da base, 2 com 35% ou mais, senão 1', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.7)).toBe(3);
    expect(starsFor(0.69)).toBe(2);
    expect(starsFor(0.35)).toBe(2);
    expect(starsFor(0.34)).toBe(1);
    expect(starsFor(0.01)).toBe(1);
  });

  it('cada estrela nova paga 20 x fase; nenhuma estrela nova não paga nada', () => {
    expect(starBonus(10, 2)).toBe(400);
    expect(starBonus(10, 0)).toBe(0);
    expect(starBonus(10, -1)).toBe(0);
  });
});
