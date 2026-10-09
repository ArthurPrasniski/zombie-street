import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { rewardHaptic } from '@/audio/sfx';
import { MAX_STARS } from '@/game/data/balance';
import { ICONS } from '@/ui/icons';

// Estrelas da vitória: uma a uma, a primeira depois que o modal aparece.
export const STAR_FIRST_MS = 300;
export const STAR_STEP_MS = 280;

interface Props {
  stars: number;
  size: number;
  /** A do meio mais alta e maior, como no fim de partida do Clash. */
  arched?: boolean;
  /** Entram uma a uma pulando, com vibração nas conquistadas (GDD seção 17.10). */
  animated?: boolean;
}

/** As 3 estrelas da fase: cheias até `stars`, as outras apagadas. */
export function StarRow({ stars, size, arched = false, animated = false }: Props) {
  useEffect(() => {
    if (!animated) return;
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => rewardHaptic(i === stars - 1), STAR_FIRST_MS + i * STAR_STEP_MS + 150));
    return () => timers.forEach(clearTimeout);
  }, [animated, stars]);

  return (
    <View style={[styles.row, { gap: size * 0.08 }]} accessibilityLabel={`${stars}/${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const middle = arched && i === 1;
        const s = middle ? size * 1.25 : size;
        const image = <Image source={i < stars ? ICONS.star : ICONS.starEmpty} style={{ width: s, height: s }} />;
        const lift = { marginBottom: middle ? size * 0.35 : 0 };
        if (!animated) return <View key={i} style={lift}>{image}</View>;
        return (
          <Animated.View key={i} style={lift} entering={ZoomIn.delay(STAR_FIRST_MS + i * STAR_STEP_MS).springify().damping(8)}>
            {image}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
});
