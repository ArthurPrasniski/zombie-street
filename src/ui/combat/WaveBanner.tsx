import { StyleSheet, View } from 'react-native';

import { SURVIVAL_BOSS_EVERY } from '@/game/data/survival';
import { pt } from '@/i18n/pt';
import { useSessionStore } from '@/state/sessionStore';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

/** "Prepare-se / Onda n" no centro do campo entre as ondas ("Chefe chegando!" na onda do chefe). */
export function WaveBanner() {
  const { mode, wave, totalWaves } = useSessionStore();
  const survival = mode === 'survival';
  const boss = survival ? wave % SURVIVAL_BOSS_EVERY === 0 : wave === totalWaves;
  return (
    <View style={styles.banner} pointerEvents="none">
      <View style={styles.card}>
        <AppText variant="eyebrow" color={boss ? colors.danger : colors.accent}>
          {boss ? pt.combat.bossWave : pt.combat.get}
        </AppText>
        <AppText variant="display">{survival ? pt.survival.waveBanner(wave) : pt.combat.waveBanner(wave, totalWaves)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', gap: 2, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24, backgroundColor: colors.veil },
});
