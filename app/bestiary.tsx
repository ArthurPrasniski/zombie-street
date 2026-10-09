import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZOMBIES } from '@/game/data/zombies';
import type { ZombieId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { totalKills, zombieKills } from '@/state/bestiary';
import { useProgressStore } from '@/state/progressStore';
import { BESTIARY_ORDER, ZOMBIE_ART } from '@/ui/bestiary/zombieInfo';
import { ZombieSheet } from '@/ui/bestiary/ZombieSheet';
import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors, radius } from '@/ui/theme';
import { formatCash, formatInt } from '@/utils/format';

const PER_ROW = 3;
const GAP = 10;
const PADDING = 16;

/** Bestiário (GDD seção 17.7): todos os zumbis; os que ainda não apareceram ficam em silhueta. */
export default function BestiaryScreen() {
  const progress = useProgressStore();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState<ZombieId | null>(null);
  const tileW = Math.floor((width - PADDING * 2 - GAP * (PER_ROW - 1)) / PER_ROW);
  const found = BESTIARY_ORDER.filter((id) => progress.seen.includes(id)).length;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.bestiary.title} />
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.summary}>
            <AppText variant="eyebrow">{pt.bestiary.found(found, BESTIARY_ORDER.length)}</AppText>
            <AppText variant="small" color={colors.textMuted}>
              {pt.bestiary.totalKills(formatCash(totalKills(progress)))}
            </AppText>
          </View>
          <View style={styles.grid}>
            {BESTIARY_ORDER.map((id) => {
              const seen = progress.seen.includes(id);
              return (
                <Pressable key={id} disabled={!seen} onPress={() => setOpen(id)} accessibilityRole="button" accessibilityLabel={seen ? ZOMBIES[id].name : pt.bestiary.locked}>
                  {({ pressed }) => (
                    <Chunky face={seen ? colors.surfaceHigh : colors.surface} edge="#16131a" radius={radius.m} depth={4} pressed={pressed} gloss={0.05} style={{ width: tileW }} faceStyle={styles.tile}>
                      <Image source={ZOMBIE_ART[id]} style={[styles.art, !seen && styles.silhouette]} />
                      <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit style={styles.name} color={seen ? colors.white : colors.textMuted}>
                        {seen ? ZOMBIES[id].name : pt.bestiary.locked}
                      </AppText>
                      <AppText variant="small" color={ZOMBIES[id].isBoss ? colors.danger : colors.accent}>
                        {seen ? `× ${formatInt(zombieKills(progress, id))}` : ' '}
                      </AppText>
                    </Chunky>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
      {open && <ZombieSheet zombie={open} kills={zombieKills(progress, open)} onClose={() => setOpen(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  list: { paddingHorizontal: PADDING, paddingBottom: 24, gap: 12 },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  art: { width: 78, height: 78 },
  silhouette: { tintColor: '#0c0b0f', opacity: 0.85 },
  name: { fontSize: 14, lineHeight: 17, textAlign: 'center' },
});
