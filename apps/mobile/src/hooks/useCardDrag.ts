import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { CARDS, isTroop } from '@/game/data/cards';
import { DEPLOY_ZONE, SPELL_ZONE, WORLD_WIDTH } from '@/game/data/constants';
import { isValidDrop } from '@/game/engine/cards';
import { type DragPreview, NO_DRAG } from '@/game/render/camera';
import type { CardId, GameCommand } from '@/game/types';

// A tropa surge com os pés um pouco abaixo do dedo, para o corpo ficar sob o dedo.
const TROOP_FINGER_OFFSET = 25;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Arrastar cartas da mão para o campo: converte o dedo em coordenadas do mundo, mostra a
 * prévia no canvas (drag) ou a carta flutuando fora dele (ghost) e manda playCard ao soltar.
 */
export function useCardDrag(hand: CardId[], send: (command: GameCommand) => void, cardWidth: number) {
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const drag = useSharedValue<DragPreview>(NO_DRAG);
  const ghost = useSharedValue({ x: 0, y: 0, visible: false });
  const canvasRect = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const canvasView = useRef<View>(null);

  const measure = () => canvasView.current?.measureInWindow((x, y, w, h) => (canvasRect.current = { x, y, w, h }));

  const toWorld = (pageX: number, pageY: number) => {
    const r = canvasRect.current;
    if (!r || pageX < r.x || pageX > r.x + r.w || pageY < r.y || pageY > r.y + r.h) return null;
    const scale = r.w / WORLD_WIDTH;
    return { x: (pageX - r.x) / scale, y: (pageY - r.y) / scale };
  };

  /** Ponto do campo onde a carta cairia (tropas: ajusta a altura para dentro da zona). */
  const dropPoint = (slot: number, pageX: number, pageY: number) => {
    const point = toWorld(pageX, pageY);
    const card = CARDS[hand[slot]];
    if (!point || !card) return null;
    const zone = isTroop(card) ? DEPLOY_ZONE : SPELL_ZONE;
    const x = point.x;
    const y = clamp(point.y + (isTroop(card) ? TROOP_FINGER_OFFSET : 0), zone.minY, zone.maxY);
    return { x, y, valid: isValidDrop(card, x, y) };
  };

  const onDragStart = (slot: number, pageX: number, pageY: number) => {
    measure();
    setDraggingSlot(slot);
    ghost.set({ x: pageX, y: pageY, visible: true });
  };
  const onDragMove = (slot: number, pageX: number, pageY: number) => {
    const point = dropPoint(slot, pageX, pageY);
    ghost.set({ x: pageX, y: pageY, visible: !point });
    drag.set(point ? { active: true, card: hand[slot], ...point } : NO_DRAG);
  };
  const onDragEnd = (slot: number, pageX: number, pageY: number) => {
    const point = pageX >= 0 ? dropPoint(slot, pageX, pageY) : null;
    if (point?.valid) send({ type: 'playCard', slot, x: point.x, y: point.y });
    drag.set(NO_DRAG);
    ghost.set({ x: 0, y: 0, visible: false });
    setDraggingSlot(null);
  };

  const ghostStyle = useAnimatedStyle(() => {
    const g = ghost.get();
    return { opacity: g.visible ? 0.9 : 0, transform: [{ translateX: g.x - cardWidth / 2 }, { translateY: g.y - cardWidth * 0.65 }] };
  });

  return { drag, draggingSlot, canvasView, measure, ghostStyle, handlers: { onDragStart, onDragMove, onDragEnd } };
}
