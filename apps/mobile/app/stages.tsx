import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStage, stageLabel, STAGES_PER_WORLD, worldOf } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { isDeckComplete, isStageUnlocked } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import { worldStars } from '@/state/stars';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { StageTile } from '@/ui/StageTile';
import { colors } from '@/ui/theme';
import { WorldBanner } from '@/ui/WorldBanner';

const PER_ROW = 2;

/** Fases por mundo: faixa do mundo com setas e a grade das 10 fases dele. */
export default function StagesScreen() {
  const highestCleared = useProgressStore((s) => s.highestCleared);
  const stars = useProgressStore((s) => s.stars);
  // Abre no mundo da próxima fase a vencer (em desenvolvimento, `?world=13` abre outro)
  const { world: devWorld } = useLocalSearchParams<{ world?: string }>();
  const [world, setWorld] = useState(() => (__DEV__ && devWorld ? Math.max(0, Number(devWorld) - 1) : worldOf(highestCleared + 1)));
  const first = globalStage(world, 1);
  const clearedHere = Math.max(0, Math.min(STAGES_PER_WORLD, highestCleared - first + 1));
  const unlocked = highestCleared + 1 >= first;
  const rows = Array.from({ length: STAGES_PER_WORLD / PER_ROW }, (_, r) => [first + r * PER_ROW, first + r * PER_ROW + 1]);

  const play = (stage: number) => {
    const progress = useProgressStore.getState();
    if (!isStageUnlocked(progress, stage)) return;
    // Sem o deck completo não dá para jogar: leva para o Deck.
    if (!isDeckComplete(progress)) {
      router.push('/deck');
      return;
    }
    progress.selectStage(stage);
    router.push('/combat');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.stages.title} />
        <View style={styles.body}>
          <WorldBanner
            world={world}
            cleared={clearedHere}
            stars={worldStars({ stars }, world)}
            lockedBy={unlocked ? null : stageLabel(first - 1)}
            onPrev={world > 0 ? () => setWorld(world - 1) : null}
            // Dá para olhar até o mundo seguinte ao que o jogador alcançou (sem fim na Fronteira)
            onNext={world < worldOf(highestCleared + 1) + 1 ? () => setWorld(world + 1) : null}
          />
          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row[0]} style={styles.row}>
                {row.map((stage) => (
                  <StageTile key={stage} stage={stage} onPress={() => play(stage)} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  body: { flex: 1, gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  grid: { flex: 1, gap: 10 },
  row: { flex: 1, flexDirection: 'row', gap: 10 },
});
