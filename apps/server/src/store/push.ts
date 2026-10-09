// Aparelhos que recebem avisos e a fila de envio (tabelas push_*). Cada aviso entra uma vez por
// conta (kind + ref): o mesmo evento repetido não manda duas notificações.
import type { PushRegister } from '@zombie-road/shared/api';
import { PUSH_ROUTE, type RemotePushKind } from '@zombie-road/shared/push';
import type { Db, Queryable } from '../db';
import type { PushText } from '../push/texts';

export interface OutboxMessage extends PushText {
  kind: RemotePushKind;
  ref: string;
  /** Rota do app que o aviso abre (padrão: a do tipo do aviso). */
  url?: string;
  /** Chega a qualquer hora e não conta no limite de 1 por dia. */
  urgent?: boolean;
}

/** Liga o aparelho à conta (ou move para outra conta, depois de entrar/sair). */
export async function saveToken(q: Queryable, userId: string, reg: PushRegister, now: Date): Promise<void> {
  await q.query(
    `insert into push_tokens (token, user_id, platform, time_zone, prefs, updated_at) values ($1, $2, $3, $4, $5, $6)
     on conflict (token) do update set user_id = $2, platform = $3, time_zone = $4, prefs = $5, updated_at = $6`,
    [reg.token, userId, reg.platform, reg.timeZone, JSON.stringify(reg.prefs), now.toISOString()],
  );
}

export async function removeToken(q: Queryable, userId: string, token: string): Promise<void> {
  await q.query('delete from push_tokens where token = $1 and user_id = $2', [token, userId]);
}

/** Põe um aviso na fila de uma conta. false = esse aviso (kind + ref) já estava na fila. */
export async function enqueue(q: Queryable, userId: string, msg: OutboxMessage, now: Date): Promise<boolean> {
  const rows = await q.query(
    `insert into push_outbox (user_id, kind, ref, title, body, url, urgent, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict do nothing returning id`,
    [userId, msg.kind, msg.ref, msg.title, msg.body, msg.url ?? PUSH_ROUTE[msg.kind], msg.urgent ?? false, now.toISOString()],
  );
  return rows.length > 0;
}

/** Aviso para todas as contas com aparelho registrado, uma vez por `key`. Devolve quantas entraram. */
export async function broadcast(db: Db, key: string, msg: OutboxMessage, now: Date): Promise<number> {
  return db.tx(async (q) => {
    const fresh = await q.query('insert into push_broadcasts (key, created_at) values ($1, $2) on conflict do nothing returning key', [key, now.toISOString()]);
    if (fresh.length === 0) return 0;
    const rows = await q.query(
      `insert into push_outbox (user_id, kind, ref, title, body, url, urgent, created_at)
       select distinct user_id, $1::text, $2::text, $3::text, $4::text, $5::text, false, $6::timestamptz from push_tokens
       on conflict do nothing returning id`,
      [msg.kind, msg.ref, msg.title, msg.body, msg.url ?? PUSH_ROUTE[msg.kind], now.toISOString()],
    );
    return rows.length;
  });
}
