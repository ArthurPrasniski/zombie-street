import { ACTS, actOf, FRONTIER_WORLD, introFor, outroFor, radioId } from '@/game/data/story';
import { RADIO_MESSAGES } from '@/i18n/ptRadio';
import { migrateProgress } from '@/state/migrate';
import { initialProgress } from '@/state/progress';
import { hearRadio, isHeard } from '@/state/radio';

describe('história e rádio (seção 18.1)', () => {
  it('3 atos com 5, 3 e 4 mundos; depois, a Fronteira', () => {
    expect(ACTS.map((a) => a.length)).toEqual([5, 3, 4]);
    expect(actOf(0)).toBe(0);
    expect(actOf(6)).toBe(1);
    expect(actOf(11)).toBe(2);
    expect(actOf(FRONTIER_WORLD)).toBe(3);
  });

  it('abertura na 1ª fase do mundo e fechamento no chefe', () => {
    expect(introFor(1)).toBe('w1-intro');
    expect(introFor(2)).toBeNull();
    expect(introFor(51)).toBe('w6-intro');
    expect(outroFor(10)).toBe('w1-outro');
    expect(outroFor(49)).toBeNull();
    expect(outroFor(120)).toBe('w12-outro');
    expect(introFor(121)).toBe('frontier');
    expect(introFor(131)).toBeNull();
  });

  it('toda mensagem dos 12 mundos e da Fronteira tem texto', () => {
    for (let w = 0; w <= FRONTIER_WORLD; w++) {
      for (const moment of ['intro', 'outro'] as const) {
        const id = radioId(w, moment);
        if (id) expect(RADIO_MESSAGES[id]?.length).toBeGreaterThan(0);
      }
    }
  });

  it('ouvir marca uma vez só', () => {
    const p = hearRadio(initialProgress(), 'w1-intro');
    expect(isHeard(p, 'w1-intro')).toBe(true);
    expect(hearRadio(p, 'w1-intro')).toBe(p);
  });

  it('migração v7: o que o jogador já passou conta como ouvido', () => {
    const p = migrateProgress({ highestCleared: 23 }, 6);
    expect(p.radioHeard).toEqual(['w1-intro', 'w1-outro', 'w2-intro', 'w2-outro', 'w3-intro']);
    expect(migrateProgress({ highestCleared: 23, radioHeard: ['w1-intro', 7] }, 7).radioHeard).toEqual(['w1-intro']);
  });
});
