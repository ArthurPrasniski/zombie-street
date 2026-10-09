import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { PASS_PRODUCT_ID } from '../../shared/catalog';
import { PASS_DAILY_XP, passReward, XP_PER_TIER } from '../../shared/pass';
import { call, guest, setup, webhook } from './helpers';

describe('Passe de Batalha', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let user: { token: string; id: string };
  before(async () => {
    ctx = await setup('2026-10-09T12:00:00Z');
    user = await guest(ctx.app);
  });
  after(() => ctx.close());

  it('XP respeita o teto do dia e volta a contar no dia seguinte', async () => {
    let res = await call(ctx.app, 'POST', '/pass/xp', user.token, { amount: 5000 });
    assert.equal(res.body.xp, PASS_DAILY_XP);
    assert.equal(res.body.tier, PASS_DAILY_XP / XP_PER_TIER);
    res = await call(ctx.app, 'POST', '/pass/xp', user.token, { amount: 50 });
    assert.equal(res.body.xp, PASS_DAILY_XP);
    ctx.clock.now = new Date('2026-10-10T12:00:00Z');
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

  it('a trilha premium exige o passe ativo; com a assinatura, as gemas entram na carteira', async () => {
    assert.equal((await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 5, track: 'premium', stage: 10 })).status, 409);
    const until = new Date('2026-11-09T12:00:00Z').getTime();
    await webhook(ctx.app, { type: 'INITIAL_PURCHASE', app_user_id: user.id, product_id: PASS_PRODUCT_ID, expiration_at_ms: until });
    const res = await call(ctx.app, 'POST', '/pass/claim', user.token, { tier: 5, track: 'premium', stage: 10 });
    assert.equal(res.status, 200);
    assert.equal(res.body.pass.premium, true);
    assert.deepEqual(res.body.reward, { kind: 'gems', amount: 40 });
    assert.equal(res.body.gems, 40);
  });

  it('a assinatura expirada tira o premium; a temporada nova recomeça', async () => {
    await webhook(ctx.app, { type: 'EXPIRATION', app_user_id: user.id, product_id: PASS_PRODUCT_ID });
    assert.equal((await call(ctx.app, 'GET', '/pass', user.token)).body.premium, false);
    ctx.clock.now = new Date('2026-11-01T00:00:01Z');
    const res = await call(ctx.app, 'GET', '/pass', user.token);
    assert.equal(res.body.season, '2026-11');
    assert.equal(res.body.xp, 0);
  });
});
