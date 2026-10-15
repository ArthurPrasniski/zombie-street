import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { encodePng } from '../art-pixel/png.mjs';
import { create,palette,retroPalette } from './raster.mjs';
import { TROOPS,ZOMBIES,unitFrame,muzzleFor } from './units.mjs';
import { farm,base,spell } from './scenes.mjs';
import { gallery } from './gallery.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../../..');
const outIndex=process.argv.indexOf('--out');
if(outIndex>=0&&!process.argv[outIndex+1])throw new Error('--out exige um diretório');
const output=outIndex>=0?resolve(process.argv[outIndex+1]):join(root,'apps/mobile/assets/pixel16');
const current=join(root,'apps/mobile/assets/images');
for(const path of [current,join(root,'apps/mobile/assets/pixel16-detailed')])if(output===path||output.startsWith(path+'/'))throw new Error('Use um destino separado da arte atual e das fontes detalhadas');
const original=JSON.parse(await readFile(join(root,'apps/mobile/src/game/render/spriteLayout.json'),'utf8'));
const views=['front','back','side'];const assets=[];const previews={};
async function save(path,canvas){
 const buffer=encodePng(canvas.w,canvas.h,canvas.rgba);await mkdir(dirname(join(output,path)),{recursive:true});await writeFile(join(output,path),buffer);
 assets.push({path,width:canvas.w,height:canvas.h,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')});
 previews[path]=`data:image/png;base64,${buffer.toString('base64')}`;
}
const groups=(definition)=>Object.entries(definition).flatMap(([kind,g])=>Array.from({length:g.count},(_,k)=>({kind,k})));
for(const id of [...TROOPS,...ZOMBIES]){
 const definition=groups(ZOMBIES.includes(id)?original.zombies:original.troops);
 const sheet=create(definition.length*40,120);
 views.forEach((view,row)=>definition.forEach(({kind,k},column)=>sheet.blit(unitFrame(id,view,kind,k),column*40,row*40)));
 await save(`sprites/${id}.png`,sheet);
 if(TROOPS.includes(id)){const portrait=create(80,80);portrait.blit(unitFrame(id,'front','idle',0),0,0,2);await save(`cards/${id}.png`,portrait);}
}
for(const id of ['grenade','medkit','molotov']){const portrait=create(80,80);portrait.blit(spell(id),0,0,2);await save(`cards/${id}.png`,portrait);}
await save('worlds/farm.png',farm());const bases=create(1200,68);for(let d=0;d<4;d++)bases.blit(base(d),d*300,0);await save('worlds/farm-base.png',bases);
const comparison=create(80,40);comparison.blit(unitFrame('sniper','front','idle',0,palette),0,0);comparison.blit(unitFrame('sniper','front','idle',0,retroPalette),40,0);await save('comparison.png',comparison);
const manifest={schema:1,style:'cartoon-pixel16-pilot',frame:40,foot:[20,38],worldSize:[600,900],backgroundSize:[300,450],views:original.views,troops:original.troops,zombies:original.zombies,
 base:{width:600,height:136,y:764,frames:4},muzzle:Object.fromEntries(TROOPS.map(id=>[id,Object.fromEntries(views.map(v=>[v,muzzleFor(id,v)]))])),assets};
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const artifacts=outIndex>=0?join(output,'preview'):join(root,'artifacts/pixel16');await mkdir(artifacts,{recursive:true});await writeFile(join(artifacts,'catalog.html'),gallery(manifest,previews));
console.log(`Pixel16: ${assets.length} PNGs, ${assets.reduce((n,a)=>n+a.bytes,0)} bytes. Catálogo: ${join(artifacts,'catalog.html')}`);
