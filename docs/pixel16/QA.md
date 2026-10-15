# Verificação da conversão detalhada

Entrega de implementação em 14/10/2026. Não representa homologação nas lojas.

## Resultado

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | passou nos três pacotes |
| `npm test` | 381 testes: 297 mobile (45 suítes), 74 servidor, 10 shared |
| `npm run lint` | nenhum erro; seis avisos de requires nativos condicionais existentes |
| `npm run art:pixel:detailed:check` | fontes imutáveis, geração dupla determinística, 1.080 poses e 12 danos das bases válidos |
| Catálogo visual | 540 combinações, três bases/quatro danos, imagens válidas em 390/1100 px |
| Landing | build/check passaram; PT/EN/ES em 390/1440 px, sem overflow ou imagens ausentes |
| Sites | publicação privada concluída, commit `13277c3f8c3c727f6e868c1538565c89df07ea23` |
| `git diff --check` | passou |

O render automatizado usa todas as unidades e prévias das 24 cartas, quatro danos
na base, quatro climas, status, cadáveres, espelhamento e efeitos; confere regiões
válidas, coordenadas finitas e snapshots imutáveis. Testes de gait verificam o ciclo
completo e movimento contínuo. Cobertura do catálogo compara os IDs com os dados
reais; Bestiário tem 30 IDs únicos. Navegação testa Voltar sem histórico e com histórico.

## Simulador

iPhone 17 / iOS 26.4: Home, Deck, Fases, preparação, Loja, Passe, compras,
Oficina, Bestiário, conquistas, diário, missões, semanal, Expedição e Ajustes.
Conferidos estados offline/bloqueados, fonte/títulos, materiais, saldos e controles.
Treino com Fazenda, Cidade, Colmeia e Lua, tropas desbloqueáveis e inimigos especiais;
a Lua usa o novo módulo espacial. Resultado de treino usa o modal convertido.

As capturas locais ficam em `artifacts/pixel16-detailed/native/`; fontes/revisões
por unidade e cenário no catálogo e em `units-*.png`/`worlds.png`, fora do Git.
Deep links de treino preservam progresso e economia. O simulador ficou na Home.

## Diagnóstico de testes

A rodada paralela passou, mas o Jest avisou que encerrou um worker com handles
pendentes. Uma rodada serial instrumentada atingiu o timeout padrão de 5 s em
um teste de conclusão de anúncio. Esse teste passou isolado com `--detectOpenHandles`
(5 casos, sem handles reportados). A verificação serial completa usa timeout de
15 s para compensar a instrumentação: as 45 suítes/297 testes passaram e não
reportaram handles abertos. Isso não muda a configuração dos testes nem o
comportamento de anúncios no aplicativo.

## Limites de homologação

- Não houve validação física Android/iOS, compras/anúncios reais ou nova instalação
  nativa com os recursos de ícone/splash. Eles estão configurados para o próximo build.
- Não houve medição sustentada de FPS, consumo total de memória ou bateria em aparelho.
  A redução de 75% registrada é memória RGBA das folhas empacotadas, calculada pelas dimensões.
- A revisão de telas do simulador foi em PT-BR; fontes conservam PT/EN/ES, a web
  passou nos três idiomas e os testes de localização passaram. Fonte ampliada,
  densidades/telas pequenas e todos os estados nativos exigem a matriz física.
- Não houve publicação nativa nas lojas nem mudança da audiência privada do site.

## Ajuste de preenchimento da tela — 15/10/2026

A cena ocupa toda a largura e começa no topo da tela; HUD, tutorial e eventos
respeitam a área segura superior. A mão inclui a área segura inferior. Em celulares
altos, corta-se somente parte da decoração abaixo da arena; em telas compactas,
a escala vertical mantém os 900 pontos lógicos e a base visíveis. O arrasto usa a
mesma escala vertical do render. Verificados cinco tamanhos de tela por teste e
conferido o resultado no simulador; captura `native/combat-full-bleed.png`.

## Controles fora da arena — 15/10/2026

Voltar, pausa/continuar, velocidade e fase/onda ficam em uma barra de 44 pontos
acima da mão de cartas. A faixa inferior reserva a altura dos controles, cartas,
sangue e área segura; a cena continua preenchendo a largura, com a base visível.
Tutorial e avisos usam o topo seguro; um evento tem prioridade sobre o tutorial.
Teste funcional cobre os callbacks e a alternância 1×/2×; o progresso mantém os
formatos de campanha e Sobrevivência. Cinco tamanhos verificam a geometria da
faixa. Conferido no simulador, captura `native/combat-controls-tray.png`.
Verificação desta alteração: 390 testes passaram (306 mobile, 74 servidor, 10 shared);
tipagem dos três pacotes e lint sem erros, com os seis avisos nativos existentes.

## Casa completa, respiro e sangue cheio — 15/10/2026

A altura do cenário agora acomoda os 1.150 pontos do viewport completo: casa e
decoração inferior não são recortadas. A largura continua preenchendo a tela;
a altura das imagens dos personagens e dos seus pontos de tiro é compensada
para manter as proporções, sem mudar posições/regras do motor. O arrasto usa a
mesma escala vertical. A faixa inferior calcula a altura das cartas e reserva
14 pontos acima dos controles, 12 entre grupos e 10 antes da área segura inferior.

A barra usa largura em pixels com clamp entre 0 e 10, substituindo o percentual
animado; o estado cheio fica em toda a largura interna. A bolsa de sangue tem
fonte PNG e prompt rastreáveis, recorte de 128 px gerado pelo pipeline e contador
separado `n/10`. Testes cobrem 0, 3,5, 5, 10 e excesso de capacidade, além do
viewport inteiro e da proporção/âncora/ponto de disparo dos sprites.
Conferido no simulador em treino iniciado com 10: barra completamente preenchida,
casa inteira e espaçamento visível. Captura `native/combat-house-blood-bag-full.png`.
Validação final: 396 testes passaram (312 mobile, 74 servidor, 10 shared), tipos e
lint sem erros; checker de arte passou incluindo a nova bolsa de sangue.
