// Gera a arte vetorial em assets/images (uso: npm run art). Sem argumentos, gera tudo; com
// argumentos, só as partes pedidas: worlds, sprites (ou sprites=walker,cop), ui, cards, bestiary,
// radio, mascots, lobby, brand. Ex.: npm run art -- ui cards
// Sheets das unidades: 3 linhas (frente, costas, perfil) x quadros do layout; a boca das armas
// de cada vista é medida no desenho e gravada em spriteLayout.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ARENA_H, ARENA_W, ARENAS } from './arena.mjs';
import { buildBrand } from './brand.mjs';
import { BASE_H, BASE_W, drawBase } from './base.mjs';
import { CK, flush, ROOT, setToonStyle } from './ck.mjs';
import { savePng, surface } from './output.mjs';
import { UI_ICONS } from './icons.mjs';
import { LOBBY_H, LOBBY_W, drawLobby } from './lobby.mjs';
import { FIRE_FRAME, frameSpec, silhouette, squash, squashed } from './clash.mjs';
import { bestiaryPortraits, cardPortraits, mascots, radioPortraits } from './portraits.mjs';
import { toonClash } from './shadeClash.mjs';
import { drawUnit, HEROES, ZOMBIES } from './units.mjs';

// Estilo Clash 2D: sombreamento com volume em todas as peças
setToonStyle(toonClash);

const layoutPath = join(ROOT, 'src/game/render/spriteLayout.json');
const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));
const out = join(ROOT, 'assets/images');
const VIEWS = ['front', 'back', 'side'];
const PX = layout.worldPx; // pixels por unidade do mundo no cenário e na base

// Partes pedidas na linha de comando (vazio = tudo)
const args = process.argv.slice(2);
const want = (part) => args.length === 0 || args.some((a) => a === part || a.startsWith(`${part}=`));
const onlyUnits = args.find((a) => a.startsWith('sprites='))?.slice('sprites='.length).split(',') ?? null;

const range = (kind, n) => Array.from({ length: n }, (_, k) => [kind, k]);
const columns = (groups) => Object.entries(groups).flatMap(([kind, g]) => range(kind, g.count));

/** Uma sheet: linhas = vistas, colunas = quadros. Quadros "caído" e morte são sempre de perfil. */
function unitSheet(id, cols, frame) {
  const s = surface(frame * cols.length, frame * VIEWS.length);
  const c = s.getCanvas();
  const muzzles = {};
  VIEWS.forEach((view, row) =>
    cols.forEach(([kind, k], i) => {
      c.save();
      c.clipRect(CK.XYWHRect(i * frame, row * frame, frame, frame), CK.ClipOp.Intersect, true);
      c.translate(i * frame, row * frame);
      c.scale(frame / layout.box, frame / layout.box);
      // Quadro com o acabamento Clash 2D: contorno externo e esticar/achatar
      const spec = frameSpec(id, kind, k, cols.filter(([g]) => g === kind).length);
      const unitView = kind === 'down' || kind === 'death' ? 'side' : view;
      const pose = silhouette(c, () => squash(c, spec.sx, spec.sy, () => drawUnit(c, id, unitView, spec.kind, spec.k)));
      if (kind === 'attack' && k === FIRE_FRAME && pose?.muzzle) muzzles[view] = squashed(pose.muzzle, spec.sx, spec.sy).map((v) => Math.round(v));
      c.restore();
      flush();
    }),
  );
  const bytes = savePng(s, join(out, 'sprites', `${id}.png`));
  s.delete();
  console.log(`sprites/${id}.png: ${cols.length} x ${VIEWS.length} quadros de ${frame} px (${Math.round(bytes / 1024)} KB)`);
  return muzzles;
}

function scene(name, w, h, draw, px = PX) {
  const s = surface(w * px, h * px);
  const c = s.getCanvas();
  c.scale(px, px);
  draw(c);
  flush();
  const bytes = savePng(s, join(out, name));
  s.delete();
  console.log(`${name}: ${w * px} x ${h * px} (${Math.round(bytes / 1024)} KB)`);
}

// Um cenário e uma base (com o chão do mundo) para cada mundo
for (const [world, drawArena] of want('worlds') ? Object.entries(ARENAS) : []) {
  scene(`worlds/${world}.png`, ARENA_W, ARENA_H, drawArena);
  scene(`worlds/${world}-base.png`, BASE_W * layout.base.frames, BASE_H, (c) => {
    for (let d = 0; d < layout.base.frames; d++) {
      c.save();
      c.clipRect(CK.XYWHRect(d * BASE_W, 0, BASE_W, BASE_H), CK.ClipOp.Intersect, true);
      c.translate(d * BASE_W, 0);
      drawBase(c, d, world);
      c.restore();
      flush();
    }
  });
}

const troopCols = columns(layout.troops);
const zombieCols = columns(layout.zombies);
const pickUnits = (ids) => (!want('sprites') ? [] : onlyUnits ? ids.filter((id) => onlyUnits.includes(id)) : ids);
// Só as sheets refeitas trocam a boca da arma; as outras ficam como estavam
const muzzle = onlyUnits ? { ...layout.muzzle } : {};
for (const id of pickUnits([...HEROES, 'dog', 'barricade', 'turret', 'drone', 'tesla'])) {
  const found = unitSheet(id, troopCols, layout.frame);
  if (Object.keys(found).length) muzzle[id] = found;
}
for (const id of pickUnits(ZOMBIES)) unitSheet(id, zombieCols, layout.bigFrame[id] ?? layout.frame);

if (want('sprites') && JSON.stringify(muzzle) !== JSON.stringify(layout.muzzle)) {
  layout.muzzle = muzzle;
  // Pares [x, y] e { start, count } numa linha só, como o arquivo é escrito à mão
  const json = JSON.stringify(layout, null, 2)
    .replace(/\[\s+(-?\d+),\s+(-?\d+)\s+\]/g, '[$1, $2]')
    .replace(/\{\s+"start": (\d+),\s+"count": (\d+)\s+\}/g, '{ "start": $1, "count": $2 }')
    .replace(/\{\s+("\w+": [\d.]+)\s+\}/g, '{ $1 }')
    .replace(/\{\s+"front": (\d+),\s+"back": (\d+),\s+"side": (\d+)\s+\}/g, '{ "front": $1, "back": $2, "side": $3 }');
  writeFileSync(layoutPath, `${json}\n`);
  console.log('spriteLayout.json: bocas das armas atualizadas');
}

for (const [id, draw] of want('ui') ? Object.entries(UI_ICONS) : []) {
  const s = surface(96, 96);
  const c = s.getCanvas();
  c.scale(0.92, 0.92);
  c.translate(4, 4);
  silhouette(c, () => draw(c), 2.6);
  flush();
  savePng(s, join(out, 'ui', `${id}.png`));
  s.delete();
}
if (want('ui')) console.log(`ui/: ${Object.keys(UI_ICONS).join(', ')}`);
if (want('cards')) {
  cardPortraits(join(out, 'cards'));
  console.log('cards/: retratos das cartas');
}
if (want('bestiary')) {
  bestiaryPortraits(join(out, 'bestiary'));
  console.log('bestiary/: retratos do Bestiário');
}
if (want('radio')) {
  radioPortraits(join(out, 'radio'));
  console.log('radio/: retratos do rádio');
}
if (want('mascots')) {
  mascots(join(out, 'mascots'));
  console.log('mascots/: mascotes da Home');
}
if (want('lobby')) scene('lobby.png', LOBBY_W, LOBBY_H, drawLobby, 1.5);
if (want('brand')) buildBrand(out);
