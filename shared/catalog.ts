// Catálogo da loja e regras do passe (GDD seção 19). Usado pelo app e pelo servidor: os números
// moram aqui uma vez só. Sem imports de React Native nem de Node.

/** Pacotes de gemas vendidos com dinheiro (App Store / Google Play, via RevenueCat). */
export interface GemPack {
  /** Id do produto nas lojas (o mesmo no RevenueCat). */
  productId: string;
  gems: number;
  /** Selo de destaque na loja. */
  badge?: 'popular' | 'best';
}

export const GEM_PACKS: GemPack[] = [
  { productId: 'zr_gems_80', gems: 80 },
  { productId: 'zr_gems_500', gems: 500, badge: 'popular' },
  { productId: 'zr_gems_1200', gems: 1200 },
  { productId: 'zr_gems_2600', gems: 2600 },
  { productId: 'zr_gems_7000', gems: 7000, badge: 'best' },
];

export const gemPack = (productId: string): GemPack | undefined => GEM_PACKS.find((p) => p.productId === productId);

/** Assinatura mensal do Passe de Batalha e o direito (entitlement) que ela libera no RevenueCat. */
export const PASS_PRODUCT_ID = 'zr_pass_monthly';
export const PASS_ENTITLEMENT = 'pass';

// ---------- Moedas compradas com gemas ----------

export type CoinPackId = 'sack' | 'chest' | 'vault';

/** Pacotes de moedas: custo em gemas e bônus sobre o valor base. */
export const COIN_PACKS: Record<CoinPackId, { gems: number; bonus: number }> = {
  sack: { gems: 60, bonus: 1 },
  chest: { gems: 300, bonus: 1.1 },
  vault: { gems: 1200, bonus: 1.2 },
};
export const COIN_PACK_IDS = Object.keys(COIN_PACKS) as CoinPackId[];

/** Moedas por gema na fase s: cresce como a recompensa dos zumbis (+8% por fase). */
export const COINS_PER_GEM = 25;
export const COIN_GROWTH_PER_STAGE = 0.08;

export function progressFactor(stage: number): number {
  return 1 + COIN_GROWTH_PER_STAGE * (Math.max(1, Math.floor(stage)) - 1);
}

/** Moedas do pacote para quem está na fase `stage` (a próxima a vencer). */
export function coinPackCoins(pack: CoinPackId, stage: number): number {
  const p = COIN_PACKS[pack];
  return Math.round(p.gems * COINS_PER_GEM * progressFactor(stage) * p.bonus);
}

// ---------- Propaganda premiada ----------

/** "Assista e dobre": quantas vezes por dia (no fuso do aparelho). */
export const AD_DOUBLES_PER_DAY = 10;
