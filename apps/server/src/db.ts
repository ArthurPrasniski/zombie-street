// Acesso ao banco: o mesmo SQL no Postgres de produção (pg) e no PGlite (Postgres embutido, para
// desenvolvimento e testes). Os repositórios só conhecem a interface Db.
import { mkdirSync } from 'node:fs';

import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Queryable {
  /** Roda `fn` numa transação (COMMIT no fim, ROLLBACK se der erro). */
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  /** Vários comandos de uma vez, sem parâmetros (migrações). */
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export function connectPg(url: string): Db {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const run = async <T>(client: pg.Pool | pg.PoolClient, sql: string, params?: unknown[]) => (await client.query(sql, params as unknown[])).rows as T[];
  return {
    query: (sql, params) => run(pool, sql, params),
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn({ query: (sql, params) => run(client, sql, params) });
        await client.query('COMMIT');
        return out;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    async exec(sql) {
      await pool.query(sql);
    },
    close: () => pool.end(),
  };
}

/** PGlite: em memória (testes) ou numa pasta (desenvolvimento). */
export async function connectPglite(dataDir?: string): Promise<Db> {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir);
  return {
    query: async (sql, params) => (await db.query(sql, params)).rows as never[],
    tx: (fn) => db.transaction((tx) => fn({ query: async (sql, params) => (await tx.query(sql, params)).rows as never[] })),
    async exec(sql) {
      await db.exec(sql);
    },
    close: () => db.close(),
  };
}
