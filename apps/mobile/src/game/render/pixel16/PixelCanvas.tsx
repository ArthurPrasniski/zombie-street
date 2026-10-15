import { Canvas,createPicture,Picture,Skia } from '@shopify/react-native-skia';
import { useDerivedValue,type SharedValue } from 'react-native-reanimated';
import type { RenderSnapshot } from '@/game/types';
import type { DragPreview } from '@/game/render/camera';
import type { PixelSprites } from './assets';
import { useSettingsStore } from '@/state/settingsStore';
import { drawPixelWorld } from './draw';
export function PixelCanvas({snapshot,drag,width,sprites}:{snapshot:SharedValue<RenderSnapshot>;drag:SharedValue<DragPreview>;width:number;sprites:PixelSprites}){
 const effects=useSettingsStore(s=>s.visualEffects);
 const height=width*(sprites.detailed?.viewportHeight??900)/600;const scale=width/600;
 const picture=useDerivedValue(()=>{
  const state=snapshot.get(),preview=drag.get();
  return createPicture(canvas=>{canvas.scale(scale,scale);drawPixelWorld(canvas,effects?state:{...state,effects:state.effects.filter(e=>e.kind==='corpse')},sprites,preview);},Skia.XYWHRect(0,0,width,height));
 },[width,height,scale,sprites,effects]);
 return <Canvas style={{width,height}}><Picture picture={picture}/></Canvas>;
}
