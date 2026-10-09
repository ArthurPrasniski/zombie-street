import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WORLD_HEIGHT, WORLD_WIDTH } from '@/game/data/constants';

// Altura mínima da faixa de baixo (mão de cartas + sangue).
const MIN_STRIP = 150;
const MAX_CARD = 84;
const NEXT_CARD = 0.62;
export const HAND_GAP = 8;
const SCENE_RATIO = WORLD_HEIGHT / WORLD_WIDTH;

/**
 * Tamanhos do combate: o campo inteiro em cima, na largura da tela (em telas baixas, encolhe), e a
 * faixa de baixo com 4 cartas + a próxima (menor) cabendo na largura e na altura que sobra.
 */
export function useCombatLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const usableH = height - insets.top - insets.bottom;
  let sceneW = width;
  let sceneH = sceneW * SCENE_RATIO;
  if (usableH - sceneH < MIN_STRIP) {
    sceneH = usableH - MIN_STRIP;
    sceneW = sceneH / SCENE_RATIO;
  }
  const stripH = usableH - sceneH;
  const byWidth = (width - 24 - HAND_GAP * 5) / (4 + NEXT_CARD);
  const cardWidth = Math.floor(Math.min(MAX_CARD, byWidth, (stripH - 44) / 1.3));
  return { insets, sceneW, sceneH, stripH, cardWidth };
}
