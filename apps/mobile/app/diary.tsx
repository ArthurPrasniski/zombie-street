import { localizedName } from '@/i18n/names';
import { useEffect, useState } from 'react';
import { comfortText } from '@/i18n/comfort';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTS, FRONTIER_WORLD, radioId } from '@/game/data/story';
import { WORLDS } from '@/game/data/worlds';
import { t as pt } from '@/i18n';
import { useProgressStore } from '@/state/progressStore';
import { AppText } from '@/ui/kit/AppText';
import { DiaryEntry } from '@/ui/radio/DiaryEntry';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';

const MOMENTS = ['intro', 'outro'] as const;

/** Diário (GDD seção 18.1): as mensagens de rádio por ato, para reler; as não ouvidas ficam fechadas. */
export default function DiaryScreen() {
  const heard = useProgressStore((s) => s.radioHeard);
  const [unread] = useState(() => heard.filter((id) => !useProgressStore.getState().diaryRead.includes(id)));
  useEffect(() => { useProgressStore.getState().readDiary(); }, []);
  // Os 3 atos e a chegada na Fronteira (só a abertura do primeiro planeta)
  const acts = [...ACTS, [FRONTIER_WORLD]];
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.diary.title} />
        <ScrollView contentContainerStyle={styles.list}>
          {acts.map((worlds, act) => (
            <View key={act} style={styles.act}>
              <AppText variant="heading" color={colors.yellow}>
                {pt.diary.acts[act]}
              </AppText>
              {worlds.flatMap((w) =>
                MOMENTS.map((moment) => {
                  const id = radioId(w, moment);
                  if (!id) return null;
                  const place = w < WORLDS.length ? localizedName(WORLDS[w].name) : pt.diary.acts[3];
                  const title = `${pt.radio.world(w + 1, place)} · ${moment === 'intro' ? pt.diary.intro : pt.diary.outro}`.toUpperCase();
                  return <DiaryEntry key={id} id={id} title={unread.includes(id) ? `${comfortText.new} · ${title}` : title} heard={heard.includes(id)} />;
                }),
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 20 },
  act: { gap: 10 },
});
