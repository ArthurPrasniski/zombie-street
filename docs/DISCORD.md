# Avisos do Zombie Road no Discord

Integração por webhook em um canal de texto privado, sem comandos e sem bot token.
Não é necessário criar uma aplicação no Discord Developer Portal.

## O que é enviado

- **Novo jogador**: cada conta nova, inclusive convidado. Inclui UUID, provedor no
  momento do cadastro e horário. Login repetido ou vínculo posterior com Google/Apple
  não conta como novo cadastro. Ao sair, o jogo pode criar outro convidado, que é uma conta nova.
- **Venda de gemas**: compra dos produtos `zr_gems_*`, recebida e autenticada pelo
  webhook RevenueCat, com `environment=PRODUCTION`. Inclui UUID quando identificado,
  provedor, produto, quantidade de gemas, valor bruto/moeda, loja, transação e horário.
  Compras SANDBOX, Test Store, passe, reembolsos e eventos sem ambiente não são anunciados
  como vendas de gemas. Uma compra de jogador ainda desconhecido é identificada como tal.
- Valores vêm de `price_in_purchased_currency` e `currency`; não há conversão cambial
  nem uso dos preços sugeridos no catálogo. Se a loja omitir o preço, o aviso informa isso.
- Não envia nome, e-mail, token de sessão, senha nem conteúdo do save. Menções desabilitadas.

## Configurar

1. No Discord, criar um canal de texto privado para a equipe.
2. Editar canal → Integrações → Webhooks → Novo webhook. Escolher o canal e copiar a URL.
3. No Dokploy, **apenas na API PRD** `zombieroadprod-zombieroadapiprod-hedby9`, adicionar:

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/ID/TOKEN
   DISCORD_WORKER=1
   ```

4. Salvar e fazer deploy do código que contém esta integração. A migração
   `005_discord.sql` cria a fila na inicialização. Nenhuma alteração/build do app é necessária.
5. Manter a variável vazia/ausente no DEV. `NODE_ENV=production` também é obrigatório
   para ativar a integração, mas o container DEV pode usar esse mesmo modo; portanto,
   a separação é feita configurando a URL somente no serviço PRD.

A URL contém um segredo e fica somente no servidor; não cadastrar no EAS ou no app.
Não divulgar em logs, screenshots ou arquivos versionados.

## Entrega e testes

Os eventos são inseridos na mesma transação do cadastro/compra e persistem no PostgreSQL
durante reinícios e redeploys. O worker roda junto da API, sem necessidade de manter
um programa aberto no Mac. Envia um aviso por rodada de 2 segundos; uma fila grande
pode levar mais tempo. Falhas de rede e HTTP são repetidas com espera progressiva,
respeitando `retry_after` em respostas 429. `DISCORD_WORKER=0` pausa o envio sem parar a fila.

Há deduplicação por UUID de cadastro e transação de compra. A confirmação usa
`wait=true`. A entrega é pelo menos uma vez: uma interrupção depois do Discord salvar
a mensagem e antes de confirmar no banco pode duplicar o aviso. O UUID/transação no
rodapé permite identificar esse caso.

Para conferir a fila no Beekeeper (PRD):

```sql
select id, ref, created_at, available_at, attempts, sent_at, last_error
from discord_outbox
order by id desc
limit 50;
```

`sent_at` preenchido indica entrega confirmada. `last_error` contém apenas status HTTP
ou uma descrição genérica, nunca a URL do webhook. Erros 401/403/404 pedem verificar
o webhook e o canal; depois de corrigir a URL e fazer deploy, a fila volta a ser enviada.

O monitoramento começa quando a configuração está ativa; não faz backfill das contas
e compras anteriores. Faça um novo cadastro para conferir o primeiro aviso. Uma compra
de License testing não gera aviso de venda real, por escolha explícita do monitoramento.
Os testes automatizados usam banco em memória e respostas simuladas, sem publicar no Discord.

Referências: [webhooks Discord](https://docs.discord.com/developers/resources/webhook),
[eventos RevenueCat](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields).
