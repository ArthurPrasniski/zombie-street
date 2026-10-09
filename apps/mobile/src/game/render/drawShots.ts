import { PaintStyle, Skia, StrokeCap, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { FLAME_TTL, TRACER_TTL, ZAP_TTL } from '@/game/data/constants';
import { blob, noise, OUTLINE } from '@/game/render/fxShapes';
import type { Effect } from '@/game/types';

// Tiros: rastro de bala, virote da besta, jato do lança-chamas, feixe laser e raio da Tesla (worklets).

/** Virote da besta: haste clara com ponta, voando do atirador até o alvo. */
function bolt(canvas: SkCanvas, paint: SkPaint, fromX: number, fromY: number, toX: number, toY: number, ttl: number): void {
  'worklet';
  const p = 1 - ttl / (TRACER_TTL * 2);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const hx = fromX + dx * p;
  const hy = fromY + dy * p;
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setStrokeWidth(5);
  paint.setAlphaf(1);
  canvas.drawLine(hx - (dx / len) * 22, hy - (dy / len) * 22, hx, hy, paint);
  paint.setColor(Skia.Color('#e8dcc0'));
  paint.setStrokeWidth(2.4);
  canvas.drawLine(hx - (dx / len) * 22, hy - (dy / len) * 22, hx, hy, paint);
  paint.setStyle(PaintStyle.Fill);
  blob(canvas, paint, hx, hy, 3, '#c8ccd8', 1);
}

/** Jato do lança-chamas: bolas de fogo em leque do bico até o alvo. */
export function flameJet(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'flame' }>): void {
  'worklet';
  const p = 1 - e.ttl / FLAME_TTL;
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 6;
    const x = e.fromX + (e.toX - e.fromX) * t + (noise(i, e.toX, 1) - 0.5) * 14 * t;
    const y = e.fromY - 26 + (e.toY - 26 - e.fromY + 26) * t + (noise(e.toY, i, 2) - 0.5) * 14 * t;
    const r = 5 + t * 9 * (1 - p * 0.4);
    blob(canvas, paint, x, y, r, i % 2 ? '#ff7a2a' : '#ffc93c', 1 - p * 0.6);
  }
}

/** Feixe laser: faixa grossa rosada com miolo branco, que some rápido. */
function laserBeam(canvas: SkCanvas, paint: SkPaint, fromX: number, fromY: number, toX: number, toY: number, ttl: number): void {
  'worklet';
  const alpha = Math.max(0, ttl / (TRACER_TTL * 1.5));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  for (const [width, color, a] of [[12, '#ff4fd8', 0.35], [6, '#ff7ae4', 0.8], [2.4, '#ffffff', 1]] as const) {
    paint.setStrokeWidth(width);
    paint.setColor(Skia.Color(color));
    paint.setAlphaf(alpha * a);
    canvas.drawLine(fromX, fromY, toX, toY, paint);
  }
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Raio da Torre Tesla: zigue-zague ciano da torre até cada zumbi atingido, em sequência. */
export function zap(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'zap' }>): void {
  'worklet';
  const alpha = Math.max(0, e.ttl / ZAP_TTL);
  const tick = Math.floor(e.ttl * 60);
  const path = Skia.Path.Make();
  path.moveTo(e.points[0], e.points[1]);
  for (let i = 2; i < e.points.length; i += 2) {
    const ax = e.points[i - 2];
    const ay = e.points[i - 1];
    const bx = e.points[i];
    const by = e.points[i + 1];
    for (let s = 1; s <= 4; s++) {
      const t = s / 4;
      const jitter = s === 4 ? 0 : (noise(i, s, tick) - 0.5) * 18;
      path.lineTo(ax + (bx - ax) * t + jitter, ay + (by - ay) * t - jitter * 0.6);
    }
  }
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  for (const [width, color, a] of [[9, '#3ee8ff', 0.3], [4, '#9ff4ff', 0.9], [1.6, '#ffffff', 1]] as const) {
    paint.setStrokeWidth(width);
    paint.setColor(Skia.Color(color));
    paint.setAlphaf(alpha * a);
    canvas.drawPath(path, paint);
  }
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

export function drawTracer(canvas: SkCanvas, paint: SkPaint, fromX: number, fromY: number, toX: number, toY: number, ttl: number, style?: 'bolt' | 'laser'): void {
  'worklet';
  if (style === 'bolt') {
    bolt(canvas, paint, fromX, fromY, toX, toY, ttl);
    return;
  }
  if (style === 'laser') {
    laserBeam(canvas, paint, fromX, fromY, toX, toY, ttl);
    return;
  }
  const alpha = Math.max(0, ttl / TRACER_TTL);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeWidth(6);
  paint.setColor(Skia.Color('#ffc93c'));
  paint.setAlphaf(alpha * 0.6);
  canvas.drawLine(fromX, fromY, toX, toY, paint);
  paint.setStrokeWidth(2.5);
  paint.setColor(Skia.Color('#fffbe6'));
  paint.setAlphaf(alpha);
  canvas.drawLine(fromX, fromY, toX, toY, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}
