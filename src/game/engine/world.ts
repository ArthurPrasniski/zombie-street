import { cardPower, zombieDamage, zombieHp, zombieReward } from '@/game/data/balance';
import { CARD_IDS, HAND_SIZE } from '@/game/data/cards';
import { evolutionTier } from '@/game/data/evolutions';
import { baseStats, STOCK_TRUCK, type TruckLevels } from '@/game/data/truck';
import { INTERMISSION_DURATION, TROOP_DEPLOY_TIME, ZOMBIE_SPAWN_X_MAX, ZOMBIE_SPAWN_X_MIN, ZOMBIE_SPAWN_Y } from '@/game/data/constants';
import { ZOMBIES } from '@/game/data/zombies';
import { frontierZombie } from '@/game/engine/frontier';
import { mulberry32, randomRange, shuffle } from '@/game/engine/rng';
import type { CardId, CardLevels, MatchMode, StageDef, TroopDef, TroopEntity, World, ZombieEntity, ZombieId } from '@/game/types';

/** O que o jogador leva para a partida: deck de 8, níveis das cartas e peças da caminhonete. */
export interface MatchSetup {
  deck: CardId[];
  cardLevels: CardLevels;
  truck?: TruckLevels;
}

export const DEFAULT_SEED = 1;

export function createWorld(stage: StageDef, setup: MatchSetup, seed = DEFAULT_SEED, mode: MatchMode = 'stage'): World {
  const rng = mulberry32(seed);
  const order = shuffle(rng, setup.deck);
  const base = baseStats(setup.truck ?? STOCK_TRUCK);
  return {
    stage,
    mode,
    waveIndex: 0,
    waveTime: 0,
    spawnCursor: 0,
    phase: 'intermission',
    phaseTimer: INTERMISSION_DURATION,
    base: { hp: base.hp, maxHp: base.hp, damage: base.damage, cooldown: 0, sinceShot: Number.POSITIVE_INFINITY, target: null },
    troops: [],
    zombies: [],
    effects: [],
    areas: [],
    blood: base.startBlood,
    hand: order.slice(0, HAND_SIZE),
    queue: order.slice(HAND_SIZE),
    // Carta sem nível salvo (acabou de entrar no jogo) joga no nível 1
    cardLevels: Object.fromEntries(CARD_IDS.map((id) => [id, setup.cardLevels[id] ?? 1])) as CardLevels,
    speed: 1,
    paused: false,
    shake: 0,
    eventFired: false,
    weather: null,
    pendingCash: 0,
    stageCash: 0,
    killedThisWave: 0,
    totalThisWave: stage.waves[0]?.spawns.length ?? 0,
    commands: [],
    events: [],
    rng,
    nextUid: 1,
    time: 0,
  };
}

/** Tropa recém-mobilizada, com atributos do nível da carta (GDD seção 10). */
export function createTroop(world: World, def: TroopDef, level: number, x: number, y: number): TroopEntity {
  const power = cardPower(level);
  const maxHp = def.hp * power;
  return {
    uid: world.nextUid++,
    def,
    level,
    x,
    y,
    hp: maxHp,
    maxHp,
    damage: def.damage * power,
    cooldown: 0,
    sinceAttack: Number.POSITIVE_INFINITY,
    deployTimer: TROOP_DEPLOY_TIME,
    target: null,
    moving: false,
    travelled: 0,
    // Tropas olham para cima, de onde vêm os zumbis.
    dirX: 0,
    dirY: -1,
    hitFlash: 0,
    chill: 0,
    age: 0,
    evo: evolutionTier(level),
    shots: 0,
  };
}

/** Zumbi acima do topo do campo, já com o escalonamento da fase (GDD seção 8) ou da onda (Sobrevivência). */
export function createZombie(world: World, id: ZombieId): ZombieEntity {
  // Na Fronteira, a ameaça do planeta e a mutação do chefe mudam a definição
  const def = frontierZombie(world, ZOMBIES[id]);
  const s = world.stage.waves[world.waveIndex]?.level ?? world.stage.index;
  const maxHp = zombieHp(def, s);
  const suit = def.suit ? maxHp * def.suit.ratio : 0;
  return {
    uid: world.nextUid++,
    def,
    x: randomRange(world.rng, ZOMBIE_SPAWN_X_MIN, ZOMBIE_SPAWN_X_MAX),
    // O Casulo brota direto no campo; os outros descem do topo
    y: def.plant ? randomRange(world.rng, def.plant.minY, def.plant.maxY) : ZOMBIE_SPAWN_Y,
    hp: maxHp,
    maxHp,
    damage: zombieDamage(def, s),
    reward: zombieReward(def, s),
    cooldown: 0,
    state: 'walking',
    target: null,
    travelled: 0,
    dirX: 0,
    dirY: 1,
    hitFlash: 0,
    burrowed: def.burrow !== undefined,
    emergeY: def.burrow ? randomRange(world.rng, def.burrow.minY, def.burrow.maxY) : 0,
    slow: 0,
    slowTimer: 0,
    stun: 0,
    suit,
    maxSuit: suit,
    spawnTimer: def.spawner?.every ?? 0,
  };
}
