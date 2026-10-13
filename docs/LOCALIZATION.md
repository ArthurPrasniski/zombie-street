# Idioma, região e preços

O app oferece português, inglês e espanhol. Na abertura, `expo-localization` lê a ordem dos
idiomas preferidos do aparelho e usa o primeiro idioma disponível. Se nenhum for suportado,
usa inglês. Não precisa de GPS nem de permissão de localização.

As traduções ficam em `apps/mobile/src/i18n/` (`pt`, `en` e `es`, incluindo loja, rádio e
notificações). As telas usam `t` do módulo `@/i18n`. Nomes de cartas, mundos, inimigos e
peças da oficina são localizados sem alterar ids ou saves. Datas, números e preços simulados
são formatados com `Intl` usando o locale do aparelho.

## Moeda de compras

Para produtos reais e para a Test Store, o preço exibido é o `priceString` retornado pelo
RevenueCat. A moeda e o valor são os do produto na loja, não uma conversão feita pelo app.
Trocar o idioma ou estar fisicamente no Brasil não altera o país da conta da App Store/Play.
Produtos de teste cadastrados em USD continuam sendo exibidos em USD.

Para conferir BRL nas lojas reais, configure o país/região da conta de testes como Brasil e
os preços brasileiros dos produtos. Confira o valor na confirmação da compra também:
metadados de sandbox/TestFlight podem retornar USD mesmo com uma conta de outra região.

O modo simulado do Expo Go usa o catálogo de demonstração em BRL para a região BR e em USD
nas demais regiões. Esses valores não substituem os preços do RevenueCat.

## Testar

Depois de adicionar `expo-localization`, recompile o development build (`npx expo run:ios`
ou `npx expo run:android`). Nas próximas alterações de traduções, basta recarregar o app.

No simulador iOS, vá em Settings → General → Language & Region. Selecione português e a
região Brazil para verificar português e formatos brasileiros. Teste também inglês e
espanhol. Encerre e abra o jogo ao mudar as preferências do sistema.

As notificações locais usam o idioma selecionado. O app registra o idioma de cada aparelho
na API; a migração `004_push_languages.sql` permite enviar notificações remotas do sistema
em português, inglês ou espanhol. Faça o deploy do servidor atualizado para ativá-las.
Textos personalizados enviados pela administração permanecem como foram escritos.
