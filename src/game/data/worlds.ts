import { type FrontierWorld, frontierWorld } from '@/game/data/frontier';
import type { WorldDef } from '@/game/types';

// Mundos: 10 fases cada, com cenário, um zumbi novo e um chefe próprios. Ato 1 (5 mundos),
// Ato 2 (3) e Ato 3 (4): seção 18 do GDD.
export const STAGES_PER_WORLD = 10;

export const WORLDS: WorldDef[] = [
  { id: 'farm', name: 'Fazenda', zombie: null, boss: 'brute' },
  { id: 'city', name: 'Cidade em ruínas', zombie: 'cop', boss: 'riot' },
  { id: 'swamp', name: 'Pântano', zombie: 'bloater', boss: 'hulk' },
  { id: 'desert', name: 'Base no deserto', zombie: 'grunt', boss: 'general' },
  { id: 'snow', name: 'Nevasca', zombie: 'frost', boss: 'yeti' },
  { id: 'tech', name: 'Cidade Tecnológica', zombie: 'android', boss: 'colossus' },
  { id: 'lab', name: 'Laboratório', zombie: 'mutant', boss: 'director' },
  { id: 'launch', name: 'Base de Lançamento', zombie: 'astronaut', boss: 'padChief' },
  { id: 'station', name: 'Estação Orbital', zombie: 'cosmonaut', boss: 'commander' },
  { id: 'moon', name: 'Lua', zombie: 'cosmonaut', boss: 'lunarWorm' },
  { id: 'mars', name: 'Marte', zombie: 'xeno', boss: 'marsTitan', zombieShare: 0.4 },
  { id: 'hive', name: 'Colmeia', zombie: 'pod', boss: 'queen', zombieShare: 0.5 },
];

/** Mundos da campanha (Atos 1 a 3); depois deles começa a Fronteira infinita. */
export const CAMPAIGN_WORLDS = WORLDS.length;

/** Mundo pelo índice: um dos 12 da campanha ou um planeta gerado da Fronteira. */
export function worldDef(w: number): WorldDef | FrontierWorld {
  return w < CAMPAIGN_WORLDS ? WORLDS[w] : frontierWorld(w - CAMPAIGN_WORLDS, w);
}

export const isFrontier = (w: number): boolean => w >= CAMPAIGN_WORLDS;

/** Índice do mundo da fase global (1 em diante; sem fim depois da campanha). */
export const worldOf = (stage: number): number => Math.floor((stage - 1) / STAGES_PER_WORLD);

/** Número da fase dentro do mundo (1 a 10). */
export const localStage = (stage: number): number => ((stage - 1) % STAGES_PER_WORLD) + 1;

/** Rótulo da fase para a tela: "mundo-fase", ex.: 13 -> "2-3". */
export const stageLabel = (stage: number): string => `${worldOf(stage) + 1}-${localStage(stage)}`;

/** Fase global a partir do mundo e da fase local. */
export const globalStage = (world: number, local: number): number => world * STAGES_PER_WORLD + local;
