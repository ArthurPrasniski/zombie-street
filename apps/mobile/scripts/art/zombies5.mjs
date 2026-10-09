// Zumbis do Ato 3 (GDD seção 18.3): Cosmonauta, Xeno e Larva e os chefes Comandante da Missão,
// Titã Marciano e Rainha Colmeia (corpo do Brutamontes). O Casulo e o Verme Lunar têm desenho
// próprio (drawPod, drawWorm), como a Torreta. Dentro de `head`, a cabeça tem raio 15.
import { BUILD, GROUND } from './chibi.mjs';
import { capsule, circle, darken, ellipse, fill, intersect, lighten, line, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { zombieFace } from './face.mjs';
import { BRUTE_BUILD } from './zombies.mjs';

const CHITIN = '#3a2a4a';
const GLOW = '#9be04a';

/** Capacete de vidro em volta da cabeça, com reflexo pequeno e a borda. */
function bubble(c, a) {
  const [x, y] = a.head;
  fill(c, circle(x, y, 18), '#bfe6ff', 0.22);
  fill(c, ellipse(x - 11, y - 9, 3.2, 5.5), '#ffffff', 0.75);
  line(c, [[x - 17, y + 8], [x - 19, y], [x - 17, y - 9], [x - 10, y - 17], [x, y - 19.5], [x + 10, y - 17], [x + 17, y - 9], [x + 19, y], [x + 17, y + 8]], '#e8f4ff', 1.6, 0.9);
}

/** Crista de espinhos no alto da cabeça (alienígenas). */
function crest(c, a, color, size = 1) {
  const [x, y] = a.head;
  for (const [dx, h] of [[-8, 8], [0, 12], [8, 8]]) toon(c, poly([[x + dx * size - 3, y - 12], [x + dx * size, y - 12 - h * size], [x + dx * size + 3, y - 12]]), color, { line: 1.2, depth: 0.8 });
}

/** Mochila a jato atrás do corpo (Cosmonauta e Comandante). */
function jetpack(c, a, big) {
  if (a.view === 'front') return;
  const [nx, ny] = a.neck;
  const w = big ? 14 : 9;
  for (const s of [-1, 1]) {
    const x = nx + (a.view === 'side' ? -12 - w : s * (w * 0.6)) - w / 2;
    toon(c, rrect(x, ny, w, big ? 30 : 20, w / 2), '#9aa3b8', { depth: 1.5 });
    if (a.view === 'side') break;
  }
}

const cosmonaut = {
  skin: '#9cc47a', shirt: '#e8742a', sleeve: '#e8742a', pants: '#d8632a', shoes: '#4a5068', hands: '#e8ecf0',
  behind: (c, a) => jetpack(c, a, false),
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.4 });
    bubble(c, a);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    toon(c, ellipse(nx, ny - 1, 12, 3.6), '#e8ecf0', { line: 1.2, depth: 0.8 });
    if (a.view === 'front') toon(c, circle(nx + 6, ny + 7, 3), '#c8443a', { line: 1, depth: 0.5 });
  },
};

const xeno = {
  skin: CHITIN, shirt: darken(CHITIN, 0.15), sleeve: CHITIN, pants: darken(CHITIN, 0.25), shoes: darken(CHITIN, 0.4), hands: '#6a4a8a',
  build: { ...BUILD, torsoW: 21, armR: 3.4, handR: 4.4, legR: 4 },
  head(c, a, look) {
    crest(c, a, '#6a4a8a');
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.7, glow: GLOW });
  },
  torso(c, a) {
    if (a.view === 'back') return;
    const [nx, ny] = a.neck;
    for (let i = 0; i < 3; i++) line(c, [[nx - 7, ny + 5 + i * 5], [nx + 7, ny + 5 + i * 5]], '#6a4a8a', 1.6);
  },
};

const larva = {
  skin: '#c8d86a', shirt: '#b8c85a', sleeve: '#c8d86a', pants: '#a8b84a', shoes: '#7a8a3a',
  head(c, a, look) {
    crest(c, a, '#7a8a3a', 0.7);
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.9, glow: '#ff7ae4' });
  },
};

const commander = {
  skin: '#8fae6a', shirt: '#eef2f6', sleeve: '#eef2f6', pants: '#e2e8ee', shoes: '#4a5068', hands: '#d8dde4', build: BRUTE_BUILD,
  behind: (c, a) => jetpack(c, a, true),
  head(c, a) {
    const [x, y] = a.head;
    toon(c, intersect(a.headPath, ellipse(x, y, 18, 17)), '#eef2f6', { depth: 2, noLine: true });
    if (a.view !== 'back') toon(c, rrect(x - 11 + (a.view === 'side' ? 6 : 0), y - 6, a.view === 'side' ? 10 : 22, 12, 5), '#ffc928', { line: 1.4, depth: 1, light: '#fff1a8' });
  },
  torso(c, a) {
    if (a.view !== 'front') return;
    const [nx, ny] = a.neck;
    for (let i = 0; i < 3; i++) fill(c, rrect(nx - 14, ny + 4 + i * 4, 8, 2.4, 1), '#ffc928');
    toon(c, circle(nx + 9, ny + 8, 4), '#3a6ab0', { line: 1, depth: 0.5 });
  },
};

const marsTitan = {
  skin: '#8a2a2a', shirt: '#6a1e22', sleeve: '#8a2a2a', pants: '#5a1a1e', shoes: '#3a1216', hands: '#a83a3a', build: BRUTE_BUILD,
  head(c, a, look) {
    crest(c, a, '#c84a3a', 1.1);
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.6, glow: '#ffc928' });
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    for (const s of [-1, 1]) toon(c, poly([[nx + s * 16, ny + 2], [nx + s * 26, ny - 8], [nx + s * 22, ny + 6]]), '#c84a3a', { line: 1.2, depth: 0.8 });
  },
};

const queen = {
  skin: '#5a2a6a', shirt: '#4a1e5a', sleeve: '#5a2a6a', pants: '#3a1648', shoes: '#2a1036', hands: '#8a4aa8', build: BRUTE_BUILD,
  head(c, a, look) {
    const [x, y] = a.head;
    // Coroa de espinhos grandes
    for (const [dx, h] of [[-12, 10], [-6, 15], [0, 19], [6, 15], [12, 10]]) toon(c, poly([[x + dx - 3, y - 10], [x + dx, y - 10 - h], [x + dx + 3, y - 10]]), '#c84a8a', { line: 1.2, depth: 0.8, light: '#ff9ad0' });
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.5, glow: '#ff4fd8' });
  },
  torso(c, a) {
    if (a.view === 'back') return;
    const [nx, ny] = a.neck;
    for (const [dx, dy] of [[-8, 10], [8, 12], [0, 18]]) toon(c, circle(nx + dx, ny + dy, 3.4), GLOW, { line: 1, depth: 0.5, light: '#f0ffd0' });
  },
};

export const ACT3_ZOMBIE_LOOKS = { cosmonaut, xeno, larva, commander, marsTitan, queen };

// ---------- Casulo (parado; pulsa e se abre ao morrer) ----------

/** Casulo: kind walk/attack pulsa; death (k de 0 a 4) racha e murcha. */
export function drawPod(c, view, kind, k) {
  soft(c, ellipse(50, GROUND - 1, 20, 4), SHADOW, 0.35, 1.6);
  const open = kind === 'death' ? k / 4 : 0;
  const pulse = kind === 'death' ? 0 : Math.sin((k / 8) * Math.PI * 2);
  const h = 54 * (1 - open * 0.55) + pulse * 1.5;
  const w = 18 + pulse * 1 + open * 7;
  const top = GROUND - 4 - h;
  fill(c, ellipse(50, GROUND - 3, 24, 6), '#5a2a4a');
  const shell = ellipse(50, top + h / 2, w, h / 2);
  toon(c, shell, open > 0.5 ? darken('#8a4a6a', 0.3) : '#8a4a6a', { depth: 3, light: '#c88aa8' });
  fill(c, ellipse(50, top + h * 0.55, w * 0.5, h * 0.3), GLOW, 0.35 + 0.2 * (pulse + 1) * 0.5 - open * 0.3);
  for (const dx of [-8, 0, 8]) line(c, [[50 + dx, top + 4], [50 + dx * 1.3, top + h - 4]], '#c84a8a', 1.6, 0.8);
  if (open > 0) {
    line(c, [[44, top], [50, top + h * 0.5], [56, top]], '#2a1030', 2.4);
    fill(c, ellipse(56, GROUND - 2, 10 * open + 4, 3 * open + 1), GLOW, 0.7);
  }
  if (view === 'back') fill(c, ellipse(50, top + 6, 6, 3), lighten('#8a4a6a', 0.2), 0.6);
}

// ---------- Verme Lunar (sai do chão; ondula, avança e afunda ao morrer) ----------

/** Verme Lunar: segmentos saindo de um buraco no chão, a cabeça com mandíbulas. */
export function drawWorm(c, view, kind, k) {
  soft(c, ellipse(50, GROUND - 1, 30, 6), SHADOW, 0.4, 2);
  toon(c, ellipse(50, GROUND - 3, 28, 8), '#6a6a72', { depth: 2 });
  fill(c, ellipse(50, GROUND - 4, 20, 5), '#2a2a30');
  const sink = kind === 'death' ? k / 4 : 0;
  const lunge = kind === 'attack' ? [0, 4, 9, 3, 0, 0, 0, 0][k % 8] : 0;
  const sway = kind === 'walk' ? Math.sin((k / 8) * Math.PI * 2) * 3 : 0;
  const segments = 4;
  let tip = [50, GROUND - 6];
  for (let i = 0; i < segments; i++) {
    const r = 13 - i * 1.6;
    const y = GROUND - 10 - i * 13 * (1 - sink * 0.8) + lunge * (i / segments);
    const x = 50 + sway * (i / segments) + (view === 'side' ? lunge * (i / segments) : 0);
    toon(c, circle(x, y, r), i % 2 ? '#7a7a9a' : '#8a8aaa', { depth: 2, light: '#c8c8e0' });
    tip = [x, y - r * 0.6];
  }
  const [hx, hy] = tip;
  toon(c, ellipse(hx, hy - 4, 12, 10), '#9a9ab8', { depth: 2, light: '#e0e0f0' });
  if (view === 'back') return;
  for (const s of [-1, 1]) toon(c, poly([[hx + s * 6, hy], [hx + s * 14, hy + 8 + lunge * 0.4], [hx + s * 4, hy + 4]]), '#e8e0c8', { line: 1.2, depth: 0.6 });
  for (const s of view === 'side' ? [1] : [-1, 1]) toon(c, circle(hx + s * 5, hy - 7, 2.4), '#ff4d4d', { line: 1, depth: 0.4, light: '#ffd0d0' });
}
