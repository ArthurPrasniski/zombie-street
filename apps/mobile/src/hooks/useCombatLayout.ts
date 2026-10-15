import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { combatScaleY } from '@/game/render/camera';

const MIN_STRIP = 150;
const MAX_CARD = 84;
const NEXT_CARD = 0.62;
export const HAND_GAP = 8;

/** Full-bleed scene; the hand owns the bottom safe area, HUD owns the top inset. */
export function calculateCombatLayout(width: number, height: number, bottomInset: number) {
 const stripH = MIN_STRIP + bottomInset;
 const sceneH = Math.max(1, height - stripH);
 const byWidth = (width - 24 - HAND_GAP * 5) / (4 + NEXT_CARD);
 const cardWidth = Math.floor(Math.min(MAX_CARD, byWidth, (MIN_STRIP - 44) / 1.3));
 return { sceneW: width, sceneH, stripH, cardWidth, scaleY: combatScaleY(width, sceneH) };
}

export function useCombatLayout() {
 const insets = useSafeAreaInsets();
 const { width, height } = useWindowDimensions();
 return { insets, ...calculateCombatLayout(width, height, insets.bottom) };
}
