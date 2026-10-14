import { tutorialAfter } from '../tutorial';
test('tutorial só avança em ações realizadas, na ordem', () => {
 expect(tutorialAfter(0, { type: 'cardPlayed', card: 'grenade' })).toBe(0);
 expect(tutorialAfter(0, { type: 'cardPlayed', card: 'sniper' })).toBe(1);
 expect(tutorialAfter(1, { type: 'cardPlayed', card: 'sniper' })).toBe(1);
 expect(tutorialAfter(1, { type: 'cardPlayed', card: 'barricade' })).toBe(2);
 expect(tutorialAfter(2, { type: 'cardPlayed', card: 'grenade' })).toBe(3);
 expect(tutorialAfter(3, { type: 'stageFailed', stage: 1, cashEarned: 0 })).toBe(3);
 expect(tutorialAfter(3, { type: 'stageCleared', stage: 1, cashEarned: 0, stars: 3 })).toBe(4);
});
