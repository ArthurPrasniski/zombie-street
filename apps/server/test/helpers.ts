// Monta o servidor para os testes: PGlite em memória (Postgres de verdade), verificador de token
// falso (o token é o próprio "sub") e relógio controlável.
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app';
import type { VerifyIdToken } from '../src/auth';
import { loadConfig } from '../src/config';
import { connectPglite } from '../src/db';
import { migrate } from '../src/migrate';

export const WEBHOOK_AUTH = 'Bearer rc-teste';

export async function setup(start = '2026-10-09T12:00:00Z', env: Record<string, string> = {}) {
  const db = await connectPglite();
  await migrate(db);
  const config = loadConfig({ NODE_ENV: 'test', REVENUECAT_WEBHOOK_AUTH: WEBHOOK_AUTH, ...env });
  const clock = { now: new Date(start) };
  const verify: VerifyIdToken = async (_provider, token) => ({ subject: token, email: `${token}@mail.com`, name: null });
  const app = buildApp({ db, config, verifyIdToken: verify, now: () => clock.now, log: () => {} });
  return { app, db, clock, close: async () => { await app.close(); await db.close(); } };
}

export async function call(app: FastifyInstance, method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, token?: string | null, body?: unknown) {
  const res = await app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload: body as never });
  return { status: res.statusCode, body: res.body ? res.json() : null };
}

/** Convidado novo; devolve o token e o id. */
export async function guest(app: FastifyInstance, deviceId = 'aparelho-de-teste-0001') {
  const res = await call(app, 'POST', '/auth/guest', null, { deviceId });
  return { token: res.body.token as string, id: res.body.user.id as string };
}

let eventId = 0;
/** Manda um evento do RevenueCat para o webhook. */
export function webhook(app: FastifyInstance, event: Record<string, unknown>, auth = WEBHOOK_AUTH) {
  eventId++;
  return app.inject({ method: 'POST', url: '/webhooks/revenuecat', headers: { authorization: auth }, payload: { event: { id: `evt-${eventId}`, ...event } } });
}
