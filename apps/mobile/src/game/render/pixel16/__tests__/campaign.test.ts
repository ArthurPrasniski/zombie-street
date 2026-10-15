import { type SkCanvas, type SkImage } from '@shopify/react-native-skia';
import { TROOPS, CARD_IDS } from '@/game/data/cards';
import { ZOMBIES } from '@/game/data/zombies';
import { createTroop, createZombie } from '@/game/engine/world';
import { createSnapshot } from '@/game/engine/snapshot';
import { createPilotWorld } from '@/hooks/pixel16/pilot';
import { drawWorld } from '@/game/render/drawWorld';
import type { SpriteSet, UnitId } from '@/game/render/sprites';
import type { Area, Effect } from '@/game/types';
import manifest from '@/assets/pixel16-detailed/manifest.json';
import { DETAIL_LAYOUTS, FARM_BASE_LAYOUT } from '../production';
import { attachedEffects } from '../effects';

jest.mock('expo-asset',()=>({Asset:{}}));
jest.mock('@shopify/react-native-skia',()=>{
 const object=()=>new Proxy({}, {get:()=>jest.fn()});
 return {FilterMode:{Nearest:0,Linear:1},MipmapMode:{None:0},PaintStyle:{Fill:0,Stroke:1},StrokeCap:{Square:0},BlendMode:{SrcIn:0,SrcATop:1,DstOut:2},BlurStyle:{Normal:0},Skia:{Paint:object,Color:(x:unknown)=>x,XYWHRect:(x:number,y:number,width:number,height:number)=>({x,y,width,height}),RRectXY:(x:unknown)=>x,Path:{Make:object},PathBuilder:{Make:object},ColorFilter:{MakeBlend:object},MaskFilter:{MakeBlur:object}}};
});
function fixture(){
 const world=createPilotWorld();
 world.troops=Object.values(TROOPS).map((def,i)=>createTroop(world,def,20,60+i%6*85,450+Math.floor(i/6)*90));
 world.zombies=Object.values(ZOMBIES).map((def,i)=>({...createZombie(world,def.id),x:40+i%8*70,y:80+Math.floor(i/8)*80,burrowed:false}));
 const snap=createSnapshot(world);snap.time=2;
 const firefighter=snap.troops.find(t=>t.kind==='firefighter')!,tesla=snap.troops.find(t=>t.kind==='tesla')!;
 snap.effects=[
  ...Object.keys(ZOMBIES).map(unit=>({kind:'corpse' as const,unit:unit as UnitId,x:250,y:320,dirX:-1,dirY:0,ttl:.4})),
  {kind:'flame',fromX:firefighter.x,fromY:firefighter.y,toX:200,toY:200,ttl:.1},
  {kind:'zap',points:[tesla.x,tesla.y-58,200,200,300,300],ttl:.1},
  ...(['tracer','spit'] as const).map(kind=>({kind,fromX:60,fromY:450,toX:200,toY:200,ttl:.1})),
  ...(['heal','smoke','dirt'] as const).map(kind=>({kind,x:200,y:200,ttl:.1})),
  {kind:'frost',x:200,y:200,radius:100,ttl:.1},
  {kind:'explosion',x:200,y:200,radius:100,ttl:.1,duration:1},
 ] satisfies Effect[];
 snap.areas=[
  {kind:'fire',uid:1,x:100,y:100,radius:70,dps:1,ttl:1,duration:2},
  {kind:'mine',uid:2,x:100,y:200,radius:70,trigger:20,damage:1,exploded:false},
  {kind:'airstrike',uid:3,x:200,y:200,radius:70,damage:1,delay:.2,total:1},
  {kind:'forcefield',uid:4,x:300,y:300,width:100,hp:50,maxHp:100,ttl:1,duration:2},
  {kind:'blackhole',uid:5,x:300,y:300,radius:70,pull:1,damage:1,ttl:1,duration:2},
  {kind:'orbital',uid:6,x:300,y:300,width:100,damage:1,delay:.1,total:1},
 ] satisfies Area[];
 const makeImage=(a:{width:number;height:number})=>({width:()=>a.width,height:()=>a.height}) as SkImage;
 const sprites:SpriteSet={background:makeImage(manifest.assets.find(a=>a.path==='farm.png')!),base:makeImage(manifest.assets.find(a=>a.path==='farm-base.png')!),units:Object.fromEntries(manifest.runtimeAssets.map(a=>[a.path.replace('runtime/','').replace('.png',''),makeImage(a)])),detailedUnits:DETAIL_LAYOUTS,detailedBase:FARM_BASE_LAYOUT,viewportHeight:1150,pixelBackground:true};
 return {snap,sprites};
}
function freeze(value:unknown){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}}
test('complete campaign renderer preserves snapshots across every card preview, status and weather',()=>{
 const {snap,sprites}=fixture(),saved=JSON.stringify(snap);let calls=0;
 const canvas=new Proxy({}, {get:(_target,name)=>name==='drawImageRectOptions'?(image:SkImage,source:Record<string,number>,dest:Record<string,number>)=>{
  calls++;expect(Object.values(dest).every(Number.isFinite)).toBe(true);
  expect(source.x).toBeGreaterThanOrEqual(0);expect(source.y).toBeGreaterThanOrEqual(0);
  expect(source.x+source.width).toBeLessThanOrEqual(image.width()+.001);
  expect(source.y+source.height).toBeLessThanOrEqual(image.height()+.001);
 }:jest.fn()}) as SkCanvas;
 const cases = (['fog','blizzard','blackout','dust'] as const).flatMap(kind=>[1,.5,.25,0].map((hpRatio,i)=>({kind,hpRatio,card:CARD_IDS[i]})));
 for(const card of CARD_IDS)cases.push({kind:'fog',hpRatio:1,card});
 for(const {kind,hpRatio,card} of cases){
  const current={...snap,weather:{kind,ttl:1,duration:2},base:{...snap.base,hpRatio},troops:snap.troops.map(t=>({...t,flash:hpRatio===.5,chilled:hpRatio===.25,moving:hpRatio===1,sinceAttack:.03})),zombies:snap.zombies.map(z=>({...z,stunned:hpRatio===.25,slowed:hpRatio===.5,attacking:hpRatio===0,attackProgress:.5}))};
  freeze(current);drawWorld(canvas,current,sprites,{active:true,card,valid:hpRatio>0,x:300.1,y:600.2},null,{color:'#dfb85e',hull:10,gun:10,tank:10});
 }
 expect(calls).toBeGreaterThan(1000);expect(JSON.stringify(snap)).toBe(saved);
});
test('detailed flame and Tesla effects attach to their new sprites without mutating engine events',()=>{
 const {snap,sprites}=fixture(),saved=JSON.stringify(snap);freeze(snap);
 const effects=attachedEffects(snap,sprites),flame=effects.find(e=>e.kind==='flame')!,zap=effects.find(e=>e.kind==='zap')!;
 expect(flame).not.toEqual(snap.effects.find(e=>e.kind==='flame'));
 expect(zap).not.toBe(snap.effects.find(e=>e.kind==='zap'));
 if(zap.kind==='zap')expect(zap.points[1]).toBe(snap.troops.find(t=>t.kind==='tesla')!.y-58);
 expect(JSON.stringify(snap)).toBe(saved);
});
