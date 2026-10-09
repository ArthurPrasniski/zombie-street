import { actOf, FRONTIER_WORLD } from '@/game/data/story';
import { worldOf } from '@/game/data/worlds';
import type { CardDef, ZombieDef } from '@/game/types';

// Seção 8: escalonamento dos zumbis pela fase global s (1 a 50).
// Vida: x (1 + a·(s-1)^b), que sobe rápido no começo e mais devagar depois
// (fase 10 ~2,7x, fase 30 ~7x, fase 50 ~11,7x). Dano e recompensa crescem em linha reta.
export const ZOMBIE_HP_CURVE = { a: 0.16, b: 1.08 };
export const ZOMBIE_DAMAGE_PER_STAGE = 0.04;
export const ZOMBIE_REWARD_PER_STAGE = 0.08;

// Seção 9: bônus de vitória
export const VICTORY_BONUS_PER_STAGE = 50;

// Seção 17.1: estrelas pela vida da base no fim da fase (2 estrelas a partir de 35%, 3 a partir de 70%)
export const STAR_THRESHOLDS = [0.35, 0.7];
export const MAX_STARS = 3;
export const STAR_BONUS_PER_STAGE = 20;

// Seção 10: níveis das cartas (teto do Ato 1; sobe a cada ato, seção 18)
export const CARD_MAX_LEVEL = 30;
export const ACT_LEVEL_CAPS = [30, 40, 50];
export const CARD_COST_GROWTH = 1.2;
export const CARD_POWER_GROWTH = 1.1;
export const TROOP_BASE_COST = 30;
export const SPELL_BASE_COST = 25;

export function zombieHp(def: ZombieDef, stage: number): number {
  return def.hp * (1 + ZOMBIE_HP_CURVE.a * (stage - 1) ** ZOMBIE_HP_CURVE.b);
}

export function zombieDamage(def: ZombieDef, stage: number): number {
  return def.damage * (1 + ZOMBIE_DAMAGE_PER_STAGE * (stage - 1));
}

export function zombieReward(def: ZombieDef, stage: number): number {
  return Math.floor(def.reward * (1 + ZOMBIE_REWARD_PER_STAGE * (stage - 1)));
}

export function victoryBonus(stage: number): number {
  return VICTORY_BONUS_PER_STAGE * stage;
}

/** Custo em dinheiro para subir a carta do nível `level` para `level + 1`. */
export function cardUpgradeCost(card: CardDef, level: number): number {
  const base = card.kind === 'troop' ? TROOP_BASE_COST : SPELL_BASE_COST;
  return Math.round(base * CARD_COST_GROWTH ** (level - 1));
}

/** Multiplicador de vida/dano (tropas) e dano/cura (armas especiais) no nível. */
export function cardPower(level: number): number {
  return CARD_POWER_GROWTH ** (level - 1);
}

/** Estrelas da vitória (1 a 3) pela vida que sobrou na base, de 0 a 1. */
export function starsFor(baseHpRatio: number): number {
  return 1 + STAR_THRESHOLDS.filter((t) => baseHpRatio >= t).length;
}

/** Bônus pelas estrelas novas da fase (acima da melhor marca anterior). */
export function starBonus(stage: number, newStars: number): number {
  return STAR_BONUS_PER_STAGE * stage * Math.max(0, newStars);
}

/** Na Fronteira, o teto sobe este tanto a cada mundo vencido dela (seção 18.6). */
export const FRONTIER_LEVEL_STEP = 5;

/** Teto de nível das cartas pelo ato em que o jogador está (a próxima fase a vencer). */
export function cardMaxLevel(highestCleared: number): number {
  const world = worldOf(highestCleared + 1);
  const act = actOf(world);
  if (act < ACT_LEVEL_CAPS.length) return ACT_LEVEL_CAPS[act];
  // Fronteira: o teto do Ato 3 mais um degrau por mundo da Fronteira já começado
  return ACT_LEVEL_CAPS[ACT_LEVEL_CAPS.length - 1] + FRONTIER_LEVEL_STEP * (world - FRONTIER_WORLD + 1);
}
