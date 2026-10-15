import type { RenderSnapshot } from '@/game/types';
import type { SpriteSet } from '@/game/render/sprites';
import { viewFlip, viewRow } from '@/game/render/animation';
import { detailedMuzzle } from './drawDetailed';

/** Presentation-only attachment points; never modify the engine snapshot. */
export function attachedEffects(snap: RenderSnapshot, sprites: SpriteSet) {
 'worklet';
 return snap.effects.map(effect=>{
  if(effect.kind==='flame'){
   const troop=snap.troops.find(t=>t.kind==='firefighter'&&t.x===effect.fromX&&t.y===effect.fromY);
   const sheet=troop&&sprites.detailedUnits?.firefighter;
   if(!troop||!sheet)return effect;
   const row=viewRow(troop.dirX,troop.dirY),offset=detailedMuzzle(sheet,row,viewFlip(row,troop.dirX));
   // flameJet's legacy origin is 26 units above its input foot position.
   return {...effect,fromX:troop.x+offset[0],fromY:troop.y+offset[1]+26};
  }
  if(effect.kind==='zap'){
   const troop=snap.troops.find(t=>t.kind==='tesla'&&t.x===effect.points[0]&&Math.abs(t.y-58-effect.points[1])<.01);
   const sheet=troop&&sprites.detailedUnits?.tesla;
   if(!troop||!sheet)return effect;
   const points=[...effect.points];points[0]=troop.x;points[1]=troop.y-(sheet.height??64)+6;
   return {...effect,points};
  }
  return effect;
 });
}
