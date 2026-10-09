import { Pressable, StyleSheet, View } from 'react-native';

import type { CardId } from '@/game/types';
import { CardView } from '@/ui/cards/CardView';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { colors, radius } from '@/ui/theme';

export interface CardAction {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

interface Props {
  card: CardId;
  level: number;
  /** Largura da carta na grade e canto de cima à esquerda do espaço dela. */
  cardW: number;
  x: number;
  y: number;
  /** Largura da grade (o balão não sai dela). */
  gridW: number;
  actions: CardAction[];
  note?: string | null;
  onClose: () => void;
}

const GROW = 1.14;
const PANEL_MIN = 156;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Carta escolhida, como no Clash Royale: cresce no lugar e mostra as ações logo abaixo.
 * Fica por cima da grade (posição absoluta); tocar na carta de novo fecha.
 */
export function CardActions({ card, level, cardW, x, y, gridW, actions, note, onClose }: Props) {
  const cardH = Math.round(cardW * 1.3);
  const w = Math.round(cardW * GROW);
  const h = Math.round(cardH * GROW);
  const left = clamp(x - (w - cardW) / 2, -4, gridW - w + 4);
  const top = y - (h - cardH) / 2;
  const panelW = Math.max(w + 28, PANEL_MIN);
  const panelLeft = clamp(x + cardW / 2 - panelW / 2, 0, gridW - panelW);
  return (
    <>
      <Pressable onPress={onClose} style={[styles.lift, { left, top }]} accessibilityRole="button">
        <CardView card={card} width={w} level={level} selected />
      </Pressable>
      <View style={[styles.panel, { left: panelLeft, top: top + h + 6, width: panelW }]}>
        <View style={[styles.pointer, { left: x + cardW / 2 - panelLeft - 7 }]} />
        <Chunky face="#2e2a34" edge="#17141b" radius={radius.m} depth={5} gloss={0.06} faceStyle={styles.panelFace}>
        {note && (
          <AppText variant="small" color={colors.textMuted} style={styles.note}>
            {note}
          </AppText>
        )}
        {actions.map((a) => (
          <Button key={a.label} label={a.label} size="s" variant={a.color ? 'solid' : 'primary'} color={a.color} disabled={a.disabled} onPress={a.onPress} />
        ))}
        </Chunky>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lift: {
    position: 'absolute',
    zIndex: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  panel: {
    position: 'absolute',
    zIndex: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  panelFace: { gap: 8, padding: 10 },
  pointer: {
    position: 'absolute',
    top: -7,
    zIndex: 1,
    width: 14,
    height: 14,
    backgroundColor: '#2e2a34',
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: colors.outline,
    transform: [{ rotate: '45deg' }],
  },
  note: { textAlign: 'center' },
});
