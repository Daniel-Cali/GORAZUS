# GORAZUS ERP — apps/api (NestJS, composition root del backend).
# Build de contexto = raíz del monorepo (ver infra/docker/docker-compose.yml,
# "context: ../.."), porque Nx/pnpm workspaces necesitan ver todo el
# árbol para resolver dependencias internas (core/, modules/, packages/).

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
# Prisma (motor de consultas nativo) requiere libssl real — Alpine no la trae
# por defecto; sin esto, Prisma detecta mal la versión de OpenSSL y carga el
# binario equivocado (confirmado: PrismaClientInitializationError real al
# probar la imagen sin este paquete).
RUN apk add --no-cache openssl
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

# -----------------------------------------------------------------------------
FROM base AS development
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 3000
# wget viene en busybox (base de Alpine), sin paquete extra que instalar.
# Apunta a /health/live (no /health/ready): HEALTHCHECK decide si Docker
# reinicia el contenedor, igual que el liveness probe de Kubernetes (ver
# core/health/health.controller.ts) — no debe fallar solo porque Postgres/
# Redis/RabbitMQ están momentáneamente caídos, eso es responsabilidad de
# /health/ready vía depends_on/readinessProbe, no de un reinicio del proceso.
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1
CMD ["pnpm", "nx", "serve", "api"]

# -----------------------------------------------------------------------------
# "build": únicamente gate de tipos (`tsc --noEmit`, ver apps/api/project.json
# y core/*/project.json) — no es el artefacto que corre en producción. Cada
# paquete `@gorazus/*` resuelve vía node_modules con "main"/"types" apuntando
# a su .ts fuente (convención fijada esta sesión para ts-node en desarrollo,
# ver core/database/package.json y análogos) — pnpm usa un node_modules
# estricto por paquete (nunca hoisted a la raíz), así que un `dist/apps/api`
# compilado NO puede resolver esos paquetes en runtime bajo `node` plano
# (confirmado: MODULE_NOT_FOUND real al probarlo). La etapa "production" de
# abajo corre el mismo mecanismo YA probado en desarrollo (`ts-node
# --transpile-only`) en vez de inventar una segunda forma de ejecutar la app
# — variables de entorno son las que realmente cambian entre ambientes.
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm nx build api --configuration=production

# -----------------------------------------------------------------------------
FROM base AS production
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 3000
USER node
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1
CMD ["node_modules/.bin/ts-node", "--transpile-only", "apps/api/src/main.ts"]
