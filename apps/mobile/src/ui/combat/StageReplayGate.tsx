import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { initAds, showRewardedAd, useAdStore } from '@/services/ads';
import { adsRemoved } from '@/services/membership';
import { useMembershipActive } from '@/hooks/useMembershipActive';
import { requiresReplayAd } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors } from '@/ui/theme';

/** O motor só monta depois da autorização. Cada repetição monta um gate novo. */
export function StageReplayGate({ stage, survival, children }: { stage: number; survival: boolean; children: ReactNode }) {
  const [allowed, setAllowed] = useState(() => survival || adsRemoved() || !requiresReplayAd(useProgressStore.getState(), stage));
  const member = useMembershipActive();
  const ready = useAdStore((s) => s.ready);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const running = useRef(false);
  useEffect(() => {
    if (!allowed && !member) void initAds().catch(() => null);
  }, [allowed, member]);
  const watch = async () => {
    if (running.current) return;
    if (adsRemoved()) { setAllowed(true); return; }
    running.current = true;
    setBusy(true);
    setError(false);
    try {
      if (await showRewardedAd()) setAllowed(true);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  if (allowed) return children;
  return (
    <View style={styles.screen}>
      <GameModal title={t.ads.replayTitle} buttons={
        <>
          <Button label={t.common.back} variant="dark" disabled={busy} onPress={() => router.back()} />
          <Button label={member ? t.membership.play : t.ads.replayWatch} disabled={busy || (!member && !ready)} onPress={watch} />
        </>
      }>
        <AppText style={styles.center}>{member ? t.membership.noAds : t.ads.replayBody}</AppText>
        {(busy || (!ready && !member)) && <ActivityIndicator color={colors.yellow} />}
        {!ready && !busy && !member && <AppText style={styles.center} color={colors.textMuted}>{t.ads.replayUnavailable}</AppText>}
        {error && <AppText style={styles.center} color={colors.danger} accessibilityLiveRegion="polite">{t.ads.replayIncomplete}</AppText>}
      </GameModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { textAlign: 'center' },
});
