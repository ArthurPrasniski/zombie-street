import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COIN_PACK_IDS, COIN_PACKS, coinPackCoins, type CoinPackId, GEM_PACKS } from '@zombie-road/shared/catalog';

import { stageLabel } from '@/game/data/worlds';
import { pt } from '@/i18n/pt';
import { buyCoins, buyProduct, refreshEconomy } from '@/services/economy';
import { productPrices, purchasesAvailable } from '@/services/purchases';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { GemPill } from '@/ui/GemLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Card } from '@/ui/kit/Card';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { CoinPackCard, GemPackCard } from '@/ui/shop/ShopCards';
import { colors, radius } from '@/ui/theme';
import { formatCash } from '@/utils/format';

/** Loja (GDD seção 19): Passe em destaque, gemas por dinheiro e moedas por gemas. */
export default function ShopScreen() {
  const { user, online, gems } = useAccountStore();
  const stage = useProgressStore((s) => s.highestCleared) + 1;
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const connected = user !== null && online;

  useEffect(() => {
    refreshEconomy();
    productPrices().then(setPrices).catch(() => null);
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
  const buyGems = (productId: string) => run(async () => ((await buyProduct(productId)) ? pt.shop.gemsArrived : null));
  const buyPack = (pack: CoinPackId) => run(async () => pt.shop.bought(formatCash(await buyCoins(pack))));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={pt.shop.title} right={<GemPill />} />
        <ScrollView contentContainerStyle={styles.list}>
          {note && (
            <Animated.View entering={FadeInDown} style={styles.note}>
              <AppText variant="label" color={colors.yellow}>
                {note}
              </AppText>
            </Animated.View>
          )}
          {!connected && <AppText color={colors.danger}>{pt.shop.unavailable}</AppText>}

          <Card color="#5a2a8a" style={styles.promo} padding={14} onPress={() => router.push('/pass')}>
            <View style={styles.promoRow}>
              <Image source={ICONS.crown} style={styles.crown} />
              <View style={styles.promoTexts}>
                <AppText variant="title" style={styles.promoTitle}>
                  {pt.pass.title}
                </AppText>
                <AppText variant="small" color="#e0c8ff">
                  {pt.pass.pitch}
                </AppText>
              </View>
            </View>
          </Card>

          <AppText variant="eyebrow" style={styles.section}>
            {pt.shop.gems}
          </AppText>
          <AppText variant="small" color={colors.textMuted}>
            {purchasesAvailable() ? pt.shop.gemsHint : pt.shop.noStore}
          </AppText>
          <View style={styles.grid}>
            {GEM_PACKS.map((pack) => (
              <View key={pack.productId} style={styles.cell}>
                <GemPackCard pack={pack} price={prices[pack.productId] ?? null} disabled={busy || !connected || !purchasesAvailable()} onBuy={() => buyGems(pack.productId)} />
              </View>
            ))}
          </View>

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
  promo: { borderRadius: radius.l },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crown: { width: 58, height: 58 },
  promoTexts: { flex: 1, gap: 2 },
  promoTitle: { fontSize: 22, lineHeight: 26 },
  section: { marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
});
