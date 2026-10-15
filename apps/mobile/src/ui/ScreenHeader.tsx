import { goBack } from '@/ui/navigation';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { t as pt } from '@/i18n';
import { CashPill } from '@/ui/CashLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { IconButton } from '@/ui/kit/Pill';

/** Topo das telas de menu: voltar, título e dinheiro (e o que vier em `right`, como as gemas). */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <IconButton icon={ICONS.back} label={pt.common.back} onPress={() => goBack()} />
      <AppText variant="title" style={[styles.title,title.length>12&&styles.longTitle]}>
        {title}
      </AppText>
      <View style={styles.wallets}>{right}<CashPill /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1, minWidth: 130 },
  longTitle: { minWidth: '70%' },
  wallets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 'auto', justifyContent: 'flex-end' },
});
