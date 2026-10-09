// Contrato da API do servidor (docs/BACKEND.md): corpos de pedido e de resposta.
import type { CoinPackId } from './catalog';
import type { PassReward, PassTrack } from './pass';
import type { PushPrefs } from './push';

export type Provider = 'google' | 'apple';

export interface Session {
  token: string;
  user: UserInfo;
  /** O login levou para outra conta que já existia: o app pergunta qual save usar. */
  switched?: boolean;
}

export interface UserInfo {
  id: string;
  /** Contas vinculadas; vazio = convidado. */
  providers: Provider[];
  email: string | null;
  name: string | null;
}

/** Pedidos de login. O convidado manda só o id do aparelho. */
export interface GuestLogin { deviceId: string }
export interface GoogleLogin { idToken: string }
export interface AppleLogin { identityToken: string; name?: string | null }

/** Save na nuvem: o progresso inteiro (JSON) com a revisão para detectar conflito. */
export interface CloudSave {
  revision: number;
  /** Versão do formato do progresso (STORAGE_VERSION do app). */
  version: number;
  data: unknown;
  updatedAt: string;
}
export interface PutSave { baseRevision: number; version: number; data: unknown }

export interface Wallet { gems: number }

/** Comprar moedas com gemas. `requestId` deixa o pedido repetível sem cobrar duas vezes. */
export interface BuyCoins { pack: CoinPackId; stage: number; requestId: string }
export interface BuyCoinsResult { requestId: string; gems: number; coins: number }

export interface PassState {
  season: string;
  endsAt: string;
  xp: number;
  tier: number;
  premium: boolean;
  premiumUntil: string | null;
  claimedFree: number[];
  claimedPremium: number[];
  xpToday: number;
}
export interface AddXp { amount: number }
export interface ClaimPass { tier: number; track: PassTrack; stage: number }
/** As gemas do prêmio já entram na carteira; as moedas o app soma no progresso. */
export interface ClaimResult { reward: PassReward; pass: PassState; gems: number }

export interface ApiError { error: string }

/** Aparelho que recebe avisos remotos, com o fuso (para a janela do dia) e as categorias ligadas. */
export interface PushRegister {
  token: string;
  platform: 'ios' | 'android';
  timeZone: string;
  prefs: PushPrefs;
}
export interface PushUnregister { token: string }
/** Aviso para todos (rota de administração). O `id` evita mandar o mesmo aviso duas vezes. */
export interface AdminPush { id: string; title: string; body: string; url?: string }
