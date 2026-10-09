import { Image, StyleSheet, View } from 'react-native';

import { localStage, stageLabel, STAGES_PER_WORLD } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { useProgressStore } from '@/state/progressStore';
import { StarRow } from '@/ui/StarRow';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Card } from '@/ui/kit/Card';
import { colors } from '@/ui/theme';

/** Fase na grade: vencida (verde-petróleo, check e estrelas), nova (laranja), atual (borda verde-limão), bloqueada (cadeado). */
export function StageTile({ stage, onPress }: { stage: number; onPress: () => void }) {
  const highestCleared = useProgressStore((s) => s.highestCleared);
  const stars = useProgressStore((s) => s.stars[stage - 1] ?? 0);
  const currentStage = useProgressStore((s) => s.currentStage);
  const cleared = stage <= highestCleared;
  const locked = stage > highestCleared + 1;
  const current = stage === currentStage && !locked;
  const label = current ? pt.stages.current : cleared ? pt.stages.cleared : locked ? pt.stages.locked : pt.stages.available;
  const color = locked ? colors.surface : cleared ? colors.teal : colors.featured;

  return (
    <View style={styles.wrap} accessibilityLabel={`${pt.stages.stage(stageLabel(stage))}, ${label}`}>
      <Card color={color} border={current ? colors.accent : undefined} watermark={`${localStage(stage)}`} onPress={locked ? undefined : onPress} containerStyle={styles.wrap} style={styles.tile} padding={16}>
        <AppText variant="eyebrow" color={locked ? colors.textMuted : cleared ? colors.accent : 'rgba(255, 255, 255, 0.8)'}>
          {pt.stages.tileLabel}
        </AppText>
        <AppText variant="display" color={locked ? colors.textMuted : colors.white} style={styles.number}>
          {`${localStage(stage)}`}
        </AppText>
        {cleared && (
          <View style={styles.stars}>
            <StarRow stars={stars} size={20} />
          </View>
        )}
        <View style={styles.status}>
          {(cleared || locked) && <Image source={cleared ? ICONS.check : ICONS.lock} style={styles.icon} />}
          {localStage(stage) === STAGES_PER_WORLD && !cleared && !locked && <Image source={ICONS.skull} style={styles.icon} />}
          <AppText variant="small" color={current ? colors.accent : locked ? colors.textMuted : colors.white} style={styles.caps}>
            {label.toUpperCase()}
          </AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tile: { flex: 1, minHeight: 90, borderRadius: 24 },
  number: { fontSize: 38, lineHeight: 42, marginTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' },
  icon: { width: 18, height: 18 },
  stars: { position: 'absolute', top: 14, right: 14 },
  caps: { letterSpacing: 1.5 },
});
