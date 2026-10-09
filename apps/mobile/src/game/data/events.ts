import type { WorldId } from '@/game/types';

// Seção 17.5: eventos de cenário, um por mundo, nas ondas 2 e 4 de cada fase.
export type ScenarioEventId = 'hay' | 'carBombs' | 'fog' | 'shelling' | 'blizzard' | 'blackout' | 'gasLeak' | 'engineTest' | 'debris' | 'meteors' | 'duststorm' | 'spores';
export const SCENARIO_EVENTS: ScenarioEventId[] = ['hay', 'carBombs', 'fog', 'shelling', 'blizzard', 'blackout', 'gasLeak', 'engineTest', 'debris', 'meteors', 'duststorm', 'spores'];

export const WORLD_EVENT: Record<WorldId, ScenarioEventId> = {
  farm: 'hay', city: 'carBombs', swamp: 'fog', desert: 'shelling', snow: 'blizzard',
  tech: 'blackout', lab: 'gasLeak', launch: 'engineTest',
  station: 'debris', moon: 'meteors', mars: 'duststorm', hive: 'spores',
};
/** Ondas (1 a 5) com evento e o intervalo, em segundos depois do início da onda, em que ele acontece. */
export const EVENT_WAVES = [2, 4];
export const EVENT_DELAY = { min: 3, max: 8 };

/** Fardo de feno: desce uma coluna e fere os zumbis no caminho (fração da vida máxima). */
export const HAY = { halfWidth: 38, reach: 30, speed: 240, zombieDamage: 0.5, bossDamage: 0.1, startY: -60 };
/** Carros-bomba na metade de cima: explodem quando um zumbi chega perto ou no fim do pavio. */
export const CAR_BOMB = { count: 2, minX: 90, maxX: 510, minY: 140, maxY: 380, trigger: 45, radius: 110, fuse: 12, zombieDamage: 0.6, bossDamage: 0.12, troopDamage: 0.3 };
/** Névoa: os atiradores enxergam menos. */
export const FOG = { duration: 10, rangeFactor: 0.6 };
/** Bombardeio: bombas em pontos marcados antes, uma depois da outra; ferem tropas e zumbis. */
export const SHELLING = { count: 4, warning: 1.5, spacing: 0.6, radius: 80, minY: 160, maxY: 700, zombieDamage: 0.4, bossDamage: 0.08, troopDamage: 0.35 };
/** Seção 18.3, Ato 3: chuva de detritos (muitos pequenos) e de meteoros (poucos grandes), como o bombardeio. */
export const DEBRIS = { ...SHELLING, count: 6, warning: 1.2, spacing: 0.4, radius: 60, zombieDamage: 0.3, troopDamage: 0.25 };
export const METEORS = { ...SHELLING, count: 3, warning: 2, spacing: 1, radius: 120, zombieDamage: 0.6, bossDamage: 0.12, troopDamage: 0.45 };
/** Tempestade de poeira: todos mais lentos e atiradores enxergam menos. */
export const DUSTSTORM = { duration: 10, speedFactor: 0.7, rangeFactor: 0.7 };
/** Esporos: casulos brotam na metade de cima do campo. */
export const SPORES = { count: 3 };
/** Nevasca: todos andam mais devagar e o sangue enche mais devagar. */
export const BLIZZARD = { duration: 10, speedFactor: 0.6, bloodFactor: 0.7 };

// Seção 18.2, Ato 2
/** Apagão: escurece e os atiradores enxergam menos. */
export const BLACKOUT = { duration: 10, rangeFactor: 0.6 };
/** Vazamento: nuvem tóxica que fere tropas e zumbis (fração da vida máxima por segundo; chefes menos). */
export const GAS_LEAK = { duration: 8, radius: 110, minY: 220, maxY: 650, rate: 0.06, bossRate: 0.015 };
/** Teste de motores: um jato de fogo atravessa uma linha do campo e queima os zumbis nela. */
export const ENGINE_TEST = { speed: 700, halfHeight: 34, minY: 220, maxY: 640, startX: -80, zombieDamage: 0.5, bossDamage: 0.1 };
