// Identidade do app (Zombie Road): logo da Home, ícone do iOS, ícone adaptável do Android
// (frente, fundo e monocromático), splash e favicon. O zumbi de frente, grande, na estrada ao
// pôr do sol. Ícones em 1024 x 1024 px.
import { join } from 'node:path';

import { blob, circle, CK, clipped, fill, flush, gradient, OUTLINE, poly, rrect, soft, SHADOW } from './ck.mjs';
import { silhouette } from './clash.mjs';
import { savePng, surface, text, textWidth, typeface } from './output.mjs';
import { drawUnit } from './units.mjs';

const S = 1024;
const MID = S / 2;
const HORIZON = 640;
// Centro da cabeça do zumbi na caixa de desenho de 100 x 100
const HEAD = [52, 47];
const LIME = '#b8e835';

/** Céu do pôr do sol, sol grande atrás da cabeça, morros e estrada com a faixa amarela. */
function backdrop(c) {
  gradient(c, rrect(0, 0, S, HORIZON, 0), '#3b1631', '#f07a2a', 0, HORIZON);
  soft(c, circle(MID, 470, 400), '#ffb347', 0.55, 70);
  fill(c, circle(MID, 470, 330), '#ffc94a');
  fill(c, circle(MID, 470, 290), '#ffe08a');
  fill(c, blob([[-40, HORIZON + 10], [140, HORIZON - 50], [330, HORIZON - 14], [520, HORIZON - 44], [720, HORIZON - 10], [900, HORIZON - 56], [1080, HORIZON - 4], [1080, HORIZON + 60], [-40, HORIZON + 60]]), '#2a1f2c');
  gradient(c, rrect(0, HORIZON, S, S - HORIZON, 0), '#1d4a3c', '#2c7d5b', HORIZON, S);
  fill(c, poly([[MID - 30, HORIZON], [MID + 30, HORIZON], [MID + 700, S], [MID - 700, S]]), OUTLINE);
  fill(c, poly([[MID - 24, HORIZON], [MID + 24, HORIZON], [MID + 660, S], [MID - 660, S]]), '#3a3640');
  // Faixa tracejada nas bordas (o meio fica atrás do zumbi)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const t0 = (i / 6) ** 1.5;
      const t1 = ((i + 0.55) / 6) ** 1.5;
      const at = (t, w) => [MID + side * (24 + 600 * t) + w, HORIZON + (S - HORIZON) * t];
      const [x0, y0] = at(t0, 0);
      const [x1, y1] = at(t1, 0);
      const w0 = 2 + 16 * t0;
      const w1 = 2 + 16 * t1;
      fill(c, poly([[x0 - side * w0, y0], [x0, y0], [x1, y1], [x1 - side * w1, y1]]), '#ffc928');
    }
  }
}

// Unidade (caixa de 100 x 100) com o ponto [x, y] da caixa em (px, py), `scale` px por unidade.
function unit(c, id, kind, k, [x, y], px, py, scale) {
  c.save();
  c.translate(px, py);
  c.scale(scale, scale);
  c.translate(-x, -y);
  silhouette(c, () => drawUnit(c, id, 'front', kind, k));
  c.restore();
}

/** Horda pequena no horizonte, dos dois lados do zumbi grande. */
function horde(c) {
  for (const [id, x, k] of [['runner', 150, 2], ['walker', 250, 5], ['walker', 780, 1], ['brute', 890, 3]]) unit(c, id, 'walk', k, [50, 94], x, HORIZON + 66, 2.4);
}

/** Zumbi grande de frente, mãos para a frente, cabeça centrada em (x, y). */
const bigZombie = (c, x, y, scale) => unit(c, 'walker', 'attack', 2, HEAD, x, y, scale);

/** Ícone completo (iOS, favicon): fundo, horda e o zumbi grande, com escurecido embaixo. */
function iconScene(c) {
  backdrop(c);
  horde(c);
  soft(c, rrect(140, S - 60, S - 280, 160, 80), SHADOW, 0.5, 40);
  bigZombie(c, MID, 500, 15);
  gradient(c, rrect(0, S - 200, S, 200, 0), SHADOW, SHADOW, S - 200, S, 0, 0.45);
}

/** "ZOMBIE ROAD" com contorno e a faixa de asfalto embaixo, centralizado em cx. */
function wordmark(c, cx, baseline, size) {
  const face = typeface('LilitaOne-Regular.ttf');
  const gap = size * 0.2;
  const first = textWidth('ZOMBIE', size, face);
  const width = first + gap + textWidth('ROAD', size, face);
  const left = cx - width / 2;
  const line = size * 0.17;
  text(c, 'ZOMBIE', left, baseline, size, face, LIME, { strokeColor: OUTLINE, strokeWidth: line });
  text(c, 'ROAD', left + first + gap, baseline, size, face, '#ffffff', { strokeColor: OUTLINE, strokeWidth: line });
  const y = baseline + size * 0.2;
  const h = size * 0.2;
  fill(c, rrect(left + 4, y, width - 8, h, h / 2), OUTLINE);
  fill(c, rrect(left + 8, y + h * 0.17, width - 16, h * 0.66, h * 0.33), '#3a3640');
  for (let x = left + size * 0.24; x < left + width - size * 0.6; x += size * 0.63) fill(c, rrect(x, y + h * 0.39, size * 0.37, h * 0.22, h * 0.11), '#ffc928');
  return width;
}

function image(path, w, h, draw) {
  const s = surface(w, h);
  const c = s.getCanvas();
  draw(c);
  flush();
  savePng(s, path);
  s.delete();
}

/** Logo da Home: o nome com a faixa de asfalto, na largura exata do texto. */
function logo(path) {
  const size = 92;
  const face = typeface('LilitaOne-Regular.ttf');
  const W = Math.ceil(44 + textWidth('ZOMBIE', size, face) + size * 0.2 + textWidth('ROAD', size, face));
  image(path, W, 150, (c) => wordmark(c, W / 2, 92, size));
}

// Monocromático: luminosidade abaixo do limite vira recorte (olhos, boca, contornos)
const MONO_LIMIT = 0.22;
const MONO_SLOPE = 20;

/** Figura em branco, com o alfa pela luminosidade: contornos e detalhes escuros viram recortes. */
function monochrome(c, draw) {
  const p = new CK.Paint();
  const [r, g, b] = [0.299, 0.587, 0.114].map((w) => w * MONO_SLOPE);
  p.setColorFilter(CK.ColorFilter.MakeMatrix([0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, r, g, b, 0, -MONO_LIMIT * MONO_SLOPE]));
  c.saveLayer(p);
  draw();
  c.restore();
  p.delete();
}

/** Ícones e splash do app.json, em assets/images. */
function appIcons(dir) {
  image(join(dir, 'icon.png'), S, S, iconScene);
  image(join(dir, 'favicon.png'), 48, 48, (c) => {
    c.scale(48 / S, 48 / S);
    iconScene(c);
  });
  // Android: o recorte mostra só os 2/3 do meio (e um círculo de 61% sempre aparece)
  image(join(dir, 'android-icon-background.png'), S, S, (c) => {
    backdrop(c);
    horde(c);
  });
  image(join(dir, 'android-icon-foreground.png'), S, S, (c) => bigZombie(c, MID, 470, 10));
  image(join(dir, 'android-icon-monochrome.png'), S, S, (c) => monochrome(c, () => bigZombie(c, MID, 470, 10)));
  // Splash: emblema redondo e o nome, dentro do círculo do meio (o Android recorta em círculo)
  image(join(dir, 'splash-icon.png'), S, S, (c) => {
    const disc = circle(MID, 430, 360);
    fill(c, circle(MID, 430, 382), OUTLINE);
    clipped(c, disc, () => {
      c.save();
      c.translate(MID - 360, 70);
      c.scale(720 / S, 720 / S);
      backdrop(c);
      horde(c);
      c.restore();
      bigZombie(c, MID, 400, 10);
    });
    wordmark(c, MID, 845, 104);
  });
}

/** Logo, ícones e splash (também em `npm run art:brand`, sem refazer as sprites). */
export function buildBrand(dir) {
  logo(join(dir, 'logo.png'));
  appIcons(dir);
  console.log('logo.png, icon.png, android-icon-*.png, splash-icon.png, favicon.png');
}
