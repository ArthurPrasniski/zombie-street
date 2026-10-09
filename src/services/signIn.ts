import { Platform } from 'react-native';

import { KEYS, NATIVE } from '@/services/env';

// Login nativo do Google e da Apple: devolve o token que o servidor confere. No Expo Go não há
// login nativo: devolve "dev:..." (o servidor só aceita isso em modo de desenvolvimento).

export type ProviderToken = { token: string; name?: string | null } | null;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');
type AppleModule = typeof import('expo-apple-authentication');

let googleConfigured = false;

function google(): GoogleModule {
  const mod = require('@react-native-google-signin/google-signin') as GoogleModule;
  if (!googleConfigured) {
    mod.GoogleSignin.configure({ webClientId: KEYS.googleWebClientId, iosClientId: KEYS.googleIosClientId || undefined });
    googleConfigured = true;
  }
  return mod;
}

/** Token do Google, ou null se o jogador cancelou. */
export async function googleToken(): Promise<ProviderToken> {
  if (!NATIVE) return { token: 'dev:google' };
  const { GoogleSignin, isSuccessResponse } = google();
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (!isSuccessResponse(res)) return null;
  if (!res.data.idToken) throw new Error('O Google não devolveu o token: confira o Web client ID');
  return { token: res.data.idToken };
}

export async function googleSignOut(): Promise<void> {
  if (NATIVE) await google().GoogleSignin.signOut().catch(() => null);
}

/** "Entrar com Apple" só existe no iOS. */
export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (!NATIVE) return true;
  return (require('expo-apple-authentication') as AppleModule).isAvailableAsync();
}

/** Token da Apple (e o nome, que ela só manda no primeiro login), ou null se cancelou. */
export async function appleToken(): Promise<ProviderToken> {
  if (!NATIVE) return { token: 'dev:apple', name: 'Jogador Apple' };
  const Apple = require('expo-apple-authentication') as AppleModule;
  try {
    const cred = await Apple.signInAsync({ requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL] });
    if (!cred.identityToken) throw new Error('A Apple não devolveu o token');
    const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ') || null;
    return { token: cred.identityToken, name };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}
