# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Este proyecto está en desarrollo activo, pre-1.0 — no hay versiones publicadas todavía, se registra por fecha.

## [No liberado]

### Añadido

- **FASE 05 — Playwright real (`apps/web-e2e`) + testing de carga/estrés (`infra/k6`) + escaneo de
  seguridad en CI (2026-07-20).**
  - **`apps/web-e2e`** (nuevo, committeado — antes toda verificación en navegador era un script ad
    hoc descartable): `playwright.config.ts` + `login.spec.ts` (4 tests: redirect sin token, render
    del formulario, error de credenciales inválidas, login real → dashboard) + `usuarios.spec.ts`
    (2 tests: navegación por sidebar, alta de usuario real de punta a punta). **6/6 pasan contra el
    stack completo real** (`https://localhost`, HTTPS + nginx + api + Postgres con RLS forzado).
  - **`infra/k6`**: `smoke.js`/`load.js`/`stress.js` — ver "Corregido" abajo para los hallazgos
    reales de `load.js` (rate limiter) y el resultado de `stress.js` (200 VUs sin caídas). Detalle
    completo en `infra/k6/README.md`.
  - **`.github/workflows/security.yml`** (nuevo): `pnpm audit` (no bloqueante todavía, ver
    "Pendiente conocido") + CodeQL (SAST nativo de GitHub, sin servicio externo) en cada PR/push a
    `main` + corrida semanal.

- **FASE 05 — Kubernetes, monitoreo, HTTPS y backup automático (2026-07-20).**
  - **`infra/kubernetes/`** (nuevo): `base/` + `overlays/{staging,production}/` vía Kustomize (no
    Helm, ya decidido en `31-infraestructura-completa.md §2.3`) — `Deployment`/`Service`/`Ingress`/
    `ConfigMap`/`Secret`(plantilla)/`HorizontalPodAutoscaler` para `api`+`web`, TLS vía cert-manager,
    `/health/live`+`/ready` como probes reales. `stateful/` con los CRs de los operadores ya
    documentados (CloudNativePG para Postgres HA, Redis Operator/Spotahome para Sentinel, RabbitMQ
    Cluster Operator con quorum queues, MinIO Operator con erasure coding) — implementan la
    arquitectura objetivo ya fijada en `31-infraestructura-completa.md §11`, pero ese mismo
    documento pide un ADR formal antes de aplicarse a un cluster de producción real, todavía no
    escrito. **Verificado con `kubectl kustomize`** (renderiza sin error, namespace/imagen/replicas
    correctos por overlay) — no contra un cluster real (no hay uno disponible en este entorno), ver
    `infra/kubernetes/README.md` para el detalle honesto de qué está probado y qué no.
    `deploy-staging.yml`/`deploy-production.yml` actualizados con los pasos reales de
    `kubectl apply -k` (comentados hasta que exista el registry/cluster real).
  - **Stack de monitoreo real** (`infra/prometheus/`, `infra/grafana/`, `infra/loki/`,
    `infra/promtail/`, `infra/docker/docker-compose.monitoring.yml`, overlay opcional): Prometheus
    scrapeando `http_requests_total`/`http_request_duration_ms` (métricas ya emitidas por
    `core/observability/metrics.ts`, nada nuevo del lado de la app), 3 reglas de alerta reales
    (`ApiDown`, `ApiHighErrorRate`, `ApiHighLatencyP95`), Grafana con datasources Prometheus+Loki
    provisionados automáticamente + un dashboard real (`api-overview.json`: request rate, error
    rate, P50/P95/P99, logs), Promtail parseando el JSON estructurado que `core/logging` ya emite.
    **Verificado real**: los 4 contenedores arrancan, Prometheus carga y evalúa las 3 reglas
    (`"health":"ok"`), Grafana provisiona ambos datasources y el dashboard (confirmado vía su API).
    En Kubernetes, el mismo rol lo cumple `kube-prometheus-stack` + Loki (namespace `observability`,
    ya documentado en `31 §9`) — no este `docker-compose.monitoring.yml`.
  - **HTTPS/TLS real**: `infra/nginx/nginx.conf` reescrito — HTTP redirige a HTTPS (salvo
    `/nginx-health`), TLS 1.2/1.3 con certificado autofirmado de desarrollo
    (`infra/nginx/generate-dev-cert.sh`, nunca commiteado), 5 cabeceras de seguridad (HSTS,
    X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy). En Kubernetes,
    TLS lo termina cert-manager en el `Ingress` (ver arriba), no este archivo. Antes no existía
    ningún mecanismo de HTTPS, ni documentado ni implementado.
  - **Backup automático real** (`infra/postgres/backup/backup.sh`+`restore.sh`, servicio `backup`
    en `docker-compose.yml`): `pg_dump` programado (inmediato al arrancar + diario) con retención
    de 7 días, usando el rol `gorazus_backup` ya diseñado (`BYPASSRLS`+`pg_read_all_data`, ver
    `30_backup_restore.sql`). Fase 1 explícita — el mecanismo objetivo de producción real
    (`pgBackRest` + WAL archiving continuo + PITR, `docs/database/08-estrategia-respaldo.md §2`)
    es infraestructura mayor que no se improvisa sin esa instalación real, documentado como Fase 2.
    **Verificado real**: respaldo de 5.8MB generado contra la base real, `pg_restore --list`
    confirma un archivo válido con 13.452 entradas (los 21 schemas completos).

  **Dos bugs reales adicionales, encontrados recién al probar la cadena completa
  nginx→api→Postgres/Redis/RabbitMQ por primera vez de punta a punta esta sesión** (antes solo se
  había probado la imagen de `api` sola, nunca el `docker-compose.yml` completo):
  1. `apps/api` en el compose completo no podía conectar a Postgres/Redis/RabbitMQ
     (`ECONNREFUSED ::1:5672`/etc.) — el servicio `api` hereda `.env` entero vía `env_file:`, pero
     `.env` fija `DATABASE_URL`/`REDIS_URL`/`RABBITMQ_URL`/`MINIO_ENDPOINT` en `localhost` (pensado
     para `ts-node` corriendo en el host) — dentro del contenedor, `localhost` es el propio
     contenedor, no los otros servicios. `docker-api-1` llevaba **toda la sesión** con estado
     `Exited (1)`, nunca se había investigado por qué. Corregido con un bloque `environment:` en
     el servicio `api` de `docker-compose.yml` que sobreescribe esas 4 variables con los hostnames
     internos de Docker (`postgres`/`redis`/`rabbitmq`/`minio`/`ollama`) — `environment:` tiene
     precedencia sobre `env_file:`. Nueva variable `POSTGRES_APP_PASSWORD` en `.env`/`.env.example`.
  2. `infra/nginx/nginx.conf`: `proxy_pass http://api:3000/;` (con barra final) le recorta el
     prefijo `/api/` a cada request antes de reenviarlo — pero `apps/api` tiene
     `setGlobalPrefix('api')` y espera ese mismo prefijo de vuelta, así que todo pasaba a 404
     (`Cannot GET /v1/health/live`). Corregido quitando la barra final (`proxy_pass http://api:3000;`)
     — mismo fix aplicado en `infra/kubernetes/base/web-nginx-configmap.yaml`.
     **Verificado real de punta a punta después de ambos fixes**: `https://localhost/` sirve el
     frontend, `https://localhost/api/v1/health/live` → 200, y un login real
     (`POST /api/v1/auth/login`) a través de nginx+TLS+api+Postgres (con RLS genuinely enforced)
     devuelve 200 con un JWT real.

- **FASE 04 — Notification Center (núcleo mínimo) + canal WhatsApp** (`core/notifications`,
  nuevo paquete `core/*`): `NotificationCenterService.send()` como punto de entrada único
  (docs/architecture/32-core-platform/06-eventos-y-mensajeria.md §4), `WhatsAppGatewayAdapter`
  (WhatsApp Business Cloud API de Meta, real vía `fetch`, sin mockear) detrás de la interfaz
  genérica `NotificationChannelAdapter` (un adaptador por canal, §4.1), `WhatsAppCredentialsService`
  (credenciales por tenant en `core.integrations`/`integration_credentials`, cifradas con
  `packages/tooling/utils/encryption.ts` — AES-256-GCM ya construido, coincide con la interfaz
  `EncryptionUtils` de `10-utilidades-comunes.md §7`), aislamiento por tenant vía
  `withTenantScope` (mismo mecanismo que `BaseRepository`). Alcance deliberado de Fase 1
  (decisión del usuario, "núcleo mínimo ahora"): envío síncrono (sin `Background Jobs`),
  sin `Template Engine`/`Language Manager` (ninguno de los dos existe todavía en `core/` —
  `body` ya viene resuelto del llamador), sin reintento con backoff, solo destinatarios
  internos (`core.users`, el esquema físico no admite lead/cliente de CRM como
  `recipient_user_id`) — el teléfono destino se resuelve desde
  `notification_preferences.metadata.whatsappPhoneNumber` (JSONB genérico ya existente,
  ningún schema modela teléfono en `core.users`). Script operativo
  `core/notifications/scripts/seed-whatsapp-channel.ts` (da de alta el canal en
  `core.notification_channels`, no hay UI de administración todavía). Nueva variable de
  entorno `NOTIFICATIONS_ENCRYPTION_KEY` (AES-256-GCM, fail-fast si falta o no es hex de 32
  bytes) + `WHATSAPP_GRAPH_API_VERSION`. 5 tests unitarios (fake Prisma client, mismo patrón
  que `base.repository.spec.ts`). Los 11 puntos restantes de integraciones de FASE 04
  (DGII/SUNAT/SAT, Stripe/PayPal, Telegram, Microsoft 365/Google Workspace, OCR) y los
  asistentes de IA sobre Ollama quedan documentados como pendientes de confirmación de
  negocio, sin diseño especulativo — ver `docs/architecture/42-integraciones-plan-fase-8.md`.
- **FASE 04 — Ollama como infraestructura `core/*`** (`core/ollama`, nuevo paquete): `OllamaService`
  como wrapper delgado sobre el cliente oficial `ollama` (`generate`/`chat`/`embed`/`listModels`,
  sin streaming en Fase 1), mismo criterio que `core/storage`/`core/messaging` sobre MinIO/RabbitMQ
  — infraestructura técnica reutilizable, sin prompts ni lógica de ningún asistente específico
  (decisión de alcance confirmada: "Ollama de infraestructura ahora, resto después"). Servicio
  `ollama` agregado a `infra/docker/docker-compose.yml` (imagen oficial `ollama/ollama`, volumen
  para modelos descargados, sin `depends_on` desde `api` porque nadie lo consume todavía) +
  overlay `dev` (puerto 11434 expuesto) + overlay `prod` (`restart: unless-stopped`). Nuevas
  variables de entorno `OLLAMA_BASE_URL` (con default `http://localhost:11434`) y
  `OLLAMA_DEFAULT_MODEL` (sin default en código a propósito — qué modelo usar es decisión de cada
  futuro asistente). 5 tests unitarios (fake del cliente `Ollama`).
- **Bootstrap del monorepo**: Nx + pnpm workspaces, `tsconfig.base.json`, `eslint.config.mjs` (con `@nx/enforce-module-boundaries`), `.prettierrc`, `.editorconfig`, `.gitattributes`, CI/CD (4 workflows de GitHub Actions), `CODEOWNERS`.
- **Infraestructura Docker**: `docker-compose.yml` (Postgres, Redis, RabbitMQ, MinIO, nginx) + overlays `dev`/`prod`, pgAdmin y MailHog en dev, tuning de Redis/Postgres.
- **Foundation Platform** (`core/*`): `config` (Zod fail-fast), `logging` (JSON estructurado + correlación), `http` (exception filter, interceptors, middlewares, rate limit), `health` (liveness/readiness desacoplado), `kernel` (bootstrap de 6 fases), `observability` (OpenTelemetry tracing + Prometheus metrics), `cache` (Redis), `storage` (MinIO), `messaging` (Event Bus RabbitMQ), `scheduler` (cron).
- **Persistencia** (`core/database`): 21 clientes Prisma independientes (uno por schema de Postgres), scripts de split/generación (`split-schema-by-module.js`, `generate-all.js`, `copy-generated-to-dist.js`).
- **Utilidades comunes** (`packages/tooling/utils`): UUID, Clock, Hash (argon2id), Encryption (AES-256-GCM).
- `PROJECT_STRUCTURE.md`, `ARCHITECTURE_RULES.md`, README.md por carpeta principal.
- **Documentación de producto** (`docs/product/`, EPIC 02): 10 documentos — visión/
  principios, personas, journeys, workflows de negocio, arquitectura de información,
  navegación, catálogo de 336 pantallas organizado por 6 arquetipos reutilizables,
  flujos de usuario transversales, wireframes, atajos de teclado. Sin código.
- **Arquitectura de frontend** (`docs/frontend/`, EPIC 03): 10 documentos + README —
  formaliza Feature-First, expande `docs/architecture/03,29,44,45` a detalle de
  implementación (State Management, Routing, Folder Structure, Features, UI
  Guidelines, Performance, Error Handling, API Layer, Testing). Decisiones nuevas:
  `react-i18next`, error boundaries de 3 niveles + Sentry, MSW para tests, WCAG 2.1 AA.
- **Estándares de implementación** (`docs/standards/`, EPIC 04): 13 documentos +
  README — `PROJECT_STRUCTURE`, `FILE_STRUCTURE`, `NAMING_CONVENTIONS`,
  `CODING_STANDARDS`, `ARCHITECTURE_RULES`, `MODULE_GUIDELINES`,
  `COMPONENT_GUIDELINES`, `API_GUIDELINES`, `DATABASE_GUIDELINES`,
  `SECURITY_GUIDELINES`, `TESTING_GUIDELINES`, `DOCUMENTATION_GUIDELINES`,
  `CODE_REVIEW` (con checklist obligatorio de PR). Cierra un gap real nunca
  documentado: mapeo módulo español (`modules/ventas/`) ↔ schema Postgres inglés
  (`sales`), ver `NAMING_CONVENTIONS.md §5`.
- **Entorno de visualización de base de datos** (`tools/database/`, EPIC — Database
  Visualization Environment): DBeaver Community Edition portable (conexión
  `GORAZUS_DEV` preconfigurada) + SchemaSpy + Graphviz, 100% en `D:\`. Diagrama
  maestro (relaciones entre los 21 schemas) + 21 diagramas ERD por schema real
  (PNG/SVG/PDF, `docs/database/erd/`). `docs/database/DATABASE_STRUCTURE.md`,
  `DATABASE_DEPENDENCIES.md`, `DATABASE_VISUALIZATION.md`,
  `DATABASE_DICTIONARY.md` + `dictionary/` (21 archivos, diccionario técnico
  columna por columna generado desde `information_schema`), `DATABASE_HEALTH_REPORT.md`.
  Primera verificación completa de la base real desde su creación — ver "Pendiente
  conocido" abajo para los 3 gaps reales que encontró.
- **Optimización de la base de datos** (`docs/database/`, PHASE 01 — Database
  Enterprise, 2026-07-18): 8 documentos nuevos — `DATABASE_ARCHITECTURE.md`,
  `TABLE_CATALOG.md`, `INDEX_CATALOG.md`, `FOREIGN_KEYS.md`,
  `MODULE_RELATIONSHIPS.md`, `DATA_FLOW.md`, `PERFORMANCE.md`, `SECURITY.md`,
  `BACKUP.md` — más actualización de `DATABASE_STRUCTURE.md`,
  `DATABASE_HEALTH_REPORT.md`, `DATABASE_DEPENDENCIES.md` (corrige una afirmación
  propia incorrecta: "0 FK cross-schema, verificado" nunca se había verificado
  realmente) y `dictionary/05-products.md`. `infra/docker/postgres/Dockerfile`
  nuevo (Postgres 17 + `postgresql-17-partman`, ya que `postgres:17-alpine` no la
  incluía) — `docker-compose.yml` actualizado para construirla.

- **Frontend — composition root funcional** (`apps/web`, `ui-kit/`, `modules/auth`,
  `modules/dashboard`): primera app React arrancable de punta a punta, siguiendo
  `docs/frontend/` al pie de la letra. `ui-kit/` — primitives shadcn/ui (Button, Input,
  Label, Card, Dialog, Toast, Tooltip), `Form*` (wrapper de React Hook Form + Zod),
  `DataTable` genérico sobre TanStack Table, `AppShell`/`Sidebar`/`Topbar`/`Footer`/
  `Breadcrumb`/`ThemeToggle`, páginas terminales `NotFoundPage`/`ForbiddenPage`,
  `GlobalLoader` + `RouteLoadingFallback`, cliente HTTP (`fetch` nativo, refresh de
  token con deduplicación, `ApiClientError`), store Zustand único (`authSlice`+`uiSlice`,
  persistido selectivamente) y el puente de invalidación de TanStack Query
  (`query/invalidation-bridge.ts`) que le permite a `switchCompanyContext` invalidar
  cache sin que `ui-kit` dependa de la instancia concreta de `QueryClient` de `apps/web`
  — mismo patrón de indirección que `http/session.ts` (`onSessionExpired`). El store vive
  en `ui-kit/` y no en `apps/web` a propósito: es la única ubicación de las dos permitidas
  por `FOLDER_STRUCTURE.md §2.1` que también pueden importar `modules/*/frontend`, y
  `modules/auth/frontend` necesita escribir la sesión al loguearse. `apps/web/src/app/`
  ensambla `router.tsx` (React Router `createBrowserRouter`, `RequireAuth`, layout
  protegido, 404), `providers.tsx` (árbol `QueryClientProvider > ThemeProvider >
ErrorBoundary > RouterProvider`), y `app-shell/module-registry.ts` con las 25 features
  del sitemap (`docs/product/05_INFORMATION_ARCHITECTURE.md §3`) agrupadas para el
  sidebar. Primeros dos módulos de negocio con `frontend/` real: `auth` (`/login`,
  `useLogin`, formulario con React Hook Form + Zod) y `dashboard` (placeholder de
  composición, sin datos propios todavía). Verificado con `tsc --noEmit` limpio en
  `apps/web` y `ui-kit`, `vite build` de producción, y un smoke test real en Chromium
  headless (Playwright): `/` redirige a `/login`, el formulario renderiza, y un submit
  fallido (sin backend de `auth` corriendo) se muestra como error inline, sin crash.

- **Backend — primer módulo de negocio real: `auth` (Fase 1)** (`modules/auth/backend`): login
  (email + contraseña, sin 2FA todavía), refresh con rotación, logout — Clean Architecture completa
  (`entities/Usuario,Sesion` con invariantes propios y tests, `repositories/` puerto+adaptador Prisma
  sobre `core.users`/`core.sessions`/`core.tenants` vía `PRISMA_CORE`, `services/` casos de uso,
  `validators/` Zod compartido con el frontend, `controllers/AuthController`). Primer consumidor real
  de `BaseRepository`/`withTenantScope` (Paso 3) — ver bugs corregidos abajo, todos preexistentes,
  ninguno nunca antes ejercitado contra un cliente Prisma real. Resuelve el mismo gap de tenant que
  bloqueaba el login: `core.users.email` es único **por tenant** (`uq_core_users_tenant_email`), así
  que el login primero resuelve el tenant por `slug` — dos políticas RLS nuevas y puntuales
  (`tenant_lookup_by_slug`, `session_lookup_by_refresh_hash` en `docs/database/sql/30_backup_restore.sql`)
  permiten esos dos únicos lookups sin `app.current_tenant_id` conocido. Verificado real, no simulado:
  `POST /auth/login` con Postgres/Redis/RabbitMQ corriendo en Docker, contraseña con hash argon2id
  real, JWT firmado real, cookie `httpOnly` de refresh real, rotación de refresh real, rechazo 401
  con contraseña incorrecta.
- **Infraestructura de arranque** (`core/kernel`): `cookie-parser` (refresh token vía cookie httpOnly)
  y CORS con `credentials: true` + origen exacto (`CORS_ORIGIN`, nueva variable de entorno,
  `core/config/env.schema.ts`) — antes `enableCors()` sin opciones no soportaba cookies cross-origin.
- **Backend — `seguridad` (Fase 1)** (`modules/seguridad/backend`): RBAC real — roles, catálogo de
  permisos `<modulo>.<accion>`, asignación rol↔permiso y usuario↔rol, administración de usuarios
  (alta con contraseña temporal, baja lógica) — sin ACL fino/ABAC/2FA/OAuth2/bitácora de incidentes
  (Fase 2, ya diseñados en `docs/architecture/15-modulo-security.md §4,6-8`, sin tabla nueva
  creada para ellos). Implementa `PermissionsResolverService`, reemplazando a
  `NoopPermissionsResolver` (que denegaba todo por diseño) — primer endpoint con
  `@RequirePermission(...)` que efectivamente autoriza en vez de siempre rechazar. Incluye un script
  de bootstrap idempotente (`scripts/seed-rbac.ts`) que resuelve el problema de arranque "hace falta
  un permiso para administrar permisos, pero ninguno existe todavía": siembra el catálogo, un rol
  "Administrador" de fábrica con todos los permisos, y lo asigna a un usuario por email. Verificado
  end-to-end contra la base real: `GET/POST /seguridad/roles` devuelve 401 sin token, 200 con un
  token de un usuario con el permiso — el `PermissionsGuard` global ya autoriza de verdad.
- **FASE 03 Frontend Enterprise — Design System completo + primer módulo de negocio con UI real**:
  `ui-kit/components/primitives/` suma `Tabs`, `Drawer` (Radix Dialog reposicionado, patrón shadcn
  "Sheet"), `Popover`, `DropdownMenu`, `DatePicker` (`react-day-picker`), `MoneyInput`,
  `BarcodeScannerInput` (lectoras USB/Bluetooth "keyboard wedge" — sin cámara, documentado como
  fuera de alcance), `Wizard` (formulario multi-paso), `Badge`. `ui-kit/components/charts/` nuevo
  (Recharts, decisión ya cerrada en `docs/architecture/29 §8.1`): `LineChart`, `BarChart`,
  `PieChart`, `AreaChart`, `KpiNumber` — paleta categórica de 8 colores validada con el skill de
  dataviz (orden fijo, nunca ciclado) como variables CSS en `apps/web/src/styles/globals.css`.
  `ui-kit/utils/format/{date,number,money}.ts` (envuelven `Intl.*`, gap ya señalado en la auditoría
  de esta misma fecha). `NotificationCenter` (campana de notificaciones del Topbar, distinta del
  `Toaster` efímero). **Bug real encontrado y corregido durante la verificación en navegador**:
  `FormLabel`/`FormControl` (`ui-kit/components/form/form-field.tsx`) nunca conectaban `htmlFor`/
  `id`/`aria-describedby` — ningún lector de pantalla podía asociar una etiqueta con su input desde
  que se construyó este componente (sesión de `auth`). Corregido con `React.useId()` +
  `@radix-ui/react-slot` (mismo patrón shadcn de referencia), retroactivo a todo formulario
  existente (login incluido).
  Primer módulo de negocio con **frontend real de punta a punta** además de `auth`:
  `modules/seguridad/frontend` — listado de usuarios (datos reales), alta con contraseña temporal,
  baja lógica, wireados a `/seguridad/usuarios`. Los ~20 módulos sin backend (`ventas`, `pos`,
  `crm`, `compras`, `inventario`, `proveedores`, `clientes`, etc.) reciben un placeholder honesto
  generado automáticamente desde `MODULE_REGISTRY` (`ComingSoonPage`) — decisión explícita del
  usuario de no simular datos. Verificado real en navegador (Playwright): login → Usuarios con
  datos reales → alta de usuario real vía UI → placeholder de Ventas — 0 errores de consola.
- **FASE 02 Backend Enterprise — infraestructura de calidad, aplicada a `auth`/`seguridad`**:
  Swagger/OpenAPI real (`@ApiTags`/`@ApiOperation`/`@ApiResponse`/`@ApiBearerAuth` en los 3
  controllers existentes, DTOs de respuesta tipados para `auth`), export automático del spec
  OpenAPI a `docs/api/openapi.json` en cada arranque no-productivo (`core/kernel/bootstrap.ts`) —
  Postman lo importa directo, sin mantener una colección aparte a mano. Primeros tests de
  **integración reales** del proyecto (antes solo había unitarios): `auth.controller.e2e-spec.ts`
  (7 casos — login, refresh con rotación de cookie, 401/400 en cada rama de error) y
  `roles.controller.e2e-spec.ts` (5 casos, incluyendo que `PermissionsGuard` deniega con 403 a un
  usuario autenticado sin el permiso) arrancan la app real vía `@nestjs/testing` +`supertest` contra
  el Postgres/Redis/RabbitMQ de Docker — no contra una base de test aislada todavía (pendiente,
  ver "Pendiente conocido"). 30 tests totales pasando (17 `auth-backend` + 13 `seguridad-backend`).
- **Auditoría técnica completa** (`docs/00-auditoria-2026-07-20.md`) — 13 áreas, verificación en
  vivo (no solo lectura de documentos): confirma que el gap de RLS-vs-ownership es sistémico en las
  503 tablas (no solo `core.tenants`), que `nx build`/`nx serve` fallan por un error de `rootDir` de
  TypeScript entre paquetes (sin corregir — se corre vía `ts-node` mientras tanto), y que
  `core/realtime` es un paquete de Foundation Platform sin empezar (no rastreado antes). Corregido
  en el mismo pase: `.dockerignore` (raíz del monorepo) — no existía ninguno, causa confirmada de
  por qué el build de las imágenes `api`/`web` transfería 8+ GB de contexto.

### Corregido

- **FASE 05 — healthcheck de nginx marcaba "unhealthy" pese a responder bien por HTTPS externo
  (2026-07-20).** `infra/nginx/nginx.conf` solo tenía `listen 80;`/`listen 443 ssl;` (IPv4) — el
  propio healthcheck de Docker (`wget http://localhost/...`, ejecutado DENTRO del contenedor)
  resuelve `localhost` a `::1` primero y la conexión se rechazaba (nginx no escuchaba en IPv6).
  Curl externo seguía funcionando porque el port-mapping de Docker sí resuelve bien — por eso
  nadie lo había notado hasta revisar `docker ps` explícitamente. Corregido agregando
  `listen [::]:80;`/`listen [::]:443 ssl;`. En un despliegue real de Kubernetes esto habría
  causado que el liveness probe reiniciara el pod en bucle indefinidamente.
- **FASE 05 — 4 bugs reales de frontend, encontrados recién al escribir el primer Playwright real
  contra el stack completo (2026-07-20)** — ninguno se había detectado antes porque la única
  verificación en navegador previa (FASE 03) usaba `pnpm nx serve web` con `apps/web/.env`
  apuntando directo a `localhost:3000`, nunca el flujo real detrás de nginx/HTTPS:
  1. **`apps/web/.env` fijaba `VITE_API_URL=http://localhost:3000/api/v1`** — ese valor queda
     horneado en el build de producción (Vite lo inlinea en build time) y hacía que el navegador
     intentara conectar directo a un puerto que ni siquiera está publicado en el compose base
     (solo en el overlay `dev`), en vez de la ruta relativa `/api/v1` que el código YA tenía como
     default correcto (`ui-kit/http/client.ts`, `configureApiClient` en `apps/web/src/main.tsx`).
     `apps/web/.env` (gitignored, archivo local) eliminado; agregado `server.proxy` en
     `apps/web/vite.config.ts` para que `pnpm nx serve web` suelto siga funcionando (mismo `/api`
     relativo, proxy target `localhost:3000` en dev en vez de nginx en Docker/K8s).
  2. **Un login con contraseña incorrecta mostraba "La sesión expiró" en vez del error real.**
     `ui-kit/http/client.ts`: el interceptor global de 401 (pensado para refrescar el token en un
     request YA autenticado que expiró) también capturaba el 401 de `POST /auth/login` en sí
     mismo, intentaba un refresh que nunca podía funcionar (no hay sesión previa) y pisaba el
     mensaje real del backend ("El usuario o la contraseña son incorrectos") con el genérico de
     sesión expirada. Corregido excluyendo también `/auth/login` de ese interceptor (mismo
     criterio que ya excluía `/auth/refresh`).
  3. **El refresh automático de token estaba silenciosamente roto.** La misma función leía
     `body.accessToken` de la respuesta de `POST /auth/refresh`, pero el endpoint real devuelve
     `{ data: { accessToken } }` (envuelto, ver `auth.controller.ts`) — `setAccessToken(undefined)`
     nunca lanzaba error, solo dejaba al usuario sin token válido en silencio. Nunca se había
     ejercitado este camino con un browser real antes de esta sesión. Corregido leyendo
     `body.data.accessToken`.
  4. **Cualquier recarga completa de página perdía la sesión, aunque la cookie httpOnly de refresh
     siguiera siendo válida.** El access token vive solo en memoria a propósito (nunca
     `localStorage`, por seguridad XSS — ver el comentario ya existente en `token-store.ts`, que
     literalmente documentaba la intención de un `initSession()` que "cada app consumidora llama
     al montar" — nunca se había escrito ni conectado). `RequireAuth`
     (`apps/web/src/app/require-auth.tsx`) decidía si redirigir a `/login` de forma síncrona, sin
     intentar restaurar la sesión primero — confirmado con Playwright real: navegar directo a una
     ruta protegida después de loguearse (`page.goto`, equivalente a un F5 o abrir un link
     guardado) volvía a `/login`. Corregido: nueva función `initSession()` en
     `ui-kit/http/client.ts` (intenta `/auth/refresh` una vez, sin disparar la notificación de
     "sesión expirada" — fallar acá es un estado normal para un visitante nuevo) + `RequireAuth`
     ahora la llama al montar y muestra un loader breve mientras se resuelve, antes de decidir si
     redirige.
     **Verificado real:** los 6 tests de `apps/web-e2e` (login inválido con el mensaje real, login
     válido → dashboard, navegación por sidebar, alta de usuario completa) pasan contra el stack
     completo (`https://localhost`).

- **FASE 05 — RLS: `gorazus_app` ya no es superusuario, RLS realmente enforced (2026-07-20).**
  Hallazgo crítico ya diagnosticado en `docs/database/SECURITY.md §2` (colisión entre el
  `POSTGRES_USER` de bootstrap de Docker y el rol de aplicación `gorazus_app`) — confirmado en
  runtime real que Postgres **rechaza** `ALTER ROLE gorazus_app NOSUPERUSER` in-place ("The
  bootstrap superuser must have the SUPERUSER attribute") — no hay forma de arreglarlo sin
  recrear el volumen. Ejecutado con confirmación explícita del usuario (acción destructiva sobre
  la base de datos de desarrollo):
  1. Renombrado el bootstrap de Docker a `gorazus_superuser` (`POSTGRES_USER` en `.env`/
     `.env.example`/`infra/docker/docker-compose.yml`) para que nunca vuelva a colisionar con
     `gorazus_app` en una instalación limpia futura.
  2. Volumen `postgres_data` recreado desde cero y los 34 scripts de `docs/database/sql/`
     reaplicados en orden — **primera vez que se hace un bootstrap realmente limpio de la base**,
     lo cual encontró 3 bugs reales adicionales, nunca detectados porque la base nunca se había
     reconstruido desde cero antes:
     - `29_partitioning.sql`: `CREATE EXTENSION pg_partman` sin `SCHEMA partman` cae en `public`
       — toda llamada `partman.create_parent(...)` fallaba con "schema partman does not exist".
       Corregido en el archivo (bug de sintaxis que nunca pudo haber funcionado, no drift de un
       entorno ya aplicado — no es reescribir historia).
     - `22_seed_data.sql`/`24_views.sql`/`28_materialized_views.sql`/`29_partitioning.sql` abortan
       a mitad de archivo (violación NOT NULL / columna ambigua / partición de `core.audit_logs`
       inexistente para el trigger de auditoría) — cada uno de estos ya tenía su corrección
       correcta escrita en `32_bugfixes.sql`/`33_partition_provisioning_completion.sql`
       (archivos append-only de sesiones anteriores), pero nunca se habían aplicado en un
       bootstrap real de punta a punta. Reejecutados en el orden correcto (colas de cada archivo
       completadas manualmente donde el abort cortó statements válidos posteriores).
  3. `docs/database/sql/34_rls_hardening.sql` (nuevo) aplicado con éxito esta vez:
     `ALTER ROLE gorazus_app NOSUPERUSER NOBYPASSRLS` + `FORCE ROW LEVEL SECURITY` en las ~500
     tablas reales. Verificado en runtime: `rolsuper=false, rolbypassrls=false` para `gorazus_app`;
     una consulta sin `set_config` a `core.users` ahora devuelve solo la fila del tenant
     sentinela (1 fila), no todas — antes, como superusuario, veía todo sin restricción.
  4. **Efecto colateral real, ya predicho por el propio diagnóstico:** con RLS genuinely enforced,
     dos scripts que consultaban `core.users` sin fijar contexto de tenant dejaron de encontrar
     filas de tenants reales (RLS filtra en silencio, no es un error de permisos) —
     `modules/seguridad/backend/scripts/seed-rbac.ts` (ahora requiere `<slug-tenant>` como primer
     argumento, resuelve el tenant vía la policy `tenant_lookup_by_slug` ya existente antes de
     `set_config`) y `modules/seguridad/backend/controllers/roles.controller.e2e-spec.ts` (mismo
     patrón). Verificado real: los 30 tests (`auth-backend` 17 + `seguridad-backend` 13) pasan de
     nuevo, incluido un login real de punta a punta contra la base con RLS genuinely forzado.

- **FASE 05 — Enterprise Release: `nx build`/imagen Docker de producción, completamente rotos,
  ahora reales y verificados de punta a punta (2026-07-20).** Cadena de 7 bugs reales, cada uno
  descubierto porque, por primera vez esta sesión, alguien realmente construyó y **corrió** la
  imagen Docker de producción en vez de solo tipar o correr vía `ts-node` local — el mismo patrón
  que ya se repitió varias veces antes (Paso 3, Auth, FormField): "recién se prueba de verdad, recién
  aparecen los bugs reales".
  1. **`nx build` (TS6059, rootDir) — root-caused de verdad.** El ejecutor `@nx/js:tsc` fuerza el
     `rootDir` de cada proyecto a su propia carpeta, ignorando cualquier `rootDir` explícito en su
     `tsconfig.json` — confirmado corriendo `tsc -p` en crudo (mismo tsconfig) con éxito mientras
     `nx build` fallaba. Cualquier importación cruzada de paquete (`@gorazus/contracts`,
     `@gorazus/core-*`) queda "fuera" de ese rootDir. Un intento con TS Project References
     (`composite`+`references`) tampoco funcionó bajo `@nx/js:tsc` (produce `TS6307` en vez de
     resolverlo — limitación conocida de este ejecutor, no compatible con project references).
     **Fix real:** `rootDir` apuntando a la raíz del repo en cada `tsconfig.json` con imports
     cruzados (`core/database`, `core/http`, `core/kernel`, `core/health`, `core/messaging`,
     `core/notifications`, `modules/auth/backend`, `modules/seguridad/backend`, `apps/api`) +
     cambiar sus targets `build` de `@nx/js:tsc` a `nx:run-commands` invocando `tsc -p` directo
     (bypass del ejecutor roto). `packages/contracts` no tenía `project.json` — no era un proyecto
     Nx real, nunca entraba al grafo de dependencias; se le agregó uno.
  2. **`nx build web` — `@nx/vite:build` nunca estuvo instalado** (`@nx/vite` faltaba en
     `devDependencies`) y, una vez instalado, su wrapper fallaba con `TS2688` (no encuentra
     `vite/client`) aunque `vite build` corrido directo compila perfecto. Cambiado el target
     `build` de `apps/web` a `nx:run-commands` invocando `vite build` directo.
  3. **La imagen Docker de producción no podía ejecutar el `dist/apps/api` compilado.** pnpm usa
     `node_modules` estricto por paquete (nunca hoisted a la raíz) — confirmado que
     `node_modules/@gorazus/*` NO existe en la raíz del repo, solo dentro de `apps/api/node_modules/`
     y análogos. El `dist/apps/api` compilado, al vivir en un árbol separado, nunca podía resolver
     esos paquetes bajo `node` plano (`MODULE_NOT_FOUND` real). Sumado a que cada paquete
     `@gorazus/*` apunta `"main"` a su `.ts` fuente (convención ya fijada para `ts-node` en
     desarrollo) — ni siquiera copiando `node_modules` a mano se resolvía. **Decisión:** la etapa
     `production` del Dockerfile corre con el mismo mecanismo ya probado en desarrollo
     (`ts-node --transpile-only apps/api/src/main.ts`) en vez de inventar una segunda forma de
     ejecutar la app — `nx build` queda como gate de tipos real dentro de la imagen (`tsc --noEmit`),
     no como el artefacto que se ejecuta. Costo aceptado: imagen más grande (no se usa `--prod` en
     el install final, ver punto 4).
  4. `NODE_ENV=production` antes de `pnpm install` salta `devDependencies` — pero `ts-node`/
     `typescript` (necesarios en runtime por la decisión del punto 3) vivían ahí. Movidos a
     `dependencies` reales.
  5. El script `prepare: "husky"` fallaba (`husky: not found`) apenas se saltean devDependencies —
     cualquier `pnpm install` en modo producción rompía. Cambiado a `"husky || true"`.
  6. **El cliente Prisma generado esta sesión (Windows) no tenía motor para Linux** — la imagen
     fallaba con `PrismaClientInitializationError: ... runtime "linux-musl"`. Se agregó
     `binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]` a los 21
     `schema.prisma` (+ al template maestro) y se regeneraron los 21 clientes.
  7. Con el motor Linux presente, Alpine (`node:20-alpine`) no tiene `libssl` instalada — Prisma
     detectaba mal la versión de OpenSSL y cargaba el binario equivocado. Agregado
     `RUN apk add --no-cache openssl` a la imagen base.
  8. **Bug adicional, encontrado recién al probar la imagen contra Postgres/Redis/RabbitMQ reales:**
     `/health/live` y `/health/ready` devolvían 401 — el `JwtAuthGuard` global
     (`core/http/http.module.ts`) cubría esas rutas por defecto, sin `@Public()`. El kubelet que
     hace el liveness/readiness probe no tiene (ni puede tener) un JWT — sin este fix, ningún pod
     de Kubernetes pasaría nunca el probe. Corregido en `core/health/health.controller.ts`.
     **Verificación real, no solo tipos:** imagen `gorazus/api:test` construida y corrida como
     contenedor real contra Postgres/Redis/RabbitMQ ya vivos (red `docker_gorazus`) — arrancó,
     inicializó los 20 módulos, mapeó todas las rutas, y `GET /api/v1/health/live` /
     `/health/ready` devolvieron `200 {"status":"ok"}`. Los 30 tests existentes (`auth-backend` +
     `seguridad-backend`) siguen pasando después de todos estos cambios. `nx build web` produce un
     `dist/apps/web` real (mismo warning de bundle >500kB ya conocido, sin cambios).

- **`core/database` — 4 bugs preexistentes, ninguno detectado hasta este primer repositorio
  concreto real (Paso 3):**
  1. `BaseRepository`/`base.repository.spec.ts` usaban `deletedAt` (camelCase) para el filtro de
     borrado lógico; todo cliente Prisma generado real usa `deleted_at` (snake_case, sin `@map` en
     ningún `schema.prisma`) — habría sido un error de compilación en cualquier repositorio real.
  2. El constraint genérico `TClient extends { $transaction: <R>(fn...) => Promise<R> }` de
     `BaseRepository`/`withTenantScope` no es asignable de forma confiable contra el `$transaction`
     real de un `PrismaClient` (sobrecargado: forma array-de-promesas + forma callback) — TypeScript
     no compara bien funciones sobrecargadas contra un constraint de firma única. Se relajó a
     `{ $transaction: unknown }` con cast interno.
  3. Ese mismo cast, en un primer intento, extrajo `$transaction` como referencia suelta
     (`const t = client.$transaction`), perdiendo el `this` interno del cliente al invocarlo — todas
     las operaciones fallaban en runtime (`Cannot read properties of undefined`). Corregido
     re-tipando el objeto completo en vez de extraer el método.
  4. `package.json` de `core-database` apuntaba `main`/`types` a `./src/index.js` (compilado) —
     único paquete del monorepo que no seguía la convención ya establecida en los otros 11 paquetes
     (`main`/`types` → `.ts` fuente directa, pensada para correr sin paso de build previo). Alineado
     al mismo patrón.
- **Testing Framework — gap sistémico en los 11 paquetes `core/*`:** todos apuntaban `ts-jest` a
  `tsconfig.json`, que excluye `**/*.spec.ts` y no incluye tipos de `jest` — ningún archivo de test
  que existiera podía ejecutarse realmente (`Cannot find name 'it'/'expect'`), incluyendo
  `base.repository.spec.ts`, que nunca corrió hasta ahora. Es el mecanismo concreto detrás de "Sin
  tests unitarios reales todavía" (ver "Pendiente conocido"). Corregido con un `tsconfig.spec.json`
  por paquete (`types: ["node","jest"]`, sin exclude) y su `jest.config.ts` apuntando ahí — los 11
  paquetes existentes más los 2 nuevos de `modules/auth/backend`.
- `core/http/guards/jwt-auth.guard.ts`: faltaba `override` en `canActivate` — `apps/api` nunca había
  compilado realmente contra `noImplicitOverride` hasta este `tsc` (primera vez que se compiló
  `apps/api` completo con sus módulos de negocio reales).

- 27 tablas particionadas del SQL oficial con PK/UNIQUE sin la columna de partición (violaba una restricción real de PostgreSQL) — corregido con autorización explícita, sin cambiar el modelo de datos, solo la forma de las constraints.
- 28 foreign keys que quedaron rotas como efecto de la corrección anterior — resueltas quitando el `REFERENCES` (mismo patrón "ID suelto" que el proyecto ya usa entre schemas de módulos distintos).
- Bloqueo de escala de `prisma generate` (cliente monolítico de 500 modelos colgaba indefinidamente) — resuelto con 21 clientes por schema.
- Regla de fronteras de Nx incompleta (`type:core` no se permitía depender de otro `type:core`).
- Varios desalineamientos de versión entre paquetes relacionados de una misma librería (OpenTelemetry `sdk-metrics`/`exporter-prometheus`, `@nestjs/schedule`/`cron`) — cada uno detectado corriendo el build real, no solo leyendo código.
- Dependencias declaradas sin uso (`@gorazus/core-config` en 4 paquetes que en realidad importan `ConfigService` directo de `@nestjs/config`).
- **(PHASE 01, 2026-07-18)** Los 3 gaps de abajo, resueltos sin editar ningún archivo SQL existente (`docs/database/sql/31_missing_fk_indexes.sql`, `32_bugfixes.sql`, `33_partition_provisioning_completion.sql`):
  - Particionamiento: causa raíz de 3 capas (imagen sin `pg_partman`, extensión instalada en schema equivocado, 6 de 27 tablas nunca incluidas en `29_partitioning.sql`) — las 3 corregidas, 0 de 27 tablas sin particiones reales (antes: 27 de 27).
  - Vista `accounting.v_treasury_position` — recreada con columnas calificadas.
  - Seed de `products.product_attributes` — `company_id` ahora nullable (alineado al patrón universal ya documentado) + seed completado.
- 575 índices B-tree agregados en columnas FK de negocio sin índice de soporte (`31_missing_fk_indexes.sql`) — ver `docs/database/INDEX_CATALOG.md §3`.

### Pendiente conocido

- `dist/*/package.json` de los paquetes `core/*` conserva `"main": "./index.ts"` en vez de `.js` — warning cosmético, Node lo resuelve igual por fallback, no bloqueante.
- ~~Puerto de métricas (9464) no expuesto en `docker-compose.dev.yml`~~ — **resuelto FASE 05**.
- Sin tests unitarios reales todavía (Fase 6 del plan de Foundation Platform, Testing Framework).
- 🟠 **(Nuevo, FASE 05, 2026-07-20)** `pnpm audit` (ahora corriendo de verdad en
  `.github/workflows/security.yml`, no bloqueante todavía — `|| true`) encuentra **34
  vulnerabilidades reales: 1 crítica, 15 altas, 18 moderadas**, todas en dependencias transitivas
  de tooling/observabilidad (no runtime de negocio directo): Vitest UI server (crítica, solo
  explotable si alguien expone `vitest --ui`, nada en el proyecto lo hace), ReDoS en
  minimatch/picomatch (glob interno de Nx/build tooling), Multer (usado por
  `@nestjs/platform-express`, sin endpoint de upload real todavía), `@opentelemetry/exporter-prometheus`
  (crash por HTTP malformado — **relevante**, es el mismo exporter que expone `/metrics` desde
  FASE 05), js-yaml (usado por `@nestjs/swagger`). No se parchearon acá — la mayoría requiere saltos
  de versión grandes (p. ej. `@opentelemetry/exporter-prometheus` 0.55.0 → 0.220.0, ~165 versiones)
  que arriesgan romper funcionalidad recién verificada esta sesión sin tiempo de regresión
  dedicado. Pendiente: pase de remediación dedicado, empezando por el exporter de Prometheus
  (mayor superficie real de exposición, corre en producción).
- 🟡 **(Nuevo, FASE 05, 2026-07-20)** Testing de carga (`infra/k6/load.js`) encontró que el rate
  limiter global (`core/http/http.module.ts`, 100 requests/60s **por IP**, sin diferenciar por
  usuario autenticado ni por endpoint) devuelve `429` masivamente ante tráfico sostenido desde un
  mismo origen — comportamiento correcto y esperado, pero cualquier grupo real de usuarios detrás
  de un NAT/proxy compartido lo alcanzaría igual. No corregido (cambiar la política de rate
  limiting es una decisión de producto/seguridad, no un ajuste unilateral). Ver `infra/k6/README.md`.
- 🟠 **(Nuevo, PHASE 01)** 185 Foreign Keys reales cruzan schemas de módulos de negocio distintos, contradiciendo la regla de arquitectura ya documentada ("solo IDs sueltos, nunca FK real entre módulos") — no corregido, requiere ADR y decisión de negocio sobre qué reemplaza la integridad referencial que hoy proveen. Ver `docs/database/FOREIGN_KEYS.md §3`.
- 🟡 **(Nuevo, PHASE 01)** `core.restore_test_logs` es la única de 501 tablas sin RLS habilitado — plausiblemente intencional (tabla de infraestructura de backup), no confirmado. Ver `docs/database/SECURITY.md §1`.
- 🟡 **(Actualizado)** `POST /auth/login`/`/auth/refresh` ya existen y están verificados (ver
  "Añadido" arriba, sesión 2026-07-20); `/auth/switch-context` (cambio de empresa/sucursal activa)
  sigue siendo un contrato asumido por el frontend (`ui-kit/store/app.store.ts`), sin endpoint real
  todavía.
- 🟡 **(Nuevo, frontend)** `I18nProvider` (`react-i18next`) y `RequirePermission`/
  `usePermiso()` — ambos documentados en `docs/frontend/ROUTING.md §5.2,§6` — no están
  construidos: `react-i18next` no es dependencia de ningún `package.json` todavía, y la
  resolución de permisos depende de `modules/seguridad/backend` (vacío). El sidebar
  (`apps/web/src/app/app-shell/sidebar.tsx`) por ahora lista las 25 features sin ocultar
  ninguna por permiso.
- 🟡 **(Nuevo, frontend)** Selector de Empresa/Sucursal activa (topbar) no implementado —
  no hay endpoint de listado de empresas/sucursales todavía; `switchCompanyContext` del
  store existe pero nada lo invoca desde la UI.
- 🟡 **(Nuevo, frontend, 2026-07-20)** El bundle principal de `apps/web` supera los 500kB
  minificados (`vite build` lo advierte) — probablemente Recharts/`react-day-picker` no se están
  code-splitteando por no estar consumidos todavía por ninguna página lazy-loaded real (ver
  `docs/frontend/PERFORMANCE.md` para el mecanismo ya documentado de `React.lazy()` por página).
  No corregido — revisar cuando el primer módulo con gráficos reales exista.
- 🟡 **(Nuevo, testing, 2026-07-20)** Los nuevos tests de integración (`*.e2e-spec.ts`) corren
  contra el mismo Postgres de desarrollo (con el tenant/usuario de `seed-rbac.ts`), no contra una
  base de datos de test aislada/efímera — no ejecutar en CI todavía sin antes levantar esa
  infraestructura. `apps/api-e2e` (el proyecto Nx pensado para esto) sigue vacío; los tests viven
  colocados junto a cada controller por ahora. Además, cada suite deja un warning de Jest
  ("worker process failed to exit gracefully") — probablemente conexiones de Prisma/Redis/RabbitMQ
  no cerradas del todo en el ciclo de vida de `TestingModule`; los tests pasan igual, no bloqueante.
- ~~🟠 `nx build api` falla con `TS6059 rootDir`~~ — **resuelto FASE 05 (2026-07-20)**, ver
  "Corregido" arriba (rootDir a la raíz del repo + `nx:run-commands` en vez de `@nx/js:tsc`).
- ~~🟠 `gorazus_app` superusuario, RLS no aísla nada~~ — **resuelto FASE 05 (2026-07-20)**, ver
  "Corregido" arriba (volumen recreado con bootstrap renombrado + `34_rls_hardening.sql`).
- 🟡 **(Nuevo, FASE 04, 2026-07-20)** `core/notifications` (Notification Center) es
  deliberadamente Fase 1 — quedan pendientes, documentados en el propio código: `Template Engine`
  y `Language Manager` (ninguno existe en `core/` — `NotificationCenterService.send()` recibe texto
  ya resuelto, sin variables ni plantillas pre-aprobadas de Meta), envío vía `Background Jobs`
  (`core/scheduler` existe pero no está integrado — el envío hoy es síncrono), reintento con
  backoff, rotación de claves multi-`keyId` (el cifrado ya soporta `keyId`, pero solo hay una
  clave activa vía `NOTIFICATIONS_ENCRYPTION_KEY`), canales SMS/email/push/in-app (solo WhatsApp
  tiene adaptador), y el cruce con `crm.whatsapp_logs` que describe
  `32-core-platform/06-eventos-y-mensajeria.md §4.1` (depende de `modules/crm/backend`, sin
  construir). No hay UI de administración para cargar credenciales — usar
  `WhatsAppCredentialsService.saveCredentials()` directamente o un script operativo.
- 🟡 **(Nuevo, FASE 04, 2026-07-20)** `core/ollama` es solo el cliente genérico (ver "Añadido" arriba)
  — ningún asistente especializado (Ventas/Compras/Inventario/Contabilidad/CRM/Reportes),
  predicción, alerta o automatización tiene diseño ni código todavía. Tampoco hay ningún modelo
  descargado en el contenedor `ollama` (`ollama pull <modelo>` es un paso operativo manual, no
  automatizado) — `OllamaService` fallará en runtime hasta que exista al menos un modelo. Mismo
  criterio de gobernanza que el resto de FASE 04: no diseñar asistentes sin necesidad de negocio
  confirmada.
