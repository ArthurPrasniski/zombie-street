import { AD_DOUBLES_PER_DAY } from '@shared/catalog';

import { showRewardedAd, useAdStore } from '@/services/ads';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';

// "Assista uma propaganda e dobre suas moedas" (GDD seção 19.4): só quando o jogador escolhe, até
// AD_DOUBLES_PER_DAY vezes por dia (no fuso do aparelho). As moedas são do aparelho, então a
// conta é feita aqui.

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function doublesLeft(): number {
  const { ads } = useAccountStore.getState();
  return AD_DOUBLES_PER_DAY - (ads.day === today() ? ads.count : 0);
}

/** O botão aparece: há moedas para dobrar, propaganda carregada e ainda há vezes hoje. */
export const canDouble = (coins: number, adReady: boolean): boolean => coins > 0 && adReady && doublesLeft() > 0;

/** Mostra a propaganda; se assistiu até o fim, soma de novo as moedas da partida. */
export async function doubleCoins(coins: number): Promise<boolean> {
  if (!canDouble(coins, useAdStore.getState().ready)) return false;
  const rewarded = await showRewardedAd();
  if (!rewarded) return false;
  useProgressStore.getState().addCash(coins);
  const { ads } = useAccountStore.getState();
  const day = today();
  useAccountStore.setState({ ads: { day, count: (ads.day === day ? ads.count : 0) + 1 } });
  return true;
}
