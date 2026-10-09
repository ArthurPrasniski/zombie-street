import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { call, guest, setup } from './helpers';

describe('save na nuvem', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let token: string;
  before(async () => {
    ctx = await setup();
    token = (await guest(ctx.app)).token;
  });
  after(() => ctx.close());

  it('sem save: 404; o primeiro save vira a revisão 1', async () => {
    assert.equal((await call(ctx.app, 'GET', '/save', token)).status, 404);
    const res = await call(ctx.app, 'PUT', '/save', token, { baseRevision: 0, version: 8, data: { cash: 10 } });
    assert.equal(res.status, 200);
    assert.equal(res.body.revision, 1);
    assert.deepEqual((await call(ctx.app, 'GET', '/save', token)).body.data, { cash: 10 });
  });

  it('gravar em cima de uma revisão velha dá conflito com o save da nuvem', async () => {
    const res = await call(ctx.app, 'PUT', '/save', token, { baseRevision: 0, version: 8, data: { cash: 99 } });
    assert.equal(res.status, 409);
    assert.equal(res.body.current.revision, 1);
    assert.deepEqual(res.body.current.data, { cash: 10 });
    const ok = await call(ctx.app, 'PUT', '/save', token, { baseRevision: 1, version: 8, data: { cash: 20 } });
    assert.equal(ok.body.revision, 2);
  });

  it('corpo inválido: 400', async () => {
    assert.equal((await call(ctx.app, 'PUT', '/save', token, { baseRevision: -1, version: 8, data: {} })).status, 400);
  });
});
