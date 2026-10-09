import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { PushRegister } from '@zombie-road/shared/api';

import { api, hasApiToken } from '@/services/api';
import { NATIVE } from '@/services/env';
import { notifications, pushPermission } from '@/services/push/notifications';
import { useSettingsStore } from '@/state/settingsStore';

// Avisos remotos (GDD seção 20.2, docs/BACKEND.md): o aparelho manda ao servidor o token da Expo,
// o fuso e as categorias ligadas. Só no development build (o Expo Go não recebe push remoto) e no
// aparelho de verdade (o simulador não tem token).

async function expoPushToken(): Promise<string | null> {
  const N = notifications();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!N || !NATIVE || !projectId) return null;
  try {
    return (await N.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

const timeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/**
 * Deixa o servidor em dia com este aparelho: registra (permissão dada e alguma categoria remota
 * ligada) ou tira da lista. Chamado ao entrar na conta, ao dar a permissão e ao mudar os ajustes.
 */
export async function syncPushToken(): Promise<void> {
  if (!hasApiToken()) return;
  const token = await expoPushToken();
  if (!token) return;
  const prefs = useSettingsStore.getState().push;
  const wantsRemote = prefs.pass || prefs.shop || prefs.news;
  if (wantsRemote && (await pushPermission()) === 'granted') {
    const body: PushRegister = { token, platform: Platform.OS === 'ios' ? 'ios' : 'android', timeZone: timeZone(), prefs };
    await api('POST', '/push/token', body);
  } else {
    await api('DELETE', '/push/token', { token });
  }
}
