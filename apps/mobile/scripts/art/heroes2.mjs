// Heróis das cartas novas: Soldado (metralhadora), Bombeiro (lança-chamas), Médica (maleta)
// e Lara (besta). Mesmo esquema de ganchos do chibi que heroes.mjs.
import { capsule, circle, clipped, darken, ellipse, fill, intersect, line, minus, poly, rrect, toon } from './ck.mjs';
import { heroFace } from './face.mjs';
import { crossbow, flamethrower, held, machinegun, medbag } from './weapons.mjs';

const hairline = (a, faceRx = 10.5, faceRy = 11, dy = 4.5) => minus(a.headPath, ellipse(a.head[0] + (a.view === 'side' ? 5 : 0), a.head[1] + dy, faceRx, faceRy));
const weapon = (draw) => (c, a) => {
  const w = a.s.weapon;
  if (w) a.muzzle = held(c, draw, w.grip, w.angle, w);
};

/** Capacete em domo (Soldado, Bombeiro): cobre o alto da cabeça e desce um pouco. */
function helmet(c, a, color, brim) {
  const [x, y] = a.head;
  const side = a.view === 'side';
  toon(c, intersect(ellipse(x, y - 3, 17.5, 14.5), rrect(x - 20, y - 20, 40, 16, 0)), color, { depth: 2.4 });
  if (brim) toon(c, ellipse(x + (side ? 4 : 0), y - 4, side ? 15 : 18, 3.4), darken(color, 0.1), { depth: 1.4 });
}

const soldier = {
  skin: '#c98d5e', shirt: '#5b6b3a', pants: '#4a5530', shoes: '#3a2a1e',
  head(c, a, look) {
    if (a.view !== 'back') heroFace(c, a, look, { brow: '#2a1a12', mouth: 'grim', angry: true });
    helmet(c, a, '#56663a', false);
    if (a.view !== 'back') line(c, [[a.head[0] - 11, a.head[1] - 3], [a.head[0] - 9, a.head[1] + 9]], '#2e3420', 1.2);
  },
  torso(c, a) {
    // Camuflagem: manchas escuras e claras dentro do tronco
    clipped(c, a.torsoPath, () => {
      const [nx, ny] = a.neck;
      for (const [dx, dy, r, color] of [[-7, 4, 4, '#3f4a28'], [6, 9, 5, '#3f4a28'], [-3, 15, 4, '#7a8a52'], [8, 2, 3, '#7a8a52']]) fill(c, ellipse(nx + dx, ny + dy, r * 1.3, r), color);
    });
  },
  weapon: weapon(machinegun),
};

const firefighter = {
  skin: '#f2c49b', shirt: '#e0b02a', pants: '#e0b02a', shoes: '#262230',
  behind(c, a) {
    // Tanque de combustível nas costas (aparece por trás no perfil e de frente)
    if (a.view === 'back') return;
    const [nx, ny] = a.neck;
    const x = a.view === 'side' ? nx - 13 : nx;
    toon(c, rrect(x - 7, ny - 1, 14, 22, 6), '#c8322a', { depth: 2 });
  },
  head(c, a, look) {
    if (a.view !== 'back') heroFace(c, a, look, { brow: '#5a3420' });
    helmet(c, a, '#d8322a', true);
    if (a.view === 'front') toon(c, poly([[a.head[0] - 3.5, a.head[1] - 15], [a.head[0] + 3.5, a.head[1] - 15], [a.head[0] + 3, a.head[1] - 8], [a.head[0] - 3, a.head[1] - 8]]), '#ffd23f', { line: 1.2, depth: 0.8 });
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    const [, hy] = a.hip;
    clipped(c, a.torsoPath, () => {
      for (const y of [ny + 10, hy - 2]) fill(c, rrect(nx - 20, y, 40, 3, 1.5), '#e8eef4');
    });
    if (a.view === 'back') {
      toon(c, rrect(nx - 7, ny + 1, 14, 20, 6), '#c8322a', { depth: 2 });
      fill(c, rrect(nx - 5, ny + 4, 10, 2.4, 1.2), '#ffd23f');
    }
  },
  weapon: weapon(flamethrower),
};

const medic = {
  skin: '#a8704a', shirt: '#f2f2ee', pants: '#4a7ab0', shoes: '#e8e8f0', sleeve: '#f2f2ee',
  head(c, a, look) {
    const [x, y] = a.head;
    const hair = '#2a1a16';
    toon(c, hairline(a, 10.5, 11.5, 5), hair, { depth: 1.8, noLine: true });
    if (a.view !== 'front') toon(c, circle(x + (a.view === 'side' ? -11 : 0), y - (a.view === 'side' ? 6 : 8), 5.4), hair, { depth: 1.4 });
    if (a.view !== 'back') heroFace(c, a, look, { brow: hair });
    // Touca branca com a cruz vermelha
    toon(c, intersect(a.headPath, ellipse(x, y - 13, 17, 6.5)), '#ffffff', { depth: 1.2, noLine: true });
    if (a.view !== 'back') {
      const cx = x + (a.view === 'side' ? 3 : 0);
      fill(c, rrect(cx - 1, y - 14.5, 2, 5, 0.6), '#ff4d5a');
      fill(c, rrect(cx - 2.5, y - 13, 5, 2, 0.6), '#ff4d5a');
    }
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    if (a.view === 'side') return;
    const cx = nx + (a.view === 'front' ? -6 : 0);
    const cy = ny + (a.view === 'front' ? 8 : 10);
    const s = a.view === 'front' ? 1 : 1.8;
    fill(c, rrect(cx - 1.2 * s, cy - 3.2 * s, 2.4 * s, 6.4 * s, 0.6), '#ff4d5a');
    fill(c, rrect(cx - 3.2 * s, cy - 1.2 * s, 6.4 * s, 2.4 * s, 0.6), '#ff4d5a');
  },
  weapon(c, a) {
    const w = a.s.weapon;
    if (!w) return;
    held(c, medbag, w.grip, 0);
    // Pulso de cura: cruzes subindo da maleta
    if (w.flash) for (const [dx, dy] of [[-6, -10], [4, -15], [10, -6]]) {
      fill(c, rrect(w.grip[0] + dx - 1, w.grip[1] + dy - 3, 2, 6, 0.6), '#4ade9a');
      fill(c, rrect(w.grip[0] + dx - 3, w.grip[1] + dy - 1, 6, 2, 0.6), '#4ade9a');
    }
  },
};

const lara = {
  skin: '#f0c6a0', shirt: '#7a5232', pants: '#3a3644', shoes: '#4a2c1c', sleeve: '#3f6b45',
  behind(c, a) {
    // Capa verde atrás do corpo
    const [nx, ny] = a.neck;
    const [hx, hy] = a.hip;
    if (a.view === 'front') return;
    toon(c, poly([[nx - 12, ny], [nx + 12, ny], [hx + 15, hy + 8], [hx - 15, hy + 8]]), '#3f6b45', { depth: 2 });
  },
  head(c, a, look) {
    const [x, y] = a.head;
    const braid = '#e0b45a';
    if (a.view !== 'front') toon(c, capsule([x + (a.view === 'side' ? -10 : 2), y + 2], [x + (a.view === 'side' ? -13 : 3), y + 17], 2.6, 1.8), braid, { depth: 1.2 });
    toon(c, hairline(a, 10, 11, 5.5), braid, { depth: 1.6, noLine: true });
    if (a.view !== 'back') heroFace(c, a, look, { brow: darken(braid, 0.4) });
    // Capuz caído sobre o alto da cabeça
    toon(c, intersect(ellipse(x, y - 1, 18.5, 17), rrect(x - 22, y - 22, 44, a.view === 'back' ? 34 : 13, 0)), '#3f6b45', { depth: 2.2 });
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    const [hx, hy] = a.hip;
    if (a.view === 'side') return;
    toon(c, capsule([nx - 9, ny + 1], [hx + 9, hy - 2], 1.4), '#4a2c1c', { depth: 0.6, noLine: true });
  },
  weapon: weapon(crossbow),
};

export const NEW_HERO_LOOKS = { soldier, firefighter, medic, crossbow: lara };
