import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CK} from '../art/ck.mjs';
import {inspectFrame,inspectRegion} from './atlas.mjs';
export const UI_NAMES=['coin','lock','check','blood','back','next','pause','play','skull','star','starEmpty','gear','up','wrench','shield','bullet','book','trophy','hourglass','evo','radio','gem','crown','bag','tv'];
export const SPELL_NAMES=['grenade','medkit','molotov','airstrike','landmine','cryo','forcefield','blackhole','orbital'];
export const MATERIAL_NAMES=['steel','wood','brass','stone'];
export const EXTRA_NAMES=['vega','static','truck','walker'];
export const EXTRA_REGIONS=[[0,0,.56,.54],[.56,0,1,.54],[0,.54,.66,1],[.66,.54,1,1]];
export async function icons(image,pixels,width,height,output,{names=UI_NAMES,columns=5,rows=5,folder='ui',size=128,trim=true,regions=null}={}){
 await mkdir(join(output,folder),{recursive:true});
 for(let index=0;index<names.length;index++){
  const rect=regions?.[index];
  const bounds=!trim?[index%columns*width/columns,Math.floor(index/columns)*height/rows,width/columns,height/rows]:rect?inspectRegion(pixels,width,Math.round(rect[0]*width),Math.round(rect[1]*height),Math.round(rect[2]*width),Math.round(rect[3]*height)).bounds:inspectFrame(pixels,width,height,columns,rows,index%columns,Math.floor(index/columns)).bounds;
  const padding=trim?8:0;
  const [x,y,w,h]=bounds,scale=Math.min((size-padding)/w,(size-padding)/h),surface=CK.MakeSurface(size,size),canvas=surface.getCanvas(),paint=new CK.Paint();
  canvas.clear(CK.TRANSPARENT);paint.setAntiAlias(false);
  canvas.drawImageRectOptions(image,CK.XYWHRect(x,y,w,h),CK.XYWHRect((size-w*scale)/2,(size-h*scale)/2,w*scale,h*scale),CK.FilterMode.Nearest,CK.MipmapMode.None,paint);
  const result=surface.makeImageSnapshot();await writeFile(join(output,folder,names[index]+'.png'),result.encodeToBytes());
  result.delete();paint.delete();surface.delete();
 }
}
