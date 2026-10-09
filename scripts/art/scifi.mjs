// Armas sci-fi do Ato 2 (GDD seção 18.4): Drone (voa) e Torre Tesla (construção), desenhados à
// parte como a Torreta, e o rifle laser do Cabo Laser.
import { GROUND } from './chibi.mjs';
import { capsule, circle, darken, ellipse, fill, line, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { held, muzzleFlash } from './weapons.mjs';

const HULL = '#3a3f52';
const CYAN = '#3ee8ff';
const COPPER = '#c8843a';

/** Rifle laser: corpo branco com núcleo ciano e emissor na ponta. */
export function laserRifle(c) {
  toon(c, rrect(-10, -3, 14, 6.5, 2), '#e8ecf0', { depth: 1.2 });
  toon(c, rrect(3, -3.6, 18, 6.4, 2.4), '#e8ecf0', { depth: 1 });
  fill(c, rrect(5, -1.2, 14, 2.2, 1.1), CYAN);
  toon(c, capsule([20, -0.4], [30, -0.4], 2.2, 1.6), HULL, { depth: 0.8 });
  toon(c, circle(30, -0.4, 2.2), CYAN, { line: 1, depth: 0.4, light: '#ffffff' });
  return 30;
}

/** Hélice girando: disco claro com a pá numa posição que muda a cada quadro. */
function rotor(c, x, y, k) {
  fill(c, ellipse(x, y, 11, 3.6), '#e8ecf0', 0.45);
  const a = (k * Math.PI) / 4;
  line(c, [[x - Math.cos(a) * 10, y - Math.sin(a) * 2.4], [x + Math.cos(a) * 10, y + Math.sin(a) * 2.4]], HULL, 2.2);
  toon(c, circle(x, y, 2.4), HULL, { line: 1, depth: 0.5 });
}

/** Drone: voa a meia altura, sombra no chão; a arma aponta para a vista. Devolve a boca do cano. */
export function drawDrone(c, view, kind, k) {
  if (kind === 'down') {
    soft(c, ellipse(50, GROUND - 2, 22, 4), SHADOW, 0.35, 1.6);
    toon(c, poly([[30, GROUND - 4], [66, GROUND - 10], [70, GROUND - 2], [34, GROUND + 2]]), HULL, { depth: 1.2 });
    for (let i = 0; i < 3; i++) soft(c, circle(46 + i * 6, GROUND - 16 - i * 7, 5 + i * 2), '#5a5568', 0.4, 3);
    return null;
  }
  const bob = [0, -1.5, -2.5, -1.5, 0, 1, 1.5, 1][k % 8];
  const y = 50 + bob;
  soft(c, ellipse(50, GROUND - 1, 18, 3.6), SHADOW, 0.3, 2);
  // Braços em X e as quatro hélices
  for (const [dx, dy] of [[-17, -8], [17, -8], [-17, 6], [17, 6]]) {
    toon(c, capsule([50, y], [50 + dx, y + dy], 1.8), HULL, { line: 1, depth: 0.6 });
    rotor(c, 50 + dx, y + dy - 3, k + (dx > 0 ? 1 : 0));
  }
  toon(c, rrect(38, y - 8, 24, 16, 6), HULL, { depth: 2, light: '#7a8296' });
  fill(c, rrect(40, y - 2, 20, 3, 1.5), '#ffc928');
  if (view !== 'back') toon(c, circle(view === 'side' ? 58 : 50, y + 1, 3.6), CYAN, { line: 1.2, depth: 0.6, light: '#ffffff' });
  const flash = kind === 'attack' && k % 2 === 1 ? 0.7 : 0;
  const gunAt = [50, y + 8];
  const angle = view === 'front' ? 90 : view === 'back' ? -90 : 10;
  const muzzle = held(c, (cc) => {
    toon(cc, capsule([0, 0], [10, 0], 1.6), HULL, { line: 1, depth: 0.5, noLight: true });
    return 10;
  }, gunAt, angle, { depth: view === 'side' ? 1 : 0.5, flash });
  return { muzzle };
}

/** Torre Tesla: base, bobina de cobre e a esfera que brilha ao disparar. */
export function drawTesla(c, view, kind, k) {
  soft(c, ellipse(50, GROUND, 24, 5), SHADOW, 0.35, 1.6);
  if (kind === 'down') {
    toon(c, rrect(32, GROUND - 10, 36, 10, 3), HULL, { depth: 1 });
    toon(c, capsule([40, GROUND - 8], [70, GROUND - 16], 4), COPPER, { depth: 1 });
    return null;
  }
  const charge = kind === 'attack' ? [0.3, 1, 0.7, 0.2][k % 4] : 0.25 + 0.15 * Math.sin((k / 8) * Math.PI * 2);
  toon(c, poly([[30, GROUND - 2], [70, GROUND - 2], [64, GROUND - 14], [36, GROUND - 14]]), HULL, { depth: 2 });
  toon(c, rrect(44, 46, 12, 36, 4), '#5a6078', { depth: 1.5 });
  for (let i = 0; i < 4; i++) toon(c, ellipse(50, 74 - i * 8, 12 - i, 3.4), COPPER, { line: 1.2, depth: 0.8, light: '#ffd8a0' });
  soft(c, circle(50, 36, 14 + charge * 6), CYAN, 0.25 + charge * 0.4, 6);
  toon(c, circle(50, 36, 9), '#bff8ff', { depth: 1.5, light: '#ffffff' });
  if (charge > 0.6) {
    for (const [dx, dy] of [[-12, -6], [11, -9], [3, -15]]) line(c, [[50, 36], [50 + dx * 0.6, 36 + dy * 0.6 + 3], [50 + dx, 36 + dy]], CYAN, 1.6);
    c.save();
    c.translate(50, 30);
    muzzleFlash(c, 0.4);
    c.restore();
  }
  fill(c, circle(view === 'side' ? 54 : 47, 33, 2.4), '#ffffff', 0.8);
  return null;
}

export const SCIFI_COLORS = { HULL, CYAN, COPPER, darken };
