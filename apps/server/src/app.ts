// Monta o servidor (Fastify) com as dependências injetadas: banco, configuração, verificador de
// tokens e relógio. Os testes montam o mesmo app com PGlite em memória e um verificador falso.
import Fastify, { type FastifyInstance } from 'fastify';

import { type Sessions, sessions as makeSessions, type VerifyIdToken } from './auth';
import type { Config } from './config';
import type { Db } from './db';
import { createMonitor, type Monitor } from './discord/events';
import { HttpError } from './errors';
import { weeklyRoutes } from './routes/weekly';
import { missionRoutes } from './routes/missions';
import { telemetryRoutes } from './routes/telemetry';
import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { pushRoutes } from './routes/push';
import { webhookRoutes } from './routes/webhooks';
import { gemAdRoutes } from './routes/gemAds';

export interface Deps {
  db: Db;
  config: Config;
  sessions: Sessions;
  verifyIdToken: VerifyIdToken;
  now: () => Date;
  log: (message: string) => void;
  monitor?: Monitor;
}

export function buildApp(input: Omit<Deps, 'sessions' | 'now' | 'log'> & Partial<Pick<Deps, 'now' | 'log'>>): FastifyInstance {
  const app = Fastify({ logger: input.config.production, bodyLimit: 512 * 1024 });
  const deps: Deps = { ...input, sessions: makeSessions(input.config.jwtSecret), now: input.now ?? (() => new Date()), log: input.log ?? ((m) => app.log.warn(m)) };
  deps.monitor = createMonitor(input.config);

  app.setErrorHandler((error: Error & { statusCode?: number; validation?: unknown }, _req, reply) => {
    if (error instanceof HttpError) return reply.code(error.statusCode).send({ error: error.message });
    if (error.validation) return reply.code(400).send({ error: error.message });
    app.log.error(error);
    return reply.code(500).send({ error: 'erro interno' });
  });

  app.get('/health', async () => ({ ok: true }));
  authRoutes(app, deps);
  gameRoutes(app, deps);
  telemetryRoutes(app, deps);
  missionRoutes(app, deps);
  weeklyRoutes(app, deps);
  pushRoutes(app, deps);
  webhookRoutes(app, deps);
  gemAdRoutes(app, deps);
  return app;
}
