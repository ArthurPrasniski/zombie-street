import { MAX_TROOPS } from '@/game/data/constants';
import { CARD_IDS, STARTER_DECK } from '@/game/data/cards';
import { getStage } from '@/game/data/stages';
import { createWorld } from '@/game/engine/world';
import type { CardLevels, World } from '@/game/types';
/** Same campaign rules and seed for both renderers. No account/progress dependencies. */
export function createPilotWorld(): World {
 return createWorld(getStage(1),{deck:[...STARTER_DECK],cardLevels:Object.fromEntries(CARD_IDS.map(id=>[id,1])) as CardLevels},16016);
}
export function pilotHud(world: World) {
 return { blood:Math.floor(world.blood),base:Math.max(0,Math.round(world.base.hp/world.base.maxHp*100)),wave:world.waveIndex+1,hand:[...world.hand],next:world.queue[0] ?? null,paused:world.paused,speed:world.speed,phase:world.phase,troopsFull:world.troops.filter(t=>t.hp>0).length>=MAX_TROOPS };
}
