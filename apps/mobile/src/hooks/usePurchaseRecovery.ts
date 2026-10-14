import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refreshEconomy } from '@/services/economy';
import { useAccountStore } from '@/state/accountStore';
import { usePurchaseStore } from '@/state/purchaseStore';

export function usePurchaseRecovery(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    for (const a of usePurchaseStore.getState().attempts) if (a.status === 'buying' || a.status === 'confirming') usePurchaseStore.getState().update(a.id, { status: 'pending' });
    let checking = false;
    const check = async () => {
      const userId = useAccountStore.getState().user?.id;
      if (checking || AppState.currentState !== 'active' || !userId || !usePurchaseStore.getState().attempts.some((a) => a.userId === userId && a.status === 'pending')) return;
      checking = true;
      try { await refreshEconomy(); } finally { checking = false; }
    };
    void check();
    const timer = setInterval(() => { void check(); }, 15000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void check(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [ready]);
}
