import type { ScenarioEventId } from '@/game/data/events';
import type { WorldDef, WorldId, ZombieId } from '@/game/types';

// Seção 18.5: a Fronteira infinita. Cada mundo depois da campanha é um planeta montado pela semente
// do índice (o mundo n é sempre igual): tipo de planeta, tema, ameaça, zumbi e chefe mutado.

export type PlanetKind = 'ice' | 'lava' | 'jungle' | 'crystal';
export type ThemeId = 'night' | 'storm' | 'toxic' | 'burning';
export type ThreatId = 'fast' | 'armored' | 'infested' | 'swarm' | 'relentless';
export type MutationId = 'giant' | 'armored' | 'explosive' | 'regen';

/** Cenário que o planeta reaproveita e o tom de cor por cima (no render). */
export const PLANETS: Record<PlanetKind, { name: string; scene: WorldId; tint: string; event: ScenarioEventId }> = {
  ice: { name: 'Planeta Gelado', scene: 'moon', tint: '#7fd0ff', event: 'blizzard' },
  lava: { name: 'Planeta de Lava', scene: 'mars', tint: '#ff5a1f', event: 'meteors' },
  jungle: { name: 'Selva Alienígena', scene: 'hive', tint: '#4fd86a', event: 'spores' },
  crystal: { name: 'Planeta de Cristal', scene: 'station', tint: '#c87aff', event: 'debris' },
};
export const PLANET_KINDS = Object.keys(PLANETS) as PlanetKind[];
export const THEMES: ThemeId[] = ['night', 'storm', 'toxic', 'burning'];
export const THREATS: ThreatId[] = ['fast', 'armored', 'infested', 'swarm', 'relentless'];
export const MUTATIONS: MutationId[] = ['giant', 'armored', 'explosive', 'regen'];

/** Zumbis dos atos anteriores que podem ser o zumbi do planeta e chefes que podem voltar mutados. */
export const FRONTIER_ZOMBIES: ZombieId[] = ['cop', 'bloater', 'grunt', 'frost', 'android', 'mutant', 'astronaut', 'cosmonaut', 'xeno'];
export const FRONTIER_BOSSES: ZombieId[] = ['riot', 'hulk', 'general', 'yeti', 'colossus', 'director', 'padChief', 'commander', 'marsTitan', 'queen'];

/** Ameaças da horda: multiplicadores que crescem a cada `step` mundos da Fronteira. */
export const THREAT = { step: 3, fastSpeed: 0.15, armoredArmor: 3, infestedSpecials: 1, swarmWalkers: 0.25, relentlessPause: 0.4 };
/** Mutações do chefe. */
export const MUTATION = { giantHp: 1.5, giantScale: 1.25, armoredArmor: 12, explosiveRadius: 160, explosiveDamage: 160, regenPerSecond: 0.01 };

export interface FrontierWorld extends WorldDef {
  planet: PlanetKind;
  theme: ThemeId;
  threat: ThreatId;
  mutation: MutationId;
  /** Quantas vezes a ameaça já cresceu (1 no começo da Fronteira). */
  tier: number;
}

/** Sorteio sem estado: o mesmo índice sempre dá o mesmo valor (0 a 1). */
function seeded(n: number, salt: number): number {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const pick = <T>(list: readonly T[], n: number, salt: number): T => list[Math.floor(seeded(n, salt) * list.length)];

/** Planeta do mundo `index` da Fronteira (0 = o primeiro). */
export function frontierWorld(index: number, firstWorld: number): FrontierWorld {
  const planet = PLANET_KINDS[index % PLANET_KINDS.length];
  return {
    id: PLANETS[planet].scene,
    name: PLANETS[planet].name,
    zombie: pick(FRONTIER_ZOMBIES, index, 1),
    boss: pick(FRONTIER_BOSSES, index, 2),
    planet,
    theme: pick(THEMES, index, 3),
    threat: pick(THREATS, index, 4),
    mutation: pick(MUTATIONS, index, 5),
    tier: 1 + Math.floor(index / THREAT.step),
    frontier: firstWorld + index,
  };
}
