import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import type { PushCategory } from '@zombie-road/shared/push';

import { ptPush } from '@/i18n/ptPush';
import { notifications, type PushPermission, pushPermission, requestPushPermission } from '@/services/push/notifications';
import { syncPushToken } from '@/services/push/remote';
import { useSettingsStore } from '@/state/settingsStore';
import { Button } from '@/ui/kit/Button';
import { Toggle } from '@/ui/kit/Toggle';
import { SettingRow } from '@/ui/SettingRow';

const ROWS: { category: PushCategory; label: string; hint: string }[] = [
  { category: 'progress', label: ptPush.settings.progress, hint: ptPush.settings.progressHint },
  { category: 'pass', label: ptPush.settings.pass, hint: ptPush.settings.passHint },
  { category: 'shop', label: ptPush.settings.shop, hint: ptPush.settings.shopHint },
  { category: 'news', label: ptPush.settings.news, hint: ptPush.settings.newsHint },
];

/** Ajustes das notificações (GDD seção 20.3): ativar a permissão e ligar/desligar cada categoria. */
export function PushSettings() {
  const prefs = useSettingsStore((s) => s.push);
  const [permission, setPermission] = useState<PushPermission | null>(null);

  // Confere de novo ao voltar dos ajustes do celular
  useEffect(() => {
    const check = () => pushPermission().then(setPermission, () => setPermission('denied'));
    check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => sub.remove();
  }, []);

  if (!notifications() || permission === null) return null;

  if (permission !== 'granted') {
    const enable = async () => {
      useSettingsStore.getState().markPushAsked();
      if (permission === 'denied') {
        Linking.openSettings();
        return;
      }
      const granted = await requestPushPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) syncPushToken().catch(() => null);
    };
    return (
      <SettingRow label={ptPush.settings.off} hint={permission === 'denied' ? ptPush.settings.deniedHint : ptPush.settings.offHint}>
        <Button label={permission === 'denied' ? ptPush.settings.openSystem : ptPush.settings.enable} size="s" onPress={enable} />
      </SettingRow>
    );
  }

  return (
    <>
      {ROWS.map(({ category, label, hint }) => (
        <SettingRow key={category} label={label} hint={hint}>
          <Toggle value={prefs[category]} onChange={(value) => useSettingsStore.getState().setPush(category, value)} label={label} />
        </SettingRow>
      ))}
    </>
  );
}
