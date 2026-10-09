import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { COIN_PACKS, coinPackCoins } from '@zombie-road/shared/catalog';
import { call, guest, setup, webhook } from './helpers';

describe('gemas e loja', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let user: { token: string; id: string };
  const gems = async () => (await call(ctx.app, 'GET', '/wallet', user.token)).body.gems as number;
  before(async () => {
    ctx = await setup();
    user = await guest(ctx.app);
  });
  after(() => ctx.close());

  it('webhook sem a senha do RevenueCat: 401', async () => {
    const res = await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_80', transaction_id: 't0' }, 'Bearer errado');
    assert.equal(res.statusCode, 401);
    assert.equal(await gems(), 0);
  });

  it('compra de gemas credita uma vez, mesmo com evento repetido', async () => {
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_500', transaction_id: 't1' });
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_500', transaction_id: 't1' });
    assert.equal(await gems(), 500);
  });

  it('trocar gemas por moedas: desconta, devolve as moedas e não cobra de novo o mesmo pedido', async () => {
    const body = { pack: 'chest', stage: 20, requestId: 'pedido-0001' };
    const first = await call(ctx.app, 'POST', '/shop/coins', user.token, body);
    assert.equal(first.status, 200);
    assert.equal(first.body.coins, coinPackCoins('chest', 20));
    assert.equal(first.body.gems, 500 - COIN_PACKS.chest.gems);
    const again = await call(ctx.app, 'POST', '/shop/coins', user.token, body);
    assert.deepEqual(again.body, first.body);
    assert.equal(await gems(), 500 - COIN_PACKS.chest.gems);
  });

  it('sem gemas suficientes: 402', async () => {
    const res = await call(ctx.app, 'POST', '/shop/coins', user.token, { pack: 'vault', stage: 1, requestId: 'pedido-0002' });
    assert.equal(res.status, 402);
  });

  it('reembolso tira as gemas sem deixar negativo; compra de quem não conhecemos fica sem dono', async () => {
    await webhook(ctx.app, { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: user.id, product_id: 'zr_gems_500', transaction_id: 't1' });
    assert.equal(await gems(), 0);
    const res = await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: '$RCAnonymousID:abc', product_id: 'zr_gems_80', transaction_id: 't9' });
    assert.equal(res.json().outcome, 'unknown-user');
  });
});
