import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

/** Bolinha com número no canto de um atalho (cartas para melhorar, prêmios para resgatar). */
export function Badge({ count, color = colors.danger, style }: { count: number; color?: string; style?: ViewStyle }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]} pointerEvents="none">
      <AppText variant="label" style={styles.text}>
        {count > 99 ? '99+' : `${count}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  text: { fontSize: 15, lineHeight: 18 },
});
