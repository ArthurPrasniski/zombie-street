import { GEM_PACKS, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';

import { api } from '@/services/api';
import { KEYS, NATIVE } from '@/services/env';

// Compras pela App Store / Google Play com o RevenueCat. Quem credita as gemas e ativa o passe é
// o servidor (webhook do RevenueCat); aqui só abrimos a compra. No Expo Go, a compra é simulada
// pela rota de desenvolvimento do servidor.

type PurchasesModule = typeof import('react-native-purchases');
type Product = import('react-native-purchases').PurchasesStoreProduct;

// Preços de exemplo para a compra simulada (os de verdade vêm da loja)
const MOCK_PRICES: Record<string, string> = {
  zr_gems_80: 'R$ 4,90',
  zr_gems_500: 'R$ 24,90',
  zr_gems_1200: 'R$ 49,90',
  zr_gems_2600: 'R$ 99,90',
  zr_gems_7000: 'R$ 249,90',
  [PASS_PRODUCT_ID]: 'R$ 19,90/mês',
};

let configuredFor: string | null = null;
const cache = new Map<string, Product>();
const rc = () => require('react-native-purchases') as PurchasesModule;

/** Compras de verdade disponíveis (fora do Expo Go e com a chave do RevenueCat). */
export const purchasesAvailable = (): boolean => !NATIVE || KEYS.revenueCat.length > 0;

/** Liga o RevenueCat à nossa conta: o webhook chega com o id dela. */
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!NATIVE || !KEYS.revenueCat || configuredFor === userId) return;
  const Purchases = rc().default;
  if (configuredFor === null) Purchases.configure({ apiKey: KEYS.revenueCat, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

/** Preço de cada produto (gemas e passe), no formato da loja. */
export async function productPrices(): Promise<Record<string, string>> {
  if (!NATIVE) return MOCK_PRICES;
  if (!configuredFor) return {};
  const { default: Purchases, PRODUCT_CATEGORY } = rc();
  const [gems, pass] = await Promise.all([
    Purchases.getProducts(GEM_PACKS.map((p) => p.productId), PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    Purchases.getProducts([PASS_PRODUCT_ID], PRODUCT_CATEGORY.SUBSCRIPTION),
  ]);
  for (const product of [...gems, ...pass]) cache.set(product.identifier, product);
  return Object.fromEntries([...gems, ...pass].map((p) => [p.identifier, p.priceString]));
}

/** Abre a compra. true = comprou; false = cancelou. As gemas chegam pelo servidor. */
export async function purchase(productId: string): Promise<boolean> {
  if (!NATIVE) {
    await api('POST', '/dev/purchase', { productId });
    return true;
  }
  const product = cache.get(productId);
  if (!product) throw new Error('Produto indisponível na loja');
  try {
    await rc().default.purchaseStoreProduct(product);
    return true;
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    throw error;
  }
}
