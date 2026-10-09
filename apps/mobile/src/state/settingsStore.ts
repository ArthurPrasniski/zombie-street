import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PUSH_PREFS, type PushCategory, type PushPrefs } from '@zombie-road/shared/push';

/** Ajustes do jogador (GDD seção 17.2), salvos à parte do progresso. */
export interface Settings {
  sound: boolean;
  haptics: boolean;
  damageNumbers: boolean;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, damageNumbers: true };

interface SavedSettings extends Settings {
  /** Categorias de notificação ligadas (GDD seção 20). */
  push: PushPrefs;
  /** O app já perguntou se o jogador quer avisos (a pergunta aparece uma vez só). */
  pushAsked: boolean;
}

interface SettingsStore extends SavedSettings {
  setSetting(key: SettingKey, value: boolean): void;
  setPush(category: PushCategory, value: boolean): void;
  markPushAsked(): void;
}

function pick(state: SavedSettings): SavedSettings {
  const { sound, haptics, damageNumbers, push, pushAsked } = state;
  return { sound, haptics, damageNumbers, push, pushAsked };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set): SettingsStore => ({
      ...DEFAULT_SETTINGS,
      push: DEFAULT_PUSH_PREFS,
      pushAsked: false,
      setSetting: (key: SettingKey, value: boolean) => set({ [key]: value }),
      setPush: (category, value) => set((s) => ({ push: { ...s.push, [category]: value } })),
      markPushAsked: () => set({ pushAsked: true }),
    }),
    {
      name: 'zombie-road/settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: pick,
      // Categoria nova de notificação entra ligada nos ajustes já salvos
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<SavedSettings>;
        return { ...current, ...s, push: { ...DEFAULT_PUSH_PREFS, ...s.push } };
      },
    },
  ),
);
