import { playCard } from '@/game/engine/cards';
import type { GameCommand, World } from '@/game/types';

/** Aplica e esvazia a fila de comandos vindos da UI. */
export function applyCommands(world: World): void {
  for (const command of world.commands) applyCommand(world, command);
  world.commands.length = 0;
}

function applyCommand(world: World, command: GameCommand): void {
  switch (command.type) {
    case 'playCard':
      playCard(world, command.slot, command.x, command.y);
      return;
    case 'setSpeed':
      world.speed = command.speed;
      return;
    case 'setPaused':
      world.paused = command.paused;
      return;
  }
}
