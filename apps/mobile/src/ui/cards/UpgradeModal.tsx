import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { rewardHaptic } from '@/audio/sfx';

import { CARDS } from '@/game/data/cards';
import { evolutionTier } from '@/game/data/evolutions';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { canUpgradeCard, nextCardCost } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import { CardView } from '@/ui/cards/CardView';
import { EvolutionNote } from '@/ui/cards/EvolutionNote';
import { cardDescription, cardStats } from '@/ui/cards/stats';
import { LevelUpBurst } from '@/ui/fx/LevelUpBurst';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors, radius } from '@/ui/theme';
import { formatCash } from '@/utils/format';

// Quanto tempo a comemoração do nível novo fica antes de o modal fechar.
const CELEBRATE_MS = 1100;

/** Modal de melhoria: nível atual e próximo, cada atributo antes › depois (+ganho) e o custo. */
export function UpgradeModal({ card, onClose }: { card: CardId; onClose: () => void }) {
  const progress = useProgressStore();
  const level = progress.cardLevels[card];
  const cost = nextCardCost(progress, card);
  // Nível alcançado: mostra o brilho e fecha sozinho (GDD seção 17.10)
  const [reached, setReached] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  if (reached !== null) {
    const evolved = evolutionTier(reached) > evolutionTier(reached - 1);
    return <LevelUpBurst label={evolved ? pt.cards.evolution : pt.cards.levelUp(reached)} color={evolved ? '#c8a0ff' : colors.yellow} />;
  }
  if (cost === null) return null;
  const before = cardStats(card, level);
  const after = cardStats(card, level + 1);
  const affordable = canUpgradeCard(progress, card);

  const confirm = () => {
    if (!progress.upgradeCard(card)) return;
    setReached(level + 1);
    rewardHaptic(true);
    timer.current = setTimeout(onClose, CELEBRATE_MS);
  };

  return (
    <GameModal
      eyebrow={pt.cards.upgradeTitle}
      title={CARDS[card].name}
      accent={colors.yellow}
      buttons={
        <>
          <Button label={pt.cards.cancel} variant="dark" onPress={onClose} />
          <Button label={pt.cards.upgrade} icon={<Image source={ICONS.coin} style={styles.coin} />} disabled={!affordable} onPress={confirm} />
        </>
      }>
      <View style={styles.header}>
        <CardView card={card} width={78} level={level + 1} hideName />
        <View style={styles.headerText}>
          <AppText variant="label" color={colors.yellow}>
            {pt.cards.levelChange(level, level + 1)}
          </AppText>
          <AppText variant="small" color={colors.textMuted}>
            {cardDescription(card, level + 1)}
          </AppText>
        </View>
      </View>
      <EvolutionNote card={card} level={level} />
      <View style={styles.table}>
        {before.map((stat, i) => {
          const next = after[i];
          const gain = next.value - stat.value;
          return (
            <View key={stat.label} style={[styles.row, i % 2 === 1 && styles.zebra]}>
              <AppText color={colors.textMuted} style={styles.label}>
                {stat.label}
              </AppText>
              {stat.grows ? (
                <>
                  <AppText variant="number" style={styles.value}>{`${stat.value}${stat.suffix ?? ''}`}</AppText>
                  <AppText variant="number" color={colors.textMuted} style={styles.value}>
                    ›
                  </AppText>
                  <AppText variant="number" color={colors.accent} style={styles.value}>{`${next.value}${next.suffix ?? ''}`}</AppText>
                  <View style={styles.gain}>
                    <AppText variant="small" color={colors.ink}>{`+${gain}`}</AppText>
                  </View>
                </>
              ) : (
                <AppText variant="number" color={colors.textMuted} style={styles.value}>{`${stat.value}${stat.suffix ?? ''} · ${pt.cards.unchanged}`}</AppText>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.cost}>
        <Image source={ICONS.coin} style={styles.costIcon} />
        <AppText variant="number" color={colors.gold} style={styles.costValue}>
          {formatCash(cost)}
        </AppText>
        {!affordable && (
          <AppText variant="small" color={colors.danger}>
            {pt.cards.missingCash(formatCash(cost - progress.cash))}
          </AppText>
        )}
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch' },
  headerText: { flex: 1, gap: 4 },
  table: { alignSelf: 'stretch', borderRadius: radius.m, overflow: 'hidden', backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 12 },
  zebra: { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  label: { flex: 1 },
  value: { fontSize: 16, lineHeight: 20 },
  gain: { marginLeft: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: colors.accent },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  costIcon: { width: 24, height: 24 },
  costValue: { fontSize: 22, lineHeight: 26 },
  coin: { width: 18, height: 18 },
});
