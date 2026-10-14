import type { MembershipState } from '@zombie-road/shared/api';
import { MEMBERSHIP } from '@zombie-road/shared/catalog';

import type { Queryable } from '../db';
import type { RevenueCatEvent, WebhookOutcome } from './revenuecat';
import { moveGems } from './wallet';

export async function membershipState(q: Queryable, userId: string, now: Date): Promise<MembershipState> {
  const [row] = await q.query<{ expires_at: Date | string; auto_renew: boolean }>('select expires_at, auto_renew from memberships where user_id = $1', [userId]);
  const expiresAt = row ? new Date(row.expires_at).toISOString() : null;
  const grants = await q.query<{ id: string; coins: number; refunded: boolean }>('select transaction_id as id, coins, refunded from membership_cycles where user_id = $1 order by purchased_at, transaction_id', [userId]);
  return { userId, active: !!expiresAt && new Date(expiresAt) > now, expiresAt, autoRenew: row?.auto_renew ?? false, grants };
}

const ACCESS_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED']);

/** Roda dentro da mesma transação do webhook e do ledger de gemas. */
export async function handleMembership(q: Queryable, event: RevenueCatEvent, userId: string | null, now: Date): Promise<WebhookOutcome> {
  if (!userId) return 'unknown-user';
  if (!ACCESS_EVENTS.has(event.type)) return 'ignored';
  const expires = event.expiration_at_ms;
  const purchased = event.purchased_at_ms;
  if (!Number.isFinite(expires) || !expires || !Number.isFinite(purchased) || purchased === null || purchased === undefined) return 'ignored';
  const purchaseDate = new Date(purchased);
  const expirationDate = new Date(expires);
  if (!Number.isFinite(purchaseDate.getTime()) || !Number.isFinite(expirationDate.getTime()) || purchased < 0 || expires <= purchased) return 'ignored';
  const refund = event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT';
  const charged = (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') && event.period_type !== 'TRIAL';
  const eventMs = event.event_timestamp_ms ?? (charged ? purchased : now.getTime());
  if (!Number.isFinite(eventMs)) return 'ignored';
  if ((charged || refund) && !event.transaction_id) return 'ignored';

  if (charged || refund) {
    await q.query(
      `insert into membership_cycles (transaction_id, user_id, purchased_at, gems, coins, refunded)
       values ($1, $2, $3, $4, $5, $6) on conflict do nothing`,
      [event.transaction_id, userId, purchaseDate.toISOString(), MEMBERSHIP.gems, MEMBERSHIP.coins, refund],
    );
    const [cycle] = await q.query<{ user_id: string; gems: number; refunded: boolean }>('select user_id, gems, refunded from membership_cycles where transaction_id = $1 for update', [event.transaction_id]);
    if (cycle.user_id !== userId) return 'ignored';
    if (refund) {
      await q.query('update membership_cycles set refunded = true where transaction_id = $1', [event.transaction_id]);
      const [granted] = await q.query("select id from ledger where user_id = $1 and reason = 'membership' and ref = $2", [userId, event.transaction_id]);
      if (granted) await moveGems(q, userId, -cycle.gems, 'membership-refund', event.transaction_id!);
    } else if (!cycle.refunded) {
      await moveGems(q, userId, cycle.gems, 'membership', event.transaction_id!);
    }
  }

  // Cancelar a renovação mantém o benefício até o fim do período já pago.
  const until = refund ? new Date(Math.min(now.getTime(), expires)) : expirationDate;
  const autoRenew = ['BILLING_ISSUE', 'SUBSCRIPTION_EXTENDED'].includes(event.type) || (event.type === 'CANCELLATION' && event.cancel_reason === 'BILLING_ERROR') ? null
    : !['CANCELLATION', 'EXPIRATION', 'SUBSCRIPTION_PAUSED'].includes(event.type);
  await q.query(
    `insert into memberships (user_id, expires_at, auto_renew, last_event_ms, period_started_at) values ($1, $2, coalesce($3, true), $4, $5)
     on conflict (user_id) do update set expires_at = $2, auto_renew = coalesce($3, memberships.auto_renew), last_event_ms = $4, period_started_at = $5
     where memberships.period_started_at < $5 or (memberships.period_started_at = $5 and memberships.last_event_ms < $4)`,
    [userId, until.toISOString(), autoRenew, eventMs, purchaseDate.toISOString()],
  );
  return 'membership';
}
