import { ACHIEVEMENTS, type AchievementDef, type AchievementId, MEDALS } from '@/game/data/achievements';
import { CARD_IDS } from '@/game/data/cards';
import { evolutionTier } from '@/game/data/evolutions';
import { TRUCK_PART_IDS } from '@/game/data/truck';
import { bossKills, totalKills } from '@/state/bestiary';
import type { Progress } from '@/state/progress';
import { totalStars } from '@/state/stars';

// Conquistas (GDD seção 17.8): o valor de cada uma sai do progresso; o resgate é manual.

const def = (id: AchievementId): AchievementDef => ACHIEVEMENTS.find((a) => a.id === id) as AchievementDef;

/** Quanto o jogador já tem na conquista. */
export function achievementValue(p: Progress, id: AchievementId): number {
  switch (id) {
    case 'killer':
      return totalKills(p);
    case 'bossHunter':
      return bossKills(p);
    case 'stars':
      return totalStars(p);
    case 'stages':
      return p.highestCleared;
    case 'cards':
      return p.cardsPlayed;
    case 'upgrades':
      return CARD_IDS.reduce((sum, card) => sum + p.cardLevels[card] - 1, 0);
    case 'evolutions':
      return CARD_IDS.reduce((sum, card) => sum + evolutionTier(p.cardLevels[card]), 0);
    case 'garage':
      return TRUCK_PART_IDS.reduce((sum, part) => sum + p.truck[part], 0);
    case 'survival':
      return p.survivalBest;
  }
}

/** Marcos alcançados (0 a 3). */
export const medalsReached = (p: Progress, id: AchievementId): number => def(id).goals.filter((g) => achievementValue(p, id) >= g).length;

/** Marcos já resgatados (0 a 3). */
export const medalsClaimed = (p: Progress, id: AchievementId): number => p.claimed[id] ?? 0;

/** Prêmio do próximo marco a resgatar, ou null se não há nada para resgatar. */
export function nextReward(p: Progress, id: AchievementId): number | null {
  const claimed = medalsClaimed(p, id);
  return claimed < medalsReached(p, id) ? def(id).rewards[claimed] : null;
}

/** Resgata o próximo marco alcançado (um por vez). Sem marco novo, devolve o mesmo objeto. */
export function claimAchievement(p: Progress, id: AchievementId): Progress {
  const reward = nextReward(p, id);
  if (reward === null) return p;
  return { ...p, cash: p.cash + reward, claimed: { ...p.claimed, [id]: medalsClaimed(p, id) + 1 } };
}

/** Quantos marcos estão esperando resgate (aviso na Home). */
export const claimableCount = (p: Progress): number => ACHIEVEMENTS.reduce((sum, a) => sum + medalsReached(p, a.id) - medalsClaimed(p, a.id), 0);

/** Próxima meta (ou a última, se tudo já foi alcançado). */
export function nextGoal(p: Progress, id: AchievementId): number {
  const goals = def(id).goals;
  return goals[Math.min(MEDALS - 1, medalsReached(p, id))];
}
