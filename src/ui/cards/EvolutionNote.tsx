import { Image, StyleSheet, View } from 'react-native';

import { EVOLUTION_LEVELS, evolutionTier } from '@/game/data/evolutions';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { evolutionText } from '@/ui/cards/stats';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors, radius } from '@/ui/theme';

/**
 * Evolução no modal de melhoria (GDD seção 17.6): em destaque quando a próxima melhoria faz a
 * carta evoluir; senão, o efeito atual e em que nível vem a próxima evolução.
 */
export function EvolutionNote({ card, level }: { card: CardId; level: number }) {
  const tier = evolutionTier(level);
  const evolves = evolutionTier(level + 1) > tier;
  const nextAt = EVOLUTION_LEVELS[tier];
  const shown = evolves ? level + 1 : tier > 0 ? level : nextAt;
  const text = evolutionText(card, shown);
  if (!text) return null;
  const label = evolves ? pt.cards.evolution : tier > 0 ? pt.cards.evolved(tier) : pt.cards.evolvesAt(nextAt);
  return (
    <View style={[styles.box, evolves && styles.highlight]}>
      <Image source={ICONS.evo} style={styles.icon} />
      <View style={styles.texts}>
        <AppText variant="label" color={evolves ? colors.white : '#c8a0ff'} style={styles.label}>
          {label}
        </AppText>
        <AppText variant="small" color={evolves ? colors.white : colors.textMuted}>
          {text}
        </AppText>
        {tier > 0 && nextAt !== undefined && !evolves && (
          <AppText variant="small" color={colors.textMuted}>
            {pt.cards.evolvesAt(nextAt)}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', padding: 10, borderRadius: radius.m, backgroundColor: 'rgba(138, 74, 216, 0.15)', borderWidth: 2, borderColor: 'rgba(176, 106, 255, 0.4)' },
  highlight: { backgroundColor: '#8a4ad8', borderColor: '#c8a0ff' },
  icon: { width: 34, height: 34 },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: 15, lineHeight: 18 },
});
