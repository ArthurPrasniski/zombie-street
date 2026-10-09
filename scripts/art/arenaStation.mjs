// Mundo 9, Estação Orbital: piso de placas de metal com rebites e faixas, painéis e caixas nas
// laterais e, no topo, a grande janela com as estrelas e a Terra.
import { ARENA_H, ARENA_W, clashTiles, deployMarks, rand } from './arenaKit.mjs';
import { circle, clipped, darken, ellipse, fill, gradient, line, rrect, soft, toon } from './ck.mjs';

const PLATE = '#5a6070';
const CYAN = '#3ee8ff';

function plates(c) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), PLATE);
  clashTiles(c, 1.2);
  for (let y = 100; y < 800; y += 50) {
    for (let x = 0; x < ARENA_W; x += 100) {
      const off = (y / 50) % 2 ? 50 : 0;
      line(c, [[x + off, y], [x + off, y + 50]], darken(PLATE, 0.3), 1.6);
      for (const [dx, dy] of [[6, 6], [94, 6], [6, 44], [94, 44]]) fill(c, circle(x + off + dx - 50, y + dy, 1.6), darken(PLATE, 0.35));
    }
    line(c, [[0, y], [ARENA_W, y]], darken(PLATE, 0.3), 1.6);
  }
  for (const x of [80, 520]) fill(c, rrect(x - 4, 100, 8, 690, 3), '#ffc928', 0.55);
  fill(c, rrect(296, 100, 8, 690, 3), CYAN, 0.35);
}

/** Janela para o espaço no topo: estrelas, a curva da Terra e a moldura. */
function window_(c) {
  const glass = rrect(0, -10, ARENA_W, 108, 0);
  fill(c, glass, '#06070f');
  // Estrelas e a curva da Terra só dentro da janela
  clipped(c, glass, () => {
    for (let i = 0; i < 60; i++) fill(c, circle(rand(i, 3) * ARENA_W, rand(i, 4) * 96, 0.8 + rand(i, 5) * 1.4), '#ffffff', 0.4 + rand(i, 6) * 0.5);
    soft(c, ellipse(420, 160, 260, 120), '#3a8ad8', 0.4, 20);
    toon(c, ellipse(420, 170, 240, 110), '#2f6aa8', { line: 2, depth: 6, light: '#7fc8ff' });
    for (const [x, y, r] of [[340, 80, 30], [470, 90, 40], [400, 70, 20]]) fill(c, ellipse(x, y, r, r * 0.4), '#4fae6a', 0.8);
  });
  for (let x = 0; x <= ARENA_W; x += 150) toon(c, rrect(x - 8, -10, 16, 110, 3), '#7a8296', { depth: 2 });
  toon(c, rrect(-10, 90, ARENA_W + 20, 12, 3), '#7a8296', { depth: 2 });
}

function consoleBox(c, x, y) {
  toon(c, rrect(x - 20, y - 26, 40, 52, 5), '#3a3f52', { depth: 2.5 });
  fill(c, rrect(x - 14, y - 20, 28, 18, 3), CYAN, 0.75);
  for (let i = 0; i < 3; i++) fill(c, circle(x - 10 + i * 10, y + 12, 3), ['#ff4f4f', '#ffc928', '#b8e835'][i]);
}

export function drawStation(c) {
  plates(c);
  for (let i = 0; i < 10; i++) fill(c, ellipse(100 + rand(i, 31) * 400, 140 + rand(i, 32) * 600, 14, 6), darken(PLATE, 0.2), 0.6);
  window_(c);
  for (const [x, y] of [[30, 260], [570, 380], [30, 560], [570, 660]]) consoleBox(c, x, y);
  for (const y of [200, 470]) line(c, [[0, y], [40, y + 10], [70, y + 6]], '#2a2f3c', 4);
  gradient(c, rrect(0, 100, ARENA_W, 120, 0), '#06070f', '#06070f', 100, 220, 0.4, 0);
  deployMarks(c);
}
