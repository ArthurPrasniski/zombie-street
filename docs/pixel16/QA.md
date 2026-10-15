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
