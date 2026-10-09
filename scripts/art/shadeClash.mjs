// Sombreamento "Clash 2D": volume com degradê radial, contorno da cor do
// material, sombra suave embaixo, luz de contorno na borda e brilho especular.
import { CK, clipped, darken, fill, keep, lighten, minus, moved, paint, rgba, stroke } from './ck.mjs';

/** Degradê radial preso ao caminho: claro em cima à esquerda, escuro embaixo à direita. */
function volume(c, path, base, b) {
  const [l, t, r, bt] = b;
  const w = r - l;
  const h = bt - t;
  const p = paint('#000000');
  const center = [l + w * 0.32, t + h * 0.28];
  const radius = Math.max(w, h) * 1.05;
  p.setShader(keep(CK.Shader.MakeRadialGradient(center, radius, [rgba(lighten(base, 0.22)), rgba(base), rgba(darken(base, 0.3))], [0, 0.5, 1], CK.TileMode.Clamp)));
  c.drawPath(path, p);
}

function softFill(c, path, color, alpha, blur) {
  const p = paint(color, alpha);
  p.setMaskFilter(keep(CK.MaskFilter.MakeBlur(CK.BlurStyle.Normal, blur, true)));
  c.drawPath(path, p);
}

export function toonClash(c, path, base, opts = {}) {
  const w = (opts.line ?? 2.2) * 1.15;
  const depth = opts.depth ?? 3;
  const b = path.getBounds();
  const size = Math.min(b[2] - b[0], b[3] - b[1]);
  if (!opts.noLine) stroke(c, path, opts.outline ?? darken(base, 0.62), w * 2);
  volume(c, path, base, b);
  clipped(c, path, () => {
    // Sombra suave na parte de baixo (oclusão)
    softFill(c, minus(path, moved(path, { dx: -depth * 0.5, dy: -depth * 1.3 })), darken(base, 0.45), 0.55, Math.max(0.8, depth * 0.6));
    if (opts.noLight) return;
    // Luz de contorno fria na borda direita e brilho no alto à esquerda
    fill(c, minus(path, moved(path, { dx: -Math.max(1, size * 0.08), dy: 0.4 })), '#e8f4ff', 0.35);
    if (size > 5) softFill(c, moved(path, { sx: 0.32, sy: 0.22, px: b[0] + (b[2] - b[0]) * 0.3, py: b[1] + (b[3] - b[1]) * 0.22 }), '#ffffff', 0.5, size * 0.07);
  });
}
