import { Pressable, StyleSheet, View } from 'react-native';

import type { CardId, CardLevels } from '@/game/types';
import { CardActions, type CardAction } from '@/ui/cards/CardActions';
import { CardView } from '@/ui/cards/CardView';
import { AppText } from '@/ui/kit/AppText';
import { colors, radius } from '@/ui/theme';

interface Props {
  /** Cartas da grade; null = espaço vazio do deck. */
  items: (CardId | null)[];
  cardW: number;
  gap: number;
  perRow: number;
  levels: CardLevels;
  selected: CardId | null;
  onSelect: (card: CardId | null) => void;
  /** Rótulo de carta bloqueada (fase que libera) ou null. */
  lockedLabel?: (card: CardId) => string | null;
  /** Carta que dá para melhorar agora (seta verde). */
  upgradable?: (card: CardId) => boolean;
  onEmpty?: (index: number) => void;
  emptyLabel?: string;
  actions: CardAction[];
  note?: string | null;
}

/** Grade de cartas; a escolhida cresce no lugar com as ações embaixo (CardActions). */
export function CardGrid({ items, cardW, gap, perRow, levels, selected, onSelect, lockedLabel, upgradable, onEmpty, emptyLabel, actions, note }: Props) {
  const cardH = Math.round(cardW * 1.3);
  const gridW = perRow * cardW + (perRow - 1) * gap;
  const index = selected ? items.indexOf(selected) : -1;
  const cell = index >= 0 ? { x: (index % perRow) * (cardW + gap), y: Math.floor(index / perRow) * (cardH + gap) } : null;

  return (
    <View style={[styles.grid, { width: gridW, gap }, cell && styles.raised]}>
      {items.map((card, i) =>
        card ? (
          <Pressable key={card} onPress={() => onSelect(card === selected ? null : card)} style={card === selected && styles.hidden}>
            <CardView card={card} width={cardW} level={levels[card]} locked={lockedLabel?.(card) ?? null} upgradable={upgradable?.(card)} />
          </Pressable>
        ) : (
          <Pressable key={`empty-${i}`} onPress={() => onEmpty?.(i)} accessibilityLabel={emptyLabel}>
            <View style={[styles.empty, { width: cardW, height: cardH }]}>
              <AppText variant="title" color={colors.textMuted}>
                +
              </AppText>
              {emptyLabel && (
                <AppText variant="small" color={colors.textMuted}>
                  {emptyLabel.toUpperCase()}
                </AppText>
              )}
            </View>
          </Pressable>
        ),
      )}
      {selected && cell && (
        <CardActions
          card={selected}
          level={levels[selected]}
          cardW={cardW}
          x={cell.x}
          y={cell.y}
          gridW={gridW}
          actions={actions}
          note={note}
          onClose={() => onSelect(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // A grade com a carta aberta fica por cima das seções seguintes
  raised: { zIndex: 10, elevation: 10 },
  hidden: { opacity: 0 },
  empty: {
    borderRadius: radius.s + 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
