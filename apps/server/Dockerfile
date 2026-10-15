# Imagem do servidor. Construa a partir da raiz do monorepo (precisa de packages/shared):
#   docker build -f apps/server/Dockerfile -t zombie-road-api .
# No Dokploy: Build Type "Dockerfile", Dockerfile Path apps/server/Dockerfile, Docker Context
# Path "." (docs/DEPLOY.md).
FROM node:24-slim
WORKDIR /repo
# Só os manifestos primeiro (cache das dependências). O do app entra porque o lockfile é único,
# mas o `-w` instala só as dependências do servidor.
COPY package.json package-lock.json ./
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci -w @zombie-road/server --omit=dev
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
# O desafio semanal reproduz o mesmo motor puro do app. O tsconfig do servidor
# resolve @/* nesses arquivos e substitui i18n/locale por sua versão sem Expo.
COPY apps/mobile/src/game/data ./apps/mobile/src/game/data
COPY apps/mobile/src/game/engine ./apps/mobile/src/game/engine
COPY apps/mobile/src/game/types.ts ./apps/mobile/src/game/types.ts
COPY apps/mobile/src/i18n/names.ts ./apps/mobile/src/i18n/names.ts
WORKDIR /repo/apps/server
ENV NODE_ENV=production
# Valida os imports reais da imagem antes do deploy, sem conectar ao banco.
RUN node --import tsx --input-type=module -e "await import('./src/app.ts')"
EXPOSE 3000
# Saudável = /health responde (o Docker Swarm do Dokploy só troca a versão quando a nova responde)
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# Node direto (sem npx) recebe o SIGTERM do redeploy e fecha o servidor com calma
CMD ["node", "--import", "tsx", "src/index.ts"]
