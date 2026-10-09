// Sobe o servidor: banco (Postgres com DATABASE_URL, senão PGlite numa pasta), migrações e HTTP.
import { buildApp } from './app';
import { jwksVerifier, withDevTokens } from './auth';
import { type Config, loadConfig } from './config';
import { connectPg, connectPglite, type Db } from './db';
import { migrate } from './migrate';

export async function openDb(config: Config): Promise<Db> {
  return config.databaseUrl ? connectPg(config.databaseUrl) : connectPglite(config.dataDir);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const db = await openDb(config);
  const applied = await migrate(db);
  if (applied.length) console.log(`Migrações aplicadas: ${applied.join(', ')}`);
  const verify = jwksVerifier(config);
  const app = buildApp({ db, config, verifyIdToken: config.devRoutes ? withDevTokens(verify) : verify });
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Zombie Road API em http://localhost:${config.port}${config.databaseUrl ? '' : ` (PGlite em ${config.dataDir})`}${config.devRoutes ? ' [rotas de dev ligadas]' : ''}`);
}

// Só sobe o servidor quando este arquivo é o ponto de entrada (o migrateCli importa openDb)
if (process.argv[1]?.endsWith('index.ts')) await main();
