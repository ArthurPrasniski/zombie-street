import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EXPO_PUSH_URL, expoSender, isExpoPushToken, type PushMessage } from '../src/push/expo';

const message = (to: string): PushMessage => ({ to, title: 'Oi', body: 'Teste', data: { kind: 'news', url: '/' }, sound: 'default', channelId: 'default' });

describe('serviço de push da Expo', () => {
  it('manda em lotes de 100 e lê o resultado de cada mensagem', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const sent = JSON.parse(String(init.body)) as PushMessage[];
      const data = sent.map((m) => (m.to.includes('morto') ? { status: 'error', message: 'não registrado', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' }));
      return new Response(JSON.stringify({ data }), { status: 200 });
    }) as typeof fetch;
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[t${i}]`);
    tokens[120] = 'ExponentPushToken[morto]';
    const results = await expoSender('chave', fetchFn)(tokens.map(message));
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, EXPO_PUSH_URL);
    assert.equal((calls[0].init.headers as Record<string, string>).authorization, 'Bearer chave');
    assert.equal(results.length, 150);
    assert.deepEqual(results[120], { ok: false, error: 'não registrado', unregistered: true });
    assert.equal(results.filter((r) => r.ok).length, 149);
  });

  it('falha do serviço: todas do lote dão erro, sem apagar tokens', async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ errors: [{ message: 'fora do ar' }] }), { status: 500 })) as unknown as typeof fetch;
    const results = await expoSender(null, fetchFn)([message('ExponentPushToken[a]'), message('ExponentPushToken[b]')]);
    assert.deepEqual(results, [
      { ok: false, error: 'Error: fora do ar', unregistered: false },
      { ok: false, error: 'Error: fora do ar', unregistered: false },
    ]);
  });

  it('formato do token', () => {
    assert.equal(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'), true);
    assert.equal(isExpoPushToken('ExpoPushToken[abc-123]'), true);
    assert.equal(isExpoPushToken('fcm:abc'), false);
  });
});
