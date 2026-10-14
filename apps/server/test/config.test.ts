import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadConfig } from '../src/config';

describe('configuração de produção', () => {
  const jwt = 'a'.repeat(64);
  const databaseUrl = 'postgresql://zombie:password@production-db:5432/zombieroad';

  it('recusa produção sem PostgreSQL, inclusive variável vazia ou com espaços', () => {
    for (const value of [undefined, '', '   ']) {
      assert.throws(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: jwt, DATABASE_URL: value }), /DATABASE_URL é obrigatória/);
    }
  });

  it('recusa segredo de sessão ausente ou curto em produção', () => {
    for (const value of [undefined, '', 'short']) {
      assert.throws(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: databaseUrl, JWT_SECRET: value }), /JWT_SECRET/);
    }
  });

  it('desativa atalhos de desenvolvimento em produção mesmo com DEV_ROUTES=1', () => {
    const config = loadConfig({ NODE_ENV: 'production', JWT_SECRET: jwt, DATABASE_URL: databaseUrl, DEV_ROUTES: '1' });
    assert.equal(config.devRoutes, false);
    assert.equal(config.databaseUrl, databaseUrl);
  });

  it('mantém PGlite disponível no desenvolvimento e nos testes', () => {
    for (const NODE_ENV of ['development', 'test']) {
      assert.equal(loadConfig({ NODE_ENV }).databaseUrl, null);
    }
  });
});
