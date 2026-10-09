import { ZOMBIE_IDS, ZOMBIES } from '@/game/data/zombies';
import type { ZombieId } from '@/game/types';
import type { Progress } from '@/state/progress';

// Bestiário e contadores da partida (GDD seções 17.7 e 17.8).

/** O que uma partida acrescenta ao progresso: zumbis vistos, abates por tipo e cartas jogadas. */
export interface MatchRecord {
  seen: ZombieId[];
  kills: Partial<Record<ZombieId, number>>;
  cardsPlayed: number;
}

export const emptyRecord = (): MatchRecord => ({ seen: [], kills: {}, cardsPlayed: 0 });

/** Soma a partida ao progresso. Sem nada novo, devolve o mesmo objeto. */
export function recordMatch(p: Progress, record: MatchRecord): Progress {
  const newSeen = record.seen.filter((id) => !p.seen.includes(id));
  const killed = Object.keys(record.kills).length > 0;
  if (newSeen.length === 0 && !killed && record.cardsPlayed === 0) return p;
  const kills = { ...p.kills };
  for (const [id, n] of Object.entries(record.kills) as [ZombieId, number][]) kills[id] = (kills[id] ?? 0) + n;
  return { ...p, seen: [...p.seen, ...newSeen], kills, cardsPlayed: p.cardsPlayed + record.cardsPlayed };
}

export const zombieKills = (p: Pick<Progress, 'kills'>, id: ZombieId): number => p.kills[id] ?? 0;
export const isSeen = (p: Pick<Progress, 'seen'>, id: ZombieId): boolean => p.seen.includes(id);
export const totalKills = (p: Pick<Progress, 'kills'>): number => ZOMBIE_IDS.reduce((sum, id) => sum + zombieKills(p, id), 0);
export const bossKills = (p: Pick<Progress, 'kills'>): number => ZOMBIE_IDS.filter((id) => ZOMBIES[id].isBoss).reduce((sum, id) => sum + zombieKills(p, id), 0);
