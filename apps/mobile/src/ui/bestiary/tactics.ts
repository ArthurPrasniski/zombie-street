import { ZOMBIES } from '@/game/data/zombies';
import type { CardId, ZombieId } from '@/game/types';
export function tacticsFor(id: ZombieId): { kind: 'area' | 'armor' | 'leap' | 'general'; cards: CardId[] } {
 const z = ZOMBIES[id];
 if (z.pack || z.spawner || z.split) return { kind: 'area', cards: ['molotov','grenade','firefighter'] };
 if (z.resist || z.armor || z.suit) return { kind: 'armor', cards: ['tesla','chainsaw','crossbow'] };
 if (z.leaper || z.burrow) return { kind: 'leap', cards: ['grenade','cryo','dog'] };
 return { kind: 'general', cards: ['barricade','sniper','sheriff'] };
}
