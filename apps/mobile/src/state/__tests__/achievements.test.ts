import { ACHIEVEMENTS } from '@/game/data/achievements';
import { achievementValue, claimableCount, claimAchievement, medalsReached, nextGoal, nextReward } from '@/state/achievements';
import { migrateProgress } from '@/state/migrate';
import { initialProgress, type Progress } from '@/state/progress';

const fresh = () => initialProgress();
const killer = ACHIEVEMENTS.find((a) => a.id === 'killer')!;

describe('conquistas (seção 17.8)', () => {
  it('o valor sai do progresso', () => {
    const p: Progress = {
      ...fresh(),
      kills: { walker: 90, brute: 2, yeti: 1 },
      highestCleared: 12,
      cardsPlayed: 40,
      truck: { hull: 3, gun: 2, tank: 1 },
      cardLevels: { ...fresh().cardLevels, sniper: 12, dog: 21 },
      survivalBest: 7,
    };
    expect(achievementValue(p, 'killer')).toBe(93);
    expect(achievementValue(p, 'bossHunter')).toBe(3);
    expect(achievementValue(p, 'stages')).toBe(12);
    expect(achievementValue(p, 'cards')).toBe(40);
    expect(achievementValue(p, 'garage')).toBe(6);
    expect(achievementValue(p, 'upgrades')).toBe(11 + 20);
    expect(achievementValue(p, 'evolutions')).toBe(1 + 2);
    expect(achievementValue(p, 'survival')).toBe(7);
  });

  it('resgata um marco por vez, pagando o prêmio dele', () => {
    let p: Progress = { ...fresh(), kills: { walker: 1500 } };
    expect(medalsReached(p, 'killer')).toBe(2);
    expect(claimableCount(p)).toBe(2);
    expect(nextReward(p, 'killer')).toBe(killer.rewards[0]);
    p = claimAchievement(p, 'killer');
    expect(p.cash).toBe(killer.rewards[0]);
    expect(nextReward(p, 'killer')).toBe(killer.rewards[1]);
    p = claimAchievement(p, 'killer');
    expect(p.cash).toBe(killer.rewards[0] + killer.rewards[1]);
    expect(nextReward(p, 'killer')).toBeNull();
    expect(claimAchievement(p, 'killer')).toBe(p);
    expect(nextGoal(p, 'killer')).toBe(killer.goals[2]);
  });

  it('sem marco alcançado, nada para resgatar', () => {
    const p = fresh();
    expect(claimableCount(p)).toBe(0);
    expect(claimAchievement(p, 'stars')).toBe(p);
  });

  it('migração v6: só conquistas conhecidas e no máximo 3 marcos; recorde da Sobrevivência', () => {
    const p = migrateProgress({ claimed: { killer: 9, nope: 1, stars: 1 }, survivalBest: 12 }, 6);
    expect(p.claimed).toEqual({ killer: 3, stars: 1 });
    expect(p.survivalBest).toBe(12);
    expect(migrateProgress({}, 5).survivalBest).toBe(0);
  });
});
