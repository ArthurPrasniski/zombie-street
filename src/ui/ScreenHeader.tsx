import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { pt } from '@/i18n/pt';
import { CashPill } from '@/ui/CashLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { IconButton } from '@/ui/kit/Pill';

/** Topo das telas de menu: voltar, título e dinheiro. */
export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <IconButton icon={ICONS.back} label={pt.common.back} onPress={() => router.back()} />
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <CashPill />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1 },
});
