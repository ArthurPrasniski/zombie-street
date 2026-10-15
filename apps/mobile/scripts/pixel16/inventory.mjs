import { existsSync } from 'node:fs';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const images = join(root, 'apps/mobile/assets/images');
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function files(dir) {
 const items = await readdir(dir, { withFileTypes: true });
 const groups = await Promise.all(items.sort((a,b) => a.name.localeCompare(b.name,'en')).map((i) => i.isDirectory() ? files(join(dir,i.name)) : [join(dir,i.name)]));
 return groups.flat();
}
const consumers = [];
const hasWeb=existsSync(join(root,'sites/zombie-road/dist/assets'));
const pilot=JSON.parse(await readFile(join(root,'apps/mobile/assets/pixel16/manifest.json'),'utf8').catch(()=>'{"assets":[]}')).assets;
const detailed=JSON.parse(await readFile(join(root,'apps/mobile/assets/pixel16-detailed/manifest.json'),'utf8').catch(()=>' {"assets":[]}')).assets;
const detailedTargets={'worlds/farm.png':'farm.png','worlds/farm-base.png':'farm-base.png','sprites/sniper.png':'sniper.png','sprites/walker.png':'walker.png'};
const routes=(await files(join(root,'apps/mobile/app'))).filter(p=>p.endsWith('.tsx')).map(p=>relative(root,p));
const renderModules=(await files(join(root,'apps/mobile/src/game/render'))).filter(p=>/\.(ts|tsx)$/.test(p)).map(p=>relative(root,p));
for (const folder of ['apps/mobile/src','apps/mobile/app','apps/mobile/scripts/art',...(hasWeb?['sites/zombie-road/dist']:[])]) {
 for (const path of await files(join(root,folder))) if (/\.(tsx?|mjs|js|html|css)$/.test(path)) consumers.push({ path: relative(root,path), text: await readFile(path,'utf8') });
}
const webHashes = new Map();
for (const path of hasWeb?await files(join(root,'sites/zombie-road/dist/assets')):[]) if (path.endsWith('.png')) {
 const hash = sha(await readFile(path)); webHashes.set(hash,[...(webHashes.get(hash) ?? []),relative(root,path)]);
}
const sourceFor = (group) => ({ sprites: ['build.mjs','units.mjs','clash.mjs'], worlds: ['build.mjs','arena.mjs','base.mjs'], cards: ['build.mjs','portraits.mjs'], bestiary: ['build.mjs','portraits.mjs'], radio: ['build.mjs','portraits.mjs'], mascots: ['build.mjs','portraits.mjs'], ui: ['build.mjs','icons.mjs'] })[group] ?? ['build.mjs','brand.mjs','lobby.mjs'];
const records = [];
for (const path of await files(images)) {
 if (!path.endsWith('.png')) continue;
 const buffer = await readFile(path); const asset = relative(images,path); const group = asset.includes('/') ? asset.split('/')[0] : 'identity';
 if (!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error(`PNG inválido: ${asset}`);
 const selected=detailed.find(p=>p.path===detailedTargets[asset]);
 records.push({ asset: `apps/mobile/assets/images/${asset}`, group, width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length,
  sha256: sha(buffer), sources: sourceFor(group).map((f) => `apps/mobile/scripts/art/${f}`),
  consumers: consumers.filter((c) => c.text.includes(`assets/images/${asset}`)).map((c) => c.path), webCopies: webHashes.get(sha(buffer)) ?? [],
  target: selected?`apps/mobile/assets/pixel16-detailed/${selected.path}`:`apps/mobile/assets/pixel16/${asset}`, status: selected?'detailed-pilot':pilot.some(p=>p.path===asset)?'pilot':'planned', targetSource:selected?'docs/pixel16/detailed/provenance.json':null, targetDimensions: selected?{width:selected.width,height:selected.height}:pilot.find(p=>p.path===asset)?{width:pilot.find(p=>p.path===asset).width,height:pilot.find(p=>p.path===asset).height}:null });
}
const groups = Object.fromEntries([...new Set(records.map((r) => r.group))].map((g) => [g,records.filter((r) => r.group === g).length]));
const output = join(root,'docs/pixel16'); await mkdir(output,{recursive:true});
await writeFile(join(output,'inventory.json'),JSON.stringify({ schema: 1, groups, webAvailable:hasWeb, routes, renderModules, assets: records },null,2)+'\n');
const rows = records.map((r) => `| ${r.asset.replace('apps/mobile/assets/images/','')} | ${r.width}×${r.height} | ${r.sources.map((p) => p.split('/').at(-1)).join(', ')} | ${r.consumers.length} | ${r.webCopies.length} | ${r.status==='detailed-pilot'?'Piloto detalhado':r.status==='pilot'?'Protótipo simples':'Planejado'} |`);
await writeFile(join(output,'INVENTARIO.md'),`# Inventário da conversão 16-bit\n\nGerado por \`npm run art:pixel:inventory\`. ${records.length} imagens PNG.\n\nA matriz completa em [inventory.json](inventory.json) inclui origem, consumidores diretos,\ncópias idênticas da web, SHA-256 e destino de cada asset. Consumidores dinâmicos\ndevem ser conferidos junto com os geradores; zero referências diretas não significa asset sem uso.\n\n## Cobertura\n\n${Object.entries(groups).map(([g,n]) => `- ${g}: ${n}`).join('\n')}\n\n## Rotas e render\n\n${routes.map(p=>'\x60'+p+'\x60').join(' · ')}.\n\nO JSON lista também ${renderModules.length} módulos do render; referências dinâmicas exigem revisão desse conjunto. Web disponível nesta coleta: ${hasWeb?'sim':'não'}.\n\n## Assets\n\n| Asset | Dimensões | Gerador | Referências diretas | Cópias na web | Estado |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`);
console.log(JSON.stringify({ images: records.length, groups, webCopies: records.reduce((n,r) => n + r.webCopies.length,0) }));
