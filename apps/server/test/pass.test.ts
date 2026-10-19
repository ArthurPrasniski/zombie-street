import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { LEGACY_PASS_PRODUCT_ID, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';
import { PASS_DAILY_XP, passReward, XP_PER_TIER } from '@zombie-road/shared/pass';
import { migrate } from '../src/migrate';
import { call, guest, setup, webhook } from './helpers';

describe('Passe de Batalha', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let user: { token: string; id: string };
  before(async () => {
    ctx = await setup('2026-10-13T12:00:00Z');
    user = await guest(ctx.app);
  });
  after(() => ctx.close());

  it('XP respeita o teto do dia e volta a contar no dia seguinte', async () => {
    let res = await call(ctx.app, 'POST', '/pass/xp', user.token, { amount: 5000 });
    assert.equal(res.body.xp, PASS_DAILY_XP);
    assert.equal(res.body.tier, PASS_DAILY_XP / XP_PER_TIER);
    res = await call(ctx.app, 'POST', '/pass/xp', user.token, { amount: 50 });
    assert.equal(res.body.xp, PASS_DAILY_XP);
    ctx.clock.now = new Date('2026-10-14T12:00:00Z');
    res = await call(ctx.app, 'POST', '/pass/xp', user.token, { amount: 50 });
    assert.equal(res.body.xp, PASS_DAILY_XP + 50);
  });

  it('resgata a trilha grátis uma vez (o pedido repetido devolve o mesmo prêmio); nível não alcançado: 409', async () => {
    const ok = await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 1, track: 'free', stage: 10 });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body.reward, passReward(1, 'free', 10));
    assert.deepEqual(ok.body.pass.claimedFree, [1]);
    // O mesmo pedido de novo devolve o mesmo prêmio (o app não soma duas vezes)
    const again = await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 1, track: 'free', stage: 10 });
    assert.equal(again.status, 200);
    assert.deepEqual(again.body.reward, ok.body.reward);
    assert.equal((await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 20, track: 'free', stage: 10 })).status, 409);
  });

  it('compra única libera a trilha premium e os níveis já alcançados até o fim da temporada', async () => {
    assert.equal((await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 5, track: 'premium', stage: 10 })).status, 409);
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-first', purchased_at_ms: ctx.clock.now.getTime() });
    const res = await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 5, track: 'premium', stage: 10 });
    assert.equal(res.status, 200);
    assert.equal(res.body.pass.premium, true);
    assert.equal(res.body.pass.premiumUntil, '2027-01-11T00:00:00.000Z');
    assert.deepEqual(res.body.reward, { kind: 'gems', amount: 40 });
    assert.equal(res.body.gems, 40);
  });

  it('virar o mês não apaga o XP nem encerra o passe', async () => {
    ctx.clock.now = new Date('2026-11-01T00:00:01Z');
    const res = await call(ctx.app, 'GET', '/pass', user.token);
    assert.equal(res.body.season, '2026-10-13');
    assert.equal(res.body.premium, true);
    assert.equal(res.body.xp, PASS_DAILY_XP + 50);
    assert.deepEqual(res.body.claimedPremium, [5]);
  });

  it('no fim dos 90 dias, o premium expira e a próxima temporada recomeça', async () => {
    ctx.clock.now = new Date('2027-01-11T00:00:00Z');
    const res = await call(ctx.app, 'GET', '/pass', user.token);
    assert.equal(res.body.season, '2027-01-11');
    assert.equal(res.body.startsAt, '2027-01-11T00:00:00.000Z');
    assert.equal(res.body.premium, false);
    assert.equal(res.body.xp, 0);
    assert.deepEqual(res.body.claimedFree, []);
    assert.deepEqual(res.body.claimedPremium, []);
  });

  it('webhook atrasado ou transação repetida não libera a próxima temporada', async () => {
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-late', purchased_at_ms: new Date('2027-01-10T23:59:59Z').getTime() });
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-first', purchased_at_ms: ctx.clock.now.getTime() });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
  });

  it('pode comprar novamente na temporada seguinte; reembolso antigo não tira o passe novo', async () => {
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-next', purchased_at_ms: ctx.clock.now.getTime() });
    await webhook(ctx.app, { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-first' });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, true);
    await webhook(ctx.app, { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-next' });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
  });

  it('reembolso recebido antes da compra impede que o webhook atrasado reative o passe', async () => {
    const event = { app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-refunded-first', purchased_at_ms: ctx.clock.now.getTime() };
    await webhook(ctx.app, { ...event, type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' });
    await webhook(ctx.app, { ...event, type: 'NON_RENEWING_PURCHASE' });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
  });

  it('renovação e compra sem data não ativam o novo produto', async () => {
    await webhook(ctx.app, { type: 'RENEWAL', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-renewal', expiration_at_ms: ctx.clock.now.getTime() + 86400000 });
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, transaction_id: 'pass-no-date' });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
  });

  it('honra o período já pago do produto mensal antigo', async () => {
    const until = new Date('2027-01-15T12:00:00Z').getTime();
    await webhook(ctx.app, { type: 'INITIAL_PURCHASE', app_user_id: user.id, product_id: LEGACY_PASS_PRODUCT_ID, expiration_at_ms: until });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premiumUntil, new Date(until).toISOString());
    await webhook(ctx.app, { type: 'EXPIRATION', app_user_id: user.id, product_id: LEGACY_PASS_PRODUCT_ID });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
  });

  it('passe e gemas não podem mais ser comprados nem na simulação', async () => {
    const result = await call(ctx.app, 'POST', '/dev/purchase', user.token, { productId: PASS_PRODUCT_ID });
    assert.equal(result.status, 400);
    assert.equal((await call(ctx.app, 'POST', '/dev/purchase', user.token, { productId: 'zr_gems_80' })).status, 400);
  });

  it('migração conserva XP, resgates e teto diário do passe mensal de outubro', async () => {
    // Simula o estado de uma instalação com as duas migrações antigas já aplicadas.
    await ctx.db.exec("drop table pass_purchases; delete from schema_migrations where name = '003_season_pass.sql'");
    const other = await guest(ctx.app, 'aparelho-passe-migrado');
    await ctx.db.query(
      `insert into pass_progress (user_id, season, xp, claimed_free, claimed_premium, xp_day, xp_today)
       values ($1, '2026-10', 1200, '{1,2}', '{5}', '2026-10-13', 400)`,
      [other.id],
    );
    assert.deepEqual(await migrate(ctx.db), ['003_season_pass.sql']);
    ctx.clock.now = new Date('2026-10-13T12:00:00Z');
    const state = (await call(ctx.app, 'GET', '/pass', other.token)).body;
    assert.equal(state.xp, 1200);
    assert.equal(state.xpToday, 400);
    assert.deepEqual(state.claimedFree, [1, 2]);
    assert.deepEqual(state.claimedPremium, [5]);
  });
});
