import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {CK} from '../art/ck.mjs';
/** Native launcher sizes and monochrome masks; source art stays immutable. */
export async function brand(source,output){
 const directory=join(output,'brand');await mkdir(directory,{recursive:true});
 const icon=CK.MakeImageFromEncoded(await readFile(join(source,'app-icon.png')));
 const walker=CK.MakeImageFromEncoded(await readFile(join(output,'extras/walker.png')));
 for(const [name,size,art,padding,background,mask] of [
  ['icon',1024,icon,0,'#171b22',false],['favicon',64,icon,0,'#171b22',false],
  ['android-foreground',432,walker,96,null,false],['splash',384,walker,12,null,false],
  ['android-monochrome',432,walker,96,null,true],['notification',96,walker,8,null,true],
 ]){
  const surface=CK.MakeSurface(size,size),canvas=surface.getCanvas(),paint=new CK.Paint();
  canvas.clear(background?CK.parseColorString(background):CK.TRANSPARENT);paint.setAntiAlias(false);
  if(mask)paint.setColorFilter(CK.ColorFilter.MakeBlend(CK.WHITE,CK.BlendMode.SrcIn));
  canvas.drawImageRectOptions(art,CK.XYWHRect(0,0,art.width(),art.height()),CK.XYWHRect(padding,padding,size-padding*2,size-padding*2),CK.FilterMode.Nearest,CK.MipmapMode.None,paint);
  const result=surface.makeImageSnapshot();await writeFile(join(directory,name+'.png'),result.encodeToBytes());result.delete();paint.delete();surface.delete();
 }
 icon.delete();walker.delete();
}
