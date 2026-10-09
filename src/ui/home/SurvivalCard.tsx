import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { SURVIVAL_UNLOCK } from '@/game/data/survival';
import { stageLabel } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { isDeckComplete } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Card } from '@/ui/kit/Card';
import { colors, radius } from '@/ui/theme';

/** Atalho largo da Sobrevivência (GDD seção 17.9): recorde, ou o que falta para liberar. */
export function SurvivalCard() {
  const highestCleared = useProgressStore((s) => s.highestCleared);
  const best = useProgressStore((s) => s.survivalBest);
  const unlocked = highestCleared >= SURVIVAL_UNLOCK;
  const play = () => {
    if (!isDeckComplete(useProgressStore.getState())) {
      router.push('/deck');
      return;
    }
    router.push({ pathname: '/combat', params: { mode: 'survival' } });
  };
  return (
    <Card color={unlocked ? colors.featured : colors.surface} style={styles.card} padding={14} onPress={unlocked ? play : undefined} watermark={unlocked && best > 0 ? `${best}` : undefined}>
      <View style={styles.row}>
        <Image source={unlocked ? ICONS.hourglass : ICONS.lock} style={styles.icon} />
        <View style={styles.texts}>
          <AppText variant="title" color={unlocked ? colors.white : colors.textMuted} style={styles.title}>
            {pt.survival.title.toUpperCase()}
          </AppText>
          <AppText variant="small" color={unlocked ? '#ffe2d6' : colors.textMuted}>
            {(unlocked ? pt.survival.subtitle(best) : pt.survival.locked(stageLabel(SURVIVAL_UNLOCK))).toUpperCase()}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.l },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 52, height: 52 },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 24, lineHeight: 28 },
});
