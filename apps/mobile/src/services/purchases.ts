import { Linking, Platform } from 'react-native';

import { GEM_PACKS, isMembershipProduct, MEMBERSHIP, PASS_PRODUCT_ID } from '@zombie-road/shared/catalog';

import { api } from '@/services/api';
import { KEYS, NATIVE } from '@/services/env';
import { localeTag, regionCode } from '@/i18n/locale';
import { formatMoney } from '@/utils/format';
import { PurchaseNotStartedError } from '@/services/purchaseErrors';
import { recordStoreDiagnostic } from '@/services/storeDiagnostics';

// Compras pela App Store / Google Play com o RevenueCat. Quem credita as gemas e ativa o passe é
// o servidor (webhook do RevenueCat); aqui só abrimos a compra. No Expo Go, a compra é simulada
// pela rota de desenvolvimento do servidor.

type PurchasesModule = typeof import('react-native-purchases');
type Product = import('react-native-purchases').PurchasesStoreProduct;

// Preços de exemplo para a compra simulada (os de verdade vêm da loja)
const DEMO_PRICES = {
  BRL: { zr_gems_80: 4.9, zr_gems_500: 24.9, zr_gems_1200: 49.9, zr_gems_2600: 99.9, zr_gems_7000: 249.9, [PASS_PRODUCT_ID]: 19.9, [MEMBERSHIP.productId]: 19.9 },
  USD: { zr_gems_80: 0.99, zr_gems_500: 4.99, zr_gems_1200: 9.99, zr_gems_2600: 19.99, zr_gems_7000: 49.99, [PASS_PRODUCT_ID]: 3.99, [MEMBERSHIP.productId]: 3.99 },
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
    recordStoreDiagnostic('identity');
  });
  identification = task.catch((error) => { recordStoreDiagnostic('identity', error); });
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
  const membershipId = Platform.OS === 'android' && !KEYS.revenueCat.startsWith('test_') ? MEMBERSHIP.androidProductId : MEMBERSHIP.productId;
  const results = await Promise.allSettled([
    Purchases.getProducts(GEM_PACKS.map((p) => p.productId), PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    Purchases.getProducts([PASS_PRODUCT_ID], PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    Purchases.getProducts([membershipId], PRODUCT_CATEGORY.SUBSCRIPTION),
  ]);
  const stages = ['gems', 'pass', 'membership'] as const;
  results.forEach((result, index) => recordStoreDiagnostic(stages[index], result.status === 'rejected' ? result.reason : result.value.length ? undefined : { code: 'PRODUCT_NOT_RETURNED' }, result.status === 'fulfilled' ? result.value.map((p) => p.identifier) : []));
  const products = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (membershipId !== MEMBERSHIP.productId && !products.some((p) => isMembershipProduct(p.identifier))) {
    try {
      // Query the subscription without a plan filter to support older native SDKs
      // and diagnose a catalog that returns a different base-plan identifier.
      const plans = await Purchases.getProducts([MEMBERSHIP.productId], PRODUCT_CATEGORY.SUBSCRIPTION);
      const monthly = plans.filter((p) => p.identifier === MEMBERSHIP.androidProductId);
      products.push(...monthly);
      recordStoreDiagnostic('membershipPlans', monthly.length ? undefined : { code: 'EXPECTED_PLAN_NOT_RETURNED' }, plans.map((p) => p.identifier));
    } catch (error) { recordStoreDiagnostic('membershipPlans', error); }
  }
  if (!products.some((p) => isMembershipProduct(p.identifier))) {
    // Offerings can expose the selected Google Play base plan as a package.
    try {
      const offerings = await Purchases.getOfferings();
      for (const offering of Object.values(offerings.all)) {
        for (const pack of offering.availablePackages) {
          if (isMembershipProduct(pack.product.identifier)) products.push(pack.product);
        }
      }
      recordStoreDiagnostic('offerings', products.some((p) => isMembershipProduct(p.identifier)) ? undefined : { code: 'MEMBERSHIP_NOT_RETURNED' });
    } catch (error) { recordStoreDiagnostic('offerings', error); }
  }
  if (!products.length && results.every((result) => result.status === 'rejected')) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  const idOf = (product: Product) => isMembershipProduct(product.identifier) ? MEMBERSHIP.productId : product.identifier;
  for (const product of products) cache.set(idOf(product), product);
  return Object.fromEntries(products.map((p) => [idOf(p), p.priceString]));
}

export async function restorePurchases(): Promise<void> {
  if (NATIVE) await rc().default.restorePurchases();
}

/** Resubmit existing store receipts; this never starts a new payment. */
export async function syncStorePurchases(userId: string) {
  if (!NATIVE) return null;
  await identifyPurchaser(userId);
  try {
    const result = await rc().default.syncPurchasesForResult();
    recordStoreDiagnostic('sync');
    return result.customerInfo;
  } catch (error) { recordStoreDiagnostic('sync', error); throw error; }
}

export async function manageSubscriptions(): Promise<void> {
  if (!NATIVE) return;
  if (Platform.OS === 'android') await Linking.openURL('https://play.google.com/store/account/subscriptions');
  else await rc().default.showManageSubscriptions();
}

/** Abre a compra. true = comprou; false = cancelou. As gemas chegam pelo servidor. */
export async function purchase(productId: string, onReceipt?: (transactionId: string) => void): Promise<boolean> {
  if (!NATIVE) {
    const res = await api<{ transactionId: string }>('POST', '/dev/purchase', { productId });
    onReceipt?.(res.transactionId);
    return true;
  }
  const product = cache.get(productId);
  if (!product) throw new PurchaseNotStartedError('PRODUCT_UNAVAILABLE');
  try {
    const result = await rc().default.purchaseStoreProduct(product);
    onReceipt?.(result.transaction.transactionIdentifier);
    return true;
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    const code = String((error as { code?: unknown }).code ?? '');
    const C = rc().PURCHASES_ERROR_CODE;
    recordStoreDiagnostic('purchase', error);
    if (code === C.PRODUCT_ALREADY_PURCHASED_ERROR && configuredFor) {
      try { await syncStorePurchases(configuredFor); }
      catch { /* Diagnostics retain the sync error; ownership still protects this product. */ }
    }
    if ([C.PURCHASE_NOT_ALLOWED_ERROR, C.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR].some((value) => value !== undefined && String(value) === code)) {
      throw new PurchaseNotStartedError(code);
    }
    throw error;
  }
}
