import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';
import type { CardId } from '@/game/types';

/** Carta sendo arrastada sobre o campo, em coordenadas do mundo. */
export interface DragPreview {
  active: boolean;
  card: CardId | null;
  x: number;
  y: number;
  valid: boolean;
}

export const NO_DRAG: DragPreview = { active: false, card: null, x: 0, y: 0, valid: false };

/** Fill the width; fit the requested map viewport, including the lower scenery. */
export const combatScaleY = (width: number, height: number, viewportHeight = WORLD_HEIGHT) => Math.min(width / WORLD_WIDTH, height / viewportHeight);
