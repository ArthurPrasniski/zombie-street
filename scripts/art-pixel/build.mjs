// Gera as sprite sheets em assets/images/sprites a partir do código de arte.
// Uso: node scripts/art/build.mjs [--preview <pasta>]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drawArena } from './arena.mjs';
import { BASE_H, BASE_W, drawBase } from './base.mjs';
import { hex, PixelCanvas } from './canvas.mjs';
import { drawPoster } from './home.mjs';
import { ICONS } from './icons.mjs';
import { encodePng } from './png.mjs';
import { unitSheets, VIEWS } from './unitSheets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const layout = JSON.parse(readFileSync(join(root, 'src/game/render/spriteLayout.json'), 'utf8'));
const outDir = join(root, 'assets/images/sprites');
const previewArg = process.argv.indexOf('--preview');
const previewDir = previewArg > 0 ? process.argv[previewArg + 1] : null;

function save(canvas, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(canvas.w, canvas.h, canvas.rgba));
}

/** Monta a sheet: uma linha por vista, cada pixel de arte vira k x k. */
function sheet(rows, frameW = layout.frame, frameH = layout.frame, k = layout.frame / layout.art) {
  const out = new PixelCanvas(frameW * Math.max(...rows.map((r) => r.length)), frameH * rows.length);
  rows.forEach((frames, r) => frames.forEach((f, i) => out.blit(f, i * frameW, r * frameH, k)));
  return out;
}

const background = drawArena();
save(background, join(root, 'assets/images/background.png'));
console.log(`background.png: ${background.w} x ${background.h}`);

const poster = drawPoster();
save(poster, join(root, 'assets/images/home.png'));
console.log(`home.png: ${poster.w} x ${poster.h}`);
for (const [id, draw] of Object.entries(ICONS)) save(draw(), join(root, `assets/images/ui/${id}.png`));
console.log(`ui/: ${Object.keys(ICONS).join(', ')}`);

const bases = [0, 1, 2, 3].map(drawBase);
save(sheet([bases], BASE_W, BASE_H, 1), join(outDir, 'base.png'));
console.log(`sprites/base.png: ${bases.length} quadros`);

const preview = [];
for (const [id, { rows, muzzles }] of Object.entries(unitSheets(layout))) {
  save(sheet(rows), join(outDir, `${id}.png`));
  preview.push(...rows);
  console.log(`sprites/${id}.png: ${rows[0].length} quadros x ${rows.length} vistas`);
  if (!muzzles) continue;
  const expected = layout.muzzle[id];
  for (const view of VIEWS) {
    if (muzzles[view] && JSON.stringify(expected?.[view]) !== JSON.stringify(muzzles[view])) console.warn(`  atualize muzzle.${id}.${view} em spriteLayout.json para ${JSON.stringify(muzzles[view])}`);
  }
}

if (previewDir) {
  const scale = 4;
  const cols = Math.max(...preview.map((r) => r.length));
  const out = new PixelCanvas(cols * 64 * scale, preview.length * 64 * scale);
  const bg = [hex('#3b342c'), hex('#433b32')];
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) out.put(x, y, bg[(Math.floor(x / (64 * scale)) + Math.floor(y / (64 * scale))) % 2]);
  }
  preview.forEach((frames, r) => frames.forEach((f, i) => out.blit(f, i * 64 * scale, r * 64 * scale, scale)));
  save(out, join(previewDir, 'preview.png'));
  console.log(`prévia: ${join(previewDir, 'preview.png')}`);
}
