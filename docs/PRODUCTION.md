# Produção separada do desenvolvimento

> Monetização atual: veja [GEM_REWARDS.md](GEM_REWARDS.md). Somente a assinatura é vendida; produtos antigos permanecem para reconciliação. Configure AdMob SSV antes do novo AAB.

A API e o PostgreSQL PRD são serviços novos no Dokploy. O banco deve começar vazio,
com volume próprio; não restaurar os dados de teste automaticamente. As migrações
em `apps/server/migrations` são executadas na subida da API.

Serviços confirmados na VPS:

| Serviço | Nome interno |
| --- | --- |
| API DEV | `zombieroaddev-zombieroadapidev-t19s0y` |
| PostgreSQL DEV | `zombieroaddev-zombieroaddbdev-qsqzq7` |
| API PRD | `zombieroadprod-zombieroadapiprod-hedby9` |
| PostgreSQL PRD | `zombieroadprod-zombieroadprod-rpzis1` |

O host do `DATABASE_URL` PRD deve corresponder ao PostgreSQL PRD acima.
No levantamento inicial, a API PRD ainda não tinha porta publicada.

## 1. Variáveis do servidor

Modelo versionado: `apps/server/.env.production.example`.
Arquivo privado preparado neste Mac: `apps/server/.env.production.local` (ignorado pelo Git).

O arquivo privado contém `JWT_SECRET`, `REVENUECAT_WEBHOOK_AUTH` e `ADMIN_TOKEN`
gerados separadamente para PRD, além do Web client ID do Google já usado pelo app.
Não sobrescrever esses segredos depois que os usuários começarem a usar o ambiente.

No Dokploy, copie a **Internal Connection URL** do PostgreSQL PRD e preencha
`DATABASE_URL` na aba **Environment da API PRD**, junto com o conteúdo do arquivo privado.
A conexão usa a porta interna `5432`, nunca a porta do Beekeeper.
Não compartilhar essa URL nem colocar senha do banco em variáveis `EXPO_PUBLIC_*`.

O servidor exige `NODE_ENV=production`, segredo JWT com pelo menos 32 caracteres e
`DATABASE_URL` preenchida. As rotas de desenvolvimento ficam desligadas.
O arquivo `.env.production.local` é uma fonte para copiar ao painel; o container
recebe as variáveis do Dokploy e não carrega esse arquivo automaticamente.

## 2. Build da API

Usar o mesmo repositório e branch escolhidos para o deploy, com:

| Campo | Valor |
| --- | --- |
| Build Path | `/` |
| Build Type | Dockerfile |
| Dockerfile Path | `apps/server/Dockerfile` |
| Docker Context Path | `.` |
| Container port | `3000` |
| Replicas | `1` |

Deploy usa o código enviado ao Git remoto, não as alterações locais do Mac.
Confirmar que o volume do PostgreSQL PRD está configurado antes de iniciar a API.
Manter a porta externa do banco vazia; para administração, usar acesso SSH controlado.

A imagem também inclui o motor puro em `apps/mobile/src/game/{data,engine}`, seus
tipos e `i18n/names.ts`, usados pelo desafio semanal. O alias de locale aponta para
a implementação sem Expo em `apps/server/src/game/locale.ts`. A importação da API é
verificada durante o build para impedir uma imagem com dependências ausentes.
Incluir esses arquivos e `.dockerignore` nos Watch Paths (ver [DEPLOY.md](./DEPLOY.md)).

## 3. Endereço público com Funnel

Na VPS, consultar antes de alterar:

```sh
tailscale funnel status
docker service ls --format 'table {{.Name}}\t{{.Ports}}'
```

O último estado conhecido era: API DEV em `443 → 3100 → container 3000`,
outro serviço em `8443 → 3333`. Não sobrescrever essas configurações.

**Mapeamento escolhido, com portas livres no levantamento da VPS:** publicar a API PRD no
Dokploy em `3200 → container 3000` (TCP / INGRESS) e o Funnel HTTPS em `10000`.
O domínio deve ser o mesmo exibido por `tailscale funnel status`.

Depois que a API responder localmente:

```sh
curl --fail http://127.0.0.1:3200/health
sudo tailscale funnel --bg --https=10000 http://127.0.0.1:3200
```

URL pública confirmada em 14/10/2026: `https://vmi3564888.tail4f5292.ts.net:10000`.
Conferência externa: `/health` respondeu HTTP 200, `/dev/purchase` HTTP 404 e
`/webhooks/revenuecat` sem autorização HTTP 401.
Conferir o endereço publicado pelo próprio Funnel e testar `/health` fora do Tailscale.
O certificado TLS é fornecido pelo Funnel; o celular não precisa instalar Tailscale.

## 4. RevenueCat

Criar uma configuração de webhook para a URL PRD confirmada + `/webhooks/revenuecat`.
Usar como Authorization header o valor completo do `REVENUECAT_WEBHOOK_AUTH` PRD.
Não trocar o segredo do webhook DEV para o segredo PRD.

A seleção de ambiente dos eventos deve corresponder ao backend usado pelo build:
compras de License testing, TestFlight e revisão da Apple são sandbox e também
precisam chegar ao backend daquele aplicativo. Não desabilitar sandbox no backend
que estiver sendo usado nesses testes/revisão. Para o teste de comunicação, enviar
um evento de teste no painel e verificar HTTP 200.

O projeto RevenueCat atual pode ser compartilhado: o SDK identifica a conta pelo UUID
do backend. Cada banco gera seus próprios UUIDs; não copiar contas entre DEV e PRD.
Não associar gemas ou o passe consumível a um entitlement permanente: o servidor
credita as gemas e limita o passe à temporada pelo webhook.

## 5. App e EAS

O `eas.json` já associa cada perfil ao ambiente correspondente:

| Ambiente | API |
| --- | --- |
| development | API DEV atual |
| preview | API DEV atual, salvo escolha explícita de staging |
| production | `https://vmi3564888.tail4f5292.ts.net:10000` (confirmado no EAS em 14/10/2026) |

`EXPO_PUBLIC_API_URL` já foi separada no EAS: production usa a API PRD e
development/preview continuam com `https://vmi3564888.tail4f5292.ts.net`.
Manter `apps/mobile/.env.local` no DEV para o desenvolvimento cotidiano.
Usar a chave pública `goog_...` no Android; a chave iOS `test_...` precisa ser substituída
pela chave pública `appl_...` antes de lançar compras reais no iOS.

Depois de atualizar as variáveis, gerar o novo AAB:

```sh
cd apps/mobile
eas build --platform android --profile production
```

Esse build conectado à API PRD deve ser testado em faixa interna/fechada antes da
publicação ao público. O banco PRD começa com contas e carteiras novas; o progresso
local do aparelho pode ser sincronizado segundo as regras atuais do jogo.

## 6. Conferência e operação

Avisos de cadastros e vendas de gemas no Discord: configurar `DISCORD_WEBHOOK_URL`
somente na API PRD, conforme [DISCORD.md](./DISCORD.md).

- `/health` público responde `{"ok":true}`.
- Rotas `/dev/*` respondem 404 e login Google funciona.
- Compra de teste aparece no RevenueCat e o webhook entrega gemas/passe no banco PRD.
- Credenciais APNs/FCM ficam no EAS; `PUSH_WORKER=1` em uma instância por banco.
- Configurar backup diário do PostgreSQL PRD no Dokploy para um destino externo e
  testar restauração em um banco separado antes do lançamento.
- Antes de migrar os jogadores, confirmar URL PRD, webhook, credenciais e versão do app.

### API online, mas o aplicativo indica falta de conexão

`/health` confirma que o processo responde; não confirma que o backend atende à versão
instalada do aplicativo. A inicialização atual consulta `/wallet`, `/pass`, `/membership`
e `/purchases`. Sem token, as quatro rotas devem responder **401**, e não **404**.
Se `/membership` ou `/purchases` devolver `Route GET:… not found`, atualizar a aplicação
API PRD no Dokploy com o código atual de `apps/server` e `packages/shared`, mantendo
Build Path `/` e o mapeamento do Funnel para o serviço PRD correto.

Após o deploy, conferir essas rotas e reabrir o aplicativo. A correção de reconexão do
cliente também permite tentar abrir uma sessão novamente pelos Ajustes ou ao retornar
ao app; essa alteração do cliente só chega aos aparelhos em um novo build.

Referências: [deploy Dokploy](./DEPLOY.md),
[Funnel](https://tailscale.com/docs/features/tailscale-funnel),
[EAS environments](https://docs.expo.dev/eas/environment-variables/usage/),
[webhooks RevenueCat](https://www.revenuecat.com/docs/integrations/webhooks).

## 7. Login e compras no Android distribuído pela Play

- Login Google: cadastrar no OAuth Android o pacote `com.arthurprasniski.estradazumbi`
  com o SHA-1 do **certificado de assinatura da Play**, além dos certificados usados
  no EAS/desenvolvimento. O Web client ID do app deve constar em `GOOGLE_CLIENT_IDS`
  da API PRD. O app distingue o código nativo 10 de erros HTTP na mensagem de falha.
- Assinatura: ativar `zr_membership_monthly`, plano-base `monthly`, com preço e países
  de venda na Play. Importar `zr_membership_monthly:monthly` no aplicativo Android da
  RevenueCat. O cliente consulta produtos e também procura a assinatura nas Offerings,
  preservando os preços de gemas/passe quando a assinatura não está disponível.
- Tentativa que falhou antes da confirmação e **sem cobrança**: após atualizar o app,
  abrir Ajustes → Compras e entregas → Liberar tentativa sem cobrança. A ação preserva
  o registro como erro e não altera saldos; fica indisponível se há recibo conhecido.
  Não usar para compras aprovadas ou cobradas: nesse caso, conferir evento/webhook e
  a entrega ao mesmo UUID da conta no backend PRD.

Referências de configuração: [certificados do Google Sign-In](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)
e [planos Google Play no RevenueCat](https://www.revenuecat.com/docs/getting-started/entitlements/android-products).

### Google Play: “Este item já é seu”

Esse aviso é diferente de uma tentativa sem cobrança: a Play informa que há um item
adquirido. O cliente sincroniza os recibos existentes com RevenueCat sem reabrir o
pagamento e consulta a entrega no backend. O código 6 sem uma nova transação registra
a rejeição da tentativa como erro, preserva o histórico e permite outra tentativa
manual pela loja. O erro não representa uma nova cobrança pendente. Pagamentos com
recibo ou resultado ambíguo continuam protegidos até a conciliação. Uma pendência
não bloqueia outros produtos nem a atualização de preços.

Pacotes de gemas são recompráveis, com uma transação diferente para cada compra.
Uma transação já entregue não bloqueia a próxima. Um reembolso confirmado pelo
backend para o recibo exato encerra a pendência como `refunded`, sem vinculá-lo por
suposição a outras compras do mesmo produto. O código 6 antigo sem recibo também
deixa de bloquear o pacote após a atualização do cliente.

Em Ajustes → Compras e entregas, “Verificar entregas” agora consulta a loja e o servidor.
O diagnóstico mostra códigos e IDs públicos de produtos, sem mensagens brutas do SDK,
chaves ou e-mail. Para diagnosticar a assinatura, abrir a loja, atualizar os preços e
depois consultar `membership`, `membershipPlans` e `offerings` nessa tela. A consulta
sem filtro de plano só aceita o retorno `zr_membership_monthly:monthly`; outro plano
fica registrado no diagnóstico e não é vendido como mensal.

Na RevenueCat, confirmar que gemas e passe são consumíveis no aplicativo Android:
um produto marcado como não consumível deixa de ser consumido automaticamente na Play.
Se já estão corretos, usar o código de `sync` para investigar a validação do recibo e
conferir evento/webhook no mesmo projeto e ambiente da conta do aplicativo.
