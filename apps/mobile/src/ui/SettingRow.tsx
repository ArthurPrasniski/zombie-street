import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, radius } from '@/ui/theme';

/** Linha de Ajustes: nome, explicação e o controle à direita (chave ou botão). */
export function SettingRow({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <Chunky face={colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={4} gloss={0.05} faceStyle={styles.row}>
      <View style={styles.texts}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="small" color={colors.textMuted}>
          {hint}
        </AppText>
      </View>
      {children}
    </Chunky>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  texts: { flex: 1, gap: 2 },
});
