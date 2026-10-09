import { useEffect } from 'react';
import { AppState } from 'react-native';

import { initAds } from '@/services/ads';
import { pullSave, pushSave } from '@/services/cloudSave';
import { flushXp, refreshEconomy } from '@/services/economy';
import { startSession } from '@/services/session';
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
    startSession();
    initAds().catch(() => null);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useProgressStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => pushSave(), PUSH_DELAY_MS);
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        pullSave();
        refreshEconomy();
        flushXp();
      } else {
        pushSave();
      }
    });
    return () => {
      unsubscribe();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }, [ready]);
}
