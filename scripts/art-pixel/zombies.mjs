// Visual dos três zumbis do GDD: Andarilho, Corredor e Brutamontes.
import { PixelCanvas } from './canvas.mjs';
import { drips, rotPatches, scraggly, splat, tears, zombieFace } from './decals.mjs';
import { P } from './palette.mjs';
import { BASE_BODY, drawHumanoid, GROUND, K, onTorso, v } from './rig.mjs';
import { attackPose, deathPose, walkPose } from './zombiePoses.mjs';

const skin = (ramp, seed) => ({ ramp, noise: 0.1, part: 'skin', seed, edge: 2 });

const walker = {
  body: { ...BASE_BODY, chestR: 5.3, hipR: 4.3, upperArmR: 2.1, elbowR: 1.8, wristR: 1.5 },
  gait: {
    stride: 5.5, bob: 1, lean: 0.3, sway: 0.04, headTilt: 0.22, headForward: 1.5, liftF: 3, liftB: 1.4,
    armF: (phi) => v(12 + 0.8 * Math.sin(phi), 7 + 0.8 * Math.cos(phi)),
    armB: (phi) => v(1.5 + 2 * Math.sin(phi + Math.PI), 14),
  },
  mat: {
    skin: skin(P.rot, 11),
    torso: { ramp: P.shirtBlue, noise: 0.04, part: 'shirt', seed: 3, edge: 2 },
    sleeve: { ramp: P.shirtBlue, noise: 0.04, part: 'shirt', seed: 4, edge: 2 },
    forearm: skin(P.rot, 12),
    pants: { ramp: P.pantsGrey, noise: 0.04, part: 'pants', seed: 5, edge: 2 },
    shoes: { ramp: P.charcoal, part: 'shoes' },
  },
  torso(c, pose) {
    tears(c, ['shirt'], P.rot, 0.3, 5);
    splat(c, onTorso(pose, 0.75, 2.5), 3.6, P.blood, ['shirt', 'skin'], 9);
    splat(c, onTorso(pose, 0.25, -1), 2.6, P.blood, ['shirt'], 13, -1);
    drips(c, onTorso(pose, 0.65, 2.5), 3, 4, 17);
  },
  afterFrontLeg(c) {
    tears(c, ['pants'], P.rot, 0.2, 23, 2);
    splat(c, v(33, 52), 2.4, P.blood, ['pants'], 29, -1);
  },
  head(c, pose, look) {
    scraggly(c, pose, P.hairDark, 6, 3);
    zombieFace(c, pose, look, { skull: true, jawOpen: pose.extra.jaw, seed: 31 });
  },
  front(c, pose) {
    splat(c, pose.armF.hand, 2.2, P.blood, ['skin'], 37);
  },
};

const runner = {
  body: { ...BASE_BODY, torso: 16, chestR: 4.8, hipR: 4.0, thighR: 2.7, kneeR: 2.1, ankleR: 1.6, upperArmR: 1.9, elbowR: 1.6, wristR: 1.4, headRx: 4.3, headRy: 5 },
  gait: {
    stride: 8, bob: 1.6, lean: 0.55, sway: 0.03, headTilt: 0.05, headForward: 2, liftF: 5, liftB: 5,
    armF: (phi) => v(6 + 5 * Math.sin(phi + Math.PI), 8 + Math.cos(phi)),
    armB: (phi) => v(6 + 5 * Math.sin(phi), 9),
  },
  mat: {
    skin: skin(P.rotPale, 19),
    torso: { ramp: P.tankBeige, noise: 0.05, part: 'shirt', seed: 6, edge: 2 },
    sleeve: skin(P.rotPale, 20),
    pants: { ramp: P.shirtBlue, noise: 0.04, part: 'pants', seed: 8, edge: 2 },
    shin: skin(P.rotPale, 21),
    shoes: { ramp: P.pantsGrey, part: 'shoes' },
  },
  torso(c, pose) {
    tears(c, ['shirt'], P.rotPale, 0.24, 41);
    splat(c, onTorso(pose, 0.55, 3), 4, P.blood, ['shirt', 'skin'], 43);
    drips(c, onTorso(pose, 0.5, 3), 4, 5, 47);
  },
  afterFrontLeg(c) {
    splat(c, v(30, 55), 2.5, P.blood, ['skin'], 53);
  },
  head(c, pose, look) {
    zombieFace(c, pose, look, { jawOpen: pose.extra.jaw, seed: 59, eye: P.eyeDim });
  },
  front(c, pose) {
    // Cabelo comprido por cima, caindo para trás com o movimento
    scraggly(c, pose, P.hairDark, 9, 61, 6);
  },
};

const brute = {
  body: {
    ...BASE_BODY, torso: 18, hipR: 6.4, chestR: 8.2, neckR: 3.2, headRx: 4.4, headRy: 4.8, thighR: 4.3, kneeR: 3.5, ankleR: 2.7,
    footLen: 4, upperArmR: 3.8, elbowR: 3.1, wristR: 2.6, handR: 2.9, upperArm: 10, forearm: 10,
  },
  gait: {
    stride: 5, bob: 1.2, lean: 0.38, sway: 0.05, headTilt: 0.3, headForward: 2.5, liftF: 2.5, liftB: 2,
    armF: (phi) => v(7 + 2 * Math.sin(phi), 14),
    armB: (phi) => v(2 + 2 * Math.sin(phi + Math.PI), 15),
  },
  mat: {
    skin: skin(P.deadFlesh, 67),
    torso: skin(P.deadFlesh, 68),
    sleeve: skin(P.deadFlesh, 69),
    pants: { ramp: P.pantsGreen, noise: 0.04, part: 'pants', seed: 9, edge: 2 },
    shoes: { ramp: P.boots, part: 'shoes' },
  },
  torso(c, pose) {
    // Regata rasgada só na barriga, músculos e costelas à mostra no peito
    c.capsule(onTorso(pose, 0.05, 0), onTorso(pose, 0.55, 0.5), 6.6 * K(pose), 7.6 * K(pose), { ramp: P.tankBeige, noise: 0.12, part: 'shirt', seed: 71 });
    tears(c, ['shirt'], P.deadFlesh, 0.33, 73);
    rotPatches(c, onTorso(pose, 0.8, 3), 4.5, P.muscle, 0.55, 79, ['skin']);
    for (let i = 0; i < 3; i++) {
      const a = onTorso(pose, 0.62 + i * 0.09, 1);
      const b = onTorso(pose, 0.6 + i * 0.09, 6);
      c.line(Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y), P.bone[3], 'bone');
    }
    splat(c, onTorso(pose, 0.4, 4), 4, P.blood, ['shirt', 'skin'], 83);
    drips(c, onTorso(pose, 0.4, 4), 4, 6, 89);
  },
  afterFrontLeg(c) {
    tears(c, ['pants'], P.deadFlesh, 0.18, 97, 2);
  },
  head(c, pose, look) {
    zombieFace(c, pose, look, { jawOpen: pose.extra.jaw, seed: 101 });
  },
  front(c, pose) {
    rotPatches(c, pose.armF.elbow, 4, P.muscle, 0.5, 103, ['skin']);
    splat(c, pose.armF.hand, 3, P.blood, ['skin'], 107);
  },
};

export const ZOMBIE_LOOKS = { walker, runner, brute };

function bloodPool(c, rx) {
  c.ellipse(32, GROUND - 0.5, rx, 2.2, { ramp: P.blood, part: 'pool', dither: 0.3, edge: 0 });
}

/** Quadros: caminhada (6), ataque (4), morte (5). Todos olhando para a direita. */
export function zombieFrames(look, layout) {
  const draw = (pose, pool = 0) => {
    const c = new PixelCanvas(64, 64);
    if (pool) bloodPool(c, pool);
    drawHumanoid(c, pose, look);
    return c;
  };
  const frames = [];
  for (let i = 0; i < layout.walk.count; i++) frames.push(draw(walkPose(look.body, look.gait, i, layout.walk.count)));
  for (let k = 0; k < layout.attack.count; k++) frames.push(draw(attackPose(look.body, look.gait, k)));
  for (let k = 0; k < layout.death.count; k++) frames.push(draw(deathPose(look.body, look.gait, k), k >= 3 ? 8 + (k - 3) * 4 : 0));
  return frames;
}
