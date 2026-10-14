import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, guest, call } from './helpers';
describe('XP com resposta perdida', () => {
 let s: Awaited<ReturnType<typeof setup>>; let p: Awaited<ReturnType<typeof guest>>;
 before(async () => { s=await setup('2026-10-14T12:00:00Z'); p=await guest(s.app); }); after(async () => s.close());
 it('pedidos concorrentes com mesmo ID creditam uma vez', async () => {
  const body = { amount: 40, requestId: 'xp-match-request-001' };
  const results=await Promise.all([call(s.app,'POST','/pass/xp',p.token,body),call(s.app,'POST','/pass/xp',p.token,body)]);
  assert(results.every((r)=>r.status===200)); assert.equal((await call(s.app,'GET','/pass',p.token)).body.xp,40);
 });
 it('repetir em outro dia não repete ganho e pedidos novos continuam válidos', async () => {
  s.clock.now=new Date('2026-10-15T12:00:00Z');
  await call(s.app,'POST','/pass/xp',p.token,{ amount:40,requestId:'xp-match-request-001' });
  assert.equal((await call(s.app,'GET','/pass',p.token)).body.xp,40);
  await call(s.app,'POST','/pass/xp',p.token,{ amount:40,requestId:'xp-match-request-002' });
  assert.equal((await call(s.app,'GET','/pass',p.token)).body.xp,80);
 });
});
