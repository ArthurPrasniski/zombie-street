import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CARD_IDS, DECK_SIZE } from '@/game/data/cards';
import { stageLabel } from '@/game/data/worlds';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { canUpgradeCard, isCardUnlocked, isDeckComplete, nextCardCost, unlockStage } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import type { CardAction } from '@/ui/cards/CardActions';
import { CardGrid } from '@/ui/cards/CardGrid';
import { UpgradeModal } from '@/ui/cards/UpgradeModal';
import { AppText } from '@/ui/kit/AppText';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';

const MAX_CARD_W = 80;
const PER_ROW = 4;
const GAP = 8;
const PADDING = 16;
// Espaço embaixo para o balão de ações da última fileira caber
const POPOVER_ROOM = 150;

/** Espaços do deck na tela: as cartas em ordem, com o espaço recém-esvaziado no lugar dele. */
function deckSlots(deck: CardId[], emptyAt: number | null): (CardId | null)[] {
  const slots: (CardId | null)[] = emptyAt !== null && emptyAt <= deck.length ? [...deck.slice(0, emptyAt), null, ...deck.slice(emptyAt)] : [...deck];
  while (slots.length < DECK_SIZE) slots.push(null);
  return slots.slice(0, DECK_SIZE);
}

/**
 * Deck (GDD seção 12), como no Clash Royale: tocar numa carta a abre com as ações
 * (Remover/Adicionar e Melhorar); Melhorar abre o modal com o antes e o depois.
 */
export default function DeckScreen() {
  const progress = useProgressStore();
  const { width } = useWindowDimensions();
  const cardW = Math.min(MAX_CARD_W, Math.floor((width - PADDING * 2 - GAP * (PER_ROW - 1)) / PER_ROW));
  const [selected, setSelected] = useState<CardId | null>(null);
  const [upgrading, setUpgrading] = useState<CardId | null>(null);
  const [emptyAt, setEmptyAt] = useState<number | null>(null);
  const collection = CARD_IDS.filter((id) => !progress.deck.includes(id));
  const complete = isDeckComplete(progress);
  const slots = deckSlots(progress.deck, emptyAt);

  const remove = (card: CardId) => {
    setEmptyAt(progress.deck.indexOf(card));
    progress.removeFromDeck(card);
    setSelected(null);
  };
  const add = (card: CardId, at = emptyAt ?? progress.deck.length) => {
    if (!progress.addToDeck(card, at)) return;
    setEmptyAt(null);
    setSelected(null);
  };
  /** Tocar num espaço vazio com uma carta da coleção aberta já a coloca ali. */
  const tapEmpty = (slot: number) => {
    if (!selected || progress.deck.includes(selected) || !isCardUnlocked(progress, selected)) return;
    add(selected, slots.slice(0, slot).filter((c) => c !== null).length);
  };

  const inDeck = selected !== null && progress.deck.includes(selected);
  const unlocked = selected !== null && isCardUnlocked(progress, selected);
  const actions: CardAction[] = [];
  if (selected && unlocked) {
    actions.push(
      inDeck
        ? { label: pt.deck.remove, color: colors.danger, onPress: () => remove(selected) }
        : { label: pt.deck.add, color: colors.tealBright, disabled: complete, onPress: () => add(selected) },
    );
    const maxed = nextCardCost(progress, selected) === null;
    actions.push({ label: maxed ? pt.cards.maxLevel : pt.cards.upgrade, disabled: maxed, onPress: () => setUpgrading(selected) });
  }
  const note = !selected ? null : !unlocked ? pt.cards.unlockAt(stageLabel(unlockStage(selected) ?? 1)) : !inDeck && complete ? pt.deck.full : null;
  const upgradable = (card: CardId) => canUpgradeCard(progress, card);
  const gridProps = { cardW, gap: GAP, perRow: PER_ROW, levels: progress.cardLevels, selected, onSelect: setSelected, actions, note, upgradable };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        <ScreenHeader title={pt.deck.title} />
        <ScrollView contentContainerStyle={styles.listContent}>
          <Pressable onPress={() => setSelected(null)} style={styles.list}>
            <View style={styles.sectionHeader}>
              <AppText variant="eyebrow">{pt.deck.deck}</AppText>
              <AppText variant="eyebrow" color={complete ? colors.accent : colors.danger}>
                {pt.deck.count(progress.deck.length, DECK_SIZE)}
              </AppText>
            </View>
            <CardGrid {...gridProps} items={slots} onEmpty={tapEmpty} emptyLabel={pt.deck.empty} />
            <AppText variant="small" color={complete ? colors.textMuted : colors.danger}>
              {complete ? pt.deck.hint : pt.deck.incomplete}
            </AppText>
            <AppText variant="eyebrow" style={styles.section}>
              {pt.deck.collection}
            </AppText>
            {collection.length > 0 ? (
              <CardGrid
                {...gridProps}
                items={collection}
                lockedLabel={(card) => (isCardUnlocked(progress, card) ? null : pt.cards.lockedShort(stageLabel(unlockStage(card) ?? 1)))}
              />
            ) : (
              <AppText color={colors.textMuted}>{pt.deck.emptyCollection}</AppText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      {upgrading && <UpgradeModal card={upgrading} onClose={() => setUpgrading(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: PADDING, paddingBottom: POPOVER_ROOM },
  list: { flexGrow: 1, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginTop: 10 },
});
