import detailed from '@/assets/pixel16-detailed/manifest.json';
import {DETAIL_SHEETS,DETAIL_LAYOUTS} from './production';
import {DETAILED_CARD_ART} from '@/ui/pixel16/productionPortraits';
import type { DetailedLayouts } from './detailedLayout';
import { Asset } from 'expo-asset';
import { Skia, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import type { CardId, TroopId, ZombieId } from '@/game/types';
export const PIXEL_VIEWPORT_HEIGHT=(detailed as {viewportHeight?:number}).viewportHeight??900;
export const PILOT_UNITS = ['sniper','sheriff','chainsaw','dog','barricade','walker','runner','brute'] as const;
export type PilotUnit = typeof PILOT_UNITS[number];
const units = DETAIL_SHEETS as Record<PilotUnit,number>;
export const PIXEL_CARD_ART: Partial<Record<CardId,number>> = {
 ...DETAILED_CARD_ART,
};
export interface PixelSprites { detailed?:DetailedLayouts; background: SkImage | null; base: SkImage | null; units: Partial<Record<TroopId|ZombieId,SkImage>> }
const EMPTY: PixelSprites = { background:null,base:null,units:{} };
async function load(module: number) {
 const asset=Asset.fromModule(module); await asset.downloadAsync();
 const image=Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(asset.localUri ?? asset.uri));
 if(!image) throw new Error('invalid pixel asset'); return image;
}
export function usePixelAssets() {
 const [state,setState]=useState({ sprites:EMPTY,ready:false,error:false,milliseconds:0 });
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let alive=true;const start=performance.now();
  Promise.all([load(require('@/assets/pixel16-detailed/farm.png')),load(require('@/assets/pixel16-detailed/farm-base.png')),...PILOT_UNITS.map(id=>load(units[id]))]).then(([background,base,...sheets])=>{
   if(alive)setState({sprites:{detailed:{viewportHeight:PIXEL_VIEWPORT_HEIGHT,base:detailed.layouts.base,units:DETAIL_LAYOUTS},background,base,units:Object.fromEntries(PILOT_UNITS.map((id,i)=>[id,sheets[i]]))},ready:true,error:false,milliseconds:Math.round(performance.now()-start)});
  }).catch(()=>{if(alive)setState({sprites:EMPTY,ready:false,error:true,milliseconds:0});});
  return()=>{alive=false;};
 },[attempt]);
 return {...state,retry:()=>setAttempt(n=>n+1)};
}
