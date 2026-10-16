import type { PurchaseAttempt } from '@/state/purchaseStore';

type Attempt = Pick<PurchaseAttempt, 'status' | 'errorCode' | 'transactionId'>;

/** The store rejected a new payment because an older item is owned. */
export const isOwnedRejection = (attempt: Attempt): boolean => attempt.errorCode === '6' && !attempt.transactionId;

/** Keep unconfirmed payments protected, while allowing another explicit store attempt after rejection. */
export const attemptBlocksPurchase = (attempt: Attempt): boolean => ['buying', 'confirming'].includes(attempt.status)
  || (attempt.status === 'pending' && !isOwnedRejection(attempt));
