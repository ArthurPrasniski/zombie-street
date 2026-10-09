import { Image, Pressable, StyleSheet, View, type ImageSourcePropType, type ViewStyle } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors } from '@/ui/theme';

interface PillProps {
  icon?: ImageSourcePropType;
  label: string;
  color?: string;
  style?: ViewStyle;
}

/** Pílula escura em relevo com ícone e valor contornado (dinheiro, fases). */
export function Pill({ icon, label, color = colors.white, style }: PillProps) {
  return (
    <Chunky face="#2a2632" edge="#17141b" radius={999} depth={3} gloss={0.08} style={style}>
      <View style={styles.pill}>
        {icon && <Image source={icon} style={styles.icon} />}
        <AppText variant="number" color={color} style={styles.value}>
          {label}
        </AppText>
      </View>
    </Chunky>
  );
}

/** Botão redondo em relevo com ícone (voltar, pausa). */
export function IconButton({ icon, onPress, label, size = 46 }: { icon: ImageSourcePropType; onPress: () => void; label: string; size?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <Chunky face="#3d3848" edge="#24202c" radius={size / 2} depth={4} pressed={pressed} gloss={0.12}>
          <View style={{ width: size - 6, height: size - 10, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={icon} style={{ width: size * 0.46, height: size * 0.46 }} />
          </View>
        </Chunky>
      )}
    </Pressable>
  );
}

/** Barra de progresso em segmentos (fases vencidas, ondas). */
export function Segments({ total, filled, color = colors.accent, height = 6 }: { total: number; filled: number; color?: string; height?: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { height: height + 2, borderRadius: (height + 2) / 2, backgroundColor: i < filled ? color : 'rgba(0, 0, 0, 0.35)' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingLeft: 10, paddingRight: 14 },
  icon: { width: 22, height: 22 },
  value: { fontSize: 18, lineHeight: 22 },
  segments: { flexDirection: 'row', gap: 4, alignSelf: 'stretch' },
  segment: { flex: 1, borderWidth: 1.5, borderColor: colors.outline },
});
