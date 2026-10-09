import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/ui/theme';

interface Props {
  /** Cor da face e da espessura embaixo (mais escura). */
  face: string;
  edge: string;
  radius?: number;
  /** Espessura embaixo, em pontos; some quando pressionado. */
  depth?: number;
  pressed?: boolean;
  /** Intensidade da faixa de brilho no alto (0 = sem brilho) e a altura dela. */
  gloss?: number;
  glossHeight?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** Peça "gordinha" estilo Clash: contorno escuro, espessura embaixo e brilho no alto da face. */
export function Chunky({ face, edge, radius = 16, depth = 5, pressed, gloss = 0.3, glossHeight = '40%', style, faceStyle, children }: Props) {
  return (
    <View style={[styles.outer, { borderRadius: radius, backgroundColor: edge, paddingBottom: pressed ? 1 : depth, marginTop: pressed ? depth - 1 : 0 }, style]}>
      <View style={[styles.face, { borderRadius: radius - 3, backgroundColor: face }, faceStyle]}>
        {gloss > 0 && <View style={[styles.gloss, { height: glossHeight, borderRadius: Math.max(4, radius - 6), backgroundColor: `rgba(255, 255, 255, ${gloss})` }]} />}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 3, borderColor: colors.outline },
  face: { overflow: 'hidden' },
  gloss: { position: 'absolute', left: 5, right: 5, top: 3 },
});
