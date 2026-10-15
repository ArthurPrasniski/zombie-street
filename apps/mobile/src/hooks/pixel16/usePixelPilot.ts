import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { createLoop } from '@/game/engine/loop';
import { pilotBot } from './demoBot';
import { createSnapshot, EMPTY_SNAPSHOT } from '@/game/engine/snapshot';
import type { GameCommand, RenderSnapshot, World } from '@/game/types';
import { createPilotWorld, pilotHud } from './pilot';
export type PilotRenderer = 'pixel'|'current';
export function usePixelPilot(runId: number, renderer: PilotRenderer, autoplay: boolean, ready: boolean) {
 const snapshot=useSharedValue<RenderSnapshot>(EMPTY_SNAPSHOT);
 const worldRef=useRef<World|null>(null); const rendererRef=useRef(renderer);
 const [hud,setHud]=useState(()=>pilotHud(createPilotWorld()));
 const [metrics,setMetrics]=useState({pixel:{fps:0,engineMs:0},current:{fps:0,engineMs:0}});
 useEffect(()=>{rendererRef.current=renderer;},[renderer]);
 const send=useCallback((command:GameCommand)=>{worldRef.current?.commands.push(command);},[]);
 useFocusEffect(useCallback(()=>()=>send({type:'setPaused',paused:true}),[send]));
 useEffect(()=>{
  if(!ready)return;
  const world=createPilotWorld();worldRef.current=world;const loop=createLoop();
  const listener=AppState.addEventListener('change',state=>{if(state!=='active')world.commands.push({type:'setPaused',paused:true});});
  let frame=0;let last:number|null=null;let sinceHud=0;let elapsed=0;let count=0;let engineMs=0;let measuredRenderer=rendererRef.current;
  const tick=(now:number)=>{
   const dt=last===null?0:Math.max(0,(now-last)/1000);last=now;
   const started=performance.now();
   if(autoplay&&!world.paused)pilotBot(world);
   loop.tick(world,dt);world.pendingCash=0;world.events.length=0;
   snapshot.set(createSnapshot(world));engineMs+=performance.now()-started;
   sinceHud+=dt;elapsed+=dt;count++;
   if(sinceHud>=.25){setHud(pilotHud(world));sinceHud=0;}
   if(measuredRenderer!==rendererRef.current){measuredRenderer=rendererRef.current;elapsed=0;count=0;engineMs=0;}
   if(elapsed>=1){const key=measuredRenderer;const report={fps:Math.round(count/elapsed),engineMs:Number((engineMs/count).toFixed(2))};setMetrics(s=>({...s,[key]:report}));elapsed=0;count=0;engineMs=0;}
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);listener.remove();worldRef.current=null;};
 },[runId,autoplay,ready,snapshot]);
 return {snapshot,hud,metrics,send};
}
