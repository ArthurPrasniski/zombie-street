import type { AccountState } from '@/state/accountStore';
import type { PurchaseAttempt } from '@/state/purchaseStore';
import { PurchaseNotStartedError } from '@/services/purchaseErrors';
import { releaseUnchargedAttempt } from '@/services/purchaseRecovery';
jest.mock('@/services/telemetry', () => ({ track: jest.fn() }));
const mockPurchase = jest.fn();
const mockApi = jest.fn();
let mockState: AccountState;
let mockAttempts: PurchaseAttempt[] = [];
let mockRecords: AccountState['purchases'] = [];
jest.mock('@/services/purchases', () => ({ identifyPurchaser: jest.fn().mockResolvedValue(undefined), purchase: (...args: unknown[]) => mockPurchase(...args) }));
jest.mock('@/services/api', () => ({ api: (...args: unknown[]) => mockApi(...args), hasApiToken: () => true }));
jest.mock('@/state/accountStore', () => ({ MAX_APPLIED: 100, useAccountStore: { getState: () => mockState, setState: (patch: Partial<AccountState>) => { mockState = { ...mockState, ...patch }; } } }));
jest.mock('@/state/progressStore', () => ({ useProgressStore: { getState: () => ({ highestCleared: 0 }) } }));
jest.mock('@/state/purchaseStore', () => ({ usePurchaseStore: { getState: () => ({ attempts: mockAttempts, put: (a: PurchaseAttempt) => { mockAttempts.push(a); }, update: (id: string, patch: Partial<PurchaseAttempt>) => { mockAttempts = mockAttempts.map((a) => a.id === id ? { ...a, ...patch } : a); } }) } }));
const { buyProduct, purchaseConfirmed } = jest.requireActual<typeof import('../economy')>('../economy');
beforeEach(() => {
  jest.useFakeTimers(); mockAttempts = []; mockRecords = [];
  mockState = { user: { id: 'player' }, gems: 0, pass: { premium: false }, purchases: [], online: true } as unknown as AccountState;
  mockPurchase.mockReset().mockImplementation(async (_id, receipt) => { receipt('tx-1'); return true; });
  mockApi.mockReset().mockImplementation(async (_method, path) => path === '/wallet' ? { gems: mockState.gems } : path === '/membership' ? mockState.membership : path === '/purchases' ? { records: mockRecords } : mockState.pass);
});
afterEach(() => jest.useRealTimers());
const delivered = (productId = 'zr_pass_season', transactionId = 'tx-1') => ({ productId, transactionId, deliveredAt: new Date().toISOString(), refunded: false });
test('cancelamento consulta apenas o histórico antes da loja', async () => {
  mockPurchase.mockResolvedValue(false); const callback = jest.fn();
  await expect(buyProduct('zr_pass_season', callback)).resolves.toBe('cancelled');
  expect(callback).not.toHaveBeenCalled(); expect(mockApi).toHaveBeenCalledTimes(1);
});
test('sucesso somente quando a transação exata foi entregue', async () => {
  const callback = jest.fn(); const result = buyProduct('zr_pass_season', callback);
  await jest.advanceTimersByTimeAsync(0); expect(callback).toHaveBeenCalledTimes(1);
  mockRecords = [delivered('zr_pass_season', 'another')];
  await jest.advanceTimersByTimeAsync(1000); expect(mockAttempts[0].status).toBe('confirming');
  mockRecords.push(delivered()); await jest.advanceTimersByTimeAsync(1000);
  await expect(result).resolves.toBe('confirmed');
});
test('pendência é preservada e impede outra cobrança', async () => {
  const result = buyProduct('zr_gems_80'); await jest.advanceTimersByTimeAsync(60000);
  await expect(result).resolves.toBe('pending'); expect(mockAttempts[0].status).toBe('pending');
  await expect(buyProduct('zr_gems_80')).resolves.toBe('pending'); expect(mockPurchase).toHaveBeenCalledTimes(1);
});
test('saldo e premium não são evidência de entrega', () => {
  expect(purchaseConfirmed('zr_gems_80', mockState, { ...mockState, gems: 80 })).toBe(false);
  expect(purchaseConfirmed('zr_pass_season', mockState, { ...mockState, pass: { ...mockState.pass!, premium: true } })).toBe(false);
  expect(purchaseConfirmed('zr_gems_80', mockState, { ...mockState, purchases: [delivered('zr_gems_80')] })).toBe(true);
});
test('recibo estornado ou de outra conta não confirma', () => {
  expect(purchaseConfirmed('zr_gems_80', mockState, { ...mockState, purchases: [{ ...delivered('zr_gems_80'), refunded: true }] })).toBe(false);
  expect(purchaseConfirmed('zr_gems_80', mockState, { ...mockState, user: { ...mockState.user!, id: 'other' }, purchases: [delivered('zr_gems_80')] })).toBe(false);
});
test('falha ambígua da loja conserva tentativa para recuperação', async () => {
  mockPurchase.mockRejectedValue(new Error('store unavailable'));
  await expect(buyProduct('zr_pass_season')).rejects.toThrow('store unavailable'); expect(mockAttempts[0].status).toBe('pending');
});

test('rejeição anterior à cobrança libera uma nova tentativa', async () => {
  mockPurchase.mockRejectedValue(new PurchaseNotStartedError('PRODUCT_UNAVAILABLE'));
  await expect(buyProduct('zr_pass_season')).rejects.toThrow('Compra não iniciada');
  expect(mockAttempts[0].status).toBe('error');
  await expect(buyProduct('zr_pass_season')).rejects.toThrow('Compra não iniciada');
  expect(mockPurchase).toHaveBeenCalledTimes(2);
});

test('um recibo recebido mantém a proteção mesmo se ocorrer erro depois', async () => {
  mockPurchase.mockImplementation(async (_id, receipt) => { receipt('tx-paid'); throw new PurchaseNotStartedError('5'); });
  await expect(buyProduct('zr_pass_season')).rejects.toThrow();
  expect(mockAttempts[0].status).toBe('pending');
  releaseUnchargedAttempt(mockAttempts[0].id);
  expect(mockAttempts[0].status).toBe('pending');
});

test('usuário pode liberar tentativa sem cobrança sem apagar o registro', async () => {
  mockPurchase.mockRejectedValue(new Error('unknown'));
  await expect(buyProduct('zr_pass_season')).rejects.toThrow();
  releaseUnchargedAttempt(mockAttempts[0].id);
  expect(mockAttempts).toHaveLength(1);
  expect(mockAttempts[0].status).toBe('error');
});

test('não libera uma tentativa de outra conta', async () => {
  mockPurchase.mockRejectedValue(new Error('unknown'));
  await expect(buyProduct('zr_pass_season')).rejects.toThrow();
  mockState = { ...mockState, user: { ...mockState.user!, id: 'other' } };
  releaseUnchargedAttempt(mockAttempts[0].id);
  expect(mockAttempts[0].status).toBe('pending');
});
