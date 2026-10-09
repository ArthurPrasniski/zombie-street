// Ponto único para desenhar qualquer unidade num quadro de 100 x 100 unidades.
// Tropas: idle, attack, down, walk. Zumbis: walk, attack, death (perfil caindo).
import { drawChibi, GROUND } from './chibi.mjs';
import { ellipse, SHADOW, soft } from './ck.mjs';
import { drawDog } from './dog.mjs';
import { heroPose } from './heroPoses.mjs';
import { HERO_LOOKS as FIRST_HEROES } from './heroes.mjs';
import { NEW_HERO_LOOKS } from './heroes2.mjs';
import { SCIFI_HERO_LOOKS } from './heroes3.mjs';
import { drawDrone, drawTesla, laserRifle } from './scifi.mjs';
import { drawTurret } from './turret.mjs';
import { barricade } from './props.mjs';
import { chainsaw, crossbow, flamethrower, held, machinegun, medbag, revolver, rifle, shotgun } from './weapons.mjs';
import { ZOMBIE_LOOKS as FIRST_ZOMBIES, zombiePose } from './zombies.mjs';
import { NEW_ZOMBIE_LOOKS } from './zombies2.mjs';
import { SPECIAL_ZOMBIE_LOOKS } from './zombies3.mjs';
import { ACT2_ZOMBIE_LOOKS } from './zombies4.mjs';
import { ACT3_ZOMBIE_LOOKS, drawPod, drawWorm } from './zombies5.mjs';

const HERO_LOOKS = { ...FIRST_HEROES, ...NEW_HERO_LOOKS, ...SCIFI_HERO_LOOKS };
const ZOMBIE_LOOKS = { ...FIRST_ZOMBIES, ...NEW_ZOMBIE_LOOKS, ...SPECIAL_ZOMBIE_LOOKS, ...ACT2_ZOMBIE_LOOKS, ...ACT3_ZOMBIE_LOOKS };
// Zumbis com desenho próprio (fora do boneco chibi)
const CUSTOM_ZOMBIES = { pod: drawPod, lunarWorm: drawWorm };
export const HEROES = Object.keys(HERO_LOOKS);
export const ZOMBIES = [...Object.keys(ZOMBIE_LOOKS), ...Object.keys(CUSTOM_ZOMBIES)];
const DROPPED = { sniper: rifle, sheriff: revolver, shotgun, chainsaw, soldier: machinegun, firefighter: flamethrower, medic: medbag, crossbow, laser: laserRifle };

/** Deita o desenho de perfil: gira em volta dos pés e desloca para caber no quadro. */
function lying(c, t, draw) {
  c.save();
  c.translate(24 * t, -10 * t);
  c.rotate(-90 * t, 50, GROUND);
  draw();
  c.restore();
}

function heroDown(c, id) {
  soft(c, ellipse(50, GROUND - 6, 34, 5), SHADOW, 0.35, 1.6);
  if (DROPPED[id]) held(c, DROPPED[id], [70, GROUND - 3], -8);
  const a = heroPose(id, 'side', 'idle', 0);
  a.s = { ...a.s, ko: true, weapon: null };
  lying(c, 1, () => drawChibi(c, HERO_LOOKS[id], a));
}

/** Morte em 5 quadros: o zumbi tomba para trás e a poça de sangue cresce. */
function zombieDeath(c, id, k) {
  const t = [0, 0.22, 0.55, 0.88, 1][k];
  if (k >= 2) soft(c, ellipse(46, GROUND - 7, 10 + k * 5, 3 + k), '#8a1a2a', 0.55, 1);
  const a = zombiePose(ZOMBIE_LOOKS[id], 'side', 'walk', 0);
  a.s = { ...a.s, noShadow: k > 0 };
  lying(c, t, () => drawChibi(c, ZOMBIE_LOOKS[id], a));
}

export function drawUnit(c, id, view, kind, k) {
  if (id === 'dog') return drawDog(c, view, kind, k);
  if (id === 'barricade') return barricade(c, kind === 'down' ? 3 : kind === 'idle' ? Math.min(k, 2) : 0);
  if (id === 'turret') return drawTurret(c, view, kind, k);
  if (id === 'drone') return drawDrone(c, view, kind, k);
  if (id === 'tesla') return drawTesla(c, view, kind, k);
  if (HERO_LOOKS[id]) {
    if (kind === 'down') return heroDown(c, id);
    const a = heroPose(id, view, kind, k);
    drawChibi(c, HERO_LOOKS[id], a);
    return a;
  }
  if (CUSTOM_ZOMBIES[id]) return CUSTOM_ZOMBIES[id](c, view, kind, k);
  if (kind === 'death') return zombieDeath(c, id, k);
  drawChibi(c, ZOMBIE_LOOKS[id], zombiePose(ZOMBIE_LOOKS[id], view, kind, k));
}
