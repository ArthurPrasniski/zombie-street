// Base vista de cima, em unidades do mundo: faixa de 600 x 135 a partir de y = 765. Muro de sacos
// de areia (frente em y = 780), caminhonete de ré com a metralhadora e o acampamento no pátio.
import { capsule, circle, darken, ellipse, fill, lighten, line, OUTLINE, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { sandbag, WOOD } from './props.mjs';
import { metalWall, spaceModule, spaceYard } from './baseSpace.mjs';

export const BASE_W = 600;
export const BASE_H = 135;
export const BASE_TOP = 765;
const WALL = 15; // y = 780 no mundo
export const GUN = [300, 35]; // boca da metralhadora: (300, 800) no mundo

const TRUCK = '#e2603a';
// Chão do pátio em cada mundo: terra, asfalto, tábuas do cais, areia e neve.
const YARDS = {
  farm: '#8e6e4c', city: '#5a5a62', swamp: '#8a6a42', desert: '#c9a86a', snow: '#e4edf3', tech: '#30344a', lab: '#c8d0d8', launch: '#9aa0a6',
  station: '#4a505e', moon: '#7e7e86', mars: '#a8583a', hive: '#3a2238',
};
// Ato 3: módulo espacial e barreira de metal.
const SPACE = new Set(['station', 'moon', 'mars', 'hive']);
// Ato 2 (seção 18.2): a caminhonete ganha blindagem.
const ARMORED = new Set(['tech', 'lab', 'launch']);
const CANVAS = '#6f8a4a';

const rand = (i, s = 1) => {
  const x = Math.sin(i * 91.7 + s * 47.3) * 43758.5453;
  return x - Math.floor(x);
};

function yard(c, world) {
  const color = YARDS[world];
  fill(c, rrect(0, WALL + 10, BASE_W, BASE_H, 0), color);
  for (let i = 0; i < 30; i++) fill(c, ellipse(rand(i) * BASE_W, WALL + 22 + rand(i, 2) * 100, 10 + rand(i, 3) * 20, 4 + rand(i, 4) * 5), darken(color, 0.12), 0.6);
  // Tábuas do cais (Pântano) ou faixas de estacionamento (Cidade)
  if (world === 'swamp') for (let y = WALL + 22; y < BASE_H; y += 12) line(c, [[0, y], [BASE_W, y]], darken(color, 0.3), 1.6);
  if (world === 'city') for (let x = 40; x < BASE_W; x += 90) line(c, [[x, WALL + 34], [x, BASE_H]], '#e8e8ec', 3, 0.6);
  for (const x of [282, 318]) line(c, [[x, BASE_H], [x, WALL + 30]], darken(color, 0.2), 6);
}

/** Neve acumulada em cima do muro (Nevasca). */
function snowCaps(c) {
  for (let x = 6; x < BASE_W; x += 15) fill(c, ellipse(x, WALL + 3, 7, 2.6), '#ffffff', 0.95);
}

function wall(c, damage) {
  const gone = (row, i, chance) => damage >= 2 && rand(i, row + 9) < chance * (damage - 1);
  // Estacas viradas para os zumbis
  for (let x = 20; x < BASE_W; x += 46) {
    if (damage >= 2 && rand(x, 5) < 0.5) continue;
    toon(c, capsule([x, WALL + 8], [x - 4, WALL - 8], 2.4, 1), WOOD, { line: 1.4, depth: 1 });
    toon(c, capsule([x + 9, WALL + 8], [x + 13, WALL - 8], 2.4, 1), WOOD, { line: 1.4, depth: 1 });
  }
  for (const [row, y, off] of [[2, WALL + 22, 7], [1, WALL + 14, 0], [0, WALL + 6, 7]]) {
    for (let i = 0; i * 15 + off < BASE_W + 10; i++) if (!gone(row, i, 0.3)) sandbag(c, i * 15 + off, y, 1.05);
  }
  if (damage >= 1) {
    for (let i = 0; i < 10 * damage; i++) {
      const x = rand(i, damage + 20) * BASE_W;
      fill(c, ellipse(x, WALL + 30 + rand(i, 3) * 6, 5, 2), lighten('#d9b77a', 0.1), 0.9);
    }
  }
}

/** Placas de blindagem e grade no para-brisa (Ato 2). */
function armor(c) {
  const plate = '#8a92a8';
  for (const x of [266, 326]) toon(c, rrect(x, 44, 8, 38, 2), plate, { line: 1.4, depth: 1 });
  toon(c, rrect(276, 113, 48, 14, 3), plate, { line: 1.4, depth: 1 });
  for (const x of [284, 300, 316]) fill(c, circle(x, 120, 1.6), '#4a5068');
  for (const x of [286, 300, 314]) line(c, [[x, 104], [x, 112]], '#3a3f52', 1.8);
}

/** Caminhonete de ré com a metralhadora (também usada na Oficina); blindada no Ato 2. */
export function truck(c, damage, armored = false) {
  const body = damage >= 3 ? '#4a4458' : TRUCK;
  soft(c, rrect(270, 50, 70, 84, 10), SHADOW, 0.35, 4);
  for (const y of [58, 112]) for (const s of [-1, 1]) toon(c, rrect(300 + s * 31 - 5, y - 9, 10, 18, 4), '#2a2533', { line: 1.4, depth: 1.5 });
  // Caçamba (perto do muro), cabine, para-brisa virado para a câmera, capô e grade
  toon(c, rrect(272, 40, 56, 44, 6), body, { depth: 3 });
  fill(c, rrect(278, 46, 44, 34, 4), darken(body, 0.35));
  toon(c, rrect(274, 84, 52, 22, 6), lighten(body, 0.06), { depth: 2.4 });
  toon(c, rrect(276, 104, 48, 8, 3), '#7fc8ff', { line: 1.6, depth: 1.5, light: '#d8f2ff' });
  toon(c, rrect(272, 112, 56, 18, 6), body, { depth: 2.4 });
  for (const x of [281, 319]) toon(c, circle(x, 126, 3.2), '#fff3a8', { line: 1.2, depth: 0.8 });
  line(c, [[290, 127], [310, 127]], OUTLINE, 2);
  // Metralhadora no tripé, com escudo e caixa de munição
  toon(c, circle(300, 64, 8), '#4a5068', { depth: 2 });
  toon(c, rrect(286, 50, 28, 6, 3), '#9aa3b8', { depth: 1.4 });
  toon(c, capsule([300, 66], [300, 50], 4, 3.4), '#3a3f52', { depth: 1.4 });
  toon(c, capsule([300, 52], [GUN[0], GUN[1] + 2], 2.2, 2), '#3a3f52', { depth: 1, noLight: true });
  toon(c, rrect(306, 66, 12, 9, 2), '#5e7a3a', { depth: 1.2 });
  if (armored) armor(c);
  if (damage >= 3) fire(c, 300, 90, 26);
  else if (damage >= 2) smoke(c, 320, 90);
}

function fire(c, x, y, r) {
  for (let i = 0; i < 7; i++) {
    const fx = x + (rand(i, 30) - 0.5) * r * 1.6;
    const h = 10 + rand(i, 31) * 14;
    toon(c, poly([[fx - 6, y + 6], [fx - 3, y - h * 0.5], [fx, y - h], [fx + 4, y - h * 0.4], [fx + 6, y + 6]]), i % 2 ? '#ff8a1f' : '#ffd23f', { line: 1.4, depth: 1.5 });
  }
  smoke(c, x, y - 10);
}

function smoke(c, x, y) {
  for (let i = 0; i < 4; i++) soft(c, circle(x + i * 6 - 8, y - i * 9, 9 + i * 2), '#5a5568', 0.45, 4);
}

function tent(c, x, y, damage) {
  soft(c, ellipse(x + 8, y + 34, 32, 8), SHADOW, 0.35, 4);
  if (damage >= 3) {
    toon(c, poly([[x - 28, y + 14], [x + 26, y + 6], [x + 30, y + 30], [x - 24, y + 36]]), darken(CANVAS, 0.2), { depth: 2 });
    return;
  }
  toon(c, poly([[x, y], [x - 30, y + 8], [x - 30, y + 38], [x, y + 34]]), CANVAS, { depth: 2.4 });
  toon(c, poly([[x, y], [x + 30, y + 8], [x + 30, y + 38], [x, y + 34]]), darken(CANVAS, 0.18), { depth: 2.4 });
  toon(c, poly([[x - 10, y + 37], [x, y + 24], [x + 10, y + 37]]), OUTLINE, { line: 1.4, depth: 0.5, noLight: true });
}

function campfire(c, x, y, damage) {
  for (let a = 0; a < 6.28; a += 0.8) toon(c, ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 5, 2.8, 2.2), '#8d9bb0', { line: 1, depth: 0.8 });
  toon(c, capsule([x - 6, y + 2], [x + 6, y - 1], 2), WOOD, { line: 1, depth: 0.8 });
  if (damage < 3) {
    toon(c, poly([[x - 5, y + 2], [x - 2, y - 8], [x, y - 13], [x + 3, y - 7], [x + 5, y + 2]]), '#ff8a1f', { line: 1.2, depth: 1.2 });
    fill(c, poly([[x - 2.4, y + 1], [x, y - 7], [x + 2.4, y + 1]]), '#ffe27a');
  }
}

function barrel(c, x, y, burnt) {
  soft(c, ellipse(x + 4, y + 6, 10, 4), SHADOW, 0.35, 2);
  toon(c, ellipse(x, y, 9, 7.5), burnt ? '#4a4458' : '#3d7bd6', { depth: 2 });
  fill(c, ellipse(x, y, 6, 4.6), darken(burnt ? '#4a4458' : '#3d7bd6', 0.3));
}

function crate(c, x, y) {
  soft(c, rrect(x - 8, y - 4, 22, 16, 3), SHADOW, 0.35, 2);
  toon(c, rrect(x - 10, y - 10, 20, 16, 2.5), WOOD, { depth: 2 });
  toon(c, rrect(x - 10, y + 6, 20, 5, 2), darken(WOOD, 0.25), { line: 1.4, depth: 1 });
  line(c, [[x - 8, y - 8], [x + 8, y + 4]], darken(WOOD, 0.35), 1.4);
}

function floodlight(c, x, y, damage) {
  toon(c, capsule([x, y + 26], [x, y], 2), '#4a5068', { line: 1.4, depth: 0.8 });
  toon(c, rrect(x - 8, y - 6, 16, 8, 3), '#9aa3b8', { line: 1.6, depth: 1.2 });
  if (damage < 2) fill(c, rrect(x - 6, y - 7, 12, 3, 1.5), '#fffbe0');
}

/** Base inteira com o estado de dano (0 inteira ... 3 destruída). */
export function drawBase(c, damage, world = 'farm') {
  yard(c, world);
  if (SPACE.has(world)) {
    spaceYard(c, damage);
  } else {
    tent(c, 120, 58, damage);
    campfire(c, 196, 112, damage);
    for (const [x, y] of [[44, 66], [58, 92], [236, 58]]) crate(c, x, y);
    for (const [x, y] of [[392, 62], [410, 74], [394, 88], [506, 104]]) barrel(c, x, y, damage >= 3);
    for (const [x, y] of [[460, 110], [480, 110], [470, 96]]) crate(c, x, y);
  }
  floodlight(c, 556, 62, damage);
  floodlight(c, 28, 104, damage);
  if (SPACE.has(world)) metalWall(c, damage, WALL, rand);
  else wall(c, damage);
  if (world === 'snow') snowCaps(c);
  if (SPACE.has(world)) spaceModule(c, damage);
  else truck(c, damage, ARMORED.has(world));
}
