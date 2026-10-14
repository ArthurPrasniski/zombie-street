import { useEffect, useRef, useState } from 'react';

import { PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';

import { t } from '@/i18n';
import { buyProduct, purchaseConfirmed, refreshEconomy } from '@/services/economy';
import { type AccountState, useAccountStore } from '@/state/accountStore';

type Status = 'idle' | 'buying' | 'confirming' | 'pending' | 'success' | 'error';

/** Feedback imediato da loja e confirmação separada da entrega pelo servidor. */
export function useProductPurchase() {
  const [status, setStatus] = useState<Status>('idle');
  const [product, setProduct] = useState<string | null>(null);
  const current = useRef<{ productId: string; before: AccountState } | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  const update = (value: Status) => { if (mounted.current) setStatus(value); };

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = useAccountStore.subscribe((state) => {
      const attempt = current.current;
      if (attempt && purchaseConfirmed(attempt.productId, attempt.before, state)) setStatus('success');
    });
    return () => { mounted.current = false; unsubscribe(); };
  }, []);

  const buy = async (productId: string) => {
    if (running.current || status === 'pending') return;
    running.current = true;
    current.current = { productId, before: useAccountStore.getState() };
    setProduct(productId);
    update('buying');
    try {
      const result = await buyProduct(productId, () => update('confirming'));
      if (result === 'cancelled') current.current = null;
      update(result === 'confirmed' ? 'success' : result === 'pending' ? 'pending' : 'idle');
    } catch {
      current.current = null;
      update('error');
    } finally {
      running.current = false;
    }
  };

  const check = async () => {
    if (running.current) return;
    running.current = true;
    update('confirming');
    try {
      await refreshEconomy();
      const attempt = current.current;
      update(attempt && purchaseConfirmed(attempt.productId, attempt.before, useAccountStore.getState()) ? 'success' : 'pending');
    } finally {
      running.current = false;
    }
  };

  const message = status === 'buying' ? t.shop.purchasing
    : status === 'confirming' ? t.shop.confirming
    : status === 'pending' ? t.shop.purchasePending
    : status === 'error' ? t.shop.purchaseFailed
    : status === 'success' ? (product === PASS_PRODUCT_ID ? t.pass.activated : t.shop.gemsArrived)
    : null;

  return { buy, check, message, status, busy: status === 'buying' || status === 'confirming', pending: status === 'pending' };
}
