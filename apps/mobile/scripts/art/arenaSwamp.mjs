// Mundo 3, Pântano: lama verde com poças escuras, vitórias-régias e juncos, uma passarela de
// tábuas no lugar da estrada, árvores mortas retorcidas; no topo, mata fechada e névoa verde.
import { ARENA_W, blotches, clashTiles, deployMarks, rand, roadX, topFog, tree } from './arenaKit.mjs';
import { blob, capsule, circle, darken, ellipse, fill, line, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { WOOD } from './props.mjs';

const MUD = '#3e5a36';
const WATER = '#22454a';

function pool(c, x, y, r, seed) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const k = 0.75 + rand(i, seed) * 0.45;
    pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * 0.6 * k]);
  }
  toon(c, blob(pts), WATER, { line: 1.6, depth: 4, light: '#3a6a6a' });
  for (let i = 0; i < 3; i++) {
    const px = x + (rand(i, seed + 3) - 0.5) * r;
    const py = y + (rand(i, seed + 4) - 0.5) * r * 0.5;
    toon(c, circle(px, py, 6 + rand(i, seed) * 4), '#4a8a3a', { line: 1.2, depth: 1 });
    fill(c, poly([[px, py], [px + 8, py - 3], [px + 8, py + 3]]), WATER);
  }
}

function reeds(c, x, y) {
  for (let i = 0; i < 6; i++) {
    const dx = (i - 2.5) * 3;
    line(c, [[x + dx, y], [x + dx + (i % 2 ? 2 : -2), y - 16 - (i % 3) * 3]], '#5a7a3a', 1.6);
    fill(c, ellipse(x + dx + (i % 2 ? 2 : -2), y - 18 - (i % 3) * 3, 1.6, 4), '#7a4a2a');
  }
}

/** Passarela de tábuas seguindo a trilha do meio. */
function boardwalk(c) {
  for (let y = 100; y < 790; y += 14) {
    const x = roadX(y);
    const broken = rand(y, 5) < 0.06;
    if (broken) continue;
    toon(c, rrect(x - 40 + (rand(y, 6) - 0.5) * 4, y, 80, 11, 2), rand(y, 7) < 0.5 ? WOOD : darken(WOOD, 0.12), { line: 1.4, depth: 1.2 });
  }
}

/** Árvore morta vista de cima: tronco e galhos tortos. */
function deadTree(c, x, y, r) {
  soft(c, ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.6), SHADOW, 0.3, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand(i, x) * 0.6;
    const tip = [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8];
    toon(c, capsule([x, y], tip, 3.4, 1.2), '#4a3a2a', { line: 1.4, depth: 1 });
  }
  toon(c, circle(x, y, r * 0.22), '#5a4632', { line: 1.6, depth: 1.5 });
}

export function drawSwamp(c) {
  blotches(c, MUD, ['#35502f', '#4a6a3e'], 41);
  clashTiles(c);
  for (const [x, y, r, s] of [[110, 260, 60, 1], [470, 380, 70, 2], [140, 600, 56, 3], [480, 690, 48, 4], [300, 500, 30, 5]]) pool(c, x, y, r, s);
  boardwalk(c);
  for (const [x, y] of [[60, 210], [540, 330], [70, 520], [200, 700], [520, 620], [400, 260]]) reeds(c, x, y);
  // Mata fechada no topo
  fill(c, rrect(0, 0, ARENA_W, 90, 0), '#1e2e22');
  for (let i = 0; i < 9; i++) tree(c, 20 + i * 72, 40 + (i % 2) * 30, 40, '#244a2e');
  for (const [x, y, r] of [[-4, 300, 34], [604, 460, 38], [8, 690, 30], [600, 220, 30]]) deadTree(c, x, y, r);
  // Vaga-lumes
  for (let i = 0; i < 18; i++) fill(c, circle(rand(i, 51) * ARENA_W, 130 + rand(i, 52) * 600, 1.8), '#e8ff8a', 0.8);
  topFog(c, '#4a8a3a', 0.4, '#b8e835');
  deployMarks(c);
}
