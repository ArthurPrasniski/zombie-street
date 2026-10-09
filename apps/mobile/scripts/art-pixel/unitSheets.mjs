// Quadros das unidades em 3 linhas: frente, costas e perfil (olhando para a direita).
// Frente e costas reaproveitam o quadro "caído"/morte do perfil.
import { PixelCanvas } from './canvas.mjs';
import { dogFrames } from './dog.mjs';
import { drawHeroView, heroViewPose } from './heroViews.mjs';
import { HERO_LOOKS, heroFrames } from './heroes.mjs';
import { barricade } from './props.mjs';
import { zombieViewFrame } from './zombieViews.mjs';
import { ZOMBIE_LOOKS, zombieFrames } from './zombies.mjs';

export const VIEWS = ['front', 'back', 'side'];
const AROUND = ['front', 'back'];
const round = (p) => [Math.round(p.x), Math.round(p.y)];

/** Linha de frente/costas no layout das tropas. draw(kind, k) devolve o quadro. */
function troopRow(t, side, draw) {
  const frames = [];
  for (let k = 0; k < t.idle.count; k++) frames.push(draw('idle', k));
  for (let k = 0; k < t.attack.count; k++) frames.push(draw('attack', k));
  frames.push(side[t.down.start]);
  for (let k = 0; k < t.walk.count; k++) frames.push(draw('walk', k));
  return frames;
}

/** Heróis: atiradores nunca andam (a caminhada repete o parado), a motosserra anda. */
function heroRows(id, hero, t) {
  const { frames: side, muzzle } = heroFrames(hero, t);
  const muzzles = { side: round(muzzle) };
  const rows = AROUND.map((view) =>
    troopRow(t, side, (kind, k) => {
      const walks = id === 'chainsaw' || kind !== 'walk';
      const pose = heroViewPose(id, view, walks ? kind : 'idle', walks ? k : k % t.idle.count);
      const c = new PixelCanvas(64, 64);
      drawHeroView(c, id, view, pose);
      if (kind === 'attack' && k === 0 && pose.extra.weapon?.muzzle) muzzles[view] = round(pose.extra.weapon.muzzle);
      return c;
    }),
  );
  return { rows: [...rows, side], muzzles };
}

function dogRows(t) {
  const side = dogFrames();
  const rows = AROUND.map((view) => troopRow(t, side, (kind, k) => zombieViewFrame(new PixelCanvas(64, 64), 'dog', view, kind, k)));
  return [...rows, side];
}

/** Barricada: igual nas 3 linhas (parado = estados de dano, caído = escombros). */
function barricadeRows(t) {
  const [intact, damaged, heavy, rubble] = [0, 1, 2, 3].map(barricade);
  const frames = [intact, damaged, heavy, heavy];
  while (frames.length < t.down.start) frames.push(intact);
  frames.push(rubble);
  while (frames.length < t.walk.start + t.walk.count) frames.push(intact);
  return VIEWS.map(() => frames);
}

function zombieRows(id, look, z) {
  const side = zombieFrames(look, z);
  const rows = AROUND.map((view) => {
    const frames = [];
    for (let k = 0; k < z.walk.count; k++) frames.push(zombieViewFrame(new PixelCanvas(64, 64), id, view, 'walk', k));
    for (let k = 0; k < z.attack.count; k++) frames.push(zombieViewFrame(new PixelCanvas(64, 64), id, view, 'attack', k));
    return frames.concat(side.slice(z.death.start, z.death.start + z.death.count));
  });
  return [...rows, side];
}

/** Todas as unidades: { id: { rows: [frente, costas, perfil], muzzles? } }. */
export function unitSheets(layout) {
  const out = { dog: { rows: dogRows(layout.troops) }, barricade: { rows: barricadeRows(layout.troops) } };
  for (const [id, hero] of Object.entries(HERO_LOOKS)) out[id] = heroRows(id, hero, layout.troops);
  for (const [id, look] of Object.entries(ZOMBIE_LOOKS)) out[id] = { rows: zombieRows(id, look, layout.zombies) };
  return out;
}
