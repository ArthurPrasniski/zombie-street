import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { rewardHaptic } from '@/audio/sfx';
import { pt } from '@/i18n/pt';
import { CountUp } from '@/ui/fx/CountUp';
import { DoubleCoinsButton } from '@/ui/modals/DoubleCoinsButton';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors } from '@/ui/theme';

// O carimbo de recorde bate um pouco depois do modal aparecer.
const STAMP_MS = 450;

interface Props {
  waves: number;
  best: number;
  record: boolean;
  cashEarned: number;
  onRetry: () => void;
  onExit: () => void;
}

/** Fim da Sobrevivência: ondas vencidas, recorde e o dinheiro ganho (GDD seção 17.9). */
export function SurvivalOverModal({ waves, best, record, cashEarned, onRetry, onExit }: Props) {
  useEffect(() => {
    if (!record) return;
    const timer = setTimeout(() => rewardHaptic(true), STAMP_MS);
    return () => clearTimeout(timer);
  }, [record]);
  return (
    <GameModal
      eyebrow={pt.survival.overEyebrow}
      title={pt.survival.overTitle}
      accent={colors.featured}
      buttons={
        <>
          <Button label={pt.survival.exit} variant="dark" onPress={onExit} />
          <Button label={pt.survival.again} chevron onPress={onRetry} />
        </>
      }>
      <AppText variant="title">{pt.survival.reached(waves)}</AppText>
      {record ? (
        <Animated.View entering={ZoomIn.delay(STAMP_MS).springify().damping(7)} style={styles.stamp}>
          <AppText variant="heading" color={colors.yellow}>
            {pt.survival.newRecord.toUpperCase()}
          </AppText>
        </Animated.View>
      ) : (
        <AppText variant="label" color={colors.textMuted}>
          {pt.survival.record(best)}
        </AppText>
      )}
      <AppText color={colors.textMuted}>{pt.survival.earned}</AppText>
      <CountUp amount={cashEarned} size={32} delay={STAMP_MS + 300} />
      <DoubleCoinsButton coins={cashEarned} />
    </GameModal>
  );
}

const styles = StyleSheet.create({
  stamp: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 10, borderWidth: 3, borderColor: colors.yellow, transform: [{ rotate: '-6deg' }] },
});
