# QA de entregas e sincronização

Executar em development build e aparelhos físicos iOS/Android, com produtos sandbox reais.
Expo Go verifica a integração simulada, mas não valida StoreKit, Google Play nem AdMob.

1. Comprar gemas, passe e assinatura; fechar a tela durante a confirmação e reiniciar o app.
   Verificar no histórico a mesma transação entregue. O saldo não deve duplicar. Repetir webhook.
2. Interromper rede após confirmar na loja; conferir estado pendente e impedimento de nova cobrança.
   Restaurar conexão; entrega deve ser reconhecida sem recomprar. Cancelar uma compra sem cobrança.
3. Deslogar durante compra; entrar em outra conta. Recibos/saldos não devem confirmar na conta errada.
   Retornar à conta original e restaurar compras. Reinstalar e verificar benefícios pelo servidor.
4. Assinatura: renovação entrega 500 gemas/10.000 moedas uma vez por ciclo; replay sem anúncios;
   botão de dobrar moedas oculto; benefício offline até a validade conhecida. Cancelamento preserva
   período pago, expiração encerra benefício, estorno reverte prêmio apenas uma vez.
5. Matar o app durante envio de save e alterar progresso durante envio lento. Verificar revisão,
   estado salvando/salvo/erro, botão de retry e conflito em segundo aparelho. Comparar resumos antes
   de escolher. Falha ao carregar armazenamento deve oferecer retry sem apagar dados.
6. Replay: primeira tentativa livre; derrota/vitória persistidas exigem anúncio. Falha/cancelamento
   de anúncio não inicia partida; recompensa só após conclusão. Concorrência não abre dois anúncios.
7. Estatísticas: padrão desligado; consentir envia eventos sem e-mail/token, repetição não duplica;
   desligar limpa fila e solicita exclusão. Confirmar exclusão ao retornar da conexão offline.

Registrar aparelho, sistema, versão, produto, ID da transação e horário. Não registrar tokens.
