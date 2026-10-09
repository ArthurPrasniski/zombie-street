// Mundo 1, Fazenda: cemitério no topo, campo de capim aberto com a estrada de terra só de
// cenário, cerca e feno nas laterais. Unidades do mundo (600 x 900).
import { blob, capsule, circle, darken, ellipse, fill, gradient, lighten, line, OUTLINE, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { ARENA_H, ARENA_W, deployMarks, puddle, rand, roadX, tree } from './arenaKit.mjs';
import { WOOD } from './props.mjs';


const GRASS = '#2c7d5b';
const GRASS_DARK = '#226a4c';
const ROAD = '#d8b07a';
const NIGHT = '#22303a';
const STONE = '#a8acb0';


function ground(c) {
  // Capim em ladrilhos de dois verdes, como as arenas do Clash
  const tile = 50;
  for (let y = 0; y < ARENA_H; y += tile) {
    for (let x = 0; x < ARENA_W; x += tile) {
      const base = (x / tile + y / tile) % 2 === 1 ? '#3a9a5c' : '#45a866';
      fill(c, rrect(x, y, tile, tile, 0), base);
      fill(c, rrect(x + 3, y + 3, tile - 6, tile - 6, 10), lighten(base, 0.06));
    }
  }
  // Trilha de terra com pedras na beira (topo claro e lado escuro)
  for (let y = 100; y < 800; y += 12) fill(c, rrect(roadX(y) - 50, y, 100, 13, 0), ROAD);
  for (let y = 104; y < 790; y += 22) {
    for (const side of [-1, 1]) {
      const x = roadX(y) + side * (52 + rand(y, side + 3) * 4);
      const r = 7 + rand(y, side + 5) * 3;
      fill(c, ellipse(x + 1.5, y + 3, r, r * 0.75), '#6a5a48');
      fill(c, ellipse(x, y, r, r * 0.7), '#a99a86');
      fill(c, ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.3), '#cfc2ae');
    }
  }
}

/** Tufos de capim, flores e pedrinhas espalhados fora da estrada. */
function details(c) {
  for (let i = 0; i < 260; i++) {
    const x = rand(i, 11) * ARENA_W;
    const y = 110 + rand(i, 12) * 690;
    if (Math.abs(x - roadX(y)) < 64) continue;
    const kind = rand(i, 13);
    if (kind < 0.62) {
      const color = rand(i, 14) < 0.5 ? GRASS_DARK : lighten(GRASS, 0.18);
      line(c, [[x - 3, y], [x - 4, y - 6]], color, 1.6);
      line(c, [[x, y], [x, y - 8]], color, 1.6);
      line(c, [[x + 3, y], [x + 4, y - 6]], color, 1.6);
    } else if (kind < 0.8) {
      fill(c, circle(x, y, 2), rand(i, 15) < 0.5 ? '#fff3c4' : '#ffd23f');
      fill(c, circle(x, y, 0.9), '#e2603a');
    } else {
      toon(c, ellipse(x, y, 4 + rand(i, 16) * 3, 2.6 + rand(i, 16) * 2), '#8d9bb0', { line: 1, depth: 1 });
    }
  }
}


function grave(c, x, y, cross, open) {
  soft(c, ellipse(x + 6, y + 6, 12, 4), SHADOW, 0.4, 2);
  if (open) {
    toon(c, ellipse(x, y + 14, 13, 7), '#4a3a2a', { line: 1.6, depth: 2 });
    fill(c, ellipse(x, y + 15, 9, 4.4), '#140f1c');
  } else toon(c, ellipse(x, y + 14, 12, 6), '#5a4634', { line: 1.4, depth: 2 });
  if (cross) {
    toon(c, rrect(x - 3, y - 18, 6, 26, 2), STONE, { line: 1.6, depth: 1.6 });
    toon(c, rrect(x - 10, y - 12, 20, 6, 2), STONE, { line: 1.6, depth: 1.6 });
  } else {
    toon(c, rrect(x - 9, y - 16, 18, 24, 8), STONE, { line: 1.6, depth: 2 });
    line(c, [[x - 4, y - 6], [x + 4, y - 6]], darken(STONE, 0.35), 1.4);
  }
}

function cemetery(c) {
  gradient(c, rrect(0, 0, ARENA_W, 115, 0), darken(NIGHT, 0.3), NIGHT, 0, 115);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 68 + (row % 2) * 30 + (rand(i, row + 20) - 0.5) * 14;
      const y = 22 + row * 30 + rand(row, i + 30) * 5;
      if (Math.abs(x - roadX(y)) < 40 && row > 0) continue;
      grave(c, x, y, rand(i, row + 40) < 0.3, rand(row, i + 50) < 0.3);
    }
  }
  // Grade de ferro com o portão arrombado na estrada
  const gate = roadX(110);
  for (const [x0, x1] of [[0, gate - 48], [gate + 48, ARENA_W]]) {
    line(c, [[x0, 104], [x1, 104]], OUTLINE, 4);
    line(c, [[x0, 112], [x1, 112]], OUTLINE, 4);
    for (let x = x0 + 4; x < x1; x += 9) {
      line(c, [[x, 98], [x, 116]], OUTLINE, 3.4);
      line(c, [[x, 98], [x, 116]], '#626a72', 1.4);
      fill(c, poly([[x - 2.6, 99], [x, 94], [x + 2.6, 99]]), '#626a72');
    }
  }
  // Névoa verde tóxica descendo do cemitério
  gradient(c, rrect(0, 0, ARENA_W, 200, 0), '#5fae3a', '#5fae3a', 0, 200, 0.32, 0);
  for (let i = 0; i < 9; i++) soft(c, ellipse(rand(i, 60) * ARENA_W, 120 + rand(i, 61) * 50, 70, 16), '#c8f07a', 0.14, 12);
}


function hayBale(c, x, y) {
  soft(c, ellipse(x + 5, y + 8, 16, 6), SHADOW, 0.35, 3);
  toon(c, rrect(x - 15, y - 10, 30, 20, 9), '#e2b84f', { line: 2, depth: 3 });
  for (const dx of [-7, 0, 7]) line(c, [[x + dx, y - 8], [x + dx, y + 8]], '#b38a2a', 1.2);
}

function sideFence(c, x) {
  line(c, [[x, 130], [x, 760]], OUTLINE, 5);
  line(c, [[x, 130], [x, 760]], WOOD, 2.4);
  for (let y = 136; y < 760; y += 34) toon(c, circle(x, y, 4), darken(WOOD, 0.1), { line: 1.6, depth: 1 });
}


export function drawFarm(c) {
  ground(c);
  details(c);
  puddle(c, roadX(300) - 18, 300, 16, 7);
  puddle(c, 140, 560, 22, 9);
  puddle(c, roadX(650) + 22, 650, 12, 5);
  for (const [x, y, r] of [[roadX(200) + 10, 200, 9], [420, 380, 6], [190, 270, 5], [roadX(520) - 12, 520, 7]]) {
    fill(c, blob([[x - r, y], [x, y - r * 0.7], [x + r * 1.2, y - r * 0.2], [x + r * 0.4, y + r * 0.7], [x - r * 0.6, y + r * 0.5]]), '#a8263a', 0.75);
  }
  cemetery(c);
  sideFence(c, 566);
  for (const [x, y] of [[588, 200], [586, 420], [590, 640]]) hayBale(c, x, y);
  for (const [x, y, r] of [[-6, 170, 34], [4, 380, 26], [-10, 660, 38], [14, 520, 16], [606, 300, 30], [610, 730, 34]]) tree(c, x, y, r);
  deployMarks(c);
}
