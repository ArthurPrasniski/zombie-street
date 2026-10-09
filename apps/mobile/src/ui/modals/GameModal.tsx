import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, darkEdge, radius } from '@/ui/theme';

interface Props {
  title: string;
  eyebrow?: string;
  /** Cor da faixa do topo do painel (vitória, derrota). */
  accent?: string;
  children?: ReactNode;
  buttons: ReactNode;
}

/** Painel centralizado sobre a tela escurecida. Sem Modal nativo, por causa da rotação travada. */
export function GameModal({ title, eyebrow, accent = colors.accent, children, buttons }: Props) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.wrap}>
        <Chunky face={colors.surface} edge="#100e14" radius={radius.xl} depth={8} gloss={0.05} faceStyle={styles.body}>
          <View style={styles.spacer} />
          {eyebrow && <AppText variant="eyebrow" color={accent}>{eyebrow}</AppText>}
          {children}
          <View style={styles.buttons}>{buttons}</View>
        </Chunky>
        {/* Faixa do título por cima do painel, na cor do resultado */}
        <Chunky face={accent} edge={darkEdge(accent)} radius={16} depth={5} gloss={0.25} style={styles.ribbon} faceStyle={styles.ribbonFace}>
          <AppText variant="title" style={styles.title}>
            {title}
          </AppText>
        </Chunky>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(10, 9, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: { width: '100%', maxWidth: 420, paddingTop: 26 },
  body: { alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 22 },
  spacer: { height: 30 },
  ribbon: { position: 'absolute', top: 0, left: 24, right: 24 },
  ribbonFace: { paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  title: { textAlign: 'center', fontSize: 26, lineHeight: 30 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10, alignSelf: 'stretch' },
});
