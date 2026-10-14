import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { weeklyConfig, WEEKLY_MAX_TICKS, WEEKLY_RULES_VERSION, type WeeklyConfig, type ReplayCard, type WeeklyResult } from '@zombie-road/shared/weekly';
import type { Deps } from '../app';
import { replayWeekly } from '../game/replay';
import { HttpError } from '../errors';
export function weeklyRoutes(app: FastifyInstance, { db, sessions, now }: Deps) {
 app.get('/weekly', async () => weeklyConfig(now()));
 app.get('/weekly/medals', async (req) => {
  const userId = await sessions.verify(req.headers.authorization);
  return db.query<{ week: string; medal: number }>("SELECT week,max((result->>'medal')::int) AS medal FROM weekly_attempts WHERE user_id=$1 AND result IS NOT NULL GROUP BY week ORDER BY week DESC LIMIT 12",[userId]);
 });
 app.post('/weekly/start', async (req) => {
  const userId = await sessions.verify(req.headers.authorization); const config = weeklyConfig(now()); const id = randomUUID();
  const recent = await db.query('SELECT id FROM weekly_attempts WHERE user_id=$1 AND started_at>$2', [userId, new Date(now().getTime() - 60000).toISOString()]);
  if (recent.length >= 3) throw new HttpError(429, 'aguarde para iniciar outra tentativa');
  await db.query('INSERT INTO weekly_attempts(id,user_id,week,config,started_at) VALUES($1,$2,$3,$4,$5)', [id,userId,config.week,JSON.stringify(config),now().toISOString()]);
  return { ...config, id };
 });
 app.post<{ Body: { id: string; version: number; ticks: number; commands: ReplayCard[] } }>('/weekly/result', { schema: { body: {
  type: 'object', required: ['id','version','ticks','commands'], additionalProperties: false, properties: {
   id: { type: 'string', format: 'uuid' }, version: { const: WEEKLY_RULES_VERSION }, ticks: { type: 'integer', minimum: 1, maximum: WEEKLY_MAX_TICKS },
   commands: { type: 'array', maxItems: 1000, items: { type: 'object', additionalProperties: false, required: ['tick','slot','x','y'], properties: { tick: { type: 'integer', minimum: 0, maximum: WEEKLY_MAX_TICKS }, slot: { type: 'integer', minimum: 0, maximum: 3 }, x: { type: 'number', minimum: 0, maximum: 600 }, y: { type: 'number', minimum: 0, maximum: 900 } } } },
  },
 } } }, async (req) => {
  const userId = await sessions.verify(req.headers.authorization);
  const [attempt] = await db.query<{ config: WeeklyConfig; started_at: Date; result: WeeklyResult | null }>('SELECT config,started_at,result FROM weekly_attempts WHERE id=$1 AND user_id=$2', [req.body.id,userId]);
  if (!attempt) throw new HttpError(404, 'tentativa não encontrada'); if (attempt.result) return attempt.result;
  const elapsed = (now().getTime() - new Date(attempt.started_at).getTime()) / 1000;
  if (req.body.ticks / 60 > elapsed * 2 + 2 || now().getTime() > Date.parse(attempt.config.endsAt) + 3600000) throw new HttpError(409, 'tempo inválido');
  const result = await replayWeekly(attempt.config, req.body.commands, req.body.ticks);
  await db.query('UPDATE weekly_attempts SET result=$2 WHERE id=$1 AND result IS NULL', [req.body.id,JSON.stringify(result)]);
  return (await db.query<{ result: WeeklyResult }>('SELECT result FROM weekly_attempts WHERE id=$1', [req.body.id]))[0].result;
 });
}
