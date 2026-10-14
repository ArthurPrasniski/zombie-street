import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { MEMBERSHIP } from '@zombie-road/shared/catalog';
import { call, guest, setup, webhook } from './helpers';

const OCT = Date.parse('2026-10-14T12:00:00Z');
const NOV = Date.parse('2026-11-14T12:00:00Z');
const DEC = Date.parse('2026-12-14T12:00:00Z');

describe('assinatura mensal', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let n = 0;
  before(async () => { ctx = await setup('2026-10-14T12:00:00Z'); });
  after(() => ctx.close());
  const account = () => guest(ctx.app, `membership-device-${++n}`);
  const state = async (token: string) => (await call(ctx.app, 'GET', '/membership', token)).body;
  const gems = async (token: string) => (await call(ctx.app, 'GET', '/wallet', token)).body.gems;
  const event = (userId: string, tx: string, extra: Record<string, unknown> = {}) => ({
    type: 'INITIAL_PURCHASE', app_user_id: userId, product_id: MEMBERSHIP.productId,
    transaction_id: tx, purchased_at_ms: OCT, expiration_at_ms: NOV, event_timestamp_ms: OCT, ...extra,
  });

  it('exige sessão e contas novas não têm benefícios', async () => {
    assert.equal((await call(ctx.app, 'GET', '/membership')).status, 401);
    const user = await account();
    assert.deepEqual(await state(user.token), { userId: user.id, active: false, expiresAt: null, autoRenew: false, grants: [] });
  });

  it('primeira compra entrega gemas, moedas e remove anúncios sem liberar o passe', async () => {
    const user = await account();
    const res = await webhook(ctx.app, event(user.id, 'member-first'));
    assert.equal(res.json().outcome, 'membership');
    assert.equal(await gems(user.token), 500);
    const member = await state(user.token);
    assert.equal(member.active, true);
    assert.equal(member.expiresAt, new Date(NOV).toISOString());
    assert.equal(member.autoRenew, true);
    assert.deepEqual(member.grants, [{ id: 'member-first', coins: 10000, refunded: false }]);
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
    // Nem um novo id de evento pode duplicar uma mesma cobrança.
    await webhook(ctx.app, event(user.id, 'member-first'));
    assert.equal(await gems(user.token), 500);
    assert.equal((await state(user.token)).grants.length, 1);
  });

  it('renovação gera outro pacote, mas cancelar mantém acesso até a expiração', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'renew-first'));
    await webhook(ctx.app, event(user.id, 'renew-second', { type: 'RENEWAL', purchased_at_ms: NOV, expiration_at_ms: DEC, event_timestamp_ms: NOV }));
    assert.equal(await gems(user.token), 1000);
    assert.equal((await state(user.token)).grants.length, 2);
    await webhook(ctx.app, event(user.id, 'renew-second', { type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE', purchased_at_ms: NOV, expiration_at_ms: DEC, event_timestamp_ms: NOV + 1000 }));
    const member = await state(user.token);
    assert.equal(member.active, true);
    assert.equal(member.autoRenew, false);
    assert.equal(member.expiresAt, new Date(DEC).toISOString());
    ctx.clock.now = new Date(DEC);
    assert.equal((await state(user.token)).active, false);
    ctx.clock.now = new Date(OCT);
  });

  it('expiração atrasada de um ciclo antigo não revoga uma renovação mais nova', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'order-renewal', { type: 'RENEWAL', purchased_at_ms: NOV, expiration_at_ms: DEC, event_timestamp_ms: NOV }));
    await webhook(ctx.app, event(user.id, 'order-old', { type: 'EXPIRATION', event_timestamp_ms: DEC + 1000 }));
    await webhook(ctx.app, event(user.id, 'order-old', { event_timestamp_ms: OCT }));
    assert.equal((await state(user.token)).expiresAt, new Date(DEC).toISOString());
    assert.equal(await gems(user.token), 1000);
  });

  it('reembolso revoga acesso e recompensa uma vez; evento antigo não reativa', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'refunded'));
    const refund = event(user.id, 'refunded', { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', event_timestamp_ms: OCT + 1000 });
    await webhook(ctx.app, refund);
    await webhook(ctx.app, refund);
    await webhook(ctx.app, event(user.id, 'refunded'));
    assert.equal(await gems(user.token), 0);
    const member = await state(user.token);
    assert.equal(member.active, false);
    assert.equal(member.grants[0].refunded, true);
  });

  it('reembolso recebido antes da compra impede a entrega tardia do pacote', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'refund-first', { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', event_timestamp_ms: OCT + 1000 }));
    await webhook(ctx.app, event(user.id, 'refund-first'));
    assert.equal(await gems(user.token), 0);
    assert.equal((await state(user.token)).active, false);
  });

  it('reativar renovação e estender período não concedem pacote extra', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'extend'));
    await webhook(ctx.app, event(user.id, 'extend', { type: 'UNCANCELLATION', event_timestamp_ms: OCT + 1000 }));
    await webhook(ctx.app, event(user.id, 'extend', { type: 'SUBSCRIPTION_EXTENDED', expiration_at_ms: DEC, event_timestamp_ms: OCT + 2000 }));
    assert.equal(await gems(user.token), 500);
    assert.equal((await state(user.token)).expiresAt, new Date(DEC).toISOString());
    assert.equal((await state(user.token)).grants.length, 1);
  });

  it('período de teste libera acesso, mas o pacote só chega quando há cobrança', async () => {
    const user = await account();
    await webhook(ctx.app, event(user.id, 'trial', { period_type: 'TRIAL' }));
    assert.equal((await state(user.token)).active, true);
    assert.equal(await gems(user.token), 0);
    assert.equal((await state(user.token)).grants.length, 0);
  });

  it('convidado mantém a assinatura ao entrar em uma conta já existente', async () => {
    const target = await account();
    const identity = `membership-google-${n}`;
    await call(ctx.app, 'POST', '/auth/google', target.token, { idToken: identity });
    const visitor = await account();
    await webhook(ctx.app, event(visitor.id, 'guest-subscription'));
    const login = await call(ctx.app, 'POST', '/auth/google', visitor.token, { idToken: identity });
    assert.equal(login.body.user.id, target.id);
    assert.equal(await gems(login.body.token), 500);
    assert.equal((await state(login.body.token)).active, true);
    await webhook(ctx.app, event(target.id, 'guest-subscription'));
    assert.equal(await gems(login.body.token), 500);
    assert.equal((await state(login.body.token)).grants.length, 1);
  });

  it('compra simulada entrega os mesmos benefícios em desenvolvimento', async () => {
    const user = await account();
    const res = await call(ctx.app, 'POST', '/dev/purchase', user.token, { productId: MEMBERSHIP.productId });
    assert.equal(res.status, 200);
    assert.equal((await state(user.token)).active, true);
    assert.equal(await gems(user.token), 500);
  });
});
