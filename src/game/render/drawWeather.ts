import { BlendMode, BlurStyle, PaintStyle, Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';

import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';
import { noise } from '@/game/render/fxShapes';
import type { Weather } from '@/game/types';

// Clima dos eventos de cenário (GDD seções 17.5 e 18): névoa, nevasca, apagão e poeira.
// O plugin de worklets captura o closure quando cada worklet é criado: defina antes de usar.

// O clima entra e sai em meio segundo.
const WEATHER_FADE = 0.5;
// Raio da luz em volta de cada tropa e da base no apagão.
const LIGHT_RADIUS = 80;

/** Apagão: tudo escuro, com piscadas, e luz em volta das tropas e da base (lanternas). */
function blackout(canvas: SkCanvas, paint: SkPaint, fade: number, time: number, lights: { x: number; y: number }[]): void {
  'worklet';
  const flicker = noise(Math.floor(time * 8), 5, 0) > 0.88 ? 0.15 : 0;
  canvas.saveLayer();
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#05060c'));
  paint.setAlphaf((0.8 - flicker) * fade);
  canvas.drawRect(Skia.XYWHRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT), paint);
  const hole = Skia.Paint();
  hole.setBlendMode(BlendMode.DstOut);
  hole.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 22, true));
  hole.setAlphaf(0.9 * fade);
  for (const l of lights) canvas.drawCircle(l.x, l.y - 24, LIGHT_RADIUS, hole);
  canvas.restore();
  paint.setAlphaf(1);
}

/** Névoa (manchas brancas passando), nevasca (tom azulado e neve de lado) ou apagão (escuro com lanternas). */
export function drawWeather(canvas: SkCanvas, paint: SkPaint, weather: Weather | null, time: number, lights: { x: number; y: number }[]): void {
  'worklet';
  if (!weather) return;
  const fade = Math.min(1, weather.ttl / WEATHER_FADE, (weather.duration - weather.ttl) / WEATHER_FADE);
  paint.setStyle(PaintStyle.Fill);
  if (weather.kind === 'blackout') {
    blackout(canvas, paint, fade, time, lights);
  } else if (weather.kind === 'dust') {
    // Tempestade de poeira: tom vermelho e faixas de areia passando de lado
    paint.setColor(Skia.Color('#c8643a'));
    paint.setAlphaf(0.28 * fade);
    canvas.drawRect(Skia.XYWHRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT), paint);
    paint.setColor(Skia.Color('#f0b080'));
    for (let i = 0; i < 26; i++) {
      const y = noise(i, 2, 0) * WORLD_HEIGHT;
      const x = ((noise(i, 1, 0) * WORLD_WIDTH + time * (260 + noise(i, 3, 0) * 160)) % (WORLD_WIDTH + 200)) - 100;
      paint.setAlphaf(0.4 * fade);
      canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, y, 90, 4), 2, 2), paint);
    }
  } else if (weather.kind === 'fog') {
    paint.setColor(Skia.Color('#dfe6e2'));
    paint.setAlphaf(0.18 * fade);
    canvas.drawRect(Skia.XYWHRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT), paint);
    for (let i = 0; i < 9; i++) {
      const x = ((noise(i, 1, 0) * WORLD_WIDTH + time * (12 + i * 3)) % (WORLD_WIDTH + 300)) - 150;
      const y = noise(i, 2, 0) * WORLD_HEIGHT;
      paint.setAlphaf(0.22 * fade);
      canvas.drawOval(Skia.XYWHRect(x - 130, y - 50, 260, 100), paint);
    }
  } else {
    paint.setColor(Skia.Color('#bfe6ff'));
    paint.setAlphaf(0.14 * fade);
    canvas.drawRect(Skia.XYWHRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT), paint);
    paint.setColor(Skia.Color('#ffffff'));
    for (let i = 0; i < 70; i++) {
      const fall = time * (90 + noise(i, 3, 0) * 60);
      const x = (noise(i, 1, 0) * WORLD_WIDTH + fall * 0.5) % WORLD_WIDTH;
      const y = (noise(i, 2, 0) * WORLD_HEIGHT + fall) % WORLD_HEIGHT;
      paint.setAlphaf(0.85 * fade);
      canvas.drawCircle(x, y, 2 + noise(i, 4, 0) * 2.5, paint);
    }
  }
  paint.setAlphaf(1);
}
