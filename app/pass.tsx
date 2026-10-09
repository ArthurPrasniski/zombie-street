import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PASS_PRODUCT_ID } from '@shared/catalog';
import { canClaim, PASS_TIERS, passReward, type PassTrack, XP_PER_TIER } from '@shared/pass';

import { pt } from '@/i18n/pt';
import { buyProduct, claimPass, refreshEconomy } from '@/services/economy';
import { productPrices, purchasesAvailable } from '@/services/purchases';
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

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DAY_MS = 24 * 3600 * 1000;
const TIERS = Array.from({ length: PASS_TIERS }, (_, i) => i + 1);

const dateBR = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Passe de Batalha (GDD seção 19.3): XP da temporada, assinatura e os 30 níveis com as duas trilhas. */
export default function PassScreen() {
  const pass = useAccountStore((s) => s.pass);
  const stage = useProgressStore((s) => s.highestCleared) + 1;
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Hora em que a tela abriu (para "termina em N dias")
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    refreshEconomy();
    productPrices().then((p) => setPrice(p[PASS_PRODUCT_ID] ?? null)).catch(() => null);
  }, []);

  const act = async (task: () => Promise<unknown>) => {
    setBusy(true);
    await task().catch(() => null);
    setBusy(false);
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

  const month = MONTHS[Number(pass.season.slice(5)) - 1];
  const days = Math.ceil((new Date(pass.endsAt).getTime() - openedAt) / DAY_MS);
  const inTier = pass.tier >= PASS_TIERS ? XP_PER_TIER : pass.xp % XP_PER_TIER;
  const cell = (tier: number, track: PassTrack): CellState => {
    const claimed = track === 'free' ? pass.claimedFree : pass.claimedPremium;
    if (claimed.includes(tier)) return 'claimed';
    return canClaim(pass.xp, tier, track, claimed, pass.premium) ? 'claim' : 'locked';
  };

  const header = (
    <Chunky face="#3a2456" edge="#1e1030" radius={radius.l} depth={6} gloss={0.08} faceStyle={styles.head}>
      <View style={styles.headRow}>
        <Image source={ICONS.crown} style={styles.crown} />
        <View style={styles.headTexts}>
          <AppText variant="heading">{pt.pass.season(month)}</AppText>
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
      {pass.premium && pass.premiumUntil ? (
        <AppText variant="label" color={colors.accent}>
          {pt.pass.active(dateBR(pass.premiumUntil))}
        </AppText>
      ) : (
        <Button label={pt.pass.subscribe(price ?? '…')} disabled={busy || !price || !purchasesAvailable()} onPress={() => act(() => buyProduct(PASS_PRODUCT_ID))} />
      )}
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
