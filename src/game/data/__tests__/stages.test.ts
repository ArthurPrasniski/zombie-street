import { generateStage, getStage, SPAWN_INTERVAL, STAGE_OVERRIDES, WAVES_PER_STAGE } from '@/game/data/stages';
import type { WaveDef, ZombieId } from '@/game/types';

const count = (wave: WaveDef, id: ZombieId) => wave.spawns.filter((s) => s.zombie === id).length;

describe('generateStage', () => {
  it('sempre gera 5 ondas', () => {
    for (let s = 1; s <= 10; s++) expect(generateStage(s).waves).toHaveLength(WAVES_PER_STAGE);
  });

  it('fase 1, onda 1: 6 walkers e 0 runners', () => {
    const wave = generateStage(1).waves[0];
    expect(count(wave, 'walker')).toBe(6);
    expect(count(wave, 'runner')).toBe(0);
  });

  it('fase 1, onda 5: 1 brute (primeiro) e 4 walkers', () => {
    const wave = generateStage(1).waves[4];
    expect(count(wave, 'brute')).toBe(1);
    expect(count(wave, 'walker')).toBe(4);
    expect(wave.spawns[0].zombie).toBe('brute');
  });

  it('ondas 1 a 4 seguem as fórmulas da seção 8 (pela fase global)', () => {
    for (const s of [7, 23]) {
      const stage = generateStage(s);
      for (let n = 1; n <= 4; n++) {
        expect(count(stage.waves[n - 1], 'walker')).toBe(5 + n + Math.floor(s / 3));
        expect(count(stage.waves[n - 1], 'runner')).toBe(Math.floor((n + Math.floor(s / 3)) / 2));
      }
    }
  });

  it('a quantidade de zumbis não recomeça ao trocar de mundo', () => {
    const total = (s: number) => generateStage(s).waves.reduce((sum, w) => sum + w.spawns.length, 0);
    expect(total(11)).toBeGreaterThanOrEqual(total(10));
    expect(total(21)).toBeGreaterThanOrEqual(total(20));
  });

  it('spawns a cada 0,9 s', () => {
    const delays = generateStage(3).waves[1].spawns.map((sp) => sp.delay);
    delays.forEach((d, i) => expect(d).toBeCloseTo(i * SPAWN_INTERVAL));
  });

  it('runners ficam espalhados, sem ficar todos juntos no fim', () => {
    const order = generateStage(10).waves[3].spawns.map((sp) => sp.zombie);
    const runnerIdx = order.flatMap((z, i) => (z === 'runner' ? [i] : []));
    expect(runnerIdx[0]).toBeLessThan(order.length / 3);
    expect(runnerIdx[runnerIdx.length - 1]).toBeGreaterThan((order.length * 2) / 3);
  });
});

describe('getStage', () => {
  afterEach(() => {
    delete STAGE_OVERRIDES[2];
  });

  it('usa a fase sobrescrita à mão quando existe', () => {
    const custom = { index: 2, waves: [] };
    STAGE_OVERRIDES[2] = custom;
    expect(getStage(2)).toBe(custom);
    expect(getStage(3)).toEqual(generateStage(3));
  });
});
