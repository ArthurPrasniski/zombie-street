const mockConfigure = jest.fn();
const mockLogIn = jest.fn();
const mockGetProducts = jest.fn();

jest.mock('@/services/env', () => ({ NATIVE: true, KEYS: { revenueCat: 'test_public_key' } }));
jest.mock('@/services/api', () => ({ api: jest.fn() }));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: mockConfigure, logIn: mockLogIn, getProducts: mockGetProducts },
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'gems', SUBSCRIPTION: 'pass' },
}));

beforeEach(() => {
  jest.resetModules();
  mockConfigure.mockReset();
  mockLogIn.mockReset();
  mockGetProducts.mockReset();
  mockGetProducts.mockResolvedValue([]);
});

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
  expect(mockGetProducts).toHaveBeenCalledTimes(2);
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
