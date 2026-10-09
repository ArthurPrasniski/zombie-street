import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { pt } from '@/i18n/pt';
import { useAdStore } from '@/services/ads';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { colors } from '@/ui/theme';

// Duração da propaganda de teste.
const FAKE_SECONDS = 3;

/** Propaganda de teste do Expo Go (no build do jogo, o vídeo do AdMob ocupa a tela). */
export function FakeAdOverlay() {
  const fake = useAdStore((s) => s.fake);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!fake) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [fake]);
  if (!fake) return null;
  const left = Math.min(FAKE_SECONDS, Math.max(0, Math.ceil((fake.startedAt + FAKE_SECONDS * 1000 - now) / 1000)));
  const close = (rewarded: boolean) => {
    useAdStore.setState({ fake: null });
    fake.resolve(rewarded);
  };
  return (
    <Animated.View entering={FadeIn} style={styles.overlay}>
      <Image source={ICONS.tv} style={styles.tv} />
      <AppText variant="title">{pt.ads.fakeTitle}</AppText>
      <AppText color={colors.textMuted} style={styles.center}>
        {pt.ads.fakeBody}
      </AppText>
      <View style={styles.buttons}>
        {left > 0 ? (
          <AppText variant="display">{`${left}`}</AppText>
        ) : (
          <Button label={pt.ads.fakeDone} chevron onPress={() => close(true)} />
        )}
        <Button label={pt.ads.fakeSkip} variant="dark" size="s" onPress={() => close(false)} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: '#0c0b0f', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, zIndex: 100 },
  tv: { width: 120, height: 120 },
  center: { textAlign: 'center' },
  buttons: { alignItems: 'center', gap: 12, marginTop: 12 },
});
