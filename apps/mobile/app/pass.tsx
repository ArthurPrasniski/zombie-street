import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';
import { canClaim, PASS_DAILY_XP, PASS_TIERS, passReward, type PassTrack, XP_PER_TIER } from '@zombie-road/shared/pass';

import { t as pt } from '@/i18n';
import { formatDate, formatDateTime } from '@/utils/format';
import { useProductPrices } from '@/hooks/useProductPrices';
import { useProductPurchase } from '@/hooks/useProductPurchase';
import { resultsText } from '@/i18n/results';
import { claimAllPass, claimPass, refreshEconomy } from '@/services/economy';
import { purchasesAvailable } from '@/services/purchases';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { GemPill } from '@/ui/GemLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { Segments } from '@/ui/kit/Pill';
import { type CellState, TierRow } from '@/ui/pass/TierRow';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors, radius } from '@/ui/theme';

const DAY_MS = 24 * 3600 * 1000;
const TIERS = Array.from({ length: PASS_TIERS }, (_, i) => i + 1);
const PASS_PRODUCT_IDS = [PASS_PRODUCT_ID];

const dateBR = formatDate;

/** Passe de Batalha: compra única por temporada de 90 dias e 30 níveis nas duas trilhas. */
export default function PassScreen() {
  const listRef = useRef<FlatList<number>>(null);
  const scrolled = useRef(false);
  const pass = useAccountStore((s) => s.pass);
  const stage = useProgressStore((s) => s.highestCleared) + 1;
  const { prices, loading, error: pricesError, retry: retryPrices } = useProductPrices(PASS_PRODUCT_IDS);
  const price = prices[PASS_PRODUCT_ID];
  const purchase = useProductPurchase();
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = acting || purchase.busy;
  // Hora em que a tela abriu (para "termina em N dias")
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    refreshEconomy();
  }, []);

  const act = async (task: () => Promise<unknown>) => {
    setActing(true);
    setError(null);
    try {
      await task();
    } catch {
      setError(pt.shop.failed);
    } finally {
      setActing(false);
    }
  };

  if (!pass) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
          <ScreenHeader title={pt.pass.open} />
          <AppText color={colors.danger} style={styles.offline}>
            {pt.pass.offline}
          </AppText>
        </SafeAreaView>
      </View>
    );
  }

  const start = pass.startsAt ?? `${pass.season.slice(0, 7)}-01T00:00:00Z`;
  const period = `${dateBR(start)} a ${dateBR(pass.endsAt)}`;
  const days = Math.ceil((new Date(pass.endsAt).getTime() - openedAt) / DAY_MS);
  const inTier = pass.tier >= PASS_TIERS ? XP_PER_TIER : pass.xp % XP_PER_TIER;
  const cell = (tier: number, track: PassTrack): CellState => {
    const claimed = track === 'free' ? pass.claimedFree : pass.claimedPremium;
    if (claimed.includes(tier)) return 'claimed';
    return canClaim(pass.xp, tier, track, claimed, pass.premium) ? 'claim' : 'locked';
  };

  const claimable = TIERS.some((tier) => cell(tier, 'free') === 'claim' || cell(tier, 'premium') === 'claim');
  const header = (
    <Chunky face="#3a2456" edge="#1e1030" radius={radius.l} depth={6} gloss={0.08} faceStyle={styles.head}>
      <View style={styles.headRow}>
        <Image source={ICONS.crown} style={styles.crown} />
        <View style={styles.headTexts}>
          <AppText variant="heading">{pt.pass.season(period)}</AppText>
          <AppText variant="small" color="#e0c8ff">
            {pt.pass.endsIn(days)}
          </AppText>
        </View>
        <AppText variant="title" color={colors.yellow}>
          {pt.pass.tier(pass.tier)}
        </AppText>
      </View>
      <Segments total={10} filled={Math.round((inTier / XP_PER_TIER) * 10)} color={colors.yellow} height={6} />
      <AppText variant="small" color={colors.textMuted}>
        {`${pt.pass.xp(inTier, XP_PER_TIER)} · ${pt.pass.howXp}`}
      </AppText>
      <AppText variant="small">{resultsText.daily}: {pass.xpToday}/{PASS_DAILY_XP} · {resultsText.reset}: {pass.resetsAt ? formatDateTime(pass.resetsAt) : '00:00 UTC'}</AppText>
      <AppText variant="small">{pass.tier >= PASS_TIERS ? resultsText.complete : `${resultsText.next}: ${pass.tier + 1}`}</AppText>
      <Button label={resultsText.all} size="s" disabled={busy || !claimable} onPress={() => act(claimAllPass)} />
      {pass.premium && pass.premiumUntil ? (
        <AppText variant="label" color={colors.accent}>
          {pt.pass.active(dateBR(pass.premiumUntil))}
        </AppText>
      ) : (
        <View style={{ gap: 8 }}>
          <AppText variant="small" color={colors.textMuted}>{pt.pass.validity(formatDateTime(pass.endsAt))}</AppText>
          <Button label={price ? pt.pass.buy(price) : (loading ? '…' : pt.shop.priceUnavailable)} disabled={busy || purchase.isPending(PASS_PRODUCT_ID) || !price || !purchasesAvailable()} onPress={() => { setError(null); void purchase.buy(PASS_PRODUCT_ID); }} />
          {pricesError && (
            <>
              <AppText variant="small" color={colors.textMuted}>{pt.shop.pricesFailed}</AppText>
              <Button label={pt.shop.retryPrices} variant="dark" size="s" disabled={busy || loading} onPress={retryPrices} />
            </>
          )}
        </View>
      )}
      {purchase.message && (
        <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          {purchase.busy && <ActivityIndicator color={colors.yellow} />}
          <AppText variant="label" color={purchase.status === 'error' ? colors.danger : purchase.status === 'success' ? colors.accent : colors.yellow}>{purchase.message}</AppText>
          {purchase.pending && <Button label={pt.shop.checkPurchase} variant="dark" size="s" onPress={() => { void purchase.check(); }} />}
        </View>
      )}
      {error && <AppText color={colors.danger}>{error}</AppText>}
      <View style={styles.tracks}>
        <AppText variant="eyebrow">{pt.pass.free}</AppText>
        <AppText variant="eyebrow" color="#c8a0ff">
          {pt.pass.premium}
        </AppText>
      </View>
    </Chunky>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        <ScreenHeader title={pt.pass.open} right={<GemPill />} />
        <FlatList
          data={TIERS}
          ref={listRef}
          initialNumToRender={PASS_TIERS}
          onContentSizeChange={() => { if (!scrolled.current) { scrolled.current = true; listRef.current?.scrollToIndex({ index: Math.max(0, pass.tier - 1), animated: false }); } }}
          onScrollToIndexFailed={(info) => { listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false }); }}
          keyExtractor={(tier) => `${tier}`}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item: tier }) => (
            <TierRow
              tier={tier}
              reached={pass.tier >= tier}
              free={{ reward: passReward(tier, 'free', stage), state: cell(tier, 'free') }}
              premium={{ reward: passReward(tier, 'premium', stage), state: cell(tier, 'premium') }}
              busy={busy}
              onClaim={(track) => act(() => claimPass(tier, track))}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  offline: { padding: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  head: { padding: 14, gap: 8, marginBottom: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crown: { width: 48, height: 48 },
  headTexts: { flex: 1 },
  tracks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 4 },
});
