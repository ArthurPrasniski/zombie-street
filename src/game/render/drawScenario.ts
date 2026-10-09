import { PaintStyle, Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { CAR_BOMB, DEBRIS, ENGINE_TEST, GAS_LEAK, HAY, METEORS, SHELLING } from '@/game/data/events';
import { blob, noise, OUTLINE } from '@/game/render/fxShapes';
import type { Area } from '@/game/types';

// Eventos de cenário (GDD seções 17.5 e 18): fardo, carros-bomba, alvos das bombas, gás e jato.
// O clima (névoa, nevasca, apagão, poeira) fica em drawWeather.ts.
// O plugin de worklets captura o closure quando cada worklet é criado: defina antes de usar.

const HAY_R = HAY.halfWidth * 0.8;

/** Fardo de feno rolando para baixo: disco amarelo com a espiral girando. */
function hay(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'hay' }>): void {
  'worklet';
  for (let i = 0; i < 3; i++) blob(canvas, paint, a.x - 14 + i * 14, a.y - HAY_R - 6 - i * 4, 7, '#d8c39a', 0.4, false);
  blob(canvas, paint, a.x, a.y, HAY_R, '#e8c35a', 1);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setColor(Skia.Color('#b8902a'));
  const spin = a.y / HAY_R;
  for (let r = 8; r < HAY_R; r += 8) canvas.drawArc(Skia.XYWHRect(a.x - r, a.y - r, r * 2, r * 2), (spin * 57 + r * 20) % 360, 240, false, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Placa amarela de perigo com "!". */
function hazardSign(canvas: SkCanvas, paint: SkPaint, x: number, y: number, size: number): void {
  'worklet';
  const path = Skia.Path.Make();
  path.moveTo(x, y - size);
  path.lineTo(x + size * 1.1, y + size * 0.8);
  path.lineTo(x - size * 1.1, y + size * 0.8);
  path.close();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(5);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setAlphaf(1);
  canvas.drawPath(path, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ffc928'));
  canvas.drawPath(path, paint);
  paint.setColor(Skia.Color(OUTLINE));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 2.2, y - size * 0.45, 4.4, size * 0.75), 2, 2), paint);
  canvas.drawCircle(x, y + size * 0.5, 2.6, paint);
}

/** Carro abandonado vazando, com o raio da explosão e a luz piscando mais rápido no fim do pavio. */
function carBomb(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'carBomb' }>, time: number): void {
  'worklet';
  const rate = 3 + 10 * (1 - a.fuse / CAR_BOMB.fuse);
  const on = Math.sin(time * rate * Math.PI) > 0;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ff4f4f'));
  paint.setAlphaf(on ? 0.16 : 0.08);
  canvas.drawCircle(a.x, a.y, CAR_BOMB.radius, paint);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setAlphaf(on ? 0.7 : 0.35);
  canvas.drawCircle(a.x, a.y, CAR_BOMB.radius, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
  paint.setColor(Skia.Color(OUTLINE));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(a.x - 38, a.y - 24, 76, 48), 14, 14), paint);
  paint.setColor(Skia.Color('#8a5a4a'));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(a.x - 35, a.y - 21, 70, 42), 12, 12), paint);
  paint.setColor(Skia.Color('#5a7a9a'));
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(a.x - 12, a.y - 17, 24, 34), 6, 6), paint);
  blob(canvas, paint, a.x + 24, a.y - 12, 5, on ? '#ff3a3a' : '#7a1a1a', 1);
  // Poça de gasolina e fumaça
  paint.setColor(Skia.Color('#2a2533'));
  paint.setAlphaf(0.35);
  canvas.drawOval(Skia.XYWHRect(a.x - 30, a.y + 18, 60, 14), paint);
  for (let i = 0; i < 3; i++) blob(canvas, paint, a.x - 18 + noise(i, 2, 0) * 10, a.y - 30 - ((time * 20 + i * 12) % 36), 7 + i * 2, '#6e6a66', 0.45, false);
  hazardSign(canvas, paint, a.x, a.y - 44 - (on ? 3 : 0), 13);
  paint.setAlphaf(1);
}

/** Alvo vermelho piscando onde a bomba vai cair, com a sombra dela crescendo. */
function shellMarker(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'shell' }>, time: number): void {
  'worklet';
  const params = a.style === 'debris' ? DEBRIS : a.style === 'meteor' ? METEORS : SHELLING;
  if (a.delay > params.warning) return;
  const p = 1 - a.delay / params.warning;
  const radius = params.radius;
  const pulse = 0.5 + 0.5 * Math.sin(time * 18);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(4);
  paint.setColor(Skia.Color('#ff4f4f'));
  paint.setAlphaf(0.5 + 0.4 * pulse);
  canvas.drawCircle(a.x, a.y, radius, paint);
  canvas.drawLine(a.x - 14, a.y, a.x + 14, a.y, paint);
  canvas.drawLine(a.x, a.y - 14, a.x, a.y + 14, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#0c0b0f'));
  paint.setAlphaf(0.25 + 0.2 * p);
  const grow = radius / SHELLING.radius;
  canvas.drawOval(Skia.XYWHRect(a.x - (10 + 16 * p) * grow, a.y - (5 + 6 * p) * grow, (20 + 32 * p) * grow, (10 + 12 * p) * grow), paint);
  // O meteoro brilha caindo; o detrito é um pedaço de metal
  if (a.style === 'meteor') blob(canvas, paint, a.x + (1 - p) * 120, a.y - (1 - p) * 300, 16, '#ff8a1f', 0.9);
  else if (a.style === 'debris') blob(canvas, paint, a.x, a.y - (1 - p) * 260, 7, '#9aa3b8', 0.9);
  paint.setAlphaf(1);
}

/** Vazamento: nuvem verde de bolhas que se mexem, aparecendo e sumindo. */
function gas(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'gas' }>, time: number): void {
  'worklet';
  const fade = Math.min(1, a.ttl / 0.6, (a.duration - a.ttl) / 0.4);
  for (let i = 0; i < 9; i++) {
    const ang = noise(i, 7, 0) * Math.PI * 2 + time * 0.6;
    const d = Math.sqrt(noise(i, 8, 0)) * GAS_LEAK.radius * 0.7;
    blob(canvas, paint, a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d * 0.6, 26 + 10 * noise(i, 9, 0), i % 2 ? '#9be04a' : '#c8f07a', 0.35 * fade, false);
  }
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setColor(Skia.Color('#6ab84a'));
  paint.setAlphaf(0.5 * fade);
  canvas.drawOval(Skia.XYWHRect(a.x - GAS_LEAK.radius, a.y - GAS_LEAK.radius * 0.6, GAS_LEAK.radius * 2, GAS_LEAK.radius * 1.2), paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Teste de motores: faixa de fogo que cresce da esquerda até onde o jato chegou. */
function jet(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'jet' }>, time: number): void {
  'worklet';
  const h = ENGINE_TEST.halfHeight;
  const tail = Math.max(0, a.x - 360);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ff7a2a'));
  paint.setAlphaf(0.55);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(tail, a.y - h, a.x - tail, h * 2), h, h), paint);
  paint.setColor(Skia.Color('#ffc93c'));
  paint.setAlphaf(0.75);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(tail + 20, a.y - h * 0.5, Math.max(0, a.x - tail - 20), h), h * 0.5, h * 0.5), paint);
  for (let i = 0; i < 6; i++) blob(canvas, paint, a.x - i * 26, a.y + Math.sin(time * 30 + i) * 8, 16 - i * 2, i % 2 ? '#ff7a2a' : '#fff1a8', 0.9 - i * 0.12, i === 0);
  paint.setAlphaf(1);
}

/** Carros, alvos das bombas e a nuvem de gás no chão (antes das unidades). */
export function drawScenarioGround(canvas: SkCanvas, paint: SkPaint, areas: Area[], time: number): void {
  'worklet';
  for (const a of areas) {
    if (a.kind === 'carBomb') carBomb(canvas, paint, a, time);
    else if (a.kind === 'shell') shellMarker(canvas, paint, a, time);
    else if (a.kind === 'gas') gas(canvas, paint, a, time);
  }
}

/** O fardo e o jato de fogo passam por cima das unidades. */
export function drawScenarioOverlay(canvas: SkCanvas, paint: SkPaint, areas: Area[], time: number): void {
  'worklet';
  for (const a of areas) {
    if (a.kind === 'hay') hay(canvas, paint, a);
    else if (a.kind === 'jet') jet(canvas, paint, a, time);
  }
}
