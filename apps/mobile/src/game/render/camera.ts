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

/** Fill the width; compact screens compress height enough to retain the whole arena. */
export const combatScaleY = (width: number, height: number) => Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
