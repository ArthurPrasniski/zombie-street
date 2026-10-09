import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACHIEVEMENTS } from '@/game/data/achievements';
import { pt } from '@/i18n/pt';
import { achievementValue, claimableCount, medalsReached, nextGoal, nextReward } from '@/state/achievements';
import { useProgressStore } from '@/state/progressStore';
import { AchievementRow } from '@/ui/achievements/AchievementRow';
import { AppText } from '@/ui/kit/AppText';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';

/** Conquistas (GDD seção 17.8): as que têm prêmio esperando vêm primeiro. */
export default function AchievementsScreen() {
  const progress = useProgressStore();
  const rows = [...ACHIEVEMENTS].sort((a, b) => Number(nextReward(progress, b.id) !== null) - Number(nextReward(progress, a.id) !== null));
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.achievements.title} />
        <ScrollView contentContainerStyle={styles.list}>
          <AppText variant="eyebrow">{pt.achievements.subtitle(claimableCount(progress))}</AppText>
          {rows.map((def) => (
            <AchievementRow
              key={def.id}
              def={def}
              value={achievementValue(progress, def.id)}
              reached={medalsReached(progress, def.id)}
              reward={nextReward(progress, def.id)}
              goal={nextGoal(progress, def.id)}
              onClaim={() => progress.claimAchievement(def.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
});
