// Saída da arte: superfícies, PNG e texto com a fonte da interface (logo).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CK, keep, paint, ROOT } from './ck.mjs';

/** Superfície de desenho transparente, em pixels. */
export function surface(w, h) {
  const s = CK.MakeSurface(w, h);
  s.getCanvas().clear(CK.TRANSPARENT);
  return s;
}

export function savePng(s, path) {
  const img = s.makeImageSnapshot();
  const bytes = img.encodeToBytes();
  img.delete();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  return bytes.length;
}

/** Fonte da interface para textos desenhados na arte (logo). */
export function typeface(file) {
  // Arquivos pequenos vêm dentro de um buffer compartilhado do Node: passa só os bytes do arquivo
  const bytes = readFileSync(join(ROOT, 'assets/fonts', file));
  return CK.Typeface.MakeFreeTypeFaceFromData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
}

export function textWidth(str, size, face) {
  const font = keep(new CK.Font(face, size));
  return font.getGlyphWidths(font.getGlyphIDs(str)).reduce((a, b) => a + b, 0);
}

export function text(c, str, x, y, size, face, color, { align = 'left', strokeColor = null, strokeWidth = 0 } = {}) {
  const font = keep(new CK.Font(face, size));
  const width = textWidth(str, size, face);
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  if (strokeColor) {
    const p = paint(strokeColor);
    p.setStyle(CK.PaintStyle.Stroke);
    p.setStrokeWidth(strokeWidth);
    p.setStrokeJoin(CK.StrokeJoin.Round);
    c.drawText(str, left, y, p, font);
  }
  c.drawText(str, left, y, paint(color), font);
  return width;
}
