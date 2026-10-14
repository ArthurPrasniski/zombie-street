jest.mock('@/services/env', () => ({ NATIVE: false, KEYS: {} }));
let mockMember = false;
jest.mock('@/services/membership', () => ({ adsRemoved: () => mockMember }));

const { showRewardedAd, useAdStore } = jest.requireActual<typeof import('../ads')>('../ads');

test('um anúncio só pode atender uma ação por vez', async () => {
  const first = showRewardedAd();
  const fake = useAdStore.getState().fake!;
  await expect(showRewardedAd()).resolves.toBe(false);
  expect(useAdStore.getState().fake).toBe(fake);
  useAdStore.setState({ fake: null });
  fake.resolve(true);
  await expect(first).resolves.toBe(true);
});

test('cancelar não libera a tentativa e permite assistir outro anúncio', async () => {
  const cancelled = showRewardedAd();
  const fake = useAdStore.getState().fake!;
  useAdStore.setState({ fake: null });
  fake.resolve(false);
  await expect(cancelled).resolves.toBe(false);
  const retry = showRewardedAd();
  const next = useAdStore.getState().fake!;
  useAdStore.setState({ fake: null });
  next.resolve(true);
  await expect(retry).resolves.toBe(true);
});

test('assinante não recebe anúncio mesmo por chamada direta do serviço', async () => {
  mockMember = true;
  await expect(showRewardedAd()).resolves.toBe(false);
  expect(useAdStore.getState().fake).toBeNull();
  mockMember = false;
});
