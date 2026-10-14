import { migrateProgress } from '@/state/migrate';
import { clearStage, failStage, initialProgress, requiresReplayAd } from '@/state/progress';

test('primeira tentativa é livre e cada fase já vencida exige anúncio', () => {
  const initial = initialProgress();
  expect(requiresReplayAd(initial, 1)).toBe(false);
  const won = clearStage(initial, 1, 3);
  expect(requiresReplayAd(won, 1)).toBe(true);
  expect(requiresReplayAd(won, 2)).toBe(false);
});

test('derrota exige anúncio e o bloqueio continua após carregar o save', () => {
  const lost = failStage(initialProgress(), 1);
  expect(requiresReplayAd(lost, 1)).toBe(true);
  const restored = migrateProgress(JSON.parse(JSON.stringify(lost)), 9);
  expect(requiresReplayAd(restored, 1)).toBe(true);
  expect(failStage(restored, 1)).toBe(restored);
});

test('vencer após perder libera a fase seguinte sem anúncio', () => {
  const progress = clearStage(failStage(initialProgress(), 1), 1, 2);
  expect(requiresReplayAd(progress, 1)).toBe(true);
  expect(requiresReplayAd(progress, 2)).toBe(false);
});

test('saves anteriores continuam exigindo anúncio em fases já vencidas', () => {
  const restored = migrateProgress({ highestCleared: 3 }, 8);
  expect(restored.highestFailedStage).toBe(0);
  expect(requiresReplayAd(restored, 3)).toBe(true);
  expect(requiresReplayAd(restored, 4)).toBe(false);
});

test('migração descarta derrota inválida e limita o histórico às fases alcançadas', () => {
  expect(migrateProgress({ highestFailedStage: -1 }, 9).highestFailedStage).toBe(0);
  expect(migrateProgress({ highestCleared: 2, highestFailedStage: 999 }, 9).highestFailedStage).toBe(3);
});

test('a regra também vale depois da campanha, na Fronteira', () => {
  const progress = failStage({ ...initialProgress(), highestCleared: 120 }, 121);
  expect(requiresReplayAd(progress, 120)).toBe(true);
  expect(requiresReplayAd(progress, 121)).toBe(true);
  expect(requiresReplayAd(clearStage(progress, 121), 122)).toBe(false);
});
