import { areas } from '@/game/engine/systems/areas';
import { cleanup } from '@/game/engine/systems/cleanup';
import { combat } from '@/game/engine/systems/combat';
import { effects } from '@/game/engine/systems/effects';
import { blood } from '@/game/engine/systems/blood';
import { movement } from '@/game/engine/systems/movement';
import { spawn } from '@/game/engine/systems/spawn';
import { targeting } from '@/game/engine/systems/targeting';
import { waveCheck } from '@/game/engine/systems/waveCheck';
import type { World } from '@/game/types';

export type System = (world: World, dt: number) => void;

// Ordem fixa (CLAUDE.md).
export const SYSTEMS: System[] = [blood, spawn, movement, targeting, combat, areas, effects, cleanup, waveCheck];

export function stepWorld(world: World, dt: number): void {
  world.time += dt;
  for (const system of SYSTEMS) system(world, dt);
}
