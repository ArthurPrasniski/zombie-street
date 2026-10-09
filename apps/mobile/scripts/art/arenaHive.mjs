// Mundo 12, Colmeia: chão orgânico roxo com veias, poças verdes brilhando e ovos, tentáculos
// nas laterais e, no topo, a parede de favos acesos da colmeia.
import { ARENA_W, blotches, deployMarks, puddle, rand } from './arenaKit.mjs';
import { capsule, circle, darken, fill, lighten, line, poly, soft, toon } from './ck.mjs';

const FLESH = '#4a2a4a';
const VEIN = '#c84a8a';
const GLOW = '#9be04a';

function veins(c) {
  for (let i = 0; i < 14; i++) {
    let x = rand(i, 61) * ARENA_W;
    let y = 120 + rand(i, 62) * 640;
    const pts = [[x, y]];
    for (let k = 0; k < 6; k++) {
      x += (rand(i, k + 63) - 0.5) * 70;
      y += (rand(k, i + 64) - 0.3) * 40;
      pts.push([x, y]);
    }
    line(c, pts, VEIN, 3, 0.6);
  }
}

/** Parede de favos no topo, alguns acesos com ovos dentro. */
function combs(c) {
  fill(c, poly([[0, -10], [600, -10], [600, 104], [0, 104]]), darken(FLESH, 0.3));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 12; col++) {
      const x = col * 52 + (row % 2) * 26;
      const y = 12 + row * 32;
      const hex = poly(Array.from({ length: 6 }, (_, i) => [x + Math.cos((i / 6) * Math.PI * 2) * 22, y + Math.sin((i / 6) * Math.PI * 2) * 18]));
      const lit = rand(col, row + 70) > 0.6;
      toon(c, hex, lit ? '#e8a020' : darken(FLESH, 0.1), { line: 2, depth: 2, light: lit ? '#fff1a8' : lighten(FLESH, 0.1) });
      if (lit) toon(c, circle(x, y, 7), '#f4e8c8', { line: 1, depth: 1 });
    }
  }
}

function eggs(c, x, y) {
  for (const [dx, dy, r] of [[0, 0, 9], [12, 6, 7], [-10, 8, 7]]) toon(c, circle(x + dx, y + dy, r), '#e8d8c8', { line: 1.4, depth: 1.5, light: '#ffffff' });
}

export function drawHive(c) {
  blotches(c, FLESH, [darken(FLESH, 0.12), lighten(FLESH, 0.08)], 90);
  veins(c);
  for (const [x, y, r] of [[180, 300, 22], [430, 520, 18], [300, 680, 16]]) {
    soft(c, circle(x, y, r * 1.6), GLOW, 0.25, 10);
    puddle(c, x, y, r, r * 0.45, GLOW);
  }
  for (const [x, y] of [[40, 240], [560, 360], [50, 600], [550, 690]]) eggs(c, x, y);
  for (const [x0, flip] of [[0, 1], [600, -1]]) {
    for (let i = 0; i < 3; i++) {
      const y = 160 + i * 220;
      toon(c, capsule([x0, y], [x0 + flip * 40, y + 50], 9, 3), darken(VEIN, 0.3), { line: 1.6, depth: 2 });
    }
  }
  combs(c);
  deployMarks(c);
}
