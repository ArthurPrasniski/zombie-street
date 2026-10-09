// Acabamento "Clash 2D" das unidades: contorno escuro em volta da figura inteira e os quadros
// das animações (8 por animação) com antecipação e esticar/achatar em volta dos pés.
import { GROUND } from './chibi.mjs';
import { CK, rgba } from './ck.mjs';

/** Contorno escuro em volta da figura inteira: silhueta dilatada por baixo do desenho. */
export function silhouette(c, draw, radius = 1.7) {
  const p = new CK.Paint();
  const dilate = CK.ImageFilter.MakeDilate(radius, radius, null);
  p.setImageFilter(CK.ImageFilter.MakeColorFilter(CK.ColorFilter.MakeBlend(rgba('#120e18'), CK.BlendMode.SrcIn), dilate));
  c.saveLayer(p);
  draw();
  c.restore();
  p.delete();
  return draw();
}

/** Estica/achata em volta dos pés (sx largura, sy altura). */
export function squash(c, sx, sy, draw) {
  c.save();
  c.translate(50, GROUND);
  c.scale(sx, sy);
  c.translate(-50, -GROUND);
  const out = draw();
  c.restore();
  return out;
}

/** Ponto do desenho depois do esticar/achatar (boca da arma). */
export const squashed = ([x, y], sx, sy) => [50 + (x - 50) * sx, GROUND + (y - GROUND) * sy];

// [pose (0 a 3), largura, altura] para cada um dos 8 quadros de ataque.
// Atiradores: mira, antecipa (achata), dispara (estica), coice, volta.
const SHOOT = [[0, 1, 1], [0, 1.05, 0.94], [0, 1.08, 0.9], [1, 0.94, 1.08], [2, 0.97, 1.04], [2, 1, 1], [3, 1.01, 0.99], [0, 1, 1]];
// Motosserra: pronta, ergue (estica), segura (achata), golpe (estica), acompanha.
const SAW = [[0, 1, 1], [1, 0.96, 1.06], [1, 1.05, 0.94], [2, 0.93, 1.08], [2, 1, 1], [3, 1.02, 0.98], [3, 1, 1], [0, 1, 1]];
// Rex: agacha, salta, morde, volta.
const BITE = [[0, 1.06, 0.92], [0, 1.08, 0.9], [1, 0.94, 1.08], [1, 0.96, 1.05], [2, 1, 1], [2, 1, 1], [3, 1, 1], [0, 1, 1]];
// Zumbis: ergue os braços, avança (golpe no quadro 3), morde, volta.
const LUNGE = [[0, 1, 1], [0, 1.04, 0.95], [1, 0.95, 1.06], [1, 1, 1], [2, 1.04, 0.96], [2, 1, 1], [3, 1, 1], [0, 1, 1]];

const ZOMBIES = new Set(['walker', 'runner', 'brute', 'cop', 'riot', 'bloater', 'hulk', 'grunt', 'general', 'frost', 'yeti', 'spitter', 'digger', 'splitter', 'splitling', 'shielder', 'android', 'mutant', 'astronaut', 'colossus', 'director', 'padChief', 'cosmonaut', 'xeno', 'larva', 'commander', 'marsTitan', 'queen', 'pod', 'lunarWorm']);
/** Quadro de ataque em que o tiro sai (para medir a boca da arma). */
export const FIRE_FRAME = 3;

function attackTable(id) {
  if (id === 'chainsaw') return SAW;
  if (id === 'dog') return BITE;
  if (ZOMBIES.has(id)) return LUNGE;
  return SHOOT;
}

/**
 * O que desenhar no quadro i da animação `kind`: { kind, k (pose), sx, sy }.
 * Parado: respira; andando: achata no contato com o chão e estica na subida.
 */
export function frameSpec(id, kind, i, count) {
  if (id === 'barricade') return { kind, k: i, sx: 1, sy: 1 };
  if (kind === 'idle') {
    const phase = Math.sin((i / count) * Math.PI * 2);
    return { kind, k: i % 4, sx: 1 - 0.025 * phase, sy: 1 + 0.035 * phase };
  }
  if (kind === 'attack') {
    const [k, sx, sy] = attackTable(id)[i];
    return { kind, k, sx, sy };
  }
  if (kind === 'walk') {
    const contact = Math.cos((i / count) * Math.PI * 4);
    return { kind, k: i, sx: 1 + 0.04 * contact, sy: 1 - 0.05 * contact };
  }
  return { kind, k: i, sx: 1, sy: 1 };
}
