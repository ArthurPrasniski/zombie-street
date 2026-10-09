import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import type { ScenarioEventId } from '@/game/data/events';
import { pt } from '@/i18n/pt';
import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors } from '@/ui/theme';

/** Aviso do evento de cenário no alto do campo (GDD seção 17.5). */
export function EventBanner({ kind }: { kind: ScenarioEventId }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(250)}>
        <Chunky face={colors.featured} edge="#8a2e14" radius={16} depth={5} gloss={0.25} faceStyle={styles.face}>
          <AppText variant="heading">{pt.events.title[kind]}</AppText>
          <AppText variant="small" color="#ffe2d6">
            {pt.events.hint[kind]}
          </AppText>
        </Chunky>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 76, left: 0, right: 0, alignItems: 'center' },
  face: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 18, gap: 2 },
});
