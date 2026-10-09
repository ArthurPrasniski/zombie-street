// Mundo 7, Laboratório: piso de ladrilhos brancos com faixas verde-água, poças de gosma verde,
// cacos de vidro e papéis; bancadas nas laterais e, no topo, tubos de contenção (um quebrado).
import { ARENA_H, ARENA_W, clashTiles, deployMarks, puddle, rand, topFog } from './arenaKit.mjs';
import { circle, darken, fill, line, moved, poly, rrect, soft, toon } from './ck.mjs';

const TILE = '#d9dee3';
const TEAL = '#2fae9a';
const GOO = '#9be04a';

function floor(c) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), TILE);
  clashTiles(c, 1.4);
  for (let y = 100; y < 800; y += 25) line(c, [[0, y], [ARENA_W, y]], '#b8c0c8', 1);
  for (let x = 0; x < ARENA_W; x += 25) line(c, [[x, 100], [x, 790]], '#b8c0c8', 1);
  // Faixas guia no piso e listras de perigo na frente do muro
  for (const x of [70, 530]) fill(c, rrect(x - 5, 100, 10, 690, 3), TEAL, 0.7);
  for (let x = 0; x < ARENA_W; x += 30) fill(c, poly([[x, 772], [x + 15, 772], [x + 5, 786], [x - 10, 786]]), '#ffc928', 0.8);
}

function litter(c) {
  for (let i = 0; i < 14; i++) {
    const x = 90 + rand(i, 41) * 420;
    const y = 140 + rand(i, 42) * 600;
    fill(c, moved(rrect(x, y, 14, 18, 1.5), { rot: rand(i, 43) * 60 - 30, px: x, py: y }), '#ffffff', 0.9);
    line(c, [[x + 3, y + 5], [x + 11, y + 5]], '#9aa3b8', 1);
  }
  for (let i = 0; i < 18; i++) {
    const x = 90 + rand(i, 51) * 420;
    const y = 140 + rand(i, 52) * 620;
    fill(c, poly([[x, y], [x + 6, y + 2], [x + 2, y + 7]]), '#bfe6ff', 0.9);
  }
}

/** Bancada vista de cima, com frascos. */
function bench(c, x, y) {
  soft(c, rrect(x - 18, y - 30, 40, 70, 6), '#0c0b0f', 0.25, 5);
  toon(c, rrect(x - 20, y - 34, 40, 68, 6), '#e8ecf0', { depth: 2.5 });
  for (const [dx, dy, color] of [[-8, -20, GOO], [6, -6, '#ff7a86'], [-6, 10, '#7fc8ff'], [8, 22, GOO]]) toon(c, circle(x + dx, y + dy, 5), color, { line: 1.4, depth: 1, light: '#ffffff' });
}

/** Tubos de contenção no topo (um quebrado, vazando) e o painel de controle. */
function tubes(c) {
  fill(c, rrect(0, -10, ARENA_W, 106, 0), '#c8d0d8');
  fill(c, rrect(0, 86, ARENA_W, 10, 0), darken('#c8d0d8', 0.25));
  for (const [x, broken] of [[70, false], [190, true], [410, false], [530, false]]) {
    toon(c, rrect(x - 28, 4, 56, 80, 26), '#9fd8e8', { depth: 3, light: '#e8fbff' });
    fill(c, rrect(x - 22, broken ? 50 : 26, 44, broken ? 30 : 54, 20), GOO, 0.7);
    toon(c, rrect(x - 30, -4, 60, 12, 4), '#7a8296', { line: 1.6, depth: 1.5 });
    if (broken) for (const [dx, dy] of [[-14, 30], [10, 18], [16, 40]]) fill(c, poly([[x + dx, 4 + dy], [x + dx + 8, 10 + dy], [x + dx - 2, 16 + dy]]), '#e8fbff');
  }
  toon(c, rrect(262, 20, 76, 50, 6), '#3a3f52', { depth: 2 });
  for (let i = 0; i < 3; i++) fill(c, rrect(270, 28 + i * 13, 60, 8, 2), i === 1 ? '#ff4f4f' : TEAL, 0.9);
  // Placa de risco biológico
  toon(c, poly([[300, 2], [314, 18], [286, 18]]), '#ffc928', { line: 1.6, depth: 1 });
}

export function drawLab(c) {
  floor(c);
  litter(c);
  puddle(c, 190, 170, 34, 14, GOO);
  puddle(c, 330, 430, 22, 9, GOO);
  puddle(c, 460, 650, 18, 8, GOO);
  for (const [x, y] of [[34, 250], [566, 380], [34, 560], [566, 680]]) bench(c, x, y);
  for (const [x, y] of [[110, 720], [500, 200]]) {
    toon(c, circle(x, y, 13), '#ffc928', { depth: 2 });
    fill(c, circle(x, y, 5), '#2a2533');
  }
  tubes(c);
  for (let i = 0; i < 5; i++) line(c, [[190 + i * 3, 86], [186 + i * 6, 120 + i * 9]], GOO, 3, 0.7);
  topFog(c, '#6aa86a', 0.3, '#d8ffb8');
  deployMarks(c);
}
