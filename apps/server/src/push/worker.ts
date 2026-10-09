// Worker das notificações: a cada rodada, põe na fila o aviso de temporada nova (nos 3 primeiros
// dias do mês) e manda o que estiver pendente. Rode um só por banco (PUSH_WORKER=0 nas outras
// instâncias), senão dois workers podem mandar o mesmo aviso.
import { seasonOf } from '@zombie-road/shared/pass';
import type { Db } from '../db';
import { broadcast } from '../store/push';
import { deliverPushes } from './deliver';
import type { PushSender } from './expo';
import { pushTexts } from './texts';

/** Quem registra o aparelho depois de 3 dias de temporada não recebe mais o "começou". */
const SEASON_NOTICE_MS = 72 * 3600 * 1000;

/** Aviso de temporada nova para todos, uma vez por temporada. */
export async function queueSeasonStart(db: Db, now: Date): Promise<number> {
  const season = seasonOf(now);
  if (now.getTime() - new Date(`${season}-01T00:00:00Z`).getTime() > SEASON_NOTICE_MS) return 0;
  return broadcast(db, `season:${season}`, { kind: 'season', ref: season, ...pushTexts.season(season) }, now);
}

export async function pushTick(db: Db, send: PushSender, now: Date) {
  await queueSeasonStart(db, now);
  return deliverPushes(db, send, now);
}

/** Liga o worker; devolve a função que desliga. Uma rodada por vez (a próxima espera a anterior). */
export function startPushWorker(db: Db, send: PushSender, intervalMs: number, log: (message: string) => void): () => void {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await pushTick(db, send, new Date());
    } catch (error) {
      log(`push: rodada falhou: ${String(error)}`);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  tick();
  return () => clearInterval(timer);
}
