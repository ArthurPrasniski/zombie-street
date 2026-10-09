import type { World } from '@/game/types';

export function cleanup(world: World, _dt: number): void {
  removeWhere(world.zombies, (zombie) => zombie.state === 'dead');
  removeWhere(world.troops, (troop) => troop.hp <= 0);
  removeWhere(world.effects, (effect) => effect.ttl <= 0);
}

/** Remove itens no lugar, sem criar um array novo a cada passo. */
export function removeWhere<T>(items: T[], shouldRemove: (item: T) => boolean): void {
  let write = 0;
  for (let read = 0; read < items.length; read++) {
    if (!shouldRemove(items[read])) items[write++] = items[read];
  }
  items.length = write;
}
