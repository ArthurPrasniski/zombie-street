import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { deliverPushes } from '../src/push/deliver';
import type { PushMessage, PushResult, PushSender } from '../src/push/expo';
import { queueSeasonStart } from '../src/push/worker';
import { call, guest, setup, webhook } from './helpers';

// São Paulo (UTC-3): 12:00Z = 9h, 06:00Z = 3h (madrugada)
const TZ = 'America/Sao_Paulo';
const PREFS = { progress: true, pass: true, shop: true, news: true };
const ADMIN = 'segredo-admin';

/** Serviço de push falso: guarda as mensagens; `fail` marca tokens que não existem mais. */
function fakeSender() {
  const sent: PushMessage[] = [];
  const unregistered = new Set<string>();
  const send: PushSender = async (messages) => {
    sent.push(...messages);
    return messages.map((m): PushResult => (unregistered.has(m.to) ? { ok: false, error: 'DeviceNotRegistered', unregistered: true } : { ok: true }));
  };
  return { send, sent, unregistered };
}

describe('notificações remotas', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let user: { token: string; id: string };
  let push: ReturnType<typeof fakeSender>;
  const register = (token: string, prefs = PREFS, who = user) => call(ctx.app, 'POST', '/push/token', who.token, { token, platform: 'ios', timeZone: TZ, prefs });
  const at = (iso: string) => (ctx.clock.now = new Date(iso));
  const deliver = () => deliverPushes(ctx.db, push.send, ctx.clock.now);
  const admin = (body: object, auth: string | null = ADMIN) =>
    ctx.app.inject({ method: 'POST', url: '/admin/push', headers: auth ? { authorization: `Bearer ${auth}` } : {}, payload: body });
  const buyGems = (tx: string) => webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_500', transaction_id: tx });

  before(async () => {
    ctx = await setup('2026-10-09T12:00:00Z', { ADMIN_TOKEN: ADMIN });
  });
  after(() => ctx.close());
  beforeEach(async () => {
    await ctx.db.exec('delete from push_outbox; delete from push_tokens; delete from push_broadcasts');
    user = await guest(ctx.app, `aparelho-push-${Math.random()}`);
    push = fakeSender();
    at('2026-10-09T12:00:00Z');
  });

  it('registrar o aparelho: pede sessão, token da Expo e fuso válido', async () => {
    assert.equal((await call(ctx.app, 'POST', '/push/token', null, { token: 'ExponentPushToken[a1]', platform: 'ios', timeZone: TZ, prefs: PREFS })).status, 401);
    assert.equal((await register('qualquer-coisa')).status, 400);
    assert.equal((await call(ctx.app, 'POST', '/push/token', user.token, { token: 'ExponentPushToken[a1]', platform: 'ios', timeZone: 'Lua/Base', prefs: PREFS })).status, 400);
    assert.equal((await register('ExponentPushToken[a1]')).status, 200);
    // O mesmo aparelho em outra conta (entrou com o Google): o token muda de dono
    const other = await guest(ctx.app, 'aparelho-push-outro');
    await register('ExponentPushToken[a1]', PREFS, other);
    const rows = await ctx.db.query<{ user_id: string }>('select user_id from push_tokens');
    assert.deepEqual(rows.map((r) => r.user_id), [other.id]);
  });

  it('compra confirmada chega na hora, até de madrugada, e abre a loja', async () => {
    await register('ExponentPushToken[a1]');
    at('2026-10-09T06:00:00Z');
    await buyGems('tx-push-1');
    await buyGems('tx-push-1'); // webhook repetido: um aviso só
    assert.deepEqual(await deliver(), { sent: 1 });
    assert.equal(push.sent.length, 1);
    assert.equal(push.sent[0].to, 'ExponentPushToken[a1]');
    assert.match(push.sent[0].body, /500 gemas/);
    assert.deepEqual(push.sent[0].data, { kind: 'purchase', url: '/shop' });
    assert.deepEqual(await deliver(), {});
  });

  it('problema na cobrança do passe: espera a janela do dia', async () => {
    await register('ExponentPushToken[a1]');
    at('2026-10-09T06:00:00Z');
    const res = await webhook(ctx.app, { type: 'BILLING_ISSUE', app_user_id: user.id, product_id: 'zr_pass_monthly' });
    assert.equal(res.json().outcome, 'billing');
    assert.deepEqual(await deliver(), {});
    at('2026-10-09T13:00:00Z');
    assert.deepEqual(await deliver(), { sent: 1 });
    assert.equal(push.sent[0].data.url, '/pass');
  });

  it('categoria desligada ou sem aparelho: não manda', async () => {
    await register('ExponentPushToken[a1]', { ...PREFS, shop: false });
    await buyGems('tx-push-2');
    // Outra conta, sem aparelho registrado
    user = await guest(ctx.app, 'aparelho-sem-push');
    await buyGems('tx-push-3');
    assert.deepEqual(await deliver(), { 'opted-out': 1, 'no-device': 1 });
    assert.equal(push.sent.length, 0);
  });

  it('no máximo 1 aviso não urgente por dia', async () => {
    await register('ExponentPushToken[a1]');
    at('2026-11-01T14:00:00Z');
    assert.equal(await queueSeasonStart(ctx.db, ctx.clock.now), 1);
    assert.equal((await admin({ id: 'n1', title: 'Novidade', body: 'Mundo novo!' })).statusCode, 200);
    assert.deepEqual(await deliver(), { sent: 1 });
    assert.match(push.sent[0].body, /novembro/);
    at('2026-11-01T20:00:00Z');
    assert.deepEqual(await deliver(), {});
    at('2026-11-02T14:00:00Z');
    assert.deepEqual(await deliver(), { sent: 1 });
    assert.equal(push.sent[1].title, 'Novidade');
  });

  it('temporada nova: uma vez, só nos primeiros dias do mês', async () => {
    await register('ExponentPushToken[a1]');
    assert.equal(await queueSeasonStart(ctx.db, new Date('2026-11-01T00:30:00Z')), 1);
    assert.equal(await queueSeasonStart(ctx.db, new Date('2026-11-02T00:30:00Z')), 0);
    assert.equal(await queueSeasonStart(ctx.db, new Date('2026-12-05T12:00:00Z')), 0);
  });

  it('aviso para todos: só com a senha e com rota do app', async () => {
    await register('ExponentPushToken[a1]');
    assert.equal((await admin({ id: 'n2', title: 'Oi', body: 'Teste' }, null)).statusCode, 401);
    assert.equal((await admin({ id: 'n2', title: 'Oi', body: 'Teste', url: 'https://golpe.com' })).statusCode, 400);
    assert.equal((await admin({ id: 'n2', title: 'Oi', body: 'Teste', url: '/garage' })).json().queued, 1);
    assert.equal((await admin({ id: 'n2', title: 'Oi', body: 'Teste' })).json().queued, 0);
    await deliver();
    assert.equal(push.sent[0].data.url, '/garage');
  });

  it('aparelho que não existe mais sai da lista; aviso velho vence', async () => {
    await register('ExponentPushToken[velho]');
    push.unregistered.add('ExponentPushToken[velho]');
    await buyGems('tx-push-4');
    assert.deepEqual(await deliver(), { error: 1 });
    assert.equal((await ctx.db.query('select token from push_tokens')).length, 0);

    await register('ExponentPushToken[a1]');
    at('2026-10-09T06:00:00Z');
    await webhook(ctx.app, { type: 'BILLING_ISSUE', app_user_id: user.id, product_id: 'zr_pass_monthly' });
    at('2026-10-12T07:00:00Z');
    assert.deepEqual(await deliver(), { expired: 1 });
  });

  it('desligar o aparelho e excluir a conta apagam o token', async () => {
    await register('ExponentPushToken[a1]');
    assert.equal((await call(ctx.app, 'DELETE', '/push/token', user.token, { token: 'ExponentPushToken[a1]' })).status, 200);
    assert.equal((await ctx.db.query('select token from push_tokens')).length, 0);
    await register('ExponentPushToken[a2]');
    await call(ctx.app, 'DELETE', '/me', user.token);
    assert.equal((await ctx.db.query('select token from push_tokens')).length, 0);
  });
});
