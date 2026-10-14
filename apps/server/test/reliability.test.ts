import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, guest, call, webhook } from './helpers';
describe('compras e estatísticas opcionais', () => {
  let s: Awaited<ReturnType<typeof setup>>;
  let player: Awaited<ReturnType<typeof guest>>;
  before(async () => { s = await setup(); player = await guest(s.app); });
  after(async () => { await s.close(); });
  it('histórico usa recibos entregues, limita à conta e conserva estornos', async () => {
    await webhook(s.app, { type: 'NON_RENEWING_PURCHASE', app_user_id: player.id, product_id: 'zr_gems_80', transaction_id: 'receipt-test' });
    const history = await call(s.app, 'GET', '/purchases', player.token);
    assert.equal(history.status, 200); assert.equal(history.body.records[0].transactionId, 'receipt-test');
    const other = await guest(s.app, 'other-device-history-001');
    assert.deepEqual((await call(s.app, 'GET', '/purchases', other.token)).body.records, []);
    await webhook(s.app, { type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: player.id, product_id: 'zr_gems_80', transaction_id: 'receipt-test' });
    assert.equal((await call(s.app, 'GET', '/purchases', player.token)).body.records[0].refunded, true);
  });
  it('estatísticas autenticadas e idempotentes, com expiração e exclusão', async () => {
    const body = { events: [{ id: 'event-0001', name: 'stage_won', data: { stage: 1, stars: 3 } }] };
    assert.equal((await call(s.app, 'POST', '/events', null, body)).status, 401);
    assert.equal((await call(s.app, 'POST', '/events', player.token, body)).status, 200);
    await call(s.app, 'POST', '/events', player.token, body);
    assert.equal((await s.db.query('SELECT * FROM gameplay_events')).length, 1);
    s.clock.now = new Date('2026-11-10T12:00:00Z');
    await call(s.app, 'POST', '/events', player.token, { events: [] });
    assert.equal((await s.db.query('SELECT * FROM gameplay_events')).length, 0);
    await call(s.app, 'POST', '/events', player.token, body);
    await call(s.app, 'DELETE', '/events', player.token);
    assert.equal((await s.db.query('SELECT * FROM gameplay_events')).length, 0);
  });
});
