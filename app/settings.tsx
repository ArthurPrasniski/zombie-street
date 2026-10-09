import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pt } from '@/i18n/pt';
import { useProgressStore } from '@/state/progressStore';
import { type SettingKey, useSettingsStore } from '@/state/settingsStore';
import { AccountPanel } from '@/ui/account/AccountPanel';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { Toggle } from '@/ui/kit/Toggle';
import { GameModal } from '@/ui/modals/GameModal';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors, radius } from '@/ui/theme';

const TOGGLES: { key: SettingKey; label: string; hint: string }[] = [
  { key: 'sound', label: pt.settings.sound, hint: pt.settings.soundHint },
  { key: 'haptics', label: pt.settings.haptics, hint: pt.settings.hapticsHint },
  { key: 'damageNumbers', label: pt.settings.damageNumbers, hint: pt.settings.damageNumbersHint },
];

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
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

/** Ajustes (GDD seção 17.2): som, vibração, números de dano e apagar o progresso. */
export default function SettingsScreen() {
  const settings = useSettingsStore();
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    useProgressStore.getState().reset();
    setConfirm(false);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.settings.title} />
        <ScrollView contentContainerStyle={styles.list}>
          <AppText variant="eyebrow">{pt.account.section}</AppText>
          <AccountPanel />
          <AppText variant="eyebrow" style={styles.section}>
            {pt.settings.game}
          </AppText>
          {TOGGLES.map(({ key, label, hint }) => (
            <Row key={key} label={label} hint={hint}>
              <Toggle value={settings[key]} onChange={(value) => settings.setSetting(key, value)} label={label} />
            </Row>
          ))}
          <AppText variant="eyebrow" style={styles.section}>
            {pt.settings.progress}
          </AppText>
          <Row label={pt.settings.reset} hint={pt.settings.resetHint}>
            <Button label={pt.settings.resetConfirm} variant="solid" color={colors.danger} size="s" onPress={() => setConfirm(true)} />
          </Row>
          <View style={styles.about}>
            <AppText variant="small" color={colors.textMuted}>
              {pt.settings.about(Constants.expoConfig?.version ?? '1.0.0')}
            </AppText>
            <AppText variant="small" color={colors.textMuted}>
              {pt.settings.credits}
            </AppText>
          </View>
        </ScrollView>
      </SafeAreaView>
      {confirm && (
        <GameModal
          title={pt.settings.resetTitle}
          accent={colors.danger}
          buttons={
            <>
              <Button label={pt.settings.cancel} variant="dark" onPress={() => setConfirm(false)} />
              <Button label={pt.settings.resetConfirm} variant="solid" color={colors.danger} onPress={reset} />
            </>
          }>
          <AppText color={colors.textMuted} style={styles.center}>
            {pt.settings.resetBody}
          </AppText>
        </GameModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  section: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  texts: { flex: 1, gap: 2 },
  about: { alignItems: 'center', gap: 4, marginTop: 24 },
  center: { textAlign: 'center' },
});
