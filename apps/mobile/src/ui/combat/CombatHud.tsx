import { StyleSheet, View } from 'react-native';

import { SURVIVAL_BOSS_EVERY } from '@/game/data/survival';
import { stageLabel } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { useSessionStore } from '@/state/sessionStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { IconButton } from '@/ui/kit/Pill';
import { colors } from '@/ui/theme';

interface Props {
  onBack: () => void;
  onTogglePause: () => void;
}

/** Topo do combate: voltar, pausa e "Fase s · Onda n/5" (ou a onda da Sobrevivência) com segmentos. A vida da base fica no campo. */
export function CombatHud({ onBack, onTogglePause }: Props) {
  const { mode, stage, wave, totalWaves, killed, total, paused, fps } = useSessionStore();
  const progress = total > 0 ? Math.min(1, killed / total) : 0;
  // Sobrevivência: os segmentos mostram o bloco de 5 ondas, com o chefe no último
  const survival = mode === 'survival';
  const segments = survival ? SURVIVAL_BOSS_EVERY : totalWaves;
  const current = survival ? ((wave - 1) % SURVIVAL_BOSS_EVERY) + 1 : wave;
  return (
    <View style={styles.row} pointerEvents="box-none">
      <IconButton icon={ICONS.back} label={pt.common.back} onPress={onBack} size={42} />
      <IconButton icon={paused ? ICONS.play : ICONS.pause} label={paused ? pt.combat.resume : pt.combat.paused} onPress={onTogglePause} size={42} />
      <Chunky face="#2a2632" edge="#17141b" radius={16} depth={4} gloss={0.08} style={styles.waveBox} faceStyle={styles.wave}>
        <AppText variant="label" style={styles.text}>
          {survival ? pt.survival.hud(wave) : pt.combat.stageWave(stageLabel(stage), wave, totalWaves)}
        </AppText>
        <View style={styles.segments}>
          {Array.from({ length: segments }, (_, i) => {
            const fill = i < current - 1 ? 1 : i === current - 1 ? progress : 0;
            return (
              <View key={i} style={[styles.segment, i === segments - 1 && styles.boss]}>
                <View style={[styles.fill, { width: `${fill * 100}%` }]} />
              </View>
            );
          })}
        </View>
      </Chunky>
      {__DEV__ && fps > 0 && (
        <AppText variant="small" color={colors.textMuted}>
          {`${fps}`}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  waveBox: { flex: 1 },
  wave: { gap: 5, paddingVertical: 6, paddingHorizontal: 12 },
  text: { fontSize: 14, lineHeight: 17 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 9, borderRadius: 5, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderWidth: 1.5, borderColor: colors.outline, overflow: 'hidden' },
  boss: { backgroundColor: 'rgba(255, 79, 79, 0.45)' },
  fill: { height: '100%', backgroundColor: colors.accent },
});
