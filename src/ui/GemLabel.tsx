import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useAccountStore } from '@/state/accountStore';
import { Pop } from '@/ui/fx/Pop';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Pill } from '@/ui/kit/Pill';
import { formatCash } from '@/utils/format';

/** Gema + valor, solto no texto (preços em gemas). */
export function GemLabel({ amount, size = 20, color = '#8ff4e4' }: { amount: number; size?: number; color?: string }) {
  return (
    <View style={styles.row}>
      <Image source={ICONS.gem} style={{ width: size, height: size }} />
      <AppText variant="number" color={color} style={{ fontSize: size * 0.9, lineHeight: size * 1.1 }}>
        {formatCash(amount)}
      </AppText>
    </View>
  );
}

/** Pílula com as gemas do servidor (abre a Loja). Sem conexão, mostra "–". */
export function GemPill() {
  const gems = useAccountStore((s) => s.gems);
  return (
    <Pressable onPress={() => router.push('/shop')} accessibilityRole="button">
      <Pop trigger={gems} scale={1.15}>
        <Pill icon={ICONS.gem} label={gems === null ? '–' : formatCash(gems)} color="#c8fff4" />
      </Pop>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
