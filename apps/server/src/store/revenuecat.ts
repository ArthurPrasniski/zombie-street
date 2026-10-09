// Webhook do RevenueCat: compras de gemas (consumíveis) e a assinatura do passe. Cada evento é
// processado uma vez (tabela webhook_events). O app_user_id é o id da nossa conta, porque o app
// chama Purchases.logIn(userId) logo depois do login.
import { gemPack, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';
import type { Db, Queryable } from '../db';
import { pushTexts } from '../push/texts';
import { enqueue } from './push';
import { moveGems } from './wallet';

/** Campos do evento que usamos (docs do RevenueCat: "Webhook events"). */
export interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id: string;
  transaction_id?: string;
  expiration_at_ms?: number | null;
  cancel_reason?: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBSCRIPTION_ON = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED']);

/** Nossa conta dona do evento (o app_user_id ou um dos aliases), ou null. */
async function ownerOf(q: Queryable, event: RevenueCatEvent): Promise<string | null> {
  const ids = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter((id): id is string => !!id && UUID.test(id));
  for (const id of ids) {
    const [row] = await q.query<{ id: string }>('select id from users where id = $1', [id]);
    if (row) return row.id;
  }
  return null;
}

export type WebhookOutcome = 'duplicate' | 'gems' | 'refund' | 'pass' | 'billing' | 'ignored' | 'unknown-user';

export async function handleRevenueCat(db: Db, event: RevenueCatEvent, now: Date): Promise<WebhookOutcome> {
  return db.tx(async (q) => {
    const fresh = await q.query('insert into webhook_events (id) values ($1) on conflict do nothing returning id', [event.id]);
    if (fresh.length === 0) return 'duplicate';
    const userId = await ownerOf(q, event);
    const pack = gemPack(event.product_id);
    if (pack && event.transaction_id) {
      if (event.type === 'NON_RENEWING_PURCHASE' || event.type === 'INITIAL_PURCHASE') {
        await q.query('insert into purchases (transaction_id, user_id, product_id, gems) values ($1, $2, $3, $4) on conflict do nothing', [event.transaction_id, userId, pack.productId, pack.gems]);
        if (!userId) return 'unknown-user';
        await moveGems(q, userId, pack.gems, 'purchase', event.transaction_id);
        // Aviso "compra confirmada": as gemas podem chegar depois de o jogador sair da loja
        await enqueue(q, userId, { kind: 'purchase', ref: event.transaction_id, urgent: true, ...pushTexts.gems(pack.gems) }, now);
        return 'gems';
      }
      // Reembolso pela loja: tira as gemas (sem deixar negativo)
      if (event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT') {
        await q.query('update purchases set refunded = true where transaction_id = $1', [event.transaction_id]);
        if (userId) await moveGems(q, userId, -pack.gems, 'refund', event.transaction_id);
        return 'refund';
      }
      return 'ignored';
    }
    if (event.product_id !== PASS_PRODUCT_ID) return 'ignored';
    if (!userId) return 'unknown-user';
    // A loja não conseguiu cobrar a renovação: avisa antes de o passe vencer
    if (event.type === 'BILLING_ISSUE') {
      await enqueue(q, userId, { kind: 'billing', ref: event.id, ...pushTexts.billing() }, now);
      return 'billing';
    }
    let expires: Date | null = null;
    if (SUBSCRIPTION_ON.has(event.type) && event.expiration_at_ms) expires = new Date(event.expiration_at_ms);
    // Expirou, ou reembolso: acaba agora. Cancelar a renovação não tira o que já foi pago.
    else if (event.type === 'EXPIRATION' || (event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT')) expires = now;
    if (!expires) return 'ignored';
    await q.query(
      `insert into subscriptions (user_id, product_id, expires_at, updated_at) values ($1, $2, $3, now())
       on conflict (user_id) do update set product_id = $2, expires_at = $3, updated_at = now()`,
      [userId, event.product_id, expires.toISOString()],
    );
    if (event.type === 'INITIAL_PURCHASE') await enqueue(q, userId, { kind: 'purchase', ref: event.transaction_id ?? event.id, urgent: true, ...pushTexts.pass() }, now);
    return 'pass';
  });
}
