// Arena vertical vista de cima (480 x 720 px = mundo 600 x 900): cemitério no topo, de onde
// saem os zumbis, campo aberto contínuo com a estrada de terra só de cenário e a base embaixo.
import { bayer, dithered, fbm } from './background.mjs';
import { hash, hex, PixelCanvas } from './canvas.mjs';
import { P } from './palette.mjs';
import { v } from './rig.mjs';

export const ARENA_W = 480;
export const ARENA_H = 720;
const DEPLOY_Y = 376; // y = 470 no mundo: começo da zona das tropas
const ROAD_HALF = 38;

const GRASS = ['#161c12', '#1f2817', '#29351c', '#344223', '#43512a', '#566433', '#6d763d'].map((c) => hex(c));
const DIRT = ['#231a15', '#2f231b', '#3c2d22', '#4a382a', '#5a4533', '#6c543d', '#80654a'].map((c) => hex(c));
const STONE = [hex('#26252b'), hex('#3d3c44'), hex('#57565e'), hex('#75747a'), hex('#97959a')];
const LEAF = [hex('#0e140e'), hex('#172117'), hex('#22301f'), hex('#2f4128'), hex('#405434')];
const HAY = [hex('#3a2a10'), hex('#5e4518'), hex('#86652a'), hex('#a8843c'), hex('#c8a556')];
const FOG = hex('#8b8296');

const roadX = (y) => 240 + 7 * Math.sin(y / 95) + 3 * Math.sin(y / 31);
const shade = (c, x, y, a) => c.put(x, y, hex('#000000', a));

function ground(c) {
  for (let y = 0; y < ARENA_H; y++) {
    for (let x = 0; x < ARENA_W; x++) {
      const n = fbm(x / 46, y / 46, 3);
      // Embaixo (perto da base) o chão é mais pisado e terroso
      const trodden = Math.max(0, (y - DEPLOY_Y) / 300);
      const bare = fbm(x / 22, y / 22, 5) + (fbm(x / 5, y / 5, 9) - 0.5) * 0.25 - trodden * 0.22;
      const edge = Math.abs(x - roadX(y)) - ROAD_HALF + (fbm(x / 9, y / 9, 7) - 0.5) * 16;
      if (edge < 0 && y > 70) {
        let t = 0.55 + (n - 0.5) * 0.6;
        const rut = Math.min(Math.abs(x - roadX(y) + 15), Math.abs(x - roadX(y) - 15));
        if (rut < 3) t -= 0.25 - rut * 0.06;
        if (edge > -5) t -= 0.12;
        c.put(x, y, dithered(DIRT, t, x, y));
      } else if (bare < 0.27 || (bare < 0.31 && bayer(x, y) < (0.31 - bare) / 0.04)) {
        c.put(x, y, dithered(DIRT, 0.3 + n * 0.45, x, y));
      } else {
        // Capim mais escuro na borda da terra, mais claro nos tufos altos
        const rim = Math.max(0, 1 - (bare - 0.27) / 0.08) * 0.25;
        c.put(x, y, dithered(GRASS, 0.32 + (n - 0.5) * 0.7 + (fbm(x / 8, y / 8, 11) - 0.5) * 0.35 - rim - trodden * 0.1, x, y));
      }
    }
  }
  // Tufos de capim e pedrinhas
  for (let i = 0; i < 4200; i++) {
    const x = Math.floor(hash(i, 1, 81) * ARENA_W);
    const y = Math.floor(hash(i, 2, 81) * ARENA_H);
    if (Math.abs(x - roadX(y)) < ROAD_HALF - 4) {
      if (hash(i, 3, 81) < 0.5) {
        c.put(x, y, DIRT[6]);
        c.put(x + 1, y + 1, DIRT[0]);
      }
      continue;
    }
    const tall = hash(i, 4, 81) < 0.3 ? 3 : 2;
    for (let k = 0; k < tall; k++) {
      c.put(x - 1, y - k, GRASS[Math.min(6, 3 + k)]);
      c.put(x + 1, y - k, GRASS[Math.min(6, 2 + k)]);
    }
    c.put(x, y - tall, GRASS[6]);
  }
}

function puddle(c, cx, cy, rx, ry, seed) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1 - 0.35 * fbm(x / 4, y / 4, seed)) continue;
      const rim = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 0.6;
      c.put(x, y, rim ? hex('#1c1a22') : dithered([hex('#26303c'), hex('#3a4a5a'), hex('#5a6e7e')], 0.3 + 0.5 * hash(x, y, seed), x, y));
    }
  }
}

function bloodStain(c, cx, cy, r, seed) {
  for (let y = cy - r * 2; y <= cy + r * 2; y++) {
    for (let x = cx - r * 2; x <= cx + r * 2; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.4) / r - (fbm(x / 3, y / 3, seed) - 0.5) * 1.2;
      if (d < 1) c.put(x, y, d < 0.6 ? P.blood[1] : P.blood[0]);
    }
  }
}

/** Rastro de sangue de algo arrastado pela estrada. */
function dragTrail(c, x0, y0, len, seed) {
  for (let i = 0; i < len; i++) {
    const x = x0 + Math.sin(i / 17) * 3;
    for (let w = -1; w <= 1; w++) if (hash(i, w, seed) < 0.55 - i / (len * 2.2)) c.put(Math.round(x + w), y0 + i, P.blood[hash(w, i, seed) < 0.5 ? 0 : 1]);
  }
}

/** Lápide em 3/4: face da frente, topo arredondado e sombra. Aberta = cova escavada na frente. */
function grave(c, d, x, y, kind, open) {
  for (let k = 0; k < 9; k++) shade(c, x + 5 + k, y + 2, 80);
  c = d;
  if (open) {
    c.ellipse(x, y + 9, 6, 4, { ramp: DIRT.slice(0, 4), part: 'hole', edge: 2, shift: -2 });
    c.ellipse(x, y + 9, 3.5, 2, { ramp: [hex('#0a0806')], part: 'hole' });
  } else {
    c.ellipse(x, y + 9, 5, 3.4, { ramp: DIRT.slice(1, 6), part: 'mound', edge: 1, noise: 0.2 });
  }
  const mat = { ramp: STONE, part: 'stone', edge: 1, noise: 0.15, seed: x };
  if (kind === 'cross') {
    c.polygon([v(x - 1.5, y - 9), v(x + 1.5, y - 9), v(x + 1.5, y + 3), v(x - 1.5, y + 3)], mat, [-0.3, -0.2, 1]);
    c.polygon([v(x - 5, y - 6), v(x + 5, y - 6), v(x + 5, y - 3), v(x - 5, y - 3)], mat, [-0.3, -0.2, 1]);
  } else {
    c.polygon([v(x - 4, y + 3), v(x - 4, y - 4), v(x - 2, y - 7), v(x + 2, y - 7), v(x + 4, y - 4), v(x + 4, y + 3)], mat, [-0.4, -0.3, 1]);
    c.line(x - 2, y - 3, x + 2, y - 3, STONE[1], 'stone');
  }
}

function cemetery(c, d) {
  for (let y = 0; y < 82; y++) {
    for (let x = 0; x < ARENA_W; x++) if (hash(x, y, 91) < 0.55) c.put(x, y, dithered(DIRT.slice(0, 4), 0.3 + fbm(x / 20, y / 20, 93) * 0.6, x, y));
  }
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 11; i++) {
      const x = 26 + i * 43 + (row % 2) * 20 + Math.round((hash(i, row, 95) - 0.5) * 10);
      const y = 16 + row * 22 + Math.round(hash(row, i, 97) * 4);
      if (Math.abs(x - roadX(y)) < 26 && row > 0) continue;
      grave(c, d, x, y, hash(i, row, 99) < 0.3 ? 'cross' : 'stone', hash(row, i, 101) < 0.3);
    }
  }
  // Grade de ferro com o portão arrombado na estrada
  for (let x = 0; x < ARENA_W; x++) {
    const gate = Math.abs(x - roadX(80)) < 30;
    if (gate) continue;
    c.put(x, 76, P.metal[1]);
    c.put(x, 82, P.metal[1]);
    c.put(x, 83, hex('#000000', 90));
    if (x % 4 === 0) for (let y = 70; y < 84; y++) c.put(x, y, y === 70 ? P.metal[3] : P.metal[y < 74 ? 2 : 1]);
  }
}

function fog(c) {
  for (let y = 0; y < 130; y++) {
    for (let x = 0; x < ARENA_W; x++) {
      const t = (1 - y / 130) * 0.9 + (fbm(x / 60, y / 14, 103) - 0.5) * 0.7;
      if (t > 0.25) c.put(x, y, [...FOG.slice(0, 3), Math.min(150, Math.round(t * 120))]);
    }
  }
}

/** Copa de árvore vista de cima, com sombra para baixo e para a direita. */
function treeTop(c, d, cx, cy, r, seed) {
  for (let y = cy - r; y <= cy + r * 1.5; y++) {
    for (let x = cx - r; x <= cx + r * 1.6; x++) if (Math.hypot(x - cx - r * 0.4, (y - cy - r * 0.4) * 1.1) < r) shade(c, x, y, 90);
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + hash(i, seed, 1);
    const off = i === 0 ? 0 : r * 0.55;
    d.ellipse(cx + Math.cos(a) * off, cy + Math.sin(a) * off * 0.9, r * 0.55, r * 0.5, { ramp: LEAF, part: 'leaf', edge: 1, noise: 0.25, seed: seed + i });
  }
}

function hayBale(c, d, cx, cy) {
  for (let k = 0; k < 10; k++) shade(c, cx + 2 + k, cy + 6, 80);
  c = d;
  c.ellipse(cx, cy, 8, 7, { ramp: HAY, part: 'hay', edge: 2, noise: 0.3 });
  for (let r = 2; r < 7; r += 2.5) for (let a = 0; a < 6.28; a += 0.4) c.put(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, HAY[1], 1, 'hay');
}

function sideFence(c, x) {
  for (let y = 96; y < 600; y++) {
    if (hash(y >> 4, x, 111) < 0.12) continue;
    c.put(x, y, P.wood[3]);
    c.put(x + 1, y, P.wood[1]);
  }
  for (let y = 100; y < 600; y += 26) {
    c.ellipse(x + 0.5, y, 2.2, 2.2, { ramp: P.wood, part: 'post', edge: 1 });
    shade(c, x + 3, y + 1, 90);
  }
}

/** Estacas com fita vermelha marcando onde começa a zona das tropas. */
function deployMarkers(c) {
  for (const x of [14, 466]) {
    c.capsule(v(x, DEPLOY_Y - 9), v(x, DEPLOY_Y), 1.2, 1.2, { ramp: P.wood, part: 'stake', edge: 1 });
    c.put(x + 1, DEPLOY_Y - 7, P.scarf[3]);
    c.put(x + 2, DEPLOY_Y - 6, P.scarf[2]);
    c.put(x + 2, DEPLOY_Y - 7, P.scarf[3]);
  }
  for (let x = 24; x < 456; x += 6) if (hash(x, 3, 113) < 0.6) c.put(x, DEPLOY_Y, hex('#c8b896', 70));
}

function vignette(c) {
  for (let y = 0; y < ARENA_H; y++) {
    for (let x = 0; x < ARENA_W; x++) {
      const d = Math.max(Math.abs(x - ARENA_W / 2) / (ARENA_W / 2), 0) ** 3;
      if (d > 0.35) c.put(x, y, hex('#000000', Math.round((d - 0.35) * 110)));
    }
  }
}

export function drawArena() {
  const c = new PixelCanvas(ARENA_W, ARENA_H);
  ground(c);
  puddle(c, roadX(250) - 14, 250, 9, 4, 121);
  puddle(c, 118, 470, 14, 6, 123);
  puddle(c, roadX(540) + 15, 540, 7, 3, 125);
  for (const [x, y, r, s] of [[roadX(140) + 6, 140, 7, 131], [330, 300, 5, 133], [160, 210, 4, 135], [roadX(420) - 8, 420, 6, 137], [390, 520, 4, 139], [90, 600, 5, 151]]) bloodStain(c, Math.round(x), y, r, s);
  dragTrail(c, roadX(150) + 6, 150, 120, 153);
  sideFence(c, 452);
  // Objetos num canvas à parte para ganharem contorno; as sombras vão direto no chão.
  const deco = new PixelCanvas(ARENA_W, ARENA_H);
  cemetery(c, deco);
  for (const [x, y] of [[470, 150], [468, 330], [474, 470]]) hayBale(c, deco, x, y);
  for (const [x, y, r, s] of [[-6, 128, 26, 141], [0, 300, 20, 143], [-8, 540, 28, 145], [490, 236, 24, 147], [492, 600, 26, 149], [-4, 420, 14, 155]]) treeTop(c, deco, x, y, r, s);
  deco.outline(P.outline);
  c.blit(deco, 0, 0);
  deployMarkers(c);
  fog(c);
  vignette(c);
  return c;
}
