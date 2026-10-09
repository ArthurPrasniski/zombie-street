# ARQUITETURA — Zombie Road (MVP com cartas)

O motor fica em TypeScript puro, separado da tela, e nunca importa React. Ele
publica um snapshot para o Skia a cada frame, atualiza as stores quando algo
visível muda (dinheiro a cada 250 ms) e só muda de comportamento quando a
tela envia um comando.

## Pastas

Monorepo com npm workspaces (um `npm install` e um package-lock.json na raiz):

```
apps/mobile/              o jogo (Expo): @zombie-road/mobile, árvore abaixo
apps/server/              servidor próprio (docs/BACKEND.md): @zombie-road/server
packages/shared/          contrato comum app/servidor: @zombie-road/shared
  src/catalog.ts          catálogo da loja (gemas, moedas, produto do passe)
  src/pass.ts             regras puras do Passe de Batalha
  src/api.ts              corpos de pedido e resposta da API
  src/push.ts             notificações: tipos, categorias, janela do dia e a tela de cada aviso
docs/                     GDD, arquitetura e backend
```

O app e o servidor importam `@zombie-road/shared/catalog` (também `/pass`, `/push` e `/api`): o pacote
exporta o TypeScript direto, sem build. Dentro de apps/mobile:

```
app/                      Expo Router (pilha, sem abas)
  _layout.tsx             layout raiz: fontes (Lilita One e Rubik) e progresso salvo
  index.tsx               Home (cena, rota, Jogar, Deck, Fases, Sobrevivência, atalhos)
  stages.tsx              Fases -> Combate (com estrelas)
  deck.tsx                deck de 8, coleção, níveis e evolução das cartas
  combat.tsx              Combate de uma fase ou da Sobrevivência (`?mode=survival`)
  garage.tsx              Oficina: peças da caminhonete
  bestiary.tsx            Bestiário: zumbis vistos, ficha e abates
  diary.tsx               Diário: mensagens de rádio já ouvidas, por ato
  achievements.tsx        Conquistas: marcos e resgate
  settings.tsx            Ajustes: conta (Google/Apple, sair, excluir), som, vibração, números de dano
  shop.tsx                Loja: Passe em destaque, gemas (dinheiro) e moedas (gemas)
  pass.tsx                Passe de Batalha: temporada, assinatura e as duas trilhas
src/
  game/
    types.ts              tipos compartilhados (fonte da verdade)
    data/                 todos os números do GDD
      cards.ts            tropas, armas especiais, deck inicial, desbloqueios
      zombies.ts          zumbis (comuns, de mundo, chefes e especiais)
      worlds.ts           12 mundos da campanha, worldDef (campanha ou Fronteira), fase <-> mundo-fase
      frontier.ts         planetas gerados da Fronteira: tipo, tema, ameaça, mutação
      story.ts            atos, mensagens de rádio por mundo
      stages.ts           gerador das 50 fases (ondas, especiais, eventos; sobrescrita manual)
      survival.ts         ondas sem fim da Sobrevivência
      events.ts           eventos de cenário de cada mundo
      evolutions.ts       efeitos das cartas nos níveis 10 e 20
      truck.ts            peças da caminhonete (vida, dano, sangue inicial)
      achievements.ts     conquistas e prêmios
      balance.ts          escalonamento, níveis das cartas, bônus, estrelas
      constants.ts        campo, base, sangue, limite de tropas, IA, ritmo e efeitos
      __tests__/
    engine/
      world.ts            createWorld(stage, { deck, cardLevels, truck }, seed, mode)
      cards.ts            jogar carta: validação, sangue, limite de tropas, tropa ou efeito
      loop.ts             passo fixo, velocidade, pausa; aplica comandos
      commands.ts         playCard, setSpeed, setPaused
      queries.ts          distância, alvos, alcance dos zumbis (Cuspidor, Escavador)
      damage.ts           dano/cura (armadura, escudo, explosão, congelar, divisão)
      attacks.ts          ataques das tropas: tiro, chamas, virote que atravessa, cura
      evolution.ts        efeitos das tropas evoluídas, lentidão e atordoamento
      spells.ts           armas especiais do Ato 3 que agem com o tempo (Escudo, Buraco Negro, Canhão)
      frontier.ts         ameaça do planeta e mutação do chefe em cada zumbi criado
      scenario.ts         eventos de cenário e clima (névoa, nevasca)
      rng.ts              RNG com semente (mulberry32) e shuffle
      snapshot.ts         World -> RenderSnapshot
      bot.ts              jogador simples (testes e demonstração em __DEV__)
      systems/            blood, spawn, movement, targeting, combat,
                          areas, effects, cleanup, waveCheck
      __tests__/
    render/
      GameCanvas.tsx      <Canvas> + <Picture> a partir do snapshot
      camera.ts           prévia de arrasto (carta sobre o campo)
      drawWorld.ts        arena, base, unidades (ordem por y), tiros
      drawEffects.ts      fogo, ataque aéreo, explosões, cura, fumaça, cuspe, terra, números
      drawSpecials.ts     monte do Escavador, escudo, anel de evolução, atordoado
      drawScenario.ts     fardo, carros-bomba, alvos (bombas, detritos, meteoros), gás e jato
      drawWeather.ts      névoa, nevasca, apagão (com lanternas) e tempestade de poeira
      drawSpells.ts       gelo, Escudo de Energia, Buraco Negro e Canhão Orbital
      animation.ts        escolhe o quadro e a vista (linha) de cada unidade
      sprites.ts          carrega o fundo e a base do mundo e só as sheets da partida
      spriteLayout.json   layout das sheets (compartilhado com scripts/art)
  state/
    progress.ts           progresso salvo e regras de cartas, deck e fases
    migrate.ts            converte saves antigos (v1 a v8); também confere todo save carregado
    stars.ts, truck.ts, bestiary.ts, achievements.ts, radio.ts   regras de cada recurso
    progressStore.ts      persistido (v8)
    settingsStore.ts      Ajustes, persistidos à parte
    accountStore.ts       conta, gemas, passe e estado da nuvem (cópia do servidor)
    sessionStore.ts       efêmero: modo, onda, mão, sangue, base, campo cheio, pausa
  hooks/
    useGameLoop.ts        liga motor, snapshot, stores, comandos e AppState
    useCombatEvents.ts    som, contadores, aviso de evento e resultado da partida
    useCombatLayout.ts    tamanhos do campo e da mão
    useMatchRecord.ts     vistos, abates e cartas jogadas, gravados no fim da partida
    useCardDrag.ts        arrastar cartas da mão para o campo
    useAccountSync.ts     sessão, propagandas e save na nuvem (no layout raiz)
    usePushSync.ts        notificações: cancela/agenda os avisos locais, abre a tela do aviso
  services/               conta e loja (docs/BACKEND.md): env, api, session, cloudSave, economy,
                          purchases (RevenueCat), ads (AdMob), signIn, rewards; simulados no Expo Go
    push/                 notificações (GDD seção 20): plan.ts (plano puro dos avisos locais),
                          local.ts (agenda), notifications.ts (módulo e permissão), remote.ts (token)
  audio/
    sfx.ts                sons (expo-audio) e vibração por evento e por recompensa
  ui/
    kit/                  AppText, StrokeText (texto com contorno), Chunky (caixa gordinha),
                          Button, Card, Pill/IconButton/Segments, Toggle, Badge
    fx/                   Pop, CountUp, CoinBurst, LevelUpBurst (animações de recompensa)
    home/                 RouteProgress, HazardButton, HomeShortcuts, HomeTile, SurvivalCard
    cards/                CardView, CardGrid + CardActions, UpgradeModal, EvolutionNote, stats.ts
    combat/               CardHand, BloodBar, CombatHud, CombatModals, WaveBanner, EventBanner
    modals/               GameModal, StageClear, StageFailed, SurvivalOver
    garage/, bestiary/, achievements/, radio/   linhas, fichas e o modal do rádio
    shop/, pass/, account/   cartões da loja, níveis do passe, painel da conta e conflito do save
    push/                 PushPrompt (pergunta na Home) e PushSettings (seção de Ajustes)
    SettingRow.tsx        linha de Ajustes (nome, explicação e controle)
    GemLabel, FakeAdOverlay (propaganda de teste do Expo Go), modals/DoubleCoinsButton
    worldInfo.ts          nome, detalhes e tom de cor do mundo (planetas da Fronteira)
    CashLabel, ScreenHeader, StageTile, StarRow, WorldBanner, theme.ts
  i18n/pt.ts, ptRadio.ts  textos (as falas do rádio à parte; ptShop e ptPush: loja e avisos)
  utils/format.ts         1.2K, 3.4M, 1.150, tempo
assets/                   imagens, fontes e sons (gerados pelos scripts)
scripts/art/              arte vetorial (CanvasKit): `npm run art` recria assets/images;
                          `npm run art -- ui sprites=spitter` gera só as partes pedidas;
                          `npm run art:brand` só logo, ícones do app e splash
scripts/art-pixel/        pixel art antiga (não entra no build)
scripts/audio/            efeitos sonoros: `npm run sfx` recria assets/sounds
```

## Fluxo de dados

1. A tela Combate chama `useGameLoop({ mode, stage }, runId, onEvent)`, que cria
   o World (fase ou Sobrevivência) com o deck, os níveis e a caminhonete salvos e
   roda o loop a cada frame.
2. A cada frame: comandos pendentes são aplicados, os sistemas rodam em passos
   fixos, snapshot.ts gera o RenderSnapshot e o GameCanvas redesenha.
3. A UI nunca altera o World: arrastar uma carta envia
   `{ type: 'playCard', slot, x, y }` (coordenadas do mundo).
4. O motor empilha GameEvent em world.events; o hook entrega cada um para
   useCombatEvents (modais, aviso de evento, estrelas e recorde), sfx.ts (sons e
   vibração) e useMatchRecord (zumbis vistos, abates e cartas jogadas, gravados
   no progresso de uma vez no fim da partida).
5. Eventos de cenário entram pelas ondas (`WaveDef.event`): o sistema spawn
   dispara e o sistema areas faz cada um andar (src/game/engine/scenario.ts),
   sem mudar a ordem fixa dos sistemas.
6. A sessionStore só é republicada quando algo visível muda (fase, onda,
   abates, sangue inteiro, mão, pausa, vida da base, campo cheio). O dinheiro vai para o
   progressStore a cada 250 ms.
7. O sangue da barra enche suave lendo o snapshot no thread de UI.

## Conceitos (ver src/game/types.ts)

- `CardDef` = `TroopDef` (tropa: ranged, melee ou structure) | `SpellDef`.
- `World`: base, tropas, zumbis, efeitos visuais, `areas` (fogo do molotov e
  ataque aéreo pendente), sangue (`blood`), `hand` (4 cartas) e `queue` (fila; a
  primeira é a "próxima"), níveis das cartas.
- `ZombieEntity.target`: tropa sendo atacada; atacando com `target` null = base.
- `Effect`: tiro, número de dano, explosão, cura, fumaça e corpo (`corpse`,
  que toca a animação de queda de zumbis e tropas).
- `GameCommand`: playCard, setSpeed, setPaused.
- `GameEvent`: waveStarted, bossSpawned, zombieKilled, cardPlayed, attack,
  explosion, baseHit, troopDown, stageCleared, stageFailed.

## Sprites e vistas

- O campo é visto de cima, inclinado (estilo Clash Royale). Cada sheet de
  unidade tem 3 linhas: frente (descendo), costas (subindo) e perfil
  (olhando para a direita; espelhado quando dirX < 0). A ordem está em
  `views` no spriteLayout.json.
- `viewRow(dirX, dirY)`: até ~50° da vertical usa frente ou costas; mais
  deitado, perfil. Quadros "caído" e de morte vêm do perfil nas 3 linhas.
- Quadros em caixa de desenho de 100 x 100 unidades (pés em 50, 94), que vale
  80 unidades do mundo. Sheets de 160 px por quadro (chefes e zumbis grandes,
  288 px, porque aparecem maiores). Cada animação tem 8 quadros (tropas: parado,
  ataque, caído, andando; zumbis: andando, ataque, morte com 5); a tabela está
  em spriteLayout.json e animation.ts escolhe o quadro pelo tempo de recarga; o render lê o tamanho do quadro da própria
  imagem e desenha suavizado (FilterMode.Linear).
- `muzzle` no spriteLayout.json guarda a boca da arma por vista, em unidades
  de desenho; o build mede no desenho e grava sozinho.
- Arte vetorial em scripts/art, desenhada com o CanvasKit (Skia em
  WebAssembly, instalado junto com o react-native-skia) e salva em PNG:
  ck.mjs (formas, contorno, sombra em crescente, brilho), shadeClash.mjs
  (volume em degradê, luz de borda e contorno da cor do material, ligado por
  setToonStyle), clash.mjs (contorno da silhueta inteira, esticar/achatar e
  a tabela dos 8 quadros), output.mjs (PNG e texto), chibi.mjs (boneco
  nas 3 vistas), face.mjs, heroes.mjs + heroPoses.mjs, zombies.mjs, dog.mjs,
  weapons.mjs, props.mjs (barricada), units.mjs (ponto único por unidade),
  arena.mjs + arenaKit/Farm/City/Swamp/Desert/Snow.mjs (um fundo 1200 x 1800 px
  por mundo), base.mjs (4 estados de dano, chão do mundo), heroes2.mjs e
  zombies2.mjs (unidades dos mundos novos), zombies3.mjs (zumbis especiais),
  zombies4.mjs e zombies5.mjs (Atos 2 e 3; o Casulo e o Verme Lunar com desenho
  próprio), heroes3.mjs + scifi.mjs (armas sci-fi: Drone, Torre Tesla, Cabo
  Laser, Exotraje Titã), story.mjs (Doutora Vega e o rádio), baseSpace.mjs
  (módulo espacial), arenaTech/Lab/Launch/Station/Moon/Mars/Hive.mjs,
  turret.mjs, icons.mjs + icons2.mjs (ícones e armas especiais),
  portraits.mjs (retratos das cartas e do Bestiário, mascote e caminhonete da Oficina),
  brand.mjs (logo, ícones do app.json, splash e favicon; buildBrand.mjs gera só
  eles), lobby.mjs (cena do topo da Home) e build.mjs. O build completo leva
  cerca de 5 minutos (camadas de silhueta e 8 quadros por animação).

## Regras do render (worklets)

- Tudo o que roda dentro do `useDerivedValue` do GameCanvas é worklet.
- Um worklet só pode chamar outros worklets: nada de funções comuns como
  `isTroop` (ler `card.kind` direto). Chamar função comum derruba o app.
- O plugin de worklets captura o closure quando cada worklet é criado:
  defina as funções auxiliares antes de quem as usa no mesmo arquivo.

## Ferramentas de desenvolvimento (só em __DEV__)

- `/combat?autoplay=1`: o jogador simples joga sozinho (ver o render).
- `/combat?stress=1`: solta 30 zumbis de uma vez; o HUD mostra o FPS.
- `/combat?stage=23`: abre qualquer fase (1 a 50), para ver os outros mundos.
- `/combat?fast=1`: começa em 2x (junto com `autoplay`, chega logo ao fim da fase).
- `/combat?spawn=digger,shielder`: solta esses zumbis no campo logo no começo.
- `/combat?event=hay`: dispara o evento de cenário (hay, carBombs, fog, shelling, blizzard) no começo.
- `/combat?deck=drone,tesla`: deck só desta partida (completa com o deck salvo).
- `/combat?deck=orbital,blackhole&cast=orbital,blackhole`: joga essas cartas no começo, no centro do campo.
- `/combat?mode=survival`: abre a Sobrevivência mesmo antes de liberar.
- `/?scroll=end`: abre a Home rolada até o fim.
- `/stages?world=14`: abre a tela Fases nesse mundo (também os planetas da Fronteira).
