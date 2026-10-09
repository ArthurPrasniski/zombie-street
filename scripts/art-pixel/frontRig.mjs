// Esqueleto de frente/costas (vista de cima inclinada, estilo Clash Royale): corpo simétrico,
// pés alternando no passo, braços dos lados ou à frente. Usa os mesmos materiais dos "looks" de perfil.
import { P } from './palette.mjs';
import { add, GROUND, lerp, v } from './rig.mjs';

const ANKLE_Y = GROUND - 2;
const snap = (p) => v(Math.round(p.x), Math.round(p.y));

/**
 * s: { bob, liftL, liftR, sway (x do tronco), headDx, headDy, handL, handR (absolutos ou null = soltos),
 *      armsUp (braços à frente, longe da câmera: desenhados antes da cabeça) }
 */
export function frontPose(body, s = {}) {
  const bob = s.bob ?? 0;
  const hipY = ANKLE_Y - (body.thigh + body.shin) * 0.95 + bob;
  const sway = s.sway ?? 0;
  const hip = v(32 + sway, hipY);
  const neck = v(32 + sway * 1.4, hipY - body.torso);
  const head = snap(v(neck.x + (s.headDx ?? 0), neck.y - body.neck - body.headRy + (s.headDy ?? 0)));
  const sh = body.chestR * 1.28;
  const shoulderL = v(neck.x - sh, neck.y + 3);
  const shoulderR = v(neck.x + sh, neck.y + 3);
  const handL = s.handL ?? v(shoulderL.x - 1, hipY + 2);
  const handR = s.handR ?? v(shoulderR.x + 1, hipY + 2);
  const legX = body.hipR * 0.62;
  const ankleL = v(32 - legX - 0.5, ANKLE_Y - (s.liftL ?? 0));
  const ankleR = v(32 + legX + 0.5, ANKLE_Y - (s.liftR ?? 0));
  const out = (a, b, dir) => add(lerp(a, b, 0.5), v(dir, 0));
  return {
    hip, neck, head, headAng: 0, lean: 0,
    hipL: v(hip.x - legX, hipY), hipR: v(hip.x + legX, hipY),
    kneeL: out(v(hip.x - legX, hipY), ankleL, -0.6), kneeR: out(v(hip.x + legX, hipY), ankleR, 0.6),
    ankleL, ankleR,
    shoulderL, shoulderR, handL, handR,
    elbowL: out(shoulderL, handL, -1.6), elbowR: out(shoulderR, handR, 1.6),
    armsUp: s.armsUp ?? false,
    extra: s.extra ?? {},
  };
}

const back = (mat) => ({ ...mat, shift: (mat.shift ?? 0) - 1 });

function leg(c, look, h, k, a, side) {
  const b = look.body;
  c.capsule(h, k, b.thighR, b.kneeR, look.mat.pants);
  c.capsule(k, a, b.kneeR, b.ankleR, look.mat.shin ?? look.mat.pants);
  c.ellipse(a.x + side * 0.4, a.y + 1, b.ankleR + 0.6, 1.8, look.mat.shoes);
}

function arm(c, look, s, e, h, behind) {
  const b = look.body;
  const m = (mat) => (behind ? back(mat) : mat);
  c.capsule(s, e, b.upperArmR, b.elbowR, m(look.mat.sleeve));
  c.capsule(e, h, b.elbowR, b.wristR, m(look.mat.forearm ?? look.mat.sleeve));
  c.ellipse(h.x, h.y, b.handR, b.handR, m(look.mat.hands ?? look.mat.skin));
}

/**
 * Desenha de frente (view = 'front') ou de costas ('back'). Ganchos do look, se existirem:
 * frontTorso/backTorso, frontHead/backHead, frontWeapon/backWeapon (arma) e frontAfter/backAfter.
 */
export function drawFront(c, pose, look, view) {
  const hook = (name) => look[`${view}${name}`]?.(c, pose, look);
  const b = look.body;
  hook('Behind');
  leg(c, look, pose.hipL, pose.kneeL, pose.ankleL, -1);
  leg(c, look, pose.hipR, pose.kneeR, pose.ankleR, 1);
  if (pose.armsUp && view === 'back') {
    hook('Weapon');
    arm(c, look, pose.shoulderL, pose.elbowL, pose.handL, true);
    arm(c, look, pose.shoulderR, pose.elbowR, pose.handR, true);
  }
  c.capsule(pose.hip, v(pose.neck.x, pose.neck.y + 1), b.hipR * 1.12, b.chestR * 1.25, look.mat.torso);
  hook('Torso');
  if (!(pose.armsUp && view === 'back')) {
    arm(c, look, pose.shoulderL, pose.elbowL, pose.handL, false);
    if (view === 'front') hook('Weapon');
    arm(c, look, pose.shoulderR, pose.elbowR, pose.handR, false);
    if (view === 'back') hook('Weapon');
  }
  c.capsule(pose.neck, lerp(pose.neck, pose.head, 0.45), b.neckR, b.neckR, look.mat.neck ?? look.mat.skin);
  c.ellipse(pose.head.x, pose.head.y, b.headRx * 0.95, b.headRy, look.mat.skin);
  hook('Head');
  hook('After');
  c.outline(P.outline);
}

/** Pés alternando (4 quadros de passo viram 6 com as pausas). */
export function frontWalk(i, n = 6) {
  const phi = (i / n) * Math.PI * 2;
  return { liftL: Math.max(0, Math.sin(phi)) * 3, liftR: Math.max(0, -Math.sin(phi)) * 3, bob: -Math.abs(Math.sin(phi)) * 1, sway: Math.sin(phi) * 0.6 };
}

/** Coordenadas locais da cabeça de frente: x para a direita da imagem, y para baixo. */
export const onFace = (pose, lx, ly) => v(pose.head.x + lx, pose.head.y + ly);
