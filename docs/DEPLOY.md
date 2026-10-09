# DEPLOY — servidor no Dokploy e as variáveis do app

Passo a passo para colocar `apps/server` no ar numa VPS com Dokploy, com Postgres, HTTPS e
deploy automático a cada push, e para ligar o app (Expo Go, development build e loja) a ele.
Troque `api.seudominio.com` pelo seu domínio em todo o guia.

```
Celular ──HTTPS──► api.seudominio.com ──► Traefik (Dokploy) ──► zombie-road-api :3000 ──► Postgres
                                                                    │   (rede interna)    zombie-road-db
RevenueCat ──webhook──► /webhooks/revenuecat                        └──► serviço de push da Expo
```

## 0. Mapa: o que precisa bater com o quê

| Ligação | No servidor (Dokploy, aba Environment) | No app (EAS ou `apps/mobile/.env.local`) | Onde nasce |
| ------- | -------------------------------------- | ---------------------------------------- | ---------- |
| Endereço da API | o domínio da aba Domains | `EXPO_PUBLIC_API_URL=https://api.seudominio.com` | DNS + Dokploy |
| Banco | `DATABASE_URL` (Internal Connection URL) | — | Postgres do Dokploy |
| Sessão | `JWT_SECRET` (64 caracteres aleatórios) | — | `openssl rand -hex 32` |
| Login Google | `GOOGLE_CLIENT_IDS` = Web client ID | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = **o mesmo** Web client ID; `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; `GOOGLE_IOS_URL_SCHEME` | Google Cloud Console |
| Login Apple | `APPLE_AUDIENCES=com.arthurprasniski.estradazumbi` | (o bundle já está no `app.config.ts`) | Apple Developer |
| Compras | `REVENUECAT_WEBHOOK_AUTH` = **o mesmo** valor do cabeçalho no RevenueCat | `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat |
| Propagandas | — | `ADMOB_IOS_APP_ID`, `ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_IOS`, `EXPO_PUBLIC_ADMOB_REWARDED_ANDROID` | AdMob |
| Push | `PUSH_WORKER`, `EXPO_ACCESS_TOKEN` (opcional) | `GOOGLE_SERVICES_JSON` (arquivo, Android); o `projectId` do EAS já está no `app.json` | EAS, Firebase, Apple |
| Novidades | `ADMIN_TOKEN` | — | `openssl rand -hex 24` |

Regra de ouro: `EXPO_PUBLIC_*` vai **dentro** do app (qualquer um consegue ler). Segredo
(`JWT_SECRET`, `ADMIN_TOKEN`, senha do banco, cabeçalho do webhook) fica **só** no servidor.

## 1. Antes de começar

- [ ] Domínio com acesso ao DNS (ex.: `api.seudominio.com`).
- [ ] VPS com o Dokploy e as portas 80 e 443 abertas (o Traefik do Dokploy usa as duas).
- [ ] O código no GitHub (`ArthurPrasniski/zombie-street`, branch `main`) **com o monorepo e as
      notificações já commitados e enviados**: o Dokploy constrói o que está no GitHub, não o
      que está no seu Mac. Antes do push, rode na raiz `npm run typecheck` e `npm test`.
- [ ] Gere os segredos no Mac e guarde num gerenciador de senhas:
  ```sh
  openssl rand -hex 32   # JWT_SECRET
  openssl rand -hex 24   # ADMIN_TOKEN
  openssl rand -hex 24   # cabeçalho do webhook do RevenueCat (use com o prefixo "zr-")
  openssl rand -hex 16   # senha do Postgres
  ```

## 2. DNS

1. No painel do domínio, crie um registro **A**: nome `api`, valor = IP da VPS.
2. Se usar Cloudflare, deixe **DNS only** (nuvem cinza) até o certificado sair. Depois, se quiser
   o proxy, use o modo SSL **Full (strict)**.
3. Confira no Mac: `dig +short api.seudominio.com` deve mostrar o IP da VPS.

## 3. Ligar o GitHub ao Dokploy (uma vez)

1. No Dokploy: **Settings → Git → GitHub**.
2. Escolha **Personal Account**, clique em **Create Github App**, dê um nome (ex.:
   `dokploy-zombie-road`) e confirme.
3. Clique em **Install**, escolha **Only select repositories → zombie-street** e
   **Install & Authorize**.

## 4. Projeto e banco (Postgres)

1. **Projects → Create Project**: nome `zombie-road`.
2. Dentro do projeto: **Create Service → Database → PostgreSQL**.
   - Name: `zombie-road-db`
   - Database Name: `zombieroad`
   - Database User: `zombie`
   - Database Password: a senha gerada no passo 1
   - Docker Image: `postgres:17` (a mesma versão do `docker-compose.yml` de desenvolvimento)
3. **Create** e depois **Deploy**. Espere o status ficar verde.
4. Na aba do banco, em **Internal Credentials**, copie a **Internal Connection URL**. Ela tem este
   formato (o host é o nome interno que o Dokploy deu):
   `postgresql://zombie:SENHA@zombie-road-db-abc123:5432/zombieroad`
5. **Não** preencha **External Port**: o banco fica só na rede interna do Dokploy.

## 5. Aplicação (o servidor)

1. No projeto: **Create Service → Application**, nome `zombie-road-api`.
2. Aba **General**, em **Provider**:
   - **GitHub**, a conta do passo 3, Repository `zombie-street`, Branch `main`
   - **Build Path**: `/` (a raiz do repositório). **Não** use `apps/server` nem `packages/shared`:
     o Dockerfile Path é procurado a partir do Build Path e a imagem precisa da raiz inteira
     (lockfile, `packages/shared` e `apps/server`). Com o Build Path errado, o deploy falha com
     `cannot create .../packages/shared/apps/server/.env: Directory nonexistent`.
   - **Trigger Type**: `On Push`
   - **Watch Paths** (só redeploya quando o servidor muda, não a cada mudança do app; um por vez,
     digitando e clicando no **+**):
     ```
     apps/server/**
     packages/shared/**
     package.json
     package-lock.json
     ```
   - **Save**.
3. Ainda em **General**, em **Build Type**:
   - **Dockerfile**
   - **Dockerfile Path**: `apps/server/Dockerfile`
   - **Docker Context Path**: `.`
   - **Docker Build Stage**: vazio
   - **Save**.

## 6. Variáveis do servidor (aba Environment)

Cole e preencha (sem aspas, uma por linha):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://zombie:SENHA@zombie-road-db-abc123:5432/zombieroad
JWT_SECRET=cole-aqui-os-64-caracteres
GOOGLE_CLIENT_IDS=123456789-xxxxxxxx.apps.googleusercontent.com
APPLE_AUDIENCES=com.arthurprasniski.estradazumbi
REVENUECAT_WEBHOOK_AUTH=zr-cole-aqui-o-token-do-webhook
ADMIN_TOKEN=cole-aqui-o-token-de-admin
PUSH_WORKER=1
PUSH_INTERVAL_MS=15000
EXPO_ACCESS_TOKEN=
```

| Variável | Obrigatória | Se faltar ou estiver errada |
| -------- | ----------- | --------------------------- |
| `NODE_ENV` | sim (o Dockerfile já põe) | Sem `production`, as rotas de teste (`/dev/*`, login "dev:") ficam ligadas |
| `PORT` | não (3000) | Precisa ser igual ao **Container Port** do domínio |
| `DATABASE_URL` | **sim** | Sem ela o servidor usa o PGlite dentro do container e **perde tudo a cada deploy** |
| `JWT_SECRET` | **sim** (32+ caracteres) | O servidor não sobe: "JWT_SECRET precisa ter pelo menos 32 caracteres em produção". Trocar depois desloga todo mundo |
| `GOOGLE_CLIENT_IDS` | para login Google | Login Google responde 503 ("login google não configurado"); com o ID errado, 401 ("token google inválido") |
| `APPLE_AUDIENCES` | para login Apple | Igual ao Google, para a Apple |
| `REVENUECAT_WEBHOOK_AUTH` | para compras | O webhook responde 401 e as gemas nunca chegam |
| `ADMIN_TOKEN` | para novidades | `/admin/push` responde 401 |
| `PUSH_WORKER` | não (1) | `0` desliga o envio de notificações. Deixe `1` em **uma** instância só |
| `PUSH_INTERVAL_MS` | não (15000) | Intervalo entre as rodadas de envio |
| `EXPO_ACCESS_TOKEN` | não | Só se ligar "Enhanced Security for Push Notifications" no expo.dev |

`DEV_ROUTES` e `DATA_DIR` não são usados em produção. O valor do webhook sem espaço (`zr-...`)
evita dúvida de aspas: o RevenueCat manda exatamente o que você cadastrar.

Mudou alguma variável depois? Clique em **Deploy** de novo para valer.

## 7. Domínio e HTTPS (aba Domains)

**Add Domain**:

- **Host**: `api.seudominio.com`
- **Path**: `/`
- **Container Port**: `3000`
- **HTTPS**: ligado
- **Certificate**: `letsencrypt`

### 7.1 Ambiente de dev (opcional)

Dá para ter um segundo projeto no Dokploy (ex.: `zombieroaddev`) com outra aplicação e outro
banco, para testar sem mexer na produção:

- **Domínio grátis do Dokploy** (`...sslip.io`): só HTTP. Deixe **HTTPS desligado** (com ele
  ligado, o Traefik redireciona para HTTPS e o certificado falha). Serve para `curl` e,
  provavelmente, para o Expo Go; development build e app da loja bloqueiam HTTP. Para um dev
  completo, use um subdomínio próprio (ex.: `api-dev.seudominio.com`) com HTTPS.
- **`NODE_ENV=development`** (só no dev!): liga o login de teste ("dev:google") e a compra
  simulada (`/dev/purchase`), para o Expo Go testar tudo. Qualquer um pode se dar gemas nesse
  banco: nunca use na produção. Ponha o `JWT_SECRET` mesmo assim (sem ele, o dev usa uma senha
  conhecida).

## 8. Primeiro deploy e conferência

1. Aba **General → Deploy**. Acompanhe em **Deployments** (o build leva 1 a 2 minutos).
2. Em **Logs**, a subida certa mostra:
   ```
   Migrações aplicadas: 001_init.sql, 002_push.sql
   Zombie Road API em http://localhost:3000
   ```
   (as migrações rodam sozinhas a cada subida; as já aplicadas são puladas)
3. No Mac:
   ```sh
   curl https://api.seudominio.com/health
   # {"ok":true}
   curl -X POST https://api.seudominio.com/auth/guest -H 'content-type: application/json' \
     -d '{"deviceId":"teste-do-deploy-0001"}'
   # {"token":"...","user":{...}}
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://api.seudominio.com/dev/purchase
   # 404 (rotas de teste desligadas em produção: certo)
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://api.seudominio.com/webhooks/revenuecat
   # 401 (sem o cabeçalho: certo)
   ```
4. A imagem tem healthcheck (`/health`): o Dokploy só troca a versão quando a nova responde, e
   no redeploy o servidor termina os pedidos em andamento e fecha o banco antes de sair.

## 9. Serviços externos apontando para o servidor

- **RevenueCat** → Project settings → Integrations → **Webhooks**:
  - URL: `https://api.seudominio.com/webhooks/revenuecat`
  - Authorization header value: o mesmo `REVENUECAT_WEBHOOK_AUTH` (ex.: `zr-...`)
  - Mande o evento de teste: o servidor responde 200 (`outcome: ignored`, porque o produto de
    teste não é nosso). 401 = cabeçalho diferente do servidor.
- **Google Cloud** (OAuth): o Web client ID vai em `GOOGLE_CLIENT_IDS` (servidor) **e** em
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (app).
- **Notificações**: credenciais da Apple (APNs) e do Firebase (FCM) no EAS, como em
  docs/BACKEND.md, item 6 da configuração externa. Novidade para todos:
  ```sh
  curl -X POST https://api.seudominio.com/admin/push \
    -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
    -d '{"id":"mundo-13","title":"Mundo novo!","body":"A Fronteira abriu um planeta.","url":"/stages"}'
  ```

## 10. Variáveis do app (mobile)

### 10.1 No Mac (`apps/mobile/.env.local`, fora do git)

```env
# Servidor de produção (HTTPS) ou o local: http://IP-DO-MAC:3000 (no celular) / http://localhost:3000 (simulador)
EXPO_PUBLIC_API_URL=https://api.seudominio.com
```

Depois de mudar, reinicie o `npm run start` (o Expo lê o `.env.local` ao subir). No **Expo Go**
apontando para produção funcionam convidado, save na nuvem, Passe e a loja; o login de teste
("dev:google") e a compra simulada **não** (só existem no servidor local, fora de produção). Para
testar esses, use `npm run server` no Mac.

### 10.2 Nos builds do EAS (development build e loja)

Os builds não leem o `.env.local`: as variáveis ficam no expo.dev, por ambiente. O `eas.json` já
liga cada perfil ao seu ambiente (`development`, `preview`, `production`).

Pelo site: expo.dev → projeto **estrada-zumbi** → **Environment variables** → adicionar, marcando
os ambientes. Pelo terminal, **dentro de `apps/mobile`** (na raiz do monorepo o EAS não acha o
projeto), sem barra no fim da URL:

```sh
cd apps/mobile
# eas-cli até a 18.x:
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.seudominio.com --environment production --visibility plaintext
# eas-cli novo (npm install -g eas-cli): o mesmo com `eas env:set`
# Arquivo (Firebase):
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --visibility secret
```

| Variável | Ambientes | Visibilidade | Valor |
| -------- | --------- | ------------ | ----- |
| `EXPO_PUBLIC_API_URL` | todos | plaintext | `https://api.seudominio.com` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | todos | plaintext | Web client ID (o mesmo do `GOOGLE_CLIENT_IDS`) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | todos | plaintext | iOS client ID (`...apps.googleusercontent.com`) |
| `GOOGLE_IOS_URL_SCHEME` | todos | plaintext | o iOS client ID ao contrário: `com.googleusercontent.apps.123456789-xxxx` |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | todos | plaintext | chave pública iOS do RevenueCat (`appl_...`) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | todos | plaintext | chave pública Android (`goog_...`) |
| `ADMOB_IOS_APP_ID` / `ADMOB_ANDROID_APP_ID` | production (vazio = IDs de teste) | plaintext | `ca-app-pub-...~...` |
| `EXPO_PUBLIC_ADMOB_REWARDED_IOS` / `_ANDROID` | production (vazio = anúncio de teste) | plaintext | `ca-app-pub-.../...` |
| `GOOGLE_SERVICES_JSON` | todos | secret, tipo **arquivo** | o `google-services.json` do Firebase |

- Nos ambientes `development` e `preview`, deixe os IDs do AdMob vazios: o app usa os anúncios
  de teste do Google (clicar em anúncio real do próprio app pode bloquear a conta do AdMob).
- `EXPO_PUBLIC_*` entra no código na hora do build: mudou, precisa de build novo.
- Builds de release só falam com **HTTPS** (o iOS bloqueia HTTP).

### 10.3 Onde pegar cada valor

Ordem sugerida: contas pagas → Firebase → Google Cloud (login) → lojas → RevenueCat → AdMob →
credenciais de push no EAS. Pacote/bundle do app em todos: `com.arthurprasniski.estradazumbi`.

| Valor | Onde | Como |
| ----- | ---- | ---- |
| Contas | [Apple Developer](https://developer.apple.com/programs/) (US$ 99/ano), [Google Play Console](https://play.google.com/console/signup) (US$ 25, uma vez) | Pré-requisito de lojas, compras, login Apple e push no iOS |
| `GOOGLE_SERVICES_JSON` | [Firebase](https://console.firebase.google.com) | Criar projeto → adicionar app Android com o pacote → baixar `google-services.json` |
| Chave FCM V1 (push Android, vai para o EAS) | Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada | Enviar com `eas credentials -p android` ([guia](https://docs.expo.dev/push-notifications/fcm-credentials/)) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = `GOOGLE_CLIENT_IDS` | [Google Cloud → Credentials](https://console.cloud.google.com/apis/credentials) (o mesmo projeto do Firebase) | Configurar a tela de consentimento → Create credentials → OAuth client ID → **Web application** ([guia](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` e `GOOGLE_IOS_URL_SCHEME` | Mesmo lugar | OAuth client ID → **iOS** com o bundle; a página do client mostra o Client ID e o "iOS URL scheme" |
| Client Android (sem variável, mas obrigatório) | Mesmo lugar | OAuth client ID → **Android** com o pacote e o SHA-1: o do EAS (`eas credentials -p android`) e, depois de publicar, o da [assinatura do Play](https://support.google.com/googleplay/android-developer/answer/9842756) (Play Console → App integrity → App signing) |
| `APPLE_AUDIENCES` | — | É o próprio bundle. O EAS liga "Sign in with Apple" e "Push Notifications" no App ID durante o build |
| Chave de push da Apple (APNs, vai para o EAS) | `eas credentials -p ios` → Push Notifications | O EAS cria e guarda ([guia](https://docs.expo.dev/push-notifications/push-notifications-setup/)) |
| Produtos `zr_gems_*` e `zr_pass_monthly` | [App Store Connect](https://appstoreconnect.apple.com/apps) e [Play Console](https://play.google.com/console) | No Play, os produtos só aparecem depois de enviar um primeiro build (teste interno) |
| Credenciais das lojas para o RevenueCat | [Chave de In-App Purchase da Apple](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration), [conta de serviço do Play](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials) | Cadastrar no app iOS e no app Android do projeto no RevenueCat |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | [RevenueCat](https://app.revenuecat.com) → Project settings → API keys | Chaves públicas do SDK: `appl_...` e `goog_...` ([guia](https://www.revenuecat.com/docs/welcome/authentication)) |
| `REVENUECAT_WEBHOOK_AUTH` | Você gera (`openssl rand -hex 24`) | Cadastrar em RevenueCat → Integrations → Webhooks ([guia](https://www.revenuecat.com/docs/integrations/webhooks)) |
| `ADMOB_IOS_APP_ID` / `ADMOB_ANDROID_APP_ID` | [AdMob](https://apps.admob.com) → Apps → Add app (um por plataforma; dá antes de publicar) | App settings → App ID `ca-app-pub-...~...` ([ajuda](https://support.google.com/admob/answer/7356431)) |
| `EXPO_PUBLIC_ADMOB_REWARDED_IOS` / `_ANDROID` | AdMob → o app → Ad units → Add ad unit → **Rewarded** | `ca-app-pub-.../...` ([ajuda](https://support.google.com/admob/answer/7311747)). Configure também Privacy & messaging (consentimento) |
| `EXPO_ACCESS_TOKEN` (opcional) | expo.dev → Account settings → Access tokens | Só com "Enhanced Security" de push ligado ([guia](https://docs.expo.dev/push-notifications/sending-notifications/)) |
| `JWT_SECRET`, `ADMIN_TOKEN` | Você gera (`openssl rand -hex 32` / `-hex 24`) | Só no servidor |

## 11. Dia a dia

- **Deploy automático**: push na `main` que mexa nos Watch Paths → o Dokploy constrói e troca
  sozinho. Commits só do app não mexem no servidor.
- **Uma instância só**: em **Advanced → Cluster Settings**, deixe **Replicas = 1** (o worker das
  notificações não pode rodar em dobro). Para escalar no futuro: outra aplicação igual com
  `PUSH_WORKER=0`.
- **Backups do banco**: **Settings → S3 Destinations** (Cloudflare R2, Backblaze B2, AWS S3...) →
  no `zombie-road-db`, aba **Backups** → destino, database `zombieroad`, agenda `0 4 * * *` (todo
  dia às 4h), prefixo `zombie-road/` → **Test** para conferir.
- **Logs e uso**: abas **Logs** e **Monitoring** da aplicação.
- **Voltar uma versão**: `git revert` do commit e push (o Dokploy redeploya).

## 12. Problemas comuns

| Sintoma | Causa provável |
| ------- | -------------- |
| Log: "JWT_SECRET precisa ter pelo menos 32 caracteres" | Falta o `JWT_SECRET` ou ele é curto |
| Log: `ENOTFOUND zombie-road-db-...` ou `ECONNREFUSED` | `DATABASE_URL` com o host errado ou o banco parado (precisa ser a URL **interna**) |
| Navegador mostra "TRAEFIK DEFAULT CERT" | DNS ainda não propagou ou Cloudflare com proxy ligado; espere e salve o domínio de novo |
| "404 page not found" do Traefik | **Container Port** diferente de 3000, ou a aplicação não subiu (veja Logs) |
| Build falha no `npm ci` ("lock file") | `package-lock.json` desatualizado: `npm install` na raiz e commit do lockfile |
| Login Google 401 "token google inválido" | `GOOGLE_CLIENT_IDS` diferente do `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` do build |
| Compra feita e as gemas não chegam | Webhook com URL ou cabeçalho errado (veja no RevenueCat o status das entregas) |
| App: "A loja precisa de conexão com o servidor" | `EXPO_PUBLIC_API_URL` errado ou ausente no build, ou HTTP em vez de HTTPS |
| Notificação remota não chega | Credenciais APNs/FCM no EAS, permissão negada no celular ou a categoria desligada em Ajustes |
