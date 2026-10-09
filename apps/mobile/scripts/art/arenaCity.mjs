// Mundo 2, Cidade em ruínas: rua de asfalto rachada com faixas, calçadas nas laterais, carros
// batidos e postes; no topo, telhados de prédios e uma barreira de carros. Unidades do mundo.
import { ARENA_H, ARENA_W, clashTiles, deployMarks, puddle, rand, roadX, topFog, wreck } from './arenaKit.mjs';
import { capsule, circle, darken, ellipse, fill, line, rrect, soft, toon } from './ck.mjs';

const ASPHALT = '#4b4b55';
const SIDEWALK = '#8d8a86';
const CURB = '#b8b4ae';

function street(c) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), ASPHALT);
  clashTiles(c, 0.8);
  for (let i = 0; i < 40; i++) fill(c, ellipse(rand(i, 3) * ARENA_W, 110 + rand(i, 4) * 680, 20 + rand(i, 5) * 30, 10 + rand(i, 6) * 14), i % 2 ? '#55555f' : '#43434c', 0.7);
  // Calçadas com juntas e meio-fio
  for (const [x0, w, curb] of [[0, 64, 64], [536, 64, 536]]) {
    fill(c, rrect(x0, 100, w, 690, 0), SIDEWALK);
    for (let y = 120; y < 790; y += 32) line(c, [[x0, y], [x0 + w, y]], darken(SIDEWALK, 0.2), 1.4);
    line(c, [[curb, 100], [curb, 790]], CURB, 5);
  }
  // Faixa central amarela e faixas brancas tracejadas
  for (let y = 110; y < 790; y += 40) {
    fill(c, rrect(roadX(y) - 3, y, 6, 22, 2), '#e8c84a');
    for (const x of [180, 420]) fill(c, rrect(x - 2.5, y + 8, 5, 18, 2), '#e8e8ec', 0.7);
  }
}

function cracks(c) {
  for (let i = 0; i < 16; i++) {
    const x = 80 + rand(i, 11) * 440;
    const y = 140 + rand(i, 12) * 620;
    const pts = [[x, y]];
    for (let k = 1; k < 5; k++) pts.push([pts[k - 1][0] + (rand(i, k + 13) - 0.5) * 26, pts[k - 1][1] + 8 + rand(k, i) * 10]);
    line(c, pts, '#2a2a30', 1.6);
  }
  for (const [x, y] of [[230, 350], [380, 610]]) {
    toon(c, circle(x, y, 13), '#5a5a64', { line: 1.6, depth: 1.5 });
    for (const d of [-6, 0, 6]) line(c, [[x - 9, y + d], [x + 9, y + d]], '#3a3a42', 1.4);
  }
  for (let i = 0; i < 26; i++) fill(c, rrect(70 + rand(i, 21) * 460, 120 + rand(i, 22) * 650, 3 + rand(i, 23) * 5, 2 + rand(i, 24) * 4, 1), '#77737a');
  for (const [x, y, r] of [[340, 260, 14], [150, 520, 18]]) fill(c, ellipse(x, y, r, r * 0.6), '#25252c', 0.6);
}

function streetLight(c, x, y, flip) {
  soft(c, ellipse(x + 30 * flip, y + 4, 40, 16), '#ffe9a0', 0.12, 12);
  toon(c, capsule([x, y], [x + 26 * flip, y], 2.4), '#3a3a44', { line: 1.6, depth: 1 });
  toon(c, circle(x, y, 5), '#3a3a44', { line: 1.6, depth: 1.2 });
  toon(c, ellipse(x + 30 * flip, y, 8, 5), '#fff1a8', { line: 1.6, depth: 1 });
}

/** Telhados dos prédios no topo, com caixas d'água e ar-condicionado, e a barreira de carros. */
function rooftops(c) {
  const roofs = [[0, 130, '#5a4e58'], [130, 120, '#4e5a62'], [370, 110, '#5e5248'], [480, 120, '#4a5058']];
  for (const [x, w, color] of roofs) {
    const h = 70 + rand(x, 31) * 20;
    toon(c, rrect(x, -20, w, h + 20, 4), color, { depth: 4 });
    fill(c, rrect(x + 8, -10, w - 16, h + 2, 3), darken(color, 0.15));
    toon(c, rrect(x + 16, 14, 26, 18, 3), '#9aa3b8', { line: 1.6, depth: 1.5 });
    toon(c, circle(x + w - 28, 30, 11), '#8a6e4a', { line: 1.6, depth: 2 });
  }
  wreck(c, 200, 120, 80, '#c8443a');
  wreck(c, 420, 118, -76, '#3a6ab0');
}

export function drawCity(c) {
  street(c);
  cracks(c);
  puddle(c, roadX(420) - 30, 420, 18, 7, '#4a5a6a');
  puddle(c, 470, 700, 14, 6, '#4a5a6a');
  rooftops(c);
  wreck(c, 34, 330, 8, '#7a5a3a');
  wreck(c, 566, 560, -10, '#4a7a5a');
  wreck(c, 30, 640, -14, '#8a8a92');
  for (const [x, y, flip] of [[52, 220, 1], [548, 300, -1], [52, 470, 1], [548, 690, -1]]) streetLight(c, x, y, flip);
  for (let i = 0; i < 4; i++) toon(c, rrect(70 + i * 22, 760, 18, 10, 3), '#e8743a', { line: 1.4, depth: 1 });
  topFog(c, '#7a8a6a', 0.3, '#c8d8b8');
  deployMarks(c);
}
