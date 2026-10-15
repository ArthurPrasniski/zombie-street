# Histórico do piloto simplificado — 14/10/2026

Registro histórico: a tela de teste visual e o acesso pelos Ajustes foram removidos
em 15/10/2026. Os links do piloto abaixo pertencem à validação anterior.


O piloto agora carrega o primeiro lote detalhado. Estado vigente e comandos em
[detailed/ENTREGA.md](detailed/ENTREGA.md). Os números abaixo são do protótipo anterior.

**Registro do protótipo técnico simplificado.** Após as referências detalhadas
enviadas pelo usuário, a arte deixou de representar o alvo desejado. PIX-02/04/05/06
foram reabertas; a infraestrutura e os testes serão reaproveitados. A direção vigente
está em [DIRECAO_VISUAL.md](DIRECAO_VISUAL.md); tarefas no [backlog](../CONVERSAO_16_BIT.md).

## Entrega

- Inventário de 164 imagens, consumidores, rotas, módulos do render e 13 cópias
  idênticas usadas pela web: [INVENTARIO.md](INVENTARIO.md) / [inventory.json](inventory.json).
- Direção inicial cartoon em pixels, comparação de paletas A/B e contrato de
  grade, âncoras, animação e filtragem: [DIRECAO_VISUAL.md](DIRECAO_VISUAL.md).
- Geração isolada em `apps/mobile/assets/pixel16`, sem trocar a arte da campanha.
- 19 PNGs, **45.007 bytes**: oito sheets (Mira, Xerife, Serra, Rex, Barricada,
  Andarilho, Corredor e Brutamontes), oito retratos, cenário, base e comparação A/B.
- Cena Skia com nearest, ordenação por profundidade, três vistas, espelhamento,
  ataque/caminhada/morte, vida, disparos, áreas e prévia de posicionamento.
- Carta, botão, sangue, base, ondas, pausa, velocidade e reinício na nova direção.
- Piloto exclusivo de desenvolvimento: fase 1, níveis 1, seed 16016, sem
  persistência, anúncios, compras, XP ou prêmios. Não acessa serviços de economia.

## Como testar

Com Node 24 (`nvm use`), na raiz:

```sh
npm run art:pixel:inventory
npm run art:pixel
npm run art:pixel:check
npm run start -- --dev-client
```

No development build, abrir **Ajustes → Testar visual 16-bit** (agora usa as novas artes).
Arrastar cartas ao campo, testar pausa/1×/2×, alternar Pixels/Visual atual e reiniciar.
O botão de alternância preserva a mesma simulação; reiniciar restaura a seed.
O piloto não exige novos módulos nativos; a execução no Expo Go ainda precisa de QA.

Atalhos para o simulador iOS, após o app conectar ao Metro:

```sh
xcrun simctl openurl booted 'zombieroad://pixel-pilot'
xcrun simctl openurl booted 'zombieroad://pixel-pilot?autoplay=1'
```

`autoplay=1` usava o bot existente neste protótipo; a versão detalhada prioriza cartas pouco usadas para exercitar o render. O parâmetro opcional
`look=current` abre uma nova comparação com o visual atual; mudar esse parâmetro
remonta o piloto. Os botões da tela alternam a apresentação sem remontar a partida.
Em builds de produção, a rota redireciona para a Home e o acesso em Ajustes fica oculto.

Abrir `artifacts/pixel16/catalog.html` no navegador para inspecionar as sheets,
quadros, vistas, retratos, paletas e estados da base. O arquivo é autocontido e
regenerável, por isso fica fora do Git. Para outro destino:

```sh
npm run art:pixel -- --out /tmp/zombie-pixel-review
```

## Verificações e evidências

- Geração dupla: hashes iguais, dimensões/quadros válidos, alpha binário e hashes
  da arte atual preservados. O gerador recusa destino dentro de `assets/images`.
- Testes do piloto: fase completa reproduzível, nenhuma dependência de progresso
  ou economia, troca de visual sem reset, pausa em background e cancelamento do loop.
- Verificação geral: tipos sem erros; **366 testes passando** (282 mobile, 74 servidor,
  10 shared); lint sem erros, com os seis avisos preexistentes de imports nativos.
- Teste do render: recortes dentro das sheets, nearest, transparência da prévia e
  snapshot intacto, inclusive posições fracionárias do motor.
- Catálogo: 390 e 1100 px, sem overflow nem imagens quebradas; 87 combinações de
  unidade/vista/estado exercitadas no Chrome.
- iPhone 17, iOS 26.4, simulador: os dois renders abriram e executaram a fase com o
  bot; conferidas unidades, vida, tiros, cadáveres, cartas e encaixe da tela.
- Amostras pontuais do render em pixels: **60–61 callbacks rAF/s**, motor/snapshot
  em JS de **0,39–1,37 ms** e carregamento das dez imagens do combate de **35–101 ms**.
  São leituras locais de desenvolvimento, não benchmark controlado nem FPS da GPU.
- Os dez bitmaps do combate representam cerca de **4,27 MiB RGBA** pelas dimensões.
  Isso é estimativa de pixels decodificados, não medição da memória total do app/GPU.
- Capturas locais: `artifacts/pixel16/ios-pixel.png`, `ios-current.png` e
  `catalog-preview.png`; não são distribuídas no build.

## O que falta para fechar PIX-07

- Exercitar gestos manualmente, telas pequenas, PT/EN/ES com fonte ampliada e
  configurações de conforto; os textos e componentes já suportam esses caminhos.
- Medir em iOS/Android físicos: frame pacing, memória real e carga sustentada;
  comparar os renders na mesma carga e sem compilação/testes concorrentes.
- Refinar identidade, silhuetas e animações a partir da revisão em movimento.
  Xerife, Serra, Rex e Barricada são amostras para tornar o piloto jogável;
  acabamento de produção permanece em PIX-08.
- A base usa a aparência fixa do piloto. Pinturas, melhorias e demais cosméticos
  ficam em PIX-15. Outros mundos, telas, clima e efeitos completos não estão convertidos.
- Recalcular o esforço restante por lote após essas verificações. A faixa histórica
  de 35–59 dias úteis não é compromisso para o novo acabamento; ainda não há dados para
  prometer ganho de desempenho ou uma nova data de conclusão.
