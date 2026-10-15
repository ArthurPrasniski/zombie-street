import {brand} from './brand.mjs';
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir,copyFile,readdir } from 'node:fs/promises';
import { dirname,join,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gallery } from './gallery.mjs';
import { CK } from '../art/ck.mjs';
import { unitLayout,baseLayout } from './atlas.mjs';
import {UNIT_KINDS,UNIT_HEIGHTS} from './sources.mjs';
import {portrait} from './portraits.mjs';
import {icons,SPELL_NAMES,MATERIAL_NAMES,EXTRA_NAMES,EXTRA_REGIONS} from './ui.mjs';
import {modules} from './modules.mjs';
import {packUnit} from './pack.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../../..');
const source=join(root,'apps/mobile/assets/pixel16-detailed');
const at=process.argv.indexOf('--out');
assert(at<0||process.argv[at+1],'--out requires a directory');
const output=at<0?source:resolve(process.argv[at+1]);
for(const protectedPath of ['apps/mobile/assets/images','apps/mobile/assets/pixel16']){
 const path=join(root,protectedPath);assert(output!==path&&!output.startsWith(path+'/'),'Use a separate detailed-art output');
}
await mkdir(output,{recursive:true});
const extra=(await readdir(join(source,'units'))).filter(f=>f.endsWith('.png')).sort().map(f=>'units/'+f);
const worlds=(await readdir(join(source,'worlds'))).filter(f=>f.endsWith('.png')).sort().map(f=>'worlds/'+f);
const optional=(await readdir(source)).filter(f=>['ui-materials.png','ui-misc.png','app-icon.png','armored-base.png','space-base.png'].includes(f));
const files=['farm.png','farm-base.png','sniper.png','walker.png','ui-icons.png','spell-items.png','home.png',...optional,...worlds,...extra];const assets=[];const runtimeAssets=[];const layouts={};const bases={};const images={};
for(const file of files){
 const buffer=await readFile(join(source,file));images[file]='data:image/png;base64,'+buffer.toString('base64');const image=CK.MakeImageFromEncoded(buffer);assert(image,`Invalid PNG: ${file}`);
 const width=image.width(),height=image.height();
 const pixels=image.readPixels(0,0,{width,height,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});assert(pixels);
 if(file==='farm.png')assert(Math.abs(width/height-600/1050)<.03,'Farm must fit the arena plus lower decorative area');
 if(file==='farm-base.png')layouts.base=baseLayout(pixels,width,height);
 if(file==='armored-base.png'||file==='space-base.png')bases[file.replace('-base.png','')]=baseLayout(pixels,width,height);
 if(file==='ui-icons.png')await icons(image,pixels,width,height,output);
 if(file==='spell-items.png')await icons(image,pixels,width,height,output,{names:SPELL_NAMES,columns:3,rows:3,folder:'portraits',size:192});
 if(file==='ui-materials.png')await icons(image,pixels,width,height,output,{names:MATERIAL_NAMES,columns:2,rows:2,folder:'materials',size:128,trim:false});
 if(file==='ui-misc.png')await icons(image,pixels,width,height,output,{names:EXTRA_NAMES,columns:2,rows:2,folder:'extras',size:320,regions:EXTRA_REGIONS});
 const id=file.replace('units/','').replace('.png','');
 if(UNIT_KINDS[id]){
  let layout;try{layout=unitLayout(pixels,width,height,UNIT_KINDS[id],UNIT_HEIGHTS[id]??64);}catch(error){throw new Error(`Invalid unit atlas: ${file}`,{cause:error});}
  await portrait(image,layout,output,id);
  if(id==='sniper'||id==='sheriff')await portrait(image,layout,output,id,{folder:'radio',head:true});
  const packed=await packUnit(image,layout,output,id,file);layouts[id]=packed.layout;runtimeAssets.push(packed.asset);images[packed.asset.path]=packed.data;delete images[file];
 }
 assets.push({path:file,width,height,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')});
 if(output!==source){await mkdir(dirname(join(output,file)),{recursive:true});await copyFile(join(source,file),join(output,file));}
 image.delete();
}
await brand(source,output);
const manifest={schema:2,style:'detailed-rpg-pixel',worldSize:[600,900],viewportHeight:1150,layouts,bases:{farm:layouts.base,...bases},assets,runtimeAssets};
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await modules(manifest,output);
const artifacts=at<0?join(root,'artifacts/pixel16-detailed'):join(output,'preview');await mkdir(artifacts,{recursive:true});await writeFile(join(artifacts,'catalog.html'),gallery(manifest,images));
console.log(JSON.stringify({output,assets:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0)}));
