import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { CARDS } from '@/game/data/cards';
import type { CardId } from '@/game/types';
import type { DragHandlers } from '@/ui/combat/CardHand';
import { PixelCard } from './PixelCard';
interface Props extends DragHandlers {
 hand:CardId[];next:CardId|null;blood:number;troopsFull:boolean;cardWidth:number;draggingSlot:number|null;
}
export function PixelHand({hand,next,blood,troopsFull,cardWidth,draggingSlot,...handlers}:Props) {
 return <View style={styles.row}>
  {next&&<PixelCard card={next} width={Math.round(cardWidth*.6)} hideName/>}
  {hand.map((card,slot)=><HandCard key={slot} card={card} slot={slot} width={cardWidth} affordable={blood>=CARDS[card].cost&&!(troopsFull&&CARDS[card].kind==='troop')} dragging={draggingSlot===slot} handlers={handlers}/>)}
 </View>;
}
function HandCard({card,slot,width,affordable,dragging,handlers}:{card:CardId;slot:number;width:number;affordable:boolean;dragging:boolean;handlers:DragHandlers}) {
 const latest=useRef({slot,affordable,handlers});
 useEffect(()=>{latest.current={slot,affordable,handlers};});
 // PanResponder invokes closures during gestures only; creation never reads the ref.
 // eslint-disable-next-line react-hooks/refs
 const [responder]=useState(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>latest.current.affordable,
  onMoveShouldSetPanResponder:()=>latest.current.affordable,
  onPanResponderGrant:e=>latest.current.handlers.onDragStart(latest.current.slot,e.nativeEvent.pageX,e.nativeEvent.pageY),
  onPanResponderMove:e=>latest.current.handlers.onDragMove(latest.current.slot,e.nativeEvent.pageX,e.nativeEvent.pageY),
  onPanResponderRelease:e=>latest.current.handlers.onDragEnd(latest.current.slot,e.nativeEvent.pageX,e.nativeEvent.pageY),
  onPanResponderTerminate:()=>latest.current.handlers.onDragEnd(latest.current.slot,-1,-1),
 }));
 return <View {...responder.panHandlers} style={dragging?styles.dragging:undefined}><PixelCard card={card} width={width} dimmed={!affordable}/></View>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',gap:6,alignItems:'flex-end',justifyContent:'center'},dragging:{opacity:.35,transform:[{translateY:-8}]}});
