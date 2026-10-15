import { FilterMode,MipmapMode,Skia,type SkCanvas,type SkImage,type SkPaint } from '@shopify/react-native-skia';
import type { RenderSnapshot } from '@/game/types';
import type { DragPreview } from '@/game/render/camera';
import { corpseFrame, troopFrame, viewRow, viewFlip, zombieFrame, baseFrame, VIEW_NAMES } from '@/game/render/animation';
import type { PixelSprites } from './assets';
import { type DetailedSheet } from './detailedLayout';
import {drawDetailedFrame,drawDetailedBase} from './drawDetailed';
import manifest from '@/assets/pixel16/manifest.json';
const snap=(n:number)=>{ 'worklet';return Math.round(n/2)*2;};
function rect(c:SkCanvas,p:SkPaint,x:number,y:number,w:number,h:number,color:string,alpha=1){'worklet';p.setColor(Skia.Color(color));p.setAlphaf(alpha);c.drawRect(Skia.XYWHRect(snap(x),snap(y),snap(w),snap(h)),p);p.setAlphaf(1);}
function frame(c:SkCanvas,p:SkPaint,image:SkImage,index:number,row:number,x:number,y:number,scale=1,flip=false,sheet?:DetailedSheet){
 'worklet';
 if(sheet){drawDetailedFrame(c,image,index,row,x,y,scale,p,flip,sheet);return;}
 const size=manifest.frame;const columns=image.width()/size;const column=Math.max(0,Math.min(columns-1,index));
 const width=snap(80*scale);const xx=x;const yy=y;const factor=width/size;
 if(flip){c.save();c.translate(xx,0);c.scale(-1,1);c.translate(-xx,0);}
 c.drawImageRectOptions(image,Skia.XYWHRect(column*size,row*size,size,size),Skia.XYWHRect(xx-manifest.foot[0]*factor,yy-manifest.foot[1]*factor,width,width),FilterMode.Nearest,MipmapMode.None,p);
 if(flip)c.restore();
}
function bar(c:SkCanvas,p:SkPaint,x:number,y:number,value:number,enemy=false){'worklet';c.save();c.translate(x,y);rect(c,p,-18,0,36,6,'#171b2c');rect(c,p,-16,2,Math.max(0,32*value),2,enemy?'#b74d59':'#b8e835');c.restore();}
export function drawPixelWorld(c:SkCanvas,s:RenderSnapshot,images:PixelSprites,drag:DragPreview) {
 'worklet';const p=Skia.Paint();p.setAntiAlias(false);
 if(images.background)c.drawImageRectOptions(images.background,Skia.XYWHRect(0,0,images.background.width(),images.background.height()),Skia.XYWHRect(0,0,600,images.detailed?.viewportHeight??900),FilterMode.Nearest,MipmapMode.None,p);
 else rect(c,p,0,0,600,900,'#527553');
 for(const a of s.areas){
  if(!('x'in a)||!('y'in a))continue;const radius='radius'in a?a.radius:24;
  // A stepped circle keeps the engine's radial danger zone recognizable.
  for(let dy=-radius;dy<=radius;dy+=4){const dx=Math.sqrt(Math.max(0,radius*radius-dy*dy));rect(c,p,a.x-dx,a.y+dy,dx*2,4,'#d4a454',.16);rect(c,p,a.x-dx,a.y+dy,4,4,'#d4a454');rect(c,p,a.x+dx-4,a.y+dy,4,4,'#d4a454');}
 }
 if(images.base){
  const layout=images.detailed?.base;
  if(layout){
   drawDetailedBase(c,images.base,baseFrame(s.base.hpRatio),p,layout);
  }else{const width=images.base.width()/4;c.drawImageRectOptions(images.base,Skia.XYWHRect(baseFrame(s.base.hpRatio)*width,0,width,images.base.height()),Skia.XYWHRect(0,manifest.base.y,manifest.base.width,manifest.base.height),FilterMode.Nearest,MipmapMode.None,p);}
 }
 rect(c,p,198,882,204,10,'#171b2c');rect(c,p,200,884,200*s.base.hpRatio,6,'#b8e835');
 for(const e of s.effects)if(e.kind==='corpse'){const image=images.units[e.unit];if(image){const corpse=corpseFrame(e.unit,e.ttl);p.setAlphaf(corpse.alpha);frame(c,p,image,corpse.frame,viewRow(e.dirX,e.dirY),e.x,e.y,1,viewFlip(viewRow(e.dirX,e.dirY),e.dirX),images.detailed?.units[e.unit]);p.setAlphaf(1);}}
 const units=[...s.troops.map((t,i)=>({y:t.y,t,i,z:null})),...s.zombies.map(z=>({y:z.y,t:null,i:0,z}))].sort((a,b)=>a.y-b.y);
 for(const unit of units){
  if(unit.t){const t=unit.t;const image=images.units[t.kind];const row=viewRow(t.dirX,t.dirY);if(image){p.setAlphaf(t.deploying?.6:1);frame(c,p,image,troopFrame(t,s.time,unit.i),row,t.x,t.y,1,viewFlip(row,t.dirX),images.detailed?.units[t.kind]);p.setAlphaf(1);}bar(c,p,t.x,t.y-66,t.hpRatio);}
  else if(unit.z){const z=unit.z;const image=images.units[z.kind];const row=viewRow(z.dirX,z.dirY);if(image)frame(c,p,image,zombieFrame(z),row,z.x,z.y,z.scale,viewFlip(row,z.dirX),images.detailed?.units[z.kind]);bar(c,p,z.x,z.y-66*z.scale,z.hpRatio,true);}
 }
 for(const e of s.effects){
  if(e.kind==='tracer'){
   const shooter=s.troops.find(t=>t.x===e.fromX&&t.y===e.fromY);let x=e.fromX,y=e.fromY;
   if(shooter){const view=VIEW_NAMES[viewRow(shooter.dirX,shooter.dirY)];const sheet=images.detailed?.units[shooter.kind];const row=viewRow(shooter.dirX,shooter.dirY);const flip=viewFlip(row,shooter.dirX)?-1:1;
    if(sheet){const pose=sheet.frames[row*sheet.columns+5];const muzzle=sheet.muzzle[row];x+=(muzzle[0]*pose.source[2]-pose.foot[0])*sheet.scale*flip;y+=(muzzle[1]*pose.source[3]-pose.foot[1])*sheet.scale;}
    else{const muzzle=manifest.muzzle[shooter.kind as keyof typeof manifest.muzzle]?.[view];if(muzzle){x+=(muzzle[0]-20)*2*flip;y+=(muzzle[1]-38)*2;}}}
   const dx=e.toX-x,dy=e.toY-24-y;const steps=Math.min(120,Math.ceil(Math.hypot(dx,dy)/6));
   for(let i=0;i<steps;i++)rect(c,p,x+dx*i/steps,y+dy*i/steps,2,4,'#ffe1aa');
  }
  if(e.kind==='explosion'){const radius=e.radius*(1-e.ttl/e.duration);rect(c,p,e.x-radius/2,e.y-radius/2,radius,radius,'#d4a454');rect(c,p,e.x-4,e.y-4,8,8,'#ffe1aa');}
  if(e.kind==='heal'){rect(c,p,e.x-8,e.y-2,16,4,'#b8e835');rect(c,p,e.x-2,e.y-8,4,16,'#b8e835');}
 }
 if(drag.active&&drag.card){const image=images.units[drag.card as keyof PixelSprites['units']];rect(c,p,40,470,520,290,drag.valid?'#b8e835':'#b74d59',.12);p.setAlphaf(.65);if(image)frame(c,p,image,0,1,drag.x,drag.y,1,false,images.detailed?.units[drag.card]);p.setAlphaf(1);}
}
