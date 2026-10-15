/** A definitive rejection before a transaction exists can be retried safely. */
export class PurchaseNotStartedError extends Error {
  constructor(readonly code: string) {
    super('Compra não iniciada');
  }
}
