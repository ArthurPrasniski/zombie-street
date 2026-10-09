// Notificações: o app registra o aparelho (token da Expo, fuso e categorias) e a administração
// manda avisos para todos (novidades).
import type { FastifyInstance } from 'fastify';

import type { AdminPush, PushRegister, PushUnregister } from '@zombie-road/shared/api';
import { isAppRoute, PUSH_CATEGORIES, PUSH_ROUTE } from '@zombie-road/shared/push';
import type { Deps } from '../app';
import { HttpError } from '../errors';
import { isTimeZone } from '../push/deliver';
import { isExpoPushToken } from '../push/expo';
import { broadcast, removeToken, saveToken } from '../store/push';

const text = (max: number) => ({ type: 'string', minLength: 1, maxLength: max });
const prefs = { type: 'object', required: PUSH_CATEGORIES, additionalProperties: false, properties: Object.fromEntries(PUSH_CATEGORIES.map((c) => [c, { type: 'boolean' }])) };

export function pushRoutes(app: FastifyInstance, deps: Deps): void {
  const { db, sessions, config, now } = deps;

  app.post<{ Body: PushRegister }>(
    '/push/token',
    { schema: { body: { type: 'object', required: ['token', 'platform', 'timeZone', 'prefs'], properties: { token: text(200), platform: { enum: ['ios', 'android'] }, timeZone: text(64), prefs } } } },
    async (req) => {
      const userId = await sessions.verify(req.headers.authorization);
      if (!isExpoPushToken(req.body.token)) throw new HttpError(400, 'token de push inválido');
      if (!isTimeZone(req.body.timeZone)) throw new HttpError(400, 'fuso inválido');
      await saveToken(db, userId, req.body, now());
      return { ok: true };
    },
  );

  app.delete<{ Body: PushUnregister }>('/push/token', { schema: { body: { type: 'object', required: ['token'], properties: { token: text(200) } } } }, async (req) => {
    await removeToken(db, await sessions.verify(req.headers.authorization), req.body.token);
    return { ok: true };
  });

  /** Aviso para todos (ADMIN_TOKEN). Sai no próximo horário permitido de cada aparelho. */
  app.post<{ Body: AdminPush }>(
    '/admin/push',
    { schema: { body: { type: 'object', required: ['id', 'title', 'body'], properties: { id: text(64), title: text(60), body: text(180), url: text(120) } } } },
    async (req) => {
      if (!config.adminToken || req.headers.authorization !== `Bearer ${config.adminToken}`) throw new HttpError(401, 'sem autorização');
      const url = req.body.url ?? PUSH_ROUTE.news;
      if (!isAppRoute(url)) throw new HttpError(400, 'rota inválida (use um caminho do app, ex.: /pass)');
      const queued = await broadcast(db, `news:${req.body.id}`, { kind: 'news', ref: req.body.id, title: req.body.title, body: req.body.body, url }, now());
      return { ok: true, queued };
    },
  );
}
