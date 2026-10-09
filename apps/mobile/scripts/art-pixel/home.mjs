// Pôster da Home em retrato: céu alto para o título, horda em silhueta na estrada e heróis embaixo.
import { dithered, drawBackground } from './background.mjs';
import { hash, hex, LIGHT_RIGHT, PixelCanvas } from './canvas.mjs';
import { HERO_LOOKS } from './heroes.mjs';
import { drawHumanoid, scaledLook, scalePose } from './rig.mjs';
import { walkPose } from './zombiePoses.mjs';
import { ZOMBIE_LOOKS } from './zombies.mjs';

export const POSTER_W = 360;
export const POSTER_H = 640;
// Recorte do cenário de paisagem (800 px de largura) e quanto céu entra por cima dele.
const CROP_X = 340;
const SKY_EXTRA = 80;
const NIGHT = [hex('#0c0812'), hex('#120c18'), hex('#160e1c')];

// Pés no quadro de escala 1 (x = 32, y = 62).
const FOOT_X = 32;
const FOOT_Y = 62;
const SUN_RIM = hex('#f0a24c');

// Horda ao fundo: [tipo, x, chão, escala, quadro]. Do mais longe para o mais perto.
const HORDE = [
  ['walker', 190, 266, 1, 1], ['walker', 250, 268, 1.05, 4], ['runner', 305, 272, 1.1, 2], ['walker', 150, 290, 1.3, 3],
  ['brute', 262, 300, 1.3, 1], ['walker', 330, 308, 1.45, 5], ['runner', 205, 322, 1.55, 0], ['walker', 300, 344, 1.8, 2],
];
// Heróis: [id, animação, quadro, x, chão, escala]. Serra na frente, no centro.
const HEROES = [
  ['sniper', 'attack', 0, 92, 448, 2.4],
  ['sheriff', 'attack', 0, 250, 456, 2.5],
  ['chainsaw', 'attack', 1, 168, 480, 2.7],
];

function render(look, pose, k, light) {
  const size = Math.ceil(64 * k);
  const c = new PixelCanvas(size, size, light);
  drawHumanoid(c, scalePose(pose, k), scaledLook(look, k));
  return c;
}

/** Pinta tudo de uma cor, com contorno quente do lado do sol (direita). */
function silhouette(c, color) {
  const out = new PixelCanvas(c.w, c.h);
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (!c.filled(x, y)) continue;
      out.put(x, y, !c.filled(x + 1, y) || !c.filled(x, y - 1) ? hex('#8a3a26') : color);
    }
  }
  return out;
}

/** Luz de contorno do pôr do sol nos pixels da borda direita. */
function rimLight(c) {
  const edge = [];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.filled(x, y) && !c.filled(x + 1, y) && c.filled(x - 1, y) && c.filled(x - 2, y)) edge.push([x - 1, y]);
    }
  }
  for (const [x, y] of edge) c.put(x, y, [...SUN_RIM.slice(0, 3), 150]);
}

function shadow(c, x, y, rx) {
  for (let yy = -3; yy <= 3; yy++) {
    for (let xx = -rx; xx <= rx; xx++) {
      if ((xx / rx) ** 2 + (yy / 3) ** 2 <= 1) c.put(x + xx, y + yy, hex('#0b0706', 120));
    }
  }
}

function place(poster, sprite, x, ground, k) {
  poster.blit(sprite, Math.round(x - FOOT_X * k), Math.round(ground - FOOT_Y * k));
}

/** Cenário de paisagem recortado, com céu noturno estrelado acima do pôr do sol. */
function scenery() {
  const wide = drawBackground(POSTER_H - SKY_EXTRA);
  const c = new PixelCanvas(POSTER_W, POSTER_H);
  for (let y = 0; y < SKY_EXTRA; y++) {
    for (let x = 0; x < POSTER_W; x++) c.put(x, y, hash(x, y, 5) < 0.004 ? hex('#d8c8e0') : dithered(NIGHT, y / SKY_EXTRA, x, y));
  }
  const strip = new PixelCanvas(POSTER_W, wide.h);
  for (let y = 0; y < wide.h; y++) {
    for (let x = 0; x < POSTER_W; x++) {
      const i = (y * wide.w + x + CROP_X) * 4;
      strip.put(x, y, [wide.rgba[i], wide.rgba[i + 1], wide.rgba[i + 2], wide.rgba[i + 3]]);
    }
  }
  c.blit(strip, 0, SKY_EXTRA);
  return c;
}

export function drawPoster() {
  const poster = scenery();
  HORDE.forEach(([id, x, ground, k, frame]) => {
    const look = ZOMBIE_LOOKS[id];
    const sprite = render(look, walkPose(look.body, look.gait, frame, 6), k, LIGHT_RIGHT).flipX();
    const fog = Math.min(1, (ground - 262) / 90);
    const tone = hex(fog < 0.3 ? '#3e1a22' : fog < 0.7 ? '#2a1119' : '#1a0b12');
    place(poster, silhouette(sprite, tone), x, ground, k);
  });
  for (const [id, anim, frame, x, ground, k] of HEROES) {
    const hero = HERO_LOOKS[id];
    const sprite = render(hero.look, hero.pose(anim, frame), k);
    rimLight(sprite);
    shadow(poster, x, ground, Math.round(14 * k));
    place(poster, sprite, x, ground, k);
  }
  return poster;
}
