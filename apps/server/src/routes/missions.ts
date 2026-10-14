import type { FastifyInstance } from 'fastify';
import { DAILY_MISSIONS, type MissionId, type MissionMatch } from '@zombie-road/shared/missions';
import type { Deps } from '../app';
import { dailyState, reportDaily, claimDaily } from '../store/missions';
export function missionRoutes(app: FastifyInstance, { db, sessions, now }: Deps) {
 const user = (auth: string | undefined) => sessions.verify(auth);
 app.get('/missions', async (req) => dailyState(db, await user(req.headers.authorization), now()));
 app.post<{ Body: MissionMatch }>('/missions/match', { schema: { body: { type: 'object', additionalProperties: false, required: ['id','wins','kills','cards'], properties: {
  id: { type: 'string', minLength: 8, maxLength: 64 }, wins: { type: 'integer', minimum: 0, maximum: 1 }, kills: { type: 'integer', minimum: 0, maximum: 5000 }, cards: { type: 'integer', minimum: 0, maximum: 1000 },
 } } } }, async (req) => reportDaily(db, await user(req.headers.authorization), req.body, now()));
 app.post<{ Body: { id: MissionId } }>('/missions/claim', { schema: { body: { type: 'object', required: ['id'], properties: { id: { enum: DAILY_MISSIONS.map((m) => m.id) } } } } }, async (req) => claimDaily(db, await user(req.headers.authorization), req.body.id, now()));
}
