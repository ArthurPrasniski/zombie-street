const mockApi = jest.fn();
const mockShow = jest.fn();
let mockUser = 'player';
let mockGems = 0;
jest.mock('@/services/api', () => ({ api: (...args: unknown[]) => mockApi(...args) }));
jest.mock('@/services/ads', () => ({ showGemRewardedAd: (...args: unknown[]) => mockShow(...args) }));
jest.mock('@/services/env', () => ({ NATIVE: true }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'ticket-1' }));
jest.mock('@/state/accountStore', () => ({ useAccountStore: {
  getState: () => ({ user: { id: mockUser } }),
  setState: (state: { gems: number }) => { mockGems = state.gems; },
} }));
const { earnGemReward, checkGemReward, useGemRewardStore } = jest.requireActual<typeof import('../gemRewards')>('../gemRewards');
const ticket = (status = 'pending') => ({ requestId: 'ticket-1', status, expiresAt: new Date(Date.now() + 1800000).toISOString(), gems: 20 });

beforeEach(async () => {
  await useGemRewardStore.persist.rehydrate();
  useGemRewardStore.setState({ pending: null });
  mockUser = 'player'; mockGems = 0;
  mockApi.mockReset(); mockShow.mockReset().mockResolvedValue(true);
  mockApi.mockImplementation(async (method: string) => ticket(method === 'GET' ? 'earned' : 'pending'));
});
afterEach(() => jest.useRealTimers());

test('credita somente o saldo confirmado pelo servidor, após conclusão do anúncio', async () => {
  await expect(earnGemReward()).resolves.toBe('earned');
  expect(mockShow).toHaveBeenCalledWith('player', 'ticket-1');
  expect(mockGems).toBe(20);
  expect(useGemRewardStore.getState().pending).toBeNull();
  expect(mockApi.mock.calls.some(([method, path]) => method === 'POST' && path.startsWith('/dev/'))).toBe(false);
});

test('fechar anúncio sem prêmio não credita gemas e libera nova tentativa', async () => {
  mockShow.mockResolvedValue(false);
  mockApi.mockImplementation(async (method: string) => ticket(method === 'GET' ? 'cancelled' : 'pending'));
  await expect(earnGemReward()).resolves.toBe('cancelled');
  expect(mockGems).toBe(0);
  expect(mockApi).toHaveBeenCalledWith('DELETE', '/rewards/gems/ticket-1');
  expect(useGemRewardStore.getState().pending).toBeNull();
});

test('limite ou rejeição de assinante não mostra anúncio nem deixa tentativa bloqueada', async () => {
  for (const status of [429, 409]) {
    mockApi.mockRejectedValue({ status });
    await expect(earnGemReward()).rejects.toEqual({ status });
    expect(useGemRewardStore.getState().pending).toBeNull();
  }
  expect(mockShow).not.toHaveBeenCalled();
  expect(mockGems).toBe(0);
});

test('resposta perdida mantém o pedido e a recuperação consulta a mesma reserva', async () => {
  mockApi.mockRejectedValueOnce({ status: 0 });
  await expect(earnGemReward()).rejects.toEqual({ status: 0 });
  expect(useGemRewardStore.getState().pending?.requestId).toBe('ticket-1');
  mockApi.mockResolvedValue(ticket('earned'));
  await expect(earnGemReward()).resolves.toBe('earned');
  expect(mockShow).not.toHaveBeenCalled();
  expect(mockGems).toBe(20);
});

test('reserva não criada pode ser liberada após confirmação de 404', async () => {
  useGemRewardStore.setState({ pending: { userId: 'player', requestId: 'ticket-1' } });
  mockApi.mockRejectedValue({ status: 404 });
  await expect(checkGemReward()).resolves.toBe('cancelled');
  expect(useGemRewardStore.getState().pending).toBeNull();
});

test('resposta perdida antes de mostrar anúncio permite retomar a mesma reserva', async () => {
  mockApi.mockRejectedValueOnce({ status: 0 });
  await expect(earnGemReward()).rejects.toEqual({ status: 0 });
  mockApi.mockImplementation(async (method: string) => ticket(method === 'GET' ? 'earned' : 'pending'));
  await expect(earnGemReward()).resolves.toBe('earned');
  expect(mockShow).toHaveBeenCalledTimes(1);
  expect(mockApi.mock.calls.filter(([method]) => method === 'POST').every(([, , body]) => body.requestId === 'ticket-1')).toBe(true);
});

test('a troca de conta durante o anúncio não altera a carteira da nova conta', async () => {
  mockShow.mockImplementation(async () => { mockUser = 'other'; return true; });
  await expect(earnGemReward()).resolves.toBe('pending');
  expect(mockGems).toBe(0);
  expect(mockApi.mock.calls.filter(([method]) => method === 'GET')).toHaveLength(0);
});

test('SSV atrasado mantém o pedido recuperável sem crédito antecipado', async () => {
  jest.useFakeTimers();
  mockApi.mockResolvedValue(ticket());
  const result = earnGemReward();
  await jest.advanceTimersByTimeAsync(21000);
  await expect(result).resolves.toBe('pending');
  expect(mockGems).toBe(0);
  expect(useGemRewardStore.getState().pending?.requestId).toBe('ticket-1');
  mockApi.mockResolvedValue(ticket('earned'));
  await expect(checkGemReward()).resolves.toBe('earned');
  expect(mockShow).toHaveBeenCalledTimes(1);
});
