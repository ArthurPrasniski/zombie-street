import assert from 'node:assert/strict';
import { randomUUID, generateKeyPairSync, sign } from 'node:crypto';
import { after, before, describe, it, mock } from 'node:test';
import { GEM_AD_REWARD, GEM_ADS_PER_DAY, MEMBERSHIP } from '@zombie-road/shared/catalog';
import { verifyAdSignature } from '../src/ads/verify';
import { call, guest, setup, webhook } from './helpers';

describe('gemas por anúncios', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  before(async () => { ctx = await setup('2026-10-19T12:00:00Z', { ADMOB_REWARDED_UNIT_IDS: 'ca-app-pub-123/456' }); });
  after(() => ctx.close());
  const reserve = (token: string, requestId = randomUUID()) => call(ctx.app, 'POST', '/rewards/gems', token, { requestId });
  const earn = (token: string, requestId: string) => call(ctx.app, 'POST', `/dev/rewards/gems/${requestId}`, token);
  it('exige sessão e não aceita valores ou contadores do aparelho', async () => {
    assert.equal((await call(ctx.app, 'GET', '/rewards/gems')).status, 401);
    const user = await guest(ctx.app, randomUUID());
    assert.equal((await call(ctx.app, 'POST', '/rewards/gems', user.token, { requestId: 'invalid' })).status, 400);
    const result = await call(ctx.app, 'GET', '/rewards/gems', user.token);
    assert.equal(result.body.reward, 20);
    assert.equal(result.body.limit, 5);
    const reservation = await reserve(user.token);
    assert.equal(reservation.body.status, 'pending');
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 0);
  });
  it('credita 20 uma única vez e mantém o limite entre sessões e após meia-noite UTC', async () => {
    const user = await guest(ctx.app, randomUUID());
    for (let i = 0; i < GEM_ADS_PER_DAY; i++) {
      const ticket = await reserve(user.token);
      assert.equal(ticket.status, 200);
      assert.equal((await earn(user.token, ticket.body.requestId)).body.status, 'earned');
      await earn(user.token, ticket.body.requestId);
      await reserve(user.token, ticket.body.requestId);
    }
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 100);
    assert.equal((await reserve(user.token)).status, 429);
    const state = await call(ctx.app, 'GET', '/rewards/gems', user.token);
    assert.equal(state.body.used, 5);
    assert.equal(state.body.remaining, 0);
    assert.equal(state.body.resetsAt, '2026-10-20T00:00:00.000Z');
    ctx.clock.now = new Date('2026-10-20T00:00:01Z');
    assert.equal((await call(ctx.app, 'GET', '/rewards/gems', user.token)).body.remaining, 5);
    const ticket = await reserve(user.token);
    await earn(user.token, ticket.body.requestId);
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 120);
  });
  it('reservas simultâneas não excedem cinco; cancelar sem assistir não entrega gemas', async () => {
    const user = await guest(ctx.app, randomUUID());
    const results = await Promise.all(Array.from({ length: 7 }, () => reserve(user.token)));
    assert.equal(results.filter((r) => r.status === 200).length, 5);
    assert.equal(results.filter((r) => r.status === 429).length, 2);
    const requestId = results.find((r) => r.status === 200)!.body.requestId;
    await call(ctx.app, 'DELETE', `/rewards/gems/${requestId}`, user.token);
    assert.equal((await reserve(user.token)).status, 200);
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 0);
  });
  it('não permite consultar nem concluir uma reserva de outra conta', async () => {
    const user = await guest(ctx.app, randomUUID());
    const other = await guest(ctx.app, randomUUID());
    const ticket = await reserve(user.token);
    assert.equal((await call(ctx.app, 'GET', `/rewards/gems/${ticket.body.requestId}`, other.token)).status, 404);
    assert.equal((await earn(other.token, ticket.body.requestId)).status, 404);
    assert.equal((await reserve(other.token, ticket.body.requestId)).status, 409);
  });
  it('assinante recebe apenas o pacote mensal; expiração devolve acesso a anúncios', async () => {
    const user = await guest(ctx.app, randomUUID());
    const now = ctx.clock.now.getTime();
    await webhook(ctx.app, { type: 'INITIAL_PURCHASE', app_user_id: user.id, product_id: MEMBERSHIP.productId, transaction_id: randomUUID(), purchased_at_ms: now, expiration_at_ms: now + 1000, event_timestamp_ms: now, period_type: 'NORMAL' });
    assert.equal((await reserve(user.token)).status, 409);
    assert.equal((await call(ctx.app, 'GET', '/rewards/gems', user.token)).body.member, true);
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 500);
    ctx.clock.now = new Date(now + 1001);
    assert.equal((await reserve(user.token)).status, 200);
  });
  it('callback assinado entrega uma vez; assinatura alterada, unidade errada e replay entre reservas são rejeitados', async () => {
    const user = await guest(ctx.app, randomUUID());
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const keys = [{ keyId: 7, pem: publicKey.export({ type: 'spki', format: 'pem' }).toString() }];
    const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ keys }));
    try {
      const ticket = await reserve(user.token);
      const make = (requestId: string, unit = '456') => {
        const data = new URLSearchParams({ ad_unit: unit, custom_data: requestId, reward_amount: '9999', reward_item: 'gems', timestamp: String(ctx.clock.now.getTime()), transaction_id: 'signedtx', user_id: user.id }).toString();
        return `/webhooks/admob?${data}&signature=${sign('sha256', Buffer.from(data), privateKey).toString('base64url')}&key_id=7`;
      };
      const url = make(ticket.body.requestId);
      assert.equal(verifyAdSignature(url, keys).requestId, ticket.body.requestId);
      assert.throws(() => verifyAdSignature(url.replace('reward_amount=9999', 'reward_amount=1'), keys));
      assert.equal((await call(ctx.app, 'GET', url)).status, 200);
      assert.equal((await call(ctx.app, 'GET', make(ticket.body.requestId, 'ca-app-pub-123/456'))).status, 200);
      assert.equal((await call(ctx.app, 'GET', url)).status, 200);
      assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, GEM_AD_REWARD);
      const second = await reserve(user.token);
      assert.equal((await call(ctx.app, 'GET', make(second.body.requestId))).status, 409);
      assert.equal((await call(ctx.app, 'GET', make(second.body.requestId, '999'))).status, 403);
      assert.equal((await call(ctx.app, 'GET', url.replace('signedtx', 'tampered'))).status, 401);
      const replayData = new URLSearchParams({ ad_unit: '456', reward_amount: '20', reward_item: 'gems', timestamp: String(ctx.clock.now.getTime()), transaction_id: 'replay-ad' }).toString();
      const replayUrl = `/webhooks/admob?${replayData}&signature=${sign('sha256', Buffer.from(replayData), privateKey).toString('base64url')}&key_id=7`;
      assert.equal((await call(ctx.app, 'GET', replayUrl)).body.ignored, true);
      assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, GEM_AD_REWARD);
    } finally { fetch.mock.restore(); }
  });
  it('sem prova válida não credita nem permite finalizar pelo cliente em produção', async () => {
    const isolated = await setup('2026-10-19T12:00:00Z', { DEV_ROUTES: '0', ADMOB_REWARDED_UNIT_IDS: '456' });
    try {
      const user = await guest(isolated.app, randomUUID());
      const ticket = await call(isolated.app, 'POST', '/rewards/gems', user.token, { requestId: randomUUID() });
      assert.equal((await call(isolated.app, 'POST', `/dev/rewards/gems/${ticket.body.requestId}`, user.token)).status, 404);
      assert.equal((await call(isolated.app, 'GET', '/webhooks/admob?user_id=forged')).status, 401);
      assert.equal((await call(isolated.app, 'GET', '/wallet', user.token)).body.gems, 0);
    } finally { await isolated.close(); }
  });
});
