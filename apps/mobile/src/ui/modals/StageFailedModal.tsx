import { pt } from '@/i18n/pt';
import { CashLabel } from '@/ui/CashLabel';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { DoubleCoinsButton } from '@/ui/modals/DoubleCoinsButton';
import { GameModal } from '@/ui/modals/GameModal';
import { colors } from '@/ui/theme';

interface Props {
  cashEarned: number;
  onRetry: () => void;
  onExit: () => void;
}

/** Derrota: a base caiu. O dinheiro dos zumbis mortos fica (GDD seção 9). */
export function StageFailedModal({ cashEarned, onRetry, onExit }: Props) {
  return (
    <GameModal
      eyebrow={pt.stageFailed.eyebrow}
      title={pt.stageFailed.title}
      accent={colors.danger}
      buttons={
        <>
          <Button label={pt.stageFailed.exit} variant="dark" onPress={onExit} />
          <Button label={pt.stageFailed.retry} chevron onPress={onRetry} />
        </>
      }>
      <AppText color={colors.textMuted}>{pt.stageFailed.earned}</AppText>
      <CashLabel amount={cashEarned} size={32} />
      <DoubleCoinsButton coins={cashEarned} />
    </GameModal>
  );
}
