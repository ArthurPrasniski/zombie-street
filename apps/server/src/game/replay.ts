import { WEEKLY_DECK, WEEKLY_LEVEL, WEEKLY_RULES_VERSION, type ReplayCard, type WeeklyConfig, type WeeklyResult } from '@zombie-road/shared/weekly';
import { CARD_IDS } from '@/game/data/cards';
import { getStage } from '@/game/data/stages';
import { createWorld } from '@/game/engine/world';
import { playCard } from '@/game/engine/cards';
import { stepWorld } from '@/game/engine/systems';
import { starsFor } from '@/game/data/balance';
import type { CardLevels } from '@/game/types';
import { HttpError } from '../errors';
export async function replayWeekly(config: WeeklyConfig, commands: ReplayCard[], ticks: number): Promise<WeeklyResult> {
 if (config.version !== WEEKLY_RULES_VERSION) throw new HttpError(409, 'versão do desafio mudou');
 const levels = Object.fromEntries(CARD_IDS.map((id) => [id, WEEKLY_LEVEL])) as CardLevels;
 const world = createWorld(getStage(config.stage), { deck: [...WEEKLY_DECK], cardLevels: levels }, config.seed);
 let cursor = 0;
 for (let tick = 0; tick < ticks; tick++) {
  while (cursor < commands.length && commands[cursor].tick === tick) {
   const command = commands[cursor++]; playCard(world, command.slot, command.x, command.y);
  }
  if (cursor < commands.length && commands[cursor].tick < tick) throw new HttpError(400, 'comandos fora de ordem');
  stepWorld(world, 1 / 60); world.events.length = 0;
  // Yield so a bounded replay does not block other requests for its whole duration.
  if (tick % 600 === 0) await new Promise<void>((resolve) => setImmediate(resolve));
 }
 if (cursor !== commands.length || !['cleared','failed'].includes(world.phase)) throw new HttpError(409, 'partida não encerrada');
 return { medal: world.phase === 'cleared' ? starsFor(world.base.hp / world.base.maxHp) : 0, duration: ticks / 60, damage: Math.round(world.stats.damage) };
}
