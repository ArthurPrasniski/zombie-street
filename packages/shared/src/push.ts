// Notificações (GDD seção 20). As locais o aparelho agenda sozinho; as remotas o servidor manda.
// Regras comuns: categorias que o jogador liga e desliga em Ajustes, a janela do dia em que
// avisos podem chegar e a tela que cada aviso abre.

/** Avisos locais (agendados pelo aparelho ao sair do app). */
export type LocalPushKind = 'comeback' | 'upgrade' | 'passRewards' | 'seasonEnd' | 'dailyReset' | 'survival';
/** Avisos remotos (enviados pelo servidor). */
export type RemotePushKind = 'purchase' | 'billing' | 'season' | 'news';
export type PushKind = LocalPushKind | RemotePushKind;

export type PushCategory = 'progress' | 'pass' | 'shop' | 'news';
export const PUSH_CATEGORIES: PushCategory[] = ['progress', 'pass', 'shop', 'news'];
export type PushPrefs = Record<PushCategory, boolean>;
export const DEFAULT_PUSH_PREFS: PushPrefs = { progress: true, pass: true, shop: true, news: true };

export const PUSH_CATEGORY: Record<PushKind, PushCategory> = {
  comeback: 'progress',
  upgrade: 'progress',
  dailyReset: 'progress',
  survival: 'progress',
  passRewards: 'pass',
  seasonEnd: 'pass',
  season: 'pass',
  purchase: 'shop',
  billing: 'shop',
  news: 'news',
};

/** Tela que o aviso abre ao ser tocado (rotas do Expo Router no app). */
export const PUSH_ROUTE: Record<PushKind, string> = {
  comeback: '/',
  upgrade: '/deck',
  dailyReset: '/',
  survival: '/',
  passRewards: '/pass',
  seasonEnd: '/pass',
  season: '/pass',
  purchase: '/shop',
  billing: '/pass',
  news: '/',
};

/** Avisos só chegam entre 9h e 21h (hora local do jogador). */
export const PUSH_HOURS = { start: 9, end: 21 };
export const isQuietHour = (hour: number): boolean => hour < PUSH_HOURS.start || hour >= PUSH_HOURS.end;

/** Dados que vão junto com todo aviso (o app usa para abrir a tela certa). */
export interface PushData {
  kind: PushKind;
  url: string;
}

export const pushData = (kind: PushKind, url = PUSH_ROUTE[kind]): PushData => ({ kind, url });

/** Só deixa passar rotas do próprio app (avisos do servidor podem trazer uma rota). */
export const isAppRoute = (url: unknown): url is string => typeof url === 'string' && /^\/(?!\/)[\w/?=&.-]*$/.test(url);
