import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MATERIAL_MODULES } from '@/assets/pixel16-detailed/modules';

import { colors } from '@/ui/theme';

interface Props {
  /** Cor da face e da espessura embaixo (mais escura). */
  face: string;
  material?: keyof typeof MATERIAL_MODULES;
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

/** Reusable steel/brass panel. Small bevels replace the former rounded plastic gloss. */
export function Chunky({ face, edge, material = 'steel', depth = 4, pressed, gloss = 0.15, style, faceStyle, children }: Props) {
  return (
    <View style={[styles.outer, { backgroundColor: edge, paddingBottom: pressed ? 1 : depth, marginTop: pressed ? depth - 1 : 0 }, style, styles.square]}>
      <View style={[styles.face, { backgroundColor: face }, faceStyle, styles.square]}>
        <Image accessible={false} source={MATERIAL_MODULES[material]} resizeMode="repeat" style={styles.texture} />
        {children}
        <View pointerEvents="none" style={styles.bevel} />
        {gloss > 0 && <View pointerEvents="none" style={[styles.highlight, { opacity: Math.min(gloss,0.22) }]} />}
        <View pointerEvents="none" style={styles.seam} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 3, borderColor: colors.outline },
  square: { borderRadius: 2 },
  texture: { ...StyleSheet.absoluteFill, opacity: 0.13 },
  face: { overflow: 'hidden' },
  bevel: { ...StyleSheet.absoluteFill, borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 2, borderRightWidth: 2, borderTopColor: '#fff0c140', borderLeftColor: '#fff0c128', borderBottomColor: '#090d144d', borderRightColor: '#090d1433' },
  highlight: { position: 'absolute', left: 4, right: 4, top: 2, height: 1, backgroundColor: '#fff0c1' },
  seam: { position: 'absolute', left: 3, bottom: 2, width: 3, height: 3, backgroundColor: '#fff0c124' },
});
