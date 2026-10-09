// Visual e poses dos três heróis (olhando para a direita).
import { hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { featurePx } from './decals.mjs';
import {
  add, BASE_BODY, drawHumanoid, GROUND, headLocal, K, makePose, onHead, onTorso, rotatePose, settle, shoulderOf, torsoLocal, v,
} from './rig.mjs';
import { chainsaw, muzzleFlash, revolver, rifle, shotgun } from './weapons.mjs';

const ANKLE_Y = GROUND - 2;
const EYE_WHITE = hex('#e6dfd2');
const BREATH = [0, 0.4, 0.8, 0.4];

const mat = (ramp, part, extra = {}) => ({ ramp, part, edge: 2, noise: 0.03, ...extra });

function face(c, pose, look, brow) {
  const skin = look.mat.skin.ramp;
  const px = (lx, ly, color) => featurePx(c, pose, lx, ly, color);
  px(2, -1, EYE_WHITE);
  px(3, -1, P.outline);
  px(2, -2, brow);
  px(3, -2, brow);
  px(5, 0, skin[3]);
  px(4, 1, skin[1]);
  px(3, 3, P.lips[2]);
  px(-1, 0, skin[1]);
  px(-1, 1, skin[2]);
}

/** Pinta pixels da cabeça que passam no teste (coordenadas locais). */
const onHeadArea = (c, pose, test, ramp, shift = 0) =>
  c.recolor((x, y) => test(headLocal(pose, x, y)), ramp, { parts: ['skin'], shift });

function stanceHip(body, dy = 0, dx = 0) {
  return v(30 + dx, ANKLE_Y - (body.thigh + body.shin) * 0.95 + dy);
}

/** Pernas do ciclo de caminhada (6 quadros), usadas por quem avança (corpo a corpo). */
function walkLegs(body, i) {
  const phi = (i / 6) * Math.PI * 2;
  const hip = v(30, ANKLE_Y - (body.thigh + body.shin) * 0.93 + 0.8 * Math.cos(phi) ** 2);
  const foot = (p) => v(hip.x + 5.5 * Math.cos(p), ANKLE_Y - 3 * Math.max(0, -Math.sin(p)));
  return { hip, footF: foot(phi), footB: foot(phi + Math.PI) };
}

function downPose(body) {
  const pose = makePose(body, { hip: stanceHip(body), footF: v(33, ANKLE_Y), footB: v(28, ANKLE_Y), handF: v(5, -12), handB: v(-3, -13), headTilt: -0.2 });
  return settle(rotatePose(pose, v(30, ANKLE_Y), -1.57), body);
}

// ---------- Mira (sniper) ----------
const sniperBody = { ...BASE_BODY, chestR: 5.2, hipR: 4.6, headRx: 4.8, headRy: 5.4 };
const sniper = {
  body: sniperBody,
  mat: {
    skin: mat(P.skin, 'skin'),
    torso: mat(P.olive, 'shirt'),
    sleeve: mat(P.olive, 'shirt'),
    pants: mat(P.charcoal, 'pants'),
    shoes: mat(P.boots, 'shoes'),
  },
  torso(c, pose) {
    c.recolor((x, y) => Math.abs(torsoLocal(pose, x, y).t - 0.05) < 0.05, P.leather, { parts: ['shirt'] });
    c.capsule(onTorso(pose, 0.55, 3.5), onTorso(pose, 0.3, 3.8), 1.2 * K(pose), 1.2 * K(pose), mat(P.olive, 'pocket', { shift: -1 }));
  },
  head(c, pose, look) {
    onHeadArea(c, pose, (l) => l.y < -1.6 || (l.x < -0.6 && l.y < 3), P.hairAuburn);
    const k = K(pose);
    c.capsule(onHead(pose, -4, -2), onHead(pose, -8, 3), 1.7 * k, 0.9 * k, mat(P.hairAuburn, 'hair'));
    face(c, pose, look, P.hairAuburn[1]);
    c.capsule(onTorso(pose, 1.02, -2.6), onTorso(pose, 1.02, 2.6), 2.4 * k, 2.4 * k, mat(P.scarf, 'scarf'));
    c.capsule(onTorso(pose, 0.98, -3), onTorso(pose, 0.65, -6), 1.5 * k, 1 * k, mat(P.scarf, 'scarf'));
  },
  weapon(c, pose) {
    const w = pose.extra.weapon;
    w.muzzle = rifle(c, w.grip, w.ang, K(pose));
    if (w.flash) muzzleFlash(c, w.muzzle, w.ang, 1.1, K(pose));
  },
};

function sniperPose(kind, k) {
  const body = sniperBody;
  if (kind === 'idle') {
    const hip = stanceHip(body, BREATH[k]);
    const sh = shoulderOf(body, hip, 0.02);
    const ang = -0.65;
    const grip = add(sh, v(3, 9));
    return makePose(body, { hip, lean: 0.02, footF: v(35, ANKLE_Y), footB: v(25, ANKLE_Y), handBAt: grip, handFAt: add(grip, v(Math.cos(ang) * 9, Math.sin(ang) * 9)), extra: { weapon: { grip, ang } } });
  }
  const recoil = [0, -0.04, -0.16, -0.07][k];
  const back = [0, 0, -1, -0.5][k];
  const hip = stanceHip(body, 0.5, back);
  const sh = shoulderOf(body, hip, 0.06);
  const ang = -0.03 + recoil;
  const grip = add(sh, v(5, 1.5 + recoil * 6));
  return makePose(body, {
    hip, lean: 0.06, headTilt: 0.14, headForward: 2, footF: v(37, ANKLE_Y), footB: v(24, ANKLE_Y),
    handBAt: grip, handFAt: add(grip, v(Math.cos(ang) * 10, Math.sin(ang) * 10)), extra: { weapon: { grip, ang, flash: k === 1 } },
  });
}

// ---------- Xerife (sheriff) ----------
const sheriffBody = { ...BASE_BODY, chestR: 5.8, hipR: 5 };
const sheriff = {
  body: sheriffBody,
  mat: {
    skin: mat(P.skin, 'skin'),
    torso: mat(P.tan, 'shirt'),
    sleeve: mat(P.tan, 'shirt'),
    pants: mat(P.jeans, 'pants'),
    shoes: mat(P.boots, 'shoes'),
  },
  torso(c, pose) {
    c.recolor((x, y) => { const l = torsoLocal(pose, x, y); return l.s < 1.4 && l.t > 0.14; }, P.leather, { parts: ['shirt'] });
    c.recolor((x, y) => torsoLocal(pose, x, y).t < 0.12, P.leather, { parts: ['shirt'], shift: -1 });
    const k = K(pose);
    const b = k >= 2 ? 2 : 1;
    const block = (p, dx, dy, t) => {
      for (let yy = 0; yy < b; yy++) for (let xx = 0; xx < b; xx++) c.put(p.x + dx * b + xx, p.y + dy * b + yy, P.gold[t], t, 'gold');
    };
    block(onTorso(pose, 0.06, 4), 0, 0, 3);
    const star = onTorso(pose, 0.7, 0.4);
    for (const [dx, dy, t] of [[0, 0, 4], [1, 0, 3], [-1, 0, 3], [0, 1, 2], [0, -1, 3]]) block(star, dx, dy, t);
    c.capsule(onTorso(pose, 0.05, -4), onTorso(pose, -0.3, -4.5), 1.6 * k, 1.4 * k, mat(P.leather, 'holster'));
  },
  head(c, pose, look) {
    onHeadArea(c, pose, (l) => l.x < -1 && l.y < 1.5, P.hairDark);
    face(c, pose, look, P.hairDark[1]);
    for (const [x, y] of [[3, 2], [4, 2], [5, 2], [2, 3]]) featurePx(c, pose, x, y, P.hairDark[1]);
    c.polygon([onHead(pose, -4, -3.4), onHead(pose, -3.4, -8.6), onHead(pose, 3, -9), onHead(pose, 4, -3.4)], mat(P.hat, 'hat'), [-0.3, -0.5, 1]);
    const k = K(pose);
    c.capsule(onHead(pose, -7, -3.2), onHead(pose, 7.5, -3.4), 1.1 * k, 1 * k, mat(P.hat, 'hat', { shift: -1 }));
    c.capsule(onHead(pose, -3.6, -4.6), onHead(pose, 3.8, -4.8), 0.7 * k, 0.7 * k, mat(P.leather, 'hat', { shift: -1 }));
  },
  front(c, pose) {
    const w = pose.extra.weapon;
    w.muzzle = revolver(c, pose.armF.hand, w.ang, K(pose));
    if (w.flash) muzzleFlash(c, w.muzzle, w.ang, 0.9, K(pose));
  },
};

function sheriffPose(kind, k) {
  const body = sheriffBody;
  if (kind === 'idle') {
    const hip = stanceHip(body, BREATH[k]);
    return makePose(body, { hip, lean: 0.02, footF: v(35, ANKLE_Y), footB: v(25, ANKLE_Y), handF: v(3, 14), handB: v(-4, 12), extra: { weapon: { ang: 1.15 } } });
  }
  const recoil = [0, -0.12, -0.5, -0.22][k];
  const hip = stanceHip(body, 0.3, k === 2 ? -0.5 : 0);
  return makePose(body, {
    hip, lean: 0.04, footF: v(37, ANKLE_Y), footB: v(24, ANKLE_Y),
    handF: v(15, 1 + recoil * 5), handB: v(-4, 12), extra: { weapon: { ang: -0.04 + recoil, flash: k === 1 } },
  });
}

// ---------- Serra (chainsaw) ----------
const chainsawBody = {
  ...BASE_BODY, chestR: 6.8, hipR: 5.8, neckR: 2.6, headRx: 5.2, headRy: 5.6, thighR: 3.6, kneeR: 2.9, ankleR: 2.2,
  upperArmR: 2.9, elbowR: 2.5, wristR: 2.1, handR: 2.2,
};
const chainsawGuy = {
  body: chainsawBody,
  mat: {
    skin: mat(P.skinPale, 'skin'),
    torso: mat(P.flannel, 'shirt'),
    sleeve: mat(P.flannel, 'shirt'),
    forearm: mat(P.skinPale, 'skin'),
    pants: mat(P.khaki, 'pants'),
    shoes: mat(P.boots, 'shoes'),
  },
  torso(c, pose) {
    const cell = Math.round(4 * K(pose));
    c.recolor((x, y) => x % cell === 0 || y % cell === 0, P.flannel, { parts: ['shirt'], shift: -2 });
  },
  head(c, pose, look) {
    onHeadArea(c, pose, (l) => l.y > 0.8 && l.x > -2.6, P.beard);
    c.capsule(onHead(pose, 0.5, 4.2), onHead(pose, 3.4, 5.6), 2.2 * K(pose), 1.4 * K(pose), mat(P.beard, 'beard'));
    face(c, pose, look, P.beard[1]);
    featurePx(c, pose, 3, 3, P.beard[0]);
  },
  weapon(c, pose) {
    const w = pose.extra.weapon;
    w.muzzle = chainsaw(c, pose.armB.hand, w.ang, { blur: w.blur, tick: w.tick, k: K(pose) });
  },
};

const SAW = {
  idle: (k) => ({ hB: v(5, 11 + (k % 2) * 0.5), hF: v(10, 10 + (k % 2) * 0.5), ang: 0.15, tick: k }),
  attack: [
    { hB: v(6, 10), hF: v(11, 9), ang: 0.05 },
    { hB: v(2, -3), hF: v(6, -6), ang: -0.9 },
    { hB: v(9, 6), hF: v(14, 7), ang: 0.35, blur: true },
    { hB: v(8, 11), hF: v(12, 12), ang: 0.7 },
  ],
};

function chainsawPose(kind, k) {
  const body = chainsawBody;
  if (kind === 'walk') {
    const s = SAW.idle(k);
    return makePose(body, { ...walkLegs(body, k), lean: 0.12, handB: s.hB, handF: s.hF, extra: { weapon: { ang: s.ang, tick: k } } });
  }
  const s = kind === 'idle' ? SAW.idle(k) : SAW.attack[k];
  const hip = stanceHip(body, kind === 'idle' ? BREATH[k] * 0.5 : k === 2 ? 1 : 0, kind === 'idle' ? 0 : [0, -1, 1, 0.5][k]);
  return makePose(body, {
    hip, lean: kind === 'idle' ? 0.06 : [0.08, -0.08, 0.3, 0.2][k], footF: v(37, ANKLE_Y), footB: v(24, ANKLE_Y),
    handB: s.hB, handF: s.hF, extra: { weapon: { ang: s.ang, blur: s.blur, tick: s.tick ?? k } },
  });
}

// ---------- Bruno (escopeta) ----------
const shotgunBody = { ...BASE_BODY, chestR: 6, hipR: 5.1, upperArmR: 2.5, elbowR: 2.1 };
const bruno = {
  body: shotgunBody,
  mat: {
    skin: mat(P.skin, 'skin'),
    torso: mat(P.jeans, 'shirt', { shift: 1 }),
    sleeve: mat(P.jeans, 'shirt', { shift: 1 }),
    forearm: mat(P.skin, 'skin'),
    pants: mat(P.khaki, 'pants'),
    shoes: mat(P.boots, 'shoes'),
  },
  torso(c, pose) {
    // Jaqueta jeans aberta sobre camiseta escura e cinto de cartuchos na diagonal
    c.recolor((x, y) => { const l = torsoLocal(pose, x, y); return l.s > 1.6 && l.t > 0.2; }, P.charcoal, { parts: ['shirt'] });
    const k = K(pose);
    c.capsule(onTorso(pose, 0.95, -3), onTorso(pose, 0.15, 3.5), 1.1 * k, 1.1 * k, mat(P.leather, 'belt'));
    for (let i = 1; i < 6; i++) {
      const p = onTorso(pose, 0.95 - i * 0.14, -3 + i * 1.3);
      c.put(p.x, p.y, P.scarf[3], 3, 'shell');
    }
  },
  head(c, pose, look) {
    const k = K(pose);
    onHeadArea(c, pose, (l) => l.y > 1 && l.x > -2.4, P.hairDark, -1);
    face(c, pose, look, P.hairDark[1]);
    // Bandana vermelha com o nó atrás
    c.capsule(onHead(pose, -4.6, -2.6), onHead(pose, 4.4, -3.4), 1.6 * k, 1.5 * k, mat(P.scarf, 'bandana'));
    c.capsule(onHead(pose, -4.6, -2.4), onHead(pose, -7.5, 0.5), 1 * k, 0.7 * k, mat(P.scarf, 'bandana'));
    onHeadArea(c, pose, (l) => l.y < -3.6, P.hairDark);
  },
  weapon(c, pose) {
    const w = pose.extra.weapon;
    w.muzzle = shotgun(c, w.grip, w.ang, K(pose));
    if (w.flash) muzzleFlash(c, w.muzzle, w.ang, 1.3, K(pose));
  },
};

function shotgunPose(kind, k) {
  const body = shotgunBody;
  if (kind !== 'attack') {
    const hip = stanceHip(body, BREATH[k % 4]);
    const sh = shoulderOf(body, hip, 0.03);
    const ang = 0.5;
    const grip = add(sh, v(4, 9));
    return makePose(body, { hip, lean: 0.03, footF: v(35, ANKLE_Y), footB: v(25, ANKLE_Y), handBAt: grip, handFAt: add(grip, v(Math.cos(ang) * 9, Math.sin(ang) * 9)), extra: { weapon: { grip, ang } } });
  }
  // Disparo da cintura, com coice forte e o "pump" no último quadro
  const recoil = [0, -0.08, -0.3, -0.12][k];
  const pump = k === 3 ? -2 : 0;
  const hip = stanceHip(body, 0.6, k === 2 ? -1.5 : 0);
  const sh = shoulderOf(body, hip, 0.05);
  const ang = 0.02 + recoil;
  const grip = add(sh, v(6, 4 + recoil * 4));
  return makePose(body, {
    hip, lean: 0.05, footF: v(37, ANKLE_Y), footB: v(23, ANKLE_Y),
    handBAt: grip, handFAt: add(grip, v(Math.cos(ang) * (10 + pump), Math.sin(ang) * (10 + pump))), extra: { weapon: { grip, ang, flash: k === 1 } },
  });
}

export const HERO_LOOKS = {
  sniper: { look: sniper, pose: sniperPose, dropped: (c) => rifle(c, v(16, 60), 0) },
  sheriff: { look: sheriff, pose: sheriffPose, dropped: (c) => revolver(c, v(44, 61), 0) },
  shotgun: { look: bruno, pose: shotgunPose, dropped: (c) => shotgun(c, v(18, 60), 0) },
  chainsaw: { look: chainsawGuy, pose: chainsawPose, dropped: (c) => chainsaw(c, v(40, 57), 0) },
};

/** Quadros: parado (4), ataque (4), caído (1). Também devolve a boca da arma na mira. */
export function heroFrames({ look, pose, dropped }, layout) {
  const frames = [];
  let muzzle = null;
  const draw = (p) => {
    const c = new PixelCanvas(64, 64);
    drawHumanoid(c, p, look);
    frames.push(c);
    return p;
  };
  for (let k = 0; k < layout.idle.count; k++) draw(pose('idle', k));
  for (let k = 0; k < layout.attack.count; k++) {
    const p = draw(pose('attack', k));
    if (k === 0) muzzle = p.extra.weapon.muzzle;
  }
  const down = new PixelCanvas(64, 64);
  dropped(down);
  const noWeapon = { ...look, weapon: undefined, front: look === sheriff ? undefined : look.front };
  drawHumanoid(down, downPose(look.body), noWeapon);
  frames.push(down);
  // Atiradores nunca andam: o quadro de caminhada repete o parado.
  for (let k = 0; k < layout.walk.count; k++) draw(pose(look === chainsawGuy ? 'walk' : 'idle', look === chainsawGuy ? k : k % 4));
  return { frames, muzzle };
}
