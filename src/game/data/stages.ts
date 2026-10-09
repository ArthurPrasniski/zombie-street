import { EVENT_DELAY, EVENT_WAVES, WORLD_EVENT } from '@/game/data/events';
import { type FrontierWorld, PLANETS, THREAT } from '@/game/data/frontier';
import { CAMPAIGN_WORLDS, STAGES_PER_WORLD, worldDef, worldOf } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import type { SpawnEntry, StageDef, WaveDef, WorldDef, ZombieId } from '@/game/types';

/** Fim da campanha (Atos 1 a 3); as fases depois dela são a Fronteira, sem fim. */
export const STAGE_COUNT = CAMPAIGN_WORLDS * STAGES_PER_WORLD;
export const WAVES_PER_STAGE = 5;
export const SPAWN_INTERVAL = 0.9;

/**
 * Seção 17.4: zumbis especiais nas ondas 1 a 4, em qualquer mundo, a partir da fase `from`.
 * `perWave[n - 1]` por onda; onde há algum, +1 a cada SPECIAL_GROWTH fases depois de `from`.
 */
export const SPECIAL_ZOMBIES: { zombie: ZombieId; from: number; perWave: number[] }[] = [
  { zombie: 'spitter', from: 8, perWave: [1, 1, 2, 2] },
  { zombie: 'digger', from: 15, perWave: [0, 1, 1, 2] },
  { zombie: 'splitter', from: 22, perWave: [0, 1, 1, 2] },
  { zombie: 'shielder', from: 30, perWave: [0, 0, 1, 1] },
];
export const SPECIAL_GROWTH = 15;

/** Quantos zumbis especiais `entry` vêm na onda n (1 a 4) da fase s. */
export function specialCount(entry: (typeof SPECIAL_ZOMBIES)[number], n: number, s: number): number {
  const base = entry.perWave[n - 1] ?? 0;
  if (s < entry.from || base === 0) return 0;
  return base + Math.floor((s - entry.from) / SPECIAL_GROWTH);
}

/** Todos os zumbis que podem aparecer na fase s (para carregar só as sheets necessárias). */
export function stageZombies(s: number): ZombieId[] {
  const world = worldDef(worldOf(s));
  const ids: ZombieId[] = ['walker', 'runner', world.boss];
  if (world.zombie) ids.push(world.zombie);
  for (const entry of SPECIAL_ZOMBIES) if (s >= entry.from) ids.push(entry.zombie);
  // Quem se divide ou solta larvas traz os filhotes
  for (const id of [...ids]) {
    const child = ZOMBIES[id].split?.into ?? ZOMBIES[id].spawner?.into;
    if (child && !ids.includes(child)) ids.push(child);
  }
  // Infestação (Fronteira) e o evento Esporos trazem os especiais e os casulos
  const event = 'planet' in world ? PLANETS[world.planet].event : WORLD_EVENT[world.id];
  if (event === 'spores') ids.push(...(['pod', 'larva'] as ZombieId[]).filter((id) => !ids.includes(id)));
  if ('threat' in world && world.threat === 'infested') for (const entry of SPECIAL_ZOMBIES) if (!ids.includes(entry.zombie)) ids.push(entry.zombie);
  return ids;
}

// Fases ajustadas à mão. Quando existir, substitui a fase gerada.
export const STAGE_OVERRIDES: Partial<Record<number, StageDef>> = {};

export function getStage(s: number): StageDef {
  return STAGE_OVERRIDES[s] ?? generateStage(s);
}

/**
 * Fase global s (1 a 50): w = mundo (0 a 4), n = onda (1 a 4).
 * A quantidade cresce pela fase global, sem recomeçar a cada mundo:
 * walkers = 5 + n + floor(s / 3); runners = floor((n + floor(s / 3)) / 2);
 * zumbi do mundo (a partir do mundo 2) = floor((n + 2w) / 2).
 * Onda 5: o chefe do mundo (primeiro), 4 + floor(s / 3) walkers e w + 1 zumbis do mundo.
 * Ondas 1 a 4 também trazem os zumbis especiais já liberados (SPECIAL_ZOMBIES); as ondas 2 e 4,
 * o evento de cenário do mundo.
 */
export function generateStage(s: number): StageDef {
  const w = worldOf(s);
  const world = worldDef(w);
  const waves: WaveDef[] = [];
  for (let n = 1; n < WAVES_PER_STAGE; n++) waves.push(regularWave(s, w, n));
  waves.push(bossWave(s, w));
  // Evento de cenário do mundo nas ondas 2 e 4, num momento que varia com a fase (seção 17.5)
  const event = 'planet' in world ? PLANETS[world.planet].event : WORLD_EVENT[world.id];
  for (const n of EVENT_WAVES) waves[n - 1].event = { kind: event, at: eventDelay(s, n) };
  if ('threat' in world) applyThreat(waves, world);
  return { index: s, waves };
}

/**
 * Depois da fase 50 a quantidade de zumbis por onda para de crescer (no patamar da fase 50 e do
 * 5º mundo); a dificuldade segue pela vida e pelo dano (balance.ts) e pelos zumbis novos.
 */
export const COUNT_CAP_STAGE = 50;
export const COUNT_CAP_WORLD = 4;

/** Quantidade do zumbi do mundo, com a fração do mundo (pelo menos 1). */
const worldZombieCount = (world: WorldDef, count: number): number => Math.max(1, Math.round(count * (world.zombieShare ?? 1)));

/** Onda n (1 a 4) na dificuldade s, com o zumbi do mundo w e os especiais já liberados. */
export function regularWave(s: number, w: number, n: number): WaveDef {
  const world = worldDef(w);
  const c = Math.min(s, COUNT_CAP_STAGE);
  const cw = Math.min(w, COUNT_CAP_WORLD);
  const extras: [ZombieId, number][] = [['runner', Math.floor((n + Math.floor(c / 3)) / 2)]];
  if (world.zombie) extras.push([world.zombie, worldZombieCount(world, Math.floor((n + 2 * cw) / 2))]);
  for (const entry of SPECIAL_ZOMBIES) {
    const count = specialCount(entry, n, c);
    if (count > 0) extras.push([entry.zombie, count]);
  }
  return toWave(spread(5 + n + Math.floor(c / 3), extras));
}

/** Onda do chefe do mundo w (ele entra primeiro) na dificuldade s. */
export function bossWave(s: number, w: number): WaveDef {
  const world = worldDef(w);
  const c = Math.min(s, COUNT_CAP_STAGE);
  const extras: [ZombieId, number][] = world.zombie ? [[world.zombie, worldZombieCount(world, Math.min(w, COUNT_CAP_WORLD) + 1)]] : [];
  return toWave([world.boss, ...spread(4 + Math.floor(c / 3), extras)]);
}

/** Onda com chefe (o sangue enche em dobro). */
export const isBossWave = (wave: WaveDef | undefined): boolean => wave !== undefined && wave.spawns.length > 0 && ZOMBIES[wave.spawns[0].zombie].isBoss === true;

/**
 * Ameaça da Fronteira nas ondas (seção 18.5): Enxame põe mais andarilhos, Infestação mais
 * especiais e Sem descanso aperta o intervalo entre eles. Rápida e Blindada valem no motor.
 */
function applyThreat(waves: WaveDef[], world: FrontierWorld): void {
  const t = world.tier;
  for (const wave of waves) {
    if (world.threat === 'swarm') {
      const extra = Math.round(wave.spawns.length * THREAT.swarmWalkers * t);
      const last = wave.spawns[wave.spawns.length - 1]?.delay ?? 0;
      for (let i = 0; i < extra; i++) wave.spawns.push({ zombie: 'walker', delay: last + (i + 1) * SPAWN_INTERVAL * 0.5 });
    } else if (world.threat === 'infested') {
      const last = wave.spawns[wave.spawns.length - 1]?.delay ?? 0;
      SPECIAL_ZOMBIES.forEach((entry, i) => {
        for (let k = 0; k < THREAT.infestedSpecials * t; k++) wave.spawns.push({ zombie: entry.zombie, delay: last + (i + k + 1) * SPAWN_INTERVAL });
      });
    } else if (world.threat === 'relentless') {
      for (const spawn of wave.spawns) spawn.delay *= 1 - THREAT.relentlessPause;
    }
  }
}

/** Segundos depois do início da onda em que o evento acontece (entre 3 e 8, sem sorteio). */
export function eventDelay(s: number, n: number): number {
  return EVENT_DELAY.min + ((s * 5 + n * 3) % (EVENT_DELAY.max - EVENT_DELAY.min + 1));
}

/** Espalha cada tipo extra de forma uniforme entre os walkers. */
function spread(walkers: number, extras: [ZombieId, number][]): ZombieId[] {
  const total = walkers + extras.reduce((sum, [, n]) => sum + n, 0);
  const order: ZombieId[] = new Array(total).fill('walker');
  extras.forEach(([id, count], kind) => {
    for (let k = 0; k < count; k++) {
      // Cada tipo começa num deslocamento diferente, para não disputar o mesmo lugar
      let i = Math.floor(((k + 0.5 + kind * 0.37) * total) / count) % total;
      while (order[i] !== 'walker') i = (i + 1) % total;
      order[i] = id;
    }
  });
  return order;
}

function toWave(order: ZombieId[]): WaveDef {
  // Quem vem em grupo (Xeno) entra com os parceiros no mesmo instante
  const spawns: SpawnEntry[] = order.flatMap((zombie, i) => Array.from({ length: ZOMBIES[zombie].pack ?? 1 }, () => ({ zombie, delay: i * SPAWN_INTERVAL })));
  return { spawns };
}
