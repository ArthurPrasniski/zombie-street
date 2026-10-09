import { BLOOD } from '@/game/data/constants';
import { isBossWave } from '@/game/data/stages';
import { isActive } from '@/game/engine/queries';
import { weatherBlood } from '@/game/engine/scenario';
import type { World } from '@/game/types';

/** O sangue enche sozinho até 10; na onda do chefe, em dobro (GDD seção 5); na nevasca, mais devagar. */
export function blood(world: World, dt: number): void {
  if (!isActive(world)) return;
  const bossWave = isBossWave(world.stage.waves[world.waveIndex]);
  const rate = BLOOD.perSecond * (bossWave ? BLOOD.bossWaveMultiplier : 1) * weatherBlood(world);
  world.blood = Math.min(BLOOD.max, world.blood + rate * dt);
}
