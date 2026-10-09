import { PaintStyle, Skia, StrokeCap, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { FROST_TTL, WORLD_HEIGHT } from '@/game/data/constants';
import { blob } from '@/game/render/fxShapes';
import type { Area, Effect } from '@/game/types';

// Armas especiais do Ato 3 (GDD seção 18.4): rajada de gelo, Escudo de Energia, Buraco Negro e
// Canhão Orbital. O plugin de worklets captura o closure quando cada worklet é criado.

/** Criogenia: anel de gelo que se abre e cristais em volta. */
export function frost(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'frost' }>): void {
  'worklet';
  const p = 1 - e.ttl / FROST_TTL;
  const r = e.radius * (0.5 + 0.5 * p);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#bfe6ff'));
  paint.setAlphaf(0.35 * (1 - p));
  canvas.drawOval(Skia.XYWHRect(e.x - r, e.y - r * 0.6, r * 2, r * 1.2), paint);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    blob(canvas, paint, e.x + Math.cos(a) * r * 0.8, e.y + Math.sin(a) * r * 0.5, 7 * (1 - p * 0.5), '#e0f8ff', 1 - p);
  }
  paint.setAlphaf(1);
}

/** Escudo de Energia: faixa ciano de hexágonos, mais fraca conforme perde vida. */
function forcefield(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'forcefield' }>, time: number): void {
  'worklet';
  const life = a.hp / a.maxHp;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  const left = a.x - a.width / 2;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#3ee8ff'));
  paint.setAlphaf(0.25 + 0.2 * life + 0.1 * pulse);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(left, a.y - 14, a.width, 28), 14, 14), paint);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setColor(Skia.Color('#e0ffff'));
  paint.setAlphaf(0.5 + 0.4 * life);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(left, a.y - 14, a.width, 28), 14, 14), paint);
  for (let x = left + 14; x < left + a.width - 8; x += 22) canvas.drawCircle(x, a.y, 7, paint);
  // Emissores nas pontas
  paint.setStyle(PaintStyle.Fill);
  for (const x of [left, left + a.width]) blob(canvas, paint, x, a.y, 9, '#4a5068', 1);
  paint.setAlphaf(1);
}

/** Buraco Negro: disco escuro girando com anéis roxos que encolhem. */
function blackhole(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'blackhole' }>, time: number): void {
  'worklet';
  const p = 1 - a.ttl / a.duration;
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  for (let i = 0; i < 4; i++) {
    const r = a.radius * (((i / 4 + time * 0.8) % 1) * 0.9 + 0.1);
    paint.setStrokeWidth(4);
    paint.setColor(Skia.Color(i % 2 ? '#c8a0ff' : '#8a4ad8'));
    paint.setAlphaf(0.6 * (r / a.radius));
    canvas.drawOval(Skia.XYWHRect(a.x - r, a.y - r * 0.55, r * 2, r * 1.1), paint);
  }
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#0c0b0f'));
  paint.setAlphaf(0.95);
  const core = 20 + p * 14;
  canvas.drawOval(Skia.XYWHRect(a.x - core, a.y - core * 0.6, core * 2, core * 1.2), paint);
  for (let i = 0; i < 6; i++) {
    const ang = time * 4 + (i / 6) * Math.PI * 2;
    blob(canvas, paint, a.x + Math.cos(ang) * core * 1.4, a.y + Math.sin(ang) * core * 0.8, 3, '#e0c8ff', 0.8, false);
  }
  paint.setAlphaf(1);
}

/** Canhão Orbital: mira na coluna enquanto carrega e o raio branco-rosado quando cai. */
function orbital(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'orbital' }>, time: number): void {
  'worklet';
  const p = 1 - a.delay / a.total;
  const left = a.x - a.width / 2;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ff4fd8'));
  paint.setAlphaf(0.1 + 0.2 * p + 0.08 * Math.sin(time * 20));
  canvas.drawRect(Skia.XYWHRect(left, 0, a.width, WORLD_HEIGHT), paint);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setAlphaf(0.7);
  canvas.drawLine(left, 0, left, WORLD_HEIGHT, paint);
  canvas.drawLine(left + a.width, 0, left + a.width, WORLD_HEIGHT, paint);
  if (p > 0.7) {
    paint.setStyle(PaintStyle.Fill);
    paint.setColor(Skia.Color('#ffffff'));
    paint.setAlphaf((p - 0.7) / 0.3);
    const w = a.width * 0.3 * p;
    canvas.drawRect(Skia.XYWHRect(a.x - w / 2, 0, w, WORLD_HEIGHT), paint);
  }
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Buraco Negro no chão (antes das unidades). */
export function drawSpellGround(canvas: SkCanvas, paint: SkPaint, areas: Area[], time: number): void {
  'worklet';
  for (const a of areas) {
    if (a.kind === 'blackhole') blackhole(canvas, paint, a, time);
  }
}

/** Parede do Escudo e coluna do Canhão Orbital por cima das unidades. */
export function drawSpellOverlay(canvas: SkCanvas, paint: SkPaint, areas: Area[], time: number): void {
  'worklet';
  for (const a of areas) {
    if (a.kind === 'forcefield') forcefield(canvas, paint, a, time);
    else if (a.kind === 'orbital') orbital(canvas, paint, a, time);
  }
}
