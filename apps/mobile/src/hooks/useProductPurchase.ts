import { useEffect, useRef, useState } from 'react';

import { MEMBERSHIP, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';

import { t } from '@/i18n';
import { buyProduct, recoverStorePurchases } from '@/services/economy';
import { useAccountStore } from '@/state/accountStore';
import { usePurchaseStore } from '@/state/purchaseStore';
import { attemptBlocksPurchase, isOwnedRejection } from '@/services/purchaseAttempt';

type Status = 'idle' | 'buying' | 'confirming' | 'pending' | 'success' | 'error' | 'owned' | 'refunded';

/** Feedback imediato da loja e confirmação separada da entrega pelo servidor. */
export function useProductPurchase() {
  const [attempts, setAttempts] = useState(() => usePurchaseStore.getState().attempts);
  const [initial] = useState(() => usePurchaseStore.getState().attempts.find((a) => a.userId === useAccountStore.getState().user?.id && ['pending', 'confirming', 'buying'].includes(a.status)));
  const [status, setStatus] = useState<Status>(initial ? isOwnedRejection(initial) ? 'owned' : 'pending' : 'idle');
  const [product, setProduct] = useState<string | null>(initial?.productId ?? null);
  const mounted = useRef(true);
  const running = useRef(false);
  const update = (value: Status) => { if (mounted.current) setStatus(value); };

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = useAccountStore.subscribe((state, previous) => { if (state.user?.id !== previous.user?.id) { setProduct(null); setStatus('idle'); } });
    return () => { mounted.current = false; unsubscribe(); };
  }, []);

  useEffect(() => usePurchaseStore.subscribe((state) => {
    setAttempts(state.attempts);
    const latest = state.attempts.find((a) => a.userId === useAccountStore.getState().user?.id);
    if (!latest) return;
    setProduct(latest.productId);
    setStatus(isOwnedRejection(latest) ? 'owned' : latest.status === 'cancelled' ? 'idle' : latest.status);
  }), []);

  const isPending = (productId: string) => (status === 'pending' && product === productId) || attempts.some((a) => a.userId === useAccountStore.getState().user?.id && a.productId === productId && attemptBlocksPurchase(a));

  const buy = async (productId: string) => {
    if (running.current || isPending(productId)) return;
    running.current = true;
    setProduct(productId);
    update('buying');
    try {
      const result = await buyProduct(productId, () => update('confirming'));
      update(result === 'confirmed' ? 'success' : result === 'cancelled' ? 'idle' : result);
    } catch {
      update(usePurchaseStore.getState().attempts.some((a) => a.userId === useAccountStore.getState().user?.id && a.productId === productId && a.status === 'pending') ? 'pending' : 'error');
    } finally {
      running.current = false;
    }
  };

  const check = async () => {
    if (running.current) return;
    running.current = true;
    update('confirming');
    try {
      await recoverStorePurchases();
      const recovered = usePurchaseStore.getState().attempts.find((a) => a.userId === useAccountStore.getState().user?.id && (!product || a.productId === product));
      update(recovered ? isOwnedRejection(recovered) ? 'owned' : recovered.status === 'cancelled' ? 'idle' : recovered.status : 'idle');
    } catch {
      update(status === 'owned' ? 'owned' : 'pending');
    } finally {
      running.current = false;
    }
  };

  const message = status === 'buying' ? t.shop.purchasing
    : status === 'confirming' ? t.shop.confirming
    : status === 'owned' ? t.shop.alreadyOwned
    : status === 'refunded' ? t.shop.purchaseRefunded
    : status === 'pending' ? t.shop.purchasePending
    : status === 'error' ? t.shop.purchaseFailed
    : status === 'success' ? (product === PASS_PRODUCT_ID ? t.pass.activated : product === MEMBERSHIP.productId ? t.membership.activated : t.shop.gemsArrived)
    : null;

  return { buy, check, isPending, message, status, busy: status === 'buying' || status === 'confirming', pending: status === 'pending', recoverable: status === 'pending' || status === 'owned' };
}
