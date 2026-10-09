import { StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';

const OFFSETS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const TEXT_KEYS = new Set([
  'color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'textAlign',
  'textDecorationLine', 'textTransform', 'includeFontPadding', 'textAlignVertical',
]);

/** Separa o estilo em layout (vai para a caixa) e texto (vai para cada cópia do texto). */
function split(style: StyleProp<TextStyle>): { box: ViewStyle; text: TextStyle } {
  const flat = StyleSheet.flatten(style) ?? {};
  const box: Record<string, unknown> = {};
  const text: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) (TEXT_KEYS.has(key) ? text : box)[key] = value;
  return { box: box as ViewStyle, text: text as TextStyle };
}

interface Props extends Omit<TextProps, 'style'> {
  style?: StyleProp<TextStyle>;
  /** Cor e espessura do contorno; a sombra fica embaixo, na mesma cor. */
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Texto com contorno grosso e sombra embaixo (estilo Clash): cópias deslocadas por trás do
 * texto principal. O texto principal fica no fluxo normal, então o layout não muda.
 */
export function StrokeText({ style, strokeColor = '#17141b', strokeWidth, children, ...props }: Props) {
  const { box, text } = split(style);
  const size = text.fontSize ?? 16;
  const width = strokeWidth ?? Math.max(1.4, size * 0.11);
  const back = [text, styles.copy, { color: strokeColor }];
  return (
    <View style={box}>
      <Text {...props} style={[...back, { top: width * 1.5, left: 0, right: 0 }]} accessible={false}>
        {children}
      </Text>
      {OFFSETS.map(([dx, dy]) => (
        <Text key={`${dx},${dy}`} {...props} style={[...back, { left: dx * width, right: -dx * width, top: dy * width }]} accessible={false}>
          {children}
        </Text>
      ))}
      <Text {...props} style={text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { position: 'absolute' },
});
