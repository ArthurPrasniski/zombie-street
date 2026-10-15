> Atualização: o piloto foi expandido e parte das artes já entra no aplicativo.
> A cobertura atual está em [PRODUCAO.md](../PRODUCAO.md); os números abaixo
> descrevem o lote original do piloto.

# Primeiro lote detalhado — 14/10/2026

A direção da [Fazenda v2](../concepts/farm-detailed-v2.png) foi aprovada pelo usuário
("exatamente isso que eu quero"). O primeiro lote agora está **integrado ao piloto
jogável de desenvolvimento**, mantendo a simulação e o progresso isolados.

## Revisão do mapa — milharal

O celeiro, silo e estruturas do topo foram substituídos por um milharal com passagens
ao longo da faixa de entrada. O cenário permanece limpo e a base é uma camada separada.
As posições de spawn (x=60–540, y=-40), trajetórias e colisões não foram alteradas.
Prompt da edição em [cornfield-edit-v1.prompt.md](cornfield-edit-v1.prompt.md).
Conferido no simulador com a demonstração: o topo agora é a plantação;
manifesto/catálogo atualizados e 367 testes continuam passando.

## Revisão das laterais — clareira ampliada

Escolhida a redução da decoração alta lateral, preservando distribuição das ondas,
movimentação e regras. A terra agora ocupa quase toda a largura da faixa jogável;
as bordas recebem vegetação baixa e textura, sem árvores, caixas ou equipamentos
na circulação. Elementos altos se concentram no milharal e abaixo da defesa.
A revisão considera FIELD x=30–570, tropas x=40–560 e a largura visual dos sprites.
Prompt em [wide-clearing-edit-v1.prompt.md](wide-clearing-edit-v1.prompt.md).
Conferido no simulador com zumbis distribuídos pela clareira: as laterais jogáveis
ficaram sem os objetos altos anteriores. Captura local: `artifacts/pixel16-detailed/ios-wide-clearing.png`.

## Casa de fazenda americana

Casa de madeira clara, telhado de duas águas, varanda e luz quente adicionada
atrás da caminhonete, numa área visual extra abaixo do campo. O viewport detalhado
é 600 × 1150; o mundo jogável continua em 600 × 900 e a defesa em y=780. A casa
fica depois da caminhonete, separada por um pequeno acesso, sem ocupar o combate.

A cena inteira é ajustada ao espaço disponível: o campo aparece menor neste
enquadramento, ponto a revisar no QA físico de legibilidade.
O metadado `viewportHeight` controla o enquadramento e o layout do piloto; o render
atual usa sua altura original. Trocar a apresentação preserva a simulação. A área
decorativa abaixo de y=900 não recebe cartas: o arraste mantém a prévia inválida e
não envia comando ali; jogadas no campo preservam as mesmas coordenadas.

A casa é cenário, sem HP ou colisões novos. Composição conferida no simulador
iPhone 17/iOS 26.4 com a casa inteira, caminhonete separada e combate acima da defesa.
Captura local: `artifacts/pixel16-detailed/ios-farmhouse.png`. Fonte e prompts em
[farmhouse-edit-v1.prompt.md](farmhouse-edit-v1.prompt.md). Duas tentativas de encaixe
no canvas original foram substituídas pela extensão para separar casa e veículo.

## Artes e integração

| Fonte em `apps/mobile/assets/pixel16-detailed` | Conteúdo | Dimensões |
| --- | --- | --- |
| `farm.png` | Fazenda com milharal, clareira ampla e casa atrás da base, sem atores no fundo | 948 × 1659 |
| `farm-base.png` | Base transparente, quatro estados de dano, caminhonete voltada ao norte | 1254 × 1254 |
| `sniper.png` | Mira: três vistas, oito poses por vista | 2048 × 768 |
| `walker.png` | Andarilho: três vistas, oito poses por vista | 2048 × 768 |

Os PNGs são as fontes preservadas, produzidas pela ferramenta integrada `image_gen`.
Os [prompts, referências e refinamentos](provenance.json) ficam versionados junto do
projeto. A geração por modelo não promete saída idêntica; o **empacotamento e o
manifesto** são reproduzíveis a partir das fontes existentes, sem editar seus pixels.

O script inspeciona alpha para registrar pés, escala, recortes e a linha da defesa.
A base é separada do chão; um trecho dos sacos de areia é repetido no render para
cobrir a largura, com a linha de defesa mantida em y=780. O cenário usa suas dimensões
reais no recorte; as posições e colisões do motor continuam em 600 × 900.

O render mantém nearest, espelhamento, profundidade e efeitos do piloto. O retrato
de Mira usa um recorte de sua própria atlas. A demonstração prioriza cartas menos
usadas e aguarda o sangue necessário; assim também exercita Mira, que o bot anterior
preteria em favor de cartas baratas. Esse bot existe apenas no piloto.

## Como testar

Na raiz, com Node 24:

```sh
npm run art:pixel:detailed
npm run art:pixel:detailed:check
npm run start -- --dev-client
```

No development build: **Ajustes → Testar visual 16-bit → Detalhado**.
Arrastar cartas, testar pausa e velocidade, e alternar com Visual atual.
Os botões trocam somente a apresentação da mesma partida.

Após conectar o app ao Metro, a demonstração pode ser aberta no simulador:

```sh
xcrun simctl openurl booted 'zombieroad://pixel-pilot?autoplay=1&look=detailed'
```

Se estiver atualizando de um manifesto anterior durante desenvolvimento, reiniciar
o app evita referências antigas mantidas pelo Fast Refresh.

O catálogo gerado em `artifacts/pixel16-detailed/catalog.html` é autocontido e
permite inspecionar vistas/poses, cenário limpo e danos da base. As capturas locais
`ios-pilot.png` e `catalog-preview.png` ficam nessa mesma pasta, fora do Git.

## Verificações

- [x] Empacotamento repetido produz manifestos e catálogo idênticos; PNGs de origem
  permanecem intactos; hashes, dimensões, 48 poses e quatro bases verificados.
- [x] Simulação de uma fase no teste percorre os dois tipos de unidade detalhados,
  recortes/espelhamento e quatro danos da base, sem coordenadas inválidas.
- [x] Testes de troca de visual, pausa/background, seed, cancelamento do loop e
  isolamento de economia/progresso continuam passando.
- [x] Tipagem; **371 testes** (287 mobile, 74 servidor, 10 shared); lint sem erros,
  com os seis avisos preexistentes de imports nativos.
- [x] Catálogo no Chrome em 390/1100 px: sem overflow, imagens carregadas e
  24 combinações de unidade/vista/estado mais quatro danos exercitados.
- [x] iPhone 17, iOS 26.4, simulador: cenário, base, Mira, Andarilho, caminhada,
  tiro, cadáveres, HUD e encaixe da tela conferidos na demonstração.

Amostras pontuais do simulador: 60 callbacks rAF/s, motor/snapshot em JS entre
0,81 e 1,17 ms e carregamento das imagens do piloto entre 49 e 126 ms. Não são
benchmark controlado, memória real ou FPS apresentado pela GPU.

As quatro fontes somam **8.189.063 bytes de PNG** e aproximadamente **24 MiB RGBA**
pelas dimensões. O custo total inclui ainda unidades antigas, retratos, caches e
texturas da apresentação atual quando carregada. Revisar resolução/consumo em
aparelho antes de multiplicar esse formato por toda a coleção.

## Próximos ajustes — PIX-04/05/06/07

Correção da caminhada do Andarilho: o registro usa a cabeça do componente opaco
principal como referência do corpo, ignorando halos e fragmentos de células
vizinhas. As poses de caminhada mantêm o mesmo deslocamento da cabeça em relação
à posição lógica, em todas as vistas; antes, a frente oscilava cerca de 11 unidades
na horizontal por causa do apoio calculado nos pés. Cada pose dura dois passos do
adaptador, completando um ciclo a cada 27,6 unidades (escala 1), em vez de dois
ciclos nesse intervalo. Sprites e barras acompanham posições fracionárias sem o
arredondamento de duas unidades. Velocidade e trajetórias do motor permanecem iguais.
O teste adicional do registro é executado por `art:pixel:detailed:check`; os testes
mobile cobrem cadência por distância e continuidade de deslocamentos pequenos.

- A atlas de cada unidade contém parado, três poses de caminhada, antecipação,
  ataque, recuperação e caído, em três vistas. O adaptador usa essas poses nos
  tempos existentes do motor. **Não são ainda as 25/21 colunas únicas de produção**:
  faltam transições de queda/morte, mais intermediários e revisão de continuidade.
- Conferir postura, pés e mira em todos os ângulos; a anotação automática ajuda o
  registro, mas não substitui acabamento artístico de cada quadro.
- Laterais da Fazenda liberadas nesta revisão: os elementos do fundo continuam
  decorativos. Manter essa regra nos próximos mundos e no QA com sprites maiores.
- Xerife, Serra, Rex, Barricada, Corredor, Brutamontes, suas cartas e o HUD ainda
  usam o protótipo anterior. A tela informa o escopo desta amostra.
- Reavaliar a interface conforme o novo acabamento; PT/EN/ES, fonte ampliada,
  gestos manuais, movimento reduzido e aparelhos físicos continuam no QA pendente.
- Recalcular esforço após fechar esse ciclo de acabamento e desempenho. A faixa
  anterior de 35–59 dias úteis pertence à direção simplificada.

PIX-02 está concluída. PIX-04/05 permanecem em revisão; PIX-06/07 e os demais
lotes seguem no [backlog](../../CONVERSAO_16_BIT.md). A campanha principal recebeu o lote A descrito em `../PRODUCAO.md`; a
landing page continua pendente de atualização de identidade.
