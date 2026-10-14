import { DAILY_MISSIONS, type DailyState, type MissionId, type MissionMatch } from '@zombie-road/shared/missions';
import { dayOf } from '@zombie-road/shared/pass';
import type { Db, Queryable } from '../db';
import { HttpError } from '../errors';
import { addXpInTx } from './pass';
interface Row { wins: number; kills: number; cards: number; claimed: MissionId[] }
async function row(q: Queryable, userId: string, day: string): Promise<Row> {
 await q.query('INSERT INTO daily_progress(user_id,day) VALUES($1,$2) ON CONFLICT DO NOTHING', [userId, day]);
 return (await q.query<Row>('SELECT wins,kills,cards,claimed FROM daily_progress WHERE user_id=$1 AND day=$2 FOR UPDATE', [userId, day]))[0];
}
export async function dailyState(q: Queryable, userId: string, now: Date): Promise<DailyState> {
 const day = dayOf(now);
 const [r] = await q.query<Row>('SELECT wins,kills,cards,claimed FROM daily_progress WHERE user_id=$1 AND day=$2', [userId, day]);
 const grants = await q.query<{ ref: string; result: { coins: number } }>("SELECT ref,result FROM ledger WHERE user_id=$1 AND reason='mission'", [userId]);
 return { day, resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString(), progress: r ? { wins: r.wins, kills: r.kills, cards: r.cards } : { wins: 0, kills: 0, cards: 0 }, claimed: r?.claimed ?? [], coinGrants: grants.map((g) => ({ ref: g.ref, coins: g.result.coins })) };
}
export async function reportDaily(db: Db, userId: string, match: MissionMatch, now: Date): Promise<DailyState> {
 const day = dayOf(now);
 await db.tx(async (q) => {
  await row(q, userId, day);
  const added = await q.query('INSERT INTO daily_matches(user_id,id,received_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id', [userId, match.id, now.toISOString()]);
  if (added.length) await q.query('UPDATE daily_progress SET wins=wins+$3,kills=kills+$4,cards=cards+$5 WHERE user_id=$1 AND day=$2', [userId, day, match.wins, match.kills, match.cards]);
 });
 return dailyState(db, userId, now);
}
export async function claimDaily(db: Db, userId: string, id: MissionId, now: Date): Promise<DailyState> {
 const mission = DAILY_MISSIONS.find((m) => m.id === id)!; const day = dayOf(now); const ref = `${day}:${id}`;
 await db.tx(async (q) => {
  const r = await row(q, userId, day);
  if (r.claimed.includes(id)) return;
  if (r[id] < mission.target) throw new HttpError(409, 'missão incompleta');
  await q.query('UPDATE daily_progress SET claimed=array_append(claimed,$3) WHERE user_id=$1 AND day=$2', [userId, day, id]);
  await q.query("INSERT INTO ledger(user_id,delta,reason,ref,result) VALUES($1,0,'mission',$2,$3)", [userId, ref, JSON.stringify({ coins: mission.coins, xp: mission.xp })]);
  await addXpInTx(q, userId, mission.xp, now);
 });
 return dailyState(db, userId, now);
}
