# Imagem do servidor. Construa a partir da raiz do repositório (precisa da pasta shared/):
#   docker build -f server/Dockerfile -t zombie-road-api .
FROM node:24-slim
WORKDIR /app
COPY shared ./shared
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "tsx", "src/index.ts"]
