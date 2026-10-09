// Poses dos heróis por vista. kind: idle (4), attack (4), walk (6). De frente miram para a
// câmera (baixo), de costas para o fundo (cima), de perfil para a direita.
import { anchors, BUILD } from './chibi.mjs';

const BREATH = [0, 0.5, 1, 0.5];
const RECOIL = [0, 0, 2.2, 1];

/** Passo: no perfil as pernas vão e voltam; de frente/costas os pés sobem alternados. */
export function walkLegs(view, k, n = 8, stride = 5) {
  const phi = (k / n) * Math.PI * 2;
  const bob = -Math.abs(Math.sin(phi)) * 1.4;
  if (view === 'side') return { bob, strideF: Math.sin(phi) * stride, strideB: -Math.sin(phi) * stride, liftR: Math.max(0, Math.cos(phi)) * 2, liftL: Math.max(0, -Math.cos(phi)) * 2 };
  return { bob, liftL: Math.max(0, Math.sin(phi)) * 3, liftR: Math.max(0, -Math.sin(phi)) * 3, sway: Math.sin(phi) * 0.8 };
}

/** Atiradores (rifle, revólver, escopeta...). twoHands: a mão de trás segura o cano; flash: clarão no tiro. */
function shooter(view, kind, k, twoHands, flashes = true) {
  const legs = kind === 'walk' ? walkLegs(view, k) : { bob: kind === 'idle' ? BREATH[k % 4] * 0.6 : 0 };
  const base = anchors(BUILD, view, legs);
  const [nx, ny] = base.neck;
  const aiming = kind === 'attack';
  const back = RECOIL[k] * (aiming ? 1 : 0);
  const flash = flashes && aiming && k === 1 ? 1 : 0;
  let s;
  if (view === 'side') {
    const grip = aiming ? [base.shoulderR[0] + 7 - back, ny + 9] : [base.shoulderR[0] + 5, ny + 12];
    const angle = aiming ? -RECOIL[k] * 2.5 : 32;
    const far = twoHands ? [grip[0] + (aiming ? 9 : 7), grip[1] + (aiming ? 0 : 4)] : [base.shoulderL[0] - 1, ny + 16];
    s = { handR: grip, handL: far, weapon: { grip, angle, depth: 1, flash } };
  } else if (view === 'front') {
    const grip = aiming ? [nx + 4, ny + 11 - back] : [nx + 8, ny + 15];
    const angle = aiming ? 90 : 104;
    const far = twoHands ? [grip[0] - 5, grip[1] + 4] : undefined;
    s = { handR: grip, handL: far, weapon: { grip, angle, depth: aiming ? 0.45 : 0.6, flash } };
  } else {
    // De costas: arma no ombro direito, cano subindo ao lado da cabeça
    const grip = aiming ? [nx + 16, ny + 3 + back] : [nx + 9, ny + 10];
    const angle = aiming ? -88 : -70;
    const far = twoHands ? [grip[0] - 6, grip[1] - 6] : [nx - 12, ny + 15];
    s = { armsUp: true, handR: grip, handL: far, weapon: { grip, angle, depth: aiming ? 0.8 : 0.6, flash } };
  }
  return anchors(BUILD, view, { ...legs, ...s });
}

/** Motosserra: parado/andando com a serra na frente; ataque prepara, sobe, golpeia e volta. */
function sawyer(view, kind, k) {
  const legs = kind === 'walk' ? walkLegs(view, k) : { bob: kind === 'idle' ? BREATH[k % 4] * 0.6 : 0 };
  const base = anchors(BUILD, view, legs);
  const [nx, ny] = base.neck;
  const phase = kind === 'attack' ? k : -1;
  const tick = kind === 'walk' || kind === 'attack' ? k : 0;
  let grip;
  let angle;
  let depth = 1;
  if (view === 'side') {
    grip = phase === 1 ? [nx + 6, ny + 1] : phase === 2 ? [nx + 12, ny + 13] : [nx + 9, ny + 12];
    angle = phase === 1 ? -55 : phase === 2 ? 38 : phase === 3 ? 22 : 8;
  } else if (view === 'front') {
    grip = phase === 1 ? [nx + 7, ny + 2] : [nx + 6, ny + 14];
    angle = phase === 1 ? -70 : phase === 2 ? 100 : 72;
    depth = phase === 2 ? 0.55 : 0.7;
  } else {
    // De costas a serra fica à frente dele, apontando para o fundo, e sobra pela direita
    grip = phase === 1 ? [nx + 9, ny + 4] : [nx + 13, ny + 8];
    angle = phase === 1 ? -100 : phase === 2 ? -35 : -55;
    depth = 0.8;
  }
  const r = (angle * Math.PI) / 180;
  const handle = [grip[0] - Math.cos(r) * 7 + Math.sin(r) * 4, grip[1] - Math.sin(r) * 7 - Math.cos(r) * 4];
  return anchors(BUILD, view, { ...legs, armsUp: view === 'back', handR: grip, handL: handle, lean: phase === 2 ? 2 : 0, weapon: { grip, angle, depth, tick } });
}

/** Médica: segura a maleta; no pulso de cura ergue a maleta e solta cruzes verdes. */
function medic(view, kind, k) {
  const legs = { bob: kind === 'idle' ? BREATH[k % 4] * 0.6 : 0 };
  const base = anchors(BUILD, view, legs);
  const [nx, ny] = base.neck;
  const lift = kind === 'attack' ? [0, 8, 5, 2][k] : 0;
  const grip = view === 'side' ? [base.shoulderR[0] + 4, ny + 15 - lift] : view === 'front' ? [nx + 9, ny + 15 - lift] : [nx + 15, ny + 14 - lift];
  return anchors(BUILD, view, { ...legs, handR: grip, weapon: { grip, flash: kind === 'attack' && k === 1 } });
}

/** Pose de um herói. */
export function heroPose(id, view, kind, k) {
  // O Exotraje Titã anda e soca como a Serra (sem a motosserra na mão)
  if (id === 'chainsaw' || id === 'titan') return sawyer(view, kind, k);
  // Atiradores não andam no jogo: a caminhada repete o parado
  const still = kind === 'walk' ? 'idle' : kind;
  const frame = still === 'idle' ? k % 4 : k;
  if (id === 'medic') return medic(view, still, frame);
  return shooter(view, still, frame, id !== 'sheriff', id !== 'firefighter');
}
