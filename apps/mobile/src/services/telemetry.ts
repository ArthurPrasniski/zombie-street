import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api, hasApiToken } from '@/services/api';
import { useAccountStore } from '@/state/accountStore';
export type EventName = 'tutorial_started' | 'tutorial_completed' | 'stage_started' | 'stage_won' | 'stage_lost' | 'stage_abandoned' | 'purchase_delivered' | 'error';
interface Event { id: string; userId: string; name: EventName; data: { stage?: number; duration?: number; stars?: number; attempts?: number; deck?: string[] } }
interface State { enabled: boolean; queue: Event[]; eraseFor: string[] }
export const useTelemetryStore = create<State>()(persist((): State => ({ enabled: false, queue: [], eraseFor: [] }), { name: 'zombie-road/telemetry', version: 1, storage: createJSONStorage(() => AsyncStorage) }));
export function consentTelemetry(enabled: boolean): void {
  const userId = useAccountStore.getState().user?.id;
  useTelemetryStore.setState((s) => ({ enabled, queue: enabled ? s.queue : [], eraseFor: !enabled && userId ? [...new Set([...s.eraseFor, userId])] : s.eraseFor }));
  void flushTelemetry();
}
export function track(name: EventName, data: Event['data'] = {}): void {
  const userId = useAccountStore.getState().user?.id;
  if (!userId || !useTelemetryStore.getState().enabled) return;
  useTelemetryStore.setState((s) => ({ queue: [...s.queue, { id: Crypto.randomUUID(), userId, name, data }].slice(-100) }));
}
let busy = false;
export async function flushTelemetry(): Promise<void> {
  if (busy || !hasApiToken() || !useTelemetryStore.persist.hasHydrated()) return;
  const userId = useAccountStore.getState().user?.id;
  if (!userId) return;
  busy = true;
  try {
    if (useTelemetryStore.getState().eraseFor.includes(userId)) {
      await api('DELETE', '/events');
      useTelemetryStore.setState((s) => ({ eraseFor: s.eraseFor.filter((id) => id !== userId) }));
    }
    const events = useTelemetryStore.getState().queue.filter((e) => e.userId === userId).slice(0, 50);
    if (events.length && useTelemetryStore.getState().enabled) {
      await api('POST', '/events', { events: events.map(({ userId: _user, ...e }) => e) });
      useTelemetryStore.setState((s) => ({ queue: s.queue.filter((e) => !events.some((sent) => sent.id === e.id)) }));
    }
  } catch { /* Retry on foreground or next batch. No gameplay dependency. */ }
  finally { busy = false; }
}
