import type { FastifyInstance } from 'fastify';
import type { Deps } from '../app';
const names = ['tutorial_started', 'tutorial_completed', 'stage_started', 'stage_won', 'stage_lost', 'stage_abandoned', 'purchase_delivered', 'error'];
interface Event { id: string; name: string; data: Record<string, number | string[]> }
export function telemetryRoutes(app: FastifyInstance, { db, sessions, now }: Deps): void {
  const cleanup = () => db.query('DELETE FROM gameplay_events WHERE received_at < $1', [new Date(now().getTime() - 30 * 86400000).toISOString()]);
  const timer = setInterval(() => { void cleanup().catch(() => null); }, 3600000);
  timer.unref(); app.addHook('onClose', async () => { clearInterval(timer); });
  app.post<{ Body: { events: Event[] } }>('/events', { schema: { body: {
    type: 'object', additionalProperties: false, required: ['events'], properties: { events: { type: 'array', maxItems: 50, items: {
      type: 'object', additionalProperties: false, required: ['id', 'name', 'data'], properties: {
        id: { type: 'string', minLength: 8, maxLength: 64 }, name: { enum: names }, data: { type: 'object', additionalProperties: false, properties: {
          stage: { type: 'integer', minimum: 1, maximum: 100000 }, duration: { type: 'number', minimum: 0, maximum: 86400 }, stars: { type: 'integer', minimum: 0, maximum: 3 },
          attempts: { type: 'integer', minimum: 0, maximum: 100000 }, deck: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 30, pattern: '^[a-zA-Z_]+$' } },
        } },
      },
    } } },
  } } }, async (req) => {
    const userId = await sessions.verify(req.headers.authorization);
    await cleanup();
    await db.tx(async (q) => { for (const e of req.body.events) await q.query('INSERT INTO gameplay_events(id,user_id,name,data,received_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [e.id, userId, e.name, JSON.stringify(e.data), now().toISOString()]); });
    return { ok: true };
  });
  app.delete('/events', async (req) => { await db.query('DELETE FROM gameplay_events WHERE user_id=$1', [await sessions.verify(req.headers.authorization)]); return { ok: true }; });
}
