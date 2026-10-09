import { ZOMBIES } from '@/game/data/zombies';
import { generateStage, STAGE_COUNT } from '@/game/data/stages';
import { globalStage, localStage, WORLDS, worldOf } from '@/game/data/worlds';
import type { WaveDef, ZombieId } from '@/game/types';

const count = (wave: WaveDef, id: ZombieId) => wave.spawns.filter((s) => s.zombie === id).length;

describe('mundos', () => {
  it('mundos de 10 fases (Ato 1 com 5, Ato 2 com 3)', () => {
    expect(WORLDS.length).toBeGreaterThanOrEqual(8);
    expect(STAGE_COUNT).toBe(WORLDS.length * 10);
  });

  it('converte fase global em mundo e fase local, e de volta', () => {
    expect([worldOf(1), localStage(1)]).toEqual([0, 1]);
    expect([worldOf(10), localStage(10)]).toEqual([0, 10]);
    expect([worldOf(11), localStage(11)]).toEqual([1, 1]);
    expect([worldOf(50), localStage(50)]).toEqual([4, 10]);
    expect(globalStage(2, 3)).toBe(23);
  });

  it('a fazenda (mundo 1) tem só andarilhos, corredores e o Brutamontes', () => {
    const stage = generateStage(7);
    const kinds = new Set(stage.waves.flatMap((w) => w.spawns.map((s) => s.zombie)));
    expect([...kinds].sort()).toEqual(['brute', 'runner', 'walker']);
    expect(stage.waves[4].spawns[0].zombie).toBe('brute');
  });

  it('cada mundo novo traz o seu zumbi e o seu chefe', () => {
    for (let w = 1; w < WORLDS.length; w++) {
      const stage = generateStage(globalStage(w, 4));
      const zombie = WORLDS[w].zombie as ZombieId;
      // A quantidade do zumbi do mundo para de crescer no 5º mundo (COUNT_CAP_WORLD), com a fração do
      // mundo; quem vem em grupo (Xeno) conta cada parceiro
      const base = Math.floor((1 + 2 * Math.min(w, 4)) / 2);
      const expected = Math.max(1, Math.round(base * (WORLDS[w].zombieShare ?? 1))) * (ZOMBIES[zombie].pack ?? 1);
      expect(count(stage.waves[0], zombie)).toBe(expected);
      expect(stage.waves[4].spawns[0].zombie).toBe(WORLDS[w].boss);
      expect(count(stage.waves[4], 'brute')).toBe(0);
    }
  });
});
