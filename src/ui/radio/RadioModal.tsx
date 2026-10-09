import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { pt } from '@/i18n/pt';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { RADIO_ART, SPEAKER_COLORS } from '@/ui/radio/radioArt';
import { colors, radius } from '@/ui/theme';

interface Props {
  id: string;
  /** Rótulo de onde vem a mensagem (ex.: "Mundo 6 · Cidade Tecnológica"). */
  place: string;
  onClose: () => void;
}

/**
 * Mensagem de rádio (GDD seção 18.1): caixa de diálogo embaixo, com o retrato e o nome de quem
 * fala e uma fala por vez. Tocar na caixa ou em Continuar passa para a próxima.
 */
export function RadioModal({ id, place, onClose }: Props) {
  const lines = pt.radio.messages[id] ?? [];
  const [index, setIndex] = useState(0);
  const line = lines[index];
  if (!line) return null;
  const last = index >= lines.length - 1;
  const advance = () => (last ? onClose() : setIndex((i) => i + 1));
  const color = SPEAKER_COLORS[line.speaker];

  return (
    <View style={styles.backdrop}>
      <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.wrap}>
        <Pressable onPress={advance} accessibilityRole="button" accessibilityLabel={line.text}>
          <Chunky face={colors.surface} edge="#100e14" radius={radius.xl} depth={7} gloss={0.05} faceStyle={styles.panel}>
            <AppText variant="eyebrow" color={colors.textMuted}>
              {`${pt.radio.title} · ${place}`.toUpperCase()}
            </AppText>
            <View style={styles.row}>
              <View style={[styles.screen, { borderColor: color }]}>
                <Animated.View key={`${index}-${line.speaker}`} entering={FadeIn.duration(180)}>
                  <Image source={RADIO_ART[line.speaker]} style={styles.portrait} />
                </Animated.View>
              </View>
              <View style={styles.texts}>
                <AppText variant="heading" color={color}>
                  {pt.radio.speakers[line.speaker]}
                </AppText>
                <Animated.View key={index} entering={FadeIn.duration(220)}>
                  <AppText style={styles.text}>{line.text}</AppText>
                </Animated.View>
              </View>
            </View>
            <View style={styles.footer}>
              <View style={styles.dots}>
                {lines.map((_, i) => (
                  <View key={i} style={[styles.dot, i <= index && { backgroundColor: color }]} />
                ))}
              </View>
              <Button label={last ? pt.radio.close : pt.radio.next} chevron={!last} size="s" onPress={advance} />
            </View>
          </Chunky>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 9, 12, 0.6)', justifyContent: 'flex-end', padding: 14, paddingBottom: 40 },
  wrap: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  panel: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  screen: { width: 84, height: 84, borderRadius: 18, borderWidth: 3, backgroundColor: '#1d3a2e', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  portrait: { width: 84, height: 84 },
  texts: { flex: 1, gap: 4 },
  text: { fontSize: 16, lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: colors.outline, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
});
