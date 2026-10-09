// Esqueleto 2D visto de lado (olhando para a direita): poses por IK e desenho em camadas.
import { P } from './palette.mjs';

export const GROUND = 62;

export const v = (x, y) => ({ x, y });
export const add = (a, b) => v(a.x + b.x, a.y + b.y);
export const lerp = (a, b, t) => v(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
export const rot = (p, ang) => v(p.x * Math.cos(ang) - p.y * Math.sin(ang), p.x * Math.sin(ang) + p.y * Math.cos(ang));
export const rotateAround = (p, c, ang) => add(c, rot(v(p.x - c.x, p.y - c.y), ang));
// A cabeça fica no pixel inteiro para o rosto não tremer entre quadros.
const snap = (p) => v(Math.round(p.x), Math.round(p.y));

/** IK de dois ossos. bend = -1 dobra para a frente (joelho), +1 para trás (cotovelo). */
export function ik(root, target, l1, l2, bend) {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const len = Math.hypot(dx, dy) || 1e-6;
  const dist = Math.max(0.01, Math.min(len, l1 + l2 - 0.05));
  const base = Math.atan2(dy, dx);
  const cos = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const ang = base + bend * Math.acos(Math.max(-1, Math.min(1, cos)));
  const mid = v(root.x + l1 * Math.cos(ang), root.y + l1 * Math.sin(ang));
  const end = v(root.x + (dx / len) * dist, root.y + (dy / len) * dist);
  return { mid, end };
}

/**
 * Escala de desenho da pose: 1 nas sprites do jogo (quadro de 64 px), maior na arte do pôster.
 * Offsets locais e raios de detalhes são escritos em pixels de escala 1 e multiplicados por ela.
 */
export const K = (pose) => pose.k ?? 1;

/** Ponto em coordenadas locais da cabeça (x para a frente, y para baixo), já girado. */
export const onHead = (pose, lx, ly) => add(pose.head, rot(v(lx * K(pose), ly * K(pose)), pose.headAng));

/** Ponto ao longo do tronco: t = 0 no quadril, 1 no pescoço; s positivo = frente. */
export function onTorso(pose, t, s) {
  const p = lerp(pose.hip, pose.neck, t);
  return add(p, rot(v(s * K(pose), 0), pose.lean));
}

export function scaleBody(body, k) {
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, value * k]));
}

/** Amplia a pose (e a empunhadura da arma) em volta da origem do quadro. */
export function scalePose(pose, k) {
  const m = (p) => v(p.x * k, p.y * k);
  const limb = (l) => Object.fromEntries(Object.entries(l).map(([key, p]) => [key, m(p)]));
  const weapon = pose.extra.weapon;
  return {
    ...pose,
    k,
    hip: m(pose.hip),
    neck: m(pose.neck),
    head: snap(m(pose.head)),
    legB: limb(pose.legB),
    legF: limb(pose.legF),
    armB: limb(pose.armB),
    armF: limb(pose.armF),
    extra: { ...pose.extra, ...(weapon?.grip ? { weapon: { ...weapon, grip: m(weapon.grip) } } : {}) },
  };
}

/** Desenha a pose na escala k com o mesmo visual (corpo ampliado junto). */
export function scaledLook(look, k) {
  return k === 1 ? look : { ...look, body: scaleBody(look.body, k), k };
}

/**
 * Monta as juntas a partir de alvos: quadril, inclinação do tronco, pés e mãos.
 * Os alvos das mãos são relativos ao ombro; os dos pés, absolutos.
 */
export function makePose(body, s) {
  const hip = s.hip;
  const neck = add(hip, rot(v(0, -body.torso), s.lean ?? 0));
  const headAng = (s.lean ?? 0) + (s.headTilt ?? 0);
  const head = snap(add(neck, rot(v(s.headForward ?? 1, -(body.neck + body.headRy)), headAng)));
  const shoulder = lerp(neck, hip, 0.12);
  const leg = (offset, foot, bend = -1) => {
    const root = add(hip, v(offset, 0));
    const { mid, end } = ik(root, foot, body.thigh, body.shin, bend);
    return { hip: root, knee: mid, ankle: end };
  };
  const arm = (offset, hand, bend = 1, at = null) => {
    const root = add(shoulder, v(offset, 0));
    const { mid, end } = ik(root, at ?? add(root, hand), body.upperArm, body.forearm, bend);
    return { shoulder: root, elbow: mid, wrist: end };
  };
  return {
    hip,
    neck,
    head,
    headAng,
    lean: s.lean ?? 0,
    legB: leg(-1.5, s.footB, s.kneeBendB ?? -1),
    legF: leg(1.5, s.footF, s.kneeBendF ?? -1),
    armB: arm(-1, s.handB, s.elbowBendB ?? 1, s.handBAt),
    armF: arm(1, s.handF, s.elbowBendF ?? 1, s.handFAt),
    extra: s.extra ?? {},
  };
}

/** Ombro calculado como no makePose, para mirar armas antes de montar a pose. */
export function shoulderOf(body, hip, lean = 0) {
  const neck = add(hip, rot(v(0, -body.torso), lean));
  return lerp(neck, hip, 0.12);
}

/** Coordenadas locais da cabeça para um pixel (inverso de onHead). */
export function headLocal(pose, x, y) {
  const l = rot(v(x + 0.5 - pose.head.x, y + 0.5 - pose.head.y), -pose.headAng);
  return v(l.x / K(pose), l.y / K(pose));
}

/** Coordenadas locais do tronco para um pixel: t ao longo do eixo, s para a frente. */
export function torsoLocal(pose, x, y) {
  const axis = v(pose.neck.x - pose.hip.x, pose.neck.y - pose.hip.y);
  const len = Math.hypot(axis.x, axis.y);
  const d = v(x + 0.5 - pose.hip.x, y + 0.5 - pose.hip.y);
  return { t: (d.x * axis.x + d.y * axis.y) / (len * len), s: (d.x * -axis.y + d.y * axis.x) / len / K(pose) };
}

/** Encosta o corpo no chão e centraliza no quadro (corpos caídos). */
export function settle(pose, body) {
  const pts = [
    [pose.hip, body.hipR], [pose.neck, body.chestR], [pose.head, body.headRy],
    [pose.legB.knee, body.kneeR], [pose.legF.knee, body.kneeR], [pose.legB.ankle, body.ankleR + 1], [pose.legF.ankle, body.ankleR + 1],
    [pose.armB.wrist, body.handR], [pose.armF.wrist, body.handR], [pose.armB.elbow, body.elbowR], [pose.armF.elbow, body.elbowR],
  ];
  const bottom = Math.max(...pts.map(([p, r]) => p.y + r));
  const minX = Math.min(...pts.map(([p, r]) => p.x - r));
  const maxX = Math.max(...pts.map(([p, r]) => p.x + r));
  return rotatePose(pose, pose.hip, 0, v(32 - (minX + maxX) / 2, GROUND - 0.5 - bottom));
}

/** Gira a pose inteira em volta de um ponto (quedas e corpos caídos). */
export function rotatePose(pose, center, ang, offset = v(0, 0)) {
  const map = (p) => add(rotateAround(p, center, ang), offset);
  const limb = (l) => Object.fromEntries(Object.entries(l).map(([k, p]) => [k, map(p)]));
  return {
    ...pose,
    hip: map(pose.hip),
    neck: map(pose.neck),
    head: snap(map(pose.head)),
    headAng: pose.headAng + ang,
    lean: pose.lean + ang,
    legB: limb(pose.legB),
    legF: limb(pose.legF),
    armB: limb(pose.armB),
    armF: limb(pose.armF),
  };
}

const back = (mat) => ({ ...mat, shift: (mat.shift ?? 0) - 1 });

export function drawLeg(c, leg, look, isBack) {
  const m = (mat) => (isBack ? back(mat) : mat);
  c.capsule(leg.hip, leg.knee, look.body.thighR, look.body.kneeR, m(look.mat.pants));
  c.capsule(leg.knee, leg.ankle, look.body.kneeR, look.body.ankleR, m(look.mat.shin ?? look.mat.pants));
  const k = look.k ?? 1;
  const toe = add(leg.ankle, v(look.body.footLen, k));
  c.capsule(leg.ankle, toe, look.body.ankleR + 0.2 * k, 1.4 * k, m(look.mat.shoes));
}

export function drawArm(c, arm, look, isBack) {
  const m = (mat) => (isBack ? back(mat) : mat);
  c.capsule(arm.shoulder, arm.elbow, look.body.upperArmR, look.body.elbowR, m(look.mat.sleeve));
  c.capsule(arm.elbow, arm.wrist, look.body.elbowR, look.body.wristR, m(look.mat.forearm ?? look.mat.sleeve));
  const dir = Math.atan2(arm.wrist.y - arm.elbow.y, arm.wrist.x - arm.elbow.x);
  const reach = 1.2 * (look.k ?? 1);
  const hand = add(arm.wrist, v(Math.cos(dir) * reach, Math.sin(dir) * reach));
  c.ellipse(hand.x, hand.y, look.body.handR, look.body.handR, m(look.mat.hands ?? look.mat.skin));
  arm.hand = hand;
}

/** Desenha um humanoide na ordem de profundidade. `look` traz corpo, materiais e ganchos. */
export function drawHumanoid(c, pose, look) {
  const hook = (name) => look[name]?.(c, pose, look);
  hook('behind');
  drawArm(c, pose.armB, look, true);
  hook('afterBackArm');
  drawLeg(c, pose.legB, look, true);
  c.capsule(pose.hip, pose.neck, look.body.hipR, look.body.chestR, look.mat.torso);
  hook('torso');
  drawLeg(c, pose.legF, look, false);
  hook('afterFrontLeg');
  c.capsule(pose.neck, lerp(pose.neck, pose.head, 0.45), look.body.neckR, look.body.neckR, look.mat.neck ?? look.mat.skin);
  c.ellipse(pose.head.x, pose.head.y, look.body.headRx, look.body.headRy, look.mat.skin);
  hook('head');
  hook('weapon');
  drawArm(c, pose.armF, look, false);
  hook('front');
  c.outline(P.outline);
}

/** Proporções base (em pixels de um quadro de 64 x 64). */
export const BASE_BODY = {
  torso: 17,
  neck: 1.5,
  headRx: 5,
  headRy: 5.6,
  thigh: 11.5,
  shin: 11.5,
  upperArm: 9.5,
  forearm: 9,
  hipR: 4.6,
  chestR: 5.6,
  neckR: 1.9,
  thighR: 3.1,
  kneeR: 2.5,
  ankleR: 1.9,
  footLen: 3.4,
  upperArmR: 2.3,
  elbowR: 1.9,
  wristR: 1.6,
  handR: 1.7,
};
