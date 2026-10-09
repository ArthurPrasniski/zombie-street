import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, darkEdge } from '@/ui/theme';

type Variant = 'primary' | 'solid' | 'dark';
type Size = 'l' | 'm' | 's';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Cor da face do botão 'solid'. */
  color?: string;
  /** Seta › depois do texto (chamada para ação). */
  chevron?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

const PAD: Record<Size, { v: number; h: number; font: number; depth: number }> = {
  l: { v: 13, h: 24, font: 22, depth: 6 },
  m: { v: 9, h: 18, font: 18, depth: 5 },
  s: { v: 6, h: 12, font: 15, depth: 4 },
};

/** Botão "gordinho" estilo Clash: amarelo (padrão), colorido ou escuro, texto branco contornado. */
export function Button({ label, onPress, variant = 'primary', size = 'm', color, chevron, icon, disabled, style }: Props) {
  const face = variant === 'primary' ? colors.yellow : variant === 'dark' ? colors.surfaceHigh : (color ?? colors.featured);
  const pad = PAD[size];
  const text = { fontSize: pad.font, lineHeight: pad.font + 4 };
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} style={style}>
      {({ pressed }) => (
        <Chunky face={face} edge={darkEdge(face)} radius={size === 's' ? 12 : 16} depth={pad.depth} pressed={pressed} gloss={variant === 'dark' ? 0.08 : 0.3} style={disabled && styles.disabled}>
          <View style={[styles.content, { paddingVertical: pad.v, paddingHorizontal: pad.h }]}>
            {icon}
            <AppText variant="label" style={text}>
              {label}
            </AppText>
            {chevron && (
              <AppText variant="label" style={{ fontSize: pad.font + 4, lineHeight: pad.font + 4 }}>
                ›
              </AppText>
            )}
          </View>
        </Chunky>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.45 },
});
