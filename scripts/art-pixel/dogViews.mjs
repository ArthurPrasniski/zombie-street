// Rex de frente (vindo para a câmera) e de costas (indo para o topo), vista de cima inclinada.
// De frente: cabeça e peito na frente, lombo e rabo atrás. De costas: traseira e rabo na frente.
import { SADDLE, TAN } from './dog.mjs';
import { frontWalk } from './frontRig.mjs';
import { P } from './palette.mjs';
import { add, GROUND, v } from './rig.mjs';

const mat = (ramp, part, extra = {}) => ({ ramp, part, edge: 2, noise: 0.06, ...extra });
const FUR = mat(TAN, 'fur');
const DARK = mat(SADDLE, 'saddle');
const far = (m) => ({ ...m, shift: -1 });
const NEAR_PAW_Y = GROUND - 1;
const FAR_PAW_Y = GROUND - 7;
const EYE = [0xf0, 0xd9, 0xa0, 255];

const IDLE = [0, 0.4, 0.8, 0.4];
// Ataque: recua, salta (boca aberta), morde, volta. dy > 0 = mais perto da câmera.
const ATTACK = [
  { dy: -1, mouth: 0, head: -1 },
  { dy: 2, mouth: 3, head: 2 },
  { dy: 3, mouth: 1, head: 1 },
  { dy: 1, mouth: 0, head: 0 },
];

function legPair(c, x, topY, pawY, liftA, liftB, m) {
  for (const [side, lift] of [[-1, liftA], [1, liftB]]) {
    const top = v(32 + side * x, topY);
    const paw = v(32 + side * (x + 0.3), pawY - lift);
    c.capsule(top, paw, 2.3, 1.5, m);
    c.ellipse(paw.x, paw.y + 0.5, 1.8, 1.2, mat(SADDLE, 'paw', { shift: m.shift }));
  }
}

function ears(c, head, shift) {
  for (const s of [-1, 1]) c.polygon([add(head, v(s * 1.2, -2.5)), add(head, v(s * 4.2, -8.5)), add(head, v(s * 4.5, -1.5))], mat(SADDLE, 'ear', { shift }));
}

/** s: { bob, liftF, liftB (pata da frente/de trás), dy, mouth, head, tail } */
function drawFrontDog(c, s) {
  const y = (n) => n + (s.bob ?? 0) + (s.dy ?? 0);
  const chest = v(32, y(50));
  const rump = v(32, y(40));
  // Lombo e rabo aparecem por cima da cabeça
  c.capsule(rump, v(32 + (s.tail ?? 0) * 4, y(32)), 1.8, 1.1, mat(SADDLE, 'tail', { shift: -1 }));
  legPair(c, 4.4, y(44), FAR_PAW_Y + (s.dy ?? 0), s.liftB ?? 0, s.liftB2 ?? 0, far(FUR));
  c.capsule(rump, chest, 5.8, 6.6, FUR);
  c.recolor((x, yy) => yy < chest.y - 4, SADDLE, { parts: ['fur'], shift: -1 });
  legPair(c, 3.6, y(53), NEAR_PAW_Y, s.liftF ?? 0, s.liftF2 ?? 0, FUR);
  // Cabeça: focinho apontando para a câmera
  const head = v(32, y(46) + (s.head ?? 0));
  ears(c, head, 1);
  c.ellipse(head.x, head.y, 4.4, 3.8, FUR);
  c.recolor((x, yy) => yy < head.y - 1.5, SADDLE, { parts: ['fur'], shift: 1 });
  const snout = add(head, v(0, 3.5));
  c.ellipse(snout.x, snout.y, 2.4, 2.2, mat(TAN, 'fur', { shift: 1 }));
  for (const sx of [-2, 2]) c.put(head.x + sx - (sx > 0 ? 1 : 0), head.y - 1, EYE, 3, 'face');
  c.put(snout.x - 1, snout.y - 1, P.outline, 0, 'face');
  c.put(snout.x, snout.y - 1, P.outline, 0, 'face');
  if (s.mouth > 0) {
    for (let i = 0; i < s.mouth; i++) c.line(snout.x - 2, snout.y + 1 + i, snout.x + 1, snout.y + 1 + i, i === 0 ? P.teeth : P.blood[1], 'face');
    c.put(snout.x - 1, snout.y + 1 + s.mouth, P.teeth, 3, 'face');
  }
  c.outline(P.outline);
  return c;
}

function drawBackDog(c, s) {
  const y = (n) => n + (s.bob ?? 0) - (s.dy ?? 0);
  const rump = v(32, y(50));
  const chest = v(32, y(41));
  legPair(c, 3.8, y(44), FAR_PAW_Y - (s.dy ?? 0), s.liftF ?? 0, s.liftF2 ?? 0, far(FUR));
  const head = v(32, y(36) - (s.head ?? 0));
  ears(c, head, 0);
  c.ellipse(head.x, head.y, 4.2, 3.8, mat(SADDLE, 'fur', { shift: 1 }));
  c.capsule(chest, rump, 6, 6.2, FUR);
  c.recolor((x, yy) => Math.abs(x + 0.5 - 32) < 4.5 && yy < rump.y + 2, SADDLE, { parts: ['fur'] });
  legPair(c, 4.2, y(53), NEAR_PAW_Y, s.liftB ?? 0, s.liftB2 ?? 0, FUR);
  c.capsule(v(32, y(53)), v(32 + (s.tail ?? 0) * 5, y(58)), 1.9, 1.2, mat(SADDLE, 'tail'));
  c.outline(P.outline);
  return c;
}

/** Quadro de frente/costas do Rex. kind: idle, attack, walk. */
export function dogView(c, view, kind, k) {
  let s;
  if (kind === 'attack') s = { ...ATTACK[k], tail: 0.3 };
  else if (kind === 'walk') {
    const w = frontWalk(k);
    s = { bob: w.bob, liftF: w.liftL, liftF2: w.liftR, liftB: w.liftR, liftB2: w.liftL, tail: Math.sin(k * 2.1) * 0.6 };
  } else s = { bob: IDLE[k] * 0.5, tail: Math.sin(k * 1.6) * 0.5 };
  return view === 'back' ? drawBackDog(c, s) : drawFrontDog(c, s);
}
