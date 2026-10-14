import { COIN_PACKS, gemPack, PASS_PRODUCT_ID, type CoinPackId } from '@zombie-road/shared/catalog';
import type { BuyCoinsResult, ClaimResult, PassState, Wallet } from '@zombie-road/shared/api';
import type { PassTrack } from '@zombie-road/shared/pass';
import * as Crypto from 'expo-crypto';

import { api, hasApiToken } from '@/services/api';
import { purchase } from '@/services/purchases';
import { type AccountState, MAX_APPLIED, useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';

// Gemas, loja e Passe (GDD seção 19). O servidor manda nas gemas e no passe; as moedas que ele
// devolve o app soma no progresso uma vez só (lista `applied`).

const nextStage = () => useProgressStore.getState().highestCleared + 1;

/** Soma moedas de um pedido do servidor, só na primeira vez que ele chega. */
function applyCoins(key: string, coins: number): boolean {
  const { applied } = useAccountStore.getState();
  if (applied.includes(key)) return false;
  useProgressStore.getState().addCash(coins);
  useAccountStore.setState({ applied: [...applied, key].slice(-MAX_APPLIED) });
  return true;
}

export async function refreshEconomy(): Promise<void> {
  if (!hasApiToken()) return;
  try {
    const [wallet, pass] = await Promise.all([api<Wallet>('GET', '/wallet'), api<PassState>('GET', '/pass')]);
    useAccountStore.setState({ gems: wallet.gems, pass, online: true });
  } catch {
    useAccountStore.setState({ online: false });
  }
}

// O webhook do RevenueCat pode levar alguns segundos: confere a carteira algumas vezes.
const CONFIRMATION_MS = 60000;
const POLL_MS = 1000;

export function purchaseConfirmed(productId: string, before: AccountState, now: AccountState): boolean {
  if (!before.user || now.user?.id !== before.user.id) return false;
  if (productId === PASS_PRODUCT_ID) return now.pass?.premium === true;
  const pack = gemPack(productId);
  return !!pack && before.gems !== null && now.gems !== null && now.gems >= before.gems + pack.gems;
}

export type PurchaseResult = 'cancelled' | 'confirmed' | 'pending';

/** A loja concluir não significa que o webhook já entregou o produto. */
export async function buyProduct(productId: string, onPurchased?: () => void): Promise<PurchaseResult> {
  const before = useAccountStore.getState();
  if (!(await purchase(productId))) return 'cancelled';
  onPurchased?.();
  const deadline = Date.now() + CONFIRMATION_MS;
  while (true) {
    await refreshEconomy();
    const now = useAccountStore.getState();
    if (purchaseConfirmed(productId, before, now)) return 'confirmed';
    if (now.user?.id !== before.user?.id || Date.now() >= deadline) return 'pending';
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

export async function flushXp(): Promise<void> {
  const pending = useAccountStore.getState().pendingXp;
  if (!hasApiToken() || pending <= 0) return;
  try {
    const pass = await api<PassState>('POST', '/pass/xp', { amount: pending });
    useAccountStore.setState((s) => ({ pass, pendingXp: Math.max(0, s.pendingXp - pending) }));
  } catch {
    // Fica pendente para a próxima vez
  }
}
