// Desenho vetorial com o CanvasKit (Skia em WebAssembly, já instalado pelo react-native-skia).
// Formas em unidades de desenho; contorno escuro, sombra em crescente e brilho no estilo cartoon.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(ROOT, 'package.json'));
const CanvasKitInit = require('canvaskit-wasm/bin/canvaskit.js');
export const CK = await CanvasKitInit({ locateFile: (f) => join(ROOT, 'node_modules/canvaskit-wasm/bin', f) });

export const OUTLINE = '#17141b';
export const SHADOW = '#0c0b0f';

// Objetos do CanvasKit criados pelos helpers; `flush()` libera a memória do WebAssembly.
let pool = [];
export const keep = (obj) => {
  pool.push(obj);
  return obj;
};
export function flush() {
  for (const obj of pool) if (!obj.isDeleted()) obj.delete();
  pool = [];
}

/** Cor a partir de '#rrggbb' com alfa opcional. */
export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return CK.Color4f(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a);
}

/** Mistura duas cores '#rrggbb' (t = 0 -> a, 1 -> b). */
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
export const darken = (c, t) => mix(c, '#16131a', t);
export const lighten = (c, t) => mix(c, '#ffffff', t);

function build(fn) {
  const b = new CK.PathBuilder();
  fn(b);
  const p = b.detach();
  b.delete();
  return keep(p);
}

export const circle = (x, y, r) => build((b) => b.addCircle(x, y, r));
export const ellipse = (x, y, rx, ry) => build((b) => b.addOval(CK.LTRBRect(x - rx, y - ry, x + rx, y + ry)));
export const rrect = (x, y, w, h, r) => build((b) => b.addRRect(CK.RRectXY(CK.XYWHRect(x, y, w, h), r, r)));

/** Polígono de pontos [x, y]. */
export const poly = (pts) =>
  build((b) => {
    b.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) b.lineTo(pts[i][0], pts[i][1]);
    b.close();
  });

/** Curva fechada suave passando pelos pontos (Catmull-Rom). */
export const blob = (pts, tension = 1) =>
  build((b) => {
    const n = pts.length;
    const at = (i) => pts[(i + n) % n];
    b.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      const k = tension / 6;
      b.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    b.close();
  });

/** Cápsula de a até b com raio ra -> rb (membros, canos, rabos). */
export function capsule(a, b, ra, rb = ra) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-3) return circle(a[0], a[1], Math.max(ra, rb));
  const ang = Math.atan2(dy, dx);
  // Ângulo de tangência entre os dois círculos
  const t = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / len)));
  const deg = (r) => (r * 180) / Math.PI;
  const oval = (c, r) => CK.LTRBRect(c[0] - r, c[1] - r, c[0] + r, c[1] + r);
  return build((pb) => {
    pb.moveTo(a[0] + Math.cos(ang - t) * ra, a[1] + Math.sin(ang - t) * ra);
    pb.lineTo(b[0] + Math.cos(ang - t) * rb, b[1] + Math.sin(ang - t) * rb);
    pb.arcToOval(oval(b, rb), deg(ang - t), deg(2 * t), false);
    pb.lineTo(a[0] + Math.cos(ang + t) * ra, a[1] + Math.sin(ang + t) * ra);
    pb.arcToOval(oval(a, ra), deg(ang + t), deg(2 * Math.PI - 2 * t), false);
    pb.close();
  });
}

/** União das formas; se a operação falhar (raro), junta os caminhos sem fundir. */
export function union(...paths) {
  let out = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const merged = CK.Path.MakeFromOp(out, paths[i], CK.PathOp.Union);
    const prev = out;
    out = merged ? keep(merged) : build((pb) => {
      pb.addPath(prev);
      pb.addPath(paths[i]);
    });
  }
  return out;
}
const op = (a, b, kind, fallback) => {
  const out = CK.Path.MakeFromOp(a, b, kind);
  return out ? keep(out) : fallback;
};
export const minus = (a, b) => op(a, b, CK.PathOp.Difference, a);
export const intersect = (a, b) => op(a, b, CK.PathOp.Intersect, a);

/** Cópia transformada: desloca, gira (graus, em volta de px,py) e escala. */
export function moved(path, { dx = 0, dy = 0, rot = 0, px = 0, py = 0, sx = 1, sy = 1 } = {}) {
  const r = (rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  // Escala e giro em volta de (px, py), depois desloca
  const m = [sx * cos, -sy * sin, px - px * sx * cos + py * sy * sin + dx, sx * sin, sy * cos, py - px * sx * sin - py * sy * cos + dy, 0, 0, 1];
  return build((b) => {
    b.addPath(path);
    b.transform(m);
  });
}

export function paint(color, alpha = 1) {
  const p = keep(new CK.Paint());
  p.setAntiAlias(true);
  p.setColor(typeof color === 'string' ? rgba(color, alpha) : color);
  return p;
}

export function fill(c, path, color, alpha = 1) {
  c.drawPath(path, paint(color, alpha));
}

export function stroke(c, path, color, width, alpha = 1) {
  const p = paint(color, alpha);
  p.setStyle(CK.PaintStyle.Stroke);
  p.setStrokeWidth(width);
  p.setStrokeJoin(CK.StrokeJoin.Round);
  p.setStrokeCap(CK.StrokeCap.Round);
  c.drawPath(path, p);
}

/** Linha (ou polilinha) com pontas arredondadas. */
export function line(c, pts, color, width, alpha = 1) {
  const path = build((b) => {
    b.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) b.lineTo(pts[i][0], pts[i][1]);
  });
  stroke(c, path, color, width, alpha);
}

/** Preenchimento com degradê linear vertical (de cima para baixo). */
export function gradient(c, path, top, bottom, y0, y1, alpha = 1, alphaBottom = alpha) {
  const p = paint('#000000');
  p.setShader(keep(CK.Shader.MakeLinearGradient([0, y0], [0, y1], [rgba(top, alpha), rgba(bottom, alphaBottom)], null, CK.TileMode.Clamp)));
  c.drawPath(path, p);
}

/** Mancha suave (sombra no chão, brilho, névoa). */
export function soft(c, path, color, alpha, blur) {
  const p = paint(color, alpha);
  p.setMaskFilter(keep(CK.MaskFilter.MakeBlur(CK.BlurStyle.Normal, blur, true)));
  c.drawPath(path, p);
}

// Estilo de sombreamento ligado pelo build (Clash 2D, scripts/art/shadeClash.mjs).
let toonStyle = null;
export const setToonStyle = (fn) => {
  toonStyle = fn;
};

/**
 * Peça cartoon: contorno, cor base, sombra em crescente embaixo à direita e brilho em cima à esquerda.
 * opts: { line (largura do contorno), shade, light, depth (tamanho da sombra), noLine, noLight }
 */
export function toon(c, path, base, opts = {}) {
  if (toonStyle) return toonStyle(c, path, base, opts);
  const w = opts.line ?? 2.2;
  const depth = opts.depth ?? 3;
  if (!opts.noLine) stroke(c, path, OUTLINE, w * 2);
  fill(c, path, base);
  const shadeRegion = minus(path, moved(path, { dx: -depth * 0.7, dy: -depth }));
  fill(c, shadeRegion, opts.shade ?? darken(base, 0.32));
  if (!opts.noLight) {
    const lightRegion = minus(path, moved(path, { dx: depth * 0.45, dy: depth * 0.6 }));
    fill(c, lightRegion, opts.light ?? lighten(base, 0.28), 0.8);
  }
}

/** Desenha só dentro do caminho (estampas, listras). */
export function clipped(c, path, draw) {
  c.save();
  c.clipPath(path, CK.ClipOp.Intersect, true);
  draw();
  c.restore();
}

/** Contorno grosso só por fora (para silhuetas de várias peças). */
export const outlineOnly = (c, path, w = 2.2) => stroke(c, path, OUTLINE, w * 2);
