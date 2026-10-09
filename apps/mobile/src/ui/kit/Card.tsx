import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, darkEdge, radius } from '@/ui/theme';

interface Props {
  children?: ReactNode;
  color?: string;
  /** Faixa colorida na borda esquerda (cartão em destaque). */
  accent?: string;
  /** Texto gigante e apagado no fundo, no canto de cima à direita. */
  watermark?: string;
  /** Metade direita em outra cor, cortada na diagonal. */
  split?: string;
  /** Contorno colorido (selecionado). */
  border?: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  /** Estilo de fora (tamanho no layout do pai, ex.: flex: 1 numa linha). */
  containerStyle?: ViewStyle;
  padding?: number;
}

/** Cartão-painel estilo Clash: cor chapada, contorno escuro, espessura embaixo e enfeites da Home. */
export function Card({ children, color = colors.surface, accent, watermark, split, border, onPress, style, containerStyle, padding = 20 }: Props) {
  const body = (pressed: boolean) => (
    <Chunky
      face={color}
      edge={darkEdge(color)}
      radius={radius.xl}
      depth={6}
      pressed={pressed}
      gloss={0.1}
      glossHeight={14}
      style={[styles.card, border ? { borderColor: border } : null, style]}
      faceStyle={styles.face}>
      {split && <View style={[styles.split, { backgroundColor: split }]} />}
      {watermark && (
        <AppText variant="display" stroke={false} numberOfLines={1} style={styles.watermark}>
          {watermark}
        </AppText>
      )}
      {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}
      <View style={[styles.content, { padding, paddingLeft: padding + (accent ? 8 : 0) }]}>{children}</View>
    </Chunky>
  );
  if (!onPress) return <View style={containerStyle}>{body(false)}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={containerStyle}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  face: { flexGrow: 1 },
  content: { flexGrow: 1 },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
  split: { position: 'absolute', top: -40, bottom: -40, right: -60, width: '52%', transform: [{ rotate: '12deg' }] },
  watermark: { position: 'absolute', right: -6, top: 14, fontSize: 110, lineHeight: 116, color: 'rgba(255, 255, 255, 0.08)' },
});
