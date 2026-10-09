// Rostos cartoon: olhos grandes com brilho, sobrancelhas, boca. Heróis e zumbis.
import { BUILD } from './chibi.mjs';
import { circle, darken, ellipse, fill, intersect, line, OUTLINE, poly, toon } from './ck.mjs';

const WHITE = '#ffffff';

/** Coordenada no rosto: x para a direita, y para baixo, a partir do centro da cabeça. */
const at = (a, x, y) => [a.head[0] + x, a.head[1] + y];

function eye(c, [x, y], { rx = 3.1, ry = 3.9, look = [0, 0.4], lid = 0, iris = '#2a1f3d', glow = null, skin = '#8fbf6a' }) {
  fill(c, ellipse(x, y, rx + 0.9, ry + 0.9), OUTLINE);
  fill(c, ellipse(x, y, rx, ry), glow ?? WHITE);
  if (!glow) {
    fill(c, ellipse(x + look[0] * rx * 0.45, y + look[1] * ry * 0.4, rx * 0.66, ry * 0.68), iris);
    fill(c, circle(x + look[0] * rx * 0.45 - rx * 0.25, y + look[1] * ry * 0.4 - ry * 0.3, rx * 0.26), WHITE);
  }
  // Pálpebra caída (zumbis, cansaço)
  if (lid > 0) fill(c, intersect(ellipse(x, y, rx, ry), ellipse(x, y - ry * 2 + lid * ry * 2, rx * 1.6, ry * 1.4)), darken(skin, 0.1));
}

/**
 * Rosto de herói. opts: { brow (cor), mouth: 'smile' | 'grim' | 'shout', blush, eyeY, beard }
 * Na vista de perfil só aparece um olho, perto da frente da cabeça.
 */
export function heroFace(c, a, look, opts = {}) {
  // faceScale aumenta olhos e boca em volta do centro da cabeça (a cabeça já vem escalada)
  const b = look.build ?? BUILD;
  const k = b.faceScale ?? 1;
  if (k !== 1) return scaled(c, a, k, () => heroFace(c, a, { ...look, build: { ...b, headR: 15, faceScale: 1 } }, opts));
  const r = 1;
  if (a.s.ko) return knockedOut(c, a, r);
  const ey = (opts.eyeY ?? 1.5) * r;
  const brow = opts.brow ?? darken(look.skin, 0.6);
  if (a.view === 'back') return;
  if (a.view === 'side') {
    eye(c, at(a, 7.5 * r, ey), { rx: 2.6, ry: 3.7, look: [0.6, 0.3] });
    line(c, [at(a, 5 * r, ey - 5.6), at(a, 10 * r, ey - 5)], brow, 1.8);
    fill(c, circle(...at(a, 15 * r, ey + 3), 2.1), darken(look.skin, 0.12));
    mouth(c, a, at(a, 11 * r, ey + 7.5), opts.mouth, 0.7);
    if (opts.blush !== false) fill(c, ellipse(...at(a, 6 * r, ey + 6), 2.6, 1.6), '#ff7a7a', 0.35);
    return;
  }
  for (const s of [-1, 1]) {
    eye(c, at(a, s * 5.6 * r, ey), {});
    line(c, [at(a, s * 3.3 * r, ey - 5.6 + (opts.angry ? 1 : 0)), at(a, s * 8 * r, ey - 6.3 - (opts.angry ? 0.8 : 0))], brow, 1.9);
    if (opts.blush !== false) fill(c, ellipse(...at(a, s * 8.6 * r, ey + 5.2), 2.6, 1.5), '#ff7a7a', 0.32);
  }
  mouth(c, a, at(a, 0, ey + 7), opts.mouth, 1);
}

function mouth(c, a, [x, y], kind = 'smile', w) {
  if (kind === 'shout') {
    toon(c, ellipse(x, y + 0.6, 2.6 * w, 2.4), '#5b1630', { line: 1.2, depth: 0.8, noLight: true });
    return;
  }
  if (kind === 'grim') {
    line(c, [[x - 2.6 * w, y], [x + 2.6 * w, y - 0.4]], OUTLINE, 1.5);
    return;
  }
  line(c, [[x - 2.8 * w, y - 0.8], [x, y + 0.9], [x + 2.8 * w, y - 0.8]], OUTLINE, 1.5);
}

/**
 * Rosto de zumbi: um olho grande e arregalado, outro caído ou brilhando; boca torta com dentes.
 * opts: { glow (cor do olho brilhante), jaw (abertura 0..1), stitches }
 */
export function zombieFace(c, a, look, opts = {}) {
  const b = look.build ?? BUILD;
  const k = b.faceScale ?? 1;
  if (k !== 1) return scaled(c, a, k, () => zombieFace(c, a, { ...look, build: { ...b, headR: 15, faceScale: 1 } }, opts));
  const jaw = opts.jaw ?? 0.3;
  if (a.view === 'back') return;
  const skinDark = darken(look.skin, 0.45);
  if (a.view === 'side') {
    eye(c, at(a, 7.5, 0.5), { rx: 3, ry: 3.6, look: [0.7, 0.2], iris: '#3a2a1a', glow: opts.glow });
    zombieMouth(c, at(a, 10.5, 7.5), 4.5, jaw, skinDark);
    return;
  }
  eye(c, at(a, -5.6, 0.5), { rx: 3.6, ry: 4.3, look: [0.1, 0.5], iris: '#3a2a1a' });
  eye(c, at(a, 5.4, 1.5), { rx: 2.6, ry: 2.9, lid: 0.45, glow: opts.glow, iris: '#3a2a1a', skin: look.skin });
  line(c, [at(a, -9, -5.5), at(a, -2.5, -4.2)], skinDark, 1.8);
  zombieMouth(c, at(a, 0.5, 8), 6, jaw, skinDark);
  if (opts.stitches) {
    line(c, [at(a, 6, -9), at(a, 10, -3)], skinDark, 1.2);
    for (let i = 0; i < 3; i++) line(c, [at(a, 6.6 + i * 1.3, -8 + i * 2), at(a, 8.6 + i * 1.3, -8.8 + i * 2)], skinDark, 1);
  }
}

function zombieMouth(c, [x, y], w, jaw, inner) {
  const h = 1.6 + jaw * 3.4;
  const shape = poly([[x - w, y - 0.6], [x - w * 0.3, y - 1.2], [x + w, y - 0.2], [x + w * 0.7, y + h], [x - w * 0.6, y + h * 0.8]]);
  toon(c, shape, '#3a1024', { line: 1.3, depth: 0.6, noLight: true });
  for (let i = 0; i < 3; i++) {
    const tx = x - w * 0.55 + i * w * 0.55;
    fill(c, poly([[tx - 1, y - 0.6], [tx + 1, y - 0.6], [tx, y + 1.6]]), '#f3ecd2');
  }
  fill(c, ellipse(x + w * 0.3, y + h * 0.75, w * 0.35, 1), inner, 0.6);
}

/** Olhos em X e boca aberta: tropa caída. */
function knockedOut(c, a, r) {
  const eyes = a.view === 'side' ? [7.5] : [-5.6, 5.6];
  for (const ex of eyes) {
    const [x, y] = at(a, ex * r, 1.5);
    line(c, [[x - 2.4, y - 2.4], [x + 2.4, y + 2.4]], OUTLINE, 1.8);
    line(c, [[x - 2.4, y + 2.4], [x + 2.4, y - 2.4]], OUTLINE, 1.8);
  }
  toon(c, ellipse(...at(a, (a.view === 'side' ? 10 : 0) * r, 9), 2.2, 1.8), '#5b1630', { line: 1.2, depth: 0.6, noLight: true });
}

/** Desenha o rosto escalado em volta do centro da cabeça. */
function scaled(c, a, k, draw) {
  c.save();
  c.translate(a.head[0], a.head[1]);
  c.scale(k, k);
  c.translate(-a.head[0], -a.head[1]);
  draw();
  c.restore();
}
