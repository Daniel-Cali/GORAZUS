# GORAZUS ERP — apps/web (React 19 + Vite, composition root del frontend).
# En producción no corre Node — es un build estático servido por el
# contenedor nginx del compose (ver docs/architecture/08 §1: "No corre
# Node en producción, solo assets"). Este Dockerfile solo compila el
# build; el servido real ocurre en el servicio `nginx`, no acá.

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

# -----------------------------------------------------------------------------
FROM base AS development
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 5173
CMD ["pnpm", "nx", "serve", "web", "--host"]

# -----------------------------------------------------------------------------
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm nx build web --configuration=production

# -----------------------------------------------------------------------------
# Etapa "production": NO sirve el build (no corre nginx propio) — el
# servicio `nginx` del compose es el único punto de entrada también
# para estáticos (ver docs/architecture/08-infraestructura-y-despliegue.md §2,
# `location /` sirve desde su propio filesystem). Este contenedor solo
# copia el build a un volumen compartido (`web_dist`, ver
# infra/docker/docker-compose.yml) y termina — no queda un proceso
# corriendo, es un contenedor de un solo uso ("init container").
FROM alpine:3.20 AS production
COPY --from=build /app/dist/apps/web /dist
CMD ["sh", "-c", "cp -r /dist/. /shared/ && echo 'build de web copiado a /shared'"]
