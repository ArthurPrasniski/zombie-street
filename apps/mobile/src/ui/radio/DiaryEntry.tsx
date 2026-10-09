import { Image, StyleSheet, View } from 'react-native';

import { pt } from '@/i18n/pt';
import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { RADIO_ART, SPEAKER_COLORS } from '@/ui/radio/radioArt';
import { colors, radius } from '@/ui/theme';

/** Uma mensagem no Diário: onde e quando tocou e as falas (ou "ainda não ouvida"). */
export function DiaryEntry({ id, title, heard }: { id: string; title: string; heard: boolean }) {
  const lines = pt.radio.messages[id] ?? [];
  return (
    <Chunky face={heard ? colors.surfaceHigh : colors.surface} edge="#16131a" radius={radius.m} depth={4} gloss={0.04} faceStyle={styles.card}>
      <AppText variant="eyebrow" color={heard ? colors.accent : colors.textMuted}>
        {title}
      </AppText>
      {heard ? (
        lines.map((line, i) => (
          <View key={i} style={styles.line}>
            <Image source={RADIO_ART[line.speaker]} style={styles.portrait} />
            <View style={styles.texts}>
              <AppText variant="label" color={SPEAKER_COLORS[line.speaker]} style={styles.name}>
                {pt.radio.speakers[line.speaker]}
              </AppText>
              <AppText variant="small" color={colors.text}>
                {line.text}
              </AppText>
            </View>
          </View>
        ))
      ) : (
        <AppText variant="small" color={colors.textMuted}>
          {pt.diary.locked}
        </AppText>
      )}
    </Chunky>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 8 },
  line: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  portrait: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d3a2e' },
  texts: { flex: 1, gap: 1 },
  name: { fontSize: 14, lineHeight: 17 },
});
