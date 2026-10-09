import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Onde o app está rodando e as chaves dos serviços (variáveis EXPO_PUBLIC_*; ver .env.example).

/** Expo Go: sem login nativo, compras nem propagandas; os serviços usam a versão simulada. */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Serviços nativos de verdade (development build ou build da loja). */
export const NATIVE = !IS_EXPO_GO && Platform.OS !== 'web';

/** Endereço do servidor; sem ele, o jogo fica só offline (sem conta, loja nem passe). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? null;

export const KEYS = {
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  revenueCat: Platform.select({ ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY }) ?? '',
  admobRewarded: Platform.select({ ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS, android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID }) ?? '',
};
