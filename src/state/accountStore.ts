import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CloudSave, PassState, UserInfo } from '@shared/api';

/** Conta, carteira e passe (cópia do que o servidor diz) e o estado do save na nuvem. */
export interface AccountState {
  user: UserInfo | null;
  /** O servidor respondeu da última vez. */
  online: boolean;
  gems: number | null;
  pass: PassState | null;
  /** Revisão da nuvem em que o progresso local se baseia e o "hash" do que foi enviado. */
  cloud: { revision: number; syncedHash: string | null; syncedAt: string | null };
  /** Os dois lados mudaram: o jogador escolhe qual save fica (não é salvo). */
  conflict: CloudSave | null;
  /** XP do passe ganho sem conexão, para mandar depois. */
  pendingXp: number;
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
  cloud: { revision: 0, syncedHash: null, syncedAt: null },
  conflict: null,
  pendingXp: 0,
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
    partialize: ({ user, gems, pass, cloud, pendingXp, applied, ads }) => ({ user, gems, pass, cloud, pendingXp, applied, ads }),
  }),
);
