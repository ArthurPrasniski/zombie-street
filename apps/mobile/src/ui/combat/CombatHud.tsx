import { Pressable, StyleSheet, View } from 'react-native';

import { SURVIVAL_BOSS_EVERY } from '@/game/data/survival';
import { stageLabel } from '@/game/data/worlds';
import { t as pt } from '@/i18n';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { IconButton } from '@/ui/kit/Pill';
import { colors } from '@/ui/theme';

interface Props {
  onSpeed?: (speed: 1 | 2) => void;
  onBack: () => void;
  onTogglePause: () => void;
}

/** Compact toolbar in the card tray: no controls cover the combat field. */
export function CombatHud({ onBack, onTogglePause, onSpeed }: Props) {
  const speed = useSettingsStore((s) => s.speed);
  const { mode, stage, wave, totalWaves, killed, total, paused } = useSessionStore();
  const progress = total > 0 ? Math.min(1, killed / total) : 0;
  const survival = mode === 'survival';
  const segments = survival ? SURVIVAL_BOSS_EVERY : totalWaves;
  const current = survival ? ((wave - 1) % SURVIVAL_BOSS_EVERY) + 1 : wave;
  const label = survival ? pt.survival.hud(wave) : pt.combat.stageWave(stageLabel(stage), wave, totalWaves);
  const changeSpeed = () => {
    const next = speed === 1 ? 2 : 1;
    useSettingsStore.getState().setSpeed(next);
    onSpeed?.(next);
  };
  return (
    <View style={styles.row}>
      <IconButton icon={ICONS.back} label={pt.common.back} onPress={onBack} size={44} />
      <View style={styles.status} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round((current - 1 + progress) / Math.max(1, segments) * 100) }}>
        <AppText variant="small" numberOfLines={2} style={styles.text}>{label}</AppText>
        <View style={styles.segments}>
          {Array.from({ length: segments }, (_, i) => {
            const fill = i < current - 1 ? 1 : i === current - 1 ? progress : 0;
            return <View key={i} style={[styles.segment, i === segments - 1 && styles.boss]}><View style={[styles.fill, { width: `${fill * 100}%` }]} /></View>;
          })}
        </View>
      </View>
      <Pressable onPress={changeSpeed} accessibilityRole="button" accessibilityLabel={pt.combat.speed} accessibilityValue={{ text: `${speed}×` }}>
        {({ pressed }) => <Chunky face={colors.surfaceHigh} edge={colors.background} depth={4} pressed={pressed} gloss={0.12}>
          <View style={styles.speed}><AppText variant="label">{`${speed}×`}</AppText></View>
        </Chunky>}
      </Pressable>
      <IconButton icon={paused ? ICONS.play : ICONS.pause} label={paused ? pt.combat.resume : pt.combat.pause} onPress={onTogglePause} size={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  status: { flex: 1, minWidth: 0, gap: 4, paddingHorizontal: 2 },
  text: { fontSize: 11, lineHeight: 14, color: colors.textMuted },
  speed: { width: 38, height: 34, alignItems: 'center', justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 4, backgroundColor: 'rgba(0, 0, 0, 0.35)', overflow: 'hidden' },
  boss: { backgroundColor: 'rgba(255, 79, 79, 0.45)' },
  fill: { height: '100%', backgroundColor: colors.accent },
});
