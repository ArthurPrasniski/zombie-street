# Direção visual — pixel art detalhada

Revisão em 14/10/2026 após as duas referências enviadas pelo usuário: interiores
em pixel art com materiais trabalhados, iluminação localizada, sombras e muitos
objetos reconhecíveis. **Direção detalhada aprovada pelo usuário.** O estudo Fazenda v2 é a referência
de acabamento. O piloto técnico foi reaproveitado e o primeiro lote detalhado
está integrado; produção e revisão dos demais assets continuam no backlog.

Primeiro estudo de composição: [Fazenda detalhada v2](concepts/farm-detailed-v2.png),
com [prompt e procedência](concepts/farm-detailed-v2.prompt.md). O conceito originou camadas de cenário, base separada voltada ao norte e
atlas de Mira/Andarilho. Estado do lote em [detailed/ENTREGA.md](detailed/ENTREGA.md). Não transportar literalmente o enquadramento para a física.

## Revisão do mapa — entrada pelo milharal

O usuário solicitou trocar o celeiro no topo por um milharal: os zumbis devem
parecer sair da plantação. O milharal ocupa a faixa norte, com passagens distribuídas
pela largura de spawn existente (x=60–540), e transição para o chão do combate.
O conceito original continua como referência de estilo; sua construção no topo foi
substituída nesta revisão. Física, spawn e base permanecem como estão.

## Casa de fazenda atrás da caminhonete

Adicionar a casa americana como ambientação da base: madeira clara, telhado de
duas águas e varanda, com iluminação quente coerente. A construção fica em uma faixa visual
extra abaixo da arena, atrás da caminhonete, com a varanda visível.
O piloto enquadra 600 × 1150, mantendo o mundo jogável em 600 × 900.
Telhado, chaminé e varanda devem permanecer abaixo da linha de defesa para não
reintroduzir sobreposições com os zumbis. A casa é parte do cenário, sem nova colisão.

## Alvo visual

- Pixel art de RPG com acabamento artesanal: clusters de pixels intencionais,
  silhuetas claras, variação de materiais e volumes definidos por luz e sombra.
- Construções com madeira envelhecida, tijolos, telhas, ferragens e sinais de uso;
  vegetação em camadas, ferramentas, caixas e equipamentos que contem a história do lugar.
- Paleta com verdes terrosos, terracota, ocre, creme e sombras frias/arroxeadas.
  Usar rampas de aproximadamente 4–6 tons por material conforme a necessidade;
  o limite anterior de três tons não é requisito da nova direção.
- Luz ambiente coerente, oclusão nos contatos e pontos quentes em lâmpadas/janelas;
  sombras e reflexos desenhados em pixels, evitando desfoque e gradientes contínuos.
- Personagens com mais definição de rosto, roupa, arma e equipamento, proporções
  compactas de RPG e menos ênfase na cabeça grande do protótipo anterior.
- Interface com molduras e materiais coerentes, sem competir com a cena.
  A referência não significa simplesmente trocar os botões por retângulos.

As referências definem **acabamento e linguagem visual**, não a planta do cenário.
A Fazenda continua sendo uma arena externa do Zombie Road. A vista permanece
ortográfica de cima com faces frontais visíveis; não converter física ou câmera
para uma grade isométrica diagonal.

## Detalhamento com leitura de combate

Na Fazenda, concentrar objetos altos e narrativa no topo e abaixo da linha de defesa.
As laterais da faixa jogável precisam de chão livre: copas, caixas e equipamentos
não podem ocupar a trajetória ou a largura visual dos sprites. Usar grama baixa,
marcas de rodas e pequenas pedras para detalhar a clareira sem sugerir obstáculos.
O corredor de terra ocupa quase toda a largura, com textura moderada e contraste suficiente
para reconhecer tropas, inimigos, disparos e zonas de perigo durante uma partida.
Não copiar a densidade dos interiores para toda a área jogável.

A hierarquia de contraste é: ameaças/ações → unidades → cenário. Conferir a arte
em tamanho real de celular, em movimento e com vários inimigos, não apenas ampliada.
Objetos decorativos e sombras não criam obstáculos ou colisões novas. A arte deve
respeitar FIELD (x=30–570), a zona das tropas (x=40–560) e a extensão dos corpos
desenhados; liberar somente o centro do sprite não impede sobreposição visual.
Nesta revisão, a terra ocupa aproximadamente 3%–97% da largura e objetos altos
ficam fora da faixa de combate. O milharal continua no topo, como origem visual.

## Resolução: proposta para o novo piloto

A resolução de produção precisa ser validada com o primeiro lote detalhado.
Aumentar detalhe sem aumentar arbitrariamente o tamanho dos personagens na tela.

| Item | Protótipo técnico atual | Candidato para a versão detalhada |
| --- | --- | --- |
| Mundo e física | 600 × 900 unidades | 600 × 900 unidades, preservado |
| Cenário | 300 × 450 px | 600 × 900 px + faixa decorativa inferior |
| Célula de unidade | 40 × 40 px | 80 × 80 px |
| Tamanho desenhado | 80 × 80 unidades | 80 × 80 unidades |
| Pés na célula | (20, 38) | (40, 76) |
| Retrato | 80 × 80 px | retrato próprio, validar entre 128 e 160 px |

A tabela registra o alvo candidato. O primeiro lote integrado preserva as fontes
geradas em 948 × 1659 (cenário com faixa inferior) e células de 256 px (unidades), com escala e
âncoras medidas no manifesto próprio. Esses tamanhos maiores ainda exigem revisão
de memória; não são a decisão final de resolução para toda a produção.
O novo lote deve manter escala visual coerente entre unidades, objetos e chão;
medir custo das imagens e legibilidade antes de consolidar essas dimensões.

- Preservar três vistas, espelhamento e IDs existentes.
- Tropas: 25 colunas (8 idle, 8 ataque, 1 caída, 8 caminhada).
- Zumbis: 21 colunas (8 caminhada, 8 ataque, 5 morte).
- Manter pés alinhados; caminhada com transferência de peso; ataque com
  antecipação, impacto/disparo e recuperação; morte com sequência própria.
- Validar arma e ponto de disparo em cada vista, inclusive espelhada.
- Nearest-neighbor, sem suavização das imagens; posições físicas e comandos
  continuam com precisão original. Quantização pertence à apresentação.
- Telas podem ter escala física fracionária: conferir diferentes densidades,
  sem prometer escala inteira ou pixels físicos uniformes antes dos testes.

## Produção e rastreabilidade

A geração procedural atual fica preservada como prova técnica e catálogo legado.
O detalhamento pedido exige uma etapa própria de criação e revisão artística;
acrescentar ruído ou ampliar o PNG anterior não resolve essa mudança de direção.

Conceitos gerados com `imagegen` são referências visuais, não sheets automaticamente
prontas para o jogo. Guardar o arquivo original e o prompt no projeto. Aprovar
internamente composição, escala, iluminação e leitura; depois produzir cenário
limpo, base separada, retratos e animações consistentes. Não recortar personagens
ou efeitos de uma imagem de conceito para tratá-los como sprites finais.

Para o lote de produção, registrar resolução, paleta, âncoras, vistas e manifesto.
Empacotamento e validação continuam reproduzíveis; arte gerada por modelo não
recebe promessa de regeneração idêntica, portanto suas fontes devem ser preservadas.
Sem novos assets externos ou fontes baixadas nesta revisão.

## Interface e validação

Rubik continua no corpo; tipografia de títulos será avaliada pela legibilidade,
incluindo acentos, PT/EN/ES e fonte ampliada. Botões mantêm mínimo de 44 pontos.
Movimento reduzido e efeitos reduzidos preservam os sinais essenciais do combate.

O piloto técnico usa fase 1, seed fixa, níveis uniformes e nenhuma escrita em
progresso/economia. Essa infraestrutura será reaproveitada para comparar as artes.

PIX-02 registra o alvo aprovado. PIX-04 refaz cenário, Mira, Andarilho e
base; PIX-05 revê recortes, âncoras e memória com a nova resolução; PIX-06 refina o
acabamento de carta/botão/HUD. Só então PIX-07 revisa o esforço dos próximos lotes.
As medições anteriores se referem exclusivamente à arte simplificada.
