// Peças comuns das arenas dos 5 mundos (unidades do mundo, 600 x 900).
import { blob, capsule, circle, ellipse, fill, gradient, lighten, moved, poly, rrect, SHADOW, soft, toon } from './ck.mjs';
import { WOOD } from './props.mjs';

export const ARENA_W = 600;
export const ARENA_H = 900;
export const DEPLOY_Y = 470;

// Ruído determinístico simples para espalhar enfeites
export const rand = (i, s = 1) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Centro da estrada (ou trilha) na altura y: serpenteia de leve. */
export const roadX = (y) => 300 + 10 * Math.sin(y / 120) + 4 * Math.sin(y / 37);

/** Fundo inteiro de uma cor com manchas mais claras/escuras (capim, areia, neve, lama). */
export function blotches(c, base, tones, seed, count = 46) {
  fill(c, rrect(0, 0, ARENA_W, ARENA_H, 0), base);
  for (let i = 0; i < count; i++) {
    const x = rand(i, seed) * ARENA_W;
    const y = 110 + rand(i, seed + 1) * 680;
    const r = 18 + rand(i, seed + 2) * 34;
    fill(c, blob4(x, y, r), tones[i % tones.length], 0.7);
  }
}

const blob4 = (x, y, r) => poly([[x - r, y], [x - r * 0.3, y - r * 0.6], [x + r * 0.5, y - r * 0.5], [x + r, y + r * 0.1], [x + r * 0.2, y + r * 0.6], [x - r * 0.6, y + r * 0.4]]);

/**
 * Ladrilhos em xadrez (como as arenas do Clash): quadrados alternando um pouco mais claro e
 * um pouco mais escuro por cima do chão do mundo, com um miolo arredondado mais claro.
 */
export function clashTiles(c, strength = 1, top = 0, bottom = ARENA_H) {
  const tile = 50;
  for (let y = top; y < bottom; y += tile) {
    for (let x = 0; x < ARENA_W; x += tile) {
      const odd = (x / tile + y / tile) % 2 === 1;
      fill(c, rrect(x, y, tile, tile, 0), odd ? '#000000' : '#ffffff', 0.06 * strength);
      fill(c, rrect(x + 3, y + 3, tile - 6, tile - 6, 10), '#ffffff', 0.04 * strength);
    }
  }
}

/** Faixa de névoa descendo do topo (onde os zumbis surgem). */
export function topFog(c, color, alpha, light) {
  gradient(c, rrect(0, 0, ARENA_W, 200, 0), color, color, 0, 200, alpha, 0);
  for (let i = 0; i < 9; i++) soft(c, ellipse(rand(i, 60) * ARENA_W, 120 + rand(i, 61) * 50, 70, 16), light, 0.14, 12);
}

export function puddle(c, x, y, rx, ry, water = '#3d6f9e') {
  toon(c, ellipse(x, y, rx, ry), water, { line: 1.4, depth: 1.5, light: lighten(water, 0.35) });
  fill(c, ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.35, ry * 0.25), '#cfe8ff', 0.6);
}

/** Carro batido visto de cima (carroceria, teto, vidros), girado `rot` graus. */
export function wreck(c, x, y, rot, color) {
  const at = (p) => moved(p, { rot, px: x, py: y });
  soft(c, at(rrect(x - 20, y - 38, 48, 86, 12)), SHADOW, 0.35, 5);
  toon(c, at(rrect(x - 24, y - 44, 48, 88, 12)), color, { depth: 3 });
  toon(c, at(rrect(x - 18, y - 14, 36, 34, 8)), lighten(color, 0.12), { depth: 2 });
  toon(c, at(rrect(x - 17, y - 28, 34, 12, 4)), '#5a7a8a', { line: 1.6, depth: 1, light: '#a8c8d8' });
  toon(c, at(rrect(x - 17, y + 22, 34, 9, 4)), '#3a4a52', { line: 1.6, depth: 1 });
}

/** Copa de árvore vista de cima, com sombra. */
export function tree(c, x, y, r, leaves = '#1f6a45') {
  soft(c, ellipse(x + r * 0.35, y + r * 0.55, r, r * 0.7), SHADOW, 0.35, 6);
  toon(c, blob([[x - r, y], [x - r * 0.7, y - r * 0.8], [x, y - r], [x + r * 0.8, y - r * 0.7], [x + r, y + r * 0.1], [x + r * 0.5, y + r * 0.8], [x - r * 0.5, y + r * 0.8]]), leaves, { line: 2.2, depth: r * 0.22 });
  fill(c, circle(x - r * 0.35, y - r * 0.4, r * 0.32), lighten(leaves, 0.18), 0.8);
}

/** Estacas com fita marcando o começo da zona das tropas. */
export function deployMarks(c) {
  for (const x of [18, 582]) {
    toon(c, capsule([x, DEPLOY_Y - 16], [x, DEPLOY_Y], 2.2), WOOD, { line: 1.4, depth: 1 });
    fill(c, poly([[x + 1, DEPLOY_Y - 15], [x + 10, DEPLOY_Y - 13], [x + 1, DEPLOY_Y - 10]]), '#ff5a5f');
  }
  for (let x = 40; x < 560; x += 16) fill(c, rrect(x, DEPLOY_Y - 1, 8, 2.4, 1.2), '#ffffff', 0.18);
  // A metade de baixo é um pouco mais clara (o nosso lado)
  fill(c, rrect(0, DEPLOY_Y, ARENA_W, 300, 0), '#ffffff', 0.04);
}
