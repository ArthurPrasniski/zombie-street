import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CK} from '../art/ck.mjs';
/** Non-destructive atlas sampling. Source PNG and alpha are preserved. */
export async function portrait(image,layout,output,id,{folder='portraits',head=false}={}){
 const target=CK.MakeSurface(192,192),canvas=target.getCanvas(),paint=new CK.Paint();
 canvas.clear(CK.TRANSPARENT);paint.setAntiAlias(false);
 const [x,y,w,fullHeight]=layout.frames[0].bounds,h=head?fullHeight*.58:fullHeight,factor=Math.min(176/w,176/h);
 canvas.drawImageRectOptions(image,CK.XYWHRect(x,y,w,h),CK.XYWHRect((192-w*factor)/2,(192-h*factor)/2,w*factor,h*factor),CK.FilterMode.Nearest,CK.MipmapMode.None,paint);
 const result=target.makeImageSnapshot();
 await mkdir(join(output,folder),{recursive:true});
 await writeFile(join(output,folder,id+'.png'),result.encodeToBytes());
 result.delete();paint.delete();target.delete();
}
