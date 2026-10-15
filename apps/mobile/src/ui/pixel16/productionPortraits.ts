import type {CardId,ZombieId} from '@/game/types';
import {CARD_IDS} from '@/game/data/cards';
import {ZOMBIES} from '@/game/data/zombies';
import {PORTRAIT_MODULES} from '@/assets/pixel16-detailed/modules';
const sources=PORTRAIT_MODULES as Record<string,number>;
export const DETAILED_CARD_ART=Object.fromEntries(CARD_IDS.filter(id=>id in sources).map(id=>[id,sources[id]])) as Record<CardId,number>;
export const DETAILED_ZOMBIE_ART=Object.fromEntries(Object.keys(ZOMBIES).filter(id=>id in sources).map(id=>[id,sources[id]])) as Record<ZombieId,number>;
