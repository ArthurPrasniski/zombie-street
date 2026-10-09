import { PaintStyle, Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

// Formas básicas dos efeitos (worklets): bolha com contorno, chama em gota, cruz de cura.
// O plugin de worklets captura o closure quando cada worklet é criado: defina antes de usar.

export const OUTLINE = '#17141b';
const LINE = 3;

export function noise(i: number, j: number, t: number): number {
  'worklet';
  const s = Math.sin(i * 12.9898 + j * 78.233 + t * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/** Círculo com contorno (desenha o contorno primeiro, o miolo por cima). */
export function blob(canvas: SkCanvas, paint: SkPaint, x: number, y: number, r: number, color: string, alpha: number, outline = true): void {
  'worklet';
  paint.setStyle(PaintStyle.Fill);
  if (outline) {
    paint.setColor(Skia.Color(OUTLINE));
    paint.setAlphaf(alpha);
    canvas.drawCircle(x, y, r + LINE, paint);
  }
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  canvas.drawCircle(x, y, r, paint);
}

/** Chama em gota apontando para cima. */
export function flame(canvas: SkCanvas, paint: SkPaint, x: number, y: number, h: number, color: string, alpha: number): void {
  'worklet';
  const w = h * 0.45;
  const path = Skia.Path.Make();
  path.moveTo(x, y - h);
  path.cubicTo(x + w * 0.6, y - h * 0.55, x + w, y - h * 0.1, x, y);
  path.cubicTo(x - w, y - h * 0.1, x - w * 0.6, y - h * 0.55, x, y - h);
  path.close();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(LINE);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setAlphaf(alpha);
  canvas.drawPath(path, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(color));
  canvas.drawPath(path, paint);
}

/** Cruz verde com contorno. */
export function plus(canvas: SkCanvas, paint: SkPaint, x: number, y: number, s: number, alpha: number): void {
  'worklet';
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setAlphaf(alpha);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - s - 2, y - s * 0.4 - 2, s * 2 + 4, s * 0.8 + 4), 3, 3), paint);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - s * 0.4 - 2, y - s - 2, s * 0.8 + 4, s * 2 + 4), 3, 3), paint);
  paint.setColor(Skia.Color('#9be04a'));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - s, y - s * 0.4, s * 2, s * 0.8), 2, 2), paint);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - s * 0.4, y - s, s * 0.8, s * 2), 2, 2), paint);
}
