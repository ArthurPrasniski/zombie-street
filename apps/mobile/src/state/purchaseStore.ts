import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PurchaseStatus = 'buying' | 'confirming' | 'pending' | 'success' | 'error' | 'cancelled';
export interface PurchaseAttempt {
  id: string; userId: string; productId: string; transactionId: string | null;
  previousReceipts: string[]; startedAt: string; deliveredAt: string | null; status: PurchaseStatus;
}
interface State { attempts: PurchaseAttempt[]; put(attempt: PurchaseAttempt): void; update(id: string, patch: Partial<PurchaseAttempt>): void }
export const usePurchaseStore = create<State>()(persist((set) => ({
  attempts: [],
  put: (attempt) => set((s) => ({ attempts: [attempt, ...s.attempts.filter((a) => a.id !== attempt.id)].slice(0, 100) })),
  update: (id, patch) => set((s) => ({ attempts: s.attempts.map((a) => a.id === id ? { ...a, ...patch, id: a.id, userId: a.userId } : a) })),
}), { name: 'zombie-road/purchases', version: 1, storage: createJSONStorage(() => AsyncStorage), partialize: ({ attempts }) => ({ attempts }) }));
