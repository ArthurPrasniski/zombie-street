// Contas: convidado (pelo id do aparelho), login com Google/Apple, vínculo e exclusão.
import type { Provider, UserInfo } from '../../../shared/api';
import type { Identity } from '../auth';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';

async function createUser(q: Queryable, fields: { deviceId?: string; email?: string | null; name?: string | null }): Promise<string> {
  const [row] = await q.query<{ id: string }>('insert into users (device_id, email, name) values ($1, $2, $3) returning id', [fields.deviceId ?? null, fields.email ?? null, fields.name ?? null]);
  await q.query('insert into wallets (user_id) values ($1)', [row.id]);
  return row.id;
}

/** Convidado: o mesmo aparelho volta para a mesma conta. */
export async function guestUser(db: Db, deviceId: string): Promise<string> {
  if (deviceId.length < 16) throw new HttpError(400, 'deviceId curto demais');
  return db.tx(async (q) => {
    const [found] = await q.query<{ id: string }>('select id from users where device_id = $1', [deviceId]);
    return found ? found.id : createUser(q, { deviceId });
  });
}

export interface LoginResult {
  userId: string;
  /** true quando o login levou para outra conta que já existia (o app pergunta qual save usar). */
  switched: boolean;
}

/**
 * Login com Google/Apple. Identidade conhecida: entra nessa conta (se vinha de um convidado, as
 * gemas dele passam para ela). Nova: vincula à conta atual (se ela ainda não tem esse provedor)
 * ou cria uma conta.
 */
export async function loginWithProvider(db: Db, provider: Provider, id: Identity, currentUserId: string | null): Promise<LoginResult> {
  return db.tx(async (q) => {
    const [known] = await q.query<{ user_id: string }>('select user_id from identities where provider = $1 and subject = $2', [provider, id.subject]);
    if (known) {
      const switched = currentUserId !== null && currentUserId !== known.user_id;
      if (switched) await absorbGuest(q, currentUserId, known.user_id);
      return { userId: known.user_id, switched };
    }
    let userId = currentUserId;
    if (userId) {
      const [same] = await q.query('select 1 from identities where user_id = $1 and provider = $2', [userId, provider]);
      if (same) userId = null;
    }
    userId ??= await createUser(q, { email: id.email, name: id.name });
    await q.query('insert into identities (provider, subject, user_id, email) values ($1, $2, $3, $4)', [provider, id.subject, userId, id.email]);
    // A conta deixa de ser o convidado do aparelho: "Sair" depois cria um convidado novo
    await q.query('update users set device_id = null where id = $1', [userId]);
    await q.query('update users set email = coalesce(email, $2), name = coalesce(name, $3) where id = $1', [userId, id.email, id.name]);
    return { userId, switched: userId !== currentUserId && currentUserId !== null };
  });
}

/** Convidado que entra numa conta existente: as gemas vão junto e o convidado é apagado. */
async function absorbGuest(q: Queryable, guestId: string, targetId: string): Promise<void> {
  const [guest] = await q.query<{ n: number }>('select count(*)::int as n from identities where user_id = $1', [guestId]);
  if (!guest || guest.n > 0) return;
  const [wallet] = await q.query<{ gems: number }>('select gems from wallets where user_id = $1', [guestId]);
  if (wallet && wallet.gems > 0) {
    await q.query('update wallets set gems = gems + $2 where user_id = $1', [targetId, wallet.gems]);
    await q.query("insert into ledger (user_id, delta, reason, ref) values ($1, $2, 'merge', $3)", [targetId, wallet.gems, guestId]);
  }
  await q.query('delete from users where id = $1', [guestId]);
}

export async function userInfo(q: Queryable, userId: string): Promise<UserInfo> {
  const [user] = await q.query<{ id: string; email: string | null; name: string | null }>('select id, email, name from users where id = $1', [userId]);
  if (!user) throw new HttpError(401, 'conta não existe mais');
  const providers = (await q.query<{ provider: Provider }>('select provider from identities where user_id = $1 order by provider', [userId])).map((r) => r.provider);
  return { id: user.id, providers, email: user.email, name: user.name };
}

/** Exclui a conta e tudo dela (save, gemas, passe). As compras ficam no histórico sem dono. */
export async function deleteUser(db: Db, userId: string): Promise<void> {
  await db.query('delete from users where id = $1', [userId]);
}
