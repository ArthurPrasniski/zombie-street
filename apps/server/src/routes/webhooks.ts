// Webhook do RevenueCat (gemas e passe) e, só em desenvolvimento, a compra simulada que o
// app usa no Expo Go (onde não há loja de verdade).
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

import { isMembershipProduct } from '@zombie-road/shared/catalog';
import type { Deps } from '../app';
import { HttpError } from '../errors';
import { handleRevenueCat, type RevenueCatEvent } from '../store/revenuecat';

export function webhookRoutes(app: FastifyInstance, deps: Deps): void {
  const { db, config, sessions, now, log, monitor } = deps;

  app.post<{ Body: { event?: RevenueCatEvent } }>('/webhooks/revenuecat', async (req) => {
    if (!config.revenueCatWebhookAuth || req.headers.authorization !== config.revenueCatWebhookAuth) throw new HttpError(401, 'webhook sem autorização');
    const event = req.body.event;
    if (!event?.id || !event.type) throw new HttpError(400, 'evento inválido');
    const outcome = await handleRevenueCat(db, event, now(), monitor);
    // Compra de alguém que não conhecemos: guardada sem dono, para conciliar depois
    if (outcome === 'unknown-user') log(`RevenueCat: evento ${event.id} (${event.type}) sem conta conhecida: ${event.app_user_id}`);
    return { ok: true, outcome };
  });

  if (!config.devRoutes) return;

  /** Simula uma compra única de gemas ou do passe da temporada. */
  app.post<{ Body: { productId: string } }>('/dev/purchase', { schema: { body: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' } } } } }, async (req) => {
    const userId = await sessions.verify(req.headers.authorization);
    if (!isMembershipProduct(req.body.productId)) throw new HttpError(400, 'produto não disponível para compra');
    const id = randomUUID();
    const event: RevenueCatEvent = {
      id,
      type: 'INITIAL_PURCHASE',
      app_user_id: userId,
      product_id: req.body.productId,
      transaction_id: `dev-${id}`,
      purchased_at_ms: now().getTime(),
      expiration_at_ms: now().getTime() + 30 * 86400000, event_timestamp_ms: now().getTime(), period_type: 'NORMAL',
    };
    return { ok: true, transactionId: event.transaction_id, outcome: await handleRevenueCat(db, event, now()) };
  });
}
