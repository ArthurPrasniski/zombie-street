type AdsModule = typeof import('react-native-google-mobile-ads');

/** A separate ad binds Google's SSV callback to this server reservation. */
export function displayVerifiedAd(mod: AdsModule, unitId: string, userId: string, requestId: string, canShow: () => boolean = () => true): Promise<boolean> {
  const ad = mod.RewardedAd.createForAdRequest(unitId, { serverSideVerificationOptions: { userId, customData: requestId } });
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const listeners: (() => void)[] = [];
    const done = (rewarded: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      listeners.forEach((unsubscribe) => unsubscribe());
      resolve(rewarded);
    };
    const timeout = setTimeout(() => done(false), 45000);
    listeners.push(ad.addAdEventListener(mod.RewardedAdEventType.LOADED, () => {
      if (!canShow()) { done(false); return; }
      clearTimeout(timeout);
      void ad.show().catch(() => done(false));
    }));
    listeners.push(ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => { earned = true; }));
    listeners.push(ad.addAdEventListener(mod.AdEventType.CLOSED, () => done(earned)));
    listeners.push(ad.addAdEventListener(mod.AdEventType.ERROR, () => done(false)));
    ad.load();
  });
}
