import type { World } from '@/game/types';

/** Faz os efeitos visuais (e a lentidão e o atordoamento dos zumbis) envelhecerem. A remoção fica com o cleanup. */
export function effects(world: World, dt: number): void {
  for (const effect of world.effects) effect.ttl -= dt;
  for (const zombie of world.zombies) {
    if (zombie.hitFlash > 0) zombie.hitFlash = Math.max(0, zombie.hitFlash - dt);
    // Lentidão e atordoamento das cartas evoluídas passam com o tempo
    if (zombie.slowTimer > 0) zombie.slowTimer = Math.max(0, zombie.slowTimer - dt);
    if (zombie.stun > 0) zombie.stun = Math.max(0, zombie.stun - dt);
    // Chefe mutado que se regenera (Fronteira)
    if (zombie.def.regen && zombie.state !== 'dead') zombie.hp = Math.min(zombie.maxHp, zombie.hp + zombie.maxHp * zombie.def.regen * dt);
  }
  for (const troop of world.troops) {
    if (troop.hitFlash > 0) troop.hitFlash = Math.max(0, troop.hitFlash - dt);
  }
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
}
