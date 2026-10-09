# BACKEND — Zombie Road

Conta, save na nuvem, gemas, loja, Passe de Batalha e propagandas. O jogo continua
funcionando offline: o servidor só entra para conta, nuvem e dinheiro de verdade.

## Visão geral

```
App (Expo / React Native)
 ├─ jogo offline (motor, progresso no aparelho) ── save na nuvem ──┐
 ├─ login: Google / Apple (nativo) ──── idToken ───────────────────┤
 ├─ compras: RevenueCat ──► App Store / Google Play                │
 └─ propagandas: AdMob (premiadas, só quando o jogador escolhe)    │
                                                                   ▼
Servidor próprio (server/: Node 24 + Fastify + Postgres)
 ├─ confere os tokens do Google/Apple (chaves públicas, JWKS) e dá a sessão (JWT)
 ├─ save na nuvem com revisão (detecta conflito entre aparelhos)
 ├─ carteira de gemas (só o servidor mexe), loja de moedas, Passe
 └─ webhook do RevenueCat ◄── compras e assinatura confirmadas pela loja
```

**Quem guarda o quê**

| Dado | Onde | Por quê |
| ---- | ---- | ------- |
| Progresso (fases, cartas, deck, estrelas, moedas…) | Aparelho, com cópia na nuvem | Joga offline; trocar de aparelho não perde nada |
| Gemas | Só no servidor | Compradas com dinheiro: só a loja (via RevenueCat) credita |
| Passe (XP, prêmios pegos, assinatura) | Servidor | A assinatura vem da loja; prêmios uma vez só |
| "Assista e dobre" | Aparelho (limite por dia) | Dobra moedas, que já são do aparelho |

O motor é determinístico (semente): se um dia houver ranking, dá para o servidor
repetir a partida pelas jogadas e conferir o resultado.

## Pastas

```
shared/            contrato comum (app e servidor): catalog.ts (gemas, moedas, passe),
                   pass.ts (regras puras do passe), api.ts (corpos da API)
server/            servidor (pacote próprio, fora do app)
  src/app.ts       monta o Fastify com as dependências (testes trocam banco e verificador)
  src/auth.ts      sessão (JWT HS256) e verificação dos tokens Google/Apple
  src/db.ts        Postgres (pg) ou PGlite (Postgres embutido) com a mesma interface
  src/store/       users, saves, wallet, pass, revenuecat (regras com SQL)
  src/routes/      auth, game (save, carteira, loja, passe), webhooks
  migrations/      SQL em ordem (npm run migrate)
  test/            node:test + PGlite em memória (Postgres de verdade)
src/services/      no app: env, api, session, cloudSave, economy, purchases, ads, signIn, rewards
```

## Rodando localmente

1. Servidor: `cd server && npm install && npm run dev`. Sem `DATABASE_URL`, usa o
   PGlite em `server/.data/` (não precisa de Docker). Com Postgres:
   `docker compose -f server/docker-compose.yml up -d` e `DATABASE_URL=...`.
2. App: crie `.env.local` a partir de `.env.example` com
   `EXPO_PUBLIC_API_URL=http://localhost:3000` (no celular, o IP do Mac na rede) e
   rode `npm run start`.
3. **No Expo Go** não há login nativo, compras nem AdMob. O app usa a versão
   simulada: login "dev:google"/"dev:apple" (o servidor aceita em modo dev), compra
   pela rota `/dev/purchase` e uma propaganda de teste desenhada pelo app.
4. **Development build** (login, compras e anúncios de verdade):
   `eas build --profile development --platform ios|android`, instale no aparelho e
   rode `npm run start` normalmente (o app abre no build em vez do Expo Go).

Testes: `npm test` (app, inclui `shared/`) e `cd server && npm test`.

## API

Todas as rotas, menos login, health e webhook, pedem `Authorization: Bearer <sessão>`.

| Rota | Faz |
| ---- | --- |
| `POST /auth/guest {deviceId}` | Convidado do aparelho (mesmo id → mesma conta) |
| `POST /auth/google {idToken}` | Login Google; com sessão de convidado, vincula |
| `POST /auth/apple {identityToken, name?}` | Login Apple (o nome só vem no 1º login) |
| `GET /me` · `DELETE /me` | Conta · excluir conta (exigência das lojas) |
| `GET /save` · `PUT /save {baseRevision, version, data}` | Save na nuvem; 409 = conflito (devolve o da nuvem) |
| `GET /wallet` | Gemas |
| `POST /shop/coins {pack, stage, requestId}` | Gemas → moedas (repetível pelo `requestId`) |
| `GET /pass` · `POST /pass/xp {amount}` · `POST /pass/claim {tier, track, stage}` | Passe |
| `POST /webhooks/revenuecat` | Compras e assinatura (cabeçalho `Authorization` combinado) |
| `POST /dev/purchase {productId}` | Só em dev: simula a compra para a conta logada |

## Banco (Postgres)

`users` (convidado: `device_id`), `identities` (provider + subject), `saves` (JSON +
revisão), `wallets` (gemas ≥ 0), `ledger` (todo movimento de gemas e prêmios, único por
`reason + ref`: pedido repetido não conta duas vezes), `purchases` (uma linha por
transação da loja), `subscriptions` (passe ativo até `expires_at`), `pass_progress`
(XP, prêmios pegos, teto diário), `webhook_events` (evento já processado).

## Fluxos

- **Conta**: todo aparelho começa como convidado. Entrar com Google/Apple vincula o
  convidado (mesma conta, o aparelho fica livre para um convidado novo). Se a conta
  Google já existia (outro aparelho), troca para ela: as gemas do convidado vão junto e
  o app pergunta qual progresso usar. "Sair" volta a um convidado novo; o progresso do
  aparelho fica.
- **Save na nuvem**: o app manda o progresso 4 s depois de cada mudança e ao sair do
  app, com a revisão em que se baseou. Só um lado mudou: ele vence. Os dois mudaram: o
  jogador escolhe (resumo de cada um). Instalação nova sem progresso: a nuvem vence.
- **Compra de gemas**: o app chama `Purchases.logIn(userId)` depois do login; a loja
  confirma, o RevenueCat manda o webhook com o nosso `userId` e o servidor credita (uma
  vez por transação). O app confere a carteira algumas vezes até chegar. Reembolso:
  tira as gemas (sem negativar).
- **Moedas por gemas**: o servidor desconta as gemas e devolve as moedas; o app soma no
  progresso uma vez por `requestId`.
- **Passe**: XP vem das partidas (com teto diário no servidor, porque o jogo roda no
  aparelho). Premium = assinatura ativa (webhook). Prêmio pego uma vez por nível e
  trilha; gemas vão para a carteira, moedas o app soma.
- **Propaganda**: AdMob premiada, depois do consentimento (UMP: LGPD/GDPR e o aviso de
  rastreamento do iOS). Só aparece o botão com propaganda carregada.

## Segurança

- Tokens do Google/Apple conferidos pela assinatura, emissor e público (client ID /
  bundle ID). Sessão própria assinada (`JWT_SECRET` com 32+ caracteres em produção).
- Gemas e passe só mudam no servidor; tudo que mexe em gemas é transacional e
  idempotente. Webhook protegido pelo cabeçalho combinado no RevenueCat.
- Rotas de dev (`/dev/*` e tokens "dev:") desligadas em produção (`NODE_ENV=production`).
- A fazer antes de lançar: limite de pedidos por IP (rate limit), HTTPS no domínio,
  backups do Postgres, revogar o token da Apple ao excluir a conta (exigência da Apple:
  precisa da chave do "Sign in with Apple").

## Configuração externa (o que você precisa criar)

1. **Google Cloud** (OAuth): um client **Web** (o `webClientId`, também em
   `GOOGLE_CLIENT_IDS` no servidor), um **iOS** (bundle `com.arthurprasniski.estradazumbi`)
   e um **Android** (pacote + SHA-1 da chave do EAS e da Play). Tela de consentimento
   publicada.
2. **Apple Developer**: ativar "Sign in with Apple" no App ID. `APPLE_AUDIENCES` = bundle ID.
3. **App Store Connect / Play Console**: produtos consumíveis `zr_gems_80`, `zr_gems_500`,
   `zr_gems_1200`, `zr_gems_2600`, `zr_gems_7000` e a assinatura mensal
   `zr_pass_monthly`, com os preços (sugestão no GDD seção 19).
4. **RevenueCat**: projeto com os apps iOS e Android, os mesmos produtos, o entitlement
   `pass` ligado à assinatura, as chaves públicas no `.env.local` e o webhook apontando
   para `https://SEU-DOMINIO/webhooks/revenuecat` com um cabeçalho `Authorization` igual
   ao `REVENUECAT_WEBHOOK_AUTH` do servidor.
5. **AdMob**: app iOS e Android (IDs em `ADMOB_*_APP_ID`), um bloco "Premiado" por
   plataforma (`EXPO_PUBLIC_ADMOB_REWARDED_*`), a mensagem de consentimento (Privacidade
   e mensagens) e o `app-ads.txt` no site. Sem isso, o app usa os IDs de teste do Google.
6. **Hospedagem**: um serviço com Docker (Railway, Render, Fly…) e Postgres gerenciado.
   Imagem: `docker build -f server/Dockerfile .` (da raiz). Variáveis do
   `server/.env.example`.
7. **Lojas**: política de privacidade publicada, "Excluir conta" (já no app), formulário
   de segurança de dados (Play) e privacidade (App Store) declarando login, compras e
   anúncios.
