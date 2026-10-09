// Cenário: entardecer numa estrada de terra de fazenda (800 x 336 px = mundo 1000 x 420).
import { hash, hex, PixelCanvas } from './canvas.mjs';
import { valueNoise } from './decals.mjs';

export const BG_W = 800;
export const BG_H = 336;
const GROUND_TOP = 176; // y = 220 no mundo
const GROUND_BOTTOM = 288; // y = 360 no mundo
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((b) => (b + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export const fbm = (x, y, seed) => 0.55 * valueNoise(x, y, 1, seed) + 0.3 * valueNoise(x * 2.1, y * 2.1, 1, seed + 1) + 0.15 * valueNoise(x * 4.3, y * 4.3, 1, seed + 2);

/** Escolhe entre tons vizinhos de uma lista com pontilhado, para t em [0, 1]. */
export function dithered(colors, t, x, y) {
  const f = Math.max(0, Math.min(0.9999, t)) * (colors.length - 1);
  const i = Math.floor(f);
  return colors[Math.min(colors.length - 1, f - i > bayer(x, y) ? i + 1 : i)];
}

const SKY = ['#160e1c', '#26121f', '#3d1822', '#5e2124', '#842f26', '#a8452a', '#c9632f', '#e08a3c', '#eeb45a'].map((c) => hex(c));
const CLOUD = ['#1d1019', '#2b1520', '#3f1c24'].map((c) => hex(c));
const CLOUD_LIT = ['#7a2f26', '#b14b2c', '#de7a39', '#f2b25a'].map((c) => hex(c));
const SILHOUETTE = hex('#140b0f');
const SILHOUETTE_LIT = hex('#3a1a17');
const FAR_HILLS = ['#4a2028', '#5a272b'].map((c) => hex(c));
const NEAR_HILLS = ['#24121a', '#2e1820'].map((c) => hex(c));
const DIRT = ['#2a1f19', '#36281f', '#433226', '#523d2d', '#634b36', '#76593f'].map((c) => hex(c));
const GRASS = ['#141a10', '#1e2716', '#2b361d', '#3c4925', '#55602f', '#7a7a3a'].map((c) => hex(c));
const SUN = { x: 612, y: 150, r: 24 };

function sky(c) {
  for (let y = 0; y < GROUND_TOP; y++) {
    for (let x = 0; x < BG_W; x++) {
      const glow = Math.max(0, 1 - Math.hypot(x - SUN.x, (y - SUN.y) * 1.8) / 260) * 0.22;
      c.put(x, y, dithered(SKY, y / 168 + glow, x, y));
    }
  }
  for (let y = 0; y < GROUND_TOP; y++) {
    for (let x = 0; x < BG_W; x++) {
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      if (d < SUN.r) c.put(x, y, hex(d < SUN.r - 5 ? '#fff4c4' : d < SUN.r - 2 ? '#fbdc8a' : '#f2b55c'));
    }
  }
}

function clouds(c) {
  const isCloud = (x, y) => y > 8 && y < 140 && fbm(x / 70, y / 6, 11) - (y > 100 ? (y - 100) / 160 : 0) > 0.6;
  for (let y = 0; y < 150; y++) {
    for (let x = 0; x < BG_W; x++) {
      if (!isCloud(x, y)) continue;
      const near = Math.max(0, 1 - Math.hypot(x - SUN.x, y - SUN.y) / 380);
      if (!isCloud(x, y + 1) || !isCloud(x, y + 2)) c.put(x, y, dithered(CLOUD_LIT, near * 0.9 + 0.1, x, y));
      else if (!isCloud(x, y - 1)) c.put(x, y, CLOUD[2]);
      else c.put(x, y, dithered(CLOUD, fbm(x / 20, y / 4, 13), x, y));
    }
  }
}

function ridge(c, base, amp, scale, seed, colors) {
  for (let x = 0; x < BG_W; x++) {
    const top = Math.round(base - amp * fbm(x / scale, 0.5, seed));
    for (let y = top; y < GROUND_TOP + 4; y++) c.put(x, y, dithered(colors, (y - top) / 30, x, y));
  }
}

function tree(c, x, y, len, ang, depth, seed) {
  if (depth === 0 || len < 2) return;
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  const w = Math.max(1, Math.round(depth / 2));
  for (let k = 0; k < w; k++) c.line(Math.round(x) + k, Math.round(y), Math.round(x2) + k, Math.round(y2), SILHOUETTE);
  const spread = 0.35 + 0.35 * hash(depth, seed, 1);
  tree(c, x2, y2, len * (0.62 + 0.15 * hash(seed, depth, 2)), ang - spread, depth - 1, seed * 3 + 1);
  tree(c, x2, y2, len * (0.58 + 0.15 * hash(depth, seed, 3)), ang + spread * 0.8, depth - 1, seed * 5 + 2);
}

function windmill(c, x, base) {
  const top = base - 78;
  for (let y = top; y <= base; y++) {
    const half = 1 + Math.round(((y - top) / (base - top)) * 7);
    c.put(x - half, y, SILHOUETTE);
    c.put(x + half, y, SILHOUETTE);
    if ((y - top) % 12 === 0) c.line(x - half, y, x + half, y, SILHOUETTE);
  }
  for (let y = top + 6; y < base; y += 12) {
    const h1 = 1 + Math.round(((y - top) / (base - top)) * 7);
    const h2 = 1 + Math.round(((y + 12 - top) / (base - top)) * 7);
    c.line(x - h1, y, x + h2, Math.min(base, y + 12), SILHOUETTE);
    c.line(x + h1, y, x - h2, Math.min(base, y + 12), SILHOUETTE);
  }
  const hub = { x, y: top - 2 };
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.1;
    c.line(hub.x, hub.y, Math.round(hub.x + Math.cos(a) * 20), Math.round(hub.y + Math.sin(a) * 20), SILHOUETTE);
    c.line(Math.round(hub.x + Math.cos(a) * 8), Math.round(hub.y + Math.sin(a) * 8), Math.round(hub.x + Math.cos(a + 0.18) * 20), Math.round(hub.y + Math.sin(a + 0.18) * 20), SILHOUETTE);
  }
  for (let y = hub.y - 3; y <= hub.y + 3; y++) c.line(hub.x - 22, hub.y, hub.x - 30, y, SILHOUETTE);
}

function farmhouse(c, x, base) {
  const fill = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) c.line(x0, y, x1, y, SILHOUETTE);
  };
  fill(x, base - 30, x + 60, base);
  for (let k = 0; k <= 14; k++) c.line(x - 4 + k, base - 30 - k, x + 64 - k, base - 30 - k, SILHOUETTE);
  fill(x + 62, base - 18, x + 92, base);
  for (let k = 0; k <= 8; k++) c.line(x + 60, base - 18 - k, x + 94 - k * 2, base - 18 - k, SILHOUETTE);
  fill(x + 44, base - 52, x + 48, base - 40);
  // Janelas com luz fraca e uma quebrada
  for (const [wx, wy, lit] of [[x + 10, base - 22, true], [x + 26, base - 22, false], [x + 72, base - 12, true]]) {
    for (let y = wy; y < wy + 6; y++) for (let xx = wx; xx < wx + 5; xx++) c.put(xx, y, hex(lit ? (hash(xx, y, 9) < 0.7 ? '#b8692c' : '#e09440') : '#2b1414'));
  }
  c.line(x + 26, base - 30, x + 26, base - 30, SILHOUETTE_LIT);
}

function fence(c, from, to, y) {
  for (let x = from; x < to; x++) {
    if (hash(x >> 3, 1, 21) < 0.12) continue; // tábuas faltando
    c.put(x, y, SILHOUETTE_LIT);
    c.put(x, y + 1, SILHOUETTE);
    c.put(x, y + 6, SILHOUETTE_LIT);
    c.put(x, y + 7, SILHOUETTE);
  }
  for (let x = from; x < to; x += 22) {
    const lean = hash(x, 2, 23) < 0.3 ? 1 : 0;
    for (let k = -4; k < 13; k++) {
      c.put(x + (k < 0 ? lean : 0), y + k, SILHOUETTE);
      c.put(x + 1 + (k < 0 ? lean : 0), y + k, SILHOUETTE_LIT);
    }
  }
}

function road(c) {
  for (let y = GROUND_TOP; y < GROUND_BOTTOM; y++) {
    const depth = (y - GROUND_TOP) / (GROUND_BOTTOM - GROUND_TOP);
    for (let x = 0; x < BG_W; x++) {
      let t = 0.62 - depth * 0.25 + (fbm(x / 26, y / 9, 31) - 0.5) * 0.55;
      const rut = Math.min(Math.abs(y - 214 - 3 * Math.sin(x / 60)), Math.abs(y - 254 - 3 * Math.sin(x / 75 + 2)));
      if (rut < 3) t -= 0.22 - rut * 0.05;
      const warm = Math.max(0, 1 - Math.hypot(x - SUN.x, (y - GROUND_TOP) * 3) / 300) * 0.25;
      c.put(x, y, dithered(DIRT, t + warm, x, y));
    }
  }
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(hash(i, 1, 41) * BG_W);
    const y = GROUND_TOP + 6 + Math.floor(hash(i, 2, 41) * (GROUND_BOTTOM - GROUND_TOP - 8));
    const big = hash(i, 3, 41) < 0.25;
    c.put(x, y, DIRT[5]);
    c.put(x + 1, y + 1, DIRT[0]);
    if (big) {
      c.put(x + 1, y, DIRT[4]);
      c.put(x, y + 1, DIRT[2]);
      c.put(x + 2, y + 1, DIRT[0]);
    }
  }
  // Poça refletindo o céu
  for (let y = 258; y < 266; y++) {
    for (let x = 470; x < 540; x++) {
      if (((x - 505) / 35) ** 2 + ((y - 262) / 4) ** 2 > 1 - 0.3 * hash(x, y, 43)) continue;
      c.put(x, y, dithered(SKY.slice(4), (y - 258) / 8 + 0.2 * hash(x, y, 47), x, y));
    }
  }
}

function grass(c, y0, y1, density, height, seed) {
  for (let x = 0; x < BG_W; x++) {
    for (let y = y0; y < y1; y++) {
      if (hash(x, y, seed) > density) continue;
      const h = 1 + Math.floor(hash(y, x, seed + 1) * height);
      for (let k = 0; k < h; k++) c.put(x + (k > 2 && hash(x, k, seed) < 0.4 ? 1 : 0), y - k, GRASS[Math.min(5, 1 + Math.floor(((h - k) / h) * 4 * hash(x, y, 3) + (y - y0) / 40))]);
    }
  }
}

function foreground(c) {
  for (let y = GROUND_BOTTOM; y < c.h; y++) {
    for (let x = 0; x < BG_W; x++) c.put(x, y, dithered(GRASS.slice(0, 4), 0.75 - (y - GROUND_BOTTOM) / 60 + (fbm(x / 14, y / 6, 51) - 0.5) * 0.6, x, y));
  }
  grass(c, GROUND_BOTTOM - 2, GROUND_BOTTOM + 30, 0.18, 9, 53);
}

function vignette(c) {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < BG_W; x++) {
      const d = Math.hypot((x - BG_W / 2) / (BG_W / 2), (y - c.h * 0.45) / (c.h * 0.75));
      if (d > 0.85 && bayer(x, y) < (d - 0.85) * 1.6) c.put(x, y, hex('#000000', 70));
    }
  }
}

/** `height` maior que 336 estende o mato de primeiro plano (usado no pôster). */
export function drawBackground(height = BG_H) {
  const c = new PixelCanvas(BG_W, height);
  sky(c);
  clouds(c);
  ridge(c, 158, 22, 140, 61, FAR_HILLS);
  windmill(c, 648, 168);
  farmhouse(c, 360, 170);
  tree(c, 150, 172, 26, -Math.PI / 2, 6, 7);
  tree(c, 742, 174, 30, -Math.PI / 2 - 0.05, 6, 19);
  ridge(c, 172, 8, 60, 67, NEAR_HILLS);
  fence(c, 0, BG_W, 164);
  road(c);
  grass(c, GROUND_TOP - 1, GROUND_TOP + 5, 0.35, 6, 71);
  foreground(c);
  vignette(c);
  return c;
}
