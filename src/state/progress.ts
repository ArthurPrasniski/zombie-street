import { cardMaxLevel, cardUpgradeCost } from '@/game/data/balance';
import { CARD_IDS, CARD_UNLOCKS, CARDS, DECK_SIZE, STARTER_DECK } from '@/game/data/cards';
import { STAGE_COUNT } from '@/game/data/stages';
import type { AchievementId } from '@/game/data/achievements';
import { STOCK_TRUCK, type TruckLevels } from '@/game/data/truck';
import type { CardId, CardLevels, ZombieId } from '@/game/types';
import { recordStars } from '@/state/stars';

/** Tudo o que é salvo no celular. A partida em andamento nunca é salva. */
export interface Progress {
  cash: number;
  cardLevels: CardLevels;
  deck: CardId[];
  currentStage: number;
  highestCleared: number;
  /** Melhor marca de estrelas (0 a 3) de cada fase; índice = fase - 1. */
  stars: number[];
  /** Níveis das peças da caminhonete (0 = sem melhoria). */
  truck: TruckLevels;
  /** Bestiário: zumbis que já apareceram e quantos de cada tipo o jogador derrotou. */
  seen: ZombieId[];
  kills: Partial<Record<ZombieId, number>>;
  cardsPlayed: number;
  /** Marcos de cada conquista já resgatados (0 a 3). */
  claimed: Partial<Record<AchievementId, number>>;
  /** Maior onda vencida na Sobrevivência. */
  survivalBest: number;
  /** Mensagens de rádio já ouvidas (ids de src/game/data/story.ts). */
  radioHeard: string[];
}

export function initialProgress(): Progress {
  return {
    cash: 0,
    cardLevels: Object.fromEntries(CARD_IDS.map((id) => [id, 1])) as CardLevels,
    deck: [...STARTER_DECK],
    currentStage: 1,
    highestCleared: 0,
    stars: new Array(STAGE_COUNT).fill(0),
    truck: { ...STOCK_TRUCK },
    seen: [],
    kills: {},
    cardsPlayed: 0,
    claimed: {},
    survivalBest: 0,
    radioHeard: [],
  };
}

// ---------- Fases ----------

/** Fase liberada: até a próxima a vencer. Depois da campanha (Fronteira), sem limite. */
export function isStageUnlocked(p: Progress, stage: number): boolean {
  return stage >= 1 && stage <= p.highestCleared + 1;
}

export function selectStage(p: Progress, stage: number): Progress {
  return isStageUnlocked(p, stage) ? { ...p, currentStage: stage } : p;
}

/**
 * Vencer uma fase libera a próxima (repetir uma antiga não reduz o recorde), guarda a melhor
 * marca de estrelas e paga o bônus das estrelas novas.
 */
export function clearStage(p: Progress, stage: number, stars = 1): Progress {
  return recordStars({ ...p, highestCleared: Math.max(p.highestCleared, stage) }, stage, stars);
}

/** Guarda o recorde de ondas vencidas na Sobrevivência (só se for maior). */
export function recordSurvival(p: Progress, waves: number): Progress {
  return waves > p.survivalBest ? { ...p, survivalBest: waves } : p;
}

export function addCash(p: Progress, amount: number): Progress {
  return amount > 0 ? { ...p, cash: p.cash + amount } : p;
}

// ---------- Cartas ----------

/** Fase que libera a carta, ou null se ela vem no deck inicial. */
export const unlockStage = (card: CardId): number | null => CARD_UNLOCKS[card] ?? null;

export function isCardUnlocked(p: Progress, card: CardId): boolean {
  const stage = unlockStage(card);
  return stage === null || p.highestCleared >= stage;
}

/** Custo do próximo nível, ou null no teto de nível do ato atual. */
export function nextCardCost(p: Progress, card: CardId): number | null {
  const level = p.cardLevels[card];
  return level >= cardMaxLevel(p.highestCleared) ? null : cardUpgradeCost(CARDS[card], level);
}

export function canUpgradeCard(p: Progress, card: CardId): boolean {
  const cost = nextCardCost(p, card);
  return cost !== null && p.cash >= cost && isCardUnlocked(p, card);
}

/** Desconta o custo e sobe 1 nível. Sem dinheiro, no máximo ou bloqueada: devolve o mesmo objeto. */
export function upgradeCard(p: Progress, card: CardId): Progress {
  if (!canUpgradeCard(p, card)) return p;
  const cost = nextCardCost(p, card) as number;
  return { ...p, cash: p.cash - cost, cardLevels: { ...p.cardLevels, [card]: p.cardLevels[card] + 1 } };
}

/** Só dá para jogar com o deck completo (8 cartas). */
export const isDeckComplete = (p: Progress): boolean => p.deck.length === DECK_SIZE;

/** Tira a carta do deck; ela volta para a coleção e o espaço fica vazio (como no Clash Royale). */
export function removeFromDeck(p: Progress, card: CardId): Progress {
  if (!p.deck.includes(card)) return p;
  return { ...p, deck: p.deck.filter((c) => c !== card) };
}

/**
 * Põe uma carta da coleção no deck, na posição `at` (padrão: no fim). Deck cheio, carta
 * bloqueada ou que já está no deck: devolve o mesmo objeto.
 */
export function addToDeck(p: Progress, card: CardId, at = p.deck.length): Progress {
  if (p.deck.length >= DECK_SIZE || p.deck.includes(card) || !isCardUnlocked(p, card)) return p;
  const deck = [...p.deck];
  deck.splice(Math.max(0, Math.min(at, deck.length)), 0, card);
  return { ...p, deck };
}
