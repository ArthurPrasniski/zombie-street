// Torreta: metralhadora num tripé com escudo e caixa de munição. Gira para a vista
// (de frente mira para baixo, de costas para cima, de perfil para a direita).
import { GROUND } from './chibi.mjs';
import { capsule, darken, ellipse, rrect, SHADOW, soft, toon } from './ck.mjs';
import { held, machinegun } from './weapons.mjs';

const METAL = '#5a6078';
const OLIVE = '#5b6b3a';

function tripod(c) {
  for (const [fx, fy, shade] of [[50, GROUND - 6, 0.25], [34, GROUND, 0], [66, GROUND, 0]]) {
    toon(c, capsule([50, 68], [fx, fy], 2.4, 1.8), darken(METAL, shade), { depth: 1 });
  }
  toon(c, ellipse(50, 68, 11, 5), darken(METAL, 0.1), { depth: 1.6 });
}

/** kind: idle (balança de leve), attack (k = 1 com clarão), down (sucata). Devolve a boca do cano. */
export function drawTurret(c, view, kind, k) {
  soft(c, ellipse(50, GROUND, 24, 4.5), SHADOW, 0.35, 1.6);
  if (kind === 'down') {
    toon(c, capsule([28, GROUND - 3], [48, GROUND - 6], 2, 1.6), METAL, { depth: 1 });
    toon(c, capsule([54, GROUND - 2], [74, GROUND - 5], 2, 1.6), darken(METAL, 0.2), { depth: 1 });
    held(c, machinegun, [40, GROUND - 10], 10);
    toon(c, rrect(58, GROUND - 14, 14, 10, 2), OLIVE, { depth: 1.2 });
    return null;
  }
  tripod(c);
  const sway = kind === 'idle' ? [0, 3, 0, -3][k % 4] : 0;
  const recoil = kind === 'attack' ? [0, 1.5, 0.8, 0][k] : 0;
  const flash = kind === 'attack' && k === 1 ? 1 : 0;
  const side = view === 'side';
  // Caixa de munição e escudo atrás da arma
  toon(c, rrect(side ? 34 : 58, 56, 14, 11, 2), OLIVE, { depth: 1.4 });
  const shield = () => toon(c, rrect(side ? 56 : 36, side ? 44 : 50, side ? 6 : 28, side ? 22 : 10, 3), darken(OLIVE, 0.1), { depth: 1.6 });
  shield();
  let muzzle;
  if (view === 'front') muzzle = held(c, machinegun, [50 + sway * 0.3, 56 - recoil], 90 + sway, { depth: 0.45, flash });
  else if (view === 'back') muzzle = held(c, machinegun, [50 + sway * 0.3, 62 + recoil], -90 + sway, { depth: 0.6, flash });
  else muzzle = held(c, machinegun, [42 - recoil, 56], sway, { flash });
  return { muzzle };
}
