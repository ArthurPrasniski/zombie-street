import { localizedName } from '@/i18n/names';
import { useLocalSearchParams } from 'expo-router';
import { tutorialText } from '@/i18n/tutorial';
import { DeckPresets } from '@/ui/cards/DeckPresets';
import { CardDetail } from '@/ui/cards/CardDetail';
import { Button } from '@/ui/kit/Button';
import { decksText } from '@/i18n/decks';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CARD_IDS, CARDS, DECK_SIZE } from '@/game/data/cards';
import { stageLabel } from '@/game/data/worlds';
import type { CardId } from '@/game/types';
import { t as pt } from '@/i18n';
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
const GAP = 12;
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
  const params = useLocalSearchParams<{ card?: CardId }>();
  const progress = useProgressStore();
  const { width } = useWindowDimensions();
  const cardW = Math.min(MAX_CARD_W, Math.floor((width - PADDING * 2 - GAP * (PER_ROW - 1)) / PER_ROW));
  const [selected, setSelected] = useState<CardId | null>(params.card && params.card in CARDS ? params.card : null);
  const [upgrading, setUpgrading] = useState<CardId | null>(null);
  const [emptyAt, setEmptyAt] = useState<number | null>(null);
  const [showLocked, setShowLocked] = useState(false);
  const [replacement, setReplacement] = useState<CardId | null>(null);
  const [detail, setDetail] = useState<CardId | null>(null);
  const [filter, setFilter] = useState<'all' | 'troop' | 'spell' | 'upgrades'>('all');
  const [cost, setCost] = useState<number | null>(null);
  const collection = CARD_IDS.filter((id) => !progress.deck.includes(id) && isCardUnlocked(progress, id) && (filter === 'all' || filter === 'upgrades' ? filter !== 'upgrades' || canUpgradeCard(progress, id) : CARDS[id].kind === filter) && (cost === null || CARDS[id].cost === cost));
  const locked = CARD_IDS.filter((id) => !isCardUnlocked(progress, id)).sort((a, b) => (unlockStage(a) ?? 0) - (unlockStage(b) ?? 0));
  const nextUnlock = locked[0];
  const upgrades = progress.deck.filter((id) => canUpgradeCard(progress, id)).length;
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
        : { color: colors.tealBright, onPress: () => complete ? setReplacement(selected) : add(selected), label: complete ? decksText.replace : pt.deck.add },
    );
    if (inDeck) {
      actions.push({ label: decksText.left, onPress: () => progress.moveCard(selected, -1) });
      actions.push({ label: decksText.right, onPress: () => progress.moveCard(selected, 1) });
    }
    const maxed = nextCardCost(progress, selected) === null;
    actions.push({ label: maxed ? pt.cards.maxLevel : pt.cards.upgrade, disabled: maxed, onPress: () => setUpgrading(selected) });
  }
  if (selected) actions.push({ label: decksText.detail, onPress: () => setDetail(selected) });
  const chooseCard = (card: CardId | null) => {
    if (replacement && card && progress.deck.includes(card)) { progress.replaceCard(card, replacement); setReplacement(null); setSelected(null); return; }
    setSelected(card);
  };
  const note = !selected ? null : !unlocked ? pt.cards.unlockAt(stageLabel(unlockStage(selected) ?? 1)) : !inDeck && complete ? pt.deck.full : null;
  const upgradable = (card: CardId) => canUpgradeCard(progress, card);
  const gridProps = { cardW, gap: GAP, perRow: PER_ROW, levels: progress.cardLevels, selected, onSelect: chooseCard, actions, note, upgradable, quiet: true };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        <ScreenHeader title={pt.deck.title} />
        <ScrollView contentContainerStyle={styles.listContent}>
          <Pressable onPress={() => setSelected(null)} style={styles.list}>
            {progress.tutorialStep === 4 && <AppText>{tutorialText.steps[4]}</AppText>}
            <DeckPresets />
            {replacement && <View><AppText>{decksText.choose}</AppText><Button label={decksText.cancel} size="s" onPress={() => setReplacement(null)} /></View>}
            <View style={styles.sectionHeader}>
              <AppText variant="label">{pt.deck.deck}</AppText>
              <AppText variant="small" color={complete ? colors.textMuted : colors.danger}>
                {pt.deck.count(progress.deck.length, DECK_SIZE)}
              </AppText>
            </View>
            <CardGrid {...gridProps} items={slots} onEmpty={tapEmpty} emptyLabel={pt.deck.empty} />
            <AppText variant="small" color={complete ? colors.textMuted : colors.danger}>
              {complete ? (upgrades ? pt.deck.upgrades(upgrades) : pt.deck.tapHint) : pt.deck.incomplete}
            </AppText>
            <AppText variant="label" style={styles.section}>
              {pt.deck.collection}
            </AppText>
            {CARD_IDS.some((id) => !progress.deck.includes(id) && isCardUnlocked(progress,id)) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['all', 'troop', 'spell', 'upgrades'] as const).map((f) => <Button key={f} label={decksText[f]} variant={filter === f ? 'solid' : 'dark'} size="s" onPress={() => setFilter(f)} />)}
              <Button label={`${decksText.cost}: ${cost ?? '—'}`} variant="dark" size="s" onPress={() => setCost(cost === null ? 2 : cost >= 6 ? null : cost + 1)} />
            </View>}
            {collection.length > 0 ? (
              <CardGrid
                {...gridProps}
                items={collection}
              />
            ) : (
              <AppText color={colors.textMuted}>{pt.deck.emptyCollection}</AppText>
            )}
            {nextUnlock && (
              <View style={styles.nextUnlock}>
                <AppText variant="small" color={colors.textMuted}>{pt.deck.nextUnlock}</AppText>
                <AppText variant="label">{localizedName(CARDS[nextUnlock].name)}</AppText>
                <AppText variant="small" color={colors.textMuted}>{pt.cards.unlockAt(stageLabel(unlockStage(nextUnlock) ?? 1))}</AppText>
              </View>
            )}
            {locked.length > 0 && (
              <>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: showLocked }} onPress={() => { setShowLocked(!showLocked); setSelected(null); }} style={styles.lockedToggle}>
                  <AppText variant="small" color={colors.textMuted}>{pt.deck.lockedCount(locked.length)}</AppText>
                  <AppText color={colors.textMuted}>{showLocked ? '−' : '+'}</AppText>
                </Pressable>
                {showLocked && <CardGrid {...gridProps} items={locked} lockedLabel={(card) => pt.cards.lockedShort(stageLabel(unlockStage(card) ?? 1))} />}
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      {detail && <CardDetail card={detail} onClose={() => setDetail(null)} />}
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
  nextUnlock: { marginTop: 12, padding: 16, gap: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  lockedToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.line },
});
