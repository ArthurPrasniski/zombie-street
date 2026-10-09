// Base vista de cima (480 x 108 px = mundo 600 x 135, a partir de y = 765): muro de sacos de
// areia na largura toda, caminhonete de ré com a metralhadora na caçamba e o acampamento no pátio.
import { dithered, fbm } from './background.mjs';
import { hash, hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { SAND, sand, wood } from './props.mjs';
import { v } from './rig.mjs';

export const BASE_W = 480;
export const BASE_H = 108;
const WALL_Y = 10; // y ≈ 780 no mundo (frente do muro)
const GUN = v(240, 28); // boca da metralhadora: (300, 800) no mundo

const RUST = [hex('#1d0d08'), hex('#3d1c10'), hex('#6a3219'), hex('#8f4a26'), hex('#b0683a')];
const TRUCK = [hex('#0f1612'), hex('#1f2e25'), hex('#33493a'), hex('#4b6650'), hex('#69866c')];
const GLASS = [hex('#10161c'), hex('#1e2c38'), hex('#34495a'), hex('#57728a'), hex('#8fb0c4')];
const CANVAS = [hex('#1e2116'), hex('#343a24'), hex('#4b5434'), hex('#646e45'), hex('#7f8a58')];
const YARD = ['#1f1814', '#2a211a', '#352a20', '#413327', '#4e3d2e'].map((c) => hex(c));

const flat = (ramp, part, extra = {}) => ({ ramp, part, edge: 1, noise: 0.08, ...extra });
const TOP = [-0.3, -0.4, 1]; // superfície de cima, iluminada
const FACE = [0, 0.9, 0.4]; // face virada para a câmera, na sombra
const rectPts = (x0, y0, x1, y1) => [v(x0, y0), v(x1, y0), v(x1, y1), v(x0, y1)];
const box = (c, x0, y0, x1, y1, mat, normal = TOP) => c.polygon(rectPts(x0, y0, x1, y1), mat, normal);

function yard(c) {
  for (let y = WALL_Y + 16; y < BASE_H; y++) {
    for (let x = 0; x < BASE_W; x++) {
      const t = 0.45 + (fbm(x / 20, y / 20, 201) - 0.5) * 0.7 - (y < WALL_Y + 22 ? 0.25 : 0);
      c.put(x, y, dithered(YARD, t, x, y));
    }
  }
}

/** Uma camada contínua de sacos; `gap` decide quais faltam. */
function bagRow(c, y, offset, k, shift, gap) {
  for (let i = 0; i * 13 + offset < BASE_W + 8; i++) {
    const x = i * 13 + offset;
    if (gap(i)) continue;
    c.capsule(v(x - 3 * k, y), v(x + 3 * k, y), 3.6 * k, 3.6 * k, sand({ shift, seed: i }));
    c.line(Math.round(x - 2), Math.round(y - 1), Math.round(x + 2), Math.round(y - 1), SAND[1], 'sand');
    c.line(Math.round(x + 6 * k), Math.round(y - 2), Math.round(x + 6 * k), Math.round(y + 2), SAND[0], 'sand');
  }
}

function wall(c, damage) {
  const missing = (row, chance) => (i) => damage >= 2 && hash(i, row, 211) < chance * (damage - 1);
  bagRow(c, WALL_Y + 16, 6, 1, -2, missing(3, 0.1));
  bagRow(c, WALL_Y + 10, 0, 1, -1, missing(2, 0.25));
  bagRow(c, WALL_Y + 4, 6, 1, 0, missing(1, 0.35));
  // Estacas de madeira viradas para os zumbis
  for (let x = 14; x < BASE_W; x += 38) {
    if (damage >= 2 && hash(x, 5, 213) < 0.5) continue;
    c.capsule(v(x, WALL_Y + 4), v(x - 3, WALL_Y - 7), 1.4, 0.6, wood());
    c.capsule(v(x + 6, WALL_Y + 4), v(x + 9, WALL_Y - 7), 1.4, 0.6, wood());
  }
  if (damage >= 1) {
    for (let i = 0; i < 160 * damage; i++) {
      const x = Math.floor(hash(i, damage, 215) * BASE_W);
      const y = WALL_Y - 2 + Math.floor(hash(damage, i, 217) * 20);
      if (c.filled(x, y)) c.put(x, y, hash(i, i, 219) < 0.5 ? P.outline : SAND[0], 0, 'crack');
    }
  }
}

function wheel(c, x, y) {
  box(c, x - 3, y - 6, x + 3, y + 6, flat(P.charcoal, 'tire'), FACE);
}

function truck(c, damage) {
  const burnt = damage >= 3;
  const body = flat(burnt ? P.charcoal : TRUCK, 'truck', { noise: damage >= 2 ? 0.25 : 0.06, edge: 2 });
  for (const y of [44, 88]) for (const s of [-1, 1]) wheel(c, 240 + s * 21, y);
  // Caçamba (perto do muro): borda clara e fundo mais escuro
  box(c, 220, 30, 260, 64, body);
  box(c, 224, 33, 256, 62, { ...body, shift: -2, edge: 0 });
  // Cabine: teto, para-brisa virado para a câmera, capô e grade com faróis
  box(c, 222, 64, 258, 80, { ...body, shift: 1 });
  box(c, 223, 80, 257, 85, flat(GLASS, 'glass'), FACE);
  box(c, 221, 85, 259, 99, body);
  box(c, 221, 99, 259, 104, { ...body, shift: -1 }, FACE);
  for (const x of [225, 253]) box(c, x - 2, 100, x + 2, 102, flat([hex('#6b5a2a'), hex('#c8b25a'), hex('#f0e2a0')], 'light', { edge: 0 }));
  c.line(232, 101, 248, 101, P.outline, 'grill');
  // Metralhadora no tripé, com escudo e caixa de munição
  c.ellipse(240, 52, 6, 4, flat(P.metal, 'mount'));
  box(c, 231, 43, 249, 46, flat(P.steel, 'shield'));
  box(c, 231, 46, 249, 48, flat(P.steel, 'shield', { shift: -2 }), FACE);
  c.capsule(v(240, 56), v(240, 42), 2.8, 2.2, flat(P.metal, 'gun', { edge: 0 }));
  c.capsule(v(240, 43), v(GUN.x, GUN.y), 1.6, 1.3, flat(P.metal, 'gun', { shift: 1, edge: 0 }));
  box(c, 238, GUN.y - 1, 242, GUN.y + 2, flat(P.metal, 'gun'));
  box(c, 245, 52, 252, 58, flat(P.olive, 'ammo'));
  if (burnt) fire(c, 240, 70, 26, 221);
}

function fire(c, cx, cy, r, seed) {
  for (let i = 0; i < r * 5; i++) {
    const a = hash(i, 1, seed) * Math.PI * 2;
    const d = hash(i, 2, seed) * r;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.7;
    c.put(x, y, P.flash[Math.floor(hash(i, 3, seed) * 4)], 3, 'fire');
    if (hash(i, 4, seed) < 0.4) c.put(x, y - 1, P.flash[1], 3, 'fire');
  }
}

/** Barraca de lona (cumeeira vertical), aberta para a câmera. */
function tent(c, x, y, damage) {
  if (damage >= 3) {
    c.polygon([v(x - 22, y + 10), v(x + 20, y + 4), v(x + 24, y + 26), v(x - 18, y + 30)], flat(CANVAS, 'tent', { shift: -1, noise: 0.3 }), TOP);
    return;
  }
  c.polygon([v(x, y), v(x - 22, y + 6), v(x - 22, y + 34), v(x, y + 30)], flat(CANVAS, 'tent'), [-0.7, -0.2, 0.7]);
  c.polygon([v(x, y), v(x + 22, y + 6), v(x + 22, y + 34), v(x, y + 30)], flat(CANVAS, 'tent', { shift: -1 }), [0.7, -0.2, 0.7]);
  c.polygon([v(x - 8, y + 33), v(x, y + 24), v(x + 8, y + 33)], flat([hex('#0b0a08'), hex('#15120e')], 'door'), FACE);
  c.line(x, y, x, y + 30, CANVAS[4], 'tent');
}

function campfire(c, x, y, damage) {
  for (let a = 0; a < 6.28; a += 0.8) c.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 4, 1.6, 1.3, flat(P.bone.slice(0, 3), 'rock'));
  c.capsule(v(x - 4, y + 1), v(x + 4, y - 1), 1.2, 1.2, wood());
  if (damage < 3) fire(c, x, y, 4, 223);
}

function barrel(c, x, y, burnt) {
  c.ellipse(x, y, 6, 5, flat(burnt ? P.charcoal : RUST, 'barrel', { edge: 2 }));
  c.ellipse(x, y, 4, 3, flat(burnt ? P.charcoal : RUST, 'barrel', { shift: -1, edge: 0 }));
  c.put(x + 1, y - 1, P.metal[1], 1, 'barrel');
}

function crate(c, x, y) {
  box(c, x - 7, y - 7, x + 7, y + 4, wood({ shift: 1 }));
  box(c, x - 7, y + 4, x + 7, y + 8, wood({ shift: -1 }), FACE);
  c.line(x - 6, y - 6, x + 6, y + 3, P.wood[1], 'wood');
}

/** Holofote no poste, apontado para o campo. */
function floodlight(c, x, y, damage) {
  c.capsule(v(x, y + 22), v(x, y), 1.4, 1.2, flat(P.metal, 'pole'));
  box(c, x - 5, y - 4, x + 5, y + 1, flat(P.steel, 'lamp'));
  if (damage < 2) box(c, x - 4, y - 5, x + 4, y - 4, flat([hex('#f8f0c0'), hex('#fffbe6')], 'bulb', { edge: 0 }));
}

export function drawBase(damage) {
  const c = new PixelCanvas(BASE_W, BASE_H);
  yard(c);
  const things = new PixelCanvas(BASE_W, BASE_H);
  tent(things, 96, 46, damage);
  campfire(things, 158, 88, damage);
  for (const [x, y] of [[34, 52], [46, 74], [190, 44]]) crate(things, x, y);
  for (const [x, y] of [[312, 50], [326, 58], [314, 70], [404, 82]]) barrel(things, x, y, damage >= 3);
  for (const [x, y] of [[372, 90], [388, 90], [380, 80]]) crate(things, x, y);
  floodlight(things, 446, 50, damage);
  floodlight(things, 22, 90, damage);
  truck(things, damage);
  things.outline(P.outline);
  // Sombras para baixo e para a direita (luz no alto à esquerda)
  for (let y = 0; y < BASE_H; y++) {
    for (let x = 0; x < BASE_W; x++) if (things.filled(x - 3, y - 3) && !things.filled(x, y)) c.put(x, y, hex('#000000', 90));
  }
  c.blit(things, 0, 0);
  const front = new PixelCanvas(BASE_W, BASE_H);
  wall(front, damage);
  front.outline(P.outline);
  c.blit(front, 0, 0);
  return c;
}
