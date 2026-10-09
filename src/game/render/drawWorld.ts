import { BlendMode, FilterMode, MipmapMode, PaintStyle, Skia, type SkCanvas, type SkFont, type SkImage, type SkPaint } from '@shopify/react-native-skia';

import { CARDS, TROOPS } from '@/game/data/cards';
import { BASE, DEPLOY_ZONE, WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';
import { ZOMBIES } from '@/game/data/zombies';
import { baseFrame, corpseFrame, troopFrame, VIEW_NAMES, type ViewName, viewFlip, viewRow, zombieFrame } from '@/game/render/animation';
import type { DragPreview } from '@/game/render/camera';
import { drawGroundAreas, drawOverlayEffects } from '@/game/render/drawEffects';
import { drawScenarioGround, drawScenarioOverlay } from '@/game/render/drawScenario';
import { drawSpellGround, drawSpellOverlay } from '@/game/render/drawSpells';
import { drawWeather } from '@/game/render/drawWeather';
import { drawAura, drawEvoRing, drawMound, drawStunStars, drawToxicAura } from '@/game/render/drawSpecials';
import { drawTracer } from '@/game/render/drawShots';
import layout from '@/game/render/spriteLayout.json';
import { ART_UNIT, drawBaseFrame, drawFrame, type SpriteSet } from '@/game/render/sprites';
import type { RenderSnapshot, TroopId } from '@/game/types';

type TroopSnap = RenderSnapshot['troops'][number];
type ZombieSnap = RenderSnapshot['zombies'][number];

const COLORS = { ground: '#2c7d5b', barBack: '#17141b', troopBar: '#b8e835', zombieBar: '#ff4f4f', base: '#ffc928', invalid: '#ff4f4f', flash: '#ffffff', zone: '#ffffff', suit: '#7fd0ff' };
// Tamanho de desenho de cada zumbi (os chefes são maiores); tropas ficam em 1.
const UNIT_SCALE: Partial<Record<string, number>> = Object.fromEntries([...Object.values(ZOMBIES), ...Object.values(TROOPS)].map((u) => [u.id, u.scale ?? 1]));
const BAR_W = 34;
const BAR_H = 5;
// Alturas acima dos pés, em unidades do mundo (escaladas pelo tamanho do zumbi)
const TROOP_BAR_Y = 60;
const ZOMBIE_BAR_Y = 60;
const ZOMBIE_CHEST_Y = 26;
const SHAKE_X = 8;
const SHAKE_Y = 6;
// Vida da base: barra larga no pátio, embaixo da caminhonete.
const BASE_BAR = { x: 200, y: 884, width: 200, height: 7 };
const GUN_FLASH = 0.07;
// Pulo do Cosmonauta: altura (unidades do mundo) e ritmo pelo caminho andado.
const LEAP_HEIGHT = 18;
const LEAP_RATE = 0.09;
// Boca da arma por vista (unidades de desenho), medida pelo build da arte.
const MUZZLES: Partial<Record<TroopId, Record<ViewName, number[]>>> = layout.muzzle;

// O plugin de worklets captura o closure quando cada worklet é criado:
// as funções auxiliares precisam vir antes de quem as usa.

function rect(canvas: SkCanvas, paint: SkPaint, x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
  'worklet';
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  canvas.drawRect(Skia.XYWHRect(x, y, w, h), paint);
}

function pill(canvas: SkCanvas, paint: SkPaint, x: number, y: number, w: number, h: number, color: string): void {
  'worklet';
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(1);
  canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), h / 2, h / 2), paint);
}

/** Barra de vida arredondada com borda escura. */
function bar(canvas: SkCanvas, paint: SkPaint, cx: number, y: number, width: number, ratio: number, color: string): void {
  'worklet';
  pill(canvas, paint, cx - width / 2 - 2, y - 2, width + 4, BAR_H + 4, COLORS.barBack);
  if (ratio > 0) pill(canvas, paint, cx - width / 2, y, Math.max(BAR_H, width * ratio), BAR_H, color);
}

function drawBackground(canvas: SkCanvas, paint: SkPaint, image: SkImage | null): void {
  'worklet';
  if (!image) {
    rect(canvas, paint, 0, 0, WORLD_WIDTH, WORLD_HEIGHT, COLORS.ground);
    return;
  }
  paint.setAlphaf(1);
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  canvas.drawImageRectOptions(image, src, Skia.XYWHRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT), FilterMode.Linear, MipmapMode.None, paint);
}

function drawBase(canvas: SkCanvas, paint: SkPaint, base: RenderSnapshot['base'], image: SkImage | null): void {
  'worklet';
  if (image) {
    paint.setAlphaf(1);
    drawBaseFrame(canvas, image, baseFrame(base.hpRatio), paint);
  } else {
    rect(canvas, paint, 0, BASE.frontY, WORLD_WIDTH, WORLD_HEIGHT - BASE.frontY, '#3a4a3c');
  }
  if (base.sinceShot < GUN_FLASH && base.hpRatio > 0) {
    rect(canvas, paint, BASE.gunX - 6, BASE.gunY - 10, 12, 12, '#fff3b0');
    rect(canvas, paint, BASE.gunX - 3, BASE.gunY - 18, 6, 10, '#ffb03a');
  }
  const b = BASE_BAR;
  pill(canvas, paint, b.x - 3, b.y - 3, b.width + 6, b.height + 6, COLORS.barBack);
  if (base.hpRatio > 0) pill(canvas, paint, b.x, b.y, Math.max(b.height, b.width * base.hpRatio), b.height, COLORS.base);
}

function drawTroop(canvas: SkCanvas, paint: SkPaint, flash: SkPaint, frost: SkPaint, t: TroopSnap, index: number, time: number, image: SkImage | null): void {
  'worklet';
  drawEvoRing(canvas, paint, t.x, t.y, t.evo, time);
  if (image) {
    paint.setAlphaf(t.deploying ? 0.6 : 1);
    const row = viewRow(t.dirX, t.dirY);
    // Golpe: pisca branco; congelada (Congelado/Abominável): fica azulada
    const look = t.flash ? flash : t.chilled ? frost : paint;
    drawFrame(canvas, image, troopFrame(t, time, index), row, t.x, t.y, UNIT_SCALE[t.kind] ?? 1, look, viewFlip(row, t.dirX));
    paint.setAlphaf(1);
  } else {
    rect(canvas, paint, t.x - 14, t.y - 56, 28, 56, '#4da3ff');
  }
  bar(canvas, paint, t.x, t.y - TROOP_BAR_Y * (UNIT_SCALE[t.kind] ?? 1), BAR_W, t.hpRatio, COLORS.troopBar);
}

function drawZombie(canvas: SkCanvas, paint: SkPaint, flash: SkPaint, frost: SkPaint, z: ZombieSnap, image: SkImage | null, time: number): void {
  'worklet';
  if (z.burrowed) {
    drawMound(canvas, paint, z);
    return;
  }
  if (image) {
    paint.setAlphaf(1);
    const row = viewRow(z.dirX, z.dirY);
    // Cosmonauta e Comandante quicam enquanto andam (passam por cima de tudo)
    const hop = z.leaper && !z.attacking ? Math.abs(Math.sin(z.travelled * LEAP_RATE)) * LEAP_HEIGHT * z.scale : 0;
    // Mordida do Rex evoluído: azulado, como a tropa congelada
    drawFrame(canvas, image, zombieFrame(z), row, z.x, z.y - hop, z.scale, z.flash ? flash : z.slowed ? frost : paint, viewFlip(row, z.dirX));
  } else {
    rect(canvas, paint, z.x - 14, z.y - 32 * z.scale, 28 * z.scale, 32 * z.scale, '#5fbf4a');
  }
  bar(canvas, paint, z.x, z.y - ZOMBIE_BAR_Y * z.scale, BAR_W * z.scale, z.hpRatio, COLORS.zombieBar);
  // Traje do Astronauta: barra azul em cima da vida, até trincar
  if (z.suitRatio > 0) bar(canvas, paint, z.x, z.y - ZOMBIE_BAR_Y * z.scale - BAR_H - 5, BAR_W * z.scale, z.suitRatio, COLORS.suit);
  if (z.stunned) drawStunStars(canvas, paint, z, time);
}

/** Tropas e zumbis juntos, de cima para baixo, para quem está mais à frente cobrir quem está atrás. */
function drawUnits(canvas: SkCanvas, paint: SkPaint, flash: SkPaint, frost: SkPaint, snap: RenderSnapshot, sprites: SpriteSet): void {
  'worklet';
  const troops = snap.troops.map((t, i) => ({ t, i })).sort((a, b) => a.t.y - b.t.y);
  const zombies = [...snap.zombies].sort((a, b) => a.y - b.y);
  let i = 0;
  let j = 0;
  while (i < troops.length || j < zombies.length) {
    if (j >= zombies.length || (i < troops.length && troops[i].t.y <= zombies[j].y)) {
      drawTroop(canvas, paint, flash, frost, troops[i].t, troops[i].i, snap.time, sprites.units[troops[i].t.kind] ?? null);
      i++;
    } else {
      drawZombie(canvas, paint, flash, frost, zombies[j], sprites.units[zombies[j].kind] ?? null, snap.time);
      j++;
    }
  }
}

function drawTracers(canvas: SkCanvas, paint: SkPaint, snap: RenderSnapshot): void {
  'worklet';
  for (const e of snap.effects) {
    if (e.kind !== 'tracer') continue;
    let fromX = e.fromX;
    let fromY = e.fromY;
    const shooter = snap.troops.find((t) => t.x === e.fromX && t.y === e.fromY);
    const row = shooter ? viewRow(shooter.dirX, shooter.dirY) : 0;
    const muzzle = shooter ? MUZZLES[shooter.kind]?.[VIEW_NAMES[row]] : undefined;
    if (shooter && muzzle) {
      fromX = shooter.x + (muzzle[0] - layout.footX) * ART_UNIT * (viewFlip(row, shooter.dirX) ? -1 : 1);
      fromY = shooter.y + (muzzle[1] - layout.footY) * ART_UNIT;
    }
    drawTracer(canvas, paint, fromX, fromY, e.toX, e.toY - ZOMBIE_CHEST_Y, e.ttl, e.style);
  }
}

function drawDrag(canvas: SkCanvas, paint: SkPaint, tint: SkPaint, drag: DragPreview, sprites: SpriteSet): void {
  'worklet';
  if (!drag.active || !drag.card) return;
  const card = CARDS[drag.card];
  // Worklet: nada de chamar funções comuns (como isTroop) aqui, só ler dados.
  if (card.kind === 'troop') {
    const z = DEPLOY_ZONE;
    rect(canvas, paint, z.minX, z.minY, z.maxX - z.minX, z.maxY - z.minY, COLORS.zone, 0.1);
    const image = sprites.units[card.id];
    if (image) {
      paint.setAlphaf(0.6);
      drawFrame(canvas, image, layout.troops.idle.start, layout.views.back, drag.x, drag.y, 1, drag.valid ? paint : tint);
    }
    paint.setAlphaf(1);
    return;
  }
  paint.setColor(Skia.Color(drag.valid ? '#ffffff' : COLORS.invalid));
  // Canhão Orbital: a coluna inteira; Escudo de Energia: a parede; o resto: o raio
  if (card.id === 'orbital' || card.id === 'forcefield') {
    const w = card.width ?? 0;
    const area = card.id === 'orbital' ? Skia.XYWHRect(drag.x - w / 2, 0, w, WORLD_HEIGHT) : Skia.XYWHRect(drag.x - w / 2, drag.y - 14, w, 28);
    paint.setStyle(PaintStyle.Fill);
    paint.setAlphaf(0.15);
    canvas.drawRect(area, paint);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(3);
    paint.setAlphaf(0.7);
    canvas.drawRect(area, paint);
    paint.setStyle(PaintStyle.Fill);
    paint.setAlphaf(1);
    return;
  }
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(0.15);
  canvas.drawCircle(drag.x, drag.y, card.radius, paint);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(3);
  paint.setAlphaf(0.7);
  canvas.drawCircle(drag.x, drag.y, card.radius, paint);
  paint.setStyle(PaintStyle.Fill);
  paint.setAlphaf(1);
}

/** Desenha o campo inteiro em coordenadas do mundo. Roda no thread de UI. */
export function drawWorld(canvas: SkCanvas, snap: RenderSnapshot, sprites: SpriteSet, drag: DragPreview, font: SkFont | null): void {
  'worklet';
  const paint = Skia.Paint();
  const flash = Skia.Paint();
  flash.setColorFilter(Skia.ColorFilter.MakeBlend(Skia.Color(COLORS.flash), BlendMode.SrcIn));
  const frost = Skia.Paint();
  frost.setColorFilter(Skia.ColorFilter.MakeBlend(Skia.Color('rgba(127, 208, 255, 0.55)'), BlendMode.SrcATop));
  const tint = Skia.Paint();
  tint.setAlphaf(0.6);
  tint.setColorFilter(Skia.ColorFilter.MakeBlend(Skia.Color(COLORS.invalid), BlendMode.SrcATop));

  canvas.save();
  const shakeX = snap.shake > 0 ? Math.sin(snap.time * 90) * snap.shake * SHAKE_X : 0;
  const shakeY = snap.shake > 0 ? Math.cos(snap.time * 70) * snap.shake * SHAKE_Y : 0;
  canvas.translate(shakeX, shakeY);

  drawBackground(canvas, paint, sprites.background);
  drawGroundAreas(canvas, paint, snap.areas, snap.time);
  drawScenarioGround(canvas, paint, snap.areas, snap.time);
  drawSpellGround(canvas, paint, snap.areas, snap.time);
  drawBase(canvas, paint, snap.base, sprites.base);
  for (const e of snap.effects) {
    if (e.kind !== 'corpse') continue;
    const image = sprites.units[e.unit];
    if (!image) continue;
    const { frame, alpha } = corpseFrame(e.unit, e.ttl);
    paint.setAlphaf(alpha);
    const row = viewRow(e.dirX, e.dirY);
    drawFrame(canvas, image, frame, row, e.x, e.y, UNIT_SCALE[e.unit] ?? 1, paint, viewFlip(row, e.dirX));
  }
  paint.setAlphaf(1);
  for (const z of snap.zombies) {
    if (z.burrowed) continue;
    if (z.aura > 0) drawAura(canvas, paint, z, snap.time);
    if (z.toxic > 0) drawToxicAura(canvas, paint, z, snap.time);
  }
  drawUnits(canvas, paint, flash, frost, snap, sprites);
  drawTracers(canvas, paint, snap);
  drawScenarioOverlay(canvas, paint, snap.areas, snap.time);
  drawSpellOverlay(canvas, paint, snap.areas, snap.time);
  drawOverlayEffects(canvas, paint, snap.effects, snap.areas, snap.time, font);
  drawWeather(canvas, paint, snap.weather, snap.time, [...snap.troops, { x: BASE.gunX, y: BASE.gunY }]);
  drawDrag(canvas, paint, tint, drag, sprites);
  canvas.restore();
}
