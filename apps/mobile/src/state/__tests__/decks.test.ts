import { initialProgress } from '../progress';
import { selectDeck, duplicateDeck, replaceCard, moveCard, renameDeck } from '../decks';
import { migrateProgress } from '../migrate';
test('migra o deck atual para o primeiro espaço e preserva nomes', () => {
 const p = initialProgress(); const old = { ...p, deck: p.deck.slice().reverse(), savedDecks: undefined, selectedDeck: undefined };
 const result = migrateProgress(old, 10); expect(result.savedDecks).toHaveLength(3); expect(result.savedDecks[0].cards).toEqual(old.deck);
 expect(migrateProgress(renameDeck(result, '  Defesa  '), 11).savedDecks[0].name).toBe('Defesa');
});
test('duplicação e seleção preservam os outros espaços', () => {
 const p = initialProgress(); p.deck = p.deck.slice(0, 7);
 const copied = duplicateDeck(p, 1); expect(selectDeck(copied, 1).deck).toHaveLength(7); expect(copied.savedDecks[2].cards).toHaveLength(8);
});
test('troca direta impede bloqueadas e duplicatas, ordenação conserva cartas', () => {
 const p = initialProgress(); expect(replaceCard(p, 'sniper', 'soldier')).toBe(p); expect(replaceCard(p, 'sniper', 'dog')).toBe(p);
 const unlocked = { ...p, highestCleared: 20 }; expect(replaceCard(unlocked, 'sniper', 'soldier').deck).toHaveLength(8);
 const moved = moveCard(p, p.deck[0], 1); expect(moved.deck[1]).toBe(p.deck[0]); expect(new Set(moved.deck)).toEqual(new Set(p.deck));
 expect(moveCard(p, p.deck[0], -1)).toBe(p);
});
