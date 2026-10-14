export const WEEKLY_RULES_VERSION = 1;
export const WEEKLY_DECK = ['sniper','sheriff','chainsaw','dog','barricade','grenade','medkit','molotov'] as const;
export const WEEKLY_LEVEL = 3;
export const WEEKLY_MAX_TICKS = 60 * 1200;
export interface WeeklyConfig { week: string; endsAt: string; seed: number; stage: number; version: number }
export interface WeeklyAttempt extends WeeklyConfig { id: string }
export interface ReplayCard { tick: number; slot: number; x: number; y: number }
export interface WeeklyResult { medal: number; duration: number; damage: number }
export function weeklyConfig(now: Date): WeeklyConfig {
 const day = 86400000; const weekMs = 7 * day; const origin = Date.UTC(2026, 9, 12);
 const index = Math.floor((now.getTime() - origin) / weekMs); const start = origin + index * weekMs;
 return { week: new Date(start).toISOString().slice(0,10), endsAt: new Date(start + weekMs).toISOString(), seed: (index + 4096) >>> 0, stage: 3 + ((index % 5 + 5) % 5), version: WEEKLY_RULES_VERSION };
}
