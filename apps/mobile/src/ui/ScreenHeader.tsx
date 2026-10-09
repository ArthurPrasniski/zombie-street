import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { pt } from '@/i18n/pt';
import { CashPill } from '@/ui/CashLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { IconButton } from '@/ui/kit/Pill';

/** Topo das telas de menu: voltar, título e dinheiro (e o que vier em `right`, como as gemas). */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <IconButton icon={ICONS.back} label={pt.common.back} onPress={() => router.back()} />
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      {right}
      <CashPill />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1 },
});
