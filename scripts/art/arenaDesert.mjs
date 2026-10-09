// Mundo 4, Base no deserto: areia com ondulações, trilha de terra batida, ninhos de sacos de
// areia, arame farpado, tanque abandonado e contêineres; no topo, cerca de tela e guarita.
import { ARENA_W, blotches, clashTiles, deployMarks, rand, roadX, topFog } from './arenaKit.mjs';
import { capsule, circle, darken, ellipse, fill, line, moved, rrect, SHADOW, soft, toon } from './ck.mjs';
import { barbedWire, sandbag } from './props.mjs';

const SAND = '#d9b77a';
const TRACK = '#b8915a';

function dunes(c) {
  blotches(c, SAND, ['#cfa96a', '#e6c88e'], 61);
  clashTiles(c, 0.9);
  for (let i = 0; i < 22; i++) {
    const y = 120 + i * 30 + rand(i, 62) * 12;
    const pts = [];
    for (let x = 0; x <= ARENA_W; x += 40) pts.push([x, y + Math.sin(x / 50 + i) * 5]);
    line(c, pts, '#c9a368', 1.6, 0.6);
  }
  // Trilha de terra batida com marcas de pneu
  for (let y = 100; y < 790; y += 10) fill(c, rrect(roadX(y) - 46, y, 92, 11, 0), TRACK, 0.85);
  for (const off of [-18, 18]) {
    const pts = [];
    for (let y = 100; y <= 790; y += 20) pts.push([roadX(y) + off, y]);
    line(c, pts, darken(TRACK, 0.2), 6);
  }
}

function tank(c, x, y, rot) {
  const at = (p) => moved(p, { rot, px: x, py: y });
  soft(c, at(rrect(x - 30, y - 40, 66, 92, 10)), SHADOW, 0.35, 6);
  for (const dx of [-32, 22]) toon(c, at(rrect(x + dx, y - 46, 12, 92, 5)), '#3a3a30', { depth: 2 });
  toon(c, at(rrect(x - 22, y - 40, 44, 80, 8)), '#7a7a4a', { depth: 3 });
  toon(c, at(circle(x, y + 4, 16)), '#6a6a3e', { depth: 2.5 });
  toon(c, at(capsule([x, y + 4], [x, y - 56], 3.4)), '#5a5a36', { depth: 1 });
}

function container(c, x, y, color) {
  soft(c, rrect(x + 4, y + 6, 40, 90, 4), SHADOW, 0.35, 5);
  toon(c, rrect(x, y, 40, 90, 3), color, { depth: 3 });
  for (let k = 8; k < 90; k += 8) line(c, [[x + 4, y + k], [x + 36, y + k]], darken(color, 0.2), 1.4);
}

/** Cerca de tela no topo com o portão aberto e a guarita. */
function fence(c) {
  const gate = roadX(110);
  for (const [x0, x1] of [[0, gate - 52], [gate + 52, ARENA_W]]) {
    line(c, [[x0, 108], [x1, 108]], '#6a6e78', 3);
    for (let x = x0; x < x1; x += 10) line(c, [[x, 100], [x + 10, 116]], '#8a8e98', 1, 0.8);
    for (let x = x0 + 4; x < x1; x += 40) toon(c, circle(x, 108, 3.4), '#5a5e68', { line: 1.4, depth: 1 });
  }
  toon(c, rrect(470, 24, 70, 62, 6), '#8a6a42', { depth: 3 });
  toon(c, rrect(462, 16, 86, 22, 6), '#6a5032', { depth: 2 });
  soft(c, ellipse(420, 160, 90, 26), '#fff4c0', 0.12, 16);
}

function nest(c, x, y) {
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.15 + (i / 4) * Math.PI * 0.7;
    sandbag(c, x + Math.cos(a) * 26, y - Math.sin(a) * 18, 1.1);
  }
}

export function drawDesert(c) {
  dunes(c);
  fence(c);
  tank(c, 50, 300, 14);
  container(c, 548, 520, '#b8442a');
  container(c, 548, 620, '#3a6ab0');
  nest(c, 120, 640);
  nest(c, 470, 300);
  barbedWire(c, 20, 150, 460);
  barbedWire(c, 450, 580, 450);
  for (let i = 0; i < 14; i++) toon(c, ellipse(70 + rand(i, 71) * 460, 150 + rand(i, 72) * 600, 4 + rand(i, 73) * 4, 3 + rand(i, 74) * 2), '#a8906a', { line: 1, depth: 1 });
  for (const [x, y] of [[40, 760], [70, 770]]) toon(c, ellipse(x, y, 9, 7.5), '#3d7bd6', { depth: 2 });
  topFog(c, '#d89a5a', 0.3, '#ffe0a8');
  deployMarks(c);
}
