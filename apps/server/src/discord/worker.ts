import type { Db } from '../db';
import { discordMessage, type MonitorEvent } from './events';

export type DiscordSender = (event: MonitorEvent) => Promise<{ ok: boolean; error?: string; retryAfterMs?: number }>;

export function discordSender(webhookUrl: string, request: typeof fetch = fetch): DiscordSender {
  const url = new URL(webhookUrl);
  url.searchParams.set('wait', 'true');
  return async (event) => {
    try {
      const response = await request(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(discordMessage(event)), signal: AbortSignal.timeout(10000),
      });
      if (response.ok) return { ok: true };
      if (response.status === 429) {
        const body = await response.json().catch(() => ({})) as { retry_after?: number };
        const seconds = Number(body.retry_after ?? response.headers.get('retry-after'));
        return { ok: false, error: 'HTTP 429', retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : 30000 };
      }
      return { ok: false, error: `HTTP ${response.status}` };
    } catch {
      // Erros do fetch podem conter a URL secreta; nunca registrar o objeto original.
      return { ok: false, error: 'Falha de rede ou timeout' };
    }
  };
}

/** Uma entrega por rodada. O bloqueio evita dois workers processarem a mesma linha juntos. */
export async function deliverDiscordEvent(db: Db, send: DiscordSender, now: Date): Promise<number> {
  return db.tx(async (q) => {
    const [row] = await q.query<{ id: string; payload: MonitorEvent; attempts: number }>(
      'select id, payload, attempts from discord_outbox where sent_at is null and available_at <= $1 order by id limit 1 for update skip locked', [now.toISOString()],
    );
    if (!row) return 0;
    const result = await send(row.payload);
    if (result.ok) {
      await q.query('update discord_outbox set sent_at = $2, attempts = attempts + 1, last_error = null where id = $1', [row.id, now.toISOString()]);
      return 0;
    }
    const delay = Math.max(1000, result.retryAfterMs ?? Math.min(900000, 5000 * 2 ** Math.min(row.attempts, 8)));
    await q.query('update discord_outbox set attempts = attempts + 1, last_error = $2, available_at = $3 where id = $1', [row.id, result.error ?? 'Falha no envio', new Date(now.getTime() + delay).toISOString()]);
    return delay;
  });
}

export function startDiscordWorker(db: Db, send: DiscordSender, log: (message: string) => void): () => Promise<void> {
  let active: Promise<void> | null = null;
  let nextAttempt = 0;
  const tick = () => {
    if (active || Date.now() < nextAttempt) return;
    active = (async () => {
      try {
        const delay = await deliverDiscordEvent(db, send, new Date());
        nextAttempt = Date.now() + delay;
      } catch { log('Discord: falha ao processar a fila; nova tentativa automática.'); }
      finally { active = null; }
    })();
  };
  const timer = setInterval(tick, 2000);
  tick();
  return async () => { clearInterval(timer); await active; };
}
