import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { combatScaleY } from '@/game/render/camera';

const MAX_CARD = 76;
const NEXT_CARD = 0.62;
export const COMBAT_HUD_HEIGHT = 44;
export const HAND_GAP = 8;
export const TRAY_GAP = 12;
export const TRAY_TOP = 14;
export const TRAY_BOTTOM = 10;
export const COMBAT_VIEWPORT_HEIGHT = 1150;

/** Reserve measured content plus breathing room; keep the complete background visible. */
export function calculateCombatLayout(width: number, height: number, bottomInset: number) {
 const byWidth = (width - 24 - HAND_GAP * 5) / (4 + NEXT_CARD);
 const cardWidth = Math.floor(Math.min(MAX_CARD, byWidth));
 const stripH = TRAY_TOP + COMBAT_HUD_HEIGHT + TRAY_GAP * 2 + Math.round(cardWidth * 1.32) + 46 + TRAY_BOTTOM + 1 + bottomInset;
 const sceneH = Math.max(1, height - stripH);
 return { sceneW: width, sceneH, stripH, cardWidth, scaleY: combatScaleY(width, sceneH, COMBAT_VIEWPORT_HEIGHT) };
}

export function useCombatLayout() {
 const insets = useSafeAreaInsets();
 const { width, height } = useWindowDimensions();
 return { insets, ...calculateCombatLayout(width, height, insets.bottom) };
}
