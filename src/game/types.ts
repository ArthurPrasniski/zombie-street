import type { ScenarioEventId } from '@/game/data/events';

// ---------- Definições (dados de src/game/data) ----------

export type TroopId =
  | 'sniper' | 'sheriff' | 'shotgun' | 'chainsaw' | 'dog' | 'barricade' | 'soldier' | 'firefighter' | 'medic' | 'crossbow' | 'turret'
  | 'drone' | 'tesla' | 'laser' | 'titan';
export type SpellId = 'grenade' | 'medkit' | 'molotov' | 'airstrike' | 'landmine' | 'cryo' | 'forcefield' | 'blackhole' | 'orbital';
export type CardId = TroopId | SpellId;
export type ZombieId =
  | 'walker' | 'runner' | 'brute' | 'cop' | 'riot' | 'bloater' | 'hulk' | 'grunt' | 'general' | 'frost' | 'yeti'
  | 'spitter' | 'digger' | 'splitter' | 'splitling' | 'shielder'
  | 'android' | 'mutant' | 'astronaut' | 'colossus' | 'director' | 'padChief'
  | 'cosmonaut' | 'xeno' | 'pod' | 'larva' | 'commander' | 'lunarWorm' | 'marsTitan' | 'queen';
/** Tipo do golpe: tiros de arma de fogo, elétrico (Torre Tesla) ou o resto. */
export type DamageKind = 'firearm' | 'electric' | 'other';
/** support: não ataca, cura as tropas por perto (Médica). */
export type TroopRole = 'ranged' | 'melee' | 'structure' | 'support';
export type WorldId = 'farm' | 'city' | 'swamp' | 'desert' | 'snow' | 'tech' | 'lab' | 'launch' | 'station' | 'moon' | 'mars' | 'hive';

export interface TroopDef {
  kind: 'troop'; id: TroopId; name: string; weapon: string; cost: number; role: TroopRole;
  hp: number; damage: number; attackInterval: number; range: number; speed: number;
  firearm: boolean; splash?: { targets: number; radius: number };
  /** Construção: os chefes que só atacam construções param nela (Barricada, Torreta). */
  building?: boolean;
  /** Some sozinha depois de tantos segundos (Torreta). */
  lifetime?: number;
  /** Cura por pulso nas tropas a até `range` (Médica). */
  heal?: number;
  /** Tiro que atravessa: acerta até `max` zumbis numa faixa de `width` na linha do tiro (Besta). */
  pierce?: { width: number; max: number };
  /** Visual do ataque: chamas (Bombeiro), virote (Besta) ou raio laser (Cabo Laser). Sem isso, armas de fogo usam o tiro. */
  fx?: 'flame' | 'bolt' | 'laser';
  /** Golpe elétrico (Torre Tesla): o dobro nos robôs. */
  electric?: boolean;
  /** Voa (Drone): só zumbis que atacam de longe o atingem. */
  flying?: boolean;
  /** Raio que pula do alvo para até `jumps` zumbis a até `radius`, perdendo `falloff` a cada pulo (Torre Tesla). */
  chain?: { jumps: number; radius: number; falloff: number };
  /** Empurra o zumbi atingido para trás (Exotraje Titã; os chefes não). */
  knockback?: number;
  /** Tamanho de desenho (o Exotraje Titã é maior); padrão 1. */
  scale?: number;
}
export interface SpellDef {
  kind: 'spell'; id: SpellId; name: string; cost: number; radius: number;
  damage?: number; heal?: number; dps?: number; duration?: number; delay?: number;
  /** Mina: distância em que um zumbi a dispara. */
  trigger?: number;
  /** Criogenia: segundos atordoado e lentidão depois. */
  freeze?: number;
  /** Escudo de Energia: vida da parede (x poder do nível) e largura. */
  wallHp?: number;
  width?: number;
  /** Buraco Negro: força com que puxa os zumbis para o centro (unidades por segundo). */
  pull?: number;
}
export type CardDef = TroopDef | SpellDef;
export type CardLevels = Record<CardId, number>;

export interface ZombieDef {
  id: ZombieId; name: string; hp: number; speed: number; damage: number; attackInterval: number; reward: number; targetsTroops: boolean;
  isBoss?: boolean; scale?: number;
  /** Desconta este tanto de cada golpe (mínimo 1 de dano). */
  armor?: number;
  /** Ao morrer, explode e fere as tropas por perto. */
  burst?: { radius: number; damage: number };
  /** Golpe congela a tropa por tantos segundos (ataca e anda mais devagar). */
  chill?: number;
  /** Ataca de longe (Cuspidor): para a esta distância do alvo e cospe ácido. */
  ranged?: number;
  /** Anda por baixo da terra, sem poder ser alvo, e surge entre minY e maxY (Escavador). */
  burrow?: { minY: number; maxY: number; speed: number };
  /** Ao morrer, vira `count` zumbis `into` (Divisor). */
  split?: { into: ZombieId; count: number };
  /** Os outros zumbis a até `radius` levam `reduction` a menos de dano de golpes diretos (Porta-escudo). */
  aura?: { radius: number; reduction: number };
  /** Multiplicador do dano por tipo de golpe (Androide: tiro x0,5, elétrico x2). */
  resist?: Partial<Record<DamageKind, number>>;
  /** Fere as tropas a até `radius` com `dps` por segundo, sem parar (Mutante). */
  toxic?: { radius: number; dps: number };
  /** Traje (fração da vida máxima) que absorve os golpes; depois que trinca, o zumbi leva `cracked` vezes o dano (Astronauta). */
  suit?: { ratio: number; cracked: number };
  /** Passa por cima de tropas e barricadas e vai direto na base (Cosmonauta, Comandante). */
  leaper?: boolean;
  /** Vem em grupo: cada um na onda vira `pack` juntos (Xeno). */
  pack?: number;
  /** Brota direto no campo entre minY e maxY, em vez de descer do topo (Casulo). */
  plant?: { minY: number; maxY: number };
  /** Solta `count` zumbis `into` a cada `every` segundos enquanto vive (Casulo, Rainha). */
  spawner?: { into: ZombieId; every: number; count: number };
  /** Abaixo de `below` da vida, anda `speed` vezes mais rápido (Titã Marciano). */
  rage?: { below: number; speed: number };
  /** Recupera esta fração da vida máxima por segundo (chefe mutado da Fronteira). */
  regen?: number;
}
/**
 * `zombieShare`: fração da quantidade normal do zumbi do mundo (Xenos vêm em trios, Casulos soltam
 * larvas). `frontier`: índice do mundo, só nos planetas gerados da Fronteira (seção 18.5).
 */
export interface WorldDef { id: WorldId; name: string; zombie: ZombieId | null; boss: ZombieId; zombieShare?: number; frontier?: number; }
export interface SpawnEntry { zombie: ZombieId; delay: number; } // segundos desde o início da onda
/** Evento de cenário `at` segundos depois do início da onda; `level`: dificuldade própria (Sobrevivência). */
export interface WaveDef { spawns: SpawnEntry[]; event?: { kind: ScenarioEventId; at: number }; level?: number; }
export interface StageDef { index: number; waves: WaveDef[]; } // sempre 5 ondas

// ---------- Entidades do mundo ----------

export interface BaseEntity { hp: number; maxHp: number; damage: number; cooldown: number; sinceShot: number; target: ZombieEntity | null; }
export interface TroopEntity {
  uid: number; def: TroopDef; level: number; x: number; y: number; hp: number; maxHp: number; damage: number;
  cooldown: number; sinceAttack: number; deployTimer: number; target: ZombieEntity | null;
  moving: boolean; travelled: number; dirX: number; dirY: number; hitFlash: number; // dir: para onde olha (y+ = descendo)
  chill: number; age: number; // segundos congelada e segundos em campo
  /** Evolução da carta (0, 1 ou 2) e tiros dados (Xerife evoluído). */
  evo: number; shots: number;
}
export interface ZombieEntity {
  uid: number; def: ZombieDef; x: number; y: number; hp: number; maxHp: number; damage: number; reward: number;
  cooldown: number; state: 'walking' | 'attacking' | 'dead'; target: TroopEntity | null; // atacando com target null = base
  travelled: number; dirX: number; dirY: number; hitFlash: number;
  /** Escavador: embaixo da terra até chegar em emergeY. */
  burrowed: boolean; emergeY: number;
  /** Lentidão (fração da velocidade perdida) e segundos que faltam; segundos atordoado (não anda nem ataca). */
  slow: number; slowTimer: number; stun: number;
  /** Vida que ainda resta no traje (Astronauta); 0 = trincado ou sem traje. */
  suit: number; maxSuit: number;
  /** Segundos até soltar as próximas larvas (Casulo, Rainha). */
  spawnTimer: number;
}

export type Effect =
  | { kind: 'tracer'; fromX: number; fromY: number; toX: number; toY: number; ttl: number; style?: 'bolt' | 'laser' }
  | { kind: 'zap'; points: number[]; ttl: number }
  | { kind: 'frost'; x: number; y: number; radius: number; ttl: number }
  | { kind: 'flame'; fromX: number; fromY: number; toX: number; toY: number; ttl: number }
  | { kind: 'damageText'; x: number; y: number; value: number; ttl: number }
  | { kind: 'explosion'; x: number; y: number; radius: number; ttl: number; duration: number }
  | { kind: 'heal'; x: number; y: number; ttl: number }
  | { kind: 'smoke'; x: number; y: number; ttl: number }
  | { kind: 'spit'; fromX: number; fromY: number; toX: number; toY: number; ttl: number }
  | { kind: 'dirt'; x: number; y: number; ttl: number }
  | { kind: 'corpse'; unit: TroopId | ZombieId; x: number; y: number; dirX: number; dirY: number; ttl: number };

/** Efeitos de arma especial que agem com o tempo. */
export type Area =
  | { kind: 'fire'; uid: number; x: number; y: number; radius: number; dps: number; ttl: number; duration: number }
  | { kind: 'airstrike'; uid: number; x: number; y: number; radius: number; damage: number; delay: number; total: number }
  | { kind: 'mine'; uid: number; x: number; y: number; trigger: number; radius: number; damage: number; exploded: boolean }
  // Armas do Ato 3 (seção 18.4)
  | { kind: 'forcefield'; uid: number; x: number; y: number; width: number; hp: number; maxHp: number; ttl: number; duration: number }
  | { kind: 'blackhole'; uid: number; x: number; y: number; radius: number; pull: number; damage: number; ttl: number; duration: number }
  | { kind: 'orbital'; uid: number; x: number; y: number; width: number; damage: number; delay: number; total: number }
  // Eventos de cenário (seção 17.5)
  | { kind: 'hay'; uid: number; x: number; y: number; hit: number[] }
  | { kind: 'carBomb'; uid: number; x: number; y: number; fuse: number; exploded: boolean }
  | { kind: 'shell'; uid: number; x: number; y: number; delay: number; style: 'bomb' | 'debris' | 'meteor' }
  | { kind: 'gas'; uid: number; x: number; y: number; ttl: number; duration: number }
  | { kind: 'jet'; uid: number; x: number; y: number; hit: number[] };

/** Clima de um evento (névoa, nevasca), com o tempo que falta. */
export interface Weather { kind: 'fog' | 'blizzard' | 'blackout' | 'dust'; ttl: number; duration: number; }

export type GameCommand =
  | { type: 'playCard'; slot: number; x: number; y: number }
  | { type: 'setSpeed'; speed: 1 | 2 }
  | { type: 'setPaused'; paused: boolean };

export type GameEvent =
  | { type: 'waveStarted'; wave: number }
  | { type: 'bossSpawned' }
  | { type: 'zombieKilled'; zombie: ZombieId; reward: number }
  | { type: 'zombieSpawned'; zombie: ZombieId }
  | { type: 'cardPlayed'; card: CardId }
  | { type: 'attack'; source: TroopId | 'base' }
  | { type: 'explosion'; big: boolean }
  | { type: 'baseHit' }
  | { type: 'troopDown'; troop: TroopId }
  | { type: 'stageCleared'; stage: number; cashEarned: number; stars: number }
  | { type: 'stageFailed'; stage: number; cashEarned: number }
  | { type: 'scenarioEvent'; kind: ScenarioEventId }
  | { type: 'survivalOver'; waves: number; cashEarned: number };

export type MatchMode = 'stage' | 'survival';

export interface World {
  stage: StageDef; mode: MatchMode; waveIndex: number; waveTime: number; spawnCursor: number;
  phase: 'intermission' | 'fighting' | 'cleared' | 'failed'; phaseTimer: number;
  base: BaseEntity; troops: TroopEntity[]; zombies: ZombieEntity[]; effects: Effect[]; areas: Area[];
  blood: number; hand: CardId[]; queue: CardId[]; cardLevels: CardLevels;
  speed: 1 | 2; paused: boolean; shake: number;
  /** Evento de cenário da onda atual já aconteceu; clima em andamento. */
  eventFired: boolean; weather: Weather | null;
  pendingCash: number; stageCash: number; killedThisWave: number; totalThisWave: number;
  commands: GameCommand[]; events: GameEvent[];
  rng: () => number; nextUid: number; time: number;
}

// ---------- Render ----------

export interface RenderSnapshot {
  base: { hpRatio: number; sinceShot: number };
  troops: {
    kind: TroopId; uid: number; x: number; y: number; hpRatio: number; deploying: boolean; moving: boolean;
    travelled: number; aiming: boolean; sinceAttack: number; untilAttack: number; dirX: number; dirY: number; flash: boolean;
    chilled: boolean; evo: number;
  }[];
  zombies: {
    kind: ZombieId; uid: number; x: number; y: number; hpRatio: number; flash: boolean; scale: number;
    attacking: boolean; attackProgress: number; travelled: number; dirX: number; dirY: number;
    /** Embaixo da terra (desenha só o monte de terra) e raio do escudo (0 sem escudo). */
    burrowed: boolean; aura: number; slowed: boolean; stunned: boolean;
    /** Traje do Astronauta (0 a 1; -1 sem traje) e raio da aura tóxica (0 sem aura). */
    suitRatio: number; toxic: number;
    /** Pula por cima de tudo (Cosmonauta, Comandante): o render faz ele quicar. */
    leaper: boolean;
  }[];
  effects: Effect[];
  areas: Area[];
  blood: number;
  shake: number;
  time: number;
  weather: Weather | null;
}
