import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Ajustes do jogador (GDD seção 17.2), salvos à parte do progresso. */
export interface Settings {
  sound: boolean;
  haptics: boolean;
  damageNumbers: boolean;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, damageNumbers: true };

interface SettingsStore extends Settings {
  setSetting(key: SettingKey, value: boolean): void;
}

function pick(state: Settings): Settings {
  const { sound, haptics, damageNumbers } = state;
  return { sound, haptics, damageNumbers };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set): SettingsStore => ({
      ...DEFAULT_SETTINGS,
      setSetting: (key: SettingKey, value: boolean) => set({ [key]: value }),
    }),
    {
      name: 'zombie-road/settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: pick,
    },
  ),
);
