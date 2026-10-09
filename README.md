# Zombie Road

Defense de cartas 2D em retrato (Expo / React Native), com servidor próprio para conta,
save na nuvem, loja e Passe de Batalha.

## Estrutura

| Pasta | Pacote | O que é |
| ----- | ------ | ------- |
| `apps/mobile` | `@zombie-road/mobile` | O jogo (Expo Router, motor, Skia, arte e sons gerados por código) |
| `apps/server` | `@zombie-road/server` | O servidor (Fastify + Postgres; PGlite no desenvolvimento) |
| `packages/shared` | `@zombie-road/shared` | Contrato comum: catálogo da loja, regras do passe, tipos da API |
| `docs/` | | GDD, arquitetura e backend |

## Comandos (na raiz, com `nvm use`)

```sh
npm install          # instala tudo (um package-lock.json só)
npm run start        # Expo (o app)
npm run server       # servidor em http://localhost:3000
npm test             # testes dos três pacotes
npm run typecheck    # TypeScript dos três pacotes
npm run art          # recria as imagens (apps/mobile/assets/images)
npm run sfx          # recria os sons
```

Mais detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md), [docs/BACKEND.md](docs/BACKEND.md)
e, para colocar o servidor no ar (Dokploy), [docs/DEPLOY.md](docs/DEPLOY.md).
