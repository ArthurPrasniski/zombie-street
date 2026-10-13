import { GEM_PACKS, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';

import { api } from '@/services/api';
import { KEYS, NATIVE } from '@/services/env';
import { localeTag, regionCode } from '@/i18n/locale';
import { formatMoney } from '@/utils/format';

// Compras pela App Store / Google Play com o RevenueCat. Quem credita as gemas e ativa o passe é
// o servidor (webhook do RevenueCat); aqui só abrimos a compra. No Expo Go, a compra é simulada
// pela rota de desenvolvimento do servidor.

type PurchasesModule = typeof import('react-native-purchases');
type Product = import('react-native-purchases').PurchasesStoreProduct;

// Preços de exemplo para a compra simulada (os de verdade vêm da loja)
const DEMO_PRICES = {
  BRL: { zr_gems_80: 4.9, zr_gems_500: 24.9, zr_gems_1200: 49.9, zr_gems_2600: 99.9, zr_gems_7000: 249.9, [PASS_PRODUCT_ID]: 19.9 },
  USD: { zr_gems_80: 0.99, zr_gems_500: 4.99, zr_gems_1200: 9.99, zr_gems_2600: 19.99, zr_gems_7000: 49.99, [PASS_PRODUCT_ID]: 3.99 },
};

let configuredFor: string | null = null;
let identification: Promise<void> = Promise.resolve();
const cache = new Map<string, Product>();
const rc = () => require('react-native-purchases') as PurchasesModule;

/** Compras de verdade disponíveis (fora do Expo Go e com a chave do RevenueCat). */
export const purchasesAvailable = (): boolean => !NATIVE || KEYS.revenueCat.length > 0;

/** Liga o RevenueCat à nossa conta: o webhook chega com o id dela. */
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!NATIVE || !KEYS.revenueCat) return;
  const task = identification.then(async () => {
    if (configuredFor === userId) return;
    const Purchases = rc().default;
    if (configuredFor === null) Purchases.configure({ apiKey: KEYS.revenueCat, appUserID: userId, preferredUILocaleOverride: localeTag });
    else await Purchases.logIn(userId);
    configuredFor = userId;
  });
  identification = task.catch(() => undefined);
  await task;
}

/** Preço de cada produto (gemas e passe), no formato da loja. */
export async function productPrices(userId?: string): Promise<Record<string, string>> {
  if (!NATIVE) {
    const currency = regionCode === 'BR' ? 'BRL' : 'USD';
    return Object.fromEntries(Object.entries(DEMO_PRICES[currency]).map(([id, price]) => [id, formatMoney(price, currency)]));
  }
  if (userId) await identifyPurchaser(userId);
  else await identification;
  if (!configuredFor) return {};
  const { default: Purchases, PRODUCT_CATEGORY } = rc();
  const [gems, pass] = await Promise.all([
    Purchases.getProducts(GEM_PACKS.map((p) => p.productId), PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    Purchases.getProducts([PASS_PRODUCT_ID], PRODUCT_CATEGORY.NON_SUBSCRIPTION),
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
