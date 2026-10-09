import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { CARDS } from '@/game/data/cards';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { CardView } from '@/ui/cards/CardView';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

export interface DragHandlers {
  onDragStart: (slot: number, pageX: number, pageY: number) => void;
  onDragMove: (slot: number, pageX: number, pageY: number) => void;
  /** pageX/pageY negativos = gesto cancelado pelo sistema. */
  onDragEnd: (slot: number, pageX: number, pageY: number) => void;
}

interface Props extends DragHandlers {
  hand: CardId[];
  next: CardId | null;
  blood: number;
  /** Campo cheio de tropas: só armas especiais podem ser jogadas. */
  troopsFull: boolean;
  cardWidth: number;
  draggingSlot: number | null;
}

/** As 4 cartas da mão (arrastáveis quando há sangue) e a próxima, menor, à esquerda. */
export function CardHand({ hand, next, blood, troopsFull, cardWidth, draggingSlot, ...handlers }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.next}>
        <AppText variant="eyebrow" color={colors.textMuted} style={styles.nextLabel}>
          {pt.combat.next}
        </AppText>
        {next && <CardView card={next} width={Math.round(cardWidth * 0.62)} hideName />}
      </View>
      {hand.map((card, slot) => (
        <HandCard
          key={slot}
          slot={slot}
          card={card}
          width={cardWidth}
          affordable={blood >= CARDS[card].cost && !(troopsFull && CARDS[card].kind === 'troop')}
          dragging={draggingSlot === slot}
          handlers={handlers}
        />
      ))}
    </View>
  );
}

interface HandCardProps {
  slot: number;
  card: CardId;
  width: number;
  affordable: boolean;
  dragging: boolean;
  handlers: DragHandlers;
}

function HandCard({ slot, card, width, affordable, dragging, handlers }: HandCardProps) {
  // O PanResponder vive o gesto inteiro; lê sempre os valores mais recentes pela ref.
  const latest = useRef({ slot, affordable, handlers });
  useEffect(() => {
    latest.current = { slot, affordable, handlers };
  });
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.affordable,
      onMoveShouldSetPanResponder: () => latest.current.affordable,
      onPanResponderGrant: (e) => latest.current.handlers.onDragStart(latest.current.slot, e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderMove: (e) => latest.current.handlers.onDragMove(latest.current.slot, e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderRelease: (e) => latest.current.handlers.onDragEnd(latest.current.slot, e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderTerminate: () => latest.current.handlers.onDragEnd(latest.current.slot, -1, -1),
    }),
  );

  return (
    <View {...responder.panHandlers} style={[styles.slot, dragging && styles.dragging]}>
      <CardView card={card} width={width} dimmed={!affordable} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  next: { alignItems: 'center', gap: 4, marginRight: 4 },
  nextLabel: { fontSize: 9, lineHeight: 11, letterSpacing: 1 },
  slot: {},
  dragging: { opacity: 0.35, transform: [{ translateY: -8 }] },
});
