// Canvas de pixel art: formas com sombreamento por normal (luz no alto à esquerda),
// pontilhado Bayer entre tons, contorno seletivo e decalques que respeitam o tom.

export const LIGHT_LEFT = normalize3(-0.6, -0.7, 0.45);
// Para quadros que serão espelhados: depois do flip a luz volta a vir da esquerda.
export const LIGHT_RIGHT = normalize3(0.6, -0.7, 0.45);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function normalize3(x, y, z) {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Cor especial: apaga o pixel (deixa transparente). */
export const ERASE = [0, 0, 0, 0];

export function hex(c, alpha = 255) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

/** Rampa de tons, do mais escuro ao mais claro. */
export const ramp = (...colors) => colors.map((c) => hex(c));

/** Ruído determinístico por pixel, em [0, 1). */
export function hash(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export class PixelCanvas {
  constructor(w, h, light = LIGHT_LEFT) {
    this.light = light;
    this.w = w;
    this.h = h;
    this.rgba = new Uint8ClampedArray(w * h * 4);
    this.tone = new Int8Array(w * h).fill(-1);
    this.part = new Array(w * h).fill(null);
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  filled(x, y) {
    return this.inside(x, y) && this.rgba[(y * this.w + x) * 4 + 3] > 0;
  }

  put(x, y, color, tone = -1, part = null) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (color === ERASE) {
      this.rgba.fill(0, i * 4, i * 4 + 4);
      this.tone[i] = -1;
      this.part[i] = null;
      return;
    }
    if (color[3] === 0) return;
    const a = color[3] / 255;
    for (let k = 0; k < 3; k++) this.rgba[i * 4 + k] = color[k] * a + this.rgba[i * 4 + k] * (1 - a);
    this.rgba[i * 4 + 3] = Math.max(this.rgba[i * 4 + 3], color[3]);
    this.tone[i] = tone;
    this.part[i] = part;
  }

  /** Escolhe o tom da rampa pela normal da superfície. */
  toneFor(x, y, nx, ny, nz, mat, edge) {
    const L = this.light;
    const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const ambient = mat.ambient ?? 0.28;
    let t = (ambient + (1 - ambient) * lam) * (mat.ramp.length - 1);
    t += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * (mat.dither ?? 0.7);
    let tone = Math.round(t) + (mat.shift ?? 0);
    if (edge) tone -= mat.edge ?? 1;
    if (mat.noise && hash(x, y, mat.seed ?? 7) < mat.noise) tone += hash(y, x, 3) < 0.6 ? -1 : 1;
    return clamp(tone, 0, mat.ramp.length - 1);
  }

  paint(x, y, nx, ny, nz, mat, edge) {
    const tone = this.toneFor(x, y, nx, ny, nz, mat, edge);
    this.put(x, y, mat.ramp[tone], tone, mat.part ?? null);
  }

  /** Cilindro de pontas arredondadas de a até b, com raio ra -> rb. */
  capsule(a, b, ra, rb, mat) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1e-6;
    const r = Math.max(ra, rb);
    for (let y = Math.floor(Math.min(a.y, b.y) - r - 1); y <= Math.max(a.y, b.y) + r + 1; y++) {
      for (let x = Math.floor(Math.min(a.x, b.x) - r - 1); x <= Math.max(a.x, b.x) + r + 1; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const t = clamp(((px - a.x) * dx + (py - a.y) * dy) / len2, 0, 1);
        const qx = a.x + dx * t;
        const qy = a.y + dy * t;
        const rr = ra + (rb - ra) * t;
        const d = Math.hypot(px - qx, py - qy);
        if (d > rr) continue;
        const ox = (px - qx) / rr;
        const oy = (py - qy) / rr;
        this.paint(x, y, ox, oy, Math.sqrt(Math.max(0, 1 - ox * ox - oy * oy)), mat, d > rr - 1);
      }
    }
  }

  ellipse(cx, cy, rx, ry, mat) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const ox = (x + 0.5 - cx) / rx;
        const oy = (y + 0.5 - cy) / ry;
        const d = Math.hypot(ox, oy);
        if (d > 1) continue;
        this.paint(x, y, ox, oy, Math.sqrt(Math.max(0, 1 - d * d)), mat, d > 1 - 1 / Math.min(rx, ry));
      }
    }
  }

  /** Polígono com sombreamento plano (normal fixa ou função por pixel). */
  polygon(points, mat, normal = [0, -0.3, 1]) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
        if (!pointInPolygon(x + 0.5, y + 0.5, points)) continue;
        const n = typeof normal === 'function' ? normal(x, y) : normal;
        const edge = !pointInPolygon(x + 1.5, y + 0.5, points) || !pointInPolygon(x - 0.5, y + 0.5, points) ||
          !pointInPolygon(x + 0.5, y + 1.5, points) || !pointInPolygon(x + 0.5, y - 0.5, points);
        const l = Math.hypot(...n);
        this.paint(x, y, n[0] / l, n[1] / l, n[2] / l, mat, edge && mat.polyEdge !== false);
      }
    }
  }

  line(x0, y0, x1, y1, color, part = null) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      this.put(Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps), color, -1, part);
    }
  }

  /** Troca a rampa dos pixels que passam no teste, mantendo o tom (luz e sombra). */
  recolor(test, newRamp, { parts = null, shift = 0 } = {}) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.tone[i] < 0 || (parts && !parts.includes(this.part[i])) || !test(x, y)) continue;
        const tone = clamp(this.tone[i] + shift, 0, newRamp.length - 1);
        this.put(x, y, newRamp[tone], tone, this.part[i]);
      }
    }
  }

  /** Contorno de 1 px em volta da silhueta (vizinhança de 4). */
  outline(color) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.filled(x, y)) continue;
        if (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1)) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.put(x, y, color);
  }

  flipX() {
    const out = new PixelCanvas(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x) * 4;
        const d = (y * this.w + (this.w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) out.rgba[d + k] = this.rgba[s + k];
      }
    }
    return out;
  }

  /** Copia outro canvas para (dx, dy), ampliando cada pixel em k x k. */
  blit(src, dx, dy, k = 1, alpha = 1) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const s = (y * src.w + x) * 4;
        if (src.rgba[s + 3] === 0) continue;
        const color = [src.rgba[s], src.rgba[s + 1], src.rgba[s + 2], src.rgba[s + 3] * alpha];
        for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) this.put(dx + x * k + xx, dy + y * k + yy, color);
      }
    }
  }
}

export function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
