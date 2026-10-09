import { Image, StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { BLOOD } from '@/game/data/constants';
import type { RenderSnapshot } from '@/game/types';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

const SEGMENTS = Array.from({ length: BLOOD.max }, (_, i) => i);
const DROP = 46;

/**
 * Barra de sangue estilo Clash: trilho em relevo com 10 segmentos, enchimento vermelho com
 * brilho (suave, pelo snapshot no thread de UI) e uma gota grande com o valor inteiro.
 */
export function BloodBar({ snapshot, blood, width }: { snapshot: SharedValue<RenderSnapshot>; blood: number; width: number }) {
  const fill = useAnimatedStyle(() => ({ width: `${(snapshot.get().blood / BLOOD.max) * 100}%` }));
  return (
    <View style={[styles.row, { width: width + DROP * 0.6 }]}>
      <View style={styles.track}>
        {/* A parte do trilho sob a gota não conta: o enchimento e os segmentos começam depois dela */}
        <View style={styles.area}>
          <Animated.View style={[styles.fill, fill]}>
            <View style={styles.shine} />
          </Animated.View>
          <View style={styles.cells} pointerEvents="none">
            {SEGMENTS.map((i) => (
              <View key={i} style={styles.cell} />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.badge}>
        <Image source={ICONS.blood} style={styles.drop} />
        <AppText variant="number" style={styles.value}>
          {`${blood}`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: DROP, justifyContent: 'center' },
  track: { marginLeft: DROP * 0.55, height: 26, borderRadius: 13, backgroundColor: '#3d2026', borderWidth: 3, borderColor: colors.outline, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#e8323f', borderBottomWidth: 5, borderBottomColor: '#9a1424' },
  shine: { position: 'absolute', left: 4, right: 4, top: 3, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  area: { position: 'absolute', left: DROP * 0.45, right: 0, top: 0, bottom: 0 },
  cells: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  cell: { flex: 1, borderRightWidth: 3, borderRightColor: colors.outline },
  badge: { position: 'absolute', left: 0, width: DROP, height: DROP, alignItems: 'center' },
  drop: { width: DROP, height: DROP },
  value: { position: 'absolute', top: DROP * 0.3, fontSize: 20, lineHeight: 24 },
});
