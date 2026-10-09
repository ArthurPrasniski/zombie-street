import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ptPush } from '@/i18n/ptPush';
import { type PushPermission, pushPermission, requestPushPermission } from '@/services/push/notifications';
import { syncPushToken } from '@/services/push/remote';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors } from '@/ui/theme';

/**
 * Pergunta (uma vez, na Home, depois da primeira vitória) se o jogador quer avisos, antes do
 * pedido do sistema: quem diz "agora não" ainda pode ativar em Ajustes.
 */
export function PushPrompt() {
  const cleared = useProgressStore((s) => s.highestCleared);
  const asked = useSettingsStore((s) => s.pushAsked);
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const due = cleared >= 1 && !asked;

  useEffect(() => {
    if (due) pushPermission().then(setPermission, () => setPermission('denied'));
  }, [due]);

  if (!due || permission !== 'undetermined') return null;

  const answer = async (wants: boolean) => {
    useSettingsStore.getState().markPushAsked();
    if (wants && (await requestPushPermission())) syncPushToken().catch(() => null);
  };

  return (
    <GameModal
      title={ptPush.prompt.title}
      eyebrow="📻"
      buttons={
        <>
          <Button label={ptPush.prompt.no} variant="dark" onPress={() => answer(false)} />
          <Button label={ptPush.prompt.yes} onPress={() => answer(true)} />
        </>
      }>
      <AppText color={colors.textMuted} style={styles.body}>
        {ptPush.prompt.body}
      </AppText>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  body: { textAlign: 'center' },
});
