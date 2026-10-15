import { Image, StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { BLOOD } from '@/game/data/constants';
import type { RenderSnapshot } from '@/game/types';
import { t } from '@/i18n';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

const SEGMENTS = Array.from({ length: BLOOD.max }, (_, i) => i);
const BAG_WIDTH = 40;
const COUNT_WIDTH = 54;
const GAP = 8;
const BORDER = 2;

/** Bounded pixel widths make full capacity equal the track's exact inner width. */
export function bloodFillPixels(value: number, width: number) {
  'worklet';
  const amount = Number.isFinite(value) ? Math.max(0, Math.min(BLOOD.max, value)) : 0;
  return Math.max(0, width) * amount / BLOOD.max;
}

export function BloodBar({ snapshot, blood, width }: { snapshot: SharedValue<RenderSnapshot>; blood: number; width: number }) {
  const rowWidth = width + 28;
  const trackWidth = Math.max(0, rowWidth - BAG_WIDTH - COUNT_WIDTH - GAP * 2);
  const innerWidth = Math.max(0, trackWidth - BORDER * 2);
  const count = Number.isFinite(blood) ? Math.max(0, Math.min(BLOOD.max, Math.floor(blood))) : 0;
  const fill = useAnimatedStyle(() => ({ width: bloodFillPixels(snapshot.get().blood, innerWidth) }), [innerWidth]);
  return (
    <View style={[styles.row, { width: rowWidth }]} accessible accessibilityRole="progressbar" accessibilityLabel={t.cards.blood} accessibilityValue={{ min: 0, max: BLOOD.max, now: count }}>
      <Image source={ICONS.bloodBag} resizeMode="contain" style={styles.bag} />
      <View testID="blood-track" style={[styles.track, { width: trackWidth }]}>
        <Animated.View testID="blood-fill" style={[styles.fill, fill]}><View style={styles.shine} /></Animated.View>
        <View style={styles.cells} pointerEvents="none">
          {SEGMENTS.map(i => <View key={i} style={[styles.cell, i === BLOOD.max - 1 && styles.lastCell]} />)}
        </View>
      </View>
      <AppText variant="number" numberOfLines={1} adjustsFontSizeToFit style={styles.value}>{`${count}/${BLOOD.max}`}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 46, flexDirection: 'row', alignItems: 'center', gap: GAP },
  bag: { width: BAG_WIDTH, height: 46 },
  track: { height: 24, borderWidth: BORDER, borderColor: colors.outline, backgroundColor: '#3d2026', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#b94f59', borderBottomWidth: 4, borderBottomColor: '#9a1424' },
  shine: { position: 'absolute', left: 3, right: 3, top: 3, height: 2, backgroundColor: '#ffffff55' },
  cells: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  cell: { flex: 1, borderRightWidth: 2, borderRightColor: colors.outline },
  lastCell: { borderRightWidth: 0 },
  value: { width: COUNT_WIDTH, fontSize: 17, lineHeight: 22, textAlign: 'right' },
});
