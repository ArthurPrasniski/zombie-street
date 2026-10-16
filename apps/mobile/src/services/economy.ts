import { COIN_PACKS, type CoinPackId } from '@zombie-road/shared/catalog';
import type { BuyCoinsResult, ClaimResult, MembershipState, PassState, PurchaseHistory, Wallet } from '@zombie-road/shared/api';
import type { PassTrack } from '@zombie-road/shared/pass';
import * as Crypto from 'expo-crypto';

import { api, hasApiToken } from '@/services/api';
import { identifyPurchaser, purchase, syncStorePurchases } from '@/services/purchases';
import { type AccountState, MAX_APPLIED, useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { syncMembershipCoins } from '@/services/membership';
import { matchingReceipt, reconcilePurchases } from '@/services/purchaseRecovery';
import { usePurchaseStore } from '@/state/purchaseStore';
import { PurchaseNotStartedError } from '@/services/purchaseErrors';
import { storeErrorCode } from '@/services/storeDiagnostics';
import { attemptBlocksPurchase } from '@/services/purchaseAttempt';

// Gemas, loja e Passe (GDD seção 19). O servidor manda nas gemas e no passe; as moedas que ele
// devolve o app soma no progresso uma vez só (lista `applied`).

const nextStage = () => useProgressStore.getState().highestCleared + 1;

/** Soma moedas de um pedido do servidor, só na primeira vez que ele chega. */
function applyCoins(key: string, coins: number): boolean {
  const { applied } = useAccountStore.getState();
  const userId = useAccountStore.getState().user?.id;
  if (!userId) return false;
  const scoped = `user:${userId}:${key}`;
  if (applied.includes(key)) { useProgressStore.getState().applyServerCoins(scoped,0); return false; }
  if (!useProgressStore.getState().applyServerCoins(scoped, coins)) return false;
  useAccountStore.setState({ applied: [...applied, scoped].slice(-MAX_APPLIED) });
  return true;
}

export async function refreshEconomy(): Promise<void> {
  if (!hasApiToken()) return;
  const userId = useAccountStore.getState().user?.id;
  try {
    const [wallet, pass, membership, history] = await Promise.all([api<Wallet>('GET', '/wallet'), api<PassState>('GET', '/pass'), api<MembershipState>('GET', '/membership'), api<PurchaseHistory>('GET', '/purchases')]);
    if (useAccountStore.getState().user?.id !== userId) return;
    useAccountStore.setState({ gems: wallet.gems, pass, membership, purchases: history.records, online: true });
    syncMembershipCoins();
    if (pass.cosmeticGrants?.length) useProgressStore.setState((s) => ({ seasonCosmetics: [...new Set([...s.seasonCosmetics, ...pass.cosmeticGrants!])] }));
    for (const grant of pass.coinGrants ?? []) applyCoins(`pass:${grant.ref}`, grant.coins);
    reconcilePurchases();
  } catch {
    if (useAccountStore.getState().user?.id === userId) useAccountStore.setState({ online: false });
  }
}

/** Manual recovery checks the store as well as the server's delivered receipts. */
export async function recoverStorePurchases(): Promise<void> {
  const userId = useAccountStore.getState().user?.id;
  if (!userId) return;
  await syncStorePurchases(userId);
  if (useAccountStore.getState().user?.id === userId) await refreshEconomy();
}

// O webhook do RevenueCat pode levar alguns segundos: confere a carteira algumas vezes.
const CONFIRMATION_MS = 60000;
const POLL_MS = 1000;

export function purchaseConfirmed(productId: string, before: AccountState, now: AccountState): boolean {
  if (!before.user || now.user?.id !== before.user.id) return false;
  return !!matchingReceipt({ productId, transactionId: null, previousReceipts: (before.purchases ?? []).map((r) => r.transactionId) }, now.purchases ?? []);
}

export type PurchaseResult = 'cancelled' | 'confirmed' | 'pending' | 'owned' | 'refunded';

/** A loja concluir não significa que o webhook já entregou o produto. */
export async function buyProduct(productId: string, onPurchased?: () => void): Promise<PurchaseResult> {
  const before = useAccountStore.getState();
  if (!before.user) throw new Error('sem sessão');
  if (usePurchaseStore.getState().attempts.some((a) => a.userId === before.user!.id && attemptBlocksPurchase(a) && (a.status !== 'pending' || a.productId === productId))) return 'pending';
  await identifyPurchaser(before.user.id);
  const history = await api<PurchaseHistory>('GET', '/purchases');
  if (useAccountStore.getState().user?.id !== before.user.id) throw new Error('conta mudou');
  const id = Crypto.randomUUID();
  const attempt = { id, userId: before.user.id, productId, transactionId: null, previousReceipts: history.records.map((r) => r.transactionId), startedAt: new Date().toISOString(), deliveredAt: null, status: 'buying' as const };
  usePurchaseStore.getState().put(attempt);
  try {
    if (!(await purchase(productId, (transactionId) => usePurchaseStore.getState().update(id, { transactionId })))) {
      usePurchaseStore.getState().update(id, { status: 'cancelled' });
      return 'cancelled';
    }
  } catch (error) {
    const hasReceipt = usePurchaseStore.getState().attempts.find((a) => a.id === id)?.transactionId;
    const owned = storeErrorCode(error) === '6' && !hasReceipt;
    usePurchaseStore.getState().update(id, { status: (error instanceof PurchaseNotStartedError || owned) && !hasReceipt ? 'error' : 'pending', errorCode: storeErrorCode(error) });
    if (storeErrorCode(error) === '6') {
      await refreshEconomy();
      return owned ? 'owned' : 'pending';
    }
    throw error;
  }
  usePurchaseStore.getState().update(id, { status: 'confirming' });
  onPurchased?.();
  const deadline = Date.now() + CONFIRMATION_MS;
  while (true) {
    await refreshEconomy();
    const now = useAccountStore.getState();
    const current = usePurchaseStore.getState().attempts.find((a) => a.id === id)!;
    if (current.status === 'success') return 'confirmed';
    if (current.status === 'refunded') return 'refunded';
    if (now.user?.id !== before.user?.id || Date.now() >= deadline) { usePurchaseStore.getState().update(id, { status: 'pending' }); return 'pending'; }
    await new Promise((r) => setTimeout(r, Math.min(POLL_MS, deadline - Date.now())));
  }
}

/** Troca gemas por moedas. O mesmo `requestId` pode ser repetido sem cobrar duas vezes. */
export async function buyCoins(pack: CoinPackId): Promise<number> {
  if ((useAccountStore.getState().gems ?? 0) < COIN_PACKS[pack].gems) throw new Error('gemas insuficientes');
  const result = await api<BuyCoinsResult>('POST', '/shop/coins', { pack, stage: nextStage(), requestId: Crypto.randomUUID() });
  applyCoins(`coins:${result.requestId}`, result.coins);
  useAccountStore.setState({ gems: result.gems });
  return result.coins;
}

/** Resgata o prêmio do nível do passe (moedas entram no progresso; gemas, na carteira). */
export async function claimPass(tier: number, track: PassTrack): Promise<ClaimResult> {
  const result = await api<ClaimResult>('POST', '/pass/claim', { tier, track, stage: nextStage() });
  if (result.reward.kind === 'coins') applyCoins(`pass:${result.pass.season}:${track}:${tier}`, result.reward.amount);
  useAccountStore.setState({ pass: result.pass, gems: result.gems });
  return result;
}

/** XP do passe de uma partida: manda agora ou guarda para quando houver conexão. */
export async function addPassXp(amount: number): Promise<void> {
  useAccountStore.setState((s) => ({ pendingXp: s.pendingXp + amount }));
  await flushXp();
}

let sendingXp: Promise<void> | null = null;
export function flushXp(): Promise<void> {
  if (sendingXp) return sendingXp;
  const userId = useAccountStore.getState().user?.id;
  sendingXp = sendXp().finally(() => { sendingXp = null; const s = useAccountStore.getState(); if (hasApiToken() && s.user?.id === userId && !s.xpRequest && s.pendingXp > 0) void flushXp(); });
  return sendingXp;
}
async function sendXp(): Promise<void> {
  const state = useAccountStore.getState();
  if (!hasApiToken() || state.pendingXp <= 0) return;
  const request = state.xpRequest ?? { id: Crypto.randomUUID(), amount: Math.min(10000,state.pendingXp) };
  useAccountStore.setState({ xpRequest: request });
  try {
    const pass = await api<PassState>('POST','/pass/xp',{ amount: request.amount, requestId: request.id });
    if (useAccountStore.getState().user?.id !== state.user?.id) return;
    useAccountStore.setState((s) => ({ pass, xpRequest: null, pendingXp: Math.max(0,s.pendingXp - request.amount) }));
  } catch { /* Preserve request ID and amount for retry after a lost response. */ }
}

/** Cada resgate é idempotente; interromper permite retomar os restantes. */
export async function claimAllPass(): Promise<void> {
  const pass = useAccountStore.getState().pass;
  if (!pass) return;
  for (let tier = 1; tier <= pass.tier; tier++) {
    if (!pass.claimedFree.includes(tier)) await claimPass(tier, 'free');
    if (pass.premium && !pass.claimedPremium.includes(tier)) await claimPass(tier, 'premium');
  }
}
