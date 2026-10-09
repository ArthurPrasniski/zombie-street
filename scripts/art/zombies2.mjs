// Zumbis dos mundos 2 a 5 (Policial, Inchado, Recruta, Congelado) e os chefes de cada mundo,
// que usam o corpo do Brutamontes com roupa e cores próprias.
import { BUILD } from './chibi.mjs';
import { capsule, circle, clipped, darken, ellipse, fill, intersect, lighten, poly, rrect, toon } from './ck.mjs';
import { zombieFace } from './face.mjs';
import { BRUTE_BUILD } from './zombies.mjs';

const face = (opts = {}) => (c, a, look) => zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.35, ...opts });

/** Boné/quepe com aba virada para a câmera (de costas, só a copa). */
function cap(c, a, color, badge, r = 15) {
  const [x, y] = a.head;
  toon(c, intersect(ellipse(x, y - r * 0.25, r * 1.15, r * 0.95), rrect(x - 30, y - 30, 60, 22 - r * 0.2, 0)), color, { depth: 2 });
  if (a.view !== 'back') toon(c, ellipse(x + (a.view === 'side' ? 9 : 0), y - r * 0.5, a.view === 'side' ? 7 : 12, 3), darken(color, 0.35), { depth: 1 });
  if (badge && a.view === 'front') toon(c, circle(x, y - r * 0.8, 2.2), '#ffd23f', { line: 1, depth: 0.6 });
}

/** Manchas (camuflagem, musgo, gelo) só dentro do tronco. */
const patches = (spots) => (c, a) =>
  clipped(c, a.torsoPath, () => {
    const [nx, ny] = a.neck;
    for (const [dx, dy, r, color] of spots) fill(c, ellipse(nx + dx, ny + dy, r * 1.3, r), color);
  });

const cop = {
  skin: '#9cbf7a', shirt: '#2c3e6b', pants: '#1f2a48', shoes: '#16141a',
  head(c, a, look) {
    face({ stitches: true })(c, a, look);
    cap(c, a, '#22305a', true);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    if (a.view === 'side') return;
    toon(c, intersect(a.torsoPath, rrect(nx - 11, ny + 1, 22, 18, 4)), '#1a2440', { depth: 1.4, noLine: true });
    if (a.view === 'front') toon(c, poly([[nx - 6, ny + 5], [nx - 3, ny + 4], [nx - 2, ny + 8], [nx - 5, ny + 9]]), '#ffd23f', { line: 0.8, depth: 0.4 });
  },
};

const bloater = {
  skin: '#c6c97a', shirt: '#e8e4d0', sleeve: '#c6c97a', pants: '#6a5a48', shoes: '#3a3440',
  build: { ...BUILD, torsoW: 36, armR: 4.6, handR: 4.4, legR: 5.6, footR: 5.6 },
  head: face({ glow: '#d8f06a' }),
  torso(c, a, look) {
    // Barriga inchada com bolhas esverdeadas
    clipped(c, a.torsoPath, () => {
      const [hx, hy] = a.hip;
      fill(c, ellipse(hx, hy - 6, 14, 10), look.skin);
      for (const [dx, dy, r] of [[-6, -9, 2.6], [5, -4, 3.2], [-2, 1, 2], [9, -12, 1.8]]) {
        toon(c, circle(hx + dx, hy + dy, r), '#9be04a', { line: 0.8, depth: 0.6, light: '#e8ffb0' });
      }
    });
  },
};

const grunt = {
  skin: '#94b86a', shirt: '#c2a66a', pants: '#a58a55', shoes: '#4a3420',
  head(c, a, look) {
    face()(c, a, look);
    const [x, y] = a.head;
    toon(c, intersect(ellipse(x, y - 3, 17.5, 14.5), rrect(x - 20, y - 20, 40, 16, 0)), '#b89a5a', { depth: 2.2 });
    if (a.view !== 'back') toon(c, rrect(x - 9 + (a.view === 'side' ? 7 : 0), y - 8, a.view === 'side' ? 9 : 18, 4, 2), '#3a3f52', { line: 1, depth: 0.6 });
  },
  torso: patches([[-7, 4, 4, '#8a6e3a'], [6, 10, 5, '#8a6e3a'], [-2, 15, 3.5, '#e0c890']]),
};

const frost = {
  skin: '#a9d8e8', shirt: '#d84a5a', pants: '#2e3448', shoes: '#e8eef4',
  head(c, a, look) {
    face({ glow: '#e0f8ff' })(c, a, look);
    const [x, y] = a.head;
    toon(c, intersect(a.headPath, ellipse(x, y - 11, 18, 7)), '#f2f8fc', { depth: 1.2, noLine: true });
    for (const dx of [-6, 0, 6]) toon(c, poly([[x + dx - 1.6, y - 12], [x + dx + 1.6, y - 12], [x + dx, y - 19]]), '#d8f2ff', { line: 1, depth: 0.5 });
  },
  torso: patches([[-8, 6, 3, '#f2f8fc'], [7, 14, 2.6, '#f2f8fc']]),
};

// ---------- Chefes (corpo do Brutamontes) ----------

const riot = {
  skin: '#7a9a6a', shirt: '#2c3e6b', sleeve: '#2c3e6b', pants: '#1f2a48', shoes: '#16141a', build: BRUTE_BUILD,
  head(c, a, look) {
    face({ glow: '#ff4d4d' })(c, a, look);
    const [x, y] = a.head;
    toon(c, intersect(ellipse(x, y - 1, 14.5, 13.5), rrect(x - 20, y - 20, 40, 14, 0)), '#1a2440', { depth: 2 });
    if (a.view !== 'back') toon(c, rrect(x - 10 + (a.view === 'side' ? 6 : 0), y - 7, a.view === 'side' ? 9 : 20, 6, 2), '#4a6a9a', { line: 1.2, depth: 0.8, light: '#a8c8f0' });
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    clipped(c, a.torsoPath, () => {
      for (const [dx, dy] of [[-10, 4], [10, 4], [-10, 15], [10, 15]]) toon(c, rrect(nx + dx - 8, ny + dy - 4, 16, 9, 3), '#3a5080', { line: 1, depth: 1 });
    });
  },
};

const hulk = {
  skin: '#4f7a4a', shirt: '#3d5a32', sleeve: '#4f7a4a', pants: '#3a4a2a', shoes: '#2a2a22', build: BRUTE_BUILD,
  head(c, a, look) {
    face({ glow: '#d8f06a' })(c, a, look);
    const [x, y] = a.head;
    // Algas caindo dos lados da cabeça, sem cobrir o rosto
    for (const dx of [-11, -8, 8, 11]) toon(c, capsule([x + dx * 0.8, y - 9], [x + dx * 1.15, y + 8], 1.8, 1), '#2f5a2a', { line: 1, depth: 0.6 });
  },
  torso: patches([[-10, 4, 6, '#2f5a2a'], [9, 10, 5, '#6a8a3a'], [-3, 18, 4, '#2f5a2a']]),
};

const general = {
  skin: '#8fae6a', shirt: '#55603a', sleeve: '#55603a', pants: '#4a5530', shoes: '#2a2018', build: BRUTE_BUILD,
  head(c, a, look) {
    face({ glow: '#ff4d4d' })(c, a, look);
    cap(c, a, '#4a5530', true, BRUTE_BUILD.headR);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    if (a.view !== 'front') return;
    for (const dx of [-14, 14]) toon(c, rrect(nx + dx - 6, ny - 1, 12, 4, 2), '#ffd23f', { line: 1, depth: 0.5 });
    for (let i = 0; i < 3; i++) toon(c, circle(nx - 8 + i * 4, ny + 10, 1.8), i === 1 ? '#ff4d5a' : '#ffd23f', { line: 0.8, depth: 0.4 });
  },
};

const yeti = {
  skin: '#b8dcef', shirt: '#f2f4f8', sleeve: '#f2f4f8', pants: '#e0e6ee', shoes: '#c8d0dc', hands: '#b8dcef', build: BRUTE_BUILD,
  head(c, a, look) {
    // Pelo branco em volta do rosto azul
    const [x, y] = a.head;
    if (a.view === 'back') {
      toon(c, ellipse(x, y, 15, 14), '#f2f4f8', { depth: 2 });
      return;
    }
    toon(c, intersect(a.headPath, ellipse(x, y - 12, 18, 8)), '#f2f4f8', { depth: 1.4, noLine: true });
    face({ glow: '#5ac8ff' })(c, a, look);
  },
  torso: patches([[-12, 3, 4, lighten('#f2f4f8', 0.4)], [10, 12, 3.5, darken('#f2f4f8', 0.12)]]),
};

export const NEW_ZOMBIE_LOOKS = { cop, bloater, grunt, frost, riot, hulk, general, yeti };
