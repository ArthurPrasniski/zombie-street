// Passe de Batalha: temporadas globais de 90 dias (UTC), 30 níveis, trilha grátis e premium.
// A compra única libera apenas a temporada em que foi feita. Regras usadas pelo app e servidor.
import { progressFactor } from './catalog';

export const PASS_TIERS = 30;
export const XP_PER_TIER = 100;
export const PASS_SEASON_DAYS = 90;
export const PASS_SEASON_ORIGIN = '2026-10-13T00:00:00.000Z';
const SEASON_MS = PASS_SEASON_DAYS * 24 * 3600 * 1000;
/** XP máximo por dia (UTC): o XP vem do aparelho, então o teto limita o quanto se pode forçar. */
export const PASS_DAILY_XP = 600;

/** XP por resultado de partida. */
export const PASS_XP = { stageClear: 40, perStar: 10, stageFailed: 15, perSurvivalWave: 5, survivalMax: 100 };

export type PassTrack = 'free' | 'premium';
export type PassReward = { kind: 'coins'; amount: number } | { kind: 'gems'; amount: number };

/** Id da temporada: sua data de início em UTC, ex.: "2026-10-13". */
export function seasonOf(date: Date): string {
  const origin = new Date(PASS_SEASON_ORIGIN).getTime();
  const index = Math.floor((date.getTime() - origin) / SEASON_MS);
  return new Date(origin + index * SEASON_MS).toISOString().slice(0, 10);
}

export function seasonStart(season: string): Date {
  return new Date(`${season}T00:00:00.000Z`);
}

/** Fim exclusivo da temporada: nesse instante começa a próxima. */
export function seasonEnd(season: string): Date {
  return new Date(seasonStart(season).getTime() + SEASON_MS);
}

/** Dia (UTC) para o teto diário de XP, ex.: "2026-10-09". */
export const dayOf = (date: Date): string => date.toISOString().slice(0, 10);

/** Nível alcançado (0 a 30) com o XP da temporada. */
export const tierOf = (xp: number): number => Math.min(PASS_TIERS, Math.floor(Math.max(0, xp) / XP_PER_TIER));

/** XP de uma vitória com estrelas, de uma derrota ou de uma Sobrevivência. */
export function stageXp(cleared: boolean, stars: number): number {
  return cleared ? PASS_XP.stageClear + PASS_XP.perStar * stars : PASS_XP.stageFailed;
}
export const survivalXp = (waves: number): number => Math.min(PASS_XP.survivalMax, PASS_XP.perSurvivalWave * waves);

// Free progression grants coins. Historical premium purchases keep their promised gems.
const PREMIUM_GEMS: Record<number, number> = { 5: 40, 10: 40, 15: 40, 20: 40, 25: 40, 30: 150 };

/** Prêmio do nível `tier` (1 a 30) na trilha, para quem está na fase `stage`. */
export function passReward(tier: number, track: PassTrack, stage: number): PassReward {
  const gems = track === 'premium' ? PREMIUM_GEMS[tier] : undefined;
  if (gems) return { kind: 'gems', amount: gems };
  const base = (track === 'free' ? 100 : 250) + 10 * tier;
  return { kind: 'coins', amount: Math.round(base * progressFactor(stage)) };
}

/** Pode resgatar: nível alcançado, ainda não resgatado e, na premium, com o passe ativo. */
export function canClaim(xp: number, tier: number, track: PassTrack, claimed: number[], premium: boolean): boolean {
  if (tier < 1 || tier > PASS_TIERS || tierOf(xp) < tier || claimed.includes(tier)) return false;
  return track === 'free' || premium;
}

/** Soma XP respeitando o teto do dia: devolve o XP aceito. */
export function acceptXp(amount: number, usedToday: number): number {
  return Math.max(0, Math.min(Math.floor(amount), PASS_DAILY_XP - usedToday));
}
