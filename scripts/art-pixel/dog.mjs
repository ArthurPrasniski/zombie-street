// Rex: pastor-alemão visto de lado (olhando para a direita), com esqueleto de quatro patas.
import { hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { add, GROUND, ik, lerp, rot, v } from './rig.mjs';

export const TAN = [hex('#2a170b'), hex('#5a3519'), hex('#8c5a2c'), hex('#b8813f'), hex('#d8a65e')];
export const SADDLE = [hex('#0c0807'), hex('#1b1411'), hex('#2b211b'), hex('#3c2f26'), hex('#4f3f33')];
const ANKLE_Y = GROUND - 1;
const LEG = { upper: 7, lower: 7 };

const mat = (ramp, part, extra = {}) => ({ ramp, part, edge: 2, noise: 0.06, ...extra });
const back = (m) => ({ ...m, shift: -1 });

/**
 * Pose do cachorro: quadril (traseira), peito, cabeça e alvos das 4 patas.
 * s: { dx, dy, bodyTilt, headLift, mouth, tail, paws: { fb, ff, bb, bf } (deslocamento x, altura) }
 */
function dogPose(s) {
  const hip = v(22 + (s.dx ?? 0), 47 + (s.dy ?? 0));
  const chest = add(hip, rot(v(18, 0), s.bodyTilt ?? 0));
  const neck = add(chest, v(3, -5 - (s.headLift ?? 0) * 0.5));
  const head = add(neck, v(5, -3 - (s.headLift ?? 0)));
  const leg = (root, paw, bend) => {
    const target = v(root.x + paw[0], ANKLE_Y - paw[1]);
    const { mid, end } = ik(root, target, LEG.upper, LEG.lower, bend);
    return { root, mid, end };
  };
  const paws = s.paws ?? { bb: [-1, 0], bf: [1, 0], fb: [-1, 0], ff: [1, 0] };
  return {
    hip,
    chest,
    neck,
    head,
    mouth: s.mouth ?? 0,
    tail: s.tail ?? 0,
    legs: {
      backFar: leg(add(hip, v(1, 2)), paws.bb, 1),
      frontFar: leg(add(chest, v(-1, 3)), paws.fb, -1),
      backNear: leg(add(hip, v(-1, 3)), paws.bf, 1),
      frontNear: leg(add(chest, v(1, 4)), paws.ff, -1),
    },
  };
}

function drawLeg(c, leg, m) {
  c.capsule(leg.root, leg.mid, 2.4, 1.8, m);
  c.capsule(leg.mid, leg.end, 1.7, 1.3, m);
  c.capsule(leg.end, add(leg.end, v(2, 0)), 1.4, 1.2, mat(SADDLE, 'paw', { shift: m.shift }));
}

function drawDog(c, pose) {
  const body = mat(TAN, 'fur');
  drawLeg(c, pose.legs.backFar, back(body));
  drawLeg(c, pose.legs.frontFar, back(body));
  // Rabo
  const tailTip = add(pose.hip, rot(v(-9, -4), pose.tail));
  c.capsule(add(pose.hip, v(-3, -1)), tailTip, 1.8, 1.1, mat(SADDLE, 'tail'));
  // Corpo, com a sela escura no lombo
  c.capsule(pose.hip, pose.chest, 5.2, 6, body);
  c.recolor((x, y) => y < lerp(pose.hip, pose.chest, (x - pose.hip.x) / (pose.chest.x - pose.hip.x || 1)).y - 1.5, SADDLE, { parts: ['fur'] });
  c.capsule(pose.chest, pose.neck, 4, 3.4, body);
  drawLeg(c, pose.legs.backNear, body);
  drawLeg(c, pose.legs.frontNear, body);
  // Cabeça: crânio, focinho, orelha
  c.ellipse(pose.head.x, pose.head.y, 4.2, 3.8, body);
  const snout = add(pose.head, v(4.5, 1 + pose.mouth * 0.3));
  c.capsule(add(pose.head, v(1, 0.5)), snout, 2.6, 1.7, body);
  c.recolor((x, y) => x > pose.head.x + 2 && y < pose.head.y + 1, SADDLE, { parts: ['fur'], shift: 1 });
  c.polygon([add(pose.head, v(-2.5, -2)), add(pose.head, v(-0.5, -8.5)), add(pose.head, v(1.5, -2.5))], mat(SADDLE, 'ear'));
  c.put(snout.x + 1, snout.y - 1, P.outline, 0, 'face');
  c.put(pose.head.x + 1, pose.head.y - 1, hex('#f0d9a0'), 3, 'face');
  if (pose.mouth > 0) {
    // Boca aberta: mandíbula separada com dentes
    const jaw = add(pose.head, v(1, 3 + pose.mouth));
    c.capsule(jaw, add(jaw, v(5, pose.mouth * 0.4)), 1.2, 0.9, body);
    c.put(jaw.x + 3, jaw.y - 1, P.teeth, 3, 'face');
    c.put(jaw.x + 4, jaw.y - 2, P.blood[2], 2, 'face');
  }
  c.outline(P.outline);
}

const IDLE = [0, 0.4, 0.8, 0.4];
// Galope: patas de cada par em fase oposta.
function runPaws(i) {
  const phi = (i / 6) * Math.PI * 2;
  const paw = (p) => [5 * Math.cos(p), 3 * Math.max(0, -Math.sin(p))];
  return { bb: paw(phi), bf: paw(phi + Math.PI * 0.5), fb: paw(phi + Math.PI), ff: paw(phi + Math.PI * 1.5) };
}
const ATTACK = [
  { dx: -2, dy: 2, bodyTilt: 0.12, headLift: -1, mouth: 0, paws: { bb: [-3, 0], bf: [-1, 0], fb: [-1, 0], ff: [1, 0] } },
  { dx: 3, dy: -2, bodyTilt: -0.2, headLift: 2, mouth: 3, paws: { bb: [-5, 0], bf: [-4, 1], fb: [3, 3], ff: [5, 4] } },
  { dx: 4, dy: 0, bodyTilt: -0.05, headLift: 0, mouth: 1, paws: { bb: [-3, 0], bf: [-2, 0], fb: [2, 0], ff: [3, 0] } },
  { dx: 1, dy: 1, bodyTilt: 0.05, headLift: 0, mouth: 0, paws: { bb: [-2, 0], bf: [0, 0], fb: [0, 0], ff: [1, 0] } },
];

/** Quadros no layout das tropas: parado (4), ataque (4), caído (1), andando (6). */
export function dogFrames() {
  const frame = (pose) => {
    const c = new PixelCanvas(64, 64);
    drawDog(c, pose);
    return c;
  };
  const frames = [];
  IDLE.forEach((b, k) => frames.push(frame(dogPose({ dy: b * 0.5, tail: Math.sin(k * 1.6) * 0.5, headLift: b * 0.3 }))));
  ATTACK.forEach((a) => frames.push(frame(dogPose(a))));
  // Caído de lado: corpo baixo e patas esticadas para a frente
  const down = dogPose({ dy: 9, bodyTilt: 0.05, headLift: -6, tail: 0.6, paws: { bb: [6, 3], bf: [7, 2], fb: [6, 3], ff: [7, 2] } });
  frames.push(frame(down));
  for (let i = 0; i < 6; i++) frames.push(frame(dogPose({ dy: -Math.abs(Math.sin((i / 6) * Math.PI * 2)), tail: 0.4, headLift: 1, paws: runPaws(i) })));
  return frames;
}
