import type { AccountState } from '@/state/accountStore';

const mockPurchase = jest.fn();
const mockApi = jest.fn();
let mockState: AccountState;

jest.mock('@/services/purchases', () => ({ purchase: (...args: unknown[]) => mockPurchase(...args) }));
jest.mock('@/services/api', () => ({ api: (...args: unknown[]) => mockApi(...args), hasApiToken: () => true }));
jest.mock('@/state/accountStore', () => ({
  MAX_APPLIED: 100,
  useAccountStore: { getState: () => mockState, setState: (patch: Partial<AccountState>) => { mockState = { ...mockState, ...patch }; } },
}));
jest.mock('@/state/progressStore', () => ({ useProgressStore: { getState: () => ({ highestCleared: 0 }) } }));

const { buyProduct, purchaseConfirmed } = jest.requireActual<typeof import('../economy')>('../economy');

beforeEach(() => {
  jest.useFakeTimers();
  mockState = { user: { id: 'player' }, gems: 0, pass: { premium: false }, online: true } as AccountState;
  mockPurchase.mockReset().mockResolvedValue(true);
  mockApi.mockReset().mockImplementation(async (_method, path) => path === '/wallet' ? { gems: mockState.gems } : mockState.pass);
});
afterEach(() => jest.useRealTimers());

test('cancelamento não inicia confirmação nem consulta a carteira', async () => {
  mockPurchase.mockResolvedValue(false);
  const onPurchased = jest.fn();
  await expect(buyProduct('zr_pass_season', onPurchased)).resolves.toBe('cancelled');
  expect(onPurchased).not.toHaveBeenCalled();
  expect(mockApi).not.toHaveBeenCalled();
});

test('avisa imediatamente que a loja concluiu e confirma o passe quando o webhook chega', async () => {
  const onPurchased = jest.fn();
  const result = buyProduct('zr_pass_season', onPurchased);
  await jest.advanceTimersByTimeAsync(0);
  expect(onPurchased).toHaveBeenCalledTimes(1);
  mockState = { ...mockState, pass: { ...mockState.pass!, premium: true } };
  await jest.advanceTimersByTimeAsync(1000);
  await expect(result).resolves.toBe('confirmed');
});

test('aguarda webhook tardio por até um minuto', async () => {
  const result = buyProduct('zr_pass_season');
  await jest.advanceTimersByTimeAsync(55000);
  mockState = { ...mockState, pass: { ...mockState.pass!, premium: true } };
  await jest.advanceTimersByTimeAsync(1000);
  await expect(result).resolves.toBe('confirmed');
});

test('sem entrega retorna pendente em vez de anunciar sucesso', async () => {
  const result = buyProduct('zr_gems_80');
  await jest.advanceTimersByTimeAsync(60000);
  await expect(result).resolves.toBe('pending');
  expect(jest.getTimerCount()).toBe(0);
});

test('uma mudança nas gemas não confirma o passe e ativar o passe não confirma gemas', () => {
  const before = mockState;
  expect(purchaseConfirmed('zr_pass_season', before, { ...before, gems: 80 })).toBe(false);
  expect(purchaseConfirmed('zr_gems_80', before, { ...before, pass: { ...before.pass!, premium: true } })).toBe(false);
  expect(purchaseConfirmed('zr_gems_80', before, { ...before, gems: 80 })).toBe(true);
  expect(purchaseConfirmed('zr_gems_80', before, { ...before, gems: 10 })).toBe(false);
});

test('saldo de outra conta não confirma a compra', () => {
  expect(purchaseConfirmed('zr_gems_80', mockState, { ...mockState, user: { ...mockState.user!, id: 'other' }, gems: 80 })).toBe(false);
});

test('falha da loja continua sendo erro', async () => {
  mockPurchase.mockRejectedValue(new Error('store unavailable'));
  await expect(buyProduct('zr_pass_season')).rejects.toThrow('store unavailable');
});
