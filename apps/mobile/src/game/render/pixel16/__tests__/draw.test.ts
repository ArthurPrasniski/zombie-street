import { createPilotWorld } from '@/hooks/pixel16/pilot';
import { createLoop } from '@/game/engine/loop';
import { pilotBot } from '@/hooks/pixel16/demoBot';
import { simpleBot } from '@/game/engine/bot';
import { createSnapshot } from '@/game/engine/snapshot';
import { drawPixelWorld } from '../draw';
import type { PixelSprites } from '../assets';
import type { SkCanvas } from '@shopify/react-native-skia';
import detailedManifest from '@/assets/pixel16-detailed/manifest.json';
import manifest from '@/assets/pixel16/manifest.json';
jest.mock('@shopify/react-native-skia',()=>({
 FilterMode:{Nearest:0},MipmapMode:{None:0},
 Skia:{Color:(color:string)=>color,XYWHRect:(x:number,y:number,width:number,height:number)=>({x,y,width,height}),Paint:()=>({alpha:1,setAntiAlias:()=>{},setColor(){this.alpha=1;},setAlphaf(alpha:number){this.alpha=alpha;}})},
}));
function freeze(value:unknown){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}}
test('recorta quadros válidos com nearest e desenha a prévia translúcida sem mudar o snapshot',()=>{
 const world=createPilotWorld(),loop=createLoop();
 for(let i=0;i<3000;i++){simpleBot(world);loop.tick(world,1/60);}
 const snapshot=createSnapshot(world);freeze(snapshot);
 const saved=JSON.stringify(snapshot);
 const images=Object.fromEntries(manifest.assets.map(asset=>[asset.path,{width:()=>asset.width,height:()=>asset.height}]));
 const sprites={background:images['worlds/farm.png'],base:images['worlds/farm-base.png'],units:Object.fromEntries(Object.keys(images).filter(p=>p.startsWith('sprites/')).map(p=>[p.split('/')[1].replace('.png',''),images[p]]))} as unknown as PixelSprites;
 const imageDraw=jest.fn();const rectDraw=jest.fn((_r,paint)=>paint.alpha);
 const canvas={drawRect:rectDraw,drawImageRectOptions:imageDraw,save:()=>{},restore:()=>{},translate:()=>{},scale:()=>{}} as unknown as SkCanvas;
 drawPixelWorld(canvas,snapshot,sprites,{active:true,card:'sniper',valid:true,x:300.37,y:650.91});
 expect(JSON.stringify(snapshot)).toBe(saved);expect(imageDraw.mock.calls.length).toBeGreaterThan(4);
 for(const [image,source,,filter,mipmap] of imageDraw.mock.calls){
  expect(source.x).toBeGreaterThanOrEqual(0);expect(source.y).toBeGreaterThanOrEqual(0);
  expect(source.x+source.width).toBeLessThanOrEqual(image.width());
  expect(source.y+source.height).toBeLessThanOrEqual(image.height());
  expect([filter,mipmap]).toEqual([0,0]);
 }
 expect(rectDraw.mock.results.some(result=>result.value===.12)).toBe(true);
 expect(snapshot.troops.some(t=>t.x%2!==0||t.y%2!==0)).toBe(true);
});

test('render detalhado cobre a simulação, vistas espelhadas e os quatro danos da base',()=>{
 const world=createPilotWorld(),loop=createLoop();
 const original=manifest;
 const detailed=detailedManifest;
 const image=(width:number,height:number)=>({width:()=>width,height:()=>height});
 const units=Object.fromEntries(original.assets.filter(a=>a.path.startsWith('sprites/')).map(a=>[a.path.split('/')[1].replace('.png',''),image(a.width,a.height)]));
 for(const [id,layout] of Object.entries(detailed.layouts)){if(id==='base'||!('asset' in layout))continue;const a=detailed.runtimeAssets.find(a=>a.path===layout.asset)!;units[id]=image(a.width,a.height);}
 const bg=detailed.assets.find(a=>a.path==='farm.png')!,base=detailed.assets.find(a=>a.path==='farm-base.png')!;
 const sprites={background:image(bg.width,bg.height),base:image(base.width,base.height),units,detailed:{viewportHeight:(detailed as {viewportHeight?:number}).viewportHeight??900,base:detailed.layouts.base,units:Object.fromEntries(Object.entries(detailed.layouts).filter(([id])=>id!=='base'))}} as unknown as PixelSprites;
 const seen=new Set<string>();let calls=0;
 const canvas={save:()=>{},restore:()=>{},translate:()=>{},scale:()=>{},drawRect:()=>{},drawImageRectOptions:(im:{width:()=>number;height:()=>number},source:{x:number;y:number;width:number;height:number},dest:Record<string,number>)=>{
  calls++;expect(Object.values(dest).every(Number.isFinite)).toBe(true);
  expect(source.x).toBeGreaterThanOrEqual(0);expect(source.y).toBeGreaterThanOrEqual(0);
  expect(source.x+source.width).toBeLessThanOrEqual(im.width()+.001);
  expect(source.y+source.height).toBeLessThanOrEqual(im.height()+.001);
 }} as unknown as SkCanvas;
 for(let i=0;i<18000;i++){
  pilotBot(world);loop.tick(world,1/60);
  if(i%120!==0)continue;
  const snapshot=createSnapshot(world);snapshot.troops.forEach(t=>seen.add(t.kind));snapshot.zombies.forEach(z=>seen.add(z.kind));
  for(const hpRatio of [1,.5,.25,0])drawPixelWorld(canvas,{...snapshot,base:{...snapshot.base,hpRatio}},sprites,{active:false,card:null,valid:false,x:0,y:0});
 }
 expect(seen.has('sniper')).toBe(true);expect(seen.has('walker')).toBe(true);expect(calls).toBeGreaterThan(500);
});
