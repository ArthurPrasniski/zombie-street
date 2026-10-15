import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {CK} from '../art/ck.mjs';
/** Sample the approved high-resolution source once; 128px cells suit actual phone rendering. */
export async function packUnit(image,layout,output,id,sourceAsset){
 const ratio=.5,width=image.width()*ratio,height=image.height()*ratio;
 const surface=CK.MakeSurface(width,height),canvas=surface.getCanvas(),paint=new CK.Paint();
 canvas.clear(CK.TRANSPARENT);paint.setAntiAlias(false);
 // Crop empty vertical margins per cell, retaining nearby particles and weapon flashes.
 // This removes detached slivers from an adjacent row without editing the source PNG.
 for(const frame of layout.frames){
  const [x,y,w,h]=frame.source,[,bodyY,,bodyH]=frame.bounds;
  const top=Math.max(y,bodyY-12),bottom=Math.min(y+h,bodyY+bodyH+12);
  canvas.drawImageRectOptions(image,CK.XYWHRect(x,top,w,bottom-top),CK.XYWHRect(x*ratio,top*ratio,w*ratio,(bottom-top)*ratio),CK.FilterMode.Nearest,CK.MipmapMode.None,paint);
 }
 const result=surface.makeImageSnapshot(),bytes=result.encodeToBytes(),path='runtime/'+id+'.png';
 await mkdir(join(output,'runtime'),{recursive:true});await writeFile(join(output,path),bytes);
 result.delete();paint.delete();surface.delete();
 const scale=values=>values.map(n=>n*ratio);
 return {
  layout:{...layout,asset:path,sourceAsset,scale:layout.scale/ratio,frames:layout.frames.map(f=>({...f,source:scale(f.source),bounds:scale(f.bounds),foot:scale(f.foot)}))},
  asset:{path,width,height,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},
  data:'data:image/png;base64,'+Buffer.from(bytes).toString('base64'),
 };
}
