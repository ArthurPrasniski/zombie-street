import { createLoop } from '@/game/engine/loop';
import { mulberry32 } from '@/game/engine/rng';

import { makeWorld } from './helpers';

function countSteps(frameDt: number, speed: 1 | 2 = 1, paused = false): number {
  const world = makeWorld();
  world.speed = speed;
  world.paused = paused;
  let calls = 0;
  const loop = createLoop(() => calls++);
  const steps = loop.tick(world, frameDt);
  expect(calls).toBe(steps);
  return steps;
}

describe('loop', () => {
  it('dt de 0,2 s executa 12 passos', () => {
    expect(countSteps(0.2)).toBe(12);
  });

  it('com speed 2, dt de 0,2 s executa 24 passos', () => {
    expect(countSteps(0.2, 2)).toBe(24);
  });

  it('dt de 5 s é limitado a 0,25 s (15 passos)', () => {
    expect(countSteps(5)).toBe(15);
  });

  it('pausado não executa nada', () => {
    expect(countSteps(0.2, 1, true)).toBe(0);
  });

  it('acumula frames curtos até completar um passo', () => {
    const world = makeWorld();
    const loop = createLoop(() => {});
    expect(loop.tick(world, 0.01)).toBe(0);
    expect(loop.tick(world, 0.01)).toBe(1);
  });
});

describe('rng', () => {
  it('a mesma semente gera a mesma sequência', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it('gera números em [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
