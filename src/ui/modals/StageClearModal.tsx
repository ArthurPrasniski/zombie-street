import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { stageLabel } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { CashLabel } from '@/ui/CashLabel';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { CountUp } from '@/ui/fx/CountUp';
import { DoubleCoinsButton } from '@/ui/modals/DoubleCoinsButton';
import { STAR_FIRST_MS, STAR_STEP_MS, StarRow } from '@/ui/StarRow';

import { colors } from '@/ui/theme';

// O dinheiro conta depois das estrelas.
const CASH_DELAY = STAR_FIRST_MS + 3 * STAR_STEP_MS;

interface Props {
  stage: number;
  cashEarned: number;
  stars: number;
  /** Bônus pago pelas estrelas novas (0 se não teve estrela nova). */
  starBonus: number;
  newStars: number;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onExit: () => void;
}

/** "Fase s vencida!" com as estrelas, o dinheiro da partida (já com o bônus de vitória) e o bônus das estrelas novas. */
export function StageClearModal({ stage, cashEarned, stars, starBonus, newStars, hasNext, onNext, onRetry, onExit }: Props) {
  return (
    <GameModal
      eyebrow={pt.stageClear.eyebrow}
      title={pt.stageClear.title(stageLabel(stage))}
      accent={colors.accent}
      buttons={
        <>
          <Button label={pt.stageClear.exit} variant="dark" onPress={onExit} />
          <Button label={pt.stageClear.retry} variant="dark" onPress={onRetry} />
          {hasNext && <Button label={pt.stageClear.next} chevron onPress={onNext} />}
        </>
      }>
      <StarRow stars={stars} size={48} arched animated />
      <AppText color={colors.textMuted}>{pt.stageClear.earned}</AppText>
      <CountUp amount={cashEarned} size={32} delay={CASH_DELAY} />
      <DoubleCoinsButton coins={cashEarned} />
      {starBonus > 0 && (
        <Animated.View style={styles.bonus} entering={FadeInDown.delay(CASH_DELAY + 800)}>
          <AppText variant="small" color={colors.yellow}>
            {pt.stageClear.starBonus(newStars)}
          </AppText>
          <CashLabel amount={starBonus} size={20} />
        </Animated.View>
      )}
    </GameModal>
  );
}

const styles = StyleSheet.create({
  bonus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
