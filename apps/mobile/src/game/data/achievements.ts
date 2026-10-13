import { localizedName } from '@/i18n/names';
// Seção 17.8: conquistas com 3 marcos (bronze, prata, ouro); cada marco paga dinheiro.
export type AchievementId = 'killer' | 'bossHunter' | 'stars' | 'stages' | 'cards' | 'upgrades' | 'evolutions' | 'garage' | 'survival';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  /** Valor a alcançar em cada marco e o prêmio de cada um. */
  goals: readonly [number, number, number];
  rewards: readonly [number, number, number];
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'killer', name: localizedName('Caçador'), goals: [100, 1000, 10000], rewards: [100, 600, 3000] },
  { id: 'bossHunter', name: localizedName('Mata-chefes'), goals: [1, 10, 50], rewards: [150, 700, 3000] },
  { id: 'stars', name: localizedName('Estrelado'), goals: [15, 75, 150], rewards: [200, 1000, 4000] },
  { id: 'stages', name: localizedName('Estradeiro'), goals: [10, 30, 50], rewards: [300, 1500, 5000] },
  { id: 'cards', name: localizedName('Mão rápida'), goals: [100, 1000, 5000], rewards: [100, 600, 2500] },
  { id: 'upgrades', name: localizedName('Treinador'), goals: [10, 60, 200], rewards: [150, 900, 3500] },
  { id: 'evolutions', name: localizedName('Evolução'), goals: [1, 8, 24], rewards: [300, 1500, 6000] },
  { id: 'garage', name: localizedName('Mecânico'), goals: [5, 20, 45], rewards: [150, 900, 3500] },
  { id: 'survival', name: localizedName('Sobrevivente'), goals: [5, 15, 30], rewards: [200, 1200, 5000] },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id);
export const MEDALS = 3;
