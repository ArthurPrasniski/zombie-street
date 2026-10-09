// Ícones pequenos da interface (moeda, cadeado, check), em pixel art de 14 x 14.
import { ERASE, hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { v } from './rig.mjs';

const SIZE = 14;
const green = [P.outline, P.pantsGreen[2], P.pantsGreen[3], P.olive[4], P.olive[4]];

function coin() {
  const c = new PixelCanvas(SIZE, SIZE);
  c.ellipse(7, 7, 6, 6, { ramp: P.gold, edge: 2, dither: 0.4 });
  c.ellipse(7, 7, 3.6, 3.6, { ramp: P.gold, shift: -1, edge: 0, dither: 0 });
  c.line(7, 4, 7, 9, P.gold[1]);
  c.line(6, 5, 8, 5, P.gold[1]);
  c.line(6, 8, 8, 8, P.gold[1]);
  c.outline(P.outline);
  return c;
}

function lock() {
  const c = new PixelCanvas(SIZE, SIZE);
  c.capsule(v(4.5, 6.5), v(4.5, 3.5), 1, 1, { ramp: P.steel });
  c.capsule(v(9.5, 6.5), v(9.5, 3.5), 1, 1, { ramp: P.steel });
  c.capsule(v(4.5, 3), v(9.5, 3), 1, 1, { ramp: P.steel });
  c.polygon([v(2, 6), v(12, 6), v(12, 13), v(2, 13)], { ramp: P.gold, edge: 1 });
  c.line(7, 8, 7, 10, P.outline);
  c.outline(P.outline);
  return c;
}

function check() {
  const c = new PixelCanvas(SIZE, SIZE);
  const mat = { ramp: green, edge: 1, dither: 0 };
  c.capsule(v(2.5, 7.5), v(5.5, 10.5), 1.4, 1.4, mat);
  c.capsule(v(5.5, 10.5), v(11.5, 3), 1.4, 1.4, mat);
  c.outline(P.outline);
  return c;
}

const OLIVE_DRAB = [hex('#141a0c'), hex('#28331a'), hex('#3f4f28'), hex('#5a6e38'), hex('#7a8f4c')];
const WHITE = [hex('#3a3632'), hex('#7a746c'), hex('#b8b1a6'), hex('#e2dccf'), hex('#fbf7ee')];
const BOTTLE = [hex('#0d1a10'), hex('#1d3a22'), hex('#2f5c36'), hex('#4a8550'), hex('#79b27a')];
const RED = P.scarf;

function energy() {
  const c = new PixelCanvas(SIZE, SIZE);
  c.polygon([v(8, 1), v(3, 8), v(7, 8), v(5, 13), v(11, 5), v(7, 5), v(9, 1)], { ramp: P.gold, edge: 1, dither: 0 }, [-0.4, -0.6, 1]);
  c.outline(P.outline);
  return c;
}

function grenade() {
  const c = new PixelCanvas(32, 32);
  c.ellipse(15, 19, 9, 10, { ramp: OLIVE_DRAB, edge: 2, dither: 0.5 });
  for (let x = 8; x <= 22; x += 4) c.line(x, 11, x, 28, OLIVE_DRAB[1]);
  for (let y = 14; y <= 26; y += 4) c.line(7, y, 23, y, OLIVE_DRAB[1]);
  c.polygon([v(12, 6), v(19, 6), v(19, 10), v(12, 10)], { ramp: P.steel, edge: 1 });
  c.capsule(v(19, 7), v(26, 13), 1, 1, { ramp: P.steel });
  c.ellipse(9, 6, 3, 3, { ramp: P.gold, edge: 1 });
  c.ellipse(9, 6, 1.4, 1.4, { ramp: [ERASE] });
  c.outline(P.outline);
  return c;
}

function medkit() {
  const c = new PixelCanvas(32, 32);
  c.polygon([v(4, 10), v(28, 10), v(28, 28), v(4, 28)], { ramp: WHITE, edge: 2 }, [-0.3, -0.6, 1]);
  c.polygon([v(12, 6), v(20, 6), v(20, 10), v(12, 10)], { ramp: WHITE, shift: -1, edge: 1 });
  c.polygon([v(13, 13), v(19, 13), v(19, 16), v(22, 16), v(22, 22), v(19, 22), v(19, 25), v(13, 25), v(13, 22), v(10, 22), v(10, 16), v(13, 16)], { ramp: RED, edge: 1 }, [-0.3, -0.6, 1]);
  c.outline(P.outline);
  return c;
}

function molotov() {
  const c = new PixelCanvas(32, 32);
  c.capsule(v(16, 28), v(16, 17), 6, 6, { ramp: BOTTLE, edge: 2 });
  c.capsule(v(16, 17), v(16, 9), 2.4, 2.2, { ramp: BOTTLE, edge: 1 });
  c.capsule(v(16, 9), v(13, 4), 1.6, 1.2, { ramp: P.tan });
  for (const [x, y, t] of [[12, 2, 1], [11, 0, 0], [14, 1, 1], [13, 3, 2], [10, 2, 2], [12, 4, 0]]) c.put(x, y, P.flash[t]);
  c.line(13, 21, 13, 26, BOTTLE[4]);
  c.outline(P.outline);
  return c;
}

function airstrike() {
  const c = new PixelCanvas(32, 32);
  // Avião visto de cima mergulhando, com uma bomba caindo
  c.capsule(v(6, 10), v(26, 10), 2.6, 2, { ramp: P.charcoal, edge: 1 });
  c.polygon([v(13, 10), v(18, 10), v(14, 2), v(12, 2)], { ramp: P.charcoal, edge: 1 });
  c.polygon([v(13, 10), v(18, 10), v(14, 18), v(12, 18)], { ramp: P.charcoal, edge: 1 });
  c.polygon([v(4, 10), v(7, 10), v(5, 6), v(3, 6)], { ramp: P.charcoal, edge: 1 });
  c.ellipse(20, 24, 3, 4.5, { ramp: OLIVE_DRAB, edge: 1 });
  c.line(20, 19, 20, 17, P.metal[2]);
  c.put(26, 9, P.flash[1]);
  c.outline(P.outline);
  return c;
}

export const ICONS = { coin, lock, check, energy, grenade, medkit, molotov, airstrike };
