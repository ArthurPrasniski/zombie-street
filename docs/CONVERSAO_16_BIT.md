# Zombie Road — tarefas da conversão para 16-bit

Status em 14/10/2026: **implementação visual completa em produção**: 45 unidades,
24 cartas, 30 retratos do Bestiário, 12 cenários, três bases, interfaces e identidade.
Execução, cobertura e limites em [pixel16/PRODUCAO.md](pixel16/PRODUCAO.md).
As referências detalhadas substituem o alvo simplificado. Os checks abaixo marcam
implementação; homologação física e lançamento nas lojas continuam em PIX-23/24.

Objetivo: aplicar uma direção de pixel art inspirada em jogos de 16-bit ao combate,
às interfaces, à identidade visual e à landing page. O piloto aprovado definiu os padrões adotados agora no conteúdo completo.

## Escopo e esforço

Inventário inicial: 15 unidades de tropa e 30 tipos de zumbi animados, 24 retratos de
cartas, 30 retratos do bestiário, 12 cenários e suas bases, além de ícones, retratos
de rádio, Home, marca e 18 arquivos de rota do app. Confirmar cobertura em PIX-01.

Estimativa histórica para a direção anterior: **35–59 dias úteis de uma pessoa dedicada**.
**Não usar essa faixa como compromisso para o acabamento detalhado das referências.**
São dias de esforço, não um calendário fechado. Reestimar após o novo cenário e
um ciclo completo de animação de Mira/Andarilho no acabamento detalhado;
o reaproveitamento dos geradores e o acabamento das animações afetam o prazo.

| Frente | Esforço histórico, a revisar |
| --- | --- |
| Direção visual e piloto | 3–5 dias |
| Unidades e animações | 12–20 dias |
| Cenários, bases, retratos e identidade | 8–14 dias |
| Interface e efeitos | 7–12 dias |
| Integração e validação | 5–8 dias |

As tarefas de infraestrutura e web estão incluídas nessas frentes. Áudio novo
tem estimativa separada, caso seja incluído no escopo.

## Regras da conversão

- Preservar IDs, atributos, colisões, zonas de posicionamento e coordenadas lógicas
  de 600 × 900. A resolução da arte pertence à apresentação.
- Preservar os contratos de eventos e o determinismo do motor, inclusive a
  reprodução das partidas semanais no servidor.
- Manter as fontes da arte e sua geração reproduzível. O gerador antigo em
  `apps/mobile/scripts/art-pixel` é uma referência que precisa de adaptação.
- Gerar o piloto em uma pasta própria; o gerador antigo atualmente grava em
  caminhos usados pelo app e depende de campos do layout antigo.
- Manter a interface legível em PT/EN/ES, com texto ampliado e movimento reduzido.
- Registrar dimensões, transparência, âncoras, vistas e quadros dos assets.
- Usar a stack existente; avaliar dependências, fontes e assets externos conforme
  as instruções do repositório quando uma necessidade concreta aparecer.

## 1. Inventário e direção visual

- [x] **PIX-01 — Inventariar os assets e seus consumidores.**
  Listar imagens, geradores, animações, telas e arquivos do render. Identificar
  conteúdo compartilhado, variantes de chefe/evolução e dependências da web.
  **Aceite:** matriz de cobertura com origem, destino, dimensões e estado por asset.

- [x] **PIX-02 — Definir o guia de pixel art.** Depende de PIX-01.
  Definir paleta, contraste, resolução das unidades/cenários, proporções, contornos,
  sombras, iluminação, tipografia e regras de animação. Seguir o acabamento detalhado das referências: materiais, iluminação, sombras
  e narrativa ambiental; manter a leitura da arena. Guia em `pixel16/DIRECAO_VISUAL.md`.
  **Aceite:** guia com exemplos em tamanho real de celular e decisões registradas.

- [x] **PIX-03 — Preparar geração isolada e catálogo de prévias.** Depende de PIX-02.
  Adaptar o gerador para receber destino explícito, definir um manifesto próprio e
  organizar uma prévia que permita inspecionar cada vista e estado de animação.
  **Aceite:** gerar duas vezes produz os mesmos assets; o piloto fica isolado dos
  arquivos atuais; inconsistências de dimensões/âncoras são detectadas.

## 2. Piloto jogável — primeira entrega

- [x] **PIX-04 — Criar Mira, Andarilho, caminhonete e cenário da Fazenda.**
  Depende de PIX-03. Refazer as artes simplificadas no novo acabamento. Produzir as vistas e animações de ataque,
  movimento/morte aplicáveis e os estados de dano da base.
  **Aceite:** silhuetas identificáveis e quadros alinhados durante a animação.

- [x] **PIX-05 — Integrar o piloto ao render.** Depende de PIX-04.
  Reaproveitar a integração e ajustar manifesto, recortes, escala, âncoras e filtragem
  às resoluções do novo lote; medir o custo adicional de memória.
  Definir como posicionar a grade visual nas diferentes densidades de tela.
  **Aceite:** pixels nítidos, movimentos sem oscilação visual indesejada, mira e
  pontos de disparo alinhados; posicionamento e colisões mantêm as regras atuais.

- [x] **PIX-06 — Criar uma carta, um botão e o HUD do piloto.** Depende de PIX-02.
  Refinar o acabamento e materiais dos componentes técnicos existentes; cobrir
  sangue, vida da base, ondas, pausa, velocidade, custo e estados da carta.
  **Aceite:** texto, estados e áreas de toque legíveis no celular; elementos do
  combate seguem a mesma direção visual das unidades.

- [x] **PIX-07 — Avaliar o piloto e revisar a estimativa.** Depende de PIX-05/06.
  Jogar a fase com as cartas necessárias, comparar antes/depois e registrar ajustes
  de paleta, escala, animação e leitura. Medir FPS, memória e tempo de carregamento.
  **Aceite:** padrões consolidados e esforço restante recalculado antes da produção
  completa. Usar iOS e Android físicos quando disponíveis; registrar limites do teste.

## 3. Unidades e animações

- [x] **PIX-08 — Converter as tropas iniciais restantes.** Depende de PIX-07.
  Xerife, Serra, Rex e Barricada; completar as animações e estados aplicáveis.
  **Aceite:** o deck inicial pode ser apresentado integralmente na nova direção.

- [x] **PIX-09 — Converter as tropas desbloqueáveis.** Depende de PIX-08.
  Bruno, Soldado, Bombeiro, Médica, Lara, Torreta, Drone, Torre Tesla, Cabo Laser e
  Exotraje Titã. Cobrir armas, voo, construções e diferenças de tamanho.
  **Aceite:** as 15 unidades de tropa possuem todas as vistas e estados necessários.

- [x] **PIX-10 — Converter zumbis comuns e especiais.** Depende de PIX-07.
  Separar lotes por ato e comportamento: aproximação, ataque à distância,
  escavação, divisão, proteção, salto e geração de filhotes.
  **Aceite:** comportamentos distintos continuam reconhecíveis por forma e movimento.

- [x] **PIX-11 — Converter chefes e revisar as sheets das 45 unidades.**
  Depende de PIX-09/10. Cobrir escala, ataques, mortes, variantes e indicadores de
  evolução. Conferir pontos de disparo, espelhamento e limites de cada recorte.
  **Aceite:** nenhuma unidade tem quadro faltante, recorte de outra célula ou pé
  desalinhado; diferenças mecânicas recebem sinais visuais claros.

## 4. Cenários, coleção e identidade

- [x] **PIX-12 — Converter os 12 cenários e suas bases.** Depende de PIX-07.
  Fazenda, Cidade, Pântano, Deserto, Neve, Tecnologia, Laboratório, Lançamento,
  Estação, Lua, Marte e Colmeia. Conferir zonas de posicionamento e contraste.
  **Aceite:** cada mundo mantém identidade própria e permite localizar unidades,
  projéteis e perigos com facilidade.

- [x] **PIX-13 — Converter as variações da Fronteira.** Depende de PIX-12.
  Adaptar os temas, tonalidades e combinações geradas ao guia de cores.
  **Aceite:** combinações representativas permanecem legíveis e reproduzíveis.

- [x] **PIX-14 — Converter retratos e ícones.** Depende de PIX-09/11.
  Produzir 24 retratos de cartas, 30 do bestiário, retratos de rádio, moedas, gemas,
  sangue e ícones de navegação. Manter reconhecimento entre retrato e unidade.
  **Aceite:** coleção completa, transparências corretas e leitura nos tamanhos reais.

- [x] **PIX-15 — Converter Home, marca e caminhonete personalizável.**
  Depende de PIX-02/12. Atualizar lobby, mascotes, logo, ícones e splash; integrar
  estados de dano, melhorias da Oficina, pinturas e cosméticos de temporada.
  **Aceite:** as personalizações continuam visíveis e preservam sua função cosmética;
  ícones e splash atendem aos formatos de cada plataforma.

## 5. Interface e efeitos

- [x] **PIX-16 — Adaptar os componentes compartilhados.** Depende de PIX-06/07.
  Tema, fontes, botões, painéis, modais, molduras, indicadores e animações de entrada.
  **Aceite:** componentes reutilizáveis cobrem estados normal, pressionado, bloqueado,
  selecionado, carregando e erro, com área de toque adequada.

- [x] **PIX-17 — Converter as telas e fluxos do app.** Depende de PIX-14/16.
  Cobrir Home, Deck/detalhes, Fases/preparação, combate/tutorial/treino, resultados,
  Loja/assinatura/compras, Passe, missões, semanal, Expedição, Oficina, bestiário,
  conquistas, diário e Ajustes/conta/notificações. Preservar as marcas oficiais de
  provedores de login e as interfaces nativas das lojas.
  **Aceite:** matriz de PIX-01 completa para as interfaces, inclusive estados vazios,
  offline, compra pendente, conflito de save e telas acessadas por links.

- [x] **PIX-18 — Converter efeitos de combate e recompensas.** Depende de PIX-05/16.
  Tiros, fogo, explosões, cura, gelo, eletricidade, escudos, áreas, clima, eventos,
  números de dano, estrelas, evolução e subida de nível.
  **Aceite:** efeitos seguem a grade/paleta; áreas de perigo e alcance permanecem
  perceptíveis; movimento e efeitos reduzidos preservam os sinais necessários.

- [x] **PIX-19 — Revisar acessibilidade e os três idiomas.** Depende de PIX-17/18.
  Conferir fonte ampliada, contraste, rótulos acessíveis, movimento reduzido e
  expansão dos textos em PT/EN/ES, incluindo telas pequenas.
  **Aceite:** ações e informações essenciais não ficam cortadas ou inacessíveis.

## 6. Landing page e integração

- [x] **PIX-20 — Atualizar as artes e a apresentação da landing page.**
  Depende de PIX-14/15/16. Transportar a identidade para `sites/zombie-road`,
  atualizar imagens sociais e capturas do jogo, ajustar estilos e documentar a
  origem das cópias de assets compartilhados.
  **Aceite:** PT/EN/ES e layouts mobile/desktop coerentes com o app; links e
  preferências de consentimento continuam funcionando.

- [x] **PIX-21 — Consolidar o pipeline de arte e as instruções.**
  Depende de PIX-11/13/14/15/18. Atualizar comandos de geração, manifestos, imports
  e caminhos; ajustar as instruções de arte em `CLAUDE.md`, GDD e arquitetura.
  **Aceite:** geração limpa reproduz o conjunto final; arte do app e da web tem
  origem rastreável; nenhum arquivo gerado depende de edição manual.

- [x] **PIX-22 — Verificar regressões e desempenho.** Depende de PIX-19/21.
  Executar tipos, testes e lint; jogar campanha, Sobrevivência, semanal e Expedição.
  Conferir geração de quadros, determinismo do replay, compras, anúncios, restauração,
  sincronização e saves existentes. Comparar desempenho com PIX-07.
  **Aceite:** verificações passam, regras e persistência continuam compatíveis e
  quedas relevantes de FPS/memória/carregamento são resolvidas ou registradas.

## 7. Entrega

- [ ] **PIX-23 — Revisar o app completo em iOS e Android.** Depende de PIX-20/22.
  Conferir instalações existentes e novas, interfaces nativas, telas pequenas,
  densidades de tela e capturas finais para apresentação.
  **Aceite:** checklist visual e funcional concluído, com evidências por plataforma.

- [ ] **PIX-24 — Preparar a versão e publicar os materiais correspondentes.**
  Depende de PIX-23. Preparar builds, notas de versão, capturas das lojas e a
  atualização do site, mantendo as configurações reais de domínio e audiência.
  **Aceite:** artefatos revisáveis prontos; publicação e disponibilidade registradas
  conforme os acessos e decisões de lançamento existentes.

## Extensão opcional

- [ ] **PIX-25 — Avaliar áudio inspirado em consoles de 16-bit.**
  Depende de PIX-07. Produzir uma amostra de efeitos e avaliar sua combinação com
  o novo visual. Estimar separadamente conversão de sons e eventual trilha musical.
  **Aceite:** decisão e esforço registrados antes de incluir áudio novo na produção.

## Ordem de execução

PIX-01 → PIX-02 → PIX-03 → PIX-04/05/06 → PIX-07. Depois do piloto, produzir os
lotes de unidades, cenários e componentes conforme suas dependências; consolidar
em PIX-21, validar em PIX-22/23 e preparar a entrega em PIX-24.

Implementação de PIX-01 a PIX-22 concluída no escopo de arte/código. A revisão de
PIX-07/19/22 registra o limite de simulador e checks automatizados; medições físicas,
compras e anúncios reais permanecem na homologação de PIX-23. A landing de PIX-20
já foi atualizada via Sites, mantendo o acesso privado. PIX-24 tem os recursos de
instalação preparados; build nativo final, lojas e lançamento público não foram feitos.
PIX-25 (áudio novo) é uma extensão opcional, fora da conversão visual autorizada.
