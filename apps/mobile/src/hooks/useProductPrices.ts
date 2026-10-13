import { useEffect, useState } from 'react';

import { NATIVE } from '@/services/env';
import { productPrices, purchasesAvailable } from '@/services/purchases';
import { useAccountStore } from '@/state/accountStore';

/** Aguarda a conta antes de buscar os preços e permite repetir uma consulta que falhou. */
export function useProductPrices(productIds: readonly string[]) {
  const userId = useAccountStore((s) => s.user?.id);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    userId: string | undefined;
    attempt: number;
    prices: Record<string, string>;
    error: boolean;
  } | null>(null);
  const ready = purchasesAvailable() && (!NATIVE || !!userId);
  const loading = ready && (result?.userId !== userId || result?.attempt !== attempt);

  useEffect(() => {
    let active = true;
    if (!ready) return;
    productPrices(userId).then((next) => {
      if (!active) return;
      const missing = productIds.filter((id) => !next[id]);
      setResult({ userId, attempt, prices: next, error: missing.length > 0 });
      if (__DEV__ && missing.length) console.warn('[Loja] Produtos sem preço:', missing.join(', '));
    }).catch((cause) => {
      if (!active) return;
      setResult({ userId, attempt, prices: {}, error: true });
      if (__DEV__) console.warn('[Loja] Não foi possível carregar os preços:', cause);
    });
    return () => { active = false; };
  }, [userId, productIds, attempt, ready]);

  return {
    prices: ready && !loading ? (result?.prices ?? {}) : {},
    loading,
    error: ready && !loading && result?.error === true,
    retry: () => setAttempt((n) => n + 1),
  };
}
