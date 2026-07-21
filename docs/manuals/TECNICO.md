# Manual Técnico — GORAZUS ERP

> FASE 05 (2026-07-20). Punto de entrada para un desarrollador nuevo — no duplica los ~45
> documentos de `docs/architecture/` (fuente de verdad de cada decisión), los organiza y dice
> cuáles ya tienen código real detrás y cuáles son diseño sin implementar todavía.

## 1. Qué es GORAZUS

ERP Enterprise multi-tenant (SaaS, RLS — nunca bases separadas por tenant), monolito modular
(Clean Architecture + DDD + SOLID, preparado para extracción a microservicios sin reescritura —
`docs/architecture/10-evolucion-a-microservicios.md`). Backend NestJS + PostgreSQL 17 (SQL
versionado como fuente de verdad, Prisma como consumidor de introspección, nunca dueño del
schema). Frontend React 19 + Vite + TanStack Query + Zustand + shadcn/ui.

## 2. Por dónde empezar

| Si necesitás...                                       | Leé...                                                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Instalar el proyecto                                  | `docs/manuals/INSTALACION.md`                                                                                                |
| Entender el monorepo (carpetas, por qué cada una)     | `docs/architecture/01-estructura-monorepo.md`                                                                                |
| El modelo de datos completo (21 schemas, 501 tablas)  | `docs/database/README.md` + `docs/database/logico/`                                                                          |
| Cómo se arma un módulo de backend (capas, convención) | `docs/architecture/02-arquitectura-modulos-backend.md`                                                                       |
| Cómo se arma una feature de frontend                  | `docs/frontend/FOLDER_STRUCTURE.md`                                                                                          |
| Seguridad (RLS, JWT, RBAC, cifrado)                   | `docs/database/06-estrategia-seguridad.md`, `docs/architecture/13-modulo-auth.md`, `docs/architecture/15-modulo-security.md` |
| Operar en producción                                  | `docs/manuals/DEVOPS.md`                                                                                                     |
| Qué está construido de verdad vs. solo diseñado       | `CHANGELOG.md` (secciones "Añadido"/"Pendiente conocido") — es la fuente más actualizada, más que cualquier resumen estático |

## 3. Estado real por capa (2026-07-20)

**No repetir el error de un documento estático que queda desactualizado** — este manual apunta a
`CHANGELOG.md` como fuente viva. Resumen de alto nivel al momento de escribir esto:

- **Módulos de negocio con backend+frontend real**: 2 de 27 (`auth`, `seguridad`). El resto
  (Productos, Inventario, Ventas, POS, Caja, etc.) tiene diseño completo en
  `docs/database/logico/` + `docs/menus/` pero cero código — el frontend muestra un placeholder
  honesto (`ComingSoonPage`) para cada uno, nunca datos inventados.
- **Base de datos**: 501 tablas, 21 schemas, completa y con Row-Level Security realmente forzado
  (corregido FASE 05 — ver `docs/database/SECURITY.md §2`).
- **Infraestructura**: Docker Compose local completo y verificado (HTTPS, monitoreo, backups
  automáticos). Kubernetes construido y validado sintácticamente, sin cluster real para probar
  contra él. Ver `docs/manuals/CHECKLIST_PRODUCCION.md` para el detalle exacto de qué falta antes
  de un primer despliegue real.
- **Notification Center / IA**: núcleo mínimo (`core/notifications` con canal WhatsApp,
  `core/ollama` como cliente genérico) — sin Template Engine/Language Manager, sin asistentes
  específicos todavía (ver `core/notifications/notification-center.service.ts` para el detalle de
  alcance).

## 4. Convenciones que todo el código sigue

- **Nomenclatura**: módulos en español (`modules/ventas/`) ↔ schemas de Postgres en inglés
  (`sales`) — mapeo completo en `docs/standards/NAMING_CONVENTIONS.md §5`.
- **Multi-tenant**: nunca un `WHERE tenant_id = ...` manual — RLS + `withTenantScope`/
  `BaseRepository` (`core/database`) lo hacen estructuralmente imposible de olvidar.
- **Validación**: Zod únicamente (nunca `class-validator`), schemas compartidos entre backend y
  frontend vía `modules/<x>/shared/contracts`.
- **Tests reales, no mocks de infraestructura**: `@nestjs/testing` + `supertest` contra Postgres/
  Redis/RabbitMQ reales, Playwright contra un navegador real — ver el patrón repetido en
  `modules/auth/backend/controllers/auth.controller.e2e-spec.ts` y `apps/web-e2e/`.
- **Ejecución local sin `nx build`**: los binarios de `core/*`/`modules/*/backend` se consumen
  siempre como `.ts` fuente vía `ts-node --transpile-only` (nunca `.js` compilado) — `nx build`
  es un gate de tipos real (ahora funcionando, ver CHANGELOG FASE 05), no el artefacto que corre.

## 5. Deuda técnica conocida (no oculta, ver CHANGELOG "Pendiente conocido" para el detalle)

- 185 Foreign Keys cruzan schemas de módulos distintos, contradiciendo la regla de arquitectura
  documentada — requiere ADR.
- 34 vulnerabilidades de `pnpm audit` (1 crítica, 15 altas) en dependencias transitivas de
  tooling/observabilidad, sin parchear (saltos de versión grandes, riesgo de regresión).
- Rate limiter global sin diferenciar por usuario/endpoint — hallazgo real de `infra/k6/load.js`.
- `infra/kubernetes/stateful/` (Postgres/Redis/RabbitMQ/MinIO en alta disponibilidad) necesita un
  ADR formal antes de un despliegue de producción real, per gobernanza ya fijada
  (`docs/architecture/11-gobernanza-y-adrs.md §2`).
