// Armas desenhadas ao longo de um eixo: u = para a frente (cano), w = para cima.
// Coordenadas e raios em pixels de escala 1, multiplicados por k.
import { P } from './palette.mjs';
import { add, v } from './rig.mjs';

/**
 * Converte coordenadas da arma (u, w) em pixels do quadro. `depth` < 1 encurta o cano na vertical
 * da tela (arma apontando para o fundo ou para a câmera, na vista de cima inclinada).
 */
export function frame(origin, ang, k = 1, depth = 1) {
  const dir = v(Math.cos(ang), Math.sin(ang) * depth);
  const up = v(Math.sin(ang), -Math.cos(ang));
  return (u, w) => add(origin, v((dir.x * u + up.x * w) * k, (dir.y * u + up.y * w) * k));
}

const metal = { ramp: P.metal, part: 'gun', edge: 1, dither: 0.4 };
const steel = { ramp: P.steel, part: 'gun', edge: 1, dither: 0.4 };
const wood = { ramp: P.wood, part: 'gun', edge: 1, dither: 0.4, noise: 0.05 };

/** Rifle de precisão com luneta. Retorna a posição da boca do cano. */
export function rifle(c, grip, ang, k = 1, depth = 1) {
  const at = frame(grip, ang, k, depth);
  c.polygon([at(-9, -2.4), at(-1, -0.6), at(1, 1.6), at(-8, 1.4)], wood);
  c.polygon([at(-1, -1.2), at(7, -1.2), at(7, 1.4), at(-1, 1.6)], metal);
  c.capsule(at(7, 0.3), at(25, 0.3), 1 * k, 0.8 * k, metal);
  c.polygon([at(7, -1.2), at(15, -0.6), at(15, 0.8), at(7, 1.4)], wood);
  c.capsule(at(1, 2.9), at(9, 2.9), 1.5 * k, 1.5 * k, { ...metal, shift: 1 });
  c.polygon([at(3, 1.2), at(5, 1.2), at(5, 2), at(3, 2)], metal);
  c.put(at(9.6, 3).x, at(9.6, 3).y, P.flash[1], 3, 'gun');
  c.polygon([at(1, -1), at(3, -1), at(2.4, -3.6), at(0.8, -3.4)], metal);
  return at(26, 0.3);
}

/** Revólver na mão: cabo na empunhadura, cano para a frente. */
export function revolver(c, grip, ang, k = 1, depth = 1) {
  const at = frame(grip, ang, k, depth);
  c.polygon([at(-1.2, -2.8), at(1.2, -2.8), at(1.4, 0.8), at(-1, 0.8)], wood);
  c.polygon([at(-0.5, 0.2), at(3.2, 0.2), at(3.2, 2.4), at(-0.5, 2.4)], steel);
  c.capsule(at(3, 1.6), at(7.5, 1.6), 0.8 * k, 0.7 * k, steel);
  return at(8.2, 1.6);
}

/** Motosserra: corpo laranja com alça e sabre com corrente. */
export function chainsaw(c, grip, ang, { blur = false, tick = 0, k = 1, depth = 1 } = {}) {
  const at = frame(grip, ang, k, depth);
  c.polygon([at(-4, -2.6), at(4, -2.6), at(5, 3.6), at(-4, 3.6)], { ramp: P.sawBody, part: 'gun', edge: 1, dither: 0.5 });
  c.capsule(at(-3, 4.4), at(2, 4.4), 0.8 * k, 0.8 * k, metal);
  c.capsule(at(-4, 0.5), at(-6.5, 0.5), 1 * k, 0.8 * k, metal);
  c.put(at(1, 1).x, at(1, 1).y, P.metal[0], 0, 'gun');
  c.capsule(at(4, 0.3), at(17, 0.3), 1.8 * k, 1.4 * k, steel);
  // Um dente por pixel ao longo do sabre, alternando claro e escuro.
  for (let i = 0; i <= 13 * k; i++) {
    const u = 4 + i / k;
    const dark = (i + tick) % 2 === 0;
    const top = at(u, 2.2);
    const bottom = at(u, -1.6);
    c.put(top.x, top.y, dark ? P.metal[0] : P.steel[3], 1, 'gun');
    c.put(bottom.x, bottom.y, dark ? P.steel[3] : P.metal[0], 1, 'gun');
  }
  if (blur) {
    for (let s = 1; s <= 3; s++) {
      const smear = frame(grip, ang - s * 0.22, k, depth);
      c.capsule(smear(6, 0.3), smear(17, 0.3), 1.2 * k, 1 * k, { ramp: P.steel, part: 'fx', dither: 0.9, shift: -s });
    }
  }
  return at(17.5, 0.3);
}

/** Clarão de disparo em estrela. */
export function muzzleFlash(c, at, ang, size = 1, k = 1) {
  const f = frame(at, ang, k);
  const r = size * k;
  c.capsule(f(0, 0), f(4 * size, 0), 1.8 * r, 0.4 * k, { ramp: P.flash.slice().reverse(), part: 'fx', ambient: 1, edge: 0 });
  c.capsule(f(0.5, 0), f(2, 2.6 * size), 0.9 * k, 0.3 * k, { ramp: [P.flash[1]], part: 'fx' });
  c.capsule(f(0.5, 0), f(2, -2.6 * size), 0.9 * k, 0.3 * k, { ramp: [P.flash[1]], part: 'fx' });
  c.ellipse(f(0.6, 0).x, f(0.6, 0).y, 1.4 * r, 1.4 * r, { ramp: [P.flash[0]], part: 'fx' });
}

/** Escopeta de bomba: coronha de madeira, cano duplo curto e telha (pump) embaixo. */
export function shotgun(c, grip, ang, k = 1, depth = 1) {
  const at = frame(grip, ang, k, depth);
  c.polygon([at(-8, -2.2), at(-1, -0.6), at(1, 1.4), at(-7, 1.2)], wood);
  c.polygon([at(-1, -1), at(5, -1), at(5, 1.4), at(-1, 1.6)], metal);
  c.capsule(at(5, 0.8), at(19, 0.8), 0.9 * k, 0.9 * k, metal);
  c.capsule(at(5, -0.6), at(17, -0.6), 0.9 * k, 0.8 * k, { ...metal, shift: -1 });
  c.polygon([at(8, -1.6), at(13, -1.6), at(13, -0.2), at(8, -0.2)], wood);
  return at(20, 0.4);
}
