// Mundo 6, Cidade Tecnológica: avenida escura com ladrilhos e faixas de neon, calçadas de vidro,
// postes de luz ciano e, no topo, torres de vidro com janelas acesas e um painel holográfico.
import { ARENA_H, ARENA_W, clashTiles, deployMarks, puddle, rand, roadX, topFog } from './arenaKit.mjs';
import { capsule, circle, darken, ellipse, fill, gradient, line, poly, rrect, soft, toon } from './ck.mjs';

const FLOOR = '#262a3e';
const WALK = '#343a58';
const NEON = '#3ee8ff';
const PINK = '#ff4fd8';

function avenue(c) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), FLOOR);
  clashTiles(c, 1.2);
  // Grade de neon fraca no chão
  for (let y = 100; y < 800; y += 50) line(c, [[64, y], [536, y]], NEON, 1, 0.08);
  for (let x = 100; x < 520; x += 50) line(c, [[x, 100], [x, 790]], NEON, 1, 0.06);
  for (const [x0, w, curb] of [[0, 64, 64], [536, 64, 536]]) {
    fill(c, rrect(x0, 100, w, 690, 0), WALK);
    for (let y = 120; y < 790; y += 40) fill(c, rrect(x0 + 6, y, w - 12, 30, 6), '#ffffff', 0.05);
    line(c, [[curb, 100], [curb, 790]], PINK, 4, 0.8);
    soft(c, rrect(curb - 6, 100, 12, 690, 6), PINK, 0.25, 6);
  }
  // Faixas da avenida em neon ciano
  for (let y = 110; y < 790; y += 40) {
    fill(c, rrect(roadX(y) - 3, y, 6, 22, 3), NEON, 0.9);
    for (const x of [180, 420]) fill(c, rrect(x - 2, y + 8, 4, 16, 2), '#e8f4ff', 0.35);
  }
}

function neonPost(c, x, y, flip) {
  soft(c, ellipse(x + 28 * flip, y + 4, 44, 18), NEON, 0.18, 12);
  toon(c, capsule([x, y], [x + 24 * flip, y], 2.4), '#4a5070', { line: 1.6, depth: 1 });
  toon(c, circle(x, y, 5), '#4a5070', { line: 1.6, depth: 1.2 });
  toon(c, ellipse(x + 28 * flip, y, 9, 4.5), '#bff8ff', { line: 1.6, depth: 1, light: '#ffffff' });
}

/** Peças de robô quebrado no chão (engrenagem e placa). */
function scrap(c, x, y, seed) {
  const r = 7 + rand(seed, 2) * 4;
  const teeth = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 ? r : r * 1.3;
    teeth.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  toon(c, poly(teeth), '#8a92a8', { line: 1.4, depth: 1 });
  fill(c, circle(x, y, r * 0.4), '#3a3f52');
  toon(c, rrect(x + 10, y + 4, 16, 9, 2), '#6a7088', { line: 1.4, depth: 1 });
}

/** Torres de vidro no topo, com janelas acesas, e o painel holográfico no meio. */
function towers(c) {
  const blocks = [[0, 120, '#2e3a66'], [124, 110, '#3a2e66'], [370, 106, '#2e4a66'], [480, 120, '#3a3466']];
  for (const [x, w, color] of blocks) {
    const h = 80 + rand(x, 31) * 18;
    toon(c, rrect(x, -20, w, h + 20, 4), color, { depth: 4 });
    gradient(c, rrect(x + 6, -10, w - 12, h, 3), '#5a7ab8', color, -10, h, 0.5, 0.1);
    for (let wy = 0; wy < h - 14; wy += 14) {
      for (let wx = x + 12; wx < x + w - 16; wx += 16) if (rand(wx, wy) > 0.35) fill(c, rrect(wx, wy, 9, 7, 1.5), rand(wx + 1, wy) > 0.5 ? '#ffe9a0' : '#9ff4ff', 0.85);
    }
  }
  // Painel holográfico flutuando entre as torres
  soft(c, rrect(232, 18, 136, 62, 10), PINK, 0.35, 14);
  toon(c, rrect(236, 22, 128, 54, 9), '#2a1c3a', { line: 2, depth: 2 });
  fill(c, rrect(244, 30, 112, 38, 6), PINK, 0.55);
  for (let i = 0; i < 4; i++) fill(c, rrect(252, 36 + i * 8, 40 + rand(i, 9) * 50, 3.4, 1.7), '#ffffff', 0.8);
  line(c, [[300, 76], [300, 100]], NEON, 3, 0.6);
}

export function drawTech(c) {
  avenue(c);
  for (const [x, y] of [[230, 300], [400, 520], [160, 660], [470, 240]]) scrap(c, x, y, x + y);
  puddle(c, roadX(400) + 40, 400, 18, 7, '#3a4a8a');
  puddle(c, 120, 600, 14, 6, '#3a4a8a');
  towers(c);
  for (const [x, y, flip] of [[52, 220, 1], [548, 320, -1], [52, 480, 1], [548, 680, -1]]) neonPost(c, x, y, flip);
  // Cabos soltos atravessando a calçada
  line(c, [[20, 380], [50, 392], [70, 386]], '#1a1d2a', 3);
  line(c, [[580, 420], [552, 432], [536, 426]], '#1a1d2a', 3);
  topFog(c, '#5a3a8a', 0.35, darken(PINK, 0.1));
  deployMarks(c);
}
