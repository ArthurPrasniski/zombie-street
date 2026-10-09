// Barricada (carta) e peças reaproveitadas pela base: madeira, sacos de areia.
import { ERASE, hash, hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { v } from './rig.mjs';

export const SAND = [hex('#2a2016'), hex('#4f3f2a'), hex('#7a6444'), hex('#a08661'), hex('#c4a97f')];

export const wood = (extra = {}) => ({ ramp: P.wood, part: 'wood', edge: 1, noise: 0.08, ...extra });
export const sand = (extra = {}) => ({ ramp: SAND, part: 'sand', edge: 2, noise: 0.1, ...extra });

/** Tábua entre dois pontos, com pregos nas pontas. */
function plank(c, a, b, w = 1.8, broken = false) {
  const end = broken ? v(a.x + (b.x - a.x) * 0.55, a.y + (b.y - a.y) * 0.55) : b;
  c.capsule(a, end, w, w * 0.9, wood());
  c.put(a.x, a.y, P.metal[3], 3, 'nail');
  if (!broken) c.put(b.x, b.y, P.metal[3], 3, 'nail');
}

export function sandbag(c, x, y, k = 1) {
  c.capsule(v(x - 4 * k, y), v(x + 4 * k, y), 2.6 * k, 2.6 * k, sand());
  c.line(Math.round(x - 1), Math.round(y - 1), Math.round(x + 1), Math.round(y - 1), SAND[1], 'sand');
}

function barbedWire(c, x0, x1, y) {
  for (let x = x0; x <= x1; x += 4) {
    c.ellipse(x, y, 2.6, 2, { ramp: P.steel, part: 'wire', edge: 0, dither: 0 });
    c.ellipse(x, y, 1.4, 0.9, { ramp: [ERASE], part: 'wire' });
  }
}

/** Barricada em 3 estados de dano (0 = inteira) e escombros. */
export function barricade(damage) {
  const c = new PixelCanvas(64, 64);
  if (damage >= 3) {
    for (let i = 0; i < 6; i++) plank(c, v(16 + i * 5, 60 - (i % 2) * 2), v(24 + i * 5, 58 + (i % 3)), 1.5);
    sandbag(c, 26, 59);
    sandbag(c, 36, 60);
    c.outline(P.outline);
    return c;
  }
  // Postes, tábuas cruzadas, arame farpado e sacos de areia na base
  plank(c, v(18, 61), v(18, 30), 2.2);
  plank(c, v(46, 61), v(46, 30), 2.2);
  const boards = [[v(16, 36), v(48, 36)], [v(16, 44), v(48, 44)], [v(16, 52), v(48, 52)], [v(17, 33), v(47, 56)], [v(17, 56), v(47, 33)]];
  boards.forEach(([a, b], i) => {
    if (damage >= 2 && i % 2 === 0) return;
    plank(c, a, b, 1.9, damage >= 1 && i === 3);
  });
  if (damage < 2) barbedWire(c, 16, 48, 28);
  for (let i = 0; i < 4; i++) sandbag(c, 20 + i * 8, 59);
  if (damage >= 1) {
    for (let i = 0; i < 18; i++) {
      const x = 18 + Math.floor(hash(i, damage, 3) * 30);
      const y = 32 + Math.floor(hash(damage, i, 5) * 24);
      if (c.filled(x, y)) c.put(x, y, P.outline, 0, 'crack');
    }
  }
  c.outline(P.outline);
  return c;
}
