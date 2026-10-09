import { Canvas, createPicture, Picture, Skia, useFont } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';
import type { DragPreview } from '@/game/render/camera';
import { drawWorld } from '@/game/render/drawWorld';
import { type UnitId, useSprites } from '@/game/render/sprites';
import type { RenderSnapshot, WorldId } from '@/game/types';
import { useSettingsStore } from '@/state/settingsStore';

// Tamanho dos números de dano, em unidades do mundo.
const DAMAGE_FONT_SIZE = 22;

interface Props {
  snapshot: SharedValue<RenderSnapshot>;
  drag: SharedValue<DragPreview>;
  width: number;
  world: WorldId;
  /** Unidades que podem aparecer na partida (sheets carregadas). */
  units: UnitId[];
}

/** Campo de batalha inteiro (mundo 600 x 900) na largura dada. */
export function GameCanvas({ snapshot, drag, width, world, units }: Props) {
  const height = (width * WORLD_HEIGHT) / WORLD_WIDTH;
  const scale = width / WORLD_WIDTH;
  const sprites = useSprites(world, units);
  const loadedFont = useFont(require('@/assets/fonts/Rubik-Black.ttf'), DAMAGE_FONT_SIZE);
  // Sem fonte, o render pula os números de dano (Ajustes)
  const damageNumbers = useSettingsStore((s) => s.damageNumbers);
  const font = damageNumbers ? loadedFont : null;

  const picture = useDerivedValue(() => {
    const snap = snapshot.get();
    const preview = drag.get();
    return createPicture((canvas) => {
      canvas.scale(scale, scale);
      drawWorld(canvas, snap, sprites, preview, font);
    }, Skia.XYWHRect(0, 0, width, height));
  }, [scale, width, height, sprites, font]);

  return (
    <Canvas style={{ width, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
