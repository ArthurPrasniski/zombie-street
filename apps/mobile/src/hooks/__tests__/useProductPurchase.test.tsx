import { useEffect } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { useProductPurchase } from '../useProductPurchase';

const mockBuy = jest.fn();
const mockRefresh = jest.fn();
const mockConfirmed = jest.fn();
const mockStoreListeners = new Set<(state: unknown) => void>();
let mockAttempts: unknown[] = [];
const mockListeners = new Set<() => void>();
jest.mock('@/services/economy', () => ({
  buyProduct: (...args: unknown[]) => mockBuy(...args),
  refreshEconomy: () => mockRefresh(),
  recoverStorePurchases: () => mockRefresh(),
  purchaseConfirmed: () => mockConfirmed(),
}));
jest.mock('@/state/accountStore', () => ({ useAccountStore: {
  getState: () => ({ user: { id: 'player' } }),
  subscribe: (listener: () => void) => { mockListeners.add(listener); return () => mockListeners.delete(listener); },
} }));

jest.mock('@/state/purchaseStore', () => ({ usePurchaseStore: { getState: () => ({ attempts: mockAttempts }), subscribe: (listener: (state: unknown) => void) => { mockStoreListeners.add(listener); return () => mockStoreListeners.delete(listener); } } }));

let hook: ReturnType<typeof useProductPurchase>;
let tree: ReactTestRenderer;
function Harness() {
  const value = useProductPurchase();
  useEffect(() => { hook = value; });
  return null;
}

beforeEach(() => {
  jest.clearAllMocks(); mockAttempts = [];
  mockConfirmed.mockReturnValue(false);
  act(() => { tree = create(<Harness />); });
});
afterEach(() => act(() => tree.unmount()));

test('mostra confirmação assim que a loja termina e sucesso só após a entrega', async () => {
  let deliver!: (result: string) => void;
  mockBuy.mockImplementation((_id, onPurchased) => { onPurchased(); return new Promise((resolve) => { deliver = resolve; }); });
  let result!: Promise<void>;
  act(() => { result = hook.buy('zr_pass_season'); });
  expect(hook.status).toBe('confirming');
  expect(hook.message).toContain('Confirmando');
  expect(hook.busy).toBe(true);
  await act(async () => { deliver('confirmed'); await result; });
  expect(hook.status).toBe('success');
  expect(hook.message).toContain('Passe Premium ativado');
  expect(hook.busy).toBe(false);
});

test('exibe erro da loja e libera os controles', async () => {
  mockBuy.mockRejectedValue(new Error('failed'));
  await act(async () => hook.buy('zr_pass_season'));
  expect(hook.status).toBe('error');
  expect(hook.message).toContain('Não foi possível concluir');
  expect(hook.busy).toBe(false);
});

test('cancelamento não mostra sucesso ou erro', async () => {
  mockBuy.mockResolvedValue('cancelled');
  await act(async () => hook.buy('zr_pass_season'));
  expect(hook.message).toBeNull();
  expect(hook.busy).toBe(false);
});

test('compra pendente evita nova compra e aceita confirmação tardia do servidor', async () => {
  mockBuy.mockResolvedValue('pending');
  await act(async () => hook.buy('zr_pass_season'));
  expect(hook.pending).toBe(true);
  expect(hook.message).toContain('Não compre novamente');
  await act(async () => hook.buy('zr_pass_season'));
  expect(mockBuy).toHaveBeenCalledTimes(1);
  mockConfirmed.mockReturnValue(true);
  mockAttempts = [{ userId: 'player', productId: 'zr_pass_season', status: 'success' }];
  act(() => { mockStoreListeners.forEach((listener) => listener({ attempts: mockAttempts })); });
  expect(hook.status).toBe('success');
});

test('atualizar status consulta a entrega sem comprar novamente', async () => {
  mockBuy.mockResolvedValue('pending');
  await act(async () => hook.buy('zr_gems_80'));
  mockConfirmed.mockReturnValue(true);
  mockAttempts = [{ userId: 'player', productId: 'zr_gems_80', status: 'success' }];
  await act(async () => hook.check());
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(mockBuy).toHaveBeenCalledTimes(1);
  expect(hook.message).toBe('Gemas recebidas!');
});

test('pendência bloqueia apenas o produto afetado', async () => {
  mockBuy.mockResolvedValueOnce('pending').mockResolvedValueOnce('confirmed');
  await act(async () => hook.buy('zr_gems_80'));
  mockAttempts = [{ userId: 'player', productId: 'zr_gems_80', status: 'pending' }];
  act(() => { mockStoreListeners.forEach((listener) => listener({ attempts: mockAttempts })); });
  expect(hook.isPending('zr_gems_80')).toBe(true);
  expect(hook.isPending('zr_membership_monthly')).toBe(false);
  await act(async () => hook.buy('zr_membership_monthly'));
  expect(mockBuy).toHaveBeenCalledTimes(2);
  expect(hook.message).toContain('Assinatura confirmada');
  expect(hook.isPending('zr_gems_80')).toBe(true);
});

test('erro ao recuperar não deixa controles presos em confirmação', async () => {
  mockBuy.mockResolvedValue('pending');
  await act(async () => hook.buy('zr_gems_80'));
  mockRefresh.mockRejectedValueOnce(new Error('sync unavailable'));
  await act(async () => hook.check());
  expect(hook.busy).toBe(false);
  expect(hook.pending).toBe(true);
});
