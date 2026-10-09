// Zumbis cartoon: Andarilho, Corredor e Brutamontes (o chefe). Pele esverdeada, roupa rasgada,
// braços esticados para a frente. Poses: andar (6), atacar (4); a morte usa o perfil girando.
import { anchors, BUILD } from './chibi.mjs';
import { capsule, circle, clipped, darken, ellipse, fill, intersect, poly, toon } from './ck.mjs';
import { zombieFace } from './face.mjs';
import { walkLegs } from './heroPoses.mjs';

/** Rasgos na barra da roupa (pele aparecendo) e manchas de sangue, só dentro do tronco. */
function rags(c, a, look, seed) {
  const [hx, hy] = a.hip;
  clipped(c, a.torsoPath, () => {
    const teeth = [];
    for (let i = 0; i <= 8; i++) teeth.push([hx - 16 + i * 4, hy + (i % 2 ? -3 - ((i * seed) % 3) : 1)]);
    fill(c, poly([...teeth, [hx + 16, hy + 8], [hx - 16, hy + 8]]), look.skin);
    fill(c, ellipse(hx + (seed % 2 ? 5 : -5), hy - 11, 3.4, 2.6), darken(look.skin, 0.05));
    fill(c, ellipse(hx - 4, hy - 6, 3.2, 2.4), '#b3263a', 0.85);
    fill(c, circle(hx - 1, hy - 3.5, 1.2), '#b3263a', 0.85);
  });
}

/** Tufos de cabelo ralo no alto da cabeça. */
function tufts(c, a, color, n = 3) {
  const [x, y] = a.head;
  for (let i = 0; i < n; i++) {
    const tx = x - 5 + i * 5;
    toon(c, poly([[tx - 2.4, y - 13], [tx + 0.6 + (i % 2 ? 2 : -2), y - 19], [tx + 2.4, y - 13.4]]), color, { line: 1.2, depth: 0.8, noLight: true });
  }
}

const walker = {
  skin: '#8fc46a', shirt: '#4a78b8', pants: '#5d6275', shoes: '#3a3440',
  head(c, a, look) {
    if (a.view === 'back') toon(c, intersect(a.headPath, ellipse(a.head[0] + 3, a.head[1] - 2, 5, 4)), '#d26a7a', { depth: 1, noLine: true });
    tufts(c, a, '#3a2a30');
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.3, stitches: true });
  },
  torso: (c, a, look) => rags(c, a, look, 3),
};

const runner = {
  stride: 6,
  skin: '#bdd27a', shirt: '#e3d6b5', sleeve: '#bdd27a', pants: '#3c6aa8', shoes: '#c8c8d8',
  build: { ...BUILD, torsoW: 21, armR: 3.4, handR: 3.5, legR: 4 },
  behind(c, a) {
    // Cabelo comprido e despenteado atrás da cabeça
    if (a.view === 'front') return;
    const [x, y] = a.head;
    toon(c, poly([[x - 13, y - 6], [x + 12, y - 8], [x + 10, y + 16], [x + 2, y + 12], [x - 4, y + 18], [x - 12, y + 10]]), '#2c2433', { depth: 2 });
  },
  head(c, a, look) {
    const [x, y] = a.head;
    toon(c, intersect(a.headPath, ellipse(x - (a.view === 'side' ? 3 : 0), y - 10, 18, 8)), '#2c2433', { depth: 1.5, noLine: true });
    if (a.view === 'back') toon(c, intersect(a.headPath, ellipse(x, y, 18, 18)), '#2c2433', { depth: 2, noLine: true });
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.5 });
  },
  torso: (c, a, look) => rags(c, a, look, 5),
};

/** Corpo grande do Brutamontes, reaproveitado pelos chefes dos outros mundos. */
export const BRUTE_BUILD = { headR: 12, torsoW: 40, torsoH: 25, legH: 12, legR: 7, armR: 7.2, handR: 6.6, footR: 7.2 };

const brute = {
  skin: '#9d92c4', shirt: '#d8c9a0', sleeve: '#9d92c4', pants: '#4e6a3a', shoes: '#2e2a36',
  build: BRUTE_BUILD,
  head(c, a, look) {
    const [x, y] = a.head;
    // Cérebro exposto no alto e olho vermelho brilhando
    toon(c, intersect(a.headPath, ellipse(x - 3, y - 10, 7, 4.5)), '#ff8fa8', { line: 1.2, depth: 1.2 });
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.4, glow: '#ff4d4d' });
  },
  torso(c, a, look) {
    rags(c, a, look, 7);
    if (a.view === 'back') return;
    // Músculos e cicatriz no peito
    clipped(c, a.torsoPath, () => {
      const [nx, ny] = a.neck;
      fill(c, ellipse(nx - 8, ny + 3, 8, 5), look.skin);
      fill(c, ellipse(nx + 8, ny + 3, 8, 5), look.skin);
      toon(c, capsule([nx - 3, ny + 2], [nx + 6, ny + 9], 0.9), '#b3263a', { line: 0.6, depth: 0.4, noLight: true });
    });
  },
};

export const ZOMBIE_LOOKS = { walker, runner, brute };

// Ataque: ergue os braços, avança, morde, volta.
const ATTACK = [
  { up: true, lean: -1, jaw: 0.2 },
  { reach: 6, lean: 3, jaw: 1, headDy: 1 },
  { reach: 4, lean: 2, jaw: 0.6, headDy: 2 },
  { reach: 1, lean: 0, jaw: 0.3 },
];

/** Pose de um zumbi (pelo look): braços esticados na direção em que anda. */
export function zombiePose(look, view, kind, k) {
  const b = look.build ?? BUILD;
  const legs = kind === 'walk' ? walkLegs(view, k, 8, look.stride ?? 4) : {};
  const at = kind === 'attack' ? ATTACK[k] : { reach: 0, lean: 1, jaw: 0.3 };
  const osc = kind === 'walk' ? Math.sin((k / 8) * Math.PI * 2) * 1.6 : 0;
  const base = anchors(b, view, { ...legs, lean: at.lean });
  const [nx, ny] = base.neck;
  const w = b.torsoW / 25;
  let hands;
  if (view === 'side') {
    const [sx, sy] = base.shoulderR;
    const reach = 13 * w + at.reach;
    hands = at.up ? { handR: [sx + 8, sy - 11], handL: [sx + 6, sy - 13] } : { handR: [sx + reach, sy + 1 + osc], handL: [sx + reach + 1, sy - 2 - osc] };
  } else if (view === 'front') {
    const down = at.up ? -9 : 9 + at.reach * 0.5;
    hands = { handL: [nx - 8 * w, ny + down + osc], handR: [nx + 8 * w, ny + down - 1 - osc] };
  } else {
    hands = { armsUp: true, handL: [nx - 9 * w, ny - 2 - (at.up ? 6 : 0) + osc], handR: [nx + 9 * w, ny - 3 - (at.up ? 6 : 0) - osc] };
  }
  return anchors(b, view, { ...legs, lean: at.lean + (view === 'side' ? 1.5 : 0), headDy: at.headDy ?? 0, sway: (legs.sway ?? 0) * 1.6, jaw: at.jaw, ...hands });
}
