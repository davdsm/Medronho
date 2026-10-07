# Frontend (React/Vite) servido por um pequeno servidor Node que também faz proxy para a API.
# Contexto de build: a raiz do repositório (docker compose trata disto).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
COPY shared ./shared
ARG VITE_SITE_URL=http://localhost:8080
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    DIST_DIR=/app/dist \
    API_URL=http://api:3001
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY web/server.mjs ./server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
CMD ["node", "server.mjs"]
