// Boneco chibi (cabeça grande, corpo curto) em 3 vistas: frente, costas e perfil (olhando
// para a direita). Caixa de desenho de 100 x 100 unidades, pés em (50, 94).
import { blob, capsule, circle, darken, ellipse, fill, SHADOW, soft, toon } from './ck.mjs';

export const GROUND = 94;
export const FOOT_X = 50;

/**
 * Proporções padrão (estilo Clash 2D: cabeça, mãos e pés grandes, pernas curtas); cada
 * personagem ajusta o que precisar. faceScale aumenta olhos e boca.
 */
export const BUILD = { headR: 17, torsoW: 26, torsoH: 21, legH: 10.5, legR: 4.6, armR: 4, handR: 4.6, footR: 5.4, faceScale: 1.12 };
/** Raio de cabeça para o qual chapéus, cabelos e rostos foram desenhados. */
const DESIGN_HEAD = 15;

/**
 * Pontos do corpo para uma pose.
 * s: { bob, sway, lean, headDx, headDy, liftL, liftR, strideF, strideB, handL, handR (absolutos), armsUp }
 * Na vista de perfil, L = perna/braço de trás (longe) e R = da frente (perto).
 */
export function anchors(b, view, s = {}) {
  const bob = s.bob ?? 0;
  const sway = s.sway ?? 0;
  const side = view === 'side';
  const hip = [FOOT_X + sway, GROUND - b.legH - b.footR * 0.4 + bob];
  const neck = [hip[0] + (s.lean ?? 0), hip[1] - b.torsoH];
  const head = [neck[0] + (s.headDx ?? 0) + (side ? 1.5 : 0), neck[1] - b.headR * 0.78 + (s.headDy ?? 0)];
  const spread = side ? 0 : b.torsoW * 0.27;
  const footL = side ? [FOOT_X + (s.strideB ?? -1), GROUND - (s.liftL ?? 0)] : [FOOT_X - spread, GROUND - (s.liftL ?? 0)];
  const footR = side ? [FOOT_X + (s.strideF ?? 2), GROUND - (s.liftR ?? 0)] : [FOOT_X + spread, GROUND - (s.liftR ?? 0)];
  const sh = side ? 2 : b.torsoW * 0.5 - 1.5;
  const shoulderL = [neck[0] - sh + (side ? -2 : 0), neck[1] + 5];
  const shoulderR = [neck[0] + sh, neck[1] + 5];
  const hang = b.torsoH * 0.62;
  const handL = s.handL ?? [shoulderL[0] - (side ? 0 : 2.5), shoulderL[1] + hang];
  const handR = s.handR ?? [shoulderR[0] + (side ? 1 : 2.5), shoulderR[1] + hang];
  return { view, hip, neck, head, footL, footR, shoulderL, shoulderR, handL, handR, armsUp: s.armsUp ?? false, s };
}

/** Sombra suave no chão, embaixo dos pés. */
export function groundShadow(c, w = 17) {
  soft(c, ellipse(FOOT_X, GROUND, w, 4.2), SHADOW, 0.35, 1.6);
}

function leg(c, b, look, hip, foot, far) {
  const pants = far ? darken(look.pants, 0.18) : look.pants;
  toon(c, capsule([hip[0], hip[1]], [foot[0], foot[1] - b.footR * 0.6], b.legR, b.legR * 0.9), pants, { depth: 2 });
  toon(c, ellipse(foot[0] + (look.view === 'side' ? 1.6 : 0), foot[1] - 1.6, b.footR * (look.view === 'side' ? 1.25 : 1), b.footR * 0.72), far ? darken(look.shoes, 0.18) : look.shoes, { depth: 1.6 });
}

function arm(c, b, look, shoulder, hand, far) {
  const sleeve = far ? darken(look.sleeve ?? look.shirt, 0.2) : look.sleeve ?? look.shirt;
  toon(c, capsule(shoulder, hand, b.armR, b.armR * 0.85), sleeve, { depth: 2 });
  toon(c, circle(hand[0], hand[1], b.handR), far ? darken(look.hands ?? look.skin, 0.15) : look.hands ?? look.skin, { depth: 1.6 });
}

function torso(c, b, look, a) {
  const [nx, ny] = a.neck;
  const [hx, hy] = a.hip;
  const w = a.view === 'side' ? b.torsoW * 0.7 : b.torsoW;
  const shape = blob([
    [nx - w * 0.42, ny - 1], [nx + w * 0.42, ny - 1], [hx + w * 0.5, hy - b.torsoH * 0.45], [hx + w * 0.44, hy + 3],
    [hx - w * 0.44, hy + 3], [hx - w * 0.5, hy - b.torsoH * 0.45],
  ]);
  toon(c, shape, look.shirt, { depth: 3 });
  return shape;
}

/**
 * Desenha o boneco. look: { skin, shirt, sleeve, pants, shoes, hands, build, e ganchos opcionais
 * por vista: behind, torso, head (rosto/cabelo), weapon, after }. Cada gancho recebe (c, a, look).
 */
export function drawChibi(c, look, a) {
  const b = look.build ?? BUILD;
  const hook = (name) => look[name]?.(c, a, look);
  const L = { ...look, view: a.view };
  if (!a.s.ko && !a.s.noShadow) groundShadow(c, b.torsoW * 0.7);
  hook('behind');
  if (a.view === 'side') {
    arm(c, b, L, a.shoulderL, a.handL, true);
    leg(c, b, L, [a.hip[0] - 2, a.hip[1]], a.footL, true);
    leg(c, b, L, [a.hip[0] + 2, a.hip[1]], a.footR, false);
    a.torsoPath = torso(c, b, L, a);
    hook('torso');
    drawHead(c, b, L, a, hook);
    hook('weapon');
    arm(c, b, L, a.shoulderR, a.handR, false);
    hook('after');
    return;
  }
  const back = a.view === 'back';
  leg(c, b, L, [a.hip[0] - b.torsoW * 0.22, a.hip[1]], a.footL, false);
  leg(c, b, L, [a.hip[0] + b.torsoW * 0.22, a.hip[1]], a.footR, false);
  // De costas, a arma fica à frente do corpo (longe da câmera): atrás do tronco. Com os braços
  // erguidos (armsUp), as mãos também.
  if (back) hook('weapon');
  if (back && a.armsUp) {
    arm(c, b, L, a.shoulderL, a.handL, true);
    arm(c, b, L, a.shoulderR, a.handR, true);
  }
  a.torsoPath = torso(c, b, L, a);
  hook('torso');
  if (!back) hook('weapon');
  if (!(back && a.armsUp)) {
    arm(c, b, L, a.shoulderL, a.handL, false);
    arm(c, b, L, a.shoulderR, a.handR, false);
  }
  drawHead(c, b, L, a, hook);
  hook('after');
}

function drawHead(c, b, look, a, hook) {
  const [x, y] = a.head;
  const r = b.headR;
  // Pescoço curto e cabeça um pouco mais larga que alta
  fill(c, ellipse(a.neck[0], a.neck[1] - 1, r * 0.35, 3), darken(look.skin, 0.3));
  a.headPath = ellipse(x, y, r * 1.04, r);
  toon(c, a.headPath, look.skin, { depth: 3.4 });
  // Cabeças maiores que o desenho original: os enfeites (rosto, cabelo, chapéu) são
  // desenhados no tamanho original e escalados em volta do centro da cabeça.
  const k = r / DESIGN_HEAD;
  if (k <= 1) {
    hook('head');
    return;
  }
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  c.translate(-x, -y);
  look.head?.(c, { ...a, headPath: ellipse(x, y, DESIGN_HEAD * 1.04, DESIGN_HEAD) }, look);
  c.restore();
}
