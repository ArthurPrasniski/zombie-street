import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, guest, call } from './helpers';
describe('missões por relógio do servidor', () => {
 let s: Awaited<ReturnType<typeof setup>>; let p: Awaited<ReturnType<typeof guest>>;
 before(async () => { s = await setup(); p = await guest(s.app); }); after(async () => s.close());
 it('resgate indisponível antes da meta', async () => { assert.equal((await call(s.app, 'POST', '/missions/claim', p.token, { id: 'wins' })).status, 409); });
 it('partida repetida não aumenta objetivos e resgate não duplica XP ou moedas', async () => {
  const match = { id: 'daily-match-001', wins: 1, kills: 40, cards: 12 };
  await call(s.app, 'POST', '/missions/match', p.token, match); await call(s.app, 'POST', '/missions/match', p.token, match);
  assert.equal((await call(s.app, 'GET', '/missions', p.token)).body.progress.kills, 40);
  const results = await Promise.all([call(s.app, 'POST', '/missions/claim', p.token, { id: 'wins' }), call(s.app, 'POST', '/missions/claim', p.token, { id: 'wins' })]);
  assert.equal(results[0].status, 200); assert.equal(results[1].status, 200);
  assert.equal((await call(s.app, 'GET', '/pass', p.token)).body.xp, 20);
  assert.equal((await call(s.app, 'GET', '/missions', p.token)).body.coinGrants.length, 1);
 });
 it('vira o dia no servidor e preserva recibos de prêmio', async () => {
  s.clock.now = new Date('2026-10-10T00:00:00Z');
  const state = (await call(s.app, 'GET', '/missions', p.token)).body;
  assert.equal(state.day, '2026-10-10'); assert.equal(state.progress.wins, 0); assert.equal(state.coinGrants.length, 1);
  await call(s.app, 'POST', '/missions/match', p.token, { id: 'daily-match-001', wins: 1, kills: 40, cards: 12 });
  assert.equal((await call(s.app, 'GET', '/missions', p.token)).body.progress.wins, 0);
 });
});
