const mockConfigure = jest.fn();
const mockLogIn = jest.fn();
const mockGetProducts = jest.fn();
const mockGetOfferings = jest.fn();
const mockPurchaseStoreProduct = jest.fn();
const mockSync = jest.fn();
let mockRevenueCatKey = 'test_public_key';

jest.mock('@/services/env', () => ({ NATIVE: true, KEYS: { get revenueCat() { return mockRevenueCatKey; } } }));
jest.mock('@/services/api', () => ({ api: jest.fn() }));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: mockConfigure, logIn: mockLogIn, getProducts: mockGetProducts, getOfferings: mockGetOfferings, purchaseStoreProduct: mockPurchaseStoreProduct, syncPurchasesForResult: mockSync },
  PURCHASES_ERROR_CODE: jest.requireActual('@revenuecat/purchases-typescript-internal').PURCHASES_ERROR_CODE,
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'gems', SUBSCRIPTION: 'subscription' },
}));

beforeEach(() => {
  jest.resetModules();
  mockConfigure.mockReset();
  mockLogIn.mockReset();
  mockGetProducts.mockReset();
  mockGetProducts.mockResolvedValue([]);
  mockRevenueCatKey = 'test_public_key';
  mockGetOfferings.mockReset().mockResolvedValue({ all: {} });
  mockPurchaseStoreProduct.mockReset();
  mockSync.mockReset().mockResolvedValue({ customerInfo: { nonSubscriptionTransactions: [] } });
});
afterEach(() => jest.restoreAllMocks());

test('a sessão e a loja podem identificar a mesma conta sem configurar duas vezes', async () => {
  const { identifyPurchaser, productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  await Promise.all([identifyPurchaser('player'), productPrices('player')]);
  expect(mockConfigure).toHaveBeenCalledTimes(1);
  expect(mockConfigure).toHaveBeenCalledWith({ apiKey: 'test_public_key', appUserID: 'player', preferredUILocaleOverride: 'pt-BR' });
  expect(mockLogIn).not.toHaveBeenCalled();
});

test('preços aguardam a troca de conta no RevenueCat', async () => {
  const { identifyPurchaser, productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  await identifyPurchaser('guest');
  let finishLogin!: () => void;
  mockLogIn.mockImplementation(() => new Promise<void>((resolve) => { finishLogin = resolve; }));
  const pending = productPrices('linked');
  await Promise.resolve();
  expect(mockLogIn).toHaveBeenCalledWith('linked');
  expect(mockGetProducts).not.toHaveBeenCalled();
  finishLogin();
  await pending;
  expect(mockGetProducts).toHaveBeenCalledTimes(1);
});

test('uma falha de identificação não impede a próxima tentativa', async () => {
  const { identifyPurchaser, productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  await identifyPurchaser('guest');
  mockLogIn.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
  await expect(productPrices('linked')).rejects.toThrow('offline');
  await expect(productPrices('linked')).resolves.toEqual({});
  expect(mockLogIn).toHaveBeenCalledTimes(2);
});

test('consulta somente a assinatura e usa o preço localizado sem converter moedas', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_membership_monthly', priceString: '$3.99' }]);
  await expect(productPrices('player')).resolves.toEqual({ zr_membership_monthly: '$3.99' });
  expect(mockGetProducts.mock.calls.every((call) => call[1] === 'subscription')).toBe(true);
});

test('consulta a assinatura na categoria própria e usa o preço localizado da loja', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation((ids: string[]) => Promise.resolve(ids.includes('zr_membership_monthly') ? [{ identifier: 'zr_membership_monthly', priceString: 'R$ 19,90' }] : []));
  await expect(productPrices('player')).resolves.toEqual({ zr_membership_monthly: 'R$ 19,90' });
  expect(mockGetProducts).toHaveBeenCalledWith(['zr_membership_monthly'], 'subscription');
});

test('falha da assinatura não consulta produtos de gemas ou passe', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockRejectedValue({ code: '10' });
  await expect(productPrices('player')).rejects.toMatchObject({ code: '10' });
  expect(mockGetProducts.mock.calls.every((call) => call[1] === 'subscription')).toBe(true);
});

test('recupera o plano mensal Android de um pacote do RevenueCat', async () => {
  mockRevenueCatKey = 'goog_public_key';
  jest.replaceProperty(jest.requireActual('react-native').Platform, 'OS', 'android');
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  const product = { identifier: 'zr_membership_monthly:monthly', priceString: 'R$ 19,90' };
  mockGetOfferings.mockResolvedValue({ all: { club: { availablePackages: [{ product }] } } });
  expect(await productPrices('player')).toEqual({ zr_membership_monthly: 'R$ 19,90' });
  expect(mockGetProducts).toHaveBeenCalledWith(['zr_membership_monthly:monthly'], 'subscription');
  mockPurchaseStoreProduct.mockResolvedValue({ transaction: { transactionIdentifier: 'tx-monthly' } });
  await expect(purchase('zr_membership_monthly')).resolves.toBe(true);
  expect(mockPurchaseStoreProduct).toHaveBeenCalledWith(product);
});

test('gemas e passe antigos não abrem novas compras mesmo por chamada direta', async () => {
  const { purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  for (const id of ['zr_gems_80', 'zr_gems_500', 'zr_pass_season']) {
    await expect(purchase(id)).rejects.toMatchObject({ code: 'PRODUCT_RETIRED' });
  }
  expect(mockPurchaseStoreProduct).not.toHaveBeenCalled();
});

test('produto rejeitado pela loja não cria uma entrega pendente', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_membership_monthly', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '5' });
  await expect(purchase('zr_membership_monthly')).rejects.toMatchObject({ name: 'Error', message: 'Compra não iniciada', code: '5' });
});

test('item já comprado sincroniza a loja sem abrir outra cobrança nem inventar recibo', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_membership_monthly', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '6' });
  const receipt = jest.fn();
  await expect(purchase('zr_membership_monthly', receipt)).rejects.toMatchObject({ code: '6' });
  expect(mockSync).toHaveBeenCalledTimes(1);
  expect(mockPurchaseStoreProduct).toHaveBeenCalledTimes(1);
  expect(receipt).not.toHaveBeenCalled();
});

test('falha na sincronização preserva o código de propriedade e seu diagnóstico', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_membership_monthly', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '6' });
  mockSync.mockRejectedValue({ code: '11', message: 'secret' });
  await expect(purchase('zr_membership_monthly')).rejects.toMatchObject({ code: '6' });
  const { useStoreDiagnostics } = jest.requireActual<typeof import('../storeDiagnostics')>('../storeDiagnostics');
  expect(useStoreDiagnostics.getState().entries).toEqual(expect.arrayContaining([expect.objectContaining({ stage: 'sync', code: '11' })]));
  expect(JSON.stringify(useStoreDiagnostics.getState())).not.toContain('secret');
});

test('consulta sem filtro recupera somente o plano mensal esperado no Android', async () => {
  mockRevenueCatKey = 'goog_public_key';
  jest.replaceProperty(jest.requireActual('react-native').Platform, 'OS', 'android');
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation(async (ids: string[]) => ids[0] === 'zr_membership_monthly' ? [
    { identifier: 'zr_membership_monthly:annual', priceString: 'R$ 199,00' },
    { identifier: 'zr_membership_monthly:monthly', priceString: 'R$ 19,90' },
  ] : []);
  expect(await productPrices('player')).toEqual({ zr_membership_monthly: 'R$ 19,90' });
});

test('outro plano não é vendido como mensal e aparece no diagnóstico', async () => {
  mockRevenueCatKey = 'goog_public_key';
  jest.replaceProperty(jest.requireActual('react-native').Platform, 'OS', 'android');
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation(async (ids: string[]) => ids[0] === 'zr_membership_monthly' ? [
    { identifier: 'zr_membership_monthly:annual', priceString: 'R$ 199,00' },
  ] : []);
  expect(await productPrices('player')).toEqual({});
  const { useStoreDiagnostics } = jest.requireActual<typeof import('../storeDiagnostics')>('../storeDiagnostics');
  expect(useStoreDiagnostics.getState().entries).toEqual(expect.arrayContaining([expect.objectContaining({ stage: 'membershipPlans', code: 'EXPECTED_PLAN_NOT_RETURNED', products: ['zr_membership_monthly:annual'] })]));
});
