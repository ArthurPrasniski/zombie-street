import { BASE, BLOOD } from '@/game/data/constants';

// Seção 17.3: peças da caminhonete (Oficina). Nível 0 = sem melhoria.
export type TruckPart = 'hull' | 'gun' | 'tank';
export type TruckLevels = Record<TruckPart, number>;

export interface TruckPartDef {
  id: TruckPart;
  name: string;
  maxLevel: number;
  /** Custo para sair do nível L: round(baseCost x costGrowth^L). */
  baseCost: number;
  costGrowth: number;
}

export const TRUCK_PARTS: Record<TruckPart, TruckPartDef> = {
  hull: { id: 'hull', name: 'Lataria', maxLevel: 20, baseCost: 60, costGrowth: 1.25 },
  gun: { id: 'gun', name: 'Metralhadora', maxLevel: 20, baseCost: 60, costGrowth: 1.25 },
  tank: { id: 'tank', name: 'Tanque de sangue', maxLevel: 5, baseCost: 400, costGrowth: 2 },
};

export const TRUCK_PART_IDS = Object.keys(TRUCK_PARTS) as TruckPart[];
export const STOCK_TRUCK: TruckLevels = { hull: 0, gun: 0, tank: 0 };

/** Vida da base +15% por nível da Lataria. */
export const HULL_HP_PER_LEVEL = 0.15;
/** Dano da metralhadora x 1,12 por nível. */
export const GUN_DAMAGE_GROWTH = 1.12;
/** Sangue inicial +1 por nível do Tanque. */
export const TANK_BLOOD_PER_LEVEL = 1;

export interface BaseStats {
  hp: number;
  damage: number;
  startBlood: number;
}

/** Vida, dano da metralhadora e sangue inicial da base com as peças nos níveis dados. */
export function baseStats(levels: TruckLevels): BaseStats {
  return {
    hp: Math.round(BASE.hp * (1 + HULL_HP_PER_LEVEL * levels.hull)),
    damage: BASE.damage * GUN_DAMAGE_GROWTH ** levels.gun,
    startBlood: Math.min(BLOOD.max, BLOOD.start + TANK_BLOOD_PER_LEVEL * levels.tank),
  };
}

/** Custo para subir a peça do nível `level` para `level + 1`. */
export function truckPartCost(part: TruckPart, level: number): number {
  const def = TRUCK_PARTS[part];
  return Math.round(def.baseCost * def.costGrowth ** level);
}
