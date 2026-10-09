import { CHILL, DIRT_TTL, FIELD, MELEE_AGGRO, TROOP_FIELD } from '@/game/data/constants';
import {
  baseStopY, distance, faceTowards, faceUpfield, isActive, isAliveTroop, isAliveZombie, nearestTroop, nearestZombie, zombieAggro, zombieReach,
} from '@/game/engine/queries';
import { zombieSpeedFactor } from '@/game/engine/evolution';
import { weatherSpeed } from '@/game/engine/scenario';
import { blockedByField } from '@/game/engine/spells';
import type { TroopEntity, World, ZombieEntity } from '@/game/types';

// Mantém o alvo atual até ele se afastar bem mais que o raio de aggro (evita trocar a cada passo).
const KEEP_TARGET = 1.5;
// Tolerância de chegada: sem ela, erros de ponto flutuante fazem a unidade "andar" para sempre.
const ARRIVE = 0.5;
// Nenhum zumbi passa do muro da base.
const BASE_LIMIT = FIELD.maxY;

export function movement(world: World, dt: number): void {
  if (!isActive(world)) return;
  for (const troop of world.troops) {
    if (troop.hp <= 0) continue;
    troop.moving = false;
    if (troop.deployTimer > 0) {
      troop.deployTimer -= dt;
      continue;
    }
    if (troop.def.role === 'melee') moveMelee(world, troop, dt);
  }
  for (const zombie of world.zombies) {
    if (zombie.state !== 'dead') moveZombie(world, zombie, dt);
  }
}

type Bounds = typeof FIELD;

/**
 * Anda em direção ao alvo até ficar a `reach` dele, sem sair de `bounds` (na borda, desliza
 * ao longo dela). Retorna quanto andou de verdade (0 se a borda não deixa avançar).
 */
function approach(unit: TroopEntity | ZombieEntity, x: number, y: number, reach: number, speed: number, dt: number, bounds: Bounds): number {
  faceTowards(unit, x, y);
  const d = distance(unit.x, unit.y, x, y);
  if (d <= reach + ARRIVE) return 0;
  const step = Math.min(speed * dt, d - reach);
  const nx = clamp(unit.x + unit.dirX * step, bounds.minX, bounds.maxX);
  const ny = clamp(unit.y + unit.dirY * step, bounds.minY, bounds.maxY);
  const moved = distance(unit.x, unit.y, nx, ny);
  unit.x = nx;
  unit.y = ny;
  unit.travelled += moved;
  return moved;
}

/** A tropa alcança o zumbi sem sair da área dela (TROOP_FIELD mais o alcance do golpe). */
function reachable(troop: TroopEntity, zombie: ZombieEntity): boolean {
  const r = troop.def.range;
  const f = TROOP_FIELD;
  return zombie.x >= f.minX - r && zombie.x <= f.maxX + r && zombie.y >= f.minY - r && zombie.y <= f.maxY + r;
}

/**
 * Corpo a corpo: vai até o zumbi mais próximo a até 350 e para no alcance (GDD seção 6.1).
 * Só persegue zumbis que alcança sem sair da área das tropas (os do alto da arena, não).
 */
function moveMelee(world: World, troop: TroopEntity, dt: number): void {
  const canReach = (zombie: ZombieEntity) => reachable(troop, zombie);
  const current = troop.target;
  const keep = isAliveZombie(current) && canReach(current) && distance(troop.x, troop.y, current.x, current.y) <= MELEE_AGGRO * KEEP_TARGET;
  const target = keep ? current : nearestZombie(world, troop.x, troop.y, MELEE_AGGRO, canReach);
  troop.target = target;
  if (!target) {
    faceUpfield(troop);
    return;
  }
  const speed = troop.def.speed * (troop.chill > 0 ? CHILL.speedSlow : 1) * weatherSpeed(world);
  troop.moving = approach(troop, target.x, target.y, troop.def.range, speed, dt, TROOP_FIELD) > 0;
}

/**
 * Zumbi: vai na tropa a até 120 (o chefe só em construções); senão, desce até a base (GDD seção 7).
 * O Cuspidor para a distância; o Escavador anda por baixo da terra até surgir (seção 17.4).
 */
function moveZombie(world: World, zombie: ZombieEntity, dt: number): void {
  if (zombie.burrowed) {
    dig(world, zombie, dt);
    return;
  }
  const target = pickTarget(world, zombie);
  zombie.target = target;
  if (target) {
    const moved = approach(zombie, target.x, target.y, zombieReach(zombie.def), zombieSpeed(world, zombie), dt, FIELD);
    zombie.state = moved > 0 ? 'walking' : 'attacking';
    return;
  }
  zombie.dirX = 0;
  zombie.dirY = 1;
  // Escudo de Energia: quem chega na parede para e bate nela
  if (!zombie.def.leaper && blockedByField(world, zombie)) {
    zombie.state = 'attacking';
    return;
  }
  const stopY = baseStopY(zombie.def);
  if (zombie.y >= stopY) {
    zombie.y = Math.max(stopY, Math.min(zombie.y, BASE_LIMIT));
    zombie.state = 'attacking';
    return;
  }
  const step = Math.min(zombieSpeed(world, zombie) * dt, stopY - zombie.y);
  zombie.y += step;
  zombie.travelled += step;
  zombie.state = zombie.y >= stopY ? 'attacking' : 'walking';
}

/** Escavador enterrado: desce reto, sem alvo, e surge (com terra voando) ao chegar em emergeY. */
function dig(world: World, zombie: ZombieEntity, dt: number): void {
  const speed = (zombie.def.burrow?.speed ?? zombie.def.speed) * weatherSpeed(world);
  const step = Math.min(speed * dt, Math.max(0, zombie.emergeY - zombie.y));
  zombie.y += step;
  zombie.travelled += step;
  zombie.dirX = 0;
  zombie.dirY = 1;
  zombie.state = 'walking';
  if (zombie.y < zombie.emergeY) return;
  zombie.burrowed = false;
  world.effects.push({ kind: 'dirt', x: zombie.x, y: zombie.y, ttl: DIRT_TTL });
}

/** Velocidade do zumbi agora: nevasca, mordida do Rex evoluído e atordoamento da Granada. */
const zombieSpeed = (world: World, zombie: ZombieEntity) => zombie.def.speed * weatherSpeed(world) * zombieSpeedFactor(zombie) * rage(zombie);

/** Titã Marciano: com pouca vida, corre mais. */
function rage(zombie: ZombieEntity): number {
  const r = zombie.def.rage;
  return r && zombie.hp / zombie.maxHp < r.below ? r.speed : 1;
}

function pickTarget(world: World, zombie: ZombieEntity): TroopEntity | null {
  // Cosmonauta e Comandante passam por cima de tudo e vão direto na base
  if (zombie.def.leaper) return null;
  const structuresOnly = !zombie.def.targetsTroops;
  const aggro = zombieAggro(zombie.def);
  const current = zombie.target;
  if (isAliveTroop(current) && distance(zombie.x, zombie.y, current.x, current.y) <= aggro * KEEP_TARGET) return current;
  // Só quem ataca de longe (Cuspidor) alcança as tropas que voam
  return nearestTroop(world, zombie.x, zombie.y, aggro, structuresOnly, zombie.def.ranged !== undefined);
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
