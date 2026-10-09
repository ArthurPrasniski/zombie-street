// Mundo 8, Base de Lançamento: plataforma de concreto com juntas e marcas de queimado, faixas
// amarelas e pretas; tanques de combustível nas laterais e, no topo, o foguete na torre.
import { ARENA_H, ARENA_W, clashTiles, deployMarks, rand, topFog } from './arenaKit.mjs';
import { capsule, circle, darken, ellipse, fill, line, poly, rrect, soft, toon } from './ck.mjs';

const CONCRETE = '#a8aeb4';

function pad(c) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), CONCRETE);
  clashTiles(c, 1.1);
  for (let y = 100; y < 800; y += 75) line(c, [[0, y], [ARENA_W, y]], darken(CONCRETE, 0.2), 2);
  for (let x = 0; x < ARENA_W; x += 75) line(c, [[x, 100], [x, 790]], darken(CONCRETE, 0.2), 2);
  for (let i = 0; i < 30; i++) fill(c, ellipse(rand(i, 3) * ARENA_W, 120 + rand(i, 4) * 660, 16 + rand(i, 5) * 22, 8 + rand(i, 6) * 10), darken(CONCRETE, 0.1), 0.6);
  // Faixas de perigo e o círculo da área de lançamento
  for (let x = 0; x < ARENA_W; x += 36) fill(c, poly([[x, 100], [x + 18, 100], [x + 6, 116], [x - 12, 116]]), '#2a2533');
  fill(c, rrect(0, 100, ARENA_W, 16, 0), '#ffc928', 0.55);
  line(c, [[300, 150], [300, 780]], '#ffc928', 3, 0.5);
  for (const r of [90, 140]) fill(c, ellipse(300, 210, r, r * 0.55), '#2a2533', 0.08);
  soft(c, ellipse(300, 170, 120, 50), '#2a2533', 0.35, 20);
}

function tank(c, x, y, r) {
  soft(c, circle(x + 6, y + 8, r), '#0c0b0f', 0.3, 6);
  toon(c, circle(x, y, r), '#e8ecf0', { depth: r * 0.2 });
  for (const k of [0.75, 0.45]) line(c, [[x - r * k, y - r * k * 0.2], [x + r * k, y - r * k * 0.2]], '#c8443a', 3);
  toon(c, circle(x, y, r * 0.25), '#9aa3b8', { line: 1.4, depth: 1 });
}

/** Foguete na torre de lançamento, no topo. */
function rocket(c) {
  // Torre vermelha em treliça à direita
  toon(c, rrect(352, -20, 26, 118, 3), '#c8443a', { depth: 2 });
  for (let y = -10; y < 96; y += 14) line(c, [[352, y], [378, y + 14]], darken('#c8443a', 0.4), 2);
  for (const y of [30, 70]) toon(c, rrect(318, y, 36, 6, 2), '#8a92a8', { line: 1.4, depth: 1 });
  // Corpo do foguete, aletas e janela
  for (const s of [-1, 1]) toon(c, poly([[300 + s * 22, 60], [300 + s * 40, 96], [300 + s * 22, 92]]), '#c8443a', { depth: 1.6 });
  toon(c, rrect(278, -40, 44, 134, 20), '#f4f6f8', { depth: 4 });
  toon(c, poly([[278, -10], [300, -60], [322, -10]]), '#c8443a', { depth: 2 });
  toon(c, circle(300, 22, 9), '#7fc8ff', { line: 1.8, depth: 1.5, light: '#e0f4ff' });
  fill(c, rrect(282, 50, 36, 8, 3), '#2a2533');
  soft(c, ellipse(300, 104, 50, 14), '#ffffff', 0.5, 10);
}

function cones(c) {
  for (let i = 0; i < 6; i++) {
    const x = 80 + (i % 3) * 36;
    const y = 740 - Math.floor(i / 3) * 22 + (i % 2) * 6;
    toon(c, poly([[x - 7, y + 6], [x, y - 9], [x + 7, y + 6]]), '#ff8a1f', { line: 1.4, depth: 1 });
    fill(c, rrect(x - 4, y - 2, 8, 2.5, 1), '#ffffff');
  }
}

export function drawLaunch(c) {
  pad(c);
  for (const [x, y, r] of [[36, 260, 30], [566, 360, 30], [36, 560, 26], [566, 660, 26]]) tank(c, x, y, r);
  for (const [x, y] of [[300, 260], [200, 470], [420, 620]]) {
    soft(c, ellipse(x, y, 34, 18), '#2a2533', 0.45, 6);
    fill(c, ellipse(x - 6, y - 2, 12, 6), '#4a4458', 0.6);
  }
  line(c, [[60, 300], [140, 330], [200, 420]], '#2a2533', 4, 0.8);
  line(c, [[540, 400], [470, 440], [420, 560]], '#2a2533', 4, 0.8);
  cones(c);
  rocket(c);
  for (const [x, y] of [[100, 120], [500, 120]]) {
    toon(c, capsule([x, y + 10], [x, y - 10], 2), '#4a5068', { line: 1.4, depth: 0.8 });
    soft(c, ellipse(x, y + 30, 40, 14), '#fff8d0', 0.2, 10);
    toon(c, rrect(x - 9, y - 16, 18, 8, 3), '#fff1a8', { line: 1.6, depth: 1 });
  }
  topFog(c, '#9aa0a6', 0.3, '#f4f4f0');
  deployMarks(c);
}
