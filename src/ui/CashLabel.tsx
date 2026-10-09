import { Image, StyleSheet, View } from 'react-native';

import { useProgressStore } from '@/state/progressStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Pop } from '@/ui/fx/Pop';
import { Pill } from '@/ui/kit/Pill';
import { colors } from '@/ui/theme';
import { formatCash } from '@/utils/format';

/** Moeda + valor, solto no texto (custos, prêmios). */
export function CashLabel({ amount, size = 22 }: { amount: number; size?: number }) {
  return (
    <View style={styles.row}>
      <Image source={ICONS.coin} style={{ width: size, height: size }} />
      <AppText variant="number" color={colors.gold} style={{ fontSize: size * 0.9, lineHeight: size * 1.1 }}>
        {formatCash(amount)}
      </AppText>
    </View>
  );
}

/** Pílula com o dinheiro salvo do jogador (topo das telas); pula quando o valor muda. */
export function CashPill() {
  const cash = useProgressStore((s) => s.cash);
  return (
    <Pop trigger={cash} scale={1.15}>
      <Pill icon={ICONS.coin} label={formatCash(cash)} />
    </Pop>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
