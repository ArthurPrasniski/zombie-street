// Cena do topo da Home, de ponta a ponta: céu alto (atrás do relógio, das pílulas e do logo),
// estrada no pôr do sol em perspectiva, horda ao fundo, heróis de frente e, embaixo, um degradê
// que some na cor de fundo do app. Desenhada em 720 x 790 unidades.
import { blob, circle, ellipse, fill, gradient, poly, rrect, SHADOW, soft } from './ck.mjs';
import { silhouette } from './clash.mjs';
import { drawUnit } from './units.mjs';

export const LOBBY_W = 720;
export const LOBBY_H = 790;
// Mesma cor de colors.background (src/ui/theme.ts): o degradê precisa terminar nela.
const APP_BACKGROUND = '#16141a';
const HORIZON = 380;
const VANISH = 362;
const FEET = 600;
const FADE = 210;

const rand = (i, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Unidade desenhada na caixa de 100 x 100 com os pés em (x, y).
function unit(c, id, view, kind, k, x, y, scale, flip = false) {
  c.save();
  c.translate(x, y);
  c.scale(flip ? -scale : scale, scale);
  c.translate(-50, -94);
  silhouette(c, () => drawUnit(c, id, view, kind, k));
  c.restore();
}

function sky(c) {
  gradient(c, rrect(0, 0, LOBBY_W, 280, 0), '#141219', '#5c2434', 0, 280);
  gradient(c, rrect(0, 280, LOBBY_W, HORIZON - 280 + 2, 0), '#5c2434', '#f07a2a', 280, HORIZON);
  for (let i = 0; i < 40; i++) fill(c, circle(rand(i) * LOBBY_W, rand(i, 2) * 230, 0.8 + rand(i, 3) * 1.4), '#f7f2e8', 0.3 + rand(i, 4) * 0.5);
  soft(c, circle(540, HORIZON - 6, 90), '#ffb347', 0.35, 30);
  fill(c, circle(540, HORIZON - 4, 48), '#ffd25a');
  fill(c, circle(540, HORIZON - 4, 40), '#ffe58a');
  for (const [x, y, w] of [[470, 335, 120], [150, 300, 160], [610, 250, 110], [300, 225, 140]]) fill(c, rrect(x - w / 2, y, w, 9, 4.5), '#3a1c2a', 0.55);
}

function farLand(c) {
  // Morros, moinho e casa em silhueta no horizonte
  fill(c, blob([[-20, HORIZON + 6], [80, HORIZON - 26], [200, HORIZON - 8], [300, HORIZON - 30], [430, HORIZON - 4], [560, HORIZON - 22], [740, HORIZON - 6], [740, HORIZON + 30], [-20, HORIZON + 30]]), '#2a1f2c');
  const ink = '#1d1620';
  fill(c, poly([[96, HORIZON - 20], [104, HORIZON - 88], [112, HORIZON - 20]]), ink);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    fill(c, poly([[104, HORIZON - 88], [104 + Math.cos(a) * 26, HORIZON - 88 + Math.sin(a) * 26], [104 + Math.cos(a + 0.25) * 26, HORIZON - 88 + Math.sin(a + 0.25) * 26]]), ink);
  }
  fill(c, rrect(600, HORIZON - 40, 46, 30, 3), ink);
  fill(c, poly([[594, HORIZON - 40], [623, HORIZON - 62], [652, HORIZON - 40]]), ink);
}

/** Meia largura da estrada na altura y (perspectiva a partir do ponto de fuga). */
const roadHalf = (y, edge) => edge + ((y - HORIZON) / (FEET - HORIZON)) * (282 - edge);

function ground(c) {
  gradient(c, rrect(0, HORIZON, LOBBY_W, LOBBY_H - HORIZON, 0), '#1d4a3c', '#2c7d5b', HORIZON, FEET);
  for (const [w, color] of [[14, '#a87d4e'], [10, '#cfa169']]) {
    const bottom = roadHalf(LOBBY_H, w) - (w === 10 ? 28 : 0);
    fill(c, poly([[VANISH - w, HORIZON], [VANISH + w, HORIZON], [VANISH + bottom, LOBBY_H], [VANISH - bottom, LOBBY_H]]), color);
  }
  // Linha tracejada amarela, maior perto da câmera
  for (let i = 0; i < 11; i++) {
    const t0 = (i / 11) ** 1.8;
    const t1 = ((i + 0.5) / 11) ** 1.8;
    const y0 = HORIZON + (LOBBY_H - HORIZON) * t0;
    const y1 = HORIZON + (LOBBY_H - HORIZON) * t1;
    const w0 = 1 + 9 * t0;
    const w1 = 1 + 9 * t1;
    fill(c, poly([[VANISH - w0, y0], [VANISH + w0, y0], [VANISH + w1, y1], [VANISH - w1, y1]]), '#ffc928');
  }
  for (let i = 0; i < 6; i++) soft(c, ellipse(60 + i * 125, HORIZON + 14, 90, 14), '#b8e835', 0.16, 14);
}

export function drawLobby(c) {
  sky(c);
  farLand(c);
  ground(c);
  // Horda chegando (de frente, pequena ao fundo)
  for (const [id, x, y, s, k] of [['walker', 334, 418, 0.42, 1], ['runner', 396, 414, 0.4, 3], ['walker', 300, 438, 0.52, 4], ['brute', 430, 444, 0.52, 2], ['walker', 252, 428, 0.44, 0], ['runner', 468, 428, 0.44, 5]]) {
    unit(c, id, 'front', 'walk', k, x, y, s);
  }
  soft(c, ellipse(360, FEET - 8, 300, 26), SHADOW, 0.4, 10);
  // Heróis de frente, prontos
  unit(c, 'sniper', 'front', 'idle', 0, 160, FEET - 12, 2.1);
  unit(c, 'chainsaw', 'front', 'idle', 1, 462, FEET - 8, 2.2);
  unit(c, 'sheriff', 'front', 'attack', 0, 312, FEET, 2.45);
  unit(c, 'dog', 'side', 'idle', 0, 606, FEET - 8, 1.85, true);
  // Escurece o alto (leitura das pílulas e do logo) e some na cor de fundo do app embaixo
  gradient(c, rrect(0, 0, LOBBY_W, 160, 0), APP_BACKGROUND, APP_BACKGROUND, 0, 160, 0.55, 0);
  gradient(c, rrect(0, LOBBY_H - FADE, LOBBY_W, FADE, 0), APP_BACKGROUND, APP_BACKGROUND, LOBBY_H - FADE, LOBBY_H - 8, 0, 1);
  fill(c, rrect(0, LOBBY_H - 8, LOBBY_W, 8, 0), APP_BACKGROUND);
}
