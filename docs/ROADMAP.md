# Zombie Road — plano de evolução do app e presença na web

## Execução — 14/10/2026

Implementação das oito etapas entregue na ordem, com validação incremental e migrações.
A liberação comercial depende das verificações externas abaixo; este status não substitui QA nativo.

| Etapa | Código entregue | Evidência / limite |
| --- | --- | --- |
| 1 | Tentativas persistidas, recibos, histórico/suporte, estados/retry de save, inicialização recuperável, consentimento e retenção | Testes de compra, conta, evento/estorno; roteiro em `QA.md`. Compras reais e fechamento abrupto exigem aparelho. |
| 2 | Três decks, nomes/cópia, troca/ordem, filtros, resumo e ficha | Migração/regra testadas; Deck conferido no simulador. |
| 3 | Tutorial por ações, primeira melhoria, skip/replay, prévia e treino isolado | Regras testadas; prévia conferida no simulador. |
| 4 | 1×/2×, estatísticas/dicas, XP/desbloqueios/conquistas, passe no nível atual e resgate em lote | Tipos/testes; XP e moedas com recibos. Regras 3.000/600/90 mantidas para medir antes de rebalancear. |
| 5 | Três missões UTC, fila de resultados, prêmios idempotentes, meta na Home, busca de estrelas e claim-all | Testes de repetição/concorrência/virada do dia. Contadores do app não servem para competição pública. |
| 6 | Marcos 10/30/60, desafio fixo, início/resultado, replay no servidor e histórico de medalhas | Motor reproduz partida; rejeita conta/tempo/partida inválidos. Sem ranking público. |
| 7 | Detalhes da caminhonete, pinturas/maestria, dicas/atalhos do bestiário, preferências e diário | Cosméticos separados do poder; ajuste de idioma não muta objetos congelados pelo render. Sem música para controlar. |
| 8 | Expedição com escolha entre chefes, modificadores temporários, recorde próprio e 75% das moedas | Testes de escolha única/isolamento; calibração de dificuldade em sessões reais permanece necessária. |
| Web | PT/EN/ES, links por env, SEO condicional, associação preparada e cliques opt-in condicional | Prévia privada; Chrome 390/1440 nos três idiomas, sem overflow ou imagens quebradas. |

### Pendências externas de lançamento

- [ ] Testes de compras/renovação/restauração/AdMob em aparelhos físicos iOS e Android; seguir `QA.md`.
- [ ] Configurar e conferir os produtos reais nas lojas/RevenueCat, incluindo assinatura mensal.
- [ ] Preencher links oficiais, suporte, política/termos revisados e domínio nas variáveis de ambiente.
- [ ] Informar Team ID/fingerprint reais, gerar novo build e validar links universais.
- [ ] Revisar Safari/Chrome mobile e definir a audiência pública. A prévia continua privada.
- [ ] Coletar linha de base com consentimento e calibrar missões, marcos e Expedição com uso real.

## Direção

Dar clareza às escolhas do jogador, ensinar o combate e aumentar a variedade usando o conteúdo
existente. A campanha já tem 120 fases, 24 cartas, três atos, Fronteira infinita e Sobrevivência.
Cada etapa deve poder ser entregue e testada separadamente. As estimativas abaixo são relativas,
não compromissos de prazo; definir calendário após medir o trabalho da primeira etapa.

## Etapa atual — Deck e landing page

### Deck: reduzir competição visual

- [x] Manter o deck de oito cartas como conteúdo principal.
- [x] Usar molduras mais discretas e gotas de custo menores apenas na organização do Deck.
- [x] Trocar as oito setas de melhoria por um resumo; ações ficam no detalhe de cada carta.
- [x] Não repetir o nível 1 em todas as cartas da grade; manter o nível nos detalhes.
- [x] Separar coleção disponível de cartas bloqueadas, recolhidas por padrão.
- [x] Mostrar uma próxima carta a desbloquear, com sua condição.
- [x] Retirar os grandes textos sobrepostos de bloqueio da grade; preservar condição no toque.
- [x] Preservar as cores de evolução e a apresentação das cartas na mão de combate.
- [x] Conferir a tela no simulador iOS com o progresso atual.
- [ ] Confirmar o resultado em iPhone pequeno e Android, com fonte ampliada e três idiomas.

Aceite: adicionar, remover e melhorar cartas seguem funcionando; as cartas bloqueadas continuam
consultáveis; oito cartas iniciais e a próxima meta recebem destaque sem exibir 16 cadeados.

### Landing page: projeto independente

- [x] Criar `sites/zombie-road`, sem dependências de mobile ou servidor.
- [x] Reutilizar fontes e artes do próprio jogo.
- [x] Apresentar combate, personagens, campanha, Sobrevivência e perguntas frequentes.
- [x] Configurar links das lojas, redes, suporte e páginas legais por variáveis de ambiente públicas.
- [x] Ocultar links não configurados e mostrar disponibilidade de acordo com as lojas preenchidas.
- [x] Validar layout e ausência de rolagem horizontal no Chrome em 390 px e 1440 px.
- [x] Publicar uma prévia privada pelo Sites.
- [ ] Validar navegação visual em navegadores mobile antes do lançamento público.
- [ ] Preencher links oficiais, política de privacidade e termos reais.
- [ ] Definir domínio e publicar para audiência pública após a revisão da prévia privada.

## 1. Confiabilidade e medição — prioridade alta, esforço médio

### Entregas

- Acompanhar compras pendentes após trocar de tela, fechar e reabrir o app.
- Registrar histórico de compra/entrega por transação e acesso a suporte, sem tokens nos logs.
- Tratar recuperação de compra e troca de conta com cenários nativos completos.
- Exibir salvando, salvo, conflito e falha, com tentativa manual e comparação de saves.
- Revisar a hidratação das stores e a recuperação de falhas de inicialização.
- Medir tutorial iniciado/concluído, fase iniciada/vencida/perdida, tentativas, deck usado,
  abandono, erros e tempo entre compra e entrega. Definir consentimento e retenção de dados.
- Criar um roteiro de QA para assinatura, passe, anúncio, conexão instável, reinstalação e
  segundo aparelho. Preservar o offline até a validade confirmada da assinatura.

Aceite: nenhum sucesso de compra antes da entrega, nenhuma duplicação por repetição de evento,
e falhas com uma ação clara para o jogador. Estabelecer uma linha de base antes de criar metas
numéricas de retenção ou conversão. Depende da configuração dos produtos nas lojas/RevenueCat.

## 2. Decks e decisões — prioridade alta, esforço médio

### Entregas

- Três decks salvos, com nome, seleção e duplicação.
- Troca direta de cartas com o deck cheio e reordenação sem deixar espaços acidentais.
- Filtros por tipo, custo, disponibilidade e melhoria; seleção e rolagem preservadas.
- Custo médio e resumo de funções, com dicas simples sobre defesa, área, cura e controle.
- Ficha de carta com intervalo de ataque, DPS quando aplicável, alvos e efeitos de evolução.
- Melhorar a apresentação da comparação de atributos sem recolocar todos os números na grade.

Aceite: mudar de estratégia sem desmontar o deck atual; migrar saves com o deck atual no primeiro
espaço; impedir cartas duplicadas/bloqueadas; manter os oito espaços obrigatórios para jogar.
Depende da primeira revisão visual e das regras atuais de persistência.

## 3. Tutorial e preparação — prioridade alta, esforço médio

### Entregas

- Primeira fase guiada por rádio, ensinando sangue, posicionamento, defesa e arma especial.
- Primeira melhoria guiada após vencer; opção de pular e repetir pelos Ajustes.
- Prévia de fase com inimigos já conhecidos, chefe, evento e deck selecionado.
- Campo de treino para experimentar cartas liberadas sem recompensa econômica.

Aceite: tutorial termina por ações reais, não por passar páginas; novos controles acessíveis;
interrupção e retomada não prendem o jogador. Depende dos eventos de medição e da interface do Deck.

## 4. Combate, resultado e passe — prioridade alta, esforço médio

### Entregas

- Controle 1×/2× usando o suporte existente do motor, com preferência explícita.
- Registrar duração, onda da derrota, danos e uso de cartas para produzir dicas fundamentadas.
- Resumo de XP, recompensas, desbloqueios e conquistas ao terminar uma partida.
- Atalhos da derrota para Deck e Oficina, preservando a regra de anúncio para repetir.
- Abrir o passe no nível atual, destacar a próxima recompensa e resgatar disponíveis em conjunto.
- Exibir teto diário de XP e reinício; garantir idempotência de resgates em lote.
- Medir conclusão do passe: hoje 3.000 XP encerram 30 níveis, com teto de 600 XP/dia em uma
  temporada de 90 dias. Avaliar metas extras e cosméticos a partir do comportamento observado.

Aceite: informação útil imediatamente após a partida; dicas derivadas de dados, sem promessas
de vitória; ganhos e resgates não duplicados. Depende de coleta de eventos do motor e backend.

## 5. Objetivos recorrentes e Home — prioridade alta, esforço médio

### Entregas

- Três missões diárias apresentadas como transmissões de rádio.
- Objetivos compatíveis com cartas e modos já liberados; não exigir assistir anúncios.
- Recompensas de moedas/XP balanceadas, relógio do servidor e resgate idempotente.
- Home com uma próxima meta prioritária: desbloqueio, missão ou recompensa pronta.
- Melhor acesso às fases sem três estrelas e explicação dos limiares de vida da base.
- Conquistas com resgate em conjunto e aviso discreto no resultado.

Aceite: missões não mudam ao ajustar o relógio local nem entregam prêmio duas vezes; assinantes
e jogadores sem anúncios disponíveis conseguem cumpri-las. Depende de metas e economia medidas.

## 6. Variedade e desafio semanal — prioridade média, esforço médio a alto

### Entregas

- Algumas fases desenhadas manualmente usando `STAGE_OVERRIDES`, começando pelos marcos.
- Desafio semanal com semente, cartas e níveis iguais para todos; medalhas por desempenho.
- Registrar início e resultado no servidor; validar duração, versão e regras da tentativa.
- Só adicionar ranking público depois de validar os resultados: hoje o backend recebe XP e
  progresso do aparelho, o que não basta para competição pública confiável.

Aceite: desafio reproduzível, reinício da semana definido e nenhuma vantagem comprada na
composição fixa. Depende das estatísticas de combate, backend de tentativas e balanceamento.

## 7. Identidade, coleção e conforto — prioridade média, entregas independentes

- Oficina: mudanças visuais de lataria, arma e tanque refletidas no combate (esforço médio/alto).
- Bestiário: dicas práticas, cartas recomendadas e atalhos para as disponíveis (baixo/médio).
- Maestria por carta: objetivos que liberam molduras, títulos e visuais (médio/alto).
- Pinturas da caminhonete e recompensas cosméticas para temporadas (médio/alto).
- Ajustes: idioma manual, redução de movimento/tremor/efeitos, volumes independentes quando
  houver música, legibilidade com fonte ampliada (médio).
- Diário: destacar mensagens novas e permitir releitura sem interromper o combate (baixo/médio).

Aceite: cosméticos não alteram o poder das cartas; preferências persistem; mensagens de rádio
e interfaces continuam legíveis nos três idiomas e com redução de movimento.

## 8. Expedições com escolhas — prioridade futura, esforço alto

Criar uma variação da Sobrevivência com escolhas de vantagens temporárias entre chefes.
Separar modificadores do progresso permanente, testar combinações e definir recompensas antes
de ativar monetização. Escopo inicial autorizado na execução: vantagens temporárias e recorde próprio, sem monetização adicional. Medir uso para as próximas expansões.

## Trilha da presença na web

1. **Apresentação:** landing atual, artes, personagens, modos e disponibilidade por plataforma.
2. **Preparação do lançamento:** links reais, textos legais revisados, suporte, metadados sociais,
   favicon, imagens leves e revisão em Safari/Chrome mobile; domínio e audiência pública definidos.
3. **Descoberta:** sitemap/canonical no domínio definitivo, páginas PT/EN/ES e associação de
   links universais ao app quando existirem os IDs definitivos nas lojas.
4. **Operação:** medir cliques para lojas com a política de consentimento definida; manter textos
   e disponibilidade coerentes com as versões publicadas. Só criar formulário de novidades quando
   houver destino real para os dados e processo de descadastro.

## Critério comum de conclusão

- Funcionar em dispositivo físico; simulador sozinho não valida anúncios e compras reais.
- Rodar tipos e testes relevantes; testar os fluxos completos alterados.
- Incluir migração e sincronização para novos campos persistidos.
- Manter textos em PT/EN/ES, desempenho do combate e dependências existentes.
- Atualizar GDD/backend quando as regras mudarem; usar feature flags para experimentos remotos
  apenas após definir comportamento offline e compatibilidade de versões.

### Verificação da entrega

- Tipagem dos três pacotes passou; 361 testes passaram (277 app, 74 servidor, 10 shared).
- Lint sem erros; os avisos restantes são imports nativos condicionais já usados no projeto.
- Migrações aplicadas ao Postgres local; `/health` e `/weekly` responderam normalmente.
- Deck compacto e preparação conferidos no simulador iOS; página nos três idiomas conferida
  no Chrome em 390/1440 px, sem imagens quebradas ou rolagem horizontal.
- Prévia privada atualizada via Sites: https://zombie-road-official.arthurprasniski.chatgpt.site
  Fonte independente em `sites/zombie-road`; commit `f18f4c2`. O app/backend permanecem em Changes.
