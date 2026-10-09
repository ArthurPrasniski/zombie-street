import { type Href, router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isAppRoute } from '@zombie-road/shared/push';

import { refreshEconomy } from '@/services/economy';
import { cancelLocalPushes, scheduleLocalPushes } from '@/services/push/local';
import { ensureChannel, notifications } from '@/services/push/notifications';
import { syncPushToken } from '@/services/push/remote';
import { useSettingsStore } from '@/state/settingsStore';

type Notification = import('expo-notifications').Notification;

const ignore = () => null;

/** Toque num aviso: abre a tela dele (só rotas do próprio app). */
function openFrom(notification: Notification): void {
  const url = notification.request.content.data?.url;
  if (isAppRoute(url)) router.push(url as Href);
}

/**
 * Notificações (GDD seção 20), uma vez no layout raiz: cancela os avisos locais ao abrir o app e
 * agenda de novo ao sair, abre a tela do aviso tocado e mantém o servidor em dia com os ajustes.
 */
export function usePushSync(ready: boolean): void {
  useEffect(() => {
    const N = notifications();
    if (!ready || !N) return;
    // Com o app aberto: a compra confirmada só atualiza as gemas (a loja já mostra); o resto aparece
    N.setNotificationHandler({
      handleNotification: async (n) => {
        const purchase = n.request.content.data?.kind === 'purchase';
        return { shouldShowBanner: !purchase, shouldShowList: !purchase, shouldPlaySound: false, shouldSetBadge: false };
      },
    });
    ensureChannel().catch(ignore);
    cancelLocalPushes().catch(ignore);

    const last = N.getLastNotificationResponse();
    if (last) {
      openFrom(last.notification);
      N.clearLastNotificationResponse();
    }
    const tapped = N.addNotificationResponseReceivedListener((response) => {
      openFrom(response.notification);
      N.clearLastNotificationResponse();
    });
    const received = N.addNotificationReceivedListener((n) => {
      if (n.request.content.data?.kind === 'purchase') refreshEconomy();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') cancelLocalPushes().catch(ignore);
      else scheduleLocalPushes().catch(ignore);
    });
    const prefs = useSettingsStore.subscribe((s, prev) => {
      if (s.push !== prev.push) syncPushToken().catch(ignore);
    });
    return () => {
      tapped.remove();
      received.remove();
      appState.remove();
      prefs();
    };
  }, [ready]);
}
