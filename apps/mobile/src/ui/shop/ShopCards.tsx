import { Image, StyleSheet, View } from 'react-native';

import { CashLabel } from '@/ui/CashLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, radius } from '@/ui/theme';
import { formatInt } from '@/utils/format';

/** Pacote de moedas comprado com gemas: moedas que recebe e o custo em gemas. */
export function CoinPackCard({ name, coins, gems, disabled, onBuy }: { name: string; coins: number; gems: number; disabled: boolean; onBuy: () => void }) {
  return (
    <Chunky face={colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={5} gloss={0.06} faceStyle={styles.coinRow}>
      <Image source={ICONS.coin} style={styles.coin} />
      <View style={styles.texts}>
        <AppText variant="label">{name}</AppText>
        <CashLabel amount={coins} size={20} />
      </View>
      <Button label={formatInt(gems)} size="s" disabled={disabled} onPress={onBuy} icon={<GemLabelIcon />} />
    </Chunky>
  );
}

const GemLabelIcon = () => <Image source={ICONS.gem} style={styles.small} />;

const styles = StyleSheet.create({
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  coin: { width: 44, height: 44 },
  texts: { flex: 1, gap: 2 },
  small: { width: 18, height: 18 },
});
