// Zumbis de frente (descendo, a vista mais comum) e de costas. Mãos esticadas para a frente.
import { drips, rotPatches, splat, tears } from './decals.mjs';
import { dogView } from './dogViews.mjs';
import { drawFront, frontPose, frontWalk, onFace } from './frontRig.mjs';
import { P } from './palette.mjs';
import { headLocal, v } from './rig.mjs';
import { ZOMBIE_LOOKS } from './zombies.mjs';

const px = (c, p, color) => c.put(p.x, p.y, color, 1, 'face');
const headArea = (c, pose, test, ramp, shift = 0) => c.recolor((x, y) => test(headLocal(pose, x, y)), ramp, { parts: ['skin'], shift });

function zombieFace(c, pose, look, glow = P.eyeGlow) {
  const skin = look.mat.skin.ramp;
  rotPatches(c, pose.head, 5.5, P.rotRed, 0.33, 31);
  for (const [x, y, color] of [[-3, -2, skin[0]], [-2, -2, skin[0]], [-3, -1, skin[0]], [-2, -1, glow], [1, -2, skin[0]], [2, -2, skin[1]], [1, -1, P.eyeDim], [2, -1, skin[0]]]) px(c, onFace(pose, x, y), color);
  px(c, onFace(pose, 0, 1), skin[0]);
  for (const [x, y, color] of [[-1, 2, P.teeth], [0, 2, P.blood[0]], [1, 2, P.teeth], [-1, 3, P.blood[0]], [0, 3, P.blood[1]], [1, 3, P.blood[0]], [1, 4, P.blood[2]], [1, 5, P.blood[1]]]) px(c, onFace(pose, x, y), color);
}

function strands(c, pose, ramp, count, long) {
  for (let i = 0; i < count; i++) {
    const x = pose.head.x - 3.5 + (i * 7) / Math.max(1, count - 1);
    const top = v(x, pose.head.y - 4.5);
    c.capsule(top, v(x + (i % 2 ? 1 : -1) * 1.5, pose.head.y - 4.5 - 2 + long * (i % 2 ? 1.6 : 1.2)), 0.8, 0.5, { ramp, part: 'hair', dither: 0.4 });
  }
}

const walker = ZOMBIE_LOOKS.walker;
const walkerViews = {
  ...walker,
  frontTorso(c, pose) {
    tears(c, ['shirt'], P.rot, 0.3, 5);
    splat(c, v(pose.neck.x + 2, pose.neck.y + 5), 3.6, P.blood, ['shirt', 'skin'], 9);
    drips(c, v(pose.neck.x + 2, pose.neck.y + 7), 3, 4, 17);
  },
  backTorso(c, pose) {
    tears(c, ['shirt'], P.rot, 0.3, 6);
    splat(c, v(pose.neck.x - 2, pose.hip.y - 5), 3, P.blood, ['shirt'], 11, -1);
  },
  frontHead(c, pose, look) {
    zombieFace(c, pose, look);
    strands(c, pose, P.hairDark, 5, 0);
  },
  backHead(c, pose) {
    // Nuca careca com tufos de cabelo e um rasgo de pele
    headArea(c, pose, (l) => l.y < 0.5 || Math.abs(l.x) > 3, P.hairDark, -1);
    rotPatches(c, v(pose.head.x + 1.5, pose.head.y + 2), 2, P.rotRed, 0.45, 32);
    strands(c, pose, P.hairDark, 5, 0);
  },
};

const runner = ZOMBIE_LOOKS.runner;
const runnerViews = {
  ...runner,
  frontTorso(c, pose) {
    tears(c, ['shirt'], P.rotPale, 0.24, 41);
    splat(c, v(pose.neck.x - 1, pose.neck.y + 6), 4, P.blood, ['shirt', 'skin'], 43);
  },
  backTorso(c, pose) {
    tears(c, ['shirt'], P.rotPale, 0.24, 42);
  },
  frontHead(c, pose, look) {
    zombieFace(c, pose, look, P.eyeDim);
    headArea(c, pose, (l) => l.y < -2.5, P.hairDark);
    for (const s of [-1, 1]) c.capsule(v(pose.head.x + s * 3.8, pose.head.y - 3), v(pose.head.x + s * 4.6, pose.head.y + 8), 1.4, 0.9, { ramp: P.hairDark, part: 'hair', edge: 2 });
  },
  backHead(c, pose) {
    headArea(c, pose, () => true, P.hairDark);
    c.capsule(v(pose.head.x, pose.head.y), v(pose.head.x + 0.5, pose.head.y + 11), 4, 2.6, { ramp: P.hairDark, part: 'hair', edge: 2 });
  },
};

const brute = ZOMBIE_LOOKS.brute;
function tankTop(c, pose) {
  c.capsule(pose.hip, v(pose.hip.x, pose.hip.y - brute.body.torso * 0.55), brute.body.hipR * 1.1, brute.body.chestR * 1.05, { ramp: P.tankBeige, noise: 0.12, part: 'shirt', seed: 71 });
  tears(c, ['shirt'], P.deadFlesh, 0.33, 73);
}
const bruteViews = {
  ...brute,
  frontTorso(c, pose) {
    tankTop(c, pose);
    rotPatches(c, v(pose.neck.x + 3, pose.neck.y + 5), 4.5, P.muscle, 0.55, 79);
    for (let i = 0; i < 3; i++) c.line(Math.round(pose.neck.x - 4), Math.round(pose.neck.y + 4 + i * 2), Math.round(pose.neck.x - 1), Math.round(pose.neck.y + 4 + i * 2), P.bone[3], 'bone');
    splat(c, v(pose.hip.x + 2, pose.hip.y - 6), 4, P.blood, ['shirt', 'skin'], 83);
  },
  backTorso(c, pose) {
    tankTop(c, pose);
    rotPatches(c, v(pose.neck.x - 3, pose.neck.y + 6), 5, P.muscle, 0.5, 80);
  },
  frontHead(c, pose, look) {
    zombieFace(c, pose, look);
  },
  backHead(c, pose) {
    rotPatches(c, pose.head, 5, P.rotRed, 0.4, 102);
  },
};

const VIEW_LOOKS = { walker: walkerViews, runner: runnerViews, brute: bruteViews };

// Ataque: prepara (mãos para cima), avança, morde, recupera. Mãos relativas ao pescoço.
const FRONT_ATTACK = [
  { hands: [-5, -6], bob: 0, headDy: -1 },
  { hands: [-3, 9], bob: 2, headDy: 1 },
  { hands: [-4, 6], bob: 1, headDy: 2 },
  { hands: [-3, 7], bob: 0.5, headDy: 0 },
];

function zombiePose(id, view, kind, k) {
  const body = VIEW_LOOKS[id].body;
  const walk = kind === 'walk' ? frontWalk(k) : {};
  const sway = kind === 'walk' ? (walk.sway ?? 0) * 1.8 : 0;
  const a = kind === 'attack' ? FRONT_ATTACK[k] : { hands: [-3, 7], bob: 0, headDy: 0 };
  const base = frontPose(body, { ...walk, bob: (walk.bob ?? 0) + a.bob });
  const n = base.neck;
  if (view === 'back') {
    // De costas, os braços vão para a frente (longe da câmera): só as mãos aparecem acima dos ombros.
    const up = kind === 'attack' ? [-9, -4, -5, -6][k] : -4;
    return frontPose(body, { ...walk, sway, armsUp: true, handL: v(n.x - 5, n.y + up), handR: v(n.x + 5, n.y + up - 1), bob: (walk.bob ?? 0) + a.bob });
  }
  const [hx, hy] = a.hands;
  return frontPose(body, { ...walk, sway, headDx: sway * 0.6, headDy: a.headDy, bob: (walk.bob ?? 0) + a.bob, handL: v(n.x + hx, n.y + hy), handR: v(n.x - hx, n.y + hy - 1) });
}

/** Desenha um quadro de frente/costas. Rex (cachorro) tem esqueleto próprio. */
export function zombieViewFrame(c, id, view, kind, k) {
  if (id === 'dog') return dogView(c, view, kind, k);
  drawFront(c, zombiePose(id, view, kind, k), VIEW_LOOKS[id], view);
  return c;
}
