import { PaintStyle, Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { OUTLINE } from '@/game/render/fxShapes';
import type { RenderSnapshot } from '@/game/types';

// Zumbis especiais (GDD seção 17.4): o monte de terra do Escavador e o escudo do Porta-escudo.
// Cartas evoluídas (seção 17.6): o anel no chão da tropa e as estrelinhas do zumbi atordoado.

type ZombieSnap = RenderSnapshot['zombies'][number];
const EVO_COLORS = ['', '#4aa8ff', '#b06aff'];
const AURA = '#5ac8ff';

/** Escavador enterrado: monte de terra andando, sem barra de vida. */
export function drawMound(canvas: SkCanvas, paint: SkPaint, z: ZombieSnap): void {
  'worklet';
  const wobble = Math.sin(z.travelled * 0.3) * 2;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setAlphaf(1);
  canvas.drawOval(Skia.XYWHRect(z.x - 23, z.y - 15 + wobble * 0.3, 46, 22), paint);
  paint.setColor(Skia.Color('#7a5a3a'));
  canvas.drawOval(Skia.XYWHRect(z.x - 20, z.y - 12 + wobble * 0.3, 40, 17), paint);
  paint.setColor(Skia.Color('#9a7650'));
  canvas.drawOval(Skia.XYWHRect(z.x - 12, z.y - 11, 18, 7), paint);
  for (let i = 0; i < 3; i++) {
    paint.setColor(Skia.Color('#8d9bb0'));
    canvas.drawCircle(z.x - 22 + i * 21 + wobble, z.y + 3 - (i % 2) * 4, 3, paint);
  }
}

/** Escudo do Porta-escudo no chão: área em que os outros zumbis levam menos dano. */
export function drawAura(canvas: SkCanvas, paint: SkPaint, z: ZombieSnap, time: number): void {
  'worklet';
  const pulse = 0.5 + 0.5 * Math.sin(time * 4 + z.uid);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(AURA));
  paint.setAlphaf(0.1 + 0.05 * pulse);
  canvas.drawOval(Skia.XYWHRect(z.x - z.aura, z.y - z.aura * 0.55, z.aura * 2, z.aura * 1.1), paint);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setAlphaf(0.45 + 0.25 * pulse);
  canvas.drawOval(Skia.XYWHRect(z.x - z.aura, z.y - z.aura * 0.55, z.aura * 2, z.aura * 1.1), paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Anel no chão da tropa evoluída: azul no nível 10, roxo no 20. */
export function drawEvoRing(canvas: SkCanvas, paint: SkPaint, x: number, y: number, evo: number, time: number): void {
  'worklet';
  if (evo <= 0) return;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(4);
  paint.setColor(Skia.Color(EVO_COLORS[evo]));
  paint.setAlphaf(0.55 + 0.35 * pulse);
  canvas.drawOval(Skia.XYWHRect(x - 26, y - 9, 52, 18), paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(0.18);
  canvas.drawOval(Skia.XYWHRect(x - 26, y - 9, 52, 18), paint);
  paint.setAlphaf(1);
}

/** Estrelinhas girando em cima do zumbi atordoado. */
export function drawStunStars(canvas: SkCanvas, paint: SkPaint, z: ZombieSnap, time: number): void {
  'worklet';
  const cy = z.y - 76 * z.scale;
  paint.setStyle(PaintStyle.Fill);
  for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i * Math.PI * 2) / 3;
    const x = z.x + Math.cos(a) * 16 * z.scale;
    const y = cy + Math.sin(a) * 5;
    paint.setColor(Skia.Color(OUTLINE));
    paint.setAlphaf(1);
    canvas.drawCircle(x, y, 5.5, paint);
    paint.setColor(Skia.Color('#ffe27a'));
    canvas.drawCircle(x, y, 3.5, paint);
  }
}

/** Aura tóxica do Mutante e do Diretor: mancha verde pulsando no chão. */
export function drawToxicAura(canvas: SkCanvas, paint: SkPaint, z: ZombieSnap, time: number): void {
  'worklet';
  const pulse = 0.5 + 0.5 * Math.sin(time * 5 + z.uid);
  const r = z.toxic;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#9be04a'));
  paint.setAlphaf(0.12 + 0.08 * pulse);
  canvas.drawOval(Skia.XYWHRect(z.x - r, z.y - r * 0.5, r * 2, r), paint);
  paint.setAlphaf(1);
}
