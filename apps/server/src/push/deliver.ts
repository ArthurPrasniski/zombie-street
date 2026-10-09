// Uma rodada de envio da fila (push_outbox). Regras (GDD seção 20):
// - só para aparelhos com a categoria do aviso ligada;
// - avisos não urgentes só entre 9h e 21h no fuso do aparelho e no máximo 1 por dia por conta
//   (os que não podem sair agora esperam a próxima rodada; depois de 3 dias, vencem);
// - urgentes (compra confirmada) saem na hora.
import { isQuietHour, PUSH_CATEGORY, pushData, type PushPrefs, type RemotePushKind } from '@zombie-road/shared/push';
import type { Db } from '../db';
import { PUSH_CHANNEL, type PushMessage, type PushSender } from './expo';

const BATCH = 500;
const HOUR_MS = 3600 * 1000;
/** Aviso que não conseguiu sair em 3 dias já não faz sentido. */
const EXPIRE_MS = 72 * HOUR_MS;
/** "1 por dia": entre dois avisos não urgentes da mesma conta, pelo menos 20 h. */
const DAILY_GAP_MS = 20 * HOUR_MS;

interface OutboxRow {
  id: string;
  user_id: string;
  kind: RemotePushKind;
  title: string;
  body: string;
  url: string;
  urgent: boolean;
  created_at: Date | string;
}

interface TokenRow {
  token: string;
  user_id: string;
  time_zone: string;
  prefs: Partial<PushPrefs>;
}

export type PushOutcome = 'sent' | 'error' | 'no-device' | 'opted-out' | 'expired';

/** Hora (0 a 23) no fuso do aparelho. */
export function localHour(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date));
}

export function isTimeZone(timeZone: string): boolean {
  try {
    localHour(new Date(), timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Manda o que pode sair agora. Devolve quantos avisos tiveram cada resultado (os que esperam não contam). */
export async function deliverPushes(db: Db, send: PushSender, now: Date): Promise<Partial<Record<PushOutcome, number>>> {
  const rows = await db.query<OutboxRow>('select id::text as id, user_id, kind, title, body, url, urgent, created_at from push_outbox where sent_at is null order by id limit $1', [BATCH]);
  if (rows.length === 0) return {};
  const users = [...new Set(rows.map((r) => r.user_id))];
  const tokens = await db.query<TokenRow>('select token, user_id, time_zone, prefs from push_tokens where user_id = any($1::uuid[])', [users]);
  const recent = await db.query<{ user_id: string; last: Date | string }>(
    "select user_id, max(sent_at) as last from push_outbox where user_id = any($1::uuid[]) and urgent = false and outcome = 'sent' group by user_id",
    [users],
  );
  const lastSent = new Map(recent.map((r) => [r.user_id, new Date(r.last).getTime()]));

  const outcomes = new Map<string, PushOutcome>();
  const outgoing: { row: OutboxRow; token: string }[] = [];
  for (const row of rows) {
    if (now.getTime() - new Date(row.created_at).getTime() > EXPIRE_MS) {
      outcomes.set(row.id, 'expired');
      continue;
    }
    const mine = tokens.filter((t) => t.user_id === row.user_id);
    const category = PUSH_CATEGORY[row.kind];
    let targets = mine.filter((t) => t.prefs[category] !== false);
    if (mine.length === 0 || targets.length === 0) {
      outcomes.set(row.id, mine.length === 0 ? 'no-device' : 'opted-out');
      continue;
    }
    if (!row.urgent) {
      const last = lastSent.get(row.user_id);
      if (last !== undefined && now.getTime() - last < DAILY_GAP_MS) continue;
      targets = targets.filter((t) => !isQuietHour(localHour(now, t.time_zone)));
      if (targets.length === 0) continue;
      // Outro aviso da mesma conta nesta rodada fica para o dia seguinte
      lastSent.set(row.user_id, now.getTime());
    }
    for (const t of targets) outgoing.push({ row, token: t.token });
  }

  const unregistered: string[] = [];
  if (outgoing.length > 0) {
    const messages: PushMessage[] = outgoing.map(({ row, token }) => ({ to: token, title: row.title, body: row.body, data: pushData(row.kind, row.url), sound: 'default', channelId: PUSH_CHANNEL }));
    const results = await send(messages);
    outgoing.forEach(({ row, token }, i) => {
      const result = results[i];
      if (result?.ok) outcomes.set(row.id, 'sent');
      else if (!outcomes.has(row.id)) outcomes.set(row.id, 'error');
      if (result && !result.ok && result.unregistered) unregistered.push(token);
    });
  }

  if (outcomes.size > 0) {
    await db.query(
      `update push_outbox o set sent_at = $1, outcome = v.outcome
       from (select unnest($2::bigint[]) as id, unnest($3::text[]) as outcome) v where o.id = v.id`,
      [now.toISOString(), [...outcomes.keys()], [...outcomes.values()]],
    );
  }
  if (unregistered.length > 0) await db.query('delete from push_tokens where token = any($1::text[])', [unregistered]);

  const counts: Partial<Record<PushOutcome, number>> = {};
  for (const outcome of outcomes.values()) counts[outcome] = (counts[outcome] ?? 0) + 1;
  return counts;
}
