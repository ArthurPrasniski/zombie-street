// Heróis: Mira (rifle), Xerife (revólver), Bruno (escopeta) e Serra (motosserra).
// Cada look define cores e ganchos por vista (cabelo, chapéu, barba, colete) para o chibi.
import { capsule, circle, clipped, darken, ellipse, fill, intersect, line, minus, poly, rrect, toon, union } from './ck.mjs';
import { blob } from './ck.mjs';
import { heroFace } from './face.mjs';
import { chainsaw, held, revolver, rifle, shotgun } from './weapons.mjs';

/** Parte de cima da cabeça (cabelo, boné): cabeça ∩ elipse deslocada para cima. */
const cap = (a, r, drop, widen = 1.15) => intersect(a.headPath, ellipse(a.head[0], a.head[1] - drop, r * widen, r));

/** Cabelo em volta do rosto: a cabeça menos o oval do rosto (de frente ou de perfil). */
const hairline = (a, faceRx = 10.5, faceRy = 11, dy = 4.5) => minus(a.headPath, ellipse(a.head[0] + (a.view === 'side' ? 5 : 0), a.head[1] + dy, faceRx, faceRy));

/** Arma da pose (a.s.weapon = { grip, angle, depth, flash, tick }); guarda a boca do cano em a.muzzle. */
const weapon = (draw) => (c, a) => {
  const w = a.s.weapon;
  if (w) a.muzzle = held(c, draw, w.grip, w.angle, w);
};

const mira = {
  skin: '#f2c49b', shirt: '#3f9a5a', pants: '#2f3b66', shoes: '#5a3a28',
  head(c, a, look) {
    const r = 15;
    const hair = '#b5502c';
    if (a.view === 'back') {
      toon(c, cap(a, r, 2, 1.2), hair, { depth: 2.5 });
      toon(c, capsule([a.head[0], a.head[1] + 4], [a.head[0] + 1, a.head[1] + 16], 3.6, 2.4), hair, { depth: 1.6 });
    } else if (a.view === 'side') {
      toon(c, capsule([a.head[0] - 12, a.head[1] - 2], [a.head[0] - 17, a.head[1] + 10], 3.4, 2.2), hair, { depth: 1.6 });
      toon(c, hairline(a, 9, 10.5, 5), hair, { depth: 2, noLine: true });
      heroFace(c, a, look, { brow: darken(hair, 0.4) });
    } else {
      toon(c, hairline(a), hair, { depth: 2, noLine: true });
      // Franja de lado
      toon(c, blob([[a.head[0] - 3, a.head[1] - 12], [a.head[0] + 10, a.head[1] - 8], [a.head[0] + 4, a.head[1] - 5.5], [a.head[0] - 4, a.head[1] - 7]]), hair, { line: 1.2, depth: 1 });
      heroFace(c, a, look, { brow: darken(hair, 0.4) });
    }
  },
  torso(c, a) {
    // Cachecol vermelho
    const [x, y] = a.neck;
    toon(c, capsule([x - 8, y + 1.5], [x + 8, y + 1.5], 3.4), '#e0453a', { depth: 1.6 });
    if (a.view !== 'front') toon(c, capsule([x + (a.view === 'side' ? -6 : 3), y + 3], [x + (a.view === 'side' ? -9 : 4), y + 12], 2.2, 1.8), '#c23a31', { depth: 1 });
  },
  weapon: weapon(rifle),
};

function hat(c, a, shade) {
  const [x, y] = a.head;
  const brown = darken('#a86a32', shade);
  const side = a.view === 'side';
  toon(c, ellipse(x + (side ? 1 : 0), y - 9, side ? 18 : 21, side ? 4.6 : 6), brown, { depth: 2 });
  toon(c, rrect(x - 10 + (side ? 1 : 0), y - 21, 20, 13, 6), brown, { depth: 2.2 });
  fill(c, rrect(x - 10 + (side ? 1 : 0), y - 12.5, 20, 3, 1.5), '#3a2416');
}

const sheriff = {
  skin: '#e8b48a', shirt: '#f0dfb8', pants: '#3a5a9a', shoes: '#4a2c1c', sleeve: '#f0dfb8',
  head(c, a, look) {
    if (a.view !== 'back') {
      heroFace(c, a, look, { brow: '#4a2a18', mouth: 'grim' });
      // Bigode
      const [x, y] = a.head;
      if (a.view === 'front') toon(c, poly([[x - 6, y + 8.5], [x, y + 6.6], [x + 6, y + 8.5], [x + 4, y + 9.6], [x, y + 8.4], [x - 4, y + 9.6]]), '#5a3420', { line: 1.2, depth: 0.8 });
      else toon(c, ellipse(x + 10.5, y + 7.5, 3.2, 1.6), '#5a3420', { line: 1.2, depth: 0.6 });
    }
    hat(c, a, a.view === 'back' ? 0.15 : 0);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    const [hx, hy] = a.hip;
    const vest = '#7a4a2a';
    if (a.view === 'back') {
      toon(c, intersect(a.torsoPath, rrect(nx - 14, ny - 2, 28, hy - ny + 4, 6)), vest, { depth: 2.4, noLine: true });
      return;
    }
    if (a.view === 'side') {
      toon(c, intersect(a.torsoPath, rrect(nx - 10, ny, 12, hy - ny + 4, 3)), vest, { depth: 2, noLine: true });
      return;
    }
    for (const s of [-1, 1]) toon(c, intersect(a.torsoPath, poly([[nx + s * 2.5, ny - 2], [nx + s * 16, ny - 2], [hx + s * 16, hy + 4], [hx + s * 4, hy + 4]])), vest, { depth: 2, noLine: true });
    star(c, nx - 7, ny + 8);
  },
  weapon: weapon(revolver),
};

function star(c, x, y) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 1.6 : 3.6;
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push([x + Math.cos(ang) * r, y + Math.sin(ang) * r]);
  }
  toon(c, poly(pts), '#ffd23f', { line: 1, depth: 0.8, light: '#fff3a8' });
}

const bruno = {
  skin: '#a86b45', shirt: '#3d7bd6', pants: '#8a7550', shoes: '#3a2a20',
  head(c, a, look) {
    const red = '#e03a3a';
    const [x, y] = a.head;
    // Cabelo curto nas laterais, bandana por cima
    toon(c, hairline(a, 11, 12, 6), '#1e1410', { depth: 1.5, noLine: true });
    toon(c, intersect(a.headPath, ellipse(x, y - 11.5, 19, 8.6)), red, { depth: 2 });
    if (a.view !== 'back') heroFace(c, a, look, { brow: '#2a1a12', mouth: 'grim', angry: true });
    for (let i = 0; i < 4; i++) fill(c, circle(x - 8 + i * 5 + (a.view === 'side' ? 2 : 0), y - 9 + (i % 2), 0.9), '#ffe0e0');
    if (a.view !== 'front') {
      const kx = a.view === 'side' ? x - 13 : x + 2;
      toon(c, capsule([kx, y - 5], [kx - 3, y + 4], 2.2, 1.4), red, { depth: 1 });
      toon(c, capsule([kx, y - 5], [kx + 2, y + 5], 2, 1.3), darken(red, 0.15), { depth: 1 });
    }
  },
  torso(c, a) {
    // Cinto de cartuchos na diagonal
    const [nx, ny] = a.neck;
    const [hx, hy] = a.hip;
    if (a.view === 'side') return;
    const flip = a.view === 'back' ? -1 : 1;
    const belt = intersect(a.torsoPath, capsule([nx - 10 * flip, ny + 1], [hx + 11 * flip, hy - 1], 2.4));
    toon(c, belt, '#6b4426', { depth: 1, noLine: true });
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      fill(c, rrect(nx - 10 * flip + (21 * flip) * t - 0.8, ny + 1 + (hy - ny - 2) * t - 1.6, 1.6, 3.2, 0.8), '#ffcf4a');
    }
  },
  weapon: weapon(shotgun),
};

const serra = {
  skin: '#f0b890', shirt: '#d0423a', pants: '#34507f', shoes: '#4a2c1c',
  head(c, a, look) {
    const [x, y] = a.head;
    const beard = '#c8642c';
    if (a.view === 'back') {
      toon(c, intersect(a.headPath, ellipse(x, y + 10, 18, 8)), beard, { depth: 1.5, noLine: true });
      return;
    }
    // Barba contornando o queixo; a boca aparece por cima
    const side = a.view === 'side';
    const jaw = union(intersect(a.headPath, ellipse(x + (side ? 5 : 0), y + 12, side ? 13 : 16, 7.5)), ellipse(x + (side ? 8 : 0), y + 13.5, side ? 6 : 8.5, 5.5));
    toon(c, jaw, beard, { depth: 1.8 });
    heroFace(c, a, look, { brow: beard, mouth: 'shout' });
    // Careca brilhando
    fill(c, ellipse(x - 5, y - 9, 4, 2.2), '#ffffff', 0.35);
  },
  torso(c, a) {
    // Xadrez: linhas escuras sobre a camisa
    const [nx, ny] = a.neck;
    const [, hy] = a.hip;
    clipped(c, a.torsoPath, () => {
      for (let i = -3; i <= 3; i++) {
        line(c, [[nx + i * 4.5, ny - 2], [nx + i * 4.5, hy + 4]], '#7a1f22', 1.1, 0.5);
        if (i > -2 && i < 2) line(c, [[nx - 16, ny + 5 + (i + 1) * 6], [nx + 16, ny + 5 + (i + 1) * 6]], '#7a1f22', 1.1, 0.5);
      }
    });
    toon(c, intersect(a.torsoPath, rrect(nx - 20, ny - 3, 40, 4, 2)), '#a83230', { depth: 1, noLine: true });
  },
  weapon: weapon(chainsaw),
};

export const HERO_LOOKS = { sniper: mira, sheriff, shotgun: bruno, chainsaw: serra };
