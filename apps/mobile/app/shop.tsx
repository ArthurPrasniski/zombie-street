import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COIN_PACK_IDS, COIN_PACKS, coinPackCoins, type CoinPackId, MEMBERSHIP } from '@zombie-road/shared/catalog';

import { stageLabel } from '@/game/data/worlds';
import { useProductPrices } from '@/hooks/useProductPrices';
import { useProductPurchase } from '@/hooks/useProductPurchase';
import { t as pt } from '@/i18n';
import { buyCoins, refreshEconomy } from '@/services/economy';
import { purchasesAvailable } from '@/services/purchases';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { GemPill } from '@/ui/GemLabel';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { CoinPackCard } from '@/ui/shop/ShopCards';
import { MembershipCard } from '@/ui/shop/MembershipCard';
import { GemRewardCard } from '@/ui/shop/GemRewardCard';
import { colors, radius } from '@/ui/theme';
import { formatCash } from '@/utils/format';

const PRODUCT_IDS = [MEMBERSHIP.productId];

/** Loja (GDD seção 19): Gemas por anúncios, assinatura mensal e moedas por gemas. */
export default function ShopScreen() {
  const { user, online, gems } = useAccountStore();
  const stage = useProgressStore((s) => s.highestCleared) + 1;
  const { prices, loading, retry: retryPrices } = useProductPrices(PRODUCT_IDS);
  const [acting, setBusy] = useState(false);
  const purchase = useProductPurchase();
  const busy = acting || purchase.busy;
  const [note, setNote] = useState<string | null>(null);
  const connected = user !== null && online;

  useEffect(() => {
    refreshEconomy();
  }, []);

  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    setNote(null);
    try {
      setNote(await task());
    } catch (error) {
      setNote((error as Error).message === 'gemas insuficientes' ? pt.shop.notEnough : pt.shop.failed);
    } finally {
      setBusy(false);
    }
  };
  const buyMembership = () => { setNote(null); void purchase.buy(MEMBERSHIP.productId); };
  const buyPack = (pack: CoinPackId) => run(async () => pt.shop.bought(formatCash(await buyCoins(pack))));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.shop.title} right={<GemPill />} />
        <ScrollView contentContainerStyle={styles.list}>
          {purchase.message && (
            <View style={styles.note} accessibilityLiveRegion="polite">
              {purchase.busy && <ActivityIndicator color={colors.yellow} />}
              <AppText variant="label" color={purchase.status === 'error' ? colors.danger : purchase.status === 'success' ? colors.accent : colors.yellow}>{purchase.message}</AppText>
              {purchase.recoverable && <Button label={pt.shop.checkPurchase} variant="dark" size="s" onPress={() => { void purchase.check(); }} />}
            </View>
          )}
          {note && (
            <Animated.View entering={FadeInDown} style={styles.note}>
              <AppText variant="label" color={colors.yellow}>
                {note}
              </AppText>
            </Animated.View>
          )}
          {!connected && <AppText color={colors.danger}>{pt.shop.unavailable}</AppText>}

          <GemRewardCard disabled={busy || !connected} onBusyChange={setBusy} />

          <MembershipCard price={prices[MEMBERSHIP.productId] ?? null} loading={loading} onRetry={retryPrices} canRestore={connected && purchasesAvailable()} disabled={busy || purchase.isPending(MEMBERSHIP.productId) || !connected || !purchasesAvailable()} onBuy={buyMembership} />

          <AppText variant="eyebrow" style={styles.section}>
            {pt.shop.coins}
          </AppText>
          <AppText variant="small" color={colors.textMuted}>
            {pt.shop.coinsHint(stageLabel(stage))}
          </AppText>
          {COIN_PACK_IDS.map((pack) => (
            <CoinPackCard
              key={pack}
              name={pt.shop.packs[pack]}
              coins={coinPackCoins(pack, stage)}
              gems={COIN_PACKS[pack].gems}
              disabled={busy || !connected || (gems ?? 0) < COIN_PACKS[pack].gems}
              onBuy={() => buyPack(pack)}
            />
          ))}
          <Button label={pt.pass.open} variant="dark" size="s" onPress={() => router.push('/pass')} />
          {!connected && <Button label={pt.account.section} variant="dark" size="s" onPress={() => router.push('/settings')} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  note: { alignItems: 'center', paddingVertical: 8, borderRadius: radius.m, backgroundColor: 'rgba(255, 201, 40, 0.12)' },
  section: { marginTop: 10 },
});
