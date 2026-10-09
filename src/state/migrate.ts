import { CARD_MAX_LEVEL, MAX_STARS } from '@/game/data/balance';
import { ACHIEVEMENT_IDS, type AchievementId, MEDALS } from '@/game/data/achievements';
import { CARD_IDS, DECK_SIZE } from '@/game/data/cards';
import { STAGE_COUNT, stageZombies } from '@/game/data/stages';
import { radioId } from '@/game/data/story';
import { globalStage, STAGES_PER_WORLD } from '@/game/data/worlds';
import { ZOMBIE_IDS } from '@/game/data/zombies';
import { TRUCK_PART_IDS, TRUCK_PARTS, type TruckLevels } from '@/game/data/truck';
import type { CardId, ZombieId } from '@/game/types';
import { initialProgress, type Progress } from '@/state/progress';

/** Deck salvo válido: até 8 cartas conhecidas e sem repetição (pode estar incompleto). */
function isValidDeck(deck: unknown): deck is CardId[] {
  if (!Array.isArray(deck) || deck.length > DECK_SIZE) return false;
  const known: readonly string[] = CARD_IDS;
  return deck.every((c) => typeof c === 'string' && known.includes(c)) && new Set(deck).size === deck.length;
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Estrelas salvas, uma por fase; antes da v3 (sem estrelas), cada fase vencida vale 1. */
function migrateStars(saved: unknown, highestCleared: number): number[] {
  const list = Array.isArray(saved) ? saved : [];
  // Pelo menos as fases da campanha; na Fronteira, até onde o jogador chegou
  return Array.from({ length: Math.max(STAGE_COUNT, list.length, highestCleared) }, (_, i) => {
    const value = list[i];
    const stars = isCount(value) ? Math.min(MAX_STARS, Math.floor(value)) : 0;
    return i < highestCleared ? Math.max(1, stars) : stars;
  });
}

/** Peças da caminhonete (v4); fora do intervalo, volta para o limite. */
function migrateTruck(saved: unknown): TruckLevels {
  const old = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  const entries = TRUCK_PART_IDS.map((part) => {
    const level = old[part];
    return [part, isCount(level) ? Math.min(TRUCK_PARTS[part].maxLevel, Math.floor(level)) : 0];
  });
  return Object.fromEntries(entries) as TruckLevels;
}

const isZombie = (id: unknown): id is ZombieId => typeof id === 'string' && (ZOMBIE_IDS as string[]).includes(id);

/** Abates por tipo (v5): só zumbis conhecidos e contagens válidas. */
function migrateKills(saved: unknown): Partial<Record<ZombieId, number>> {
  if (!saved || typeof saved !== 'object') return {};
  const entries = Object.entries(saved).filter(([id, n]) => isZombie(id) && isCount(n));
  return Object.fromEntries(entries.map(([id, n]) => [id, Math.floor(n as number)]));
}

/** Marcos resgatados (v6): só conquistas conhecidas, de 0 a 3. */
function migrateClaimed(saved: unknown): Partial<Record<AchievementId, number>> {
  if (!saved || typeof saved !== 'object') return {};
  const known: string[] = ACHIEVEMENT_IDS;
  const entries = Object.entries(saved).filter(([id, n]) => known.includes(id) && isCount(n));
  return Object.fromEntries(entries.map(([id, n]) => [id, Math.min(MEDALS, Math.floor(n as number))]));
}

/** Rádio (v7): antes dele, conta como ouvido o que o jogador já passou (abertura e chefe de cada mundo). */
function migrateRadio(saved: unknown, highestCleared: number): string[] {
  if (Array.isArray(saved)) return [...new Set(saved.filter((id): id is string => typeof id === 'string'))];
  const heard: string[] = [];
  for (let w = 0; globalStage(w, 1) <= highestCleared; w++) {
    for (const [moment, stage] of [['intro', globalStage(w, 1)], ['outro', globalStage(w, STAGES_PER_WORLD)]] as const) {
      const id = radioId(w, moment);
      if (id && highestCleared >= stage) heard.push(id);
    }
  }
  return heard;
}

/** Zumbis vistos (v5); antes dele, os das fases que o jogador já alcançou. */
function migrateSeen(saved: unknown, highestCleared: number): ZombieId[] {
  if (Array.isArray(saved)) return [...new Set(saved.filter(isZombie))];
  // Na Fronteira, os zumbis dela já estão nos mundos da campanha
  const reached = Math.min(STAGE_COUNT, highestCleared + 1);
  const seen = new Set<ZombieId>();
  for (let s = 1; s <= reached; s++) for (const id of stageZombies(s)) seen.add(id);
  return [...seen];
}

/**
 * Converte qualquer save antigo para o formato atual. Campo faltando ou inválido volta ao
 * valor inicial. v1 (idle): heroLevels de 3 heróis. v2: níveis por carta e deck. v3: estrelas.
 * v4: peças da caminhonete. v5: bestiário (vistos, abates) e cartas jogadas. v6: conquistas
 * resgatadas e recorde da Sobrevivência. v7: mensagens de rádio ouvidas. v8: mais mundos (as
 * estrelas acompanham o número de fases).
 */
export function migrateProgress(saved: unknown, version: number): Progress {
  const base = initialProgress();
  if (!saved || typeof saved !== 'object') return base;
  const old = saved as Partial<Record<keyof Progress, unknown>> & { heroLevels?: Partial<Record<string, number>> };
  const cardLevels = { ...base.cardLevels, ...(old.cardLevels && typeof old.cardLevels === 'object' ? old.cardLevels : {}) };
  if (version < 2 && old.heroLevels) {
    for (const hero of ['sniper', 'sheriff', 'chainsaw'] as const) {
      const level = old.heroLevels[hero];
      if (typeof level === 'number') cardLevels[hero] = Math.min(CARD_MAX_LEVEL, Math.max(1, Math.floor(level)));
    }
  }
  const highestCleared = isCount(old.highestCleared) ? Math.floor(old.highestCleared) : 0;
  return {
    cash: isCount(old.cash) ? old.cash : 0,
    cardLevels,
    deck: isValidDeck(old.deck) ? old.deck : base.deck,
    currentStage: typeof old.currentStage === 'number' ? old.currentStage : 1,
    highestCleared,
    stars: migrateStars(old.stars, highestCleared),
    truck: migrateTruck(old.truck),
    seen: migrateSeen(old.seen, highestCleared),
    kills: migrateKills(old.kills),
    cardsPlayed: isCount(old.cardsPlayed) ? Math.floor(old.cardsPlayed) : 0,
    claimed: migrateClaimed(old.claimed),
    survivalBest: isCount(old.survivalBest) ? Math.floor(old.survivalBest) : 0,
    radioHeard: migrateRadio(old.radioHeard, highestCleared),
  };
}
