import { Image, StyleSheet, View } from 'react-native';

import type { PassReward, PassTrack } from '@zombie-road/shared/pass';

import { pt } from '@/i18n/pt';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { colors, radius } from '@/ui/theme';
import { formatCash } from '@/utils/format';

export type CellState = 'claim' | 'claimed' | 'locked';

interface CellProps {
  track: PassTrack;
  reward: PassReward;
  state: CellState;
  busy: boolean;
  onClaim: () => void;
}

/** Um prêmio do nível: ícone, quantidade e Pegar / Pego / bloqueado. */
function RewardCell({ track, reward, state, busy, onClaim }: CellProps) {
  const premium = track === 'premium';
  const label = reward.kind === 'gems' ? pt.pass.gems(reward.amount) : pt.pass.coins(formatCash(reward.amount));
  return (
    <View style={[styles.cell, premium && styles.premiumCell, state === 'claimed' && styles.claimedCell]}>
      <Image source={reward.kind === 'gems' ? ICONS.gem : ICONS.coin} style={styles.icon} />
      <AppText variant="label" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </AppText>
      {state === 'claim' ? (
        <Button label={pt.pass.claim} size="s" disabled={busy} onPress={onClaim} />
      ) : state === 'claimed' ? (
        <Image source={ICONS.check} style={styles.mark} accessibilityLabel={pt.pass.claimed} />
      ) : (
        <Image source={premium ? ICONS.crown : ICONS.lock} style={styles.mark} accessibilityLabel={pt.pass.locked} />
      )}
    </View>
  );
}

interface RowProps {
  tier: number;
  reached: boolean;
  free: Omit<CellProps, 'track' | 'busy' | 'onClaim'>;
  premium: Omit<CellProps, 'track' | 'busy' | 'onClaim'>;
  busy: boolean;
  onClaim: (track: PassTrack) => void;
}

/** Nível do passe: número no meio da trilha, prêmio grátis à esquerda e premium à direita. */
export function TierRow({ tier, reached, free, premium, busy, onClaim }: RowProps) {
  return (
    <View style={styles.row}>
      <RewardCell track="free" {...free} busy={busy} onClaim={() => onClaim('free')} />
      <View style={[styles.tier, reached && styles.tierReached]}>
        <AppText variant="number" style={styles.tierText}>{`${tier}`}</AppText>
      </View>
      <RewardCell track="premium" {...premium} busy={busy} onClaim={() => onClaim('premium')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cell: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, borderRadius: radius.m, borderWidth: 2, borderColor: colors.outline, backgroundColor: colors.surfaceHigh },
  premiumCell: { backgroundColor: '#3a2456' },
  claimedCell: { opacity: 0.55 },
  icon: { width: 26, height: 26 },
  amount: { flex: 1, fontSize: 13, lineHeight: 16 },
  mark: { width: 24, height: 24 },
  tier: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.outline },
  tierReached: { backgroundColor: colors.yellow },
  tierText: { fontSize: 15, lineHeight: 18 },
});
