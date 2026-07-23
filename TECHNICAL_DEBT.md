# Technical Debt — GORAZUS ERP

> Fase 03 — Backend Core Enterprise, Parte 01 (auditoría). Sesión del
> 2026-07-23, versión **0.3.1**, rama `gorazus2`. Consolida deuda técnica
> ya dispersa en `CHANGELOG.md` ("Pendiente conocido") y en los reportes
> de sesiones previas, más lo detectado en esta auditoría — no repite el
> detalle completo de cada item, referencia la fuente.

## Cómo leer esto

🔴 Bloquea o compromete seguridad/integridad real. 🟠 Afecta escalabilidad
o mantenibilidad a mediano plazo. 🟡 Cosmético o de bajo impacto real.
Ninguno de los ítems de abajo es nuevo esta sesión salvo donde se indica
explícitamente "(nuevo)" — esta auditoría no encontró incidentes nuevos
de gravedad 🔴 sin documentar ya.

## 1. Seguridad y dependencias

- 🟠 **39 vulnerabilidades de `pnpm audit`** (1 crítica, 19 altas, 18
  moderadas, 1 baja) — todas en dependencias transitivas de tooling/
  observabilidad (Vitest UI, minimatch/picomatch ReDoS, exporters de
  OpenTelemetry, js-yaml), ninguna en runtime de negocio directo.
  `security.yml` corre `pnpm audit` sin bloquear (`|| true`). Ver
  `SECURITY_REPORT.md` para el detalle actual y `CHANGELOG.md` para el
  historial de qué se resolvió ya (nodemailer/multer, cuando eran
  dependencias nuevas de esta sesión) vs qué queda deliberadamente
  diferido (requiere saltos de versión mayores en código ya verificado).
- 🟠 **Detección de reuso de refresh token** no implementada —
  `RefreshTokenUseCase` documenta esto en su propio comentario de
  cabecera: una sola columna `refresh_token_hash` por sesión ya impide
  reusar un token rotado, pero no distingue "reuso detectado" de "nunca
  existió" para registrar el incidente como señal de posible robo de
  token.
- 🟡 **Rate limiter global es por IP, sin diferenciar por usuario ni
  endpoint** (salvo `/auth/login`/`/auth/login/2fa`, que ya tienen su
  propio límite más estricto) — un grupo de usuarios reales detrás de un
  NAT/proxy compartido lo alcanza igual. Detectado con `k6` en FASE 05,
  decisión de producto pendiente, no un bug.

## 2. Arquitectura y patrones

- 🟠 **Sin patrón compartido de sort/filter/search** para listados — cada
  controller (`auditoria`, `configuracion/*`) resuelve su propio filtro
  ad hoc por query params. Funciona hoy; se va a fragmentar más con cada
  uno de los 24 módulos de negocio sin backend todavía.
- 🟠 **`core/messaging` (RabbitMQ) sin un solo productor o consumidor
  real** en todo el backend — `EventBusService` existe y funciona
  (verificado), nadie lo llama. Los Domain Events de `auth` (`events/`,
  Parte 2.1) están preparados con la forma exacta que se publicaría, pero
  tampoco se publican.
- 🟠 **`core/scheduler` sin un solo cron job registrado** — mismo patrón
  que `core/messaging`: infraestructura lista, cero consumidores.
- 🟡 **`core/storage` con un solo consumidor genérico** (`POST/GET/DELETE
/files`) — ningún módulo de negocio asocia todavía un archivo subido a
  uno de sus propios registros (la `key` se guardaría en la columna
  `metadata JSONB` que ya tiene cada entidad).
- 🟡 **185 Foreign Keys reales cruzan schemas de módulos de negocio
  distintos** en el modelo de datos, contradiciendo la regla ya
  documentada ("solo IDs sueltos, nunca FK real entre módulos") —
  requiere un ADR y una decisión de negocio sobre qué reemplaza esa
  integridad referencial. Ver `docs/database/FOREIGN_KEYS.md §3`. Nivel
  de riesgo bajado a 🟡 (no 🔴) porque no es un bug — es deuda de diseño
  ya identificada y documentada con honestidad, no oculta.

## 3. Cobertura funcional (esperado, no "roto")

- 🔴→🟡 **24 de 27 módulos de negocio sin una sola línea de backend**
  (placeholders `ComingSoonPage` en frontend) — es el estado esperado de
  un ERP en construcción incremental, marcado 🟡 (no 🔴) porque está
  documentado con honestidad en `ROADMAP.md`, no oculto ni presentado
  como completo.
- 🟠 **`modules/inventario` (Almacenes) completamente vacío** —
  `backend/frontend/shared` sin un solo archivo. Es el único ítem de la
  lista de prioridad "primero" de FASE 03 que todavía no existe (el
  resto — Auth/Usuarios/Roles/Permisos/Multiempresa/Sucursales/
  Configuración/API REST/OpenAPI — ya está construido). Ver
  `PROJECT_STATUS.md` §6 para el detalle de esta discrepancia entre el
  pedido de FASE 03 y el estado real.
- 🟡 **Catálogo de países/jurisdicciones fiscales sin CRUD/UI** — solo
  script de seed mínimo (`seed-tax-jurisdictions.ts`) que desbloquea
  Impuestos.

## 4. Calidad de código y CI

- 🟡 **ESLint type-aware/strict (`recommendedTypeChecked`) evaluado y
  revertido** — causó `heap out of memory` corriendo sobre el monorepo
  completo en el sandbox de desarrollo usado hasta ahora, incluso
  secuencialmente. No se pudo confirmar cuántos errores de tipo reales
  existirían — queda como recomendación para una sesión dedicada con más
  memoria disponible o corriendo proyecto por proyecto.
- 🟡 **`docs/api/openapi.json`'s `info.version` hardcodeado a `"0.1.0"`**
  (nuevo, detectado esta auditoría) — `core/kernel/bootstrap.ts`,
  `DocumentBuilder().setVersion('0.1.0')` — no sigue la versión real del
  proyecto (`0.3.1` en `package.json`/`VERSION.md`). Cosmético (no afecta
  el contenido real del spec), pero confuso para quien lo lea aislado.
- 🟡 **CI sin contenedores de servicio real** — `pr-validation.yml` corre
  `nx affected -t test` sin Postgres/Redis/RabbitMQ/MinIO en el runner;
  si un PR afecta un `*.e2e-spec.ts` (que sí corren contra infraestructura
  real en local), ese paso fallaría en GitHub Actions por falta de
  infraestructura. Documentado desde la sesión de infraestructura previa,
  sin resolver — mismo prerequisito que la validación automática de
  OpenAPI en CI (tampoco existe).
- 🟡 **`dist/*/package.json` de los paquetes `core/*` conserva `"main":
"./index.ts"`** en vez de `.js` — warning cosmético, Node lo resuelve
  igual por fallback, no bloqueante (documentado desde FASE 05).

## 5. Infraestructura no verificada esta sesión

- Kubernetes (`infra/kubernetes/`) — manifiestos validados con `kubectl
kustomize` en su momento, sin cluster real de prueba todavía.
- 🟡 **Docker Desktop no disponible durante gran parte de esta sesión y
  la anterior** (`failed to connect to the docker API` — nivel host de
  Windows, fuera del control de este entorno de agente). No es deuda del
  proyecto — es una nota operativa: los 33+ tests e2e reales de `auth`/
  `seguridad`/`configuracion` no se pudieron re-correr en el momento de
  escribir varios reportes recientes. Ver `TEST_REPORT.md` y
  `BACKEND_HEALTH_REPORT.md` para el detalle de qué sí se verificó sin
  infraestructura (build/lint/unitarios) y qué queda pendiente de
  re-confirmar la próxima vez que Docker esté arriba.

## 6. Explícitamente NO es deuda (decisiones ya tomadas, no revisitar)

- Stack Node/TypeScript en vez de PHP — decisión ya confirmada con el
  usuario en la primera sesión de esta fase, no un error.
- `packages/tooling/utils` sin DI (Clock/UUID/Hash/TOTP como funciones
  puras) — decisión de arquitectura documentada
  (`docs/architecture/32-core-platform/10-utilidades-comunes.md §1`).
- Sin CQRS real (Command/Query/Handler separados) — cada caso de uso ya
  es una clase de responsabilidad única; forzar la separación ahora
  crearía inconsistencia con los módulos ya construidos, sin beneficio
  claro todavía.
