import { CARDS, DECK_SIZE } from '@/game/data/cards';
import type { CardId } from '@/game/types';
import { isCardUnlocked, type Progress } from '@/state/progress';
export interface SavedDeck { name: string; cards: CardId[] }
export function selectDeck(p: Progress, index: number): Progress {
  const preset = p.savedDecks[index];
  if (!preset || index === p.selectedDeck) return p;
  return { ...p, selectedDeck: index, deck: [...preset.cards] };
}
export function renameDeck(p: Progress, name: string): Progress {
  const value = name.trim().slice(0, 24);
  if (!value || value === p.savedDecks[p.selectedDeck].name) return p;
  return { ...p, savedDecks: p.savedDecks.map((d, i) => i === p.selectedDeck ? { ...d, name: value } : d) };
}
export function duplicateDeck(p: Progress, destination: number): Progress {
  if (!p.savedDecks[destination] || destination === p.selectedDeck) return p;
  return { ...p, savedDecks: p.savedDecks.map((d, i) => i === destination ? { ...d, cards: [...p.deck] } : d) };
}
export function replaceCard(p: Progress, from: CardId, to: CardId): Progress {
  if (!p.deck.includes(from) || p.deck.includes(to) || !isCardUnlocked(p, to)) return p;
  return { ...p, deck: p.deck.map((c) => c === from ? to : c) };
}
export function moveCard(p: Progress, card: CardId, direction: -1 | 1): Progress {
  const from = p.deck.indexOf(card), to = from + direction;
  if (from < 0 || to < 0 || to >= p.deck.length) return p;
  const deck = [...p.deck]; [deck[from], deck[to]] = [deck[to], deck[from]];
  return { ...p, deck };
}
export function deckSummary(deck: CardId[]) {
  const defs = deck.map((c) => CARDS[c]);
  return { average: deck.length ? defs.reduce((sum, c) => sum + c.cost, 0) / deck.length : 0,
    defense: defs.filter((c) => c.kind === 'troop' && (c.building || c.role === 'melee')).length,
    area: defs.filter((c) => c.kind === 'spell' && (c.damage || c.dps) || c.kind === 'troop' && (c.splash || c.pierce || c.chain)).length,
    healing: defs.filter((c) => c.heal).length, control: defs.filter((c) => c.kind === 'spell' && (c.freeze || c.pull || c.wallHp)).length,
    complete: deck.length === DECK_SIZE };
}
