// História (GDD seção 18): a Doutora Vega e os retratos do rádio (Xerife, Mira, Vega e o
// sinal desconhecido), além do ícone de rádio da interface.
import { anchors, BUILD, drawChibi } from './chibi.mjs';
import { capsule, circle, darken, ellipse, fill, intersect, line, minus, OUTLINE, poly, rrect, toon } from './ck.mjs';
import { heroFace } from './face.mjs';

const HAIR = '#2e2433';

/** Doutora Vega: jaleco branco, camisa verde-água, coque e óculos redondos. */
export const VEGA = {
  skin: '#c88a62', shirt: '#f4f4f0', sleeve: '#f4f4f0', pants: '#3a4a6a', shoes: '#2a2533',
  behind(c, a) {
    // Coque atrás da cabeça
    const [x, y] = a.head;
    toon(c, circle(x + (a.view === 'side' ? -11 : 0), y - 15, 6.5), HAIR, { depth: 1.6 });
  },
  head(c, a, look) {
    const [x, y] = a.head;
    if (a.view === 'back') {
      toon(c, intersect(a.headPath, ellipse(x, y - 2, 18, 17)), HAIR, { depth: 2, noLine: true });
      return;
    }
    toon(c, minus(a.headPath, ellipse(x + (a.view === 'side' ? 5 : 0), y + 4.5, 10.5, 11)), HAIR, { depth: 2, noLine: true });
    heroFace(c, a, look, { brow: HAIR });
    // Óculos redondos
    const eyes = a.view === 'side' ? [7.5] : [-5.6, 5.6];
    for (const ex of eyes) {
      const ring = minus(circle(x + ex * 1.12, y + 1.7, 5), circle(x + ex * 1.12, y + 1.7, 3.8));
      fill(c, ring, '#2a2533');
    }
    if (a.view === 'front') line(c, [[x - 1.2, y + 1.5], [x + 1.2, y + 1.5]], '#2a2533', 1.2);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    if (a.view === 'back') return;
    // Camisa por baixo do jaleco e o crachá
    toon(c, intersect(a.torsoPath, poly([[nx - 5, ny - 1], [nx + 5, ny - 1], [nx + 2, ny + 14], [nx - 2, ny + 14]])), '#2fae9a', { depth: 1, noLine: true });
    line(c, [[nx - 5, ny], [nx - 1, ny + 15]], darken('#f4f4f0', 0.35), 1.2);
    line(c, [[nx + 5, ny], [nx + 1, ny + 15]], darken('#f4f4f0', 0.35), 1.2);
    if (a.view === 'front') toon(c, rrect(nx + 5, ny + 6, 6, 8, 1.5), '#7fc8ff', { line: 1, depth: 0.6 });
  },
};

export const drawVega = (c) => drawChibi(c, VEGA, anchors(BUILD, 'front', {}));

/** Rádio de mão (walkie-talkie): ícone da interface e retrato do sinal desconhecido. */
export function radio(c) {
  toon(c, capsule([66, 30], [72, 6], 4), '#3a3f52', { line: 3.5, depth: 1.5 });
  toon(c, rrect(26, 24, 52, 68, 12), '#e8572a', { line: 4, depth: 6 });
  toon(c, rrect(34, 32, 36, 22, 5), '#b8e835', { line: 3, depth: 2, light: '#e8ffb0' });
  for (let i = 0; i < 3; i++) fill(c, rrect(38, 62 + i * 8, 28, 3.6, 1.8), OUTLINE, 0.75);
  line(c, [[40, 40], [46, 46], [52, 38], [58, 46], [64, 40]], darken('#b8e835', 0.5), 2.4);
}
