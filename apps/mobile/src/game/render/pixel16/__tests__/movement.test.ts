import { createPilotWorld } from '@/hooks/pixel16/pilot';
import { createLoop } from '@/game/engine/loop';
import { createSnapshot } from '@/game/engine/snapshot';
import { zombieFrame } from '@/game/render/animation';
import { detailedFrame } from '../detailedLayout';
import { drawPixelWorld } from '../draw';
import type { PixelSprites } from '../assets';
import type { SkCanvas } from '@shopify/react-native-skia';
import detailed from '@/assets/pixel16-detailed/manifest.json';

jest.mock('@shopify/react-native-skia',()=>({
 FilterMode:{Nearest:0},MipmapMode:{None:0},
 Skia:{Color:(color:string)=>color,XYWHRect:(x:number,y:number,width:number,height:number)=>({x,y,width,height}),Paint:()=>({setAntiAlias:()=>{},setColor:()=>{},setAlphaf:()=>{}})},
}));
function sample(){
 const world=createPilotWorld(),loop=createLoop();
 for(let i=0;i<600;i++)loop.tick(world,1/60);
 const state=createSnapshot(world);
 expect(state.zombies.length).toBeGreaterThan(0);
 return {...state,troops:[],effects:[],areas:[],zombies:[{...state.zombies[0],kind:'walker' as const,uid:0,attacking:false,scale:1,travelled:0,dirX:0,dirY:1}]};
}

test('detailed walker completes one gait over a full stride and freezes when distance stops',()=>{
 const z=sample().zombies[0],sheet=detailed.layouts.walker;
 const cycle=Array.from({length:8},(_,step)=>{
  const frame=detailedFrame(sheet,zombieFrame({...z,travelled:(step+.1)*4.6*.75}),0);
  return sheet.frames.indexOf(frame);
 });
 expect(cycle).toEqual([1,1,2,2,3,3,2,2]);
 expect(detailedFrame(sheet,zombieFrame({...z,travelled:27.6}),0)).toBe(sheet.frames[1]);
 expect(detailedFrame(sheet,zombieFrame({...z,stunned:true}),0)).toBe(sheet.frames[1]);
});

test('detailed troops use a single full gait instead of repeating it twice per stride',()=>{
 const sheet=detailed.layouts.chainsaw;
 expect(Array.from({length:8},(_,step)=>sheet.frames.indexOf(detailedFrame(sheet,17+step,0)))).toEqual([1,1,2,2,3,3,2,2]);
});

test('sub-grid movement reaches the canvas continuously without modifying simulation positions',()=>{
 const state=sample(),sheet=detailed.layouts.walker;
 const image={width:()=>2048,height:()=>768};
 const sprites={units:{walker:image},detailed:{units:{walker:sheet}}} as unknown as PixelSprites;
 const draw=jest.fn();
 const canvas={drawImageRectOptions:draw,drawRect:()=>{},save:()=>{},restore:()=>{},translate:()=>{},scale:()=>{}} as unknown as SkCanvas;
 const positions=[];
 for(let i=0;i<10;i++){
  const zombie={...state.zombies[0],x:300.1+i*.2,y:400.1+i*.3};
  Object.freeze(zombie);
  drawPixelWorld(canvas,{...state,zombies:[zombie]},sprites,{active:false,card:null,valid:false,x:0,y:0});
  positions.push(draw.mock.calls.at(-1)![2]);
 }
 for(let i=1;i<positions.length;i++){
  expect(positions[i].x-positions[i-1].x).toBeCloseTo(.2);
  expect(positions[i].y-positions[i-1].y).toBeCloseTo(.3);
 }
});
