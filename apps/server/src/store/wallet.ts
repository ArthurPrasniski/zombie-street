// Carteira de gemas: só o servidor muda. Todo movimento vai para o ledger; pedidos com o mesmo
// `ref` não contam duas vezes (o app pode repetir um pedido sem medo).
import { COIN_PACKS, coinPackCoins } from '@zombie-road/shared/catalog';
import type { BuyCoins, BuyCoinsResult } from '@zombie-road/shared/api';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';

export async function getGems(q: Queryable, userId: string): Promise<number> {
  const [row] = await q.query<{ gems: number }>('select gems from wallets where user_id = $1', [userId]);
  return row?.gems ?? 0;
}

/** Credita (ou debita) gemas uma vez por `ref`. Devolve false se esse `ref` já tinha sido lançado. */
export async function moveGems(q: Queryable, userId: string, delta: number, reason: string, ref: string, result: unknown = null): Promise<boolean> {
  const inserted = await q.query('insert into ledger (user_id, delta, reason, ref, result) values ($1, $2, $3, $4, $5) on conflict do nothing returning id', [userId, delta, reason, ref, result === null ? null : JSON.stringify(result)]);
  if (inserted.length === 0) return false;
  // Estorno não deixa a carteira negativa
  await q.query('update wallets set gems = greatest(0, gems + $2) where user_id = $1', [userId, delta]);
  return true;
}

/** Troca gemas por moedas (o valor cresce com a fase do jogador). As moedas o app soma no progresso. */
export async function buyCoins(db: Db, userId: string, req: BuyCoins): Promise<BuyCoinsResult> {
  const pack = COIN_PACKS[req.pack];
  if (!pack) throw new HttpError(400, 'pacote desconhecido');
  return db.tx(async (q) => {
    const [done] = await q.query<{ result: BuyCoinsResult }>("select result from ledger where user_id = $1 and reason = 'coins' and ref = $2", [userId, req.requestId]);
    if (done) return done.result;
    const [wallet] = await q.query<{ gems: number }>('select gems from wallets where user_id = $1 for update', [userId]);
    if (!wallet || wallet.gems < pack.gems) throw new HttpError(402, 'gemas insuficientes');
    const result: BuyCoinsResult = { requestId: req.requestId, gems: wallet.gems - pack.gems, coins: coinPackCoins(req.pack, req.stage) };
    await moveGems(q, userId, -pack.gems, 'coins', req.requestId, result);
    return result;
  });
}
