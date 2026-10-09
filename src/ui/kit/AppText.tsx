import { StyleSheet, Text, type TextProps } from 'react-native';

import { StrokeText } from '@/ui/kit/StrokeText';
import { colors, fonts } from '@/ui/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'eyebrow' | 'label' | 'number';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  /** Contorno grosso estilo Clash; padrão: ligado nos títulos, rótulos e números. */
  stroke?: boolean;
}

const STROKED = new Set<Variant>(['display', 'title', 'heading', 'label', 'number']);

/**
 * Texto da interface. Títulos, rótulos e números: Lilita One com contorno e sombra (estilo
 * Clash). Corpo e textos pequenos: Rubik. eyebrow/display/label: caixa alta.
 */
export function AppText({ variant = 'body', color, style, children, stroke, ...props }: Props) {
  const upper = variant === 'display' || variant === 'eyebrow' || variant === 'label';
  const content = upper && typeof children === 'string' ? children.toUpperCase() : children;
  const textStyle = [styles.base, styles[variant], color ? { color } : null, style];
  if (stroke ?? STROKED.has(variant)) {
    return (
      <StrokeText {...props} style={textStyle}>
        {content}
      </StrokeText>
    );
  }
  return (
    <Text {...props} style={textStyle}>
      {content}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, fontFamily: fonts.medium },
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 20 },
  small: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15 },
  eyebrow: { fontFamily: fonts.black, fontSize: 12, lineHeight: 15, letterSpacing: 2, color: colors.accent },
  label: { fontFamily: fonts.display, fontSize: 15, lineHeight: 18, letterSpacing: 0.5 },
  number: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
});
