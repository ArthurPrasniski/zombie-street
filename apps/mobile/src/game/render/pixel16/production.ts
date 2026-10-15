import manifest from '@/assets/pixel16-detailed/manifest.json';
import {UNIT_MODULES,WORLD_MODULES,BASE_MODULES} from '@/assets/pixel16-detailed/modules';
import type {WorldId,TroopId,ZombieId} from '@/game/types';
import type {DetailedSheet} from './detailedLayout';

export const DETAIL_SHEETS=UNIT_MODULES as Partial<Record<TroopId|ZombieId,number>>;
const layouts=manifest.layouts as unknown as Record<string,DetailedSheet>;
export const DETAIL_LAYOUTS=Object.fromEntries(Object.keys(DETAIL_SHEETS).map(id=>[id,layouts[id]])) as Partial<Record<TroopId|ZombieId,DetailedSheet>>;
export const DETAIL_FARM=require('@/assets/pixel16-detailed/farm.png');
export const DETAIL_BACKGROUNDS=WORLD_MODULES as Partial<Record<WorldId,number>>;
export const DETAIL_BASE=require('@/assets/pixel16-detailed/farm-base.png');
export const FARM_BASE_LAYOUT=manifest.layouts.base;
export const combatViewportHeight=(world:WorldId)=>DETAIL_BACKGROUNDS[world]?manifest.viewportHeight:900;

const BASE_THEME:Record<WorldId,keyof typeof BASE_MODULES>={farm:'farm',city:'farm',swamp:'farm',desert:'farm',snow:'farm',tech:'armored',lab:'armored',launch:'armored',station:'space',moon:'space',mars:'space',hive:'space'};
export function detailedBaseFor(world:WorldId){
 const theme=BASE_THEME[world];return {image:BASE_MODULES[theme],layout:manifest.bases[theme],theme};
}
