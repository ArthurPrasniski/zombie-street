import { track } from '@/services/telemetry';
import { isMembershipProduct, MEMBERSHIP } from '@zombie-road/shared/catalog';
import type { PurchaseRecord } from '@zombie-road/shared/api';
import { useAccountStore } from '@/state/accountStore';
import { type PurchaseAttempt, usePurchaseStore } from '@/state/purchaseStore';

/** User-reviewed attempts without a receipt may be released without changing balances. */
export function releaseUnchargedAttempt(id: string): void {
  const attempt = usePurchaseStore.getState().attempts.find((a) => a.id === id);
  if (attempt?.userId !== useAccountStore.getState().user?.id || attempt?.status !== 'pending' || attempt.transactionId || attempt.errorCode === '6') return;
  usePurchaseStore.getState().update(id, { status: 'error' });
}

export function matchingReceipt(attempt: Pick<PurchaseAttempt, 'transactionId' | 'productId' | 'previousReceipts'>, records: PurchaseRecord[]): PurchaseRecord | undefined {
  const id = isMembershipProduct(attempt.productId) ? MEMBERSHIP.productId : attempt.productId;
  return records.find((r) => !r.refunded && r.productId === id && (attempt.transactionId ? r.transactionId === attempt.transactionId : !attempt.previousReceipts.includes(r.transactionId)));
}

/** Reconciliado na abertura, no retorno ao app e nas consultas periódicas da carteira. */
export function reconcilePurchases(): void {
  const account = useAccountStore.getState();
  for (const attempt of usePurchaseStore.getState().attempts) {
    if (attempt.userId !== account.user?.id || !['confirming', 'pending'].includes(attempt.status)) continue;
    const receipt = matchingReceipt(attempt, account.purchases);
    if (receipt) {
      usePurchaseStore.getState().update(attempt.id, { status: 'success', transactionId: receipt.transactionId, deliveredAt: receipt.deliveredAt });
      track('purchase_delivered', { duration: Math.min(86400, Math.max(0, (Date.now() - Date.parse(attempt.startedAt)) / 1000)) });
    }
  }
}
