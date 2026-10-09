// Save na nuvem: o progresso inteiro em JSON, com revisão. Gravar exige a revisão em que o app se
// baseou; se a nuvem andou (outro aparelho), responde conflito com o save da nuvem.
import type { CloudSave, PutSave } from '../../../shared/api';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';

// Limite do save (o progresso hoje tem poucos KB).
const MAX_SAVE_BYTES = 256 * 1024;

type Row = { revision: number; version: number; data: unknown; updated_at: Date | string };
const toSave = (r: Row): CloudSave => ({ revision: r.revision, version: r.version, data: r.data, updatedAt: new Date(r.updated_at).toISOString() });

export async function getSave(q: Queryable, userId: string): Promise<CloudSave | null> {
  const [row] = await q.query<Row>('select revision, version, data, updated_at from saves where user_id = $1', [userId]);
  return row ? toSave(row) : null;
}

export type PutResult = { ok: true; save: CloudSave } | { ok: false; current: CloudSave };

export async function putSave(db: Db, userId: string, body: PutSave): Promise<PutResult> {
  if (JSON.stringify(body.data).length > MAX_SAVE_BYTES) throw new HttpError(413, 'save grande demais');
  return db.tx(async (q) => {
    const [row] = await q.query<Row>('select revision, version, data, updated_at from saves where user_id = $1 for update', [userId]);
    const current = row?.revision ?? 0;
    if (row && body.baseRevision !== current) return { ok: false, current: toSave(row) };
    const [saved] = await q.query<Row>(
      `insert into saves (user_id, revision, version, data, updated_at) values ($1, $2, $3, $4, now())
       on conflict (user_id) do update set revision = $2, version = $3, data = $4, updated_at = now()
       returning revision, version, data, updated_at`,
      [userId, current + 1, body.version, JSON.stringify(body.data)],
    );
    return { ok: true, save: toSave(saved) };
  });
}
