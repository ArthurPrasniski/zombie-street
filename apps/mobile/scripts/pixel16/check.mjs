import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../../..');
const mobile=join(root,'apps/mobile');
const hash=(data)=>createHash('sha256').update(data).digest('hex');
async function fingerprint(folder){
 const result=[];for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const path=join(folder,entry.name);result.push(entry.isDirectory()?await fingerprint(path):hash(await readFile(path)));}return hash(result.join('|'));
}
const before=await fingerprint(join(mobile,'assets/images'));
const temp=await mkdtemp(join(tmpdir(),'zombie-pixel16-'));
try {
 const outputs=[join(temp,'a'),join(temp,'b')];
 for(const output of outputs){const result=spawnSync(process.execPath,[join(mobile,'scripts/pixel16/build.mjs'),'--out',output],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
 assert.equal(await fingerprint(outputs[0]),await fingerprint(outputs[1]),'Geração não determinística');
 const manifest=JSON.parse(await readFile(join(outputs[0],'manifest.json'),'utf8'));
 assert.deepEqual(manifest.foot,[20,38]);assert.equal(manifest.frame,40);
 for(const asset of manifest.assets){
  const png=await readFile(join(outputs[0],asset.path));assert.equal(hash(png),asset.sha256);assert.equal(png.readUInt32BE(16),asset.width);assert.equal(png.readUInt32BE(20),asset.height);
  const chunks=[];let offset=8;
  while(offset<png.length){const size=png.readUInt32BE(offset);if(png.toString('ascii',offset+4,offset+8)==='IDAT')chunks.push(png.subarray(offset+8,offset+8+size));offset+=size+12;}
  const raw=inflateSync(Buffer.concat(chunks));const row=asset.width*4+1;
  for(let y=0;y<asset.height;y++){assert.equal(raw[y*row],0);for(let x=0;x<asset.width;x++)assert([0,255].includes(raw[y*row+1+x*4+3]),`Alpha intermediário: ${asset.path}`);}
  if(asset.path.startsWith('sprites/')){
   const zombies=['walker','runner','brute'].some(id=>asset.path.endsWith('/'+id+'.png'));
   const groups=zombies?manifest.zombies:manifest.troops;
   const columns=Math.max(...Object.values(groups).map(g=>g.start+g.count));
   assert.equal(asset.width,columns*manifest.frame);assert.equal(asset.height,3*manifest.frame);
  }
 }
 assert.equal(await fingerprint(join(mobile,'assets/images')),before,'Arte atual foi modificada');
 const rejected=spawnSync(process.execPath,[join(mobile,'scripts/pixel16/build.mjs'),'--out',join(mobile,'assets/images')],{encoding:'utf8'});assert.notEqual(rejected.status,0);
 console.log(`OK: ${manifest.assets.length} PNGs, dimensões/quadros/alpha, geração reproduzível e arte atual preservada.`);
} finally {await rm(temp,{recursive:true,force:true});}
