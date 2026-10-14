import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { loadConfig } from '../src/config';
import { createMonitor, discordMessage, type MonitorEvent } from '../src/discord/events';
import { deliverDiscordEvent, discordSender } from '../src/discord/worker';
import { call, guest, setup, webhook } from './helpers';

const url = 'https://discord.com/api/webhooks/123/test-token';
const env = { NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(64), DATABASE_URL: 'postgresql://test:test@db:5432/test', DISCORD_WEBHOOK_URL: url };

describe('avisos Discord', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  const rows = () => ctx.db.query<{ payload: MonitorEvent; attempts: number; sent_at: Date | null; available_at: Date; last_error: string | null }>('select * from discord_outbox order by id');
  before(async () => { ctx = await setup('2026-10-14T12:00:00Z', env); });
  after(() => ctx.close());
  beforeEach(() => ctx.db.query('delete from discord_outbox'));

  it('novo convidado avisa uma vez; retomar a conta não gera outro cadastro', async () => {
    const user = await guest(ctx.app, 'discord-guest-device-0001');
    await guest(ctx.app, 'discord-guest-device-0001');
    const events = await rows();
    assert.equal(events.length, 1);
    assert.equal(events[0].payload.userId, user.id);
    assert.equal(events[0].payload.provider, 'Convidado');
  });

  it('criação direta com Google avisa; novo login ou vínculo de Apple não é novo cadastro', async () => {
    const user = await call(ctx.app, 'POST', '/auth/google', null, { idToken: 'discord-google-subject' });
    assert.equal(user.status, 200);
    await call(ctx.app, 'POST', '/auth/google', null, { idToken: 'discord-google-subject' });
    await call(ctx.app, 'POST', '/auth/apple', user.body.token, { identityToken: 'discord-apple-subject' });
    const events = await rows();
    assert.equal(events.length, 1);
    assert.equal(events[0].payload.provider, 'google');
    assert.ok(!JSON.stringify(events).includes('@mail.com'));
  });

  it('vincular Google a um convidado não duplica o aviso', async () => {
    const user = await guest(ctx.app, 'discord-guest-device-0002');
    await call(ctx.app, 'POST', '/auth/google', user.token, { idToken: 'discord-linked-google' });
    assert.equal((await rows()).length, 1);
  });

  it('compra real avisa uma vez por transação, com valor e moeda originais', async () => {
    const user = await guest(ctx.app, 'discord-purchase-device-01');
    await ctx.db.query('delete from discord_outbox');
    const event = { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_500', transaction_id: 'discord-sale-1', environment: 'PRODUCTION', price_in_purchased_currency: 24.9, currency: 'BRL', store: 'PLAY_STORE', purchased_at_ms: ctx.clock.now.getTime() };
    await webhook(ctx.app, { ...event, id: 'discord-sale-event' });
    await webhook(ctx.app, { ...event, id: 'discord-sale-event' });
    await webhook(ctx.app, { ...event, id: 'discord-sale-event-retry' });
    const events = await rows();
    assert.equal(events.length, 1);
    const payload = events[0].payload;
    assert.equal(payload.kind, 'gems');
    if (payload.kind !== 'gems') throw new Error('Evento inesperado');
    assert.equal(payload.amount, 24.9);
    assert.equal(payload.currency, 'BRL');
    assert.equal(payload.gems, 500);
    assert.equal((await call(ctx.app, 'GET', '/wallet', user.token)).body.gems, 500);
    const message = discordMessage(payload);
    assert.ok(message.embeds[0].fields.some((f) => f.name === 'Valor bruto' && f.value.includes('24,90')));
    assert.deepEqual(message.allowed_mentions, { parse: [] });
  });

  it('sandbox, eventos sem ambiente, reembolsos e passe não são anunciados como vendas de gemas', async () => {
    const user = await guest(ctx.app, 'discord-sandbox-device-01');
    await ctx.db.query('delete from discord_outbox');
    for (const [index, environment] of ['SANDBOX', undefined].entries()) {
      await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_80', transaction_id: `discord-sandbox-${index}`, environment });
    }
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_gems_80', transaction_id: 'discord-test-store', environment: 'PRODUCTION', store: 'TEST_STORE' });
    await webhook(ctx.app, { type: 'CANCELLATION', app_user_id: user.id, product_id: 'zr_gems_80', transaction_id: 'discord-refund', environment: 'PRODUCTION', cancel_reason: 'CUSTOMER_SUPPORT' });
    await webhook(ctx.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: user.id, product_id: 'zr_pass_season', transaction_id: 'discord-pass', purchased_at_ms: ctx.clock.now.getTime(), environment: 'PRODUCTION' });
    assert.equal((await rows()).length, 0);
  });

  it('fila participa da transação: rollback não deixa aviso de cadastro inexistente', async () => {
    const monitor = createMonitor(loadConfig(env))!;
    await assert.rejects(ctx.db.tx(async (q) => {
      await monitor(q, { kind: 'signup', userId: 'rolled-back', provider: 'Convidado', occurredAt: ctx.clock.now.toISOString() });
      throw new Error('rollback');
    }));
    assert.equal((await rows()).length, 0);
  });

  it('falha no envio mantém pendente; sucesso posterior não reenvia', async () => {
    await guest(ctx.app, 'discord-retry-device-001');
    const readyAt = new Date((await rows())[0].available_at);
    let deliveries = 0;
    const delay = await deliverDiscordEvent(ctx.db, async () => { deliveries++; return { ok: false, error: 'HTTP 500' }; }, readyAt);
    assert.ok(delay > 0);
    assert.equal((await rows())[0].sent_at, null);
    await deliverDiscordEvent(ctx.db, async () => { deliveries++; return { ok: true }; }, readyAt);
    assert.equal(deliveries, 1);
    const later = new Date(readyAt.getTime() + delay);
    await deliverDiscordEvent(ctx.db, async () => { deliveries++; return { ok: true }; }, later);
    await deliverDiscordEvent(ctx.db, async () => { deliveries++; return { ok: true }; }, later);
    assert.equal(deliveries, 2);
    assert.ok((await rows())[0].sent_at);
  });

  it('respeita o retry_after do Discord e confirma entrega com wait=true', async () => {
    const event: MonitorEvent = { kind: 'signup', userId: 'user', provider: 'Convidado', occurredAt: ctx.clock.now.toISOString() };
    const request = (async (input, init) => {
      assert.equal(new URL(String(input)).searchParams.get('wait'), 'true');
      assert.ok(!String(init?.body).includes('@mail.com'));
      return new Response(JSON.stringify({ retry_after: 7.5 }), { status: 429 });
    }) as typeof fetch;
    const result = await discordSender(url, request)(event);
    assert.equal(result.retryAfterMs, 7500);
    assert.equal(result.ok, false);
  });

  it('não inventa preço nem converte moeda; erros de rede não expõem token', async () => {
    const event: MonitorEvent = { kind: 'gems', userId: null, provider: 'Convidado', productId: 'zr_gems_80', gems: 80, transactionId: 'tx', amount: null, currency: null, store: 'PLAY_STORE', occurredAt: ctx.clock.now.toISOString() };
    assert.ok(discordMessage(event).embeds[0].fields.some((f) => f.name === 'Valor bruto' && f.value === 'Não informado pela loja'));
    const request = (async () => { throw new Error(url); }) as typeof fetch;
    assert.ok(!JSON.stringify(await discordSender(url, request)(event)).includes('test-token'));
  });

  it('fica desabilitado sem configuração ou fora de produção', () => {
    assert.equal(createMonitor(loadConfig({ NODE_ENV: 'development', DISCORD_WEBHOOK_URL: url })), undefined);
    assert.equal(createMonitor(loadConfig({ ...env, DISCORD_WEBHOOK_URL: '' })), undefined);
    assert.throws(() => loadConfig({ ...env, DISCORD_WEBHOOK_URL: 'https://example.com/token-secreto' }), (error: Error) => !error.message.includes('token-secreto'));
  });
});
