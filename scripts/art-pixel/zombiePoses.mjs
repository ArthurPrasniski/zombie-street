// Poses dos zumbis (olhando para a direita; o build espelha para a esquerda).
import { add, GROUND, makePose, rotatePose, settle, v } from './rig.mjs';

const ANKLE_Y = GROUND - 2;

function baseHip(body, x = 31) {
  return v(x, ANKLE_Y - (body.thigh + body.shin) * 0.93);
}

/** Ciclo de caminhada: o pé de apoio desliza para trás, o outro sobe e avança. */
export function walkPose(body, gait, i, n) {
  const phi = (i / n) * Math.PI * 2;
  const hip = add(baseHip(body), v(0, gait.bob * Math.cos(phi) ** 2));
  const foot = (p, lift) => v(hip.x + gait.stride * Math.cos(p), ANKLE_Y - lift * Math.max(0, -Math.sin(p)));
  return makePose(body, {
    hip,
    lean: gait.lean + gait.sway * Math.sin(phi * 2),
    headTilt: gait.headTilt + 0.05 * Math.sin(phi),
    headForward: gait.headForward,
    footF: foot(phi, gait.liftF),
    footB: foot(phi + Math.PI, gait.liftB),
    handF: gait.armF(phi),
    handB: gait.armB(phi),
    extra: { jaw: i % 3 !== 0 },
  });
}

// Ataque: prepara, avança, morde/arranha, recupera.
const ATTACK = [
  { lean: -0.15, dx: -1, tilt: -0.2, handF: v(5, -7), handB: v(3, -6), jaw: true },
  { lean: 0.25, dx: 2, tilt: 0.05, handF: v(14, 1), handB: v(12, 3), jaw: true },
  { lean: 0.38, dx: 3, tilt: 0.4, handF: v(10, 7), handB: v(8, 9), jaw: false },
  { lean: 0.1, dx: 1, tilt: 0.15, handF: v(9, 4), handB: v(4, 11), jaw: true },
];

export function attackPose(body, gait, k) {
  const a = ATTACK[k];
  const hip = add(baseHip(body), v(a.dx, k === 2 ? 1 : 0));
  return makePose(body, {
    hip,
    lean: gait.lean + a.lean,
    headTilt: gait.headTilt + a.tilt,
    headForward: gait.headForward + (k === 2 ? 1 : 0),
    footF: v(35, ANKLE_Y),
    footB: v(26, ANKLE_Y),
    handF: a.handF,
    handB: a.handB,
    extra: { jaw: a.jaw },
  });
}

// Queda para trás: tranco, joelhos cedem, caindo, no chão, no chão com poça.
const DEATH = [
  { ang: 0, dy: 0, lean: -0.25, tilt: -0.5, handF: v(4, -10), handB: v(-4, -9) },
  { ang: -0.15, dy: 4, lean: -0.35, tilt: -0.4, handF: v(7, -4), handB: v(-7, -3) },
  { ang: -0.8, dy: 3, lean: -0.2, tilt: -0.3, handF: v(6, -9), handB: v(-5, -8) },
  { ang: -1.5, dy: 1, lean: -0.05, tilt: -0.2, handF: v(3, -14), handB: v(-2, -15) },
  { ang: -1.57, dy: 0.5, lean: 0, tilt: -0.15, handF: v(6, -14), handB: v(0, -16) },
];

export function deathPose(body, gait, k) {
  const d = DEATH[k];
  const hip = add(baseHip(body), v(0, d.dy));
  const pose = makePose(body, {
    hip,
    lean: d.lean,
    headTilt: d.tilt,
    headForward: 0.5,
    footF: v(36, ANKLE_Y),
    footB: v(27, ANKLE_Y),
    handF: d.handF,
    handB: d.handB,
    extra: { jaw: k < 3, dead: k >= 3 },
  });
  if (k === 0) return pose;
  return settle(rotatePose(pose, v(31, ANKLE_Y), d.ang), body);
}
