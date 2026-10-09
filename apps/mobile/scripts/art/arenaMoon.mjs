// Mundo 10, Lua: chão de poeira cinza com crateras e pegadas, módulo lunar e bandeira nas
// laterais e, no topo, o céu preto com a Terra.
import { ARENA_W, blotches, deployMarks, rand } from './arenaKit.mjs';
import { capsule, circle, darken, ellipse, fill, gradient, lighten, line, poly, rrect, soft, toon } from './ck.mjs';

const DUST = '#8e8e96';

function crater(c, x, y, r) {
  fill(c, ellipse(x, y, r, r * 0.6), darken(DUST, 0.25));
  fill(c, ellipse(x + r * 0.12, y + r * 0.1, r * 0.82, r * 0.46), darken(DUST, 0.12));
  line(c, [[x - r * 0.9, y - r * 0.1], [x - r * 0.4, y - r * 0.55], [x + r * 0.4, y - r * 0.55]], lighten(DUST, 0.3), 2);
}

function sky(c) {
  fill(c, rrect(0, -10, ARENA_W, 110, 0), '#05060c');
  for (let i = 0; i < 50; i++) fill(c, circle(rand(i, 7) * ARENA_W, rand(i, 8) * 96, 0.8 + rand(i, 9) * 1.3), '#ffffff', 0.5 + rand(i, 10) * 0.4);
  soft(c, circle(140, 46, 40), '#3a8ad8', 0.45, 12);
  toon(c, circle(140, 46, 30), '#2f6aa8', { depth: 4, light: '#7fc8ff' });
  for (const [x, y, r] of [[130, 40, 10], [150, 55, 8]]) fill(c, ellipse(x, y, r, r * 0.6), '#4fae6a');
  fill(c, poly([[0, 100], [120, 88], [260, 98], [380, 86], [520, 96], [600, 90], [600, 110], [0, 110]]), lighten(DUST, 0.1));
}

function lander(c, x, y) {
  for (const s of [-1, 1]) toon(c, capsule([x + s * 14, y + 6], [x + s * 26, y + 26], 2), '#c8ccd4', { line: 1.2, depth: 0.8 });
  toon(c, rrect(x - 18, y - 16, 36, 26, 5), '#ffc928', { depth: 2.5 });
  toon(c, rrect(x - 12, y - 30, 24, 16, 4), '#e8ecf0', { depth: 2 });
  fill(c, circle(x, y - 22, 4), '#3a6ab0');
}

function flag(c, x, y) {
  toon(c, capsule([x, y + 10], [x, y - 34], 1.4), '#c8ccd4', { line: 1, depth: 0.6 });
  // Bandeira da missão: branca com o emblema laranja
  toon(c, rrect(x, y - 34, 26, 16, 1.5), '#e8ecf0', { line: 1.2, depth: 0.8 });
  toon(c, circle(x + 13, y - 26, 5), '#ff8a1f', { line: 1, depth: 0.5 });
  line(c, [[x + 9, y - 24], [x + 13, y - 30], [x + 17, y - 24]], '#ffffff', 1.4);
}

export function drawMoon(c) {
  blotches(c, DUST, [darken(DUST, 0.08), lighten(DUST, 0.08)], 70);
  for (const [x, y, r] of [[160, 260, 40], [420, 360, 54], [240, 560, 34], [460, 640, 28], [120, 700, 22], [350, 190, 24]]) crater(c, x, y, r);
  for (let i = 0; i < 12; i++) fill(c, ellipse(260 + (i % 2) * 14, 300 + i * 30, 5, 8), darken(DUST, 0.2), 0.7);
  sky(c);
  lander(c, 36, 400);
  flag(c, 556, 330);
  for (let i = 0; i < 16; i++) toon(c, ellipse(rand(i, 41) * 560 + 20, 140 + rand(i, 42) * 620, 5 + rand(i, 43) * 6, 3 + rand(i, 44) * 3), lighten(DUST, 0.05), { line: 1, depth: 0.8 });
  gradient(c, rrect(0, 100, ARENA_W, 80, 0), '#05060c', '#05060c', 100, 180, 0.3, 0);
  deployMarks(c);
}
