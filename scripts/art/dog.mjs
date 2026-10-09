// Rex, o pastor-alemão: perfil (olhando para a direita), de frente (vindo para a câmera) e de
// costas (correndo para o fundo). Caixa de 100 x 100, patas no chão em y = 94.
import { GROUND } from './chibi.mjs';
import { capsule, circle, darken, ellipse, fill, intersect, line, OUTLINE, poly, SHADOW, soft, toon } from './ck.mjs';

const TAN = '#d4934e';
const LIGHT = '#f0c48a';
const SADDLE = '#3a2a2a';
const PAW = '#2a2030';

function ears(c, x, y, spread, shade = 0) {
  for (const s of [-1, 1]) toon(c, poly([[x + s * (spread - 4), y - 4], [x + s * (spread + 1), y - 15], [x + s * (spread + 3), y - 2]]), darken(SADDLE, shade), { line: 1.6, depth: 1 });
}

function leg(c, top, foot, color) {
  toon(c, capsule(top, [foot[0], foot[1] - 2], 3.4, 2.8), color, { depth: 1.4 });
  toon(c, ellipse(foot[0] + 0.5, foot[1] - 1.5, 3.4, 2.2), PAW, { line: 1.4, depth: 0.8, noLight: true });
}

function eyes(c, pts, ko) {
  for (const [x, y] of pts) {
    if (ko) {
      line(c, [[x - 2, y - 2], [x + 2, y + 2]], OUTLINE, 1.6);
      line(c, [[x - 2, y + 2], [x + 2, y - 2]], OUTLINE, 1.6);
      continue;
    }
    fill(c, ellipse(x, y, 2.6, 3), OUTLINE);
    fill(c, circle(x - 0.7, y - 1, 1), '#ffffff');
  }
}

function mouth(c, x, y, open, w = 4) {
  if (open <= 0) {
    line(c, [[x - w * 0.6, y], [x, y + 1.2], [x + w * 0.6, y]], OUTLINE, 1.3);
    return;
  }
  toon(c, ellipse(x, y + open * 0.6, w * 0.7, 1 + open), '#7a1f30', { line: 1.2, depth: 0.6, noLight: true });
  fill(c, ellipse(x, y + open * 1.1, w * 0.4, open * 0.6), '#ff7a8a');
}

/** s: { dy (pulo), lean, tail, open (boca), legs: [traseira longe, dianteira longe, traseira perto, dianteira perto] dx } */
function side(c, s) {
  const dy = s.dy ?? 0;
  const body = ellipse(47 + (s.lean ?? 0), 72 + dy, 19, 10);
  const legDx = s.legs ?? [0, 0, 0, 0];
  soft(c, ellipse(50, GROUND, 24, 4), SHADOW, 0.35, 1.6);
  const tail = (s.tail ?? 0) * 6;
  toon(c, capsule([31, 68 + dy], [19, 58 + dy - tail], 3.2, 2.2), SADDLE, { depth: 1.2 });
  leg(c, [36, 76 + dy], [33 + legDx[0], GROUND], darken(TAN, 0.2));
  leg(c, [58, 76 + dy], [60 + legDx[1], GROUND], darken(TAN, 0.2));
  toon(c, body, TAN, { depth: 3 });
  toon(c, intersect(body, ellipse(44, 63 + dy, 18, 7)), SADDLE, { depth: 1.5, noLine: true });
  leg(c, [39, 78 + dy], [37 + legDx[2], GROUND], TAN);
  leg(c, [61, 78 + dy], [63 + legDx[3], GROUND], TAN);
  const hx = 70 + (s.lean ?? 0) * 1.5;
  const hy = 53 + dy + (s.headDy ?? 0);
  toon(c, capsule([60, 70 + dy], [hx - 3, hy + 4], 7, 6), TAN, { depth: 2 });
  ears(c, hx - 4, hy, 0);
  toon(c, circle(hx, hy, 10), TAN, { depth: 2.4 });
  toon(c, intersect(circle(hx, hy, 10), ellipse(hx - 6, hy - 6, 9, 7)), SADDLE, { noLine: true, depth: 1 });
  toon(c, ellipse(hx + 9, hy + 4, 7.5, 4.6), LIGHT, { depth: 1.2 });
  fill(c, ellipse(hx + 15.5, hy + 2.6, 2.4, 1.9), OUTLINE);
  eyes(c, [[hx + 3, hy - 1]], s.ko);
  mouth(c, hx + 11, hy + 7, s.open ?? 0, 5);
}

function front(c, s) {
  const dy = s.dy ?? 0;
  soft(c, ellipse(50, GROUND, 17, 4), SHADOW, 0.35, 1.6);
  // Lombo e rabo atrás da cabeça
  toon(c, capsule([50, 62 + dy], [50 + (s.tail ?? 0) * 8, 49 + dy], 2.6, 1.8), SADDLE, { depth: 1 });
  leg(c, [39, 78 + dy], [38, GROUND - 5], darken(TAN, 0.25));
  leg(c, [61, 78 + dy], [62, GROUND - 5], darken(TAN, 0.25));
  toon(c, ellipse(50, 67 + dy, 14, 9), SADDLE, { depth: 2 });
  toon(c, ellipse(50, 78 + dy, 12.5, 10), TAN, { depth: 2.4 });
  toon(c, ellipse(50, 80 + dy, 6, 6), LIGHT, { depth: 1, noLine: true });
  const lift = s.lift ?? [0, 0];
  leg(c, [44, 82 + dy], [44, GROUND - lift[0]], TAN);
  leg(c, [56, 82 + dy], [56, GROUND - lift[1]], TAN);
  const hy = 61 + dy + (s.headDy ?? 0);
  ears(c, 50, hy - 4, 6);
  toon(c, ellipse(50, hy, 11, 10), TAN, { depth: 2.4 });
  toon(c, intersect(ellipse(50, hy, 11, 10), ellipse(50, hy - 9, 12, 6)), SADDLE, { noLine: true, depth: 1 });
  toon(c, ellipse(50, hy + 6, 6.4, 4.8), LIGHT, { depth: 1.2 });
  fill(c, ellipse(50, hy + 3.6, 2.6, 1.9), OUTLINE);
  eyes(c, [[45.5, hy - 1], [54.5, hy - 1]], s.ko);
  mouth(c, 50, hy + 7.5, s.open ?? 0);
}

function back(c, s) {
  const dy = s.dy ?? 0;
  soft(c, ellipse(50, GROUND, 17, 4), SHADOW, 0.35, 1.6);
  const lift = s.lift ?? [0, 0];
  leg(c, [42, 66 + dy], [41, GROUND - 7 - lift[1]], darken(TAN, 0.25));
  leg(c, [58, 66 + dy], [59, GROUND - 7 - lift[0]], darken(TAN, 0.25));
  const hy = 52 + dy - (s.headDy ?? 0);
  ears(c, 50, hy - 3, 6, 0.1);
  toon(c, ellipse(50, hy, 10, 9), darken(TAN, 0.1), { depth: 2 });
  toon(c, intersect(ellipse(50, hy, 10, 9), ellipse(50, hy - 4, 11, 8)), SADDLE, { noLine: true, depth: 1 });
  const body = ellipse(50, 72 + dy, 13, 13);
  toon(c, body, TAN, { depth: 2.6 });
  toon(c, intersect(body, ellipse(50, 66 + dy, 8, 12)), SADDLE, { noLine: true, depth: 1.4 });
  leg(c, [43, 80 + dy], [43, GROUND - lift[0]], TAN);
  leg(c, [57, 80 + dy], [57, GROUND - lift[1]], TAN);
  toon(c, capsule([50, 80 + dy], [50 + (s.tail ?? 0) * 7, 90 + dy], 2.8, 1.8), SADDLE, { depth: 1 });
}

const IDLE = [0, 0.5, 1, 0.5];
const ATTACK = [
  { dy: 1, lean: -2, open: 0, headDy: 1 },
  { dy: -3, lean: 4, open: 3, headDy: -1, legs: [-4, 6, -3, 7] },
  { dy: -1, lean: 3, open: 2, legs: [-2, 3, -2, 4] },
  { dy: 0, lean: 1, open: 0 },
];

/** Quadro do Rex. kind: idle, attack, walk (corrida), down (deitado de lado). */
export function drawDog(c, view, kind, k) {
  let s;
  if (kind === 'attack') s = { ...ATTACK[k], tail: 0.4 };
  else if (kind === 'walk') {
    const phi = (k / 8) * Math.PI * 2;
    const d = (p) => Math.cos(phi + p) * 6;
    s = { dy: -Math.abs(Math.sin(phi)) * 2, tail: Math.sin(phi * 2) * 0.5, legs: [d(0), d(Math.PI), d(Math.PI * 0.5), d(Math.PI * 1.5)], lift: [Math.max(0, Math.sin(phi)) * 3, Math.max(0, -Math.sin(phi)) * 3] };
  } else if (kind === 'down') {
    c.save();
    c.translate(0, 8);
    side(c, { dy: 6, ko: true, legs: [8, 10, 8, 10] });
    c.restore();
    return;
  } else s = { dy: IDLE[k] * 0.6, tail: Math.sin(k * 1.7) * 0.6 };
  if (view === 'side') side(c, s);
  else if (view === 'front') front(c, s);
  else back(c, s);
}
