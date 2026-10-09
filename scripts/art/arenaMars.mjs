// Mundo 11, Marte: areia vermelha com pedras e rastros de jipe, céu salmão no topo com duas
// luas pequenas e a cúpula do posto avançado.
import { ARENA_W, blotches, deployMarks, rand } from './arenaKit.mjs';
import { circle, darken, ellipse, fill, gradient, intersect, lighten, line, poly, rrect, toon } from './ck.mjs';

const SAND = '#b8643a';

function sky(c) {
  gradient(c, rrect(0, -10, ARENA_W, 112, 0), '#e8a07a', '#c87a54', -10, 100);
  for (const [x, y, r] of [[120, 30, 8], [190, 50, 5]]) toon(c, circle(x, y, r), '#d8c8b8', { line: 1.4, depth: 1 });
  // Cúpula do posto avançado
  toon(c, intersect(circle(450, 110, 70), rrect(370, 30, 160, 80, 0)), '#bfe6ff', { depth: 4, light: '#ffffff' });
  for (const x of [400, 450, 500]) line(c, [[x, 104], [x, 48 + Math.abs(x - 450) * 0.6]], '#7a8296', 2);
  fill(c, poly([[0, 100], [90, 84], [200, 96], [320, 80], [440, 100], [600, 86], [600, 110], [0, 110]]), darken(SAND, 0.15));
}

function rock(c, x, y, r, seed) {
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * (0.75 + rand(i, seed) * 0.4);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7]);
  }
  toon(c, poly(pts), darken(SAND, 0.3), { depth: r * 0.25, light: lighten(SAND, 0.1) });
}

export function drawMars(c) {
  blotches(c, SAND, [darken(SAND, 0.1), lighten(SAND, 0.1)], 80);
  for (let i = 0; i < 8; i++) fill(c, ellipse(60 + rand(i, 51) * 480, 160 + rand(i, 52) * 600, 60, 8), lighten(SAND, 0.15), 0.4);
  for (const x of [230, 262]) for (let y = 120; y < 780; y += 18) fill(c, rrect(x + Math.sin(y / 60) * 20, y, 12, 6, 2), darken(SAND, 0.22), 0.6);
  for (const [x, y, r] of [[30, 280, 26], [570, 420, 30], [40, 620, 22], [560, 200, 18], [400, 520, 12], [140, 400, 10]]) rock(c, x, y, r, x + y);
  sky(c);
  deployMarks(c);
}
