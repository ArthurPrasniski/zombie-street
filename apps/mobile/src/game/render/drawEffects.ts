import { PaintStyle, Skia, StrokeJoin, type SkCanvas, type SkFont, type SkPaint } from '@shopify/react-native-skia';

import { DAMAGE_TEXT_TTL, DIRT_TTL, HEAL_TTL, SMOKE_TTL, SPIT_TTL } from '@/game/data/constants';
import { flameJet, zap } from '@/game/render/drawShots';
import { frost } from '@/game/render/drawSpells';
import { blob, flame, noise, OUTLINE, plus } from '@/game/render/fxShapes';
import type { Area, Effect } from '@/game/types';

// Efeitos em estilo cartoon liso: formas com contorno escuro, cores chapadas e brilho.
// O plugin de worklets captura o closure quando cada worklet é criado:
// as funções auxiliares precisam vir antes de quem as usa.

function explosion(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'explosion' }>): void {
  'worklet';
  const p = 1 - e.ttl / e.duration;
  const r = e.radius * (0.4 + 0.6 * Math.sqrt(p));
  const alpha = 1 - p * p;
  // Bolhas de fumaça na borda, bola de fogo no meio
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + noise(i, 1, 0) * 0.6;
    blob(canvas, paint, e.x + Math.cos(a) * r * 0.75, e.y + Math.sin(a) * r * 0.6, r * (0.3 + 0.12 * noise(i, 2, 0)), '#6e6a66', alpha * 0.9);
  }
  blob(canvas, paint, e.x, e.y, r * 0.7, '#ff7a2a', alpha);
  blob(canvas, paint, e.x - r * 0.08, e.y - r * 0.08, r * 0.45, '#ffc93c', alpha, false);
  blob(canvas, paint, e.x - r * 0.15, e.y - r * 0.15, r * 0.2, '#fff6c8', alpha, false);
}

function fire(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'fire' }>, time: number): void {
  'worklet';
  const fade = Math.min(1, a.ttl / 0.5, (a.duration - a.ttl) / 0.2 + 0.3);
  // Mancha queimada e brilho no chão
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#3a1a12'));
  paint.setAlphaf(0.45 * fade);
  canvas.drawOval(Skia.XYWHRect(a.x - a.radius, a.y - a.radius * 0.7, a.radius * 2, a.radius * 1.4), paint);
  paint.setColor(Skia.Color('#ff8a1f'));
  paint.setAlphaf(0.18 * fade);
  canvas.drawOval(Skia.XYWHRect(a.x - a.radius * 0.8, a.y - a.radius * 0.55, a.radius * 1.6, a.radius * 1.1), paint);
  const tick = Math.floor(time * 10);
  for (let i = 0; i < 9; i++) {
    const ang = noise(i, 3, 0) * Math.PI * 2;
    const d = Math.sqrt(noise(i, 4, 0)) * a.radius * 0.8;
    const x = a.x + Math.cos(ang) * d;
    const y = a.y + Math.sin(ang) * d * 0.7;
    const h = 18 + 10 * noise(i, tick, 1);
    flame(canvas, paint, x, y, h, i % 3 === 0 ? '#ffc93c' : '#ff7a2a', fade);
    flame(canvas, paint, x, y - 2, h * 0.5, '#fff1a8', fade);
  }
  paint.setAlphaf(1);
}

function airstrikeMarker(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'airstrike' }>, time: number): void {
  'worklet';
  const pulse = 0.5 + 0.5 * Math.sin(time * 20);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(5);
  paint.setColor(Skia.Color('#ff4f4f'));
  paint.setAlphaf(0.55 + 0.4 * pulse);
  canvas.drawCircle(a.x, a.y, a.radius, paint);
  canvas.drawCircle(a.x, a.y, a.radius * 0.4, paint);
  canvas.drawLine(a.x - a.radius, a.y, a.x - a.radius * 0.6, a.y, paint);
  canvas.drawLine(a.x + a.radius * 0.6, a.y, a.x + a.radius, a.y, paint);
  // Sombra do avião cruzando o campo até o alvo
  const p = 1 - a.delay / a.total;
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#0c0b0f'));
  paint.setAlphaf(0.3);
  const px = a.x - 600 + p * 600;
  canvas.drawOval(Skia.XYWHRect(px - 55, a.y - 120, 110, 20), paint);
  canvas.drawOval(Skia.XYWHRect(px - 12, a.y - 142, 24, 62), paint);
  paint.setAlphaf(1);
}

function smoke(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'smoke' }>): void {
  'worklet';
  const p = 1 - e.ttl / SMOKE_TTL;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = 12 + p * 24;
    blob(canvas, paint, e.x + Math.cos(a) * r, e.y - 12 + Math.sin(a) * r * 0.5, 9 * (1 - p * 0.5), '#f4f1ea', 0.85 * (1 - p));
  }
}

/** Cuspe de ácido: bolha verde em arco do Cuspidor até o alvo, com dois respingos atrás. */
function spit(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'spit' }>): void {
  'worklet';
  const p = 1 - e.ttl / SPIT_TTL;
  for (let i = 0; i < 3; i++) {
    const t = Math.max(0, p - i * 0.12);
    const x = e.fromX + (e.toX - e.fromX) * t;
    const y = e.fromY + (e.toY - e.fromY) * t - Math.sin(t * Math.PI) * 30;
    blob(canvas, paint, x, y, 7 - i * 2, i === 0 ? '#9be04a' : '#c8f07a', 1 - i * 0.3, i === 0);
  }
}

/** Terra subindo quando o Escavador surge. */
function dirt(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'dirt' }>): void {
  'worklet';
  const p = 1 - e.ttl / DIRT_TTL;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    const r = 10 + p * 30;
    blob(canvas, paint, e.x + Math.cos(a) * r, e.y - 6 + Math.sin(a) * r * 0.8 - p * 10, 7 * (1 - p * 0.6), i % 2 ? '#7a5a3a' : '#9a7650', 1 - p);
  }
}

function heal(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'heal' }>): void {
  'worklet';
  const p = 1 - e.ttl / HEAL_TTL;
  const alpha = 1 - p;
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(4);
  paint.setColor(Skia.Color('#9be04a'));
  paint.setAlphaf(alpha * 0.7);
  canvas.drawOval(Skia.XYWHRect(e.x - 24 - p * 10, e.y - 8 - p * 3, 48 + p * 20, 16 + p * 6), paint);
  for (let i = 0; i < 3; i++) plus(canvas, paint, e.x - 16 + i * 16, e.y - 44 - p * 36 - i * 8, 6, alpha);
}

const TEXT_RISE = 30;

/** Número de dano: sobe e some em 0,6 s, branco com contorno escuro (GDD seção 13). */
function damageText(canvas: SkCanvas, paint: SkPaint, e: Extract<Effect, { kind: 'damageText' }>, font: SkFont): void {
  'worklet';
  const p = 1 - e.ttl / DAMAGE_TEXT_TTL;
  const text = String(e.value);
  const x = e.x - font.measureText(text).width / 2;
  const y = e.y - p * TEXT_RISE;
  const alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(6);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setColor(Skia.Color(OUTLINE));
  paint.setAlphaf(alpha);
  canvas.drawText(text, x, y, paint, font);
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ffffff'));
  paint.setAlphaf(alpha);
  canvas.drawText(text, x, y, paint, font);
}

/** Mina armada no chão, com a luz vermelha piscando. */
function mine(canvas: SkCanvas, paint: SkPaint, a: Extract<Area, { kind: 'mine' }>, time: number): void {
  'worklet';
  blob(canvas, paint, a.x, a.y, 12, '#5b6b3a', 1);
  blob(canvas, paint, a.x, a.y - 1, 7, '#6e7f48', 1, false);
  const on = Math.sin(time * 8) > 0;
  blob(canvas, paint, a.x, a.y - 2, 3.4, on ? '#ff3a3a' : '#7a1a1a', 1, false);
}

/** Fogo no chão (antes das unidades). */
export function drawGroundAreas(canvas: SkCanvas, paint: SkPaint, areas: Area[], time: number): void {
  'worklet';
  for (const a of areas) {
    if (a.kind === 'fire') fire(canvas, paint, a, time);
    else if (a.kind === 'mine') mine(canvas, paint, a, time);
  }
}

/** Explosões, cura, fumaça, alvo do ataque aéreo e números de dano (depois das unidades). */
export function drawOverlayEffects(canvas: SkCanvas, paint: SkPaint, effects: Effect[], areas: Area[], time: number, font: SkFont | null): void {
  'worklet';
  for (const e of effects) {
    if (e.kind === 'explosion') explosion(canvas, paint, e);
    else if (e.kind === 'smoke') smoke(canvas, paint, e);
    else if (e.kind === 'heal') heal(canvas, paint, e);
    else if (e.kind === 'flame') flameJet(canvas, paint, e);
    else if (e.kind === 'spit') spit(canvas, paint, e);
    else if (e.kind === 'zap') zap(canvas, paint, e);
    else if (e.kind === 'frost') frost(canvas, paint, e);
    else if (e.kind === 'dirt') dirt(canvas, paint, e);
  }
  for (const a of areas) if (a.kind === 'airstrike') airstrikeMarker(canvas, paint, a, time);
  if (font) {
    for (const e of effects) if (e.kind === 'damageText') damageText(canvas, paint, e, font);
  }
  paint.setAlphaf(1);
}
