import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pt } from '@/i18n/pt';
import { ptPush } from '@/i18n/ptPush';
import { useProgressStore } from '@/state/progressStore';
import { type SettingKey, useSettingsStore } from '@/state/settingsStore';
import { AccountPanel } from '@/ui/account/AccountPanel';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Toggle } from '@/ui/kit/Toggle';
import { GameModal } from '@/ui/modals/GameModal';
import { PushSettings } from '@/ui/push/PushSettings';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SettingRow as Row } from '@/ui/SettingRow';
import { colors } from '@/ui/theme';

const TOGGLES: { key: SettingKey; label: string; hint: string }[] = [
  { key: 'sound', label: pt.settings.sound, hint: pt.settings.soundHint },
  { key: 'haptics', label: pt.settings.haptics, hint: pt.settings.hapticsHint },
  { key: 'damageNumbers', label: pt.settings.damageNumbers, hint: pt.settings.damageNumbersHint },
];

/** Ajustes (GDD seções 17.2 e 20.3): conta, som, vibração, números de dano, notificações e apagar o progresso. */
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
          {Platform.OS !== 'web' && (
            <>
              <AppText variant="eyebrow" style={styles.section}>
                {ptPush.settings.section}
              </AppText>
              <PushSettings />
            </>
          )}
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
  about: { alignItems: 'center', gap: 4, marginTop: 24 },
  center: { textAlign: 'center' },
});
