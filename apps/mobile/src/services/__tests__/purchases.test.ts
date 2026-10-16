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
  expect(mockGetProducts).toHaveBeenCalledTimes(3);
});

test('uma falha de identificação não impede a próxima tentativa', async () => {
  const { identifyPurchaser, productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  await identifyPurchaser('guest');
  mockLogIn.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
  await expect(productPrices('linked')).rejects.toThrow('offline');
  await expect(productPrices('linked')).resolves.toEqual({});
  expect(mockLogIn).toHaveBeenCalledTimes(2);
});

test('usa os preços localizados dos produtos retornados pelo SDK', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation((ids: string[]) => Promise.resolve(
    ids.includes('zr_gems_80')
      ? [{ identifier: 'zr_gems_80', priceString: 'R$ 4,90' }]
      : [{ identifier: 'zr_pass_season', priceString: 'R$ 19,90' }],
  ));
  await expect(productPrices('player')).resolves.toEqual({ zr_gems_80: 'R$ 4,90', zr_pass_season: 'R$ 19,90' });
});

test('não troca USD por BRL quando a loja retorna um preço em dólares', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_pass_season', priceString: '$3.99' }]);
  await expect(productPrices('player')).resolves.toEqual({ zr_pass_season: '$3.99' });
});

test('consulta a assinatura na categoria própria e usa o preço localizado da loja', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation((ids: string[]) => Promise.resolve(ids.includes('zr_membership_monthly') ? [{ identifier: 'zr_membership_monthly', priceString: 'R$ 19,90' }] : []));
  await expect(productPrices('player')).resolves.toEqual({ zr_membership_monthly: 'R$ 19,90' });
  expect(mockGetProducts).toHaveBeenCalledWith(['zr_membership_monthly'], 'subscription');
});

test('falha na assinatura preserva os preços de gemas e passe', async () => {
  const { productPrices } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockImplementation(async (ids: string[], category: string) => {
    if (category === 'subscription') throw new Error('subscription unavailable');
    return ids.map((identifier) => ({ identifier, priceString: 'R$ 4,99' }));
  });
  expect(await productPrices('player')).toMatchObject({ zr_gems_80: 'R$ 4,99', zr_pass_season: 'R$ 4,99' });
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

test('produto ausente é erro anterior à cobrança', async () => {
  const { purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  await expect(purchase('zr_gems_80')).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });
  expect(mockPurchaseStoreProduct).not.toHaveBeenCalled();
});

test('produto rejeitado pela loja não cria uma entrega pendente', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_gems_80', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '5' });
  await expect(purchase('zr_gems_80')).rejects.toMatchObject({ name: 'Error', message: 'Compra não iniciada', code: '5' });
});

test('item já comprado sincroniza a loja sem abrir outra cobrança nem inventar recibo', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_gems_80', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '6' });
  const receipt = jest.fn();
  await expect(purchase('zr_gems_80', receipt)).rejects.toMatchObject({ code: '6' });
  expect(mockSync).toHaveBeenCalledTimes(1);
  expect(mockPurchaseStoreProduct).toHaveBeenCalledTimes(1);
  expect(receipt).not.toHaveBeenCalled();
});

test('falha na sincronização preserva o código de propriedade e seu diagnóstico', async () => {
  const { productPrices, purchase } = jest.requireActual<typeof import('../purchases')>('../purchases');
  mockGetProducts.mockResolvedValue([{ identifier: 'zr_gems_80', priceString: 'R$ 4,99' }]);
  await productPrices('player');
  mockPurchaseStoreProduct.mockRejectedValue({ code: '6' });
  mockSync.mockRejectedValue({ code: '11', message: 'secret' });
  await expect(purchase('zr_gems_80')).rejects.toMatchObject({ code: '6' });
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
