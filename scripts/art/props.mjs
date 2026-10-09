// Barricada (carta) e peças de cenário reaproveitadas pela base e pela arena: tábuas, sacos de
// areia, arame farpado.
import { GROUND } from './chibi.mjs';
import { capsule, circle, darken, ellipse, fill, line, moved, OUTLINE, rrect, SHADOW, soft, toon } from './ck.mjs';

export const WOOD = '#b0703a';
export const SAND = '#d9b77a';

/** Tábua de a até b; `broken` corta pela metade com ponta lascada. */
export function plank(c, a, b, w = 3.2, broken = false) {
  const end = broken ? [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55] : b;
  const ang = (Math.atan2(end[1] - a[1], end[0] - a[0]) * 180) / Math.PI;
  const len = Math.hypot(end[0] - a[0], end[1] - a[1]);
  const board = moved(rrect(0, -w, len, w * 2, 1.2), { dx: a[0], dy: a[1], rot: ang });
  toon(c, board, WOOD, { depth: 1.2 });
  for (const p of broken ? [a] : [a, b]) fill(c, circle(p[0] + (b[0] > a[0] ? 2 : -2), p[1], 0.9), '#5a5f70');
}

/** Saco de areia visto de frente, com a costura. */
export function sandbag(c, x, y, k = 1) {
  toon(c, rrect(x - 7 * k, y - 4 * k, 14 * k, 8 * k, 4 * k), SAND, { depth: 1.6 * k });
  line(c, [[x - 3 * k, y - 1.5 * k], [x + 3 * k, y - 1.5 * k]], darken(SAND, 0.35), 0.9 * k);
}

/** Rolo de arame farpado entre x0 e x1. */
export function barbedWire(c, x0, x1, y) {
  for (let x = x0; x <= x1; x += 5) {
    line(c, [[x - 3, y - 2.5], [x + 3, y + 2.5]], OUTLINE, 2.6);
    line(c, [[x - 3, y - 2.5], [x + 3, y + 2.5]], '#b8c0d0', 1.1);
    line(c, [[x + 3, y - 2.5], [x + 7, y + 2.5]], OUTLINE, 2.6);
    line(c, [[x + 3, y - 2.5], [x + 7, y + 2.5]], '#8a93a8', 1.1);
  }
}

/** Barricada: 0 inteira, 1 e 2 avariadas, 3 escombros. */
export function barricade(c, damage) {
  soft(c, ellipse(50, GROUND, 32, 4.5), SHADOW, 0.35, 1.6);
  if (damage >= 3) {
    plank(c, [24, GROUND - 4], [52, GROUND - 7], 2.8);
    plank(c, [46, GROUND - 2], [76, GROUND - 5], 2.8);
    sandbag(c, 36, GROUND - 4, 0.9);
    sandbag(c, 62, GROUND - 3, 0.9);
    return;
  }
  // Postes, tábuas cruzadas e arame por cima
  toon(c, capsule([24, GROUND - 4], [24, GROUND - 44], 3.4), darken(WOOD, 0.15), { depth: 1.4 });
  toon(c, capsule([76, GROUND - 4], [76, GROUND - 44], 3.4), darken(WOOD, 0.15), { depth: 1.4 });
  const boards = [[[20, GROUND - 36], [80, GROUND - 36]], [[20, GROUND - 24], [80, GROUND - 24]], [[22, GROUND - 40], [78, GROUND - 12]], [[22, GROUND - 12], [78, GROUND - 40]]];
  boards.forEach(([a, b], i) => {
    if (damage >= 2 && i === 0) return;
    plank(c, a, b, 3.4, damage >= 1 && i === 2);
  });
  if (damage < 2) barbedWire(c, 22, 74, GROUND - 46);
  for (let i = 0; i < 4; i++) sandbag(c, 29 + i * 14, GROUND - 5);
  if (damage >= 1) {
    line(c, [[40, GROUND - 30], [44, GROUND - 26], [42, GROUND - 22]], OUTLINE, 1.2);
    line(c, [[60, GROUND - 20], [63, GROUND - 16]], OUTLINE, 1.2);
  }
}
