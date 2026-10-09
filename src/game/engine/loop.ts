import { FIXED_STEP, MAX_FRAME_DT } from '@/game/data/constants';
import { applyCommands } from '@/game/engine/commands';
import { stepWorld } from '@/game/engine/systems';
import type { World } from '@/game/types';

// Tolerância para erros de ponto flutuante no acumulador.
const EPSILON = 1e-9;

export interface GameLoop {
  /** Avança o mundo pelo tempo real do frame. Retorna quantos passos fixos rodou. */
  tick(world: World, frameDt: number): number;
  reset(): void;
}

export function createLoop(step: (world: World, dt: number) => void = stepWorld): GameLoop {
  let accumulator = 0;
  return {
    tick(world, frameDt) {
      // Comandos entram antes de qualquer passo, mesmo pausado (é assim que se despausa).
      applyCommands(world);
      if (world.paused) return 0;
      accumulator += Math.min(frameDt, MAX_FRAME_DT) * world.speed;
      let steps = 0;
      while (accumulator >= FIXED_STEP - EPSILON) {
        step(world, FIXED_STEP);
        accumulator -= FIXED_STEP;
        steps++;
      }
      return steps;
    },
    reset() {
      accumulator = 0;
    },
  };
}
