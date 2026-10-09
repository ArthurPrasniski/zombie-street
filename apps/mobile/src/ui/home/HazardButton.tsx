import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, darkEdge, radius } from '@/ui/theme';

const STRIPES = 40;

/** Faixa de listras pretas e amarelas em diagonal (cavalete de obra). */
function Stripes() {
  return (
    <View style={styles.band}>
      {Array.from({ length: STRIPES }, (_, i) => (
        <View key={i} style={[styles.stripe, { left: i * 22 - 12 }]} />
      ))}
    </View>
  );
}

/** Botão principal da Home: amarelo, largo, com faixas de perigo em cima e embaixo. */
export function HazardButton({ label, detail, onPress }: { label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} ${detail}`}>
      {({ pressed }) => (
        <Chunky face={colors.yellow} edge={darkEdge(colors.yellow)} radius={radius.l} depth={7} pressed={pressed} gloss={0}>
          <Stripes />
          <View style={styles.content}>
            <AppText variant="display" style={styles.label}>
              {label}
            </AppText>
            <View style={styles.detail}>
              <AppText variant="label" color={colors.yellow} style={styles.detailText}>
                {detail}
              </AppText>
            </View>
            <AppText variant="display" style={styles.chevron}>
              ›
            </AppText>
          </View>
          <Stripes />
        </Chunky>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: { height: 10, overflow: 'hidden', backgroundColor: colors.yellow },
  stripe: { position: 'absolute', top: -10, width: 10, height: 30, backgroundColor: colors.outline, transform: [{ rotate: '40deg' }] },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14 },
  label: { fontSize: 34, lineHeight: 38 },
  detail: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.ink },
  detailText: { fontSize: 13, lineHeight: 16 },
  chevron: { fontSize: 40, lineHeight: 40 },
});
