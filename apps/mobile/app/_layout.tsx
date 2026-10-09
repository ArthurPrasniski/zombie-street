import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAccountSync } from '@/hooks/useAccountSync';
import { usePushSync } from '@/hooks/usePushSync';
import { useProgressHydrated } from '@/state/progressStore';
import { SaveConflictModal } from '@/ui/account/SaveConflictModal';
import { FakeAdOverlay } from '@/ui/FakeAdOverlay';
import { colors, fonts } from '@/ui/theme';

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
  });
  const hydrated = useProgressHydrated();
  // Se a fonte falhar, segue com a do sistema em vez de travar na splash.
  const ready = (fontsLoaded || fontError !== null) && hydrated;
  // Conta, save na nuvem e propagandas (docs/BACKEND.md)
  useAccountSync(ready);
  // Notificações locais e remotas (GDD seção 20)
  usePushSync(ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" hidden />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.background } }} />
      <SaveConflictModal />
      <FakeAdOverlay />
    </ThemeProvider>
  );
}
