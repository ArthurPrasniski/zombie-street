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
WORKDIR /repo/apps/server
ENV NODE_ENV=production
EXPOSE 3000
# Saudável = /health responde (o Docker Swarm do Dokploy só troca a versão quando a nova responde)
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# Node direto (sem npx) recebe o SIGTERM do redeploy e fecha o servidor com calma
CMD ["node", "--import", "tsx", "src/index.ts"]
