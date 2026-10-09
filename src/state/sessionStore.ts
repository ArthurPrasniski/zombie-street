import { create } from 'zustand';

import { fieldFull } from '@/game/engine/cards';
import type { CardId, MatchMode, World } from '@/game/types';

/** Estado da partida para a UI (efêmero). O motor atualiza no máximo 4x/s e quando a mão muda. */
export interface SessionState {
  mode: MatchMode;
  stage: number;
  phase: World['phase'];
  wave: number;
  totalWaves: number;
  killed: number;
  total: number;
  hand: CardId[];
  next: CardId | null;
  blood: number;
  paused: boolean;
  /** Vida da base de 0 a 1, em passos de 1%. */
  baseHp: number;
  /** Campo cheio de tropas: as cartas de tropa ficam escurecidas. */
  troopsFull: boolean;
  /** Quadros por segundo (só medido em __DEV__). */
  fps: number;
}

export const INITIAL_SESSION: SessionState = {
  mode: 'stage',
  stage: 1,
  phase: 'intermission',
  wave: 1,
  totalWaves: 5,
  killed: 0,
  total: 0,
  hand: [],
  next: null,
  blood: 0,
  paused: false,
  baseHp: 1,
  troopsFull: false,
  fps: 0,
};

export const useSessionStore = create<SessionState>(() => INITIAL_SESSION);

export function sessionFromWorld(world: World): SessionState {
  return {
    mode: world.mode,
    stage: world.stage.index,
    phase: world.phase,
    wave: world.waveIndex + 1,
    totalWaves: world.stage.waves.length,
    killed: world.killedThisWave,
    total: world.totalThisWave,
    hand: [...world.hand],
    next: world.queue[0] ?? null,
    blood: Math.floor(world.blood),
    paused: world.paused,
    baseHp: Math.round((world.base.hp / world.base.maxHp) * 100) / 100,
    troopsFull: fieldFull(world),
    fps: useSessionStore.getState().fps,
  };
}
