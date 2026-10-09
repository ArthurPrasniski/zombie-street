// Ícones da interface e arte das armas especiais, numa caixa de 100 x 100 unidades.
import { blob, capsule, circle, darken, ellipse, fill, line, OUTLINE, poly, rrect, soft, toon } from './ck.mjs';
import { MORE_UI_ICONS } from './icons2.mjs';

const LIME = '#b8e835';
const AMBER = '#ffb84a';

function coin(c) {
  toon(c, circle(50, 52, 38), '#ffc93c', { line: 4, depth: 7, light: '#fff1a8' });
  toon(c, circle(50, 52, 25), '#f2a91f', { line: 3, depth: 4, noLight: true });
  fill(c, rrect(44, 34, 12, 36, 6), '#fff1a8');
}

function lock(c) {
  toon(c, capsule([34, 46], [34, 30], 6), '#b9c0d4', { line: 4, depth: 3 });
  toon(c, capsule([66, 46], [66, 30], 6), '#b9c0d4', { line: 4, depth: 3 });
  toon(c, poly([[30, 28], [34, 16], [50, 10], [66, 16], [70, 28], [62, 30], [58, 22], [50, 19], [42, 22], [38, 30]]), '#b9c0d4', { line: 4, depth: 3 });
  toon(c, rrect(20, 42, 60, 46, 12), AMBER, { line: 4, depth: 6 });
  toon(c, capsule([50, 58], [50, 72], 5, 3.5), '#5a3510', { line: 2, depth: 1, noLight: true });
}

function check(c) {
  toon(c, circle(50, 50, 40), LIME, { line: 4, depth: 6 });
  line(c, [[30, 52], [44, 66], [72, 36]], OUTLINE, 15);
  line(c, [[30, 52], [44, 66], [72, 36]], '#ffffff', 8);
}

/** Gota de sangue (custo das cartas e barra do combate). */
function blood(c) {
  const drop = blob([[50, 4], [62, 26], [76, 48], [80, 66], [72, 84], [60, 93], [50, 95], [40, 93], [28, 84], [20, 66], [24, 48], [38, 26]]);
  toon(c, drop, '#d8263a', { line: 4, depth: 7, light: '#ff7a86' });
  fill(c, ellipse(38, 58, 6, 11), '#ffffff', 0.55);
  fill(c, circle(40, 76, 3.4), '#ffffff', 0.4);
}

const chevron = (pts) => (c) => {
  line(c, pts, OUTLINE, 20);
  line(c, pts, '#ffffff', 11);
};

function pause(c) {
  for (const x of [34, 66]) {
    toon(c, rrect(x - 9, 20, 18, 60, 7), '#ffffff', { line: 4, depth: 3, noLight: true });
  }
}

function skull(c) {
  toon(c, poly([[24, 46], [26, 22], [50, 10], [74, 22], [76, 46], [68, 60], [68, 76], [32, 76], [32, 60]]), '#e8e4f4', { line: 4, depth: 5 });
  for (const x of [38, 62]) fill(c, ellipse(x, 44, 9, 10), OUTLINE);
  fill(c, poly([[50, 52], [45, 62], [55, 62]]), OUTLINE);
  for (const x of [42, 50, 58]) line(c, [[x, 66], [x, 76]], OUTLINE, 3);
}

// ---------- Armas especiais (arte das cartas) ----------

export function grenade(c) {
  soft(c, ellipse(54, 90, 30, 6), '#000000', 0.3, 3);
  toon(c, ellipse(50, 58, 30, 32), '#4f8a3a', { line: 4, depth: 7 });
  for (const y of [44, 58, 72]) line(c, [[24, y], [76, y]], darken('#4f8a3a', 0.35), 3);
  line(c, [[50, 28], [50, 88]], darken('#4f8a3a', 0.35), 3);
  toon(c, rrect(38, 16, 24, 16, 4), '#9aa3b8', { line: 4, depth: 3 });
  toon(c, poly([[60, 18], [84, 8], [88, 16], [64, 28]]), '#b9c0d4', { line: 3.5, depth: 2 });
  toon(c, circle(36, 18, 8), '#ffd23f', { line: 3, depth: 2, noLight: true });
  fill(c, circle(36, 18, 4), '#4f8a3a');
}

export function medkit(c) {
  soft(c, ellipse(54, 90, 36, 6), '#000000', 0.3, 3);
  toon(c, rrect(36, 14, 28, 16, 6), '#c8ccd8', { line: 4, depth: 2 });
  fill(c, rrect(42, 19, 16, 11, 3), '#2a2533');
  toon(c, rrect(12, 26, 76, 60, 12), '#f4f1ea', { line: 4, depth: 7 });
  toon(c, poly([[42, 38], [58, 38], [58, 48], [68, 48], [68, 64], [58, 64], [58, 74], [42, 74], [42, 64], [32, 64], [32, 48], [42, 48]]), '#ff4d5a', { line: 3, depth: 3 });
}

export function molotov(c) {
  soft(c, ellipse(54, 92, 24, 5), '#000000', 0.3, 3);
  toon(c, poly([[34, 46], [40, 36], [40, 22], [60, 22], [60, 36], [66, 46], [68, 88], [32, 88]]), '#4fae6a', { line: 4, depth: 6, light: '#b8f0c8' });
  fill(c, rrect(34, 58, 32, 22, 4), '#e8d8b0');
  toon(c, rrect(38, 14, 24, 12, 4), '#f0e4c8', { line: 3, depth: 2 });
  toon(c, poly([[46, 14], [40, 0], [50, 6], [56, -2], [58, 10], [54, 16]]), '#ff8a1f', { line: 3, depth: 2 });
  fill(c, poly([[48, 13], [47, 6], [52, 9], [54, 13]]), '#ffe27a');
}

export function airstrike(c) {
  soft(c, ellipse(52, 92, 32, 5), '#000000', 0.3, 3);
  toon(c, poly([[50, 6], [58, 30], [94, 44], [94, 54], [58, 50], [56, 74], [70, 84], [70, 90], [50, 84], [30, 90], [30, 84], [44, 74], [42, 50], [6, 54], [6, 44], [42, 30]]), '#7d8aa8', { line: 4, depth: 6 });
  toon(c, ellipse(50, 30, 6, 10), '#7fc8ff', { line: 3, depth: 2, light: '#e0f4ff' });
  fill(c, poly([[8, 46], [20, 44], [20, 52], [8, 52]]), '#ff4d5a');
  fill(c, poly([[92, 46], [80, 44], [80, 52], [92, 52]]), '#ff4d5a');
}

export const UI_ICONS = {
  coin, lock, check, blood, pause, skull,
  back: chevron([[62, 18], [32, 50], [62, 82]]),
  next: chevron([[38, 18], [68, 50], [38, 82]]),
  play: (c) => toon(c, poly([[30, 16], [82, 50], [30, 84]]), '#ffffff', { line: 4, depth: 3, noLight: true }),
  ...MORE_UI_ICONS,
};
/** Mina terrestre: disco com sulcos e a luz vermelha no meio. */
export function landmine(c) {
  soft(c, ellipse(54, 78, 40, 9), '#000000', 0.3, 3);
  toon(c, ellipse(50, 62, 40, 22), '#5b6b3a', { line: 4, depth: 7 });
  toon(c, ellipse(50, 56, 28, 14), '#6e7f48', { line: 3, depth: 3 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    line(c, [[50 + Math.cos(a) * 30, 62 + Math.sin(a) * 16], [50 + Math.cos(a) * 38, 62 + Math.sin(a) * 20]], darken('#5b6b3a', 0.3), 3);
  }
  toon(c, circle(50, 54, 7), '#ff3a3a', { line: 3, depth: 2, light: '#ffb0b0' });
}


// ---------- Armas especiais do Ato 3 (seção 18.4) ----------

/** Criogenia: cápsula de gelo com flocos. */
export function cryo(c) {
  soft(c, ellipse(54, 90, 28, 5), '#000000', 0.3, 3);
  toon(c, rrect(30, 18, 40, 68, 16), '#7fd0ff', { line: 4, depth: 6, light: '#e0f8ff' });
  toon(c, rrect(36, 10, 28, 12, 4), '#9aa3b8', { line: 3, depth: 2 });
  for (const [x, y] of [[50, 40], [42, 62], [58, 64]]) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      line(c, [[x - Math.cos(a) * 7, y - Math.sin(a) * 7], [x + Math.cos(a) * 7, y + Math.sin(a) * 7]], '#ffffff', 2.4);
    }
  }
}

/** Escudo de Energia: emissor com a parede hexagonal ciano. */
export function forcefield(c) {
  soft(c, ellipse(52, 92, 36, 5), '#000000', 0.3, 3);
  toon(c, poly([[12, 30], [50, 12], [88, 30], [88, 70], [50, 88], [12, 70]]), '#3ee8ff', { line: 4, depth: 5, light: '#e0ffff' });
  for (const [x, y] of [[36, 40], [64, 40], [50, 58], [36, 72], [64, 72]]) toon(c, poly([[x - 9, y], [x - 4, y - 8], [x + 4, y - 8], [x + 9, y], [x + 4, y + 8], [x - 4, y + 8]]), '#9ff4ff', { line: 1.6, depth: 1 });
}

/** Buraco Negro: espiral roxa com o centro preto. */
export function blackhole(c) {
  soft(c, circle(50, 52, 44), '#8a4ad8', 0.5, 8);
  toon(c, circle(50, 52, 38), '#5a2a8a', { line: 4, depth: 6, light: '#c8a0ff' });
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let k = 0; k < 14; k++) {
      const a = k * 0.42 + (i * Math.PI * 2) / 3;
      const r = 34 - k * 2.2;
      pts.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]);
    }
    line(c, pts, '#c8a0ff', 3);
  }
  fill(c, circle(50, 52, 10), '#0c0b0f');
}

/** Canhão Orbital: satélite com o raio descendo. */
export function orbital(c) {
  soft(c, ellipse(50, 94, 20, 4), '#000000', 0.3, 3);
  fill(c, rrect(42, 40, 16, 56, 6), '#ff4fd8', 0.55);
  fill(c, rrect(46, 40, 8, 56, 4), '#ffffff', 0.85);
  for (const s of [-1, 1]) toon(c, rrect(50 + s * 26 - 14, 10, 28, 16, 2), '#2f4a8a', { line: 3, depth: 2, light: '#7fa8ff' });
  toon(c, rrect(36, 6, 28, 30, 8), '#e8ecf0', { line: 4, depth: 4 });
  toon(c, circle(50, 34, 7), '#ff4fd8', { line: 3, depth: 1.5, light: '#ffd0f4' });
}

export const SPELL_ART = { grenade, medkit, molotov, airstrike, landmine, cryo, forcefield, blackhole, orbital };
