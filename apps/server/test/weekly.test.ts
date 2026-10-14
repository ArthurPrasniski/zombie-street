import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, guest, call } from './helpers';
import { WEEKLY_DECK, WEEKLY_LEVEL, type ReplayCard } from '@zombie-road/shared/weekly';
import { CARD_IDS } from '@/game/data/cards';
import { getStage } from '@/game/data/stages';
import { createWorld } from '@/game/engine/world';
import { createLoop } from '@/game/engine/loop';
import type { CardLevels } from '@/game/types';
describe('desafio semanal reproduzido pelo motor', () => {
 let s: Awaited<ReturnType<typeof setup>>; let p: Awaited<ReturnType<typeof guest>>;
 before(async () => { s = await setup(); p = await guest(s.app); }); after(async () => s.close());
 it('desafio é fixo e tentativa pertence à conta', async () => {
  const one = await call(s.app, 'GET', '/weekly'); const two = await call(s.app, 'GET', '/weekly'); assert.deepEqual(one.body, two.body);
  assert.equal((await call(s.app, 'POST', '/weekly/start')).status, 401);
 });
 it('reproduz derrota real e não aceita inventar um resultado', async () => {
  const attempt = (await call(s.app, 'POST', '/weekly/start', p.token)).body;
  const world = createWorld(getStage(attempt.stage), { deck: [...WEEKLY_DECK], cardLevels: Object.fromEntries(CARD_IDS.map((c) => [c,WEEKLY_LEVEL])) as CardLevels }, attempt.seed);
  const loop = createLoop(); let ticks = 0; const commands: ReplayCard[] = [];
  while (world.phase !== 'failed' && world.phase !== 'cleared' && ticks < 72000) { loop.tick(world,1/60); ticks++; world.events.length = 0; }
  s.clock.now = new Date(s.clock.now.getTime() + ticks / 60 * 1000);
  const body = { id: attempt.id, version: attempt.version, ticks, commands };
  const result = await call(s.app,'POST','/weekly/result',p.token,body); assert.equal(result.status,200); assert.equal(result.body.medal,0);
  assert.deepEqual((await call(s.app,'POST','/weekly/result',p.token,body)).body,result.body);
  const other = await guest(s.app,'weekly-other-device-001'); assert.equal((await call(s.app,'POST','/weekly/result',other.token,body)).status,404);
 });
 it('recusa tempo impossível e partida não encerrada', async () => {
  const attempt = (await call(s.app,'POST','/weekly/start',p.token)).body;
  assert.equal((await call(s.app,'POST','/weekly/result',p.token,{ id: attempt.id, version: 1, ticks: 60000, commands: [] })).status,409);
  assert.equal((await call(s.app,'POST','/weekly/result',p.token,{ id: attempt.id, version: 1, ticks: 1, commands: [] })).status,409);
 });
});
