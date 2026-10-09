// Base do Ato 3 (GDD seção 18): o módulo espacial com a torreta e a barreira de metal, no lugar
// da caminhonete e dos sacos de areia. Mesmas coordenadas da base (faixa de 600 x 135).
import { capsule, circle, darken, ellipse, fill, lighten, line, poly, rrect, SHADOW, soft, toon } from './ck.mjs';

const HULL = '#e8ecf0';
const ORANGE = '#ff8a1f';

/** Barreira de blocos de metal com faixas de perigo; com dano, blocos caídos. */
export function metalWall(c, damage, wallY, rand) {
  for (let i = 0; i * 40 < 620; i++) {
    const x = i * 40 - 4;
    if (damage >= 2 && rand(i, 12) < 0.3 * (damage - 1)) {
      toon(c, rrect(x + 6, wallY + 18, 30, 14, 3), darken('#7a8296', 0.2), { line: 1.4, depth: 1 });
      continue;
    }
    toon(c, rrect(x, wallY - 4, 38, 30, 4), '#7a8296', { depth: 2.5 });
    for (let k = 0; k < 3; k++) fill(c, poly([[x + 4 + k * 12, wallY + 20], [x + 10 + k * 12, wallY + 20], [x + 16 + k * 12, wallY + 2], [x + 10 + k * 12, wallY + 2]]), '#ffc928', 0.7);
    fill(c, circle(x + 6, wallY + 1, 1.6), '#4a5068');
    fill(c, circle(x + 32, wallY + 1, 1.6), '#4a5068');
  }
}

/** Módulo espacial com painéis solares e a torreta (o cano em 300, 35). */
export function spaceModule(c, damage) {
  const body = damage >= 3 ? '#6a6e7a' : HULL;
  soft(c, ellipse(300, 132, 60, 10), SHADOW, 0.35, 5);
  for (const s of [-1, 1]) {
    toon(c, rrect(300 + s * 58 - 26, 70, 52, 30, 3), '#2f4a8a', { depth: 1.5, light: '#7fa8ff' });
    for (let k = 1; k < 4; k++) line(c, [[300 + s * 58 - 26 + k * 13, 70], [300 + s * 58 - 26 + k * 13, 100]], '#1a2a5a', 1.2);
    toon(c, rrect(300 + s * 32 - 4, 80, 8, 10, 2), '#9aa3b8', { line: 1.2, depth: 0.6 });
  }
  toon(c, rrect(266, 52, 68, 76, 30), body, { depth: 4, light: '#ffffff' });
  fill(c, rrect(270, 100, 60, 6, 3), ORANGE);
  toon(c, circle(300, 116, 7), '#7fc8ff', { line: 1.6, depth: 1, light: '#e0f4ff' });
  // Torreta no alto do módulo
  toon(c, circle(300, 62, 12), '#4a5068', { depth: 2 });
  toon(c, capsule([300, 60], [300, 37], 3.6, 2.8), '#3a3f52', { depth: 1.2, noLight: true });
  toon(c, circle(300, 62, 5), '#3ee8ff', { line: 1, depth: 0.6, light: '#ffffff' });
  if (damage >= 2) for (let i = 0; i < 4; i++) soft(c, circle(318 + i * 6 - 8, 80 - i * 9, 9 + i * 2), '#5a5568', 0.45, 4);
  if (damage >= 3) for (const dx of [-10, 6]) toon(c, poly([[300 + dx - 6, 96], [300 + dx, 78], [300 + dx + 6, 96]]), '#ff8a1f', { line: 1.4, depth: 1 });
  line(c, [[280, 70], [290, 64]], lighten(HULL, 0.5), 2);
}

/** Pátio do Ato 3: antena parabólica, caixas de suprimento e cilindros de oxigênio. */
export function spaceYard(c, damage) {
  toon(c, capsule([120, 100], [120, 70], 2.4), '#9aa3b8', { line: 1.4, depth: 0.8 });
  toon(c, ellipse(120, 64, 22, 10), damage >= 3 ? '#6a6e7a' : '#e8ecf0', { depth: 2 });
  fill(c, circle(120, 62, 3), '#ff8a1f');
  for (const [x, y] of [[44, 66], [62, 94], [210, 70], [470, 104]]) {
    toon(c, rrect(x - 12, y - 10, 24, 18, 3), '#c8ccd4', { depth: 1.5 });
    fill(c, rrect(x - 12, y - 2, 24, 3, 0), '#3ee8ff', 0.8);
  }
  for (const [x, y] of [[400, 60], [416, 72], [400, 88], [506, 70]]) {
    toon(c, ellipse(x, y, 8, 6.5), damage >= 3 ? '#4a4458' : '#e8ecf0', { depth: 1.5 });
    fill(c, ellipse(x, y, 5, 4), '#3a6ab0');
  }
}
