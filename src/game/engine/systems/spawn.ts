import { BOSS_SHAKE } from '@/game/data/constants';
import { triggerEvent } from '@/game/engine/scenario';
import { createZombie } from '@/game/engine/world';
import type { World } from '@/game/types';

/** Solta os zumbis da onda atual conforme os delays definidos em stages.ts e dispara o evento de cenário da onda. */
export function spawn(world: World, dt: number): void {
  if (world.phase !== 'fighting') return;
  world.waveTime += dt;
  const wave = world.stage.waves[world.waveIndex];
  if (wave.event && !world.eventFired && world.waveTime >= wave.event.at) {
    world.eventFired = true;
    triggerEvent(world, wave.event.kind);
  }
  const spawns = wave.spawns;
  while (world.spawnCursor < spawns.length && spawns[world.spawnCursor].delay <= world.waveTime) {
    const zombie = createZombie(world, spawns[world.spawnCursor].zombie);
    world.zombies.push(zombie);
    world.spawnCursor++;
    world.events.push({ type: 'zombieSpawned', zombie: zombie.def.id });
    if (zombie.def.isBoss) {
      world.shake = Math.max(world.shake, BOSS_SHAKE);
      world.events.push({ type: 'bossSpawned' });
    }
  }
}
