# Gemas por anúncios e assinatura mensal

Regra aprovada em 19/10/2026: a única compra com dinheiro é o Clube da Estrada. Gemas avulsas e Passe de Batalha deixam de ser vendidos.

- Não assinantes: 20 gemas por anúncio concluído, até 5 anúncios por conta e por dia, total de 100 gemas. O servidor reinicia o limite às 00:00 UTC (21:00 em Brasília).
- Assinantes: sem anúncios, sem resgates diários de anúncios; 500 gemas e 10.000 moedas por ciclo mensal pago. Preço definido na loja: R$ 19,90, exibido pelo valor localizado da Google Play/App Store.
- Trocas de gemas por moedas continuam disponíveis. O saldo existente não é apagado.
- A trilha gratuita do passe entrega moedas; a premium não é mais vendida. Compras anteriores e seus benefícios prometidos continuam sendo conciliados, incluindo recibos atrasados, estornos e gemas premium já contratadas. Recompensas já resgatadas continuam no ledger.

## Entrega e recuperação

1. O app reserva um pedido autenticado em `POST /rewards/gems`, com `requestId` UUID.
2. Um anúncio específico é carregado com `serverSideVerificationOptions.userId` e `customData=requestId`.
3. AdMob chama `GET /webhooks/admob`. A API valida a assinatura ECDSA/SHA-256 nos bytes originais da query, a chave pública do Google, a unidade autorizada, a conta, a reserva e o limite diário.
4. O servidor credita 20 gemas no ledger uma única vez por reserva e transação do anúncio. O valor de recompensa recebido na query não determina o crédito.
5. O app consulta `GET /rewards/gems/:requestId` e mostra o saldo confirmado. Uma entrega atrasada fica recuperável por “Verificar recompensa”; não exige assistir de novo. Reservas expiram para novas exibições em 30 minutos; callbacks válidos de anúncios vistos dentro da janela ainda podem chegar depois, respeitando o limite do dia reservado.

Callbacks assinados de anúncios de repetição/dobrar moedas, sem reserva de gemas, são reconhecidos sem crédito de gemas. A mesma unidade pode continuar atendendo esses outros pontos do jogo.

Reservas e contagem ficam no Postgres, com bloqueio da carteira durante reserva/crédito, e sobrevivem a reinstalação e troca de aparelho quando a mesma conta é usada. Sair da conta não transfere um pedido para a conta seguinte. Fechar o anúncio sem prêmio não concede gemas. Callback assinado pode corrigir uma corrida entre fechamento e entrega.

## Implantação

1. Implantar a API com a migração `011_gem_ads.sql` antes de distribuir o novo app. O processo de inicialização existente executa as migrações.
2. Na API PRD/Dokploy, definir `ADMOB_REWARDED_UNIT_IDS` com os IDs reais dos anúncios premiados Android/iOS separados por vírgula. Exemplo de formato: `ca-app-pub-XXXXXXXX/YYYYYYYY,ca-app-pub-XXXXXXXX/ZZZZZZZZ`. Precisam corresponder aos `EXPO_PUBLIC_ADMOB_REWARDED_ANDROID` e `EXPO_PUBLIC_ADMOB_REWARDED_IOS` usados no build. Não são chaves secretas.
3. No AdMob, abrir cada unidade premiada → verificação do lado do servidor (SSV) e configurar a URL pública da API com `/webhooks/admob`. Para a API atual: `https://vmi3564888.tail4f5292.ts.net:10000/webhooks/admob`. A API precisa conseguir baixar as chaves de `https://www.gstatic.com/admob/reward/verifier-keys.json`.
4. Gerar/publicar um novo AAB. Apenas `zr_membership_monthly:monthly` é consultado/comprado no Android. Manter a assinatura e seu webhook RevenueCat ativos.
5. Desativar a venda dos antigos `zr_gems_80`, `zr_gems_500`, `zr_gems_1200`, `zr_gems_2600`, `zr_gems_7000` e `zr_pass_season` na Google Play/App Store e remover os pacotes das ofertas comerciais da RevenueCat. Não apagar histórico, clientes, recibos nem o webhook de reconciliação. Builds antigos ainda podem exibir os botões até a desativação dos produtos no console.
6. Atualizar a descrição da loja/landing page: gemas por anúncios e assinatura opcional. Remover referências à compra avulsa de gemas e à venda separada do passe.

Sem `ADMOB_REWARDED_UNIT_IDS`, o servidor mantém a recompensa de gemas indisponível em produção. A configuração dos consoles e a publicação do AAB não foram realizadas por este código.

## Teste no celular

Em desenvolvimento/Expo Go com API de desenvolvimento, a propaganda de teste usa `/dev/rewards/gems/:requestId` somente após conclusão. Essa rota não existe quando `DEV_ROUTES=0`/produção. No Android com anúncios reais, testar usando aparelho configurado como dispositivo de teste do AdMob e confirmar o callback SSV; o fluxo não faz fallback para crédito baseado apenas no cliente.

- [x] Apenas assinatura aparece como compra em dinheiro.
- [x] 20 gemas por conclusão validada; máximo 5 créditos no dia UTC.
- [x] Callback duplicado não duplica gemas; transação não pode ser reutilizada entre pedidos.
- [x] Assinante não recebe anúncio nem gemas extras de anúncio.
- [x] Saldo, assinaturas, recibos e benefícios premium antigos preservados.
- [ ] Homologar anúncio/SSV no Android físico e renovação mensal no ambiente da loja.

Referências: [SSV AdMob](https://developers.google.com/admob/android/ssv), [SDK React Native](https://docs.page/invertase/react-native-google-mobile-ads/displaying-ads).
