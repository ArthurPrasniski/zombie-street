import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { call, guest, setup, webhook } from './helpers';

describe('contas', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  before(async () => {
    ctx = await setup();
  });
  after(() => ctx.close());

  it('o mesmo aparelho volta para o mesmo convidado; id curto é recusado', async () => {
    const a = await guest(ctx.app, 'aparelho-AAAA-0001');
    const b = await guest(ctx.app, 'aparelho-AAAA-0001');
    assert.equal(a.id, b.id);
    assert.equal((await call(ctx.app, 'POST', '/auth/guest', null, { deviceId: 'curto' })).status, 400);
  });

  it('sem sessão: 401', async () => {
    assert.equal((await call(ctx.app, 'GET', '/me')).status, 401);
    assert.equal((await call(ctx.app, 'GET', '/me', 'lixo')).status, 401);
  });

  it('login com Google estando como convidado vincula a mesma conta', async () => {
    const g = await guest(ctx.app, 'aparelho-BBBB-0002');
    const res = await call(ctx.app, 'POST', '/auth/google', g.token, { idToken: 'google-maria' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.id, g.id);
    assert.deepEqual(res.body.user.providers, ['google']);
    assert.equal(res.body.user.email, 'google-maria@mail.com');
    assert.equal(res.body.switched, false);
    // Depois de vincular, o aparelho ganha um convidado novo (é o que "Sair" faz)
    const after = await guest(ctx.app, 'aparelho-BBBB-0002');
    assert.notEqual(after.id, g.id);
  });

  it('Google já conhecido em outro aparelho: troca de conta e leva as gemas do convidado', async () => {
    const first = await guest(ctx.app, 'aparelho-CCCC-0003');
    await call(ctx.app, 'POST', '/auth/google', first.token, { idToken: 'google-joao' });
    const other = await guest(ctx.app, 'aparelho-DDDD-0004');
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: other.id, product_id: 'zr_gems_80', transaction_id: 't-merge' });
    const res = await call(ctx.app, 'POST', '/auth/google', other.token, { idToken: 'google-joao' });
    assert.equal(res.body.user.id, first.id);
    assert.equal(res.body.switched, true);
    assert.equal((await call(ctx.app, 'GET', '/wallet', res.body.token)).body.gems, 80);
    // O convidado foi absorvido e não existe mais
    assert.equal((await call(ctx.app, 'GET', '/me', other.token)).status, 401);
  });

  it('Apple sem sessão cria conta; o nome do primeiro login fica salvo', async () => {
    const res = await call(ctx.app, 'POST', '/auth/apple', null, { identityToken: 'apple-ana', name: 'Ana' });
    assert.deepEqual(res.body.user.providers, ['apple']);
    assert.equal(res.body.user.name, 'Ana');
  });

  it('excluir conta apaga tudo', async () => {
    const g = await guest(ctx.app, 'aparelho-EEEE-0005');
    assert.equal((await call(ctx.app, 'DELETE', '/me', g.token)).status, 204);
    assert.equal((await call(ctx.app, 'GET', '/me', g.token)).status, 401);
  });
});
