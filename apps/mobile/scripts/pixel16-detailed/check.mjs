import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {UI_NAMES,SPELL_NAMES,MATERIAL_NAMES,EXTRA_NAMES} from './ui.mjs';
const mobile=join(dirname(fileURLToPath(import.meta.url)),'../..');
const registration=spawnSync(process.execPath,['--test',join(mobile,'scripts/pixel16-detailed/registration.test.mjs')],{encoding:'utf8'});
assert.equal(registration.status,0,registration.stdout+registration.stderr);
const source=join(mobile,'assets/pixel16-detailed');
const hash=data=>createHash('sha256').update(data).digest('hex');
const names=['farm.png','farm-base.png','sniper.png','walker.png','ui-icons.png','spell-items.png','home.png','ui-materials.png','ui-misc.png','app-icon.png','armored-base.png','space-base.png','blood-bag.png',...(await readdir(join(source,'worlds'))).filter(f=>f.endsWith('.png')).sort().map(f=>'worlds/'+f),...(await readdir(join(source,'units'))).filter(f=>f.endsWith('.png')).sort().map(f=>'units/'+f)];
const before=await Promise.all(names.map(async n=>hash(await readFile(join(source,n)))));
const temp=await mkdtemp(join(tmpdir(),'zr-detailed-check-'));
try{
 for(const name of ['a','b']){const result=spawnSync(process.execPath,[join(mobile,'scripts/pixel16-detailed/build.mjs'),'--out',join(temp,name)],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
 const a=await readFile(join(temp,'a/manifest.json'));assert.equal(hash(a),hash(await readFile(join(temp,'b/manifest.json'))));
 assert.equal(hash(await readFile(join(temp,'a/modules.ts'))),hash(await readFile(join(temp,'b/modules.ts'))));
 assert.equal(hash(await readFile(join(temp,'a/preview/catalog.html'))),hash(await readFile(join(temp,'b/preview/catalog.html'))));
 const m=JSON.parse(a);
 for(const id of [...UI_NAMES,'bloodBag'])assert.equal(hash(await readFile(join(temp,'a/ui',id+'.png'))),hash(await readFile(join(temp,'b/ui',id+'.png'))),'Non-deterministic UI icon');
 for(const id of SPELL_NAMES)assert.equal(hash(await readFile(join(temp,'a/portraits',id+'.png'))),hash(await readFile(join(temp,'b/portraits',id+'.png'))),'Non-deterministic item portrait');
 for(const [folder,ids] of [['materials',MATERIAL_NAMES],['extras',EXTRA_NAMES],['radio',['sniper','sheriff']],['brand',['icon','favicon','android-foreground','android-monochrome','splash','notification']]])for(const id of ids)assert.equal(hash(await readFile(join(temp,'a',folder,id+'.png'))),hash(await readFile(join(temp,'b',folder,id+'.png'))),'Non-deterministic interface asset');
 assert.equal(Object.keys(m.layouts).length,46,'Missing production unit');
 assert.equal(m.assets.filter(a=>a.path==='farm.png'||a.path.startsWith('worlds/')).length,12,'Missing world');
 assert.deepEqual(m.worldSize,[600,900],'The decorative backdrop must not enlarge the combat world');
 assert(m.viewportHeight>m.worldSize[1]&&m.viewportHeight<=1200,'Invalid lower decorative viewport');
 for(const asset of [...m.assets,...m.runtimeAssets]){const png=await readFile(join(temp,'a',asset.path));assert.equal(hash(png),asset.sha256);assert.equal(hash(png),hash(await readFile(join(temp,'b',asset.path))));assert.equal(png.readUInt32BE(16),asset.width);assert.equal(png.readUInt32BE(20),asset.height);}
 function bounds(rect,asset){assert(rect.every(Number.isFinite));assert(rect[0]>=0&&rect[1]>=0&&rect[2]>0&&rect[3]>0);assert(rect[0]+rect[2]<=asset.width&&rect[1]+rect[3]<=asset.height);}
 const ids=Object.keys(m.layouts).filter(id=>id!=='base');
 for(const id of ids){
  const sheet=m.layouts[id],asset=m.runtimeAssets.find(a=>a.path===sheet.asset);assert.equal(sheet.frames.length,24);assert(sheet.scale>0&&sheet.scale<2);
  assert.equal(hash(await readFile(join(temp,'a/portraits',id+'.png'))),hash(await readFile(join(temp,'b/portraits',id+'.png'))),'Non-deterministic portrait');
  // A registered ground anchor can fall just outside a tightly cropped walking cell.
  for(const frame of sheet.frames){bounds(frame.source,asset);bounds(frame.bounds,asset);assert(frame.foot.every(Number.isFinite));assert(frame.foot[0]>=0&&frame.foot[0]<=frame.source[2]);assert(frame.foot[1]>0&&frame.foot[1]<=frame.source[3]*1.1);}
 }
 assert.equal(Object.keys(m.bases).length,3,'Missing base variant');
 for(const [id,layout] of Object.entries(m.bases)){
  const base=m.assets.find(a=>a.path===id+'-base.png');assert.equal(layout.frames.length,4);
  for(const frame of layout.frames){bounds(frame.source,base);bounds(frame.wall.source,base);assert(frame.wall.scale>0);assert(frame.destination[1]+frame.destination[3]<=900.001);}
 }
 assert.deepEqual(await Promise.all(names.map(async n=>hash(await readFile(join(source,n))))),before,'Source PNGs were modified');
 console.log(`OK: immutable source PNGs, deterministic packaging/catalog/portraits, ${ids.length*24} unit poses and 12 base states within bounds.`);
}finally{await rm(temp,{recursive:true,force:true});}
