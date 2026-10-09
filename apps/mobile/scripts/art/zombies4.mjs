// Zumbis do Ato 2 (GDD seção 18.2): Androide, Mutante e Astronauta e os chefes Colosso, Diretor
// do Laboratório e Chefe de Pista (corpo do Brutamontes). Dentro de `head`, a cabeça tem raio 15.
import { BUILD } from './chibi.mjs';
import { capsule, circle, clipped, darken, ellipse, fill, intersect, line, poly, rrect, toon } from './ck.mjs';
import { zombieFace } from './face.mjs';
import { BRUTE_BUILD } from './zombies.mjs';

const METAL = '#a8b0c0';
const TOXIC = '#b8f04a';

/** Manchas só dentro do tronco. */
function patches(c, a, spots) {
  clipped(c, a.torsoPath, () => {
    const [nx, ny] = a.neck;
    for (const [dx, dy, r, color] of spots) fill(c, ellipse(nx + dx, ny + dy, r * 1.3, r), color);
  });
}

/** Bolhas tóxicas brilhando na pele. */
function pustules(c, a, spots) {
  const [x, y] = a.head;
  for (const [dx, dy, r] of spots) toon(c, circle(x + dx, y + dy, r), TOXIC, { line: 0.9, depth: 0.5, light: '#f0ffd0' });
}

// ---------- Androide: metade da cabeça em placa de metal, olho de LED e antena ----------

const android = {
  skin: '#9cb08a', shirt: '#3a4052', pants: '#2a2f3c', shoes: '#1a1d26', hands: METAL,
  head(c, a, look) {
    const [x, y] = a.head;
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.3, glow: '#ff4d4d' });
    if (a.view !== 'back') {
      const half = a.view === 'side' ? rrect(x - 30, y - 30, 26, 60, 0) : rrect(x, y - 30, 30, 60, 0);
      toon(c, intersect(a.headPath, half), METAL, { depth: 2, noLine: true });
      for (const [dx, dy] of [[9, -8], [11, 6]]) fill(c, circle(x + (a.view === 'side' ? -dx : dx), y + dy, 1.4), '#4a5068');
      if (a.view === 'front') toon(c, circle(x + 5.4, y + 1.5, 3), '#ff4d4d', { line: 1, depth: 0.4, light: '#ffd0d0' });
    }
    toon(c, capsule([x + 6, y - 14], [x + 9, y - 24], 1.2), '#4a5068', { line: 1, depth: 0.5 });
    toon(c, circle(x + 9, y - 25, 2.6), '#ff4d4d', { line: 1, depth: 0.5 });
  },
  torso(c, a) {
    if (a.view === 'back') return;
    const [nx, ny] = a.neck;
    clipped(c, a.torsoPath, () => {
      toon(c, rrect(nx - 7, ny + 3, 14, 12, 2), '#2a2f3c', { line: 1, depth: 0.6 });
      for (let i = 0; i < 3; i++) line(c, [[nx - 5, ny + 6 + i * 3], [nx + 5, ny + 6 + i * 3]], '#3ee8ff', 1, 0.9);
    });
  },
};

// ---------- Mutante: pele roxa com bolhas verdes e jaleco rasgado ----------

const mutant = {
  skin: '#9a7ac8', shirt: '#e8e4d8', sleeve: '#9a7ac8', pants: '#4a5a6a', shoes: '#2e2a36',
  build: { ...BUILD, torsoW: 28, armR: 4.6, handR: 5 },
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.6, glow: '#c8ff6a' });
    if (a.view !== 'back') pustules(c, a, [[-10, -6, 2.6], [8, -10, 2], [-4, -13, 1.6]]);
  },
  torso(c, a) {
    patches(c, a, [[-6, 8, 3.4, '#c8ff6a'], [7, 14, 2.6, '#c8ff6a'], [0, 3, 4, '#d8d4c4']]);
  },
};

// ---------- Astronauta: traje branco, mochila e capacete de vidro ----------

const astronaut = {
  skin: '#9cc47a', shirt: '#eef2f6', sleeve: '#eef2f6', pants: '#e2e8ee', shoes: '#9aa3b8', hands: '#d8dde4',
  behind(c, a) {
    if (a.view === 'front') return;
    const [nx, ny] = a.neck;
    toon(c, rrect(nx - (a.view === 'side' ? 16 : 11), ny + 1, a.view === 'side' ? 10 : 22, 20, 4), '#c8cdd4', { depth: 2 });
  },
  head(c, a, look) {
    const [x, y] = a.head;
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.35 });
    // Capacete de vidro com um reflexo pequeno no canto
    fill(c, circle(x, y, 18), '#bfe6ff', 0.22);
    fill(c, ellipse(x - 11, y - 9, 3.2, 5.5), '#ffffff', 0.75);
  },
  torso(c, a) {
    const [nx, ny] = a.neck;
    // Anel do capacete no pescoço (a cabeça cobre a parte de cima)
    toon(c, ellipse(nx, ny - 1, 12, 3.6), '#ff8a1f', { line: 1.2, depth: 0.8 });
    if (a.view === 'back') return;
    clipped(c, a.torsoPath, () => fill(c, rrect(nx - 20, ny + 12, 40, 3, 1), '#ff8a1f'));
    if (a.view === 'front') toon(c, circle(nx - 6, ny + 6, 3), '#3a6ab0', { line: 1, depth: 0.5 });
  },
  after(c, a) {
    // Borda do capacete por cima de tudo
    const [x, y] = a.head;
    line(c, [[x - 17, y + 8], [x - 19, y], [x - 17, y - 9], [x - 10, y - 17], [x, y - 19.5], [x + 10, y - 17], [x + 17, y - 9], [x + 19, y], [x + 17, y + 8]], '#e8f4ff', 1.6, 0.9);
  },
};

// ---------- Chefes ----------

const colossus = {
  skin: '#ffc928', shirt: '#3a3f52', sleeve: '#ffc928', pants: '#3a3f52', shoes: '#2a2533', hands: '#4a5068', build: BRUTE_BUILD,
  head(c, a, look) {
    const [x, y] = a.head;
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.2, glow: '#ff4d4d' });
    if (a.view !== 'back') toon(c, rrect(x - 13 + (a.view === 'side' ? 6 : 0), y - 4, a.view === 'side' ? 12 : 26, 7, 3), '#2a2533', { line: 1.2, depth: 0.6 });
    if (a.view === 'front') fill(c, rrect(x - 8, y - 2, 16, 3, 1.5), '#ff4d4d');
  },
  torso(c, a) {
    clipped(c, a.torsoPath, () => {
      const [nx, ny] = a.neck;
      for (let i = -3; i < 4; i++) fill(c, poly([[nx + i * 10, ny - 2], [nx + i * 10 + 6, ny - 2], [nx + i * 10 - 6, ny + 30], [nx + i * 10 - 12, ny + 30]]), '#ffc928', 0.9);
    });
  },
};

const director = {
  skin: '#8a6ab8', shirt: '#f0ece0', sleeve: '#8a6ab8', pants: '#3a3f52', shoes: '#2a2533', build: BRUTE_BUILD,
  head(c, a, look) {
    zombieFace(c, a, look, { jaw: a.s.jaw ?? 0.5, glow: '#c8ff6a' });
    if (a.view !== 'back') pustules(c, a, [[-9, -9, 2.4], [9, -8, 2], [0, -13, 1.8]]);
  },
  torso(c, a) {
    if (a.view !== 'front') return;
    const [nx, ny] = a.neck;
    toon(c, poly([[nx - 2.5, ny + 1], [nx + 2.5, ny + 1], [nx + 3, ny + 16], [nx, ny + 20], [nx - 3, ny + 16]]), '#c8443a', { line: 1, depth: 0.6 });
    patches(c, a, [[-12, 10, 4, TOXIC], [11, 16, 3.4, TOXIC]]);
  },
};

const padChief = {
  skin: '#8fae6a', shirt: '#c8ccd4', sleeve: '#c8ccd4', pants: '#b8bcc6', shoes: '#4a5068', hands: '#9aa3b8', build: BRUTE_BUILD,
  behind(c, a) {
    if (a.view === 'front') return;
    const [nx, ny] = a.neck;
    const x = nx - (a.view === 'side' ? 22 : 10);
    toon(c, rrect(x, ny - 4, 20, 30, 8), '#c8443a', { depth: 2 });
    fill(c, rrect(x, ny + 6, 20, 5, 0), '#ffc928');
  },
  head(c, a) {
    // Capuz anti-chamas cobrindo a cabeça, com o visor dourado
    const [x, y] = a.head;
    toon(c, intersect(a.headPath, ellipse(x, y, 18, 17)), '#d8dce4', { depth: 2, noLine: true });
    if (a.view !== 'back') toon(c, rrect(x - 11 + (a.view === 'side' ? 6 : 0), y - 5, a.view === 'side' ? 10 : 22, 11, 4), '#ffc928', { line: 1.4, depth: 1, light: '#fff1a8' });
  },
};

export const ACT2_ZOMBIE_LOOKS = { android, mutant, astronaut, colossus, director, padChief };
