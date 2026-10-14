// Banner Google Play: 1024 × 500, reaproveitando a arte e a tipografia do jogo.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { circle, CK, fill, flush, gradient, OUTLINE, paint, poly, ROOT, rrect, setToonStyle, soft } from './ck.mjs';
import { silhouette } from './clash.mjs';
import { savePng, surface, text, typeface } from './output.mjs';
import { toonClash } from './shadeClash.mjs';
import { drawUnit } from './units.mjs';

setToonStyle(toonClash);
const width = 1024;
const height = 500;
const s = surface(width, height);
const c = s.getCanvas();

gradient(c, rrect(0, 0, width, height, 0), '#28152f', '#ea843d', 0, 350);
soft(c, circle(774, 218, 155), '#ffc75c', 0.5, 45);
fill(c, circle(774, 218, 136), '#ffc85c');
fill(c, circle(774, 218, 116), '#ffdf86');
fill(c, poly([[0, 338], [100, 302], [255, 328], [410, 279], [557, 320], [677, 289], [835, 322], [950, 283], [1024, 315], [1024, 500], [0, 500]]), '#28342c');
gradient(c, rrect(0, 339, width, 161, 0), '#38633b', '#192b29', 339, 500);
fill(c, poly([[715, 326], [757, 326], [1024, 500], [410, 500]]), OUTLINE);
fill(c, poly([[721, 327], [751, 327], [1008, 500], [430, 500]]), '#48424b');
for (let i = 0; i < 5; i++) {
  const y = 340 + i * 31;
  const half = 2 + i * 1.8;
  fill(c, poly([[736 - half, y], [736 + half, y], [738 + half, y + 15], [738 - half, y + 15]]), '#ffc928');
}

function zombie(id, x, y, scale, kind = 'walk') {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.translate(-50, -94);
  silhouette(c, () => drawUnit(c, id, 'front', kind, 2));
  c.restore();
}
zombie('runner', 614, 356, 1.1);
zombie('walker', 945, 355, 1.2);
zombie('brute', 984, 385, 1.9);
soft(c, rrect(729, 458, 183, 24, 12), '#101016', 0.65, 13);
zombie('walker', 820, 473, 4.8, 'attack');

// Escurecimento apenas atrás da marca, para preservar leitura nas miniaturas.
soft(c, rrect(52, 98, 475, 286, 75), '#211525', 0.8, 45);
const face = typeface('LilitaOne-Regular.ttf');
text(c, 'ZOMBIE', 290, 228, 100, face, '#b8e835', { align: 'center', strokeColor: OUTLINE, strokeWidth: 15 });
text(c, 'ROAD', 290, 325, 112, face, '#ffffff', { align: 'center', strokeColor: OUTLINE, strokeWidth: 16 });
fill(c, rrect(132, 350, 314, 20, 10), OUTLINE);
fill(c, rrect(136, 354, 306, 12, 6), '#48424b');
for (let x = 151; x < 421; x += 53) fill(c, rrect(x, 358, 30, 4, 2), '#ffc928');

const truck = CK.MakeImageFromEncoded(readFileSync(join(ROOT, 'assets/images/mascots/truck.png')));
if (!truck) throw new Error('Não foi possível carregar o caminhão do jogo');
soft(c, rrect(455, 452, 150, 18, 9), '#101016', 0.5, 10);
c.drawImageRect(truck, CK.XYWHRect(0, 0, truck.width(), truck.height()), CK.XYWHRect(428, 291, 211, 211), paint('#ffffff'));
const path = join(ROOT, '../../docs/store/google-play-feature-graphic.png');
const bytes = savePng(s, path);
truck.delete();
s.delete();
face.delete();
flush();
console.log(`Banner Google Play: ${path} (${width} × ${height}, ${Math.round(bytes / 1024)} KB)`);
