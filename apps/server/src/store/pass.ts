// Passe de Batalha no servidor (GDD seção 19.3): XP da temporada com teto diário, assinatura
// premium (vinda do RevenueCat) e resgate dos prêmios de cada nível, uma vez só.
import type { ClaimPass, ClaimResult, PassState } from '@zombie-road/shared/api';
import { acceptXp, canClaim, dayOf, passReward, type PassReward, seasonEnd, seasonOf, tierOf } from '@zombie-road/shared/pass';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';
import { getGems, moveGems } from './wallet';

type Row = { xp: number; claimed_free: number[]; claimed_premium: number[]; xp_day: string; xp_today: number };
const EMPTY: Row = { xp: 0, claimed_free: [], claimed_premium: [], xp_day: '', xp_today: 0 };

/** Passe premium ativo e até quando. */
export async function premiumUntil(q: Queryable, userId: string, now: Date): Promise<Date | null> {
  const [row] = await q.query<{ expires_at: Date | string }>('select expires_at from subscriptions where user_id = $1', [userId]);
  const until = row ? new Date(row.expires_at) : null;
  return until && until > now ? until : null;
}

async function loadRow(q: Queryable, userId: string, season: string, lock = false): Promise<Row> {
  await q.query('insert into pass_progress (user_id, season) values ($1, $2) on conflict do nothing', [userId, season]);
  const [row] = await q.query<Row>(`select xp, claimed_free, claimed_premium, xp_day, xp_today from pass_progress where user_id = $1 and season = $2${lock ? ' for update' : ''}`, [userId, season]);
  return row ?? EMPTY;
}

function toState(season: string, row: Row, until: Date | null, now: Date): PassState {
  const today = dayOf(now);
  return {
    season,
    endsAt: seasonEnd(season).toISOString(),
    xp: row.xp,
    tier: tierOf(row.xp),
    premium: until !== null,
    premiumUntil: until?.toISOString() ?? null,
    claimedFree: row.claimed_free,
    claimedPremium: row.claimed_premium,
    xpToday: row.xp_day === today ? row.xp_today : 0,
  };
}

export async function passState(q: Queryable, userId: string, now: Date): Promise<PassState> {
  const season = seasonOf(now);
  return toState(season, await loadRow(q, userId, season), await premiumUntil(q, userId, now), now);
}

/** Soma XP da temporada respeitando o teto do dia (UTC). */
export async function addXp(db: Db, userId: string, amount: number, now: Date): Promise<PassState> {
  if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, 'xp inválido');
  const season = seasonOf(now);
  const today = dayOf(now);
  return db.tx(async (q) => {
    const row = await loadRow(q, userId, season, true);
    const used = row.xp_day === today ? row.xp_today : 0;
    const accepted = acceptXp(amount, used);
    await q.query('update pass_progress set xp = xp + $3, xp_day = $4, xp_today = $5 where user_id = $1 and season = $2', [userId, season, accepted, today, used + accepted]);
    return toState(season, { ...row, xp: row.xp + accepted, xp_day: today, xp_today: used + accepted }, await premiumUntil(q, userId, now), now);
  });
}

/** Resgata o prêmio do nível: gemas entram na carteira; moedas voltam para o app somar. */
export async function claim(db: Db, userId: string, req: ClaimPass, now: Date): Promise<ClaimResult> {
  const season = seasonOf(now);
  const ref = `${season}:${req.track}:${req.tier}`;
  return db.tx(async (q) => {
    const row = await loadRow(q, userId, season, true);
    const until = await premiumUntil(q, userId, now);
    // Pedido repetido (a resposta se perdeu): devolve o mesmo prêmio; o app soma as moedas uma vez só
    const [done] = await q.query<{ result: PassReward }>("select result from ledger where user_id = $1 and reason = 'pass' and ref = $2", [userId, ref]);
    if (done) return { reward: done.result, pass: toState(season, row, until, now), gems: await getGems(q, userId) };
    const claimed = req.track === 'free' ? row.claimed_free : row.claimed_premium;
    if (!canClaim(row.xp, req.tier, req.track, claimed, until !== null)) throw new HttpError(409, 'prêmio indisponível');
    const reward = passReward(req.tier, req.track, req.stage);
    const column = req.track === 'free' ? 'claimed_free' : 'claimed_premium';
    await q.query(`update pass_progress set ${column} = array_append(${column}, $3) where user_id = $1 and season = $2`, [userId, season, req.tier]);
    await moveGems(q, userId, reward.kind === 'gems' ? reward.amount : 0, 'pass', ref, reward);
    const next = { ...row, [column]: [...claimed, req.tier] };
    return { reward, pass: toState(season, next, until, now), gems: await getGems(q, userId) };
  });
}
