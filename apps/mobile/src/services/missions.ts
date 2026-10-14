import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DailyState, MissionMatch, MissionId } from '@zombie-road/shared/missions';
import { api, hasApiToken } from '@/services/api';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
interface Queued extends MissionMatch { userId: string }
interface State { daily: DailyState | null; userId: string | null; queue: Queued[] }
export const useMissionStore = create<State>()(persist((): State => ({ daily: null, userId: null, queue: [] }), { name: 'zombie-road/missions', version: 1, storage: createJSONStorage(() => AsyncStorage) }));
function adopt(daily: DailyState, userId: string) {
 if (useAccountStore.getState().user?.id !== userId) return;
 useMissionStore.setState({ daily, userId });
 for (const grant of daily.coinGrants) useProgressStore.getState().applyServerCoins(`user:${userId}:mission:${grant.ref}`, grant.coins);
}
export function recordDaily(wins: number, kills: number, cards: number) {
 const userId = useAccountStore.getState().user?.id; if (!userId) return;
 useMissionStore.setState((s) => ({ queue: [...s.queue, { id: Crypto.randomUUID(), userId, wins, kills, cards }].slice(-50) }));
 void refreshMissions();
}
let busy = false;
export async function refreshMissions(): Promise<void> {
 const userId = useAccountStore.getState().user?.id;
 if (!userId || !hasApiToken() || busy) return;
 busy = true;
 try {
  for (const event of useMissionStore.getState().queue.filter((e) => e.userId === userId)) {
   const { userId: _user, ...body } = event;
   adopt(await api<DailyState>('POST', '/missions/match', body), userId);
   useMissionStore.setState((s) => ({ queue: s.queue.filter((e) => e.id !== event.id) }));
  }
  adopt(await api<DailyState>('GET', '/missions'), userId);
 } catch { /* Offline objectives synchronize on foreground. */ } finally { busy = false; }
}
export async function claimMission(id: MissionId): Promise<void> {
 const userId = useAccountStore.getState().user?.id; if (!userId) return;
 adopt(await api<DailyState>('POST', '/missions/claim', { id }), userId);
}
