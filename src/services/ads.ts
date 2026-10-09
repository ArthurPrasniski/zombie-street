import { create } from 'zustand';

import { KEYS, NATIVE } from '@/services/env';

// Propaganda premiada (AdMob): só quando o jogador escolhe ("Assista e dobre"). Antes, o pedido de
// consentimento (LGPD/GDPR e o aviso de rastreamento do iOS). No Expo Go, uma propaganda de teste
// desenhada pelo próprio app (FakeAdOverlay) faz o mesmo papel.

type AdsModule = typeof import('react-native-google-mobile-ads');
type Rewarded = import('react-native-google-mobile-ads').RewardedAd;

interface AdState {
  /** Há uma propaganda carregada pronta para mostrar. */
  ready: boolean;
  /** Propaganda de teste na tela (Expo Go): quando começou e quem espera o fim dela. */
  fake: { resolve: (rewarded: boolean) => void; startedAt: number } | null;
}
export const useAdStore = create<AdState>(() => ({ ready: !NATIVE, fake: null }));

// Nova tentativa de carregar depois de um erro (sem rede, sem anúncio disponível).
const RETRY_MS = 30000;

let ad: Rewarded | null = null;
let earned = false;
let finish: ((rewarded: boolean) => void) | null = null;

function load(mod: AdsModule): void {
  const unit = KEYS.admobRewarded || mod.TestIds.REWARDED;
  ad = mod.RewardedAd.createForAdRequest(unit);
  ad.addAdEventListener(mod.RewardedAdEventType.LOADED, () => useAdStore.setState({ ready: true }));
  ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
    earned = true;
  });
  ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
    useAdStore.setState({ ready: false });
    finish?.(earned);
    finish = null;
    load(mod);
  });
  ad.addAdEventListener(mod.AdEventType.ERROR, () => {
    useAdStore.setState({ ready: false });
    finish?.(false);
    finish = null;
    setTimeout(() => load(mod), RETRY_MS);
  });
  ad.load();
}

/** Pede o consentimento e começa a carregar a primeira propaganda. */
export async function initAds(): Promise<void> {
  if (!NATIVE) return;
  const mod = require('react-native-google-mobile-ads') as AdsModule;
  const consent = await mod.AdsConsent.gatherConsent().catch(() => null);
  if (consent && !consent.canRequestAds) return;
  await mod.default().initialize();
  load(mod);
}

/** Mostra a propaganda. true = assistiu até o fim (ganha o prêmio). */
export function showRewardedAd(): Promise<boolean> {
  if (!NATIVE) return new Promise((resolve) => useAdStore.setState({ fake: { resolve, startedAt: Date.now() } }));
  if (!ad || !useAdStore.getState().ready) return Promise.resolve(false);
  earned = false;
  return new Promise((resolve) => {
    finish = resolve;
    ad?.show().catch(() => {
      finish = null;
      resolve(false);
    });
  });
}
