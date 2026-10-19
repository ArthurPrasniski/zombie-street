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
  discordWebhookUrl: string | null;
  discordWorker: boolean;
  admobRewardedUnitIds: string[];
}

const list = (value: string | undefined): string[] => (value ?? '').split(',').map((v) => v.trim()).filter(Boolean);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const jwtSecret = env.JWT_SECRET ?? (production ? '' : 'dev-secret-nao-use-em-producao');
  if (production && jwtSecret.length < 32) throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres em produção');
  const databaseUrl = env.DATABASE_URL?.trim() || null;
  if (production && !databaseUrl) throw new Error('DATABASE_URL é obrigatória em produção: configure a conexão interna do PostgreSQL no Dokploy');
  const devRoutes = !production && env.DEV_ROUTES !== '0';
  const discordWebhookUrl = env.DISCORD_WEBHOOK_URL?.trim() || null;
  if (discordWebhookUrl) {
    let valid = false;
    try {
      const url = new URL(discordWebhookUrl);
      valid = url.protocol === 'https:' && !url.username && !url.password && !url.port
        && ['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com'].includes(url.hostname)
        && /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w.-]+$/.test(url.pathname);
    } catch { /* Mensagem sem o valor secreto. */ }
    if (!valid) throw new Error('DISCORD_WEBHOOK_URL precisa ser uma URL HTTPS válida de webhook do Discord');
  }
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl,
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
    discordWebhookUrl,
    discordWorker: env.DISCORD_WORKER !== '0',
    admobRewardedUnitIds: list(env.ADMOB_REWARDED_UNIT_IDS).map((id) => id.split('/').pop()!),
  };
}
