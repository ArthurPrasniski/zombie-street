import { Platform } from 'react-native';

import { ptPush } from '@/i18n/ptPush';

// Acesso ao expo-notifications (GDD seção 20). O módulo é carregado com `require`: no Expo Go do
// Android ele pode recusar (sem push remoto desde o SDK 53) e no web não existe. Nesses casos as
// notificações ficam desligadas e o jogo segue normal.

type NotificationsModule = typeof import('expo-notifications');

/** Canal do Android (o servidor manda os avisos remotos nele). */
export const PUSH_CHANNEL = 'default';

let loaded: NotificationsModule | null | undefined;

/** O módulo de notificações, ou null onde ele não funciona. */
export function notifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  try {
    loaded = Platform.OS === 'web' ? null : (require('expo-notifications') as NotificationsModule);
  } catch {
    loaded = null;
  }
  return loaded;
}

export type PushPermission = 'granted' | 'denied' | 'undetermined';

export async function pushPermission(): Promise<PushPermission> {
  const N = notifications();
  if (!N) return 'denied';
  const p = await N.getPermissionsAsync();
  if (p.granted || p.ios?.status === N.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

/** Canal do Android: precisa existir antes de pedir a permissão (Android 13+). */
export async function ensureChannel(): Promise<void> {
  const N = notifications();
  if (!N || Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(PUSH_CHANNEL, { name: ptPush.channel, importance: N.AndroidImportance.DEFAULT });
}

/** Pede a permissão do sistema. true = o jogador aceitou. */
export async function requestPushPermission(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;
  await ensureChannel();
  const p = await N.requestPermissionsAsync();
  return p.granted || p.ios?.status === N.IosAuthorizationStatus.PROVISIONAL;
}
