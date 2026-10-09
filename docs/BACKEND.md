# BACKEND — Zombie Road

Conta, save na nuvem, gemas, loja, Passe de Batalha, propagandas e notificações. O jogo
continua funcionando offline: o servidor só entra para conta, nuvem, dinheiro de verdade e os
avisos remotos.

## Visão geral

```
App (Expo / React Native)
 ├─ jogo offline (motor, progresso no aparelho) ── save na nuvem ──┐
 ├─ login: Google / Apple (nativo) ──── idToken ───────────────────┤
 ├─ compras: RevenueCat ──► App Store / Google Play                │
 └─ propagandas: AdMob (premiadas, só quando o jogador escolhe)    │
                                                                   ▼
Servidor próprio (apps/server: Node 24 + Fastify + Postgres)
 ├─ confere os tokens do Google/Apple (chaves públicas, JWKS) e dá a sessão (JWT)
 ├─ save na nuvem com revisão (detecta conflito entre aparelhos)
 ├─ carteira de gemas (só o servidor mexe), loja de moedas, Passe
 ├─ webhook do RevenueCat ◄── compras e assinatura confirmadas pela loja
 └─ fila de notificações ──► serviço de push da Expo ──► APNs (iOS) / FCM (Android)
```

**Quem guarda o quê**

| Dado | Onde | Por quê |
| ---- | ---- | ------- |
| Progresso (fases, cartas, deck, estrelas, moedas…) | Aparelho, com cópia na nuvem | Joga offline; trocar de aparelho não perde nada |
| Gemas | Só no servidor | Compradas com dinheiro: só a loja (via RevenueCat) credita |
| Passe (XP, prêmios pegos, assinatura) | Servidor | A assinatura vem da loja; prêmios uma vez só |
| "Assista e dobre" | Aparelho (limite por dia) | Dobra moedas, que já são do aparelho |
| Avisos locais (volta, melhoria, prêmios, fim de temporada) | Aparelho (agenda ao sair do app) | Dependem do progresso, que é do aparelho |
| Avisos remotos e o token do aparelho | Servidor | Compra, cobrança e temporada acontecem no servidor |

O motor é determinístico (semente): se um dia houver ranking, dá para o servidor
repetir a partida pelas jogadas e conferir o resultado.

## Pastas

```
packages/shared/   @zombie-road/shared, contrato comum (app e servidor): src/catalog.ts
                   (gemas, moedas, passe), src/pass.ts (regras puras do passe), src/api.ts
apps/server/       @zombie-road/server, o servidor
  src/app.ts       monta o Fastify com as dependências (testes trocam banco e verificador)
  src/auth.ts      sessão (JWT HS256) e verificação dos tokens Google/Apple
  src/db.ts        Postgres (pg) ou PGlite (Postgres embutido) com a mesma interface
  src/store/       users, saves, wallet, pass, revenuecat (regras com SQL)
  src/routes/      auth, game (save, carteira, loja, passe), webhooks, push
  src/push/        notificações: textos, envio pela Expo, rodada de envio e o worker
  migrations/      SQL em ordem (npm run migrate)
  test/            node:test + PGlite em memória (Postgres de verdade)
apps/mobile/       @zombie-road/mobile, o jogo; a parte de conta e loja fica em
  src/services/    env, api, session, cloudSave, economy, purchases, ads, signIn, rewards,
                   push/ (plano dos avisos locais, permissão, token remoto)
```

## Rodando localmente

1. Servidor: `npm install` e `npm run server` na raiz. Sem `DATABASE_URL`, usa o
   PGlite em `apps/server/.data/` (não precisa de Docker). Com Postgres:
   `docker compose -f apps/server/docker-compose.yml up -d` e `DATABASE_URL=...`.
2. App: crie `apps/mobile/.env.local` a partir de `apps/mobile/.env.example` com
   `EXPO_PUBLIC_API_URL=http://localhost:3000` (no celular, o IP do Mac na rede) e
   rode `npm run start`.
3. **No Expo Go** não há login nativo, compras, AdMob nem push remoto. O app usa a versão
   simulada: login "dev:google"/"dev:apple" (o servidor aceita em modo dev), compra
   pela rota `/dev/purchase` e uma propaganda de teste desenhada pelo app. Os avisos locais
   funcionam no Expo Go do iOS; em desenvolvimento, o plano aparece no log (`[push] plano local`).
4. **Development build** (login, compras e anúncios de verdade):
   `eas build --profile development --platform ios|android` dentro de apps/mobile (o EAS
   envia o monorepo inteiro e instala pela raiz), instale no aparelho e
   rode `npm run start` normalmente (o app abre no build em vez do Expo Go).

Testes: `npm test` na raiz roda os três pacotes (app com Jest; servidor e shared com
`node:test`). Só um: `npm test -w @zombie-road/server`.

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
| `POST /push/token {token, platform, timeZone, prefs}` · `DELETE /push/token {token}` | Liga/desliga o aparelho dos avisos remotos |
| `POST /admin/push {id, title, body, url?}` | Novidade para todos (cabeçalho `Authorization: Bearer ADMIN_TOKEN`; `id` evita repetir) |

## Banco (Postgres)

`users` (convidado: `device_id`), `identities` (provider + subject), `saves` (JSON +
revisão), `wallets` (gemas ≥ 0), `ledger` (todo movimento de gemas e prêmios, único por
`reason + ref`: pedido repetido não conta duas vezes), `purchases` (uma linha por
transação da loja), `subscriptions` (passe ativo até `expires_at`), `pass_progress`
(XP, prêmios pegos, teto diário), `webhook_events` (evento já processado), `push_tokens`
(aparelho, fuso e categorias), `push_outbox` (fila de avisos, um por `kind + ref` por conta) e
`push_broadcasts` (avisos para todos já postos na fila).

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
- **Notificações** (GDD seção 20): as locais o app agenda sozinho. Para as remotas, o app manda
  o token da Expo, o fuso e as categorias ao entrar na conta, ao dar a permissão e ao mudar os
  Ajustes (sair/entrar move o token para a conta nova). O webhook do RevenueCat e o worker põem
  avisos na fila; a cada 15 s o worker manda o que pode sair: categoria ligada, entre 9h e 21h no
  fuso do aparelho e no máximo 1 por dia (a compra confirmada sai na hora). Token que a Expo diz
  não existir mais (`DeviceNotRegistered`) sai da lista. Rode **um** worker por banco
  (`PUSH_WORKER=0` nas outras instâncias). Exemplo de novidade:
  `curl -X POST https://SEU-DOMINIO/admin/push -H "authorization: Bearer $ADMIN_TOKEN"
  -H "content-type: application/json" -d '{"id":"mundo-13","title":"Mundo novo!","body":"A Fronteira abriu um planeta.","url":"/stages"}'`

## Segurança

- Tokens do Google/Apple conferidos pela assinatura, emissor e público (client ID /
  bundle ID). Sessão própria assinada (`JWT_SECRET` com 32+ caracteres em produção).
- Gemas e passe só mudam no servidor; tudo que mexe em gemas é transacional e
  idempotente. Webhook protegido pelo cabeçalho combinado no RevenueCat.
- Rotas de dev (`/dev/*` e tokens "dev:") desligadas em produção (`NODE_ENV=production`).
- `/admin/push` só com `ADMIN_TOKEN` (sem ele, a rota recusa tudo). Avisos só abrem rotas do
  próprio app (nada de links de fora).
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
6. **Notificações remotas**:
   - iOS: `eas credentials` cria a chave de push (APNs) no Apple Developer; o build já pede a
     permissão de push (`aps-environment`, "production" no perfil production).
   - Android: projeto no Firebase com o app `com.arthurprasniski.estradazumbi`; o
     `google-services.json` vai no EAS como variável de arquivo `GOOGLE_SERVICES_JSON`, e a chave
     de conta de serviço (FCM V1) é enviada com `eas credentials`.
   - Opcional: "Enhanced security" no expo.dev e o token em `EXPO_ACCESS_TOKEN` no servidor.
   - `ADMIN_TOKEN` no servidor para mandar novidades.
7. **Hospedagem**: um serviço com Docker (Railway, Render, Fly…) e Postgres gerenciado.
   Imagem: `docker build -f apps/server/Dockerfile .` (da raiz). Variáveis do
   `apps/server/.env.example`.
8. **Lojas**: política de privacidade publicada, "Excluir conta" (já no app), formulário
   de segurança de dados (Play) e privacidade (App Store) declarando login, compras e
   anúncios.
