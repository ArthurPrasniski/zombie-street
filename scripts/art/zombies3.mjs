// Zumbis especiais (GDD seção 17.4): Cuspidor, Escavador, Divisor, Pequeno (o pedaço do Divisor)
// e Porta-escudo. Ganchos do chibi; dentro de `head`, a cabeça tem raio 15 (DESIGN_HEAD).
import { BUILD } from './chibi.mjs';
import { capsule, circle, clipped, darken, ellipse, fill, intersect, line, lighten, poly, rrect, toon } from './ck.mjs';
import { zombieFace } from './face.mjs';

const ACID = '#9be04a';

/** Manchas só dentro do tronco. */
function patches(c, a, spots) {
  clipped(c, a.torsoPath, () => {
    const [nx, ny] = a.neck;
    for (const [dx, dy, r, color] of spots) fill(c, ellipse(nx + dx, ny + dy, r * 1.3, r), color);
  });
}

// ---------- Cuspidor: capuz roxo, papo inchado de ácido e baba verde ----------

const spitter = {
  skin: '#b7c95a', shirt: '#6a4a8a', pants: '#3a3a48', shoes: '#2a2533',
  build: { ...BUILD, torsoW: 22, armR: 3.4, handR: 4 },
  behind(c, a) {
    // Capuz atrás da cabeça
    if (a.view === 'back') return;
    const [x, y] = a.head;
    toon(c, ellipse(x - (a.view === 'side' ? 3 : 0), y - 1, 20, 19), '#5a3a78', { depth: 2 });
  },
  head(c, a, look) {
    const [x, y] = a.head;
    if (a.view === 'back') {
      toon(c, intersect(a.headPath, ellipse(x, y - 2, 18, 17)), '#5a3a78', { depth: 2, noLine: true });
      return;
    }
    // Bochechas inchadas de ácido, a boca aberta e a baba escorrendo
    const cheeks = a.view === 'side' ? [[6, 6]] : [[-9, 6], [9, 7]];
    for (const [cx, cy] of cheeks) toon(c, circle(x + cx, y + cy, 4.2), ACID, { line: 1.2, depth: 1, light: '#e8ffb0' });
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.75, glow: '#d8f06a' });
    const dx = a.view === 'side' ? 9 : 1;
    for (const [ox, oy, r] of [[-2, 14.5, 1.5], [2, 16.5, 1.1]]) toon(c, ellipse(x + dx + ox, y + oy, r, r * 1.5), ACID, { line: 0.9, depth: 0.4 });
  },
  torso(c, a) {
    patches(c, a, [[-5, 8, 3, darken('#6a4a8a', 0.25)], [6, 14, 2.4, ACID]]);
  },
};

// ---------- Escavador: capacete de mineiro com lanterna e roupa suja de terra ----------

const digger = {
  skin: '#8fae8a', shirt: '#c98a3a', pants: '#6a4a2a', shoes: '#3a2a1a',
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.3 });
    const [x, y] = a.head;
    toon(c, intersect(ellipse(x, y - 2, 17, 15), rrect(x - 22, y - 22, 44, 17, 0)), '#ffc928', { depth: 2.2, light: '#fff1a8' });
    toon(c, rrect(x - 18, y - 7, 36, 3.4, 1.7), darken('#ffc928', 0.3), { line: 1, depth: 0.6 });
    if (a.view === 'back') return;
    const lx = x + (a.view === 'side' ? 11 : 0);
    toon(c, circle(lx, y - 11, 3.6), '#fff6c8', { line: 1.2, depth: 0.6, light: '#ffffff' });
  },
  torso(c, a) {
    patches(c, a, [[-6, 6, 4, '#6a4a2a'], [7, 13, 3.6, '#5a3a22'], [-1, 17, 2.6, '#6a4a2a']]);
  },
};

// ---------- Divisor: metade verde e metade roxa, costurado no meio ----------

const SPLIT_GREEN = '#8fc46a';
const SPLIT_PURPLE = '#a88ad8';

/** Pontos da costura numa linha vertical de y0 a y1. */
function seam(c, x, y0, y1) {
  line(c, [[x, y0], [x, y1]], darken(SPLIT_PURPLE, 0.55), 1.3);
  for (let y = y0 + 2; y < y1; y += 3.4) line(c, [[x - 1.6, y], [x + 1.6, y + 0.8]], darken(SPLIT_PURPLE, 0.55), 1);
}

const splitter = {
  skin: SPLIT_GREEN, shirt: '#e8e4d0', sleeve: SPLIT_GREEN, pants: '#4a5a7a', shoes: '#2e2a36',
  build: { ...BUILD, torsoW: 30, armR: 4.4, handR: 4.8, legR: 5.2 },
  head(c, a, look) {
    const [x, y] = a.head;
    // A metade da direita é roxa (de perfil, a parte de trás da cabeça)
    const half = a.view === 'side' ? rrect(x - 30, y - 30, 26, 60, 0) : rrect(x, y - 30, 30, 60, 0);
    toon(c, intersect(a.headPath, half), SPLIT_PURPLE, { depth: 2, noLine: true });
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.45 });
    if (a.view === 'front' || a.view === 'back') seam(c, x, y - 15, y + 15);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    clipped(c, a.torsoPath, () => fill(c, rrect(nx, ny - 2, 30, 40, 0), lighten(SPLIT_PURPLE, 0.55), 0.55));
    if (a.view !== 'side') seam(c, nx, ny, ny + 20);
  },
};

const splitling = {
  stride: 6,
  skin: SPLIT_PURPLE, shirt: '#e8e4d0', sleeve: SPLIT_PURPLE, pants: '#4a5a7a', shoes: '#2e2a36',
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.6 });
    const [x, y] = a.head;
    if (a.view === 'front') seam(c, x - 9, y - 12, y + 6);
  },
};

// ---------- Porta-escudo: placa de PARE como escudo ----------

const SIGN = '#d8263a';

function octagon(x, y, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const t = Math.PI / 8 + (i * Math.PI) / 4;
    pts.push([x + Math.cos(t) * r, y + Math.sin(t) * r]);
  }
  return poly(pts);
}

const shielder = {
  skin: '#7fa88a', shirt: '#3a4a5a', pants: '#2a3040', shoes: '#1a1a22',
  build: { ...BUILD, torsoW: 28, armR: 4.4, handR: 4.8 },
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.3, glow: '#7fd0ff' });
    const [x, y] = a.head;
    // Capacete de obra amassado
    toon(c, intersect(ellipse(x, y - 1, 16.5, 14.5), rrect(x - 20, y - 20, 40, 14, 0)), '#e8eef4', { depth: 2 });
  },
  // De costas, a placa fica do outro lado do corpo; de frente, na frente das mãos
  weapon(c, a) {
    const [nx, ny] = a.neck;
    if (a.view === 'side') {
      toon(c, capsule([nx + 14, ny + 26], [nx + 14, ny - 2], 1.6), '#8a92a8', { line: 1, depth: 0.6 });
      toon(c, rrect(nx + 11, ny - 6, 7, 30, 3), SIGN, { line: 1.6, depth: 1.4 });
    } else if (a.view === 'back') {
      toon(c, octagon(nx, ny + 9, 17), SIGN, { line: 2, depth: 2.4 });
    }
  },
  after(c, a) {
    if (a.view !== 'front') return;
    const [nx, ny] = a.neck;
    toon(c, octagon(nx, ny + 10, 16), '#f4f1ea', { line: 2, depth: 2 });
    toon(c, octagon(nx, ny + 10, 13.5), SIGN, { line: 0.8, depth: 2, light: '#ff7a86' });
    line(c, [[nx - 7, ny + 10], [nx + 7, ny + 10]], '#ffffff', 3.4);
  },
};

export const SPECIAL_ZOMBIE_LOOKS = { spitter, digger, splitter, splitling, shielder };
