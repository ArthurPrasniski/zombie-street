import type { GemAdState, GemAdTicket } from '@zombie-road/shared/api';
import { GEM_AD_REWARD, GEM_ADS_PER_DAY, GEM_AD_TICKET_MS } from '@zombie-road/shared/catalog';
import { dayOf } from '@zombie-road/shared/pass';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';
import { membershipState } from './membership';
import { getGems, moveGems } from './wallet';

interface TicketRow {
  request_id: string; user_id: string; reward_day: string; gems: number;
  status: GemAdTicket['status']; created_at: Date | string; expires_at: Date | string;
}
const reset = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

export async function gemAdState(q: Queryable, userId: string, now: Date, available: boolean): Promise<GemAdState> {
  const [row] = await q.query<{ used: number; reserved: number }>("select count(*) filter(where status='earned')::int as used, count(*) filter(where status='pending' and expires_at>$3)::int as reserved from gem_ad_tickets where user_id=$1 and reward_day=$2", [userId, dayOf(now), now.toISOString()]);
  const member = (await membershipState(q, userId, now)).active;
  return { reward: GEM_AD_REWARD, limit: GEM_ADS_PER_DAY, used: row.used, remaining: member ? 0 : Math.max(0, GEM_ADS_PER_DAY - row.used - row.reserved), resetsAt: reset(now), member, available };
}

async function ticket(q: Queryable, userId: string, requestId: string): Promise<GemAdTicket> {
  const [row] = await q.query<TicketRow>('select * from gem_ad_tickets where request_id=$1 and user_id=$2', [requestId, userId]);
  if (!row) throw new HttpError(404, 'recompensa não encontrada');
  return { requestId, status: row.status, expiresAt: new Date(row.expires_at).toISOString(), gems: await getGems(q, userId) };
}
export const gemAdTicket = ticket;

export async function reserveGemAd(db: Db, userId: string, requestId: string, now: Date): Promise<GemAdTicket> {
  return db.tx(async (q) => {
    await q.query('select user_id from wallets where user_id=$1 for update', [userId]);
    const [existing] = await q.query<TicketRow>('select * from gem_ad_tickets where request_id=$1', [requestId]);
    if (existing) {
      if (existing.user_id !== userId) throw new HttpError(409, 'pedido indisponível');
      return ticket(q, userId, requestId);
    }
    if ((await membershipState(q, userId, now)).active) throw new HttpError(409, 'assinante recebe o pacote mensal');
    const [row] = await q.query<{ count: number }>("select count(*)::int as count from gem_ad_tickets where user_id=$1 and reward_day=$2 and (status='earned' or (status='pending' and expires_at>$3))", [userId, dayOf(now), now.toISOString()]);
    if (row.count >= GEM_ADS_PER_DAY) throw new HttpError(429, 'limite diário de anúncios');
    await q.query('insert into gem_ad_tickets(request_id,user_id,reward_day,gems,created_at,expires_at) values($1,$2,$3,$4,$5,$6)', [requestId, userId, dayOf(now), GEM_AD_REWARD, now.toISOString(), new Date(now.getTime() + GEM_AD_TICKET_MS).toISOString()]);
    return ticket(q, userId, requestId);
  });
}

export async function cancelGemAd(db: Db, userId: string, requestId: string): Promise<void> {
  await db.query("update gem_ad_tickets set status='cancelled' where request_id=$1 and user_id=$2 and status='pending'", [requestId, userId]);
}

/** Only called after Google's ECDSA verification, or from the development-only simulator. */
export async function grantGemAd(db: Db, userId: string, requestId: string, transactionId: string, earnedAt: Date, now: Date): Promise<void> {
  await db.tx(async (q) => {
    await q.query('select user_id from wallets where user_id=$1 for update', [userId]);
    const [row] = await q.query<TicketRow>('select * from gem_ad_tickets where request_id=$1 and user_id=$2 for update', [requestId, userId]);
    if (!row) throw new HttpError(404, 'recompensa não encontrada');
    if (row.status === 'earned') return;
    // Cancelled client callbacks can race a valid SSV callback; only signed proof grants gems.
    if (earnedAt < new Date(row.created_at) || earnedAt > new Date(row.expires_at) || earnedAt.getTime() > now.getTime() + 60000) throw new HttpError(400, 'anúncio fora da janela');
    if ((await membershipState(q, userId, earnedAt)).active) throw new HttpError(409, 'assinante recebe o pacote mensal');
    const [duplicate] = await q.query('select request_id from gem_ad_tickets where transaction_id=$1', [transactionId]);
    if (duplicate) throw new HttpError(409, 'anúncio já utilizado');
    const [count] = await q.query<{ used: number }>("select count(*)::int as used from gem_ad_tickets where user_id=$1 and reward_day=$2 and status='earned'", [userId, row.reward_day]);
    if (count.used >= GEM_ADS_PER_DAY) throw new HttpError(429, 'limite diário de anúncios');
    await q.query("update gem_ad_tickets set status='earned',transaction_id=$2,earned_at=$3 where request_id=$1", [requestId, transactionId, earnedAt.toISOString()]);
    await moveGems(q, userId, row.gems, 'ad-gems', requestId);
  });
}
