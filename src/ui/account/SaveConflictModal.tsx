import { StyleSheet, View } from 'react-native';

import { stageLabel } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { resolveConflict } from '@/services/cloudSave';
import { migrateProgress } from '@/state/migrate';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors, radius } from '@/ui/theme';
import { formatCash } from '@/utils/format';

/** Os dois lados mudaram: mostra o resumo de cada progresso e o jogador escolhe qual fica. */
export function SaveConflictModal() {
  const conflict = useAccountStore((s) => s.conflict);
  const device = useProgressStore();
  if (!conflict) return null;
  const cloud = migrateProgress(conflict.data, conflict.version);
  const summary = (p: { highestCleared: number; cash: number }) => pt.conflict.summary(stageLabel(p.highestCleared + 1), formatCash(p.cash));
  return (
    <GameModal
      title={pt.conflict.title}
      accent={colors.yellow}
      buttons={
        <>
          <Button label={pt.conflict.useDevice} variant="dark" onPress={() => resolveConflict('device')} />
          <Button label={pt.conflict.useCloud} onPress={() => resolveConflict('cloud')} />
        </>
      }>
      <AppText color={colors.textMuted} style={styles.center}>
        {pt.conflict.body}
      </AppText>
      <View style={styles.row}>
        {[
          [pt.conflict.cloud, summary(cloud)],
          [pt.conflict.device, summary(device)],
        ].map(([title, text]) => (
          <View key={title} style={styles.box}>
            <AppText variant="eyebrow">{title}</AppText>
            <AppText variant="label" style={styles.center}>
              {text}
            </AppText>
          </View>
        ))}
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  box: { flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: radius.m, backgroundColor: colors.background },
});
