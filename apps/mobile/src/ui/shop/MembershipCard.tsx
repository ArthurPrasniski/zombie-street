import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { MEMBERSHIP } from '@zombie-road/shared/catalog';

import { useMembershipActive } from '@/hooks/useMembershipActive';
import { t } from '@/i18n';
import { refreshEconomy } from '@/services/economy';
import { NATIVE } from '@/services/env';
import { manageSubscriptions, restorePurchases } from '@/services/purchases';
import { useAccountStore } from '@/state/accountStore';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Card } from '@/ui/kit/Card';
import { colors, radius } from '@/ui/theme';
import { formatDate, formatInt } from '@/utils/format';

export function MembershipCard({ price, disabled, onBuy }: { price: string | null; disabled: boolean; onBuy: () => void }) {
  const active = useMembershipActive();
  const membership = useAccountStore((s) => s.membership);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const action = async (restore: boolean) => {
    setBusy(true);
    setNote(null);
    try {
      if (restore) {
        await restorePurchases();
        await refreshEconomy();
        setNote(t.membership.restorePending);
      } else {
        await manageSubscriptions();
      }
    } catch {
      setNote(t.shop.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card color="#174b48" style={styles.card} padding={16}>
      <View style={styles.body}>
      <View style={styles.header}>
        <Image source={ICONS.shield} style={styles.icon} />
        <View style={styles.title}>
          <AppText variant="eyebrow">{t.membership.subtitle}</AppText>
          <AppText variant="title">{t.membership.title}</AppText>
        </View>
      </View>
      <AppText variant="label" color={colors.yellow}>{t.membership.rewards(formatInt(MEMBERSHIP.gems), formatInt(MEMBERSHIP.coins))}</AppText>
      <AppText>{t.membership.noAds}</AppText>
      {active && membership?.expiresAt ? (
        <>
          <AppText variant="label" color={colors.accent}>{t.membership.activeUntil(formatDate(membership.expiresAt))}</AppText>
          <AppText variant="small">{membership.autoRenew ? t.membership.renewal : t.membership.cancelled}</AppText>
        </>
      ) : (
        <Button label={price ? t.membership.buy(price) : t.shop.priceUnavailable} disabled={disabled || busy || !price} onPress={onBuy} />
      )}
      <AppText variant="small" color={colors.textMuted}>{t.membership.terms}</AppText>
      {NATIVE && (
        <View style={styles.actions}>
          <Button label={t.membership.restore} variant="dark" size="s" disabled={busy || disabled} onPress={() => { void action(true); }} />
          {active && <Button label={t.membership.manage} variant="dark" size="s" disabled={busy || disabled} onPress={() => { void action(false); }} />}
        </View>
      )}
      {note && <AppText accessibilityLiveRegion="polite" color={colors.yellow}>{note}</AppText>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.l },
  body: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1 },
  icon: { width: 44, height: 44 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
