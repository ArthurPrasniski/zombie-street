import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRUCK_PART_IDS } from '@/game/data/truck';
import { pt } from '@/i18n/pt';
import { useProgressStore } from '@/state/progressStore';
import { canUpgradeTruck, nextTruckCost } from '@/state/truck';
import { PartRow, statText } from '@/ui/garage/PartRow';
import { AppText } from '@/ui/kit/AppText';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';

const TRUCK = require('@/assets/images/mascots/truck.png');

/** Oficina (GDD seção 17.3): a caminhonete e as três peças para melhorar com dinheiro. */
export default function GarageScreen() {
  const progress = useProgressStore();
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.garage.title} />
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.hero}>
            <View style={styles.glow} />
            <Image source={TRUCK} style={styles.truck} />
            <AppText variant="small" color={colors.textMuted} style={styles.summary}>
              {TRUCK_PART_IDS.map((part) => pt.garage.value(pt.garage.stats[part], statText(part, progress.truck))).join('  ·  ')}
            </AppText>
          </View>
          {TRUCK_PART_IDS.map((part) => (
            <PartRow
              key={part}
              part={part}
              levels={progress.truck}
              cost={nextTruckCost(progress, part)}
              affordable={canUpgradeTruck(progress, part)}
              onUpgrade={() => progress.upgradeTruck(part)}
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
  hero: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  glow: { position: 'absolute', top: 10, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255, 201, 40, 0.12)' },
  truck: { width: 200, height: 200 },
  summary: { textAlign: 'center' },
});
