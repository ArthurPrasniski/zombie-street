// Armas em coordenadas locais (empunhadura na origem, cano para +x). `held` posiciona, gira e
// encurta o cano (depth < 1) quando a arma aponta para o fundo ou para a câmera.
import { capsule, circle, darken, fill, line, poly, rrect, toon } from './ck.mjs';

const WOOD = '#9a5a2e';
const METAL = '#4a5068';
const STEEL = '#9aa3b8';
const SAW = '#ff8a1f';

export function rifle(c) {
  toon(c, poly([[-12, -2], [-1, -2.6], [1, 2.6], [-11, 3.6]]), WOOD, { depth: 1.2 });
  toon(c, rrect(-1, -2.8, 12, 5, 1.5), METAL, { depth: 1.2 });
  toon(c, capsule([10, -0.5], [34, -0.5], 1.6, 1.3), METAL, { depth: 0.8, noLight: true });
  toon(c, rrect(1, -6.6, 10, 3.4, 1.6), darken(METAL, 0.3), { depth: 0.8 });
  fill(c, circle(10.6, -4.9, 1.1), '#7fe0ff');
  return 34;
}

export function revolver(c) {
  toon(c, poly([[-2, 0], [2, -0.6], [2.6, 6], [-1.4, 6.4]]), WOOD, { depth: 1 });
  toon(c, rrect(0, -3.4, 6, 5, 1.8), STEEL, { depth: 1 });
  toon(c, capsule([5, -1.8], [13, -1.8], 1.4, 1.2), STEEL, { depth: 0.6, noLight: true });
  return 13.5;
}

export function shotgun(c) {
  toon(c, poly([[-11, -1.4], [-1, -2.4], [1, 2.6], [-10, 4]]), WOOD, { depth: 1.2 });
  toon(c, rrect(-1, -2.6, 9, 5, 1.5), METAL, { depth: 1.2 });
  toon(c, capsule([7, -1.4], [27, -1.4], 1.6), METAL, { depth: 0.8, noLight: true });
  toon(c, capsule([7, 1.6], [25, 1.6], 1.5), darken(METAL, 0.2), { depth: 0.8, noLight: true });
  toon(c, rrect(12, -0.2, 8, 4.4, 2), WOOD, { depth: 1 });
  return 27;
}

/** Motosserra: corpo laranja com alça e sabre com dentes. `tick` alterna os dentes. */
export function chainsaw(c, tick = 0) {
  toon(c, rrect(4, -4.4, 22, 8.8, 4.4), STEEL, { depth: 1.2 });
  for (let i = 0; i < 7; i++) {
    const x = 6 + i * 3 + (tick % 2) * 1.5;
    fill(c, poly([[x, -4.6], [x + 1.6, -6.4], [x + 2.2, -4.6]]), '#3a3f52');
    fill(c, poly([[x, 4.6], [x + 1.6, 6.4], [x + 2.2, 4.6]]), '#3a3f52');
  }
  toon(c, rrect(-9, -6, 15, 12, 4), SAW, { depth: 2 });
  toon(c, poly([[-8, -6], [-4, -11], [3, -11], [3, -8.5], [-3, -8.5], [-5, -6]]), darken(METAL, 0.2), { depth: 1 });
  return 26;
}

/** Metralhadora: corpo comprido, carregador embaixo e cano com quebra-chamas. */
export function machinegun(c) {
  toon(c, poly([[-12, -1.6], [-2, -2.6], [0, 2.8], [-11, 3.6]]), METAL, { depth: 1.2 });
  toon(c, rrect(-2, -3.2, 18, 6.4, 2), METAL, { depth: 1.2 });
  toon(c, rrect(5, 2.4, 5, 8, 1.5), darken(METAL, 0.3), { depth: 1 });
  toon(c, capsule([15, -0.6], [30, -0.6], 1.5, 1.3), METAL, { depth: 0.8, noLight: true });
  toon(c, rrect(27, -2.4, 5, 3.6, 1.2), darken(METAL, 0.2), { depth: 0.6 });
  toon(c, rrect(2, -6, 8, 2.8, 1.4), darken(METAL, 0.3), { depth: 0.6 });
  return 32;
}

/** Lança-chamas: punho, tubo vermelho e bico com chama-piloto. */
export function flamethrower(c) {
  toon(c, rrect(-6, -3, 12, 6, 2), METAL, { depth: 1 });
  toon(c, capsule([4, 0], [22, 0], 2.6, 2.2), '#d23a2a', { depth: 1.2 });
  toon(c, rrect(20, -3.2, 6, 6.4, 1.6), STEEL, { depth: 1 });
  toon(c, poly([[-4, 3], [0, 3], [-1, 9], [-5, 9]]), darken(METAL, 0.2), { depth: 0.8 });
  fill(c, circle(27.5, 0, 1.6), '#ffd23f');
  return 27;
}

/** Besta: coronha, arco de lado a lado e corda esticada com o virote. */
export function crossbow(c) {
  toon(c, poly([[-10, -1.6], [14, -1.6], [16, 1.6], [-9, 2.4]]), WOOD, { depth: 1.2 });
  toon(c, capsule([10, -11], [12, 0], 1.4, 1.6), darken(WOOD, 0.15), { depth: 0.8 });
  toon(c, capsule([12, 0], [10, 11], 1.6, 1.4), darken(WOOD, 0.15), { depth: 0.8 });
  line(c, [[10, -11], [2, 0], [10, 11]], '#e8e0c8', 0.9);
  toon(c, capsule([2, 0], [20, 0], 0.8), STEEL, { line: 1, depth: 0.4, noLight: true });
  fill(c, poly([[20, -1.8], [23.5, 0], [20, 1.8]]), STEEL);
  return 23;
}

/** Maleta de primeiros socorros com a cruz vermelha (Médica). */
export function medbag(c) {
  toon(c, rrect(-6, -2, 12, 3, 1.4), '#c8ccd8', { line: 1.4, depth: 0.6 });
  toon(c, rrect(-9, 0, 18, 12, 3), '#f4f1ea', { depth: 1.6 });
  fill(c, rrect(-1.6, 2.4, 3.2, 7.2, 0.8), '#ff4d5a');
  fill(c, rrect(-3.6, 4.4, 7.2, 3.2, 0.8), '#ff4d5a');
  return 0;
}

/** Clarão de tiro em estrela, apontando para +x. */
export function muzzleFlash(c, size = 1) {
  const s = size;
  const star = poly([[0, -3 * s], [5 * s, -5.5 * s], [4 * s, -1.6 * s], [13 * s, 0], [4 * s, 1.6 * s], [5 * s, 5.5 * s], [0, 3 * s], [2 * s, 0]]);
  toon(c, star, '#ffd23f', { line: 1.2, depth: 1, light: '#fff8c8' });
  fill(c, circle(3.5 * s, 0, 2.4 * s), '#fffbe6');
}

/**
 * Desenha a arma na mão: grip [x, y], ângulo em graus (0 = direita, 90 = para baixo),
 * depth encurta o cano. Devolve a boca do cano em coordenadas do quadro.
 */
export function held(c, draw, grip, angle, { depth = 1, flash = 0, tick = 0 } = {}) {
  c.save();
  c.translate(grip[0], grip[1]);
  c.rotate(angle, 0, 0);
  c.scale(depth, 1);
  const len = draw(c, tick);
  if (flash) {
    c.save();
    c.translate(len, -0.5);
    c.scale(1 / depth, 1);
    muzzleFlash(c, flash);
    c.restore();
  }
  c.restore();
  const r = (angle * Math.PI) / 180;
  return [grip[0] + Math.cos(r) * len * depth, grip[1] + Math.sin(r) * len * depth];
}
