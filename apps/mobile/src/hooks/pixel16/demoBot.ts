import { CARDS, isTroop } from '@/game/data/cards';
import { DEPLOY_ZONE } from '@/game/data/constants';
import { canAfford, playCard } from '@/game/engine/cards';
import type { World } from '@/game/types';
/** Visual review bot: wait for underused cards so expensive units also get exercised. */
export function pilotBot(world:World) {
 if(world.paused||world.phase==='cleared'||world.phase==='failed')return;
 const slots=world.hand.map((id,slot)=>({slot,plays:world.stats.cards[id]??0})).sort((a,b)=>a.plays-b.plays||a.slot-b.slot);
 const slot=slots[0]?.slot;if(slot===undefined||!canAfford(world,slot))return;
 const card=CARDS[world.hand[slot]];
 const front=world.zombies.filter(z=>z.state!=='dead').sort((a,b)=>b.y-a.y)[0];
 if(isTroop(card)){
  const x=Math.min(DEPLOY_ZONE.maxX,Math.max(DEPLOY_ZONE.minX,front?.x??300));
  playCard(world,slot,x,card.role==='ranged'?720:600);
 }else if(card.id==='medkit'){
  const hurt=[...world.troops].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(hurt)playCard(world,slot,hurt.x,hurt.y);
 }else if(front&&front.y>40)playCard(world,slot,front.x,front.y);
}
