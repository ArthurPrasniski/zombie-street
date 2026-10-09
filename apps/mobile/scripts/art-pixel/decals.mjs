// Detalhes pintados por cima das formas: sangue, rasgos, podridão e rostos.
import { hash } from './canvas.mjs';
import { P } from './palette.mjs';
import { K, onHead } from './rig.mjs';

/** Ruído suave (interpolado numa grade de `cell` px), em [0, 1). */
export function valueNoise(x, y, cell, seed) {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = x / cell - gx;
  const fy = y / cell - gy;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(gx, gy, seed);
  const b = hash(gx + 1, gy, seed);
  const c = hash(gx, gy + 1, seed);
  const d = hash(gx + 1, gy + 1, seed);
  const top = a + (b - a) * s(fx);
  const bottom = c + (d - c) * s(fx);
  return top + (bottom - top) * s(fy);
}

const near = (p, r) => (x, y) => Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) < r;

/** Mancha irregular que só pinta as partes indicadas, mantendo o tom de luz. */
export function splat(c, center, r, ramp, parts, seed, shift = 0) {
  c.recolor((x, y) => Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y) < r * (0.5 + 0.7 * hash(x, y, seed)), ramp, { parts, shift });
}

/** Buracos na roupa mostrando o que está por baixo. */
export function tears(c, parts, under, density, seed, cell = 2.5) {
  c.recolor((x, y) => valueNoise(x, y, cell, seed) < density, under, { parts });
}

/** Escorridos: descem a partir do ponto enquanto houver pixel pintado. */
export function drips(c, from, count, maxLen, seed, color = P.blood[2]) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(from.x + (hash(i, seed, 1) - 0.5) * 6);
    const len = 1 + Math.floor(hash(seed, i, 2) * maxLen);
    for (let k = 0; k < len; k++) {
      const y = Math.floor(from.y) + k;
      if (!c.filled(x, y)) break;
      c.put(x, y, k === len - 1 ? P.blood[1] : color, 1, c.part[y * c.w + x]);
    }
  }
}

/** Manchas de pele apodrecida dentro de um raio. */
export function rotPatches(c, center, r, ramp, threshold, seed, parts = ['skin'], cell = 2.2) {
  const inside = near(center, r);
  c.recolor((x, y) => inside(x, y) && valueNoise(x, y, cell, seed) < threshold, ramp, { parts });
}

/** Tamanho do "pixel" dos traços do rosto: 1 nas sprites, 2 nas artes ampliadas. */
export const featureSize = (pose) => (K(pose) >= 2 ? 2 : 1);

/** Pinta um traço do rosto (bloco b x b) num ponto local da cabeça. */
export function featurePx(c, pose, lx, ly, color) {
  const p = onHead(pose, lx, ly);
  const b = featureSize(pose);
  for (let dy = 0; dy < b; dy++) for (let dx = 0; dx < b; dx++) c.put(p.x + dx, p.y + dy, color, 1, 'face');
}

/** Rosto de morto-vivo de perfil (olhando para a direita). */
export function zombieFace(c, pose, look, opts = {}) {
  const skin = look.mat.skin.ramp;
  const k = K(pose);
  const px = (lx, ly, color) => featurePx(c, pose, lx, ly, color);
  rotPatches(c, pose.head, 5.5 * k, P.rotRed, 0.35, opts.seed ?? 31, ['skin'], 2.2 * k);
  if (opts.skull) rotPatches(c, onHead(pose, -1.5, -3.2), 2.6 * k, P.bone, 0.75, 41, ['skin'], 2.2 * k);
  // Órbita funda com o olho brilhando
  px(1.6, -1.6, skin[0]);
  px(2.6, -1.6, skin[0]);
  px(3.4, -1.6, skin[1]);
  px(1.6, -0.6, skin[1]);
  px(2.6, -0.6, opts.eye ?? P.eyeGlow);
  px(3.4, -0.6, skin[0]);
  // Nariz carcomido
  px(4.5, 0.4, skin[0]);
  // Boca aberta com dentes e sangue
  px(2.4, 2.4, P.blood[0]);
  px(3.4, 2.4, P.teeth);
  px(4.3, 2.4, P.teeth);
  px(2.4, 3.4, P.blood[1]);
  px(3.4, 3.4, P.blood[0]);
  px(4.3, 3.4, opts.jawOpen ? P.blood[0] : P.teeth);
  if (opts.jawOpen) px(3.4, 4.4, P.teeth);
  px(3.0, 4.6, P.blood[2]);
  px(3.0, 5.6, P.blood[1]);
  // Orelha
  px(-0.8, 0.2, skin[1]);
  px(-0.8, 1.2, skin[0]);
}

/** Cabelo ralo e desgrenhado no alto e atrás da cabeça. */
export function scraggly(c, pose, ramp, strands, seed, long = 0) {
  for (let i = 0; i < strands; i++) {
    const a = -Math.PI * (0.25 + 0.85 * hash(i, seed, 5));
    const root = onHead(pose, Math.cos(a) * 4.2, Math.sin(a) * 4.6);
    const tip = onHead(pose, Math.cos(a) * 4.8 - 2 - long * hash(seed, i, 6), Math.sin(a) * 3 + 2 + long * 1.5 * hash(i, i, seed));
    c.capsule(root, tip, 0.9 * K(pose), 0.5 * K(pose), { ramp, part: 'hair', dither: 0.4 });
  }
}
