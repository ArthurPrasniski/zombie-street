import { verify } from 'node:crypto';
import { HttpError } from '../errors';

export interface VerifiedAd { userId: string | null; requestId: string | null; transactionId: string; adUnit: string; earnedAt: Date }
type PublicKey = { keyId: number; pem: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';

/** Verify the original encoded bytes, before decoding or reordering query parameters. */
export function verifyAdSignature(rawUrl: string, keys: PublicKey[]): VerifiedAd {
  const raw = rawUrl.slice(rawUrl.indexOf('?') + 1);
  const parts = /^(.*)&signature=([A-Za-z0-9_%=-]+)&key_id=(\d+)$/.exec(raw);
  if (!parts) throw new HttpError(401, 'assinatura do anúncio inválida');
  const [, content, signature, keyId] = parts;
  const params = new URLSearchParams(content);
  if (new Set(params.keys()).size !== [...params.keys()].length || params.has('signature') || params.has('key_id')) throw new HttpError(401, 'parâmetros do anúncio inválidos');
  const key = keys.find((item) => String(item.keyId) === keyId);
  let valid = false;
  try { valid = !!key && verify('sha256', Buffer.from(content), key.pem, Buffer.from(decodeURIComponent(signature), 'base64url')); }
  catch { /* Malformed signatures are rejected without exposing crypto errors. */ }
  if (!valid) throw new HttpError(401, 'assinatura do anúncio inválida');
  const userId = params.get('user_id') ?? '';
  const requestId = params.get('custom_data') ?? '';
  const transactionId = params.get('transaction_id') ?? '';
  const timestamp = Number(params.get('timestamp'));
  const unit = params.get('ad_unit') ?? '';
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(transactionId) || !/^(?:ca-app-pub-\d{1,32}\/)?\d{1,32}$/.test(unit) || !Number.isSafeInteger(timestamp) || timestamp <= 0 || !Number.isFinite(new Date(timestamp).getTime())) throw new HttpError(400, 'dados do anúncio inválidos');
  const adUnit = unit.split('/').pop()!;
  // The same unit also serves replay/coin ads. Signed callbacks without a gem ticket grant nothing.
  if (!userId && !requestId) return { userId: null, requestId: null, transactionId, adUnit, earnedAt: new Date(timestamp) };
  if (!UUID.test(userId) || !UUID.test(requestId)) throw new HttpError(400, 'dados do anúncio inválidos');
  return { userId, requestId, transactionId, adUnit, earnedAt: new Date(timestamp) };
}

export function createAdVerifier() {
  let keys: PublicKey[] = [];
  let loadedAt = 0;
  let pending: Promise<void> | null = null;
  return async (rawUrl: string): Promise<VerifiedAd> => {
    if (!/[?&]signature=[^&]+&key_id=\d+$/.test(rawUrl)) throw new HttpError(401, 'assinatura do anúncio ausente');
    const keyId = new URLSearchParams(rawUrl.split('?')[1]).get('key_id');
    const age = Date.now() - loadedAt;
    if (!keys.length || age > 6 * 3600000 || (!keys.some((key) => String(key.keyId) === keyId) && age > 60000)) {
      pending ??= (async () => {
        const response = await fetch(KEY_URL, { signal: AbortSignal.timeout(5000), redirect: 'error' });
        if (!response.ok) throw new Error('keys unavailable');
        const result = await response.json() as { keys?: PublicKey[] };
        if (!Array.isArray(result.keys) || !result.keys.length || result.keys.some((key) => !Number.isSafeInteger(key.keyId) || typeof key.pem !== 'string')) throw new Error('invalid keys');
        keys = result.keys; loadedAt = Date.now();
      })().finally(() => { pending = null; });
      try { await pending; } catch { throw new HttpError(503, 'validação do anúncio temporariamente indisponível'); }
    }
    return verifyAdSignature(rawUrl, keys);
  };
}
