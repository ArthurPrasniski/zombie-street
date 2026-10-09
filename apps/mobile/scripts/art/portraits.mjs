// Retratos das cartas, do Bestiário e mascotes da Home. Tudo vetorial, em PNG do tamanho certo.
import { truck } from './base.mjs';
import { drawVega, radio } from './story.mjs';
import { ellipse, flush, SHADOW, soft } from './ck.mjs';
import { savePng, surface } from './output.mjs';
import { SPELL_ART } from './icons.mjs';
import { silhouette } from './clash.mjs';
import { drawUnit, ZOMBIES } from './units.mjs';

/** Desenha `draw` (caixa de 100 x 100) recortando a janela [x, y, lado] num PNG de `size` px. */
function render(path, size, [x, y, side], draw) {
  const s = surface(size, size);
  const c = s.getCanvas();
  c.scale(size / side, size / side);
  c.translate(-x, -y);
  draw(c);
  flush();
  savePng(s, path);
  s.delete();
}

// Janela de cada retrato de carta: do peito para cima, com folga para o chapéu e a arma.
const CARD_WINDOW = {
  sniper: [12, 22, 76], sheriff: [12, 16, 76], shotgun: [12, 22, 76], chainsaw: [12, 22, 76], dog: [10, 26, 80], barricade: [6, 38, 88],
  soldier: [12, 20, 76], firefighter: [12, 18, 76], medic: [12, 18, 76], crossbow: [12, 18, 76], turret: [8, 28, 80],
  drone: [8, 22, 80], tesla: [10, 14, 80], laser: [12, 18, 76], titan: [10, 16, 80],
};
const POSES = {
  sniper: ['front', 'attack', 0], sheriff: ['front', 'idle', 0], shotgun: ['front', 'attack', 0], chainsaw: ['front', 'idle', 0], dog: ['front', 'idle', 0], barricade: ['front', 'idle', 0],
  soldier: ['front', 'attack', 0], firefighter: ['front', 'attack', 0], medic: ['front', 'idle', 0], crossbow: ['front', 'attack', 0], turret: ['side', 'idle', 0],
  drone: ['front', 'idle', 0], tesla: ['front', 'attack', 1], laser: ['front', 'attack', 0], titan: ['front', 'idle', 0],
};

export function cardPortraits(dir) {
  for (const [id, [view, kind, k]] of Object.entries(POSES)) render(`${dir}/${id}.png`, 256, CARD_WINDOW[id], (c) => silhouette(c, () => drawUnit(c, id, view, kind, k)));
  for (const [id, draw] of Object.entries(SPELL_ART)) render(`${dir}/${id}.png`, 256, [-6, -6, 112], (c) => silhouette(c, () => draw(c), 2.4));
}

// Mascote do cartão de Fases na Home (corpo inteiro, maior que no jogo).
const MASCOTS = {
  walker: ['walker', 'front', 'attack', 0, [8, 12, 86]],
};

export function mascots(dir) {
  for (const [name, [id, view, kind, k, win]] of Object.entries(MASCOTS)) render(`${dir}/${name}.png`, 512, win, (c) => silhouette(c, () => drawUnit(c, id, view, kind, k)));
  // Caminhonete da Oficina, vista de cima (a mesma da base)
  render(`${dir}/truck.png`, 512, [244, 30, 112], (c) => {
    soft(c, ellipse(300, 132, 40, 6), SHADOW, 0.45, 3);
    silhouette(c, () => truck(c, 0), 1.2);
  });
}

/** Bestiário: cada zumbi de corpo inteiro, de frente (GDD seção 17.7). */
export function bestiaryPortraits(dir) {
  for (const id of ZOMBIES) render(`${dir}/${id}.png`, 256, [6, 8, 88], (c) => silhouette(c, () => drawUnit(c, id, 'front', 'walk', 0)));
}

/** Retratos do rádio (GDD seção 18.1): rosto e ombros de quem fala. */
export function radioPortraits(dir) {
  const face = [16, 12, 68];
  render(`${dir}/sheriff.png`, 256, face, (c) => silhouette(c, () => drawUnit(c, 'sheriff', 'front', 'idle', 0)));
  render(`${dir}/sniper.png`, 256, face, (c) => silhouette(c, () => drawUnit(c, 'sniper', 'front', 'idle', 0)));
  render(`${dir}/vega.png`, 256, face, (c) => silhouette(c, () => drawVega(c)));
  render(`${dir}/static.png`, 256, [0, 0, 100], (c) => silhouette(c, () => radio(c), 2.4));
}
