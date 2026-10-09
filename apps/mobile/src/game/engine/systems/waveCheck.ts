import { starsFor, victoryBonus } from '@/game/data/balance';
import { survivalBonus, survivalWave } from '@/game/data/survival';
import { INTERMISSION_DURATION } from '@/game/data/constants';
import type { World } from '@/game/types';

/** Máquina de estados: intermission -> fighting -> (próxima onda | cleared | failed). */
export function waveCheck(world: World, dt: number): void {
  if (world.phase === 'cleared' || world.phase === 'failed') return;
  if (world.base.hp <= 0) {
    fail(world);
    return;
  }
  if (world.phase === 'intermission') {
    world.phaseTimer -= dt;
    if (world.phaseTimer <= 0) startFighting(world);
    return;
  }
  if (world.killedThisWave >= world.totalThisWave) finishWave(world);
}

function startFighting(world: World): void {
  world.phase = 'fighting';
  world.waveTime = 0;
  world.spawnCursor = 0;
  world.killedThisWave = 0;
  world.totalThisWave = world.stage.waves[world.waveIndex].spawns.length;
  world.eventFired = false;
  world.events.push({ type: 'waveStarted', wave: world.waveIndex + 1 });
}

function finishWave(world: World): void {
  // Sobrevivência: paga a onda e cria a próxima (GDD seção 17.9)
  if (world.mode === 'survival') {
    const bonus = survivalBonus(world.waveIndex + 1);
    world.pendingCash += bonus;
    world.stageCash += bonus;
    world.stage.waves.push(survivalWave(world.waveIndex + 2));
  } else if (world.waveIndex >= world.stage.waves.length - 1) {
    const bonus = victoryBonus(world.stage.index);
    world.pendingCash += bonus;
    world.stageCash += bonus;
    world.phase = 'cleared';
    const stars = starsFor(world.base.hp / world.base.maxHp);
    world.events.push({ type: 'stageCleared', stage: world.stage.index, cashEarned: world.stageCash, stars });
    return;
  }
  // As tropas continuam em campo de uma onda para a outra.
  world.waveIndex++;
  world.phase = 'intermission';
  world.phaseTimer = INTERMISSION_DURATION;
  world.killedThisWave = 0;
  world.totalThisWave = world.stage.waves[world.waveIndex].spawns.length;
}

/** Base caiu: a partida acaba. O dinheiro já ganho fica. Na Sobrevivência, conta as ondas vencidas. */
function fail(world: World): void {
  world.phase = 'failed';
  if (world.mode === 'survival') world.events.push({ type: 'survivalOver', waves: world.waveIndex, cashEarned: world.stageCash });
  else world.events.push({ type: 'stageFailed', stage: world.stage.index, cashEarned: world.stageCash });
}
