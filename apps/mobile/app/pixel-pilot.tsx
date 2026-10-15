import { goBack } from '@/ui/navigation';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCanvas } from '@/game/render/GameCanvas';
import { PILOT_UNITS, PIXEL_VIEWPORT_HEIGHT, usePixelAssets } from '@/game/render/pixel16/assets';
import { PixelCanvas } from '@/game/render/pixel16/PixelCanvas';
import { useCardDrag } from '@/hooks/useCardDrag';
import { usePixelPilot, type PilotRenderer } from '@/hooks/pixel16/usePixelPilot';
import { pixel16Text as t } from '@/i18n/pixel16';
import { AppText } from '@/ui/kit/AppText';
import { PixelButton } from '@/ui/pixel16/PixelButton';
import { PixelCard } from '@/ui/pixel16/PixelCard';
import { PixelHand } from '@/ui/pixel16/PixelHand';
const UNITS=[...PILOT_UNITS];
export default function PixelPilotRoute() {
 const params=useLocalSearchParams<{autoplay?:string;look?:string}>();
 if(!__DEV__)return <Redirect href="/"/>;
 return <Pilot key={params.look} autoplay={params.autoplay==='1'} initialRenderer={params.look==='current'?'current':'pixel'}/>;
}
function Pilot({autoplay,initialRenderer}:{autoplay:boolean;initialRenderer:PilotRenderer}) {
 const assets=usePixelAssets();const [runId,setRunId]=useState(0);const [renderer,setRenderer]=useState<PilotRenderer>(initialRenderer);
 const {snapshot,hud,metrics,send}=usePixelPilot(runId,renderer,autoplay,assets.ready);
 const {width,height}=useWindowDimensions();const insets=useSafeAreaInsets();
 const [header,setHeader]=useState(154);const [footer,setFooter]=useState(150);
 const aspect=(renderer==='pixel'?PIXEL_VIEWPORT_HEIGHT:900)/600;
 const sceneWidth=Math.max(120,Math.floor(Math.min(width-24,(height-insets.top-insets.bottom-header-footer-8)/aspect)));
 const cardWidth=Math.min(70,Math.floor((width-54)/4.6));
 const {drag,draggingSlot,canvasView,measure,ghostStyle,handlers}=useCardDrag(hud.hand,send,cardWidth);
 const ended=hud.phase==='cleared'||hud.phase==='failed';const metric=metrics[renderer];
 return <SafeAreaView style={styles.screen}>
  <View onLayout={e=>setHeader(e.nativeEvent.layout.height)} style={styles.header}>
   <View style={styles.row}><PixelButton label="‹" accessibilityLabel={t.back} onPress={()=>goBack()}/><AppText style={styles.title}>{t.title}</AppText><PixelButton label={t.restart} onPress={()=>setRunId(n=>n+1)}/></View>
   <AppText variant="small" color="#b5bdc7">{t.note}</AppText>
   <View style={styles.row}>
    <PixelButton label={t.pixel} selected={renderer==='pixel'} onPress={()=>setRenderer('pixel')}/>
    <PixelButton label={t.current} selected={renderer==='current'} onPress={()=>setRenderer('current')}/>
    <PixelButton label={hud.paused?t.resume:t.pause} onPress={()=>send({type:'setPaused',paused:!hud.paused})}/>
    <PixelButton label={`${hud.speed}×`} onPress={()=>send({type:'setSpeed',speed:hud.speed===1?2:1})}/>
   </View>
  </View>
  <View ref={canvasView} onLayout={measure} collapsable={false} style={{width:sceneWidth,height:sceneWidth*aspect}}>
   {assets.ready?(renderer==='pixel'?<PixelCanvas snapshot={snapshot} drag={drag} width={sceneWidth} sprites={assets.sprites}/>:<GameCanvas classic snapshot={snapshot} drag={drag} width={sceneWidth} world="farm" units={UNITS}/>):<View style={styles.message}><AppText>{assets.error?t.failed:t.loading}</AppText>{assets.error&&<PixelButton label={t.retry} onPress={assets.retry}/>}</View>}
   {ended&&<View pointerEvents="none" style={styles.result}><AppText>{hud.phase==='cleared'?t.won:t.lost}</AppText><AppText variant="small">{t.done}</AppText></View>}
  </View>
  <View onLayout={e=>setFooter(e.nativeEvent.layout.height)} style={styles.footer}>
   <View style={styles.row}><AppText variant="small">{t.blood} {hud.blood} · {t.base} {hud.base}% · {t.wave} {hud.wave}</AppText></View>
   <PixelHand hand={hud.hand} next={hud.next} blood={hud.blood} troopsFull={hud.troopsFull} cardWidth={cardWidth} draggingSlot={draggingSlot} {...handlers}/>
   <AppText variant="small" color="#b5bdc7">{autoplay?t.demo:t.hint}</AppText>
   <AppText variant="small" style={styles.metric}>{t.scope}</AppText>
   <AppText variant="small" style={styles.metric}>{t.fps} {metric.fps} · {t.engine} {metric.engineMs} ms · {t.assets} {assets.milliseconds} ms</AppText>
  </View>
  <Animated.View pointerEvents="none" style={[styles.ghost,ghostStyle]}>{draggingSlot!==null&&<PixelCard card={hud.hand[draggingSlot]} width={cardWidth}/>}</Animated.View>
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 screen:{flex:1,alignItems:'center',backgroundColor:'#171b2c'},header:{width:'100%',padding:12,gap:8},
 row:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,flexWrap:'wrap'},title:{flex:1,fontSize:20,fontWeight:'bold',color:'#ffe1aa'},
 footer:{width:'100%',padding:8,gap:6,alignItems:'center'},metric:{fontSize:10,lineHeight:13,color:'#b5bdc7'},
 message:{flex:1,alignItems:'center',justifyContent:'center',gap:12},result:{position:'absolute',top:'40%',left:12,right:12,padding:12,backgroundColor:'#242d3d',borderWidth:2,borderColor:'#b8e835',gap:6},ghost:{position:'absolute',left:0,top:0},
});
