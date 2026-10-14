import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CloudSave, MembershipState, PassState, PurchaseRecord, UserInfo } from '@zombie-road/shared/api';

/** Conta, carteira e passe (cópia do que o servidor diz) e o estado do save na nuvem. */
export interface AccountState {
  user: UserInfo | null;
  /** O servidor respondeu da última vez. */
  online: boolean;
  gems: number | null;
  pass: PassState | null;
  membership: MembershipState | null;
  purchases: PurchaseRecord[];
  syncStatus: 'idle' | 'saving' | 'saved' | 'conflict' | 'error';
  /** Revisão da nuvem em que o progresso local se baseia e o "hash" do que foi enviado. */
  cloud: { revision: number; syncedHash: string | null; syncedAt: string | null };
  /** Os dois lados mudaram: o jogador escolhe qual save fica (não é salvo). */
  conflict: CloudSave | null;
  /** XP do passe ganho sem conexão, para mandar depois. */
  pendingXp: number;
  xpRequest: { id: string; amount: number } | null;
  /** Pedidos de moedas (loja e passe) já somados no progresso: evita somar duas vezes. */
  applied: string[];
  /** "Assista e dobre" usados hoje. */
  ads: { day: string; count: number };
}

export const INITIAL_ACCOUNT: AccountState = {
  user: null,
  online: false,
  gems: null,
  pass: null,
  membership: null,
  purchases: [],
  syncStatus: 'idle',
  cloud: { revision: 0, syncedHash: null, syncedAt: null },
  conflict: null,
  pendingXp: 0,
  xpRequest: null,
  applied: [],
  ads: { day: '', count: 0 },
};

// Guarda só os últimos pedidos (os antigos já não voltam)
export const MAX_APPLIED = 100;

export const useAccountStore = create<AccountState>()(
  persist(() => INITIAL_ACCOUNT, {
    name: 'zombie-road/account',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: ({ user, gems, pass, membership, cloud, pendingXp, xpRequest, applied, ads }) => ({ user, gems, pass, membership, cloud, pendingXp, xpRequest, applied, ads }),
  }),
);
