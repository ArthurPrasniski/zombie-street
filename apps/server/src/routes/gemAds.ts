import type { FastifyInstance } from 'fastify';
import type { Deps } from '../app';
import { HttpError } from '../errors';
import { createAdVerifier } from '../ads/verify';
import { cancelGemAd, gemAdState, gemAdTicket, grantGemAd, reserveGemAd } from '../store/gemAds';

const id = { type: 'string', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' };
const params = { type: 'object', required: ['requestId'], properties: { requestId: id } };
export function gemAdRoutes(app: FastifyInstance, deps: Deps): void {
  const { db, config, sessions, now } = deps;
  const available = config.devRoutes || config.admobRewardedUnitIds.length > 0;
  const verify = createAdVerifier();
  app.get('/rewards/gems', async (req) => gemAdState(db, await sessions.verify(req.headers.authorization), now(), available));
  app.post<{ Body: { requestId: string } }>('/rewards/gems', { schema: { body: params } }, async (req) => {
    const userId = await sessions.verify(req.headers.authorization);
    if (!available) throw new HttpError(503, 'anúncios de gemas indisponíveis');
    return reserveGemAd(db, userId, req.body.requestId, now());
  });
  app.get<{ Params: { requestId: string } }>('/rewards/gems/:requestId', { schema: { params } }, async (req) => gemAdTicket(db, await sessions.verify(req.headers.authorization), req.params.requestId));
  app.delete<{ Params: { requestId: string } }>('/rewards/gems/:requestId', { schema: { params } }, async (req) => {
    await cancelGemAd(db, await sessions.verify(req.headers.authorization), req.params.requestId);
    return { ok: true };
  });
  app.get('/webhooks/admob', async (req) => {
    if (!config.admobRewardedUnitIds.length) throw new HttpError(503, 'anúncios de gemas indisponíveis');
    const proof = await verify(req.raw.url!);
    if (!config.admobRewardedUnitIds.includes(proof.adUnit)) throw new HttpError(403, 'unidade de anúncio inválida');
    if (!proof.userId || !proof.requestId) return { ok: true, ignored: true };
    await grantGemAd(db, proof.userId, proof.requestId, proof.transactionId, proof.earnedAt, now());
    return { ok: true };
  });
  if (config.devRoutes) app.post<{ Params: { requestId: string } }>('/dev/rewards/gems/:requestId', { schema: { params } }, async (req) => {
    const userId = await sessions.verify(req.headers.authorization);
    await grantGemAd(db, userId, req.params.requestId, `dev-${req.params.requestId}`, now(), now());
    return gemAdTicket(db, userId, req.params.requestId);
  });
}
