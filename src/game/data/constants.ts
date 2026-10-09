// Seção 3: campo de batalha vertical (unidades do mundo, nunca pixels).
// Zumbis nascem acima do topo e descem; a base fica embaixo.
export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 900;
/** Onde os zumbis podem andar (nascem acima do topo da tela). */
export const FIELD = { minX: 30, maxX: 570, minY: -60, maxY: 780 };
export const ZOMBIE_SPAWN_Y = -40;
export const ZOMBIE_SPAWN_X_MIN = 60;
export const ZOMBIE_SPAWN_X_MAX = 540;
/** Metade de baixo: onde as tropas podem ser soltas. */
export const DEPLOY_ZONE = { minX: 40, maxX: 560, minY: 470, maxY: 760 };
/**
 * Onde as tropas que andam (Serra, Rex) podem ir: abaixo da faixa do topo das arenas (cerca,
 * cemitério, arame, onde os zumbis surgem), acima do muro e nas laterais da zona de mobilização.
 */
export const TROOP_FIELD = { minX: DEPLOY_ZONE.minX, maxX: DEPLOY_ZONE.maxX, minY: 110, maxY: DEPLOY_ZONE.maxY };
/** Onde as armas especiais podem cair (o campo todo acima da base). */
export const SPELL_ZONE = { minX: 0, maxX: WORLD_WIDTH, minY: 0, maxY: 780 };

// Seção 4: base (caminhonete com metralhadora atrás do muro)
export const BASE = { hp: 1000, damage: 8, attackInterval: 0.7, range: 300, frontY: 780, gunX: 300, gunY: 800 };

// Seção 5: sangue
export const BLOOD = { start: 5, max: 10, perSecond: 1 / 2.5, bossWaveMultiplier: 2 };

// Seções 6 e 7: comportamento das unidades
/** Tropa congelada (golpe do Congelado/Abominável): ataca e anda mais devagar. */
export const CHILL = { attackSlow: 1.6, speedSlow: 0.6 };
export const TROOP_DEPLOY_TIME = 0.5;
/** No máximo tantas tropas em campo ao mesmo tempo (desempenho e Sobrevivência sem bola de neve). */
export const MAX_TROOPS = 12;
export const MELEE_AGGRO = 350;
export const ZOMBIE_AGGRO = 120;
export const ZOMBIE_REACH = 40;

// Loop
export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_DT = 0.25;
// Motor -> stores (sessão e dinheiro): no máximo 4 vezes por segundo.
export const STORE_SYNC_INTERVAL = 0.25;

// Seção 8: ritmo da partida
export const INTERMISSION_DURATION = 3;

// Seção 13: feedback visual
export const TRACER_TTL = 0.08;
/** Raio da Torre Tesla na tela. */
export const ZAP_TTL = 0.18;
/** Criogenia: rajada de gelo na tela e a lentidão que fica depois do congelamento. */
export const FROST_TTL = 0.6;
export const CRYO_SLOW = 0.5;
export const HIT_FLASH_DURATION = 0.06;
export const CORPSE_TTL = 1.2;
export const DAMAGE_TEXT_TTL = 0.6;
/** Altura (acima dos pés) onde o número de dano aparece, antes da escala do zumbi. */
export const DAMAGE_TEXT_HEIGHT = 74;
export const SMOKE_TTL = 0.5;
/** Cuspe de ácido voando até o alvo e terra subindo quando o Escavador surge. */
export const SPIT_TTL = 0.3;
export const DIRT_TTL = 0.5;
/** Altura de onde sai o cuspe (acima dos pés). */
export const SPIT_HEIGHT = 46;
export const FLAME_TTL = 0.14;
export const HEAL_TTL = 0.7;
export const EXPLOSION_TTL = 0.3;
export const BIG_EXPLOSION_TTL = 0.6;
export const BOSS_SHAKE = 0.5;
export const AIRSTRIKE_SHAKE = 0.6;
