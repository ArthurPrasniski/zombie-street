// Heróis de frente e de costas. De costas eles miram para cima (de onde vêm os zumbis);
// de frente, para baixo. Reaproveita materiais e armas da vista de perfil.
import { featurePx } from './decals.mjs';
import { drawFront, frontPose, frontWalk, onFace } from './frontRig.mjs';
import { HERO_LOOKS } from './heroes.mjs';
import { P } from './palette.mjs';
import { headLocal, v } from './rig.mjs';
import { chainsaw, muzzleFlash, revolver, rifle, shotgun } from './weapons.mjs';

const EYE = [0xe6, 0xdf, 0xd2, 255];
const UP = -Math.PI / 2;
const DOWN = Math.PI / 2;
const BREATH = [0, 0.4, 0.8, 0.4];
// Armas apontando para o fundo/para a câmera ficam mais curtas na tela.
const DEPTH = 0.6;

const px = (c, p, color) => c.put(p.x, p.y, color, 1, 'face');

function face(c, pose, look, brow) {
  const skin = look.mat.skin.ramp;
  for (const s of [-1, 1]) {
    px(c, onFace(pose, s * 2 - 0.5 + (s > 0 ? 0 : 0), -1), EYE);
    px(c, onFace(pose, s * 2 + (s > 0 ? 0.5 : -0.5), -1), P.outline);
    px(c, onFace(pose, s * 2, -2), brow);
  }
  px(c, onFace(pose, 0, 1), skin[1]);
  px(c, onFace(pose, -1, 3), P.lips[2]);
  px(c, onFace(pose, 0, 3), P.lips[2]);
}

/** Pinta pixels da cabeça pelo teste em coordenadas locais (de frente, sem giro). */
const headArea = (c, pose, test, ramp, shift = 0) => c.recolor((x, y) => test(headLocal(pose, x, y)), ramp, { parts: ['skin'], shift });

/** Arma com clarão opcional: sobe de costas, desce de frente. */
function gun(draw, flashSize) {
  return (c, pose) => {
    const w = pose.extra.weapon;
    if (!w) return;
    w.muzzle = draw(c, w.grip, w.ang, 1, DEPTH);
    if (w.flash) muzzleFlash(c, w.muzzle, w.ang, flashSize);
  };
}

/** Pose genérica de atirador: parado (segura a arma), ataque (mira, dispara, coice), andando. */
function shooterPose(body, view, kind, k, gripOffset) {
  const base = frontPose(body, kind === 'walk' ? frontWalk(k) : { bob: kind === 'idle' ? BREATH[k] * 0.5 : 0 });
  if (kind !== 'attack') {
    const grip = v(base.handR.x, base.handR.y);
    return frontPose(body, { ...(kind === 'walk' ? frontWalk(k) : { bob: BREATH[k] * 0.5 }), extra: { weapon: { grip, ang: view === 'back' ? UP + 0.35 : DOWN - 0.35 } } });
  }
  const recoil = [0, 0.5, 2, 1][k];
  if (view === 'back') {
    const neckY = base.neck.y;
    // Arma no ombro direito, com o cano subindo ao lado da cabeça
    const grip = v(36.5, neckY + 1 + recoil);
    return frontPose(body, { armsUp: true, handL: v(32.5, neckY - 2 + recoil), handR: v(37.5, neckY - 1 + recoil), extra: { weapon: { grip, ang: UP, flash: k === 1 } } });
  }
  const grip = v(32 + gripOffset, base.neck.y + 6 - recoil);
  return frontPose(body, { handL: v(30, grip.y + 1), handR: v(34, grip.y), extra: { weapon: { grip, ang: DOWN, flash: k === 1 } } });
}

// ---------- Mira ----------
const sniper = HERO_LOOKS.sniper.look;
const sniperViews = {
  ...sniper,
  frontHead(c, pose, look) {
    headArea(c, pose, (l) => l.y < -1.5 || (Math.abs(l.x) > 3.4 && l.y < 3), P.hairAuburn);
    face(c, pose, look, P.hairAuburn[1]);
    c.capsule(v(pose.neck.x - 4.5, pose.neck.y + 1), v(pose.neck.x + 4.5, pose.neck.y + 1), 2.2, 2.2, { ramp: P.scarf, part: 'scarf', edge: 2 });
  },
  backHead(c, pose) {
    headArea(c, pose, () => true, P.hairAuburn);
    c.capsule(v(pose.head.x, pose.head.y + 3), v(pose.head.x + 0.5, pose.head.y + 10), 1.8, 1.1, { ramp: P.hairAuburn, part: 'hair', edge: 2 });
    c.capsule(v(pose.neck.x - 4.5, pose.neck.y + 1), v(pose.neck.x + 4.5, pose.neck.y + 1), 2.2, 2.2, { ramp: P.scarf, part: 'scarf', edge: 2 });
    c.capsule(v(pose.neck.x + 2, pose.neck.y + 2), v(pose.neck.x + 3, pose.neck.y + 9), 1.4, 1, { ramp: P.scarf, part: 'scarf', edge: 2 });
  },
  frontWeapon: gun(rifle, 1.1),
  backWeapon: gun(rifle, 1.1),
};

// ---------- Xerife ----------
const sheriff = HERO_LOOKS.sheriff.look;
function hat(c, pose, shade) {
  const h = pose.head;
  const mat = { ramp: P.hat, part: 'hat', edge: 2, shift: shade };
  c.ellipse(h.x, h.y - 2.5, 7.5, 2.4, mat);
  c.polygon([v(h.x - 4, h.y - 3), v(h.x - 3.4, h.y - 8.5), v(h.x + 3.4, h.y - 8.5), v(h.x + 4, h.y - 3)], mat, [-0.3, -0.5, 1]);
  c.capsule(v(h.x - 3.8, h.y - 4.3), v(h.x + 3.8, h.y - 4.3), 0.7, 0.7, { ramp: P.leather, part: 'hat', shift: -1 });
}
const sheriffViews = {
  ...sheriff,
  frontTorso(c, pose) {
    const n = pose.neck;
    c.capsule(v(n.x - 3.4, n.y + 2), v(pose.hip.x - 3.2, pose.hip.y - 1), 2.3, 2.6, { ramp: P.leather, part: 'vest', edge: 1 });
    c.capsule(v(n.x + 3.4, n.y + 2), v(pose.hip.x + 3.2, pose.hip.y - 1), 2.3, 2.6, { ramp: P.leather, part: 'vest', edge: 1 });
    for (const [dx, dy, t] of [[0, 0, 4], [1, 0, 3], [-1, 0, 3], [0, 1, 2], [0, -1, 3]]) c.put(n.x - 3 + dx, n.y + 5 + dy, P.gold[t], t, 'gold');
    c.capsule(v(pose.hip.x - 5, pose.hip.y), v(pose.hip.x + 5, pose.hip.y), 1, 1, { ramp: P.leather, part: 'belt', shift: -1 });
    c.put(pose.hip.x, pose.hip.y, P.gold[3], 3, 'gold');
  },
  backTorso(c, pose) {
    c.recolor(() => true, P.leather, { parts: ['shirt'] });
  },
  frontHead(c, pose, look) {
    face(c, pose, look, P.hairDark[1]);
    for (const dx of [-2, -1, 0, 1, 2]) px(c, onFace(pose, dx, 2), P.hairDark[1]);
    hat(c, pose, 0);
  },
  backHead(c, pose) {
    headArea(c, pose, (l) => l.y > -1, P.hairDark);
    hat(c, pose, -1);
  },
  frontWeapon: gun(revolver, 0.9),
  backWeapon: gun(revolver, 0.9),
};

// ---------- Bruno ----------
const bruno = HERO_LOOKS.shotgun.look;
const brunoViews = {
  ...bruno,
  frontTorso(c, pose) {
    c.recolor((x, y) => Math.abs(x + 0.5 - pose.neck.x) < 2.2 && y > pose.neck.y, P.charcoal, { parts: ['shirt'] });
    c.capsule(v(pose.neck.x - 4, pose.neck.y + 2), v(pose.hip.x + 4.5, pose.hip.y - 1), 1.1, 1.1, { ramp: P.leather, part: 'belt' });
  },
  backTorso(c, pose) {
    c.capsule(v(pose.neck.x + 4, pose.neck.y + 2), v(pose.hip.x - 4.5, pose.hip.y - 1), 1.1, 1.1, { ramp: P.leather, part: 'belt' });
  },
  frontHead(c, pose, look) {
    headArea(c, pose, (l) => l.y > 1, P.hairDark, -1);
    face(c, pose, look, P.hairDark[1]);
    c.capsule(v(pose.head.x - 4.6, pose.head.y - 3), v(pose.head.x + 4.6, pose.head.y - 3), 1.5, 1.5, { ramp: P.scarf, part: 'bandana', edge: 2 });
  },
  backHead(c, pose) {
    headArea(c, pose, () => true, P.hairDark);
    c.capsule(v(pose.head.x - 4.6, pose.head.y - 3), v(pose.head.x + 4.6, pose.head.y - 3), 1.5, 1.5, { ramp: P.scarf, part: 'bandana', edge: 2 });
    c.capsule(v(pose.head.x, pose.head.y - 2), v(pose.head.x - 2, pose.head.y + 3), 0.9, 0.7, { ramp: P.scarf, part: 'bandana' });
  },
  frontWeapon: gun(shotgun, 1.3),
  backWeapon: gun(shotgun, 1.3),
};

// ---------- Serra ----------
const serra = HERO_LOOKS.chainsaw.look;
const plaid = (c) => c.recolor((x, y) => x % 4 === 0 || y % 4 === 0, P.flannel, { parts: ['shirt'], shift: -2 });
const saw = (c, pose) => {
  const w = pose.extra.weapon;
  if (w) chainsaw(c, w.grip, w.ang, { blur: w.blur, tick: w.tick, depth: DEPTH });
};
const serraViews = {
  ...serra,
  frontTorso: plaid,
  backTorso: plaid,
  frontHead(c, pose, look) {
    headArea(c, pose, (l) => l.y > 0.8, P.beard);
    c.ellipse(pose.head.x, pose.head.y + 4.5, 3.6, 2.4, { ramp: P.beard, part: 'beard', edge: 2 });
    face(c, pose, look, P.beard[1]);
  },
  backHead(c, pose) {
    headArea(c, pose, (l) => l.y > 2.5, P.beard, -1);
  },
  frontWeapon: saw,
  backWeapon: saw,
};

function sawPose(body, view, kind, k) {
  const legs = kind === 'walk' ? frontWalk(k) : { bob: kind === 'idle' ? BREATH[k] * 0.5 : 0 };
  const base = frontPose(body, legs);
  const neckY = base.neck.y;
  if (kind === 'attack' && k === 1) {
    // Prepara: motosserra acima da cabeça
    return frontPose(body, { ...legs, armsUp: view === 'back', handL: v(29.5, neckY - 6), handR: v(34.5, neckY - 7), extra: { weapon: { grip: v(33, neckY - 5), ang: UP - 0.25, tick: k } } });
  }
  const strike = kind === 'attack' && k === 2;
  const ang = view === 'back' ? (strike ? UP - 0.9 : UP + 0.2) : strike ? DOWN + 0.5 : DOWN - 0.2;
  const grip = view === 'back' ? v(36, base.hip.y - 4) : v(33, base.hip.y - 2);
  return frontPose(body, { ...legs, handL: v(grip.x - 4, grip.y + 1), handR: v(grip.x + 1, grip.y), extra: { weapon: { grip, ang, blur: strike, tick: k } } });
}

const VIEW_LOOKS = { sniper: sniperViews, sheriff: sheriffViews, shotgun: brunoViews, chainsaw: serraViews };
const GRIP_OFFSET = { sniper: 1, sheriff: 2, shotgun: 1 };

/** Pose de frente/costas de um herói. kind: idle, attack, walk. */
export function heroViewPose(id, view, kind, k) {
  const body = VIEW_LOOKS[id].body;
  if (id === 'chainsaw') return sawPose(body, view, kind, k);
  return shooterPose(body, view, kind, k, GRIP_OFFSET[id]);
}

export function drawHeroView(c, id, view, pose) {
  drawFront(c, pose, VIEW_LOOKS[id], view);
}
