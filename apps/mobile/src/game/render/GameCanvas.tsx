import { useMemo } from 'react';
import { Canvas, createPicture, Picture, Skia, useFont } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

import { useProgressStore } from '@/state/progressStore';
import { TRUCK_PAINTS } from '@/game/data/cosmetics';
import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';
import { combatScaleY } from '@/game/render/camera';
import type { DragPreview } from '@/game/render/camera';
import { drawWorld } from '@/game/render/drawWorld';
import { type UnitId, useSprites } from '@/game/render/sprites';
import type { RenderSnapshot, WorldId } from '@/game/types';
import { useSettingsStore } from '@/state/settingsStore';
import {combatViewportHeight} from './pixel16/production';

// Tamanho dos números de dano, em unidades do mundo.
const DAMAGE_FONT_SIZE = 22;

interface Props {
  snapshot: SharedValue<RenderSnapshot>;
  drag: SharedValue<DragPreview>;
  width: number;
  height?: number;
  world: WorldId;
  /** Unidades que podem aparecer na partida (sheets carregadas). */
  units: UnitId[];
  classic?:boolean;
}

/** Campo de batalha inteiro (mundo 600 x 900) na largura dada. */
export function GameCanvas({ snapshot, drag, width, height: sceneHeight, world, units,classic=false }: Props) {
  const height = sceneHeight ?? (width * (classic?WORLD_HEIGHT:combatViewportHeight(world))) / WORLD_WIDTH;
  const scale = width / WORLD_WIDTH;
  const scaleY = combatScaleY(width, height, classic ? WORLD_HEIGHT : combatViewportHeight(world));
  const sourceSprites = useSprites(world, units,classic);
  // Compensate sprite height only: world positions fit the map while characters keep their aspect.
  const sprites = useMemo(() => ({ ...sourceSprites, detailedUnits: sourceSprites.detailedUnits && Object.fromEntries(Object.entries(sourceSprites.detailedUnits).map(([id, sheet]) => [id, { ...sheet, renderScaleY: scale / scaleY }])) }), [sourceSprites, scale, scaleY]);
  const loadedFont = useFont(require('@/assets/fonts/Rubik-Black.ttf'), DAMAGE_FONT_SIZE);
  // Sem fonte, o render pula os números de dano (Ajustes)
  const damageNumbers = useSettingsStore((s) => s.damageNumbers);
  const font = damageNumbers ? loadedFont : null;

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const visualEffects = useSettingsStore((s) => s.visualEffects);
  const truck = useProgressStore((s) => s.truck);
  const paint = useProgressStore((s) => s.truckPaint);
  const appearance = { color: TRUCK_PAINTS[paint], ...truck };
  const picture = useDerivedValue(() => {
    const original = snapshot.get();
    const snap = { ...original, shake: reducedMotion ? 0 : original.shake, effects: visualEffects ? original.effects : original.effects.filter((e) => e.kind === 'corpse') };
    const preview = drag.get();
    return createPicture((canvas) => {
      canvas.scale(scale, scaleY);
      drawWorld(canvas, snap, { ...sprites, viewportHeight: Math.max(sprites.viewportHeight ?? WORLD_HEIGHT, height / scaleY) }, preview, font, appearance);
    }, Skia.XYWHRect(0, 0, width, height));
  }, [scale, scaleY, width, height, sprites, font, appearance, reducedMotion, visualEffects]);

  return (
    <Canvas style={{ width, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
