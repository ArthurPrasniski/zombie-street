// Ícones da interface da expansão (estrelas, ajustes, oficina, bestiário, conquistas,
// sobrevivência e evolução), numa caixa de 100 x 100 unidades.
import { capsule, circle, darken, ellipse, fill, line, minus, OUTLINE, poly, rrect, toon, union } from './ck.mjs';
import { radio } from './story.mjs';

const GOLD = '#ffc93c';
const LIME = '#b8e835';

/** Estrela de 5 pontas centrada em (x, y). */
function starPath(x, y, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? inner : outer;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  return poly(pts);
}

const star = (c) => {
  toon(c, starPath(50, 54, 44, 21), GOLD, { line: 4.5, depth: 7, light: '#fff1a8' });
  fill(c, ellipse(40, 42, 6, 4), '#ffffff', 0.6);
};
const starEmpty = (c) => toon(c, starPath(50, 54, 44, 21), '#3a3644', { line: 4.5, depth: 5, noLight: true });

function gear(c) {
  const teeth = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    teeth.push(rrect(50 + Math.cos(a) * 34 - 9, 50 + Math.sin(a) * 34 - 9, 18, 18, 4));
  }
  toon(c, minus(union(circle(50, 50, 32), ...teeth), circle(50, 50, 12)), '#c8ccd8', { line: 4, depth: 6 });
}

/** Seta de melhoria (carta que pode subir de nível). */
function up(c) {
  toon(c, circle(50, 50, 44), LIME, { line: 4, depth: 6 });
  toon(c, poly([[50, 16], [80, 50], [62, 50], [62, 82], [38, 82], [38, 50], [20, 50]]), '#ffffff', { line: 4, depth: 3, noLight: true });
}

function wrench(c) {
  const head = minus(circle(30, 30, 22), union(rrect(22, 0, 16, 30, 3), circle(30, 30, 8)));
  toon(c, union(head, capsule([38, 38], [80, 80], 10)), '#b9c0d4', { line: 4, depth: 6 });
  toon(c, circle(78, 78, 4), darken('#b9c0d4', 0.4), { line: 2, depth: 1, noLight: true });
}

/** Chapa de blindagem (Lataria). */
function shield(c) {
  toon(c, poly([[50, 8], [86, 20], [82, 56], [50, 92], [18, 56], [14, 20]]), '#8a9ab8', { line: 4, depth: 7 });
  for (const [x, y] of [[30, 26], [70, 26], [50, 70]]) toon(c, circle(x, y, 4), '#d8dce8', { line: 2, depth: 1 });
}

/** Bala (Metralhadora). */
function bullet(c) {
  toon(c, rrect(32, 50, 36, 40, 4), '#d8a040', { line: 4, depth: 5 });
  toon(c, union(rrect(32, 36, 36, 18, 2), ellipse(50, 36, 18, 28)), '#c8ccd8', { line: 4, depth: 5 });
  line(c, [[32, 58], [68, 58]], darken('#d8a040', 0.4), 3);
}

/** Livro do Bestiário: capa com a marca de garra. */
function book(c) {
  toon(c, rrect(16, 12, 68, 78, 8), '#7a3a2a', { line: 4, depth: 7 });
  fill(c, rrect(22, 80, 60, 8, 3), '#f4f1ea');
  for (const dx of [-12, 0, 12]) line(c, [[48 + dx, 26], [40 + dx, 66]], '#ff7a86', 5);
}

function trophy(c) {
  toon(c, rrect(30, 78, 40, 12, 4), '#7a5a3a', { line: 4, depth: 3 });
  toon(c, rrect(44, 60, 12, 20, 3), GOLD, { line: 4, depth: 2 });
  for (const x of [20, 80]) toon(c, ellipse(x, 34, 12, 14), GOLD, { line: 4, depth: 3, noLight: true });
  toon(c, poly([[24, 12], [76, 12], [72, 44], [60, 62], [40, 62], [28, 44]]), GOLD, { line: 4, depth: 7, light: '#fff1a8' });
  fill(c, ellipse(40, 26, 5, 9), '#ffffff', 0.5);
}

function hourglass(c) {
  for (const y of [10, 82]) toon(c, rrect(20, y, 60, 10, 4), '#7a5a3a', { line: 4, depth: 2 });
  toon(c, poly([[26, 20], [74, 20], [56, 50], [74, 82], [26, 82], [44, 50]]), '#d8eef8', { line: 4, depth: 3, noLight: true });
  fill(c, poly([[34, 30], [66, 30], [50, 48]]), '#d8263a');
  fill(c, poly([[34, 80], [66, 80], [50, 64]]), '#d8263a');
}

/** Evolução: duas setas para cima, roxas. */
function evo(c) {
  toon(c, circle(50, 50, 44), '#8a4ad8', { line: 4, depth: 6, light: '#c8a0ff' });
  for (const y of [22, 46]) line(c, [[30, y + 22], [50, y], [70, y + 22]], OUTLINE, 15);
  for (const y of [22, 46]) line(c, [[30, y + 22], [50, y], [70, y + 22]], '#ffffff', 8);
}

export const MORE_UI_ICONS = { star, starEmpty, gear, up, wrench, shield, bullet, book, trophy, hourglass, evo, radio };
