// Configuração do servidor pelas variáveis de ambiente (ver .env.example e docs/BACKEND.md).

export interface Config {
  port: number;
  /** Postgres de produção; sem ele, usa o PGlite (Postgres embutido) em `dataDir`. */
  databaseUrl: string | null;
  dataDir: string;
  /** Segredo da sessão (JWT). Obrigatório em produção. */
  jwtSecret: string;
  /** Client IDs do Google aceitos como `aud` do idToken (o webClientId do app). */
  googleClientIds: string[];
  /** Bundle IDs aceitos como `aud` do token da Apple. */
  appleAudiences: string[];
  /** Valor do cabeçalho Authorization que o RevenueCat manda no webhook. */
  revenueCatWebhookAuth: string | null;
  /** Atalhos de desenvolvimento: login "dev:nome" e compra simulada. Nunca em produção. */
  devRoutes: boolean;
  /** Notificações: token de acesso do serviço de push da Expo (opcional, "segurança reforçada"). */
  expoAccessToken: string | null;
  /** Liga o worker que manda as notificações (um só por banco) e o intervalo entre as rodadas. */
  pushWorker: boolean;
  pushIntervalMs: number;
  /** Senha da rota /admin/push (avisos para todos). Sem ela, a rota fica fechada. */
  adminToken: string | null;
  production: boolean;
}

const list = (value: string | undefined): string[] => (value ?? '').split(',').map((v) => v.trim()).filter(Boolean);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const jwtSecret = env.JWT_SECRET ?? (production ? '' : 'dev-secret-nao-use-em-producao');
  if (production && jwtSecret.length < 32) throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres em produção');
  const devRoutes = !production && env.DEV_ROUTES !== '0';
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL ?? null,
    dataDir: env.DATA_DIR ?? '.data/pglite',
    jwtSecret,
    googleClientIds: list(env.GOOGLE_CLIENT_IDS),
    appleAudiences: list(env.APPLE_AUDIENCES),
    revenueCatWebhookAuth: env.REVENUECAT_WEBHOOK_AUTH ?? null,
    devRoutes,
    expoAccessToken: env.EXPO_ACCESS_TOKEN || null,
    pushWorker: env.PUSH_WORKER !== '0',
    pushIntervalMs: Number(env.PUSH_INTERVAL_MS ?? 15000),
    adminToken: env.ADMIN_TOKEN || null,
    production,
  };
}
