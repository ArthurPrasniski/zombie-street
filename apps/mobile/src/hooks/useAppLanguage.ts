import { create } from 'zustand';
import { applyAppLanguage } from '@/i18n/appLanguage';
import { useSettingsStore } from '@/state/settingsStore';
const useLanguageReady = create<{ applied: string | null }>(() => ({ applied: null }));
function apply() {
 const value = useSettingsStore.getState().language;
 applyAppLanguage(value); useLanguageReady.setState({ applied: value });
}
useSettingsStore.persist.onFinishHydration(apply);
useSettingsStore.subscribe((state, previous) => { if (useSettingsStore.persist.hasHydrated() && state.language !== previous.language) apply(); });
if (useSettingsStore.persist.hasHydrated()) apply();
export const useAppLanguage = () => useLanguageReady((s) => s.applied);
