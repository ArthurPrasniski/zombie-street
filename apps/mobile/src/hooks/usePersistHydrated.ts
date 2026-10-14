import { useSyncExternalStore } from 'react';

interface Persisted { persist: { hasHydrated(): boolean; onFinishHydration(fn: () => void): () => void; onHydrate(fn: () => void): () => void } }
export function usePersistHydrated(store: Persisted): boolean {
  return useSyncExternalStore((notify) => {
    const finish = store.persist.onFinishHydration(notify);
    const start = store.persist.onHydrate(notify);
    return () => { finish(); start(); };
  }, () => store.persist.hasHydrated(), () => false);
}
