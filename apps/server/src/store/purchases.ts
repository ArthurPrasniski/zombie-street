import type { PurchaseHistory } from '@zombie-road/shared/api';
import { MEMBERSHIP } from '@zombie-road/shared/catalog';
import type { Queryable } from '../db';

/** Recibos entregues, nunca derivados do saldo que pode mudar por outros motivos. */
export async function purchaseHistory(q: Queryable, userId: string): Promise<PurchaseHistory> {
  const rows = await q.query<{ transaction_id: string; product_id: string; delivered_at: Date | string; refunded: boolean }>(
    `select transaction_id, product_id, created_at as delivered_at, refunded from purchases where user_id = $1
     union all select transaction_id, product_id, purchased_at as delivered_at, refunded from pass_purchases where user_id = $1
     union all select transaction_id, $2 as product_id, purchased_at as delivered_at, refunded from membership_cycles where user_id = $1
     order by delivered_at desc, transaction_id desc`, [userId, MEMBERSHIP.productId],
  );
  return { records: rows.map((r) => ({ transactionId: r.transaction_id, productId: r.product_id, deliveredAt: new Date(r.delivered_at).toISOString(), refunded: r.refunded })) };
}
