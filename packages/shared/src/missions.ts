/** Achievable with the starter deck, no advertising objectives. UTC server clock. */
export const DAILY_MISSIONS = [
 { id: 'wins', target: 1, coins: 100, xp: 20 },
 { id: 'kills', target: 40, coins: 150, xp: 20 },
 { id: 'cards', target: 12, coins: 100, xp: 20 },
] as const;
export type MissionId = typeof DAILY_MISSIONS[number]['id'];
export interface DailyState { day: string; resetsAt: string; progress: Record<MissionId, number>; claimed: MissionId[]; coinGrants: { ref: string; coins: number }[] }
export interface MissionMatch { id: string; wins: number; kills: number; cards: number }
