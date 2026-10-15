import { useEffect } from 'react';
import { AppState } from 'react-native';

import { refreshMissions } from '@/services/missions';
import { flushTelemetry } from '@/services/telemetry';
import { initAds } from '@/services/ads';
import { pushSave } from '@/services/cloudSave';
import { flushXp } from '@/services/economy';
import { retryAccountSync } from '@/services/accountSync';
import { useProgressStore } from '@/state/progressStore';

// Espera um pouco depois da última mudança do progresso antes de mandar para a nuvem.
const PUSH_DELAY_MS = 4000;

/**
 * Liga a conta ao app (uma vez, no layout raiz): sessão, propagandas, save na nuvem quando o
 * progresso muda e atualização ao voltar para o app.
 */
export function useAccountSync(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    void retryAccountSync().catch(() => null).then(() => initAds()).catch(() => null);
    const metricsTimer = setInterval(() => { void flushTelemetry(); void refreshMissions(); }, 30000);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useProgressStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => pushSave(), PUSH_DELAY_MS);
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void retryAccountSync().catch(() => null);
        flushXp();
        void refreshMissions();
        void flushTelemetry();
      } else {
        pushSave();
      }
    });
    return () => {
      clearInterval(metricsTimer);
      unsubscribe();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }, [ready]);
}
