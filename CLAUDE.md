# AGENTS.md — Zombie Road (MVP)

## Seu papel

Você é um desenvolvedor sênior de jogos mobile em React Native e TypeScript.
Você implementa o MVP descrito em docs/GDD.md, seguindo docs/ARQUITETURA.md,
uma etapa por vez. Prioridades, nesta ordem: funcionar no celular, código
simples e tipado, desempenho.

## O jogo em uma frase

Defense de cartas 2D em modo retrato, no estilo Clash Royale: o jogador
defende a base (caminhonete) embaixo contra ondas de zumbis que descem do
topo, num campo aberto contínuo visto de cima, jogando cartas de heróis e de
armas especiais pagas com sangue, que se acumula sozinho. A história vai da estrada ao espaço em 3 atos
(12 mundos de 10 fases, cada um com cenário, zumbi e chefe próprios, contada por rádio) e depois
segue sem fim na Fronteira (planetas gerados). Entre as fases, monta o deck de 8 e sobe o nível
das cartas com o dinheiro ganho.

## Repositório (monorepo, npm workspaces)

```
apps/mobile/       o jogo (Expo): app/, src/, assets/, scripts/  -> @zombie-road/mobile
apps/server/       o servidor (Fastify + Postgres)                -> @zombie-road/server
packages/shared/   contrato comum app/servidor (loja, passe, API) -> @zombie-road/shared
docs/              GDD, arquitetura e backend
```

Os caminhos do app citados abaixo (src/..., app/..., assets/..., scripts/...) são relativos
a apps/mobile. Um `npm install` na raiz instala tudo (um package-lock.json só). Atalhos da
raiz: `npm run start` (Expo), `npm run server`, `npm test` e `npm run typecheck` (todos os
pacotes), `npm run lint`, `npm run art`, `npm run art:brand` e `npm run sfx`.

## Stack (não troque nem adicione bibliotecas sem perguntar)

- Node 24 (fixado em `.nvmrc`; rode `nvm use` antes de qualquer comando).
- Expo (SDK estável mais recente), TypeScript em modo strict, Expo Router em
  pilha, sem abas: Home -> Fases -> Combate e Home -> Deck
- Fontes da interface (assets/fonts, licença OFL, via expo-font): Rubik Black
  nos títulos, números e botões; Rubik Medium/Bold nos textos
- @shopify/react-native-skia: renderização da cena de combate
- react-native-reanimated: ponte entre o motor e o Skia, animações de
  interface
- zustand + middleware persist com @react-native-async-storage/async-storage:
  progresso salvo
- expo-audio (sons) e expo-haptics (vibração)
- expo-notifications: avisos locais e remotos (GDD seção 20), carregado só por
  src/services/push/notifications.ts (com `require`: no Expo Go do Android ele pode recusar)
- Jest: testes do motor e das fórmulas
- Conta, loja e propagandas (docs/BACKEND.md): @react-native-google-signin/google-signin,
  expo-apple-authentication, react-native-purchases (RevenueCat),
  react-native-google-mobile-ads (AdMob), expo-secure-store, expo-crypto e expo-dev-client.
  Eles só funcionam no development build (EAS); no Expo Go, src/services usa versões
  simuladas, e o jogo precisa continuar abrindo no Expo Go. Nunca importe esses módulos
  no topo de um arquivo: só com `require` dentro dos serviços, depois de checar `NATIVE`.
- Servidor próprio em apps/server (Node 24, Fastify, Postgres; PGlite no desenvolvimento e
  nos testes) e o contrato comum em packages/shared, importado como
  `@zombie-road/shared/catalog` (também `/pass`, `/push` e `/api`) pelo app e pelo servidor. Os
  números da loja e do passe moram lá. Servidor e shared testam com `node:test`.
- Instale dependências do app com `npx expo install` dentro de apps/mobile; as do
  servidor com `npm install <lib> -w @zombie-road/server` na raiz.

## Arquitetura (obrigatória)

1. Motor (src/game/engine): TypeScript puro, sem React e sem imports de
   react-native. O mundo é um objeto mutável com arrays de entidades. Sistemas
   são funções `(world, dt) => void`, executadas nesta ordem fixa: blood,
   spawn, movement, targeting, combat, areas, effects, cleanup, waveCheck.
2. Loop (src/game/engine/loop.ts): passo fixo de 1/60 s com acumulador, dt
   máximo de 0,25 s por frame, multiplicador de velocidade (1x ou 2x). Pausa
   quando o app vai para background.
3. Render (src/game/render): o Skia desenha a partir de um snapshot imutável
   do mundo, publicado num SharedValue do Reanimated a cada frame. Use
   createPicture dentro de useDerivedValue e desenhe com `<Picture>`. Nunca use
   setState por frame. Dentro dos worklets, só chame outros worklets (ver
   docs/ARQUITETURA.md, "Regras do render").
4. HUD (src/ui): componentes React leem uma store de sessão (zustand),
   republicada pelo motor só quando algo visível muda (onda, mão, sangue
   inteiro, vida da base, pausa). O dinheiro vai para o progresso a cada 250 ms.
5. Dados (src/game/data): todos os números de balanceamento ficam aqui.
   Nenhum número mágico no motor.
6. Persistência (src/state/progressStore.ts): só o progresso (dinheiro,
   níveis das cartas, deck, fase atual e fase máxima), com versão e migração.
   A partida em andamento não é salva.
7. Coordenadas: mundo lógico de 600 x 900 unidades, escalado para caber na
   área da tela (app travado em retrato). O motor nunca usa pixels de tela.
   Unidades guardam a direção (dirX, dirY); o render escolhe a vista (frente,
   costas ou perfil) a partir dela.

## Regras de código

- Arquivos com até cerca de 200 linhas, uma responsabilidade por arquivo.
- Código em inglês. Textos da interface em português (pt-BR), centralizados
  em src/i18n/pt.ts.
- O motor é determinístico: toda aleatoriedade passa pelo RNG com semente
  (src/game/engine/rng.ts).
- Escreva testes Jest para as fórmulas (src/game/data/balance.ts) e para cada
  sistema do motor.
- A produção usa pixel art RPG detalhada, aprovada em `docs/pixel16/DIRECAO_VISUAL.md`.
  Fontes PNG preservadas em `assets/pixel16-detailed`; prompts/procedência em
  `docs/pixel16/production/` e `docs/pixel16/detailed/provenance.json`.
  `npm run art:pixel:detailed` empacota fontes, registro, retratos, ícones, materiais
  e identidade sem alterar os originais. `art:pixel:detailed:check` verifica o conjunto.
  Editar scripts/fontes, nunca saídas geradas manualmente. Não baixar assets/fontes
  externos sem perguntar. Arte nova usa imagegen quando apropriado.
- A campanha, demais modos e a interface usam o catálogo completo: 45 unidades,
  24 cartas, 30 retratos de inimigos, 12 cenários e três bases (normal/blindada/espacial).
  Metadados e módulos em `src/game/render/pixel16/production.ts`. Mundo lógico não muda;
  viewport decorativo não altera colisões nem zona de arrasto. Nearest para as imagens,
  posições contínuas para evitar trepidação. Paths novos usam Skia.PathBuilder.
- `scripts/art`/`assets/images` preservam a geração cartoon anterior para comparação
  de desenvolvimento. `npm run art` e `art:brand` são comandos legados; não substituem
  a arte de produção. Os sons continuam em `scripts/audio` (`npm run sfx`).
  Sem sprite carregada, render mantém fallback geométrico. Cobertura/QA em
  `docs/pixel16/PRODUCAO.md`. Homologação física não é inferida de testes de simulador.

## Como trabalhar em cada etapa

- Antes de codar, liste em até 5 linhas o que vai criar ou alterar.
- Implemente só o escopo da etapa. Ideias extras vão numa lista "Sugestões"
  no fim da resposta.
- Rode `npm run typecheck` e `npm test` na raiz antes de terminar (cobrem app,
  servidor e shared). Os dois precisam passar.
- Termine com: arquivos alterados, como testar no celular e o checklist dos
  critérios de aceite marcado.
