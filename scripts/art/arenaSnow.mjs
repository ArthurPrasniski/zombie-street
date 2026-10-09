// Mundo 5, Nevasca: neve com sombras azuladas, estrada de gelo com marcas de pneu e montes de
// neve nas bordas, pinheiros, lago congelado e boneco de neve; no topo, floresta e cabana.
import { ARENA_W, blotches, clashTiles, deployMarks, rand, roadX, topFog } from './arenaKit.mjs';
import { circle, darken, ellipse, fill, line, poly, rrect, SHADOW, soft, toon } from './ck.mjs';

const SNOW = '#e9f1f6';
const ICE = '#a8c4d4';

function road(c) {
  for (let y = 100; y < 790; y += 10) fill(c, rrect(roadX(y) - 44, y, 88, 11, 0), ICE, 0.75);
  for (const off of [-17, 17]) {
    const pts = [];
    for (let y = 100; y <= 790; y += 20) pts.push([roadX(y) + off, y]);
    line(c, pts, darken(ICE, 0.18), 6);
  }
  for (const side of [-1, 1]) {
    for (let y = 110; y < 790; y += 26) fill(c, ellipse(roadX(y) + side * 52, y, 12, 16), '#f8fbfd');
  }
}

/** Pinheiro visto de cima: estrela em camadas com pontas de neve. */
function pine(c, x, y, r) {
  soft(c, ellipse(x + r * 0.4, y + r * 0.5, r, r * 0.7), SHADOW, 0.3, 6);
  for (const [k, color] of [[1, '#24503e'], [0.7, '#2e6a50'], [0.4, '#3a7a5a']]) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = (i % 2 ? 0.55 : 1) * r * k;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    toon(c, poly(pts), color, { line: 1.6, depth: 2 });
  }
  for (let i = 0; i < 5; i++) fill(c, circle(x + (rand(i, x) - 0.5) * r, y + (rand(i, y) - 0.5) * r, 3), '#ffffff', 0.85);
}

function frozenPond(c, x, y) {
  toon(c, ellipse(x, y, 64, 34), '#bfe0f0', { line: 1.8, depth: 4, light: '#ffffff' });
  for (const [a, b] of [[[x - 30, y - 10], [x + 10, y + 6]], [[x + 10, y + 6], [x + 34, y - 8]], [[x + 10, y + 6], [x + 6, y + 24]]]) line(c, [a, b], '#7aa8c0', 1.4);
}

function snowman(c, x, y) {
  soft(c, ellipse(x + 6, y + 10, 18, 7), SHADOW, 0.3, 4);
  toon(c, circle(x, y, 14), '#ffffff', { depth: 3 });
  toon(c, circle(x, y - 14, 9), '#ffffff', { depth: 2 });
  fill(c, poly([[x, y - 14], [x + 9, y - 12], [x, y - 11]]), '#ff8a1f');
}

function cabin(c) {
  toon(c, rrect(250, 10, 110, 70, 6), '#8a5a32', { depth: 3 });
  toon(c, rrect(244, 0, 122, 40, 8), '#f4f8fb', { depth: 2.5 });
  toon(c, rrect(330, 6, 14, 22, 3), '#6a6e78', { line: 1.4, depth: 1 });
  soft(c, circle(337, -4, 12), '#c8d0d8', 0.5, 6);
}

export function drawSnow(c) {
  blotches(c, SNOW, ['#dbe7ef', '#f6fafc'], 81);
  clashTiles(c, 0.7);
  road(c);
  frozenPond(c, 130, 560);
  snowman(c, 470, 640);
  fill(c, rrect(0, 0, ARENA_W, 90, 0), '#dfe9f0');
  for (let i = 0; i < 9; i++) pine(c, 10 + i * 74, 40 + (i % 2) * 34, 34);
  cabin(c);
  for (const [x, y, r] of [[0, 260, 32], [604, 360, 36], [6, 470, 26], [600, 620, 30], [-2, 700, 34]]) pine(c, x, y, r);
  // Neve caindo
  for (let i = 0; i < 70; i++) fill(c, circle(rand(i, 91) * ARENA_W, 100 + rand(i, 92) * 690, 1.2 + rand(i, 93) * 1.6), '#ffffff', 0.8);
  topFog(c, '#c8dcea', 0.45, '#ffffff');
  deployMarks(c);
}
