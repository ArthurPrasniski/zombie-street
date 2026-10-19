import { useEffect, useState } from 'react';
import { AppState, Image, View } from 'react-native';
import type { GemAdState } from '@zombie-road/shared/api';
import { usePersistHydrated } from '@/hooks/usePersistHydrated';
import { useMembershipActive } from '@/hooks/useMembershipActive';
import { gemRewardsText as t } from '@/i18n/gemRewards';
import { checkGemReward, earnGemReward, loadGemRewards, useGemRewardStore } from '@/services/gemRewards';
import { useAccountStore } from '@/state/accountStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Card } from '@/ui/kit/Card';
import { colors } from '@/ui/theme';
import { formatDateTime } from '@/utils/format';

export function GemRewardCard({ disabled, onBusyChange }: { disabled: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [snapshot, setSnapshot] = useState<{ userId: string | undefined; state: GemAdState | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ userId: string | undefined; message: string | null } | null>(null);
  const userId = useAccountStore((s) => s.user?.id);
  const state = snapshot?.userId === userId ? snapshot?.state : null;
  const note = feedback?.userId === userId ? feedback?.message : null;
  const setNote = (message: string | null) => setFeedback({ userId, message });
  const member = useMembershipActive();
  const pending = useGemRewardStore((s) => s.pending);
  const hydrated = usePersistHydrated(useGemRewardStore);
  const ownPending = pending?.userId === userId && !!pending;
  const verifying = ownPending && pending?.started;
  useEffect(() => {
    let active = true;
    const refresh = () => { void loadGemRewards().then((result) => { if (active) setSnapshot({ userId, state: result }); }).catch(() => { if (active) setSnapshot({ userId, state: null }); }); };
    refresh();
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', (value) => { if (value === 'active') refresh(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [userId]);
  const act = async () => {
    const owner = userId;
    setBusy(true); setNote(null);
    onBusyChange?.(true);
    try {
      const result = verifying ? await checkGemReward() : await earnGemReward();
      if (useAccountStore.getState().user?.id !== owner) return;
      setNote(t[result]);
      const next = await loadGemRewards();
      if (useAccountStore.getState().user?.id === owner) setSnapshot({ userId: owner, state: next });
    } catch { if (useAccountStore.getState().user?.id === owner) setNote(t.failed); }
    finally { setBusy(false); onBusyChange?.(false); }
  };
  return <Card color="#173d50" padding={16}>
    <View style={{ gap: 12 }}>
      <Image source={ICONS.gem} style={{ width: 48, height: 48 }} />
      <AppText variant="heading">{t.title}</AppText>
      {member || state?.member ? <AppText>{t.member}</AppText> : <>
        <AppText>{t.hint}</AppText>
        {state && <>
          <AppText variant="label" color={colors.yellow}>{t.reward(state.reward)}</AppText>
          <AppText>{t.left(state.remaining, state.limit)}</AppText>
          {state.remaining === 0 && <AppText>{t.limit}</AppText>}
          <AppText variant="small" color={colors.textMuted}>{t.reset(formatDateTime(state.resetsAt))}</AppText>
        </>}
        {(!state || !state.available) && <AppText>{t.unavailable}</AppText>}
        <Button label={busy ? t.busy : verifying ? t.check : t.watch} disabled={disabled || busy || !hydrated || (!ownPending && (!state?.available || !state.remaining))} onPress={() => { void act(); }} />
      </>}
      {note && <AppText accessibilityLiveRegion="polite" color={colors.yellow}>{note}</AppText>}
    </View>
  </Card>;
}
