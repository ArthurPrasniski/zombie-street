import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CK} from '../art/ck.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../../..'),folder=join(root,'apps/mobile/assets/pixel16-detailed');
const manifest=JSON.parse(await readFile(join(folder,'manifest.json'))),ids=Object.keys(manifest.layouts).filter(id=>id!=='base');
const face=CK.Typeface.MakeFreeTypeFaceFromData(await readFile(join(root,'apps/mobile/assets/fonts/Rubik-Bold.ttf'))),font=new CK.Font(face,14),paint=new CK.Paint();
const output=join(root,'artifacts/pixel16-detailed');await mkdir(output,{recursive:true});paint.setAntiAlias(false);
for(let start=0;start<ids.length;start+=8){
 const batch=ids.slice(start,start+8),surface=CK.MakeSurface(1008,batch.length*156),canvas=surface.getCanvas();canvas.clear(CK.Color4f(.09,.11,.14,1));
 for(let row=0;row<batch.length;row++){
  const id=batch[row],sheet=manifest.layouts[id],image=CK.MakeImageFromEncoded(await readFile(join(folder,sheet.asset)));
  paint.setColor(CK.Color4f(.96,.93,.86,1));canvas.drawText(id,6,row*156+16,paint,font);
  for(const [column,index] of [0,1,3,5,9,21,7].entries()){
   const frame=sheet.frames[index],[sx,sy,sw,sh]=frame.source,factor=sheet.scale*1.65,x=column*144+72,y=row*156+144;
   canvas.drawImageRectOptions(image,CK.XYWHRect(sx,sy,sw,sh),CK.XYWHRect(x-frame.foot[0]*factor,y-frame.foot[1]*factor,sw*factor,sh*factor),CK.FilterMode.Nearest,CK.MipmapMode.None,paint);
  }
  image.delete();
 }
 const image=surface.makeImageSnapshot();await writeFile(join(output,`units-${start/8+1}.png`),image.encodeToBytes());image.delete();surface.delete();
}
paint.delete();font.delete();face.delete();console.log(`Review sheets: ${ids.length} units in ${Math.ceil(ids.length/8)} contact sheets.`);

// Full map coverage, including the decorative area below the 900-unit combat field.
const worlds=manifest.assets.filter(asset=>asset.path==='farm.png'||asset.path.startsWith('worlds/'));
const surface=CK.MakeSurface(800,Math.ceil(worlds.length/4)*410),canvas=surface.getCanvas(),labelPaint=new CK.Paint();
const labelFont=new CK.Font(null,14);canvas.clear(CK.Color4f(.09,.11,.14,1));
for(const [index,asset] of worlds.entries()){
 const image=CK.MakeImageFromEncoded(await readFile(join(folder,asset.path))),x=index%4*200,y=Math.floor(index/4)*410;
 canvas.drawImageRectOptions(image,CK.XYWHRect(0,0,image.width(),image.height()),CK.XYWHRect(x,y+24,200,383),CK.FilterMode.Nearest,CK.MipmapMode.None,labelPaint);
 labelPaint.setColor(CK.WHITE);canvas.drawText(asset.path.replace('worlds/','').replace('.png',''),x+4,y+18,labelPaint,labelFont);image.delete();
}
const result=surface.makeImageSnapshot();await writeFile(join(output,'worlds.png'),result.encodeToBytes());result.delete();surface.delete();labelPaint.delete();labelFont.delete();
