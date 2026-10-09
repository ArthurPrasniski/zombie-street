import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import type { CombatResult } from '@/hooks/useCombatEvents';
import { pt } from '@/i18n/pt';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { StageClearModal } from '@/ui/modals/StageClearModal';
import { StageFailedModal } from '@/ui/modals/StageFailedModal';
import { SurvivalOverModal } from '@/ui/modals/SurvivalOverModal';
import { RadioModal } from '@/ui/radio/RadioModal';
import { colors } from '@/ui/theme';

interface Props {
  result: CombatResult;
  /** Mensagem de rádio na frente de tudo (abertura do mundo ou fechamento depois do chefe). */
  radio: { id: string; place: string } | null;
  onRadioClose: () => void;
  paused: boolean;
  confirmExit: boolean;
  onResume: () => void;
  onStay: () => void;
  onRetry: () => void;
  onNext: () => void;
}

/** Modais do combate: rádio, pausa, confirmação de saída e o fim da partida. */
export function CombatModals({ result, radio, onRadioClose, paused, confirmExit, onResume, onStay, onRetry, onNext }: Props) {
  const back = () => router.back();
  if (radio) return <RadioModal key={radio.id} id={radio.id} place={radio.place} onClose={onRadioClose} />;
  if (result?.kind === 'cleared') {
    return (
      <StageClearModal
        stage={result.stage}
        cashEarned={result.cash}
        stars={result.stars}
        starBonus={result.bonus}
        newStars={result.newStars}
        hasNext
        onNext={onNext}
        onRetry={onRetry}
      />
    );
  }
  if (result?.kind === 'failed') return <StageFailedModal cashEarned={result.cash} onRetry={onRetry} onStages={back} />;
  if (result?.kind === 'survival') {
    return <SurvivalOverModal waves={result.waves} best={result.best} record={result.record} cashEarned={result.cash} onRetry={onRetry} onExit={back} />;
  }
  if (confirmExit) {
    return (
      <GameModal
        title={pt.combat.exitTitle}
        accent={colors.danger}
        buttons={
          <>
            <Button label={pt.combat.exit} variant="dark" onPress={back} />
            <Button label={pt.combat.stay} onPress={onStay} />
          </>
        }>
        <AppText color={colors.textMuted} style={styles.center}>
          {pt.combat.exitBody}
        </AppText>
      </GameModal>
    );
  }
  if (paused) return <GameModal title={pt.combat.paused} buttons={<Button label={pt.combat.resume} chevron onPress={onResume} />} />;
  return null;
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
