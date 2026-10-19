import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Crypto from 'expo-crypto';
import type { GemAdState, GemAdTicket } from '@zombie-road/shared/api';
import { api } from '@/services/api';
import { showGemRewardedAd } from '@/services/ads';
import { NATIVE } from '@/services/env';
import { useAccountStore } from '@/state/accountStore';

type Pending = { userId: string; requestId: string; started?: boolean };
export const useGemRewardStore = create<{ pending: Pending | null }>()(persist(() => ({ pending: null as Pending | null }), {
  name: 'zombie-road/gem-reward', version: 1, storage: createJSONStorage(() => AsyncStorage),
}));
let running = false;
const sameUser = (id: string) => useAccountStore.getState().user?.id === id;
export const loadGemRewards = () => api<GemAdState>('GET', '/rewards/gems');

async function check(pending: Pending): Promise<GemAdTicket> {
  const result = await api<GemAdTicket>('GET', `/rewards/gems/${pending.requestId}`);
  if (!sameUser(pending.userId)) throw new Error('conta alterada');
  if (result.status === 'earned') useAccountStore.setState({ gems: result.gems });
  if (result.status !== 'pending' || new Date(result.expiresAt).getTime() <= Date.now()) {
    if (useGemRewardStore.getState().pending?.requestId === pending.requestId) useGemRewardStore.setState({ pending: null });
  }
  return result;
}

export async function checkGemReward(): Promise<'earned' | 'pending' | 'cancelled'> {
  const pending = useGemRewardStore.getState().pending;
  if (!pending || !sameUser(pending.userId)) return 'cancelled';
  try { return (await check(pending)).status; }
  catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    if (useGemRewardStore.getState().pending?.requestId === pending.requestId) useGemRewardStore.setState({ pending: null });
    return 'cancelled';
  }
}

/** No client-side gem credits: wait for the verified SSV callback. */
export async function earnGemReward(): Promise<'earned' | 'pending' | 'cancelled'> {
  if (running) return 'pending';
  const userId = useAccountStore.getState().user?.id;
  if (!userId) throw new Error('sem sessão');
  const existing = useGemRewardStore.getState().pending;
  if (existing?.userId === userId && existing.started) return checkGemReward();
  running = true;
  const pending: Pending = existing?.userId === userId ? existing : { userId, requestId: Crypto.randomUUID(), started: false };
  useGemRewardStore.setState({ pending });
  try {
    const reserved = await api<GemAdTicket>('POST', '/rewards/gems', { requestId: pending.requestId });
    if (!sameUser(userId)) return 'pending';
    if (reserved.status !== 'pending') return (await check(pending)).status;
    if (new Date(reserved.expiresAt).getTime() <= Date.now()) { useGemRewardStore.setState({ pending: null }); return 'cancelled'; }
    useGemRewardStore.setState({ pending: { ...pending, started: true } });
    const rewarded = await showGemRewardedAd(userId, pending.requestId);
    if (!sameUser(userId)) return 'pending';
    if (!rewarded) {
      await api('DELETE', `/rewards/gems/${pending.requestId}`);
      // A valid SSV callback can still win a close/callback race.
      const result = await check(pending);
      return result.status === 'earned' ? 'earned' : 'cancelled';
    }
    if (!NATIVE) await api('POST', `/dev/rewards/gems/${pending.requestId}`);
    const deadline = Date.now() + 20000;
    do {
      if (!sameUser(userId)) return 'pending';
      const result = await check(pending);
      if (result.status !== 'pending') return result.status;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (Date.now() < deadline);
    return 'pending';
  } catch (error) {
    // Definite rejected reservations can be retried; lost responses keep their ticket.
    const code = (error as { status?: number }).status;
    if (code && [400, 401, 403, 404, 409, 429, 503].includes(code) && useGemRewardStore.getState().pending?.requestId === pending.requestId) useGemRewardStore.setState({ pending: null });
    throw error;
  } finally { running = false; }
}
