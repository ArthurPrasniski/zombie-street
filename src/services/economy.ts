import { COIN_PACKS, type CoinPackId } from '@shared/catalog';
import type { BuyCoinsResult, ClaimResult, PassState, Wallet } from '@shared/api';
import type { PassTrack } from '@shared/pass';
import * as Crypto from 'expo-crypto';

import { api, hasApiToken } from '@/services/api';
import { purchase } from '@/services/purchases';
import { MAX_APPLIED, useAccountStore } from '@/state/accountStore';
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
const POLLS = 8;
const POLL_MS = 1500;

/** Compra de gemas ou do passe na loja. Espera o servidor confirmar. false = cancelou. */
export async function buyProduct(productId: string): Promise<boolean> {
  const before = useAccountStore.getState();
  if (!(await purchase(productId))) return false;
  for (let i = 0; i < POLLS; i++) {
    await refreshEconomy();
    const now = useAccountStore.getState();
    if ((now.gems ?? 0) !== (before.gems ?? 0) || now.pass?.premium !== before.pass?.premium) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return true;
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
