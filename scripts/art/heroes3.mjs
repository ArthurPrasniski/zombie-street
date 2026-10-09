// Heróis das armas sci-fi do Ato 2 (GDD seção 18.4): Cabo Laser (rifle laser) e Exotraje Titã
// (armadura hidráulica com punhos grandes). Mesmo esquema de ganchos do chibi.
import { BUILD } from './chibi.mjs';
import { capsule, circle, clipped, ellipse, fill, intersect, line, rrect, toon } from './ck.mjs';
import { heroFace } from './face.mjs';
import { laserRifle } from './scifi.mjs';
import { held } from './weapons.mjs';

const weapon = (draw) => (c, a) => {
  const w = a.s.weapon;
  if (w) a.muzzle = held(c, draw, w.grip, w.angle, w);
};

/** Capacete branco com viseira ciano (Cabo Laser). */
function visorHelmet(c, a) {
  const [x, y] = a.head;
  toon(c, intersect(ellipse(x, y - 2, 17.5, 15.5), rrect(x - 22, y - 22, 44, 18, 0)), '#e8ecf0', { depth: 2.2 });
  if (a.view === 'back') return;
  const vx = x + (a.view === 'side' ? 6 : 0);
  toon(c, rrect(vx - (a.view === 'side' ? 6 : 12), y - 6, a.view === 'side' ? 12 : 24, 6, 3), '#3ee8ff', { line: 1.2, depth: 0.8, light: '#e8ffff' });
}

const laser = {
  skin: '#d8a07a', shirt: '#e8ecf0', sleeve: '#e8ecf0', pants: '#3a3f52', shoes: '#2a2533',
  head(c, a, look) {
    if (a.view !== 'back') heroFace(c, a, look, { brow: '#3a2416', mouth: 'grim' });
    visorHelmet(c, a);
  },
  torso(c, a) {
    if (a.view === 'back') return;
    const [nx, ny] = a.neck;
    clipped(c, a.torsoPath, () => {
      fill(c, rrect(nx - 14, ny + 7, 28, 3, 1.5), '#3ee8ff', 0.85);
      fill(c, rrect(nx - 3, ny + 1, 6, 18, 2), '#c8ccd4');
    });
  },
  weapon: weapon(laserRifle),
};

/** Exotraje Titã: armadura amarela com juntas escuras, cabine de vidro e punhos enormes. */
const titan = {
  skin: '#c88a62', shirt: '#ffc928', sleeve: '#5a6078', pants: '#5a6078', shoes: '#3a3f52', hands: '#7a8296',
  build: { ...BUILD, torsoW: 34, torsoH: 22, armR: 6.2, handR: 8.4, legR: 6.2, footR: 7 },
  head(c, a, look) {
    const [x, y] = a.head;
    if (a.view !== 'back') heroFace(c, a, look, { brow: '#2a1a12', mouth: 'grim', angry: true });
    // Cabine de vidro em volta da cabeça
    fill(c, circle(x, y, 18), '#bfe6ff', 0.2);
    line(c, [[x - 17, y + 6], [x - 18, y - 3], [x - 13, y - 13], [x, y - 18], [x + 13, y - 13], [x + 18, y - 3], [x + 17, y + 6]], '#e8f4ff', 1.6, 0.9);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    // Anel da cabine no pescoço (a cabeça cobre a parte de cima)
    toon(c, ellipse(nx, ny - 1, 15, 4), '#5a6078', { line: 1.2, depth: 0.8 });
    clipped(c, a.torsoPath, () => {
      for (let i = -2; i < 3; i++) fill(c, rrect(nx + i * 9 - 1, ny - 2, 2, 30, 1), '#2a2533', 0.35);
      toon(c, circle(nx, ny + 11, 4), '#3ee8ff', { line: 1, depth: 0.6, light: '#ffffff' });
    });
    if (a.view !== 'back') for (const s of [-1, 1]) toon(c, capsule([nx + s * 16, ny + 2], [nx + s * 16, ny + 18], 2.4), '#3a3f52', { line: 1, depth: 0.6 });
  },
};

export const SCIFI_HERO_LOOKS = { laser, titan };
