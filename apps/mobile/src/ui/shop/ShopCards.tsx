import { Image, StyleSheet, View } from 'react-native';

import type { GemPack } from '@zombie-road/shared/catalog';

import { pt } from '@/i18n/pt';
import { CashLabel } from '@/ui/CashLabel';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, radius } from '@/ui/theme';
import { formatInt } from '@/utils/format';

/** Quantas gemas desenhar na pilha do pacote (1 a 4). */
const pileSize = (gems: number) => (gems >= 2600 ? 4 : gems >= 1200 ? 3 : gems >= 500 ? 2 : 1);

/** Pacote de gemas: pilha de gemas, quantidade, selo e o preço da loja no botão. */
export function GemPackCard({ pack, price, disabled, onBuy }: { pack: GemPack; price: string | null; disabled: boolean; onBuy: () => void }) {
  const badge = pack.badge === 'popular' ? pt.shop.popular : pack.badge === 'best' ? pt.shop.best : null;
  return (
    <Chunky face="#1d3a4a" edge="#0f2028" radius={radius.m} depth={5} gloss={0.08} style={styles.card} faceStyle={styles.face}>
      {badge && (
        <View style={styles.badge}>
          <AppText variant="small" color={colors.ink}>
            {badge.toUpperCase()}
          </AppText>
        </View>
      )}
      <View style={styles.pile}>
        {Array.from({ length: pileSize(pack.gems) }, (_, i) => (
          <Image key={i} source={ICONS.gem} style={[styles.gem, { marginLeft: i === 0 ? 0 : -18, transform: [{ rotate: `${(i - 1) * 12}deg` }] }]} />
        ))}
      </View>
      <AppText variant="heading" color="#c8fff4">
        {pt.shop.gemsAmount(formatInt(pack.gems))}
      </AppText>
      <Button label={price ?? '…'} size="s" disabled={disabled || !price} onPress={onBuy} style={styles.button} />
    </Chunky>
  );
}

/** Pacote de moedas comprado com gemas: moedas que recebe e o custo em gemas. */
export function CoinPackCard({ name, coins, gems, disabled, onBuy }: { name: string; coins: number; gems: number; disabled: boolean; onBuy: () => void }) {
  return (
    <Chunky face={colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={5} gloss={0.06} faceStyle={styles.coinRow}>
      <Image source={ICONS.coin} style={styles.coin} />
      <View style={styles.texts}>
        <AppText variant="label">{name}</AppText>
        <CashLabel amount={coins} size={20} />
      </View>
      <Button label={formatInt(gems)} size="s" disabled={disabled} onPress={onBuy} icon={<GemLabelIcon />} />
    </Chunky>
  );
}

const GemLabelIcon = () => <Image source={ICONS.gem} style={styles.small} />;

const styles = StyleSheet.create({
  card: { flex: 1 },
  face: { alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8 },
  badge: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.yellow, zIndex: 2 },
  pile: { flexDirection: 'row', height: 56, alignItems: 'flex-end' },
  gem: { width: 48, height: 48 },
  button: { alignSelf: 'stretch' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  coin: { width: 44, height: 44 },
  texts: { flex: 1, gap: 2 },
  small: { width: 18, height: 18 },
});
