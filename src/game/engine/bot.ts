import { CARDS, isTroop } from '@/game/data/cards';
import { DEPLOY_ZONE } from '@/game/data/constants';
import { canAfford, playCard } from '@/game/engine/cards';
import type { World } from '@/game/types';

// Alturas onde o jogador simples solta as tropas (atiradores atrás, corpo a corpo na frente).
const RANGED_Y = 720;
const MELEE_Y = 600;
// Só joga arma especial em zumbi que já entrou no campo.
const SPELL_MIN_Y = 40;

/**
 * Jogador simples (testes e demonstração): assim que pode, joga a primeira carta da mão que der.
 * Tropas na coluna do zumbi mais avançado; armas especiais nele (cura vai nas tropas feridas).
 */
export function simpleBot(world: World): void {
  const front = world.zombies.filter((z) => z.state !== 'dead').sort((a, b) => b.y - a.y)[0];
  for (let slot = 0; slot < world.hand.length; slot++) {
    if (!canAfford(world, slot)) continue;
    const card = CARDS[world.hand[slot]];
    if (isTroop(card)) {
      const x = front ? Math.min(DEPLOY_ZONE.maxX, Math.max(DEPLOY_ZONE.minX, front.x)) : 300;
      const y = card.role === 'ranged' ? RANGED_Y : MELEE_Y;
      if (playCard(world, slot, x, y)) return;
    } else if (card.id === 'medkit') {
      const hurt = world.troops.find((t) => t.hp < t.maxHp * 0.6);
      if (hurt && playCard(world, slot, hurt.x, hurt.y)) return;
    } else if (front && front.y > SPELL_MIN_Y && playCard(world, slot, front.x, front.y)) {
      return;
    }
  }
}
