import { View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { t } from '@/i18n';
import { initialProgress } from '@/state/progress';
import { Button } from '@/ui/kit/Button';
import { StageReplayGate } from '../StageReplayGate';

let mockProgress = initialProgress();
let mockReady = true;
let mockMember = false;
const mockShow = jest.fn();
jest.mock('@/state/progressStore', () => ({ useProgressStore: { getState: () => mockProgress } }));
jest.mock('@/services/ads', () => ({ useAdStore: () => mockReady, showRewardedAd: () => mockShow(), initAds: () => Promise.resolve() }));
jest.mock('@/services/membership', () => ({ adsRemoved: () => mockMember }));
jest.mock('@/hooks/useMembershipActive', () => ({ useMembershipActive: () => mockMember }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

let tree: ReactTestRenderer | null = null;
beforeEach(() => { mockProgress = initialProgress(); mockReady = true; mockMember = false; mockShow.mockReset(); });
afterEach(() => { act(() => tree?.unmount()); tree = null; });

function render(survival = false, key = 'first') {
  const node = <StageReplayGate key={key} stage={1} survival={survival}><View testID="combat-engine" /></StageReplayGate>;
  act(() => { if (tree) tree.update(node); else tree = create(node); });
}
const combat = () => tree!.root.findAllByType(View).filter((node) => node.props.testID === 'combat-engine');
const watch = () => tree!.root.findAllByType(Button).find((b) => b.props.label === t.ads.replayWatch)!;

test('primeira tentativa e Sobrevivência iniciam sem anúncio', () => {
  render();
  expect(combat()).toHaveLength(1);
  mockProgress.highestCleared = 1;
  render(true, 'survival');
  expect(combat()).toHaveLength(1);
  expect(mockShow).not.toHaveBeenCalled();
});

test('derrota bloqueia o motor até o anúncio ser concluído', async () => {
  mockProgress.highestFailedStage = 1;
  render();
  expect(combat()).toHaveLength(0);
  mockShow.mockResolvedValue(true);
  await act(async () => watch().props.onPress());
  expect(combat()).toHaveLength(1);
  render(false, 'retry');
  expect(combat()).toHaveLength(0);
});

test('fechar antes do fim ou falhar não inicia a partida', async () => {
  mockProgress.highestCleared = 1;
  render();
  mockShow.mockResolvedValue(false);
  await act(async () => watch().props.onPress());
  expect(combat()).toHaveLength(0);
  mockShow.mockRejectedValue(new Error('ad failed'));
  await act(async () => watch().props.onPress());
  expect(combat()).toHaveLength(0);
});

test('sem anúncio disponível informa a espera e mantém a fase bloqueada', () => {
  mockProgress.highestCleared = 1;
  mockReady = false;
  render();
  expect(watch().props.disabled).toBe(true);
  expect(combat()).toHaveLength(0);
  expect(mockShow).not.toHaveBeenCalled();
});

test('assinante repete fase sem anúncio, mesmo sem vídeo carregado', () => {
  mockProgress.highestFailedStage = 1;
  mockReady = false;
  mockMember = true;
  render();
  expect(combat()).toHaveLength(1);
  expect(mockShow).not.toHaveBeenCalled();
});
