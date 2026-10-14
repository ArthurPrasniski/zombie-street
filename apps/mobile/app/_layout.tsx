import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { useMissionStore } from '@/services/missions';
import { useTelemetryStore } from '@/services/telemetry';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { useAccountSync } from '@/hooks/useAccountSync';
import { usePushSync } from '@/hooks/usePushSync';
import { useProgressHydrated, useProgressStore } from '@/state/progressStore';
import { SaveConflictModal } from '@/ui/account/SaveConflictModal';
import { FakeAdOverlay } from '@/ui/FakeAdOverlay';
import { colors, fonts } from '@/ui/theme';
import { usePersistHydrated } from '@/hooks/usePersistHydrated';
import { usePurchaseRecovery } from '@/hooks/usePurchaseRecovery';
import { usePurchaseStore } from '@/state/purchaseStore';
import { useAccountStore } from '@/state/accountStore';
import { View, Text, Pressable } from 'react-native';
import { reliabilityText } from '@/i18n/reliability';
import { useSettingsStore } from '@/state/settingsStore';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, primary: colors.accent },
};

/** Layout raiz: carrega as fontes (Lilita One e Rubik) e o progresso salvo antes de mostrar o app. */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.medium]: require('@/assets/fonts/Rubik-Medium.ttf'),
    [fonts.bold]: require('@/assets/fonts/Rubik-Bold.ttf'),
    [fonts.black]: require('@/assets/fonts/Rubik-Black.ttf'),
    [fonts.display]: require('@/assets/fonts/LilitaOne-Regular.ttf'),
    GoogleSans: require('@/assets/fonts/GoogleSans.ttf'),
  });
  const [loadTimeout, setLoadTimeout] = useState(false);
  const hydrated = useProgressHydrated();
  const purchasesHydrated = usePersistHydrated(usePurchaseStore);
  const missionsHydrated = usePersistHydrated(useMissionStore);
  const telemetryHydrated = usePersistHydrated(useTelemetryStore);
  const accountHydrated = usePersistHydrated(useAccountStore);
  const preferredLanguage = useSettingsStore((s) => s.language);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const appliedLanguage = useAppLanguage();
  const settingsHydrated = usePersistHydrated(useSettingsStore);
  // Se a fonte falhar, segue com a do sistema em vez de travar na splash.
  const ready = (fontsLoaded || fontError !== null) && hydrated && purchasesHydrated && accountHydrated && settingsHydrated && missionsHydrated && telemetryHydrated && appliedLanguage === preferredLanguage;
  // Conta, save na nuvem e propagandas (docs/BACKEND.md)
  useAccountSync(ready);
  // Notificações locais e remotas (GDD seção 20)
  usePushSync(ready);
  usePurchaseRecovery(ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => { setLoadTimeout(true); void SplashScreen.hideAsync(); }, 12000);
    return () => clearTimeout(timer);
  }, [ready]);
  if (!ready && loadTimeout) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24, gap: 20 }}>
    <Text style={{ color: colors.text }}>{reliabilityText.startup}</Text>
    <Pressable onPress={() => { for (const store of [useProgressStore, usePurchaseStore, useAccountStore, useSettingsStore, useMissionStore, useTelemetryStore]) void store.persist.rehydrate(); }}><Text style={{ color: colors.accent }}>{reliabilityText.retry}</Text></Pressable>
  </View>;
  if (!ready) return null;
  return (
    <ThemeProvider value={theme}>
      <ReducedMotionConfig mode={reducedMotion ? ReduceMotion.Always : ReduceMotion.System} />
      <StatusBar style="light" hidden />
      <Stack key={preferredLanguage} screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.background } }} />
      <SaveConflictModal />
      <FakeAdOverlay />
    </ThemeProvider>
  );
}
