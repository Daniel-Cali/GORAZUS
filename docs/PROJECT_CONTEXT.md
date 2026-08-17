# GORAZUS — Project Context

> Este documento existe para que una instancia nueva de Claude (u otra persona) entienda GORAZUS
> sin tener que leer todo el repositorio primero. Es un resumen — cada afirmación enlaza al
> documento fuente para el detalle completo. Ver `docs/DOCUMENTATION_INDEX.md` para el mapa
> completo de documentación.

## ¿Qué es GORAZUS?

Un ERP (Enterprise Resource Planning) construido desde cero, con arquitectura y modelo de datos
de nivel Enterprise diseñados de forma exhaustiva antes que el código (32 fases de documentación
de arquitectura, ver `docs/00-roadmap-fases.md`), y backend real construido incrementalmente
módulo por módulo sobre ese diseño ya validado. No es un fork ni una plantilla — todo el dominio
(contabilidad, inventario, ventas, compras, CRM, POS, etc.) está modelado específicamente para
este proyecto.

## Stack técnico

- **Backend**: NestJS + TypeScript, Clean Architecture por módulo (sin CQRS ni Value Objects
  formales — decisión de arquitectura documentada, ver `TECHNICAL_DEBT.md §6`).
- **Persistencia**: PostgreSQL 17 + Prisma (21 clientes, uno por schema de negocio con
  consumidor real). Row-Level Security forzado a nivel de base de datos — el aislamiento
  multi-tenant no depende únicamente de la capa de aplicación.
- **Frontend**: React 19 + Vite + Tailwind/shadcn (`ui-kit` como design system compartido).
- **Infraestructura**: Docker Compose (Postgres, Redis, RabbitMQ, MinIO, Nginx, pgAdmin,
  MailHog), monorepo Nx/pnpm.
- **IA**: Ollama nativo en Windows (no contenedorizado por defecto), sin consumidor de negocio
  todavía (decisión de alcance explícita).

## Arquitectura

Ver `docs/ARCHITECTURE_CURRENT.md` (infraestructura desplegada) y `docs/AKB/` (Segundo Cerebro —
dominio, DDD, ADRs). Cada módulo de negocio (`modules/*`) tiene su propio backend/frontend
independiente, compuesto vía barrels — ejemplo real: `pos` importa `InventarioModule`/
`VentasModule`/`CajaModule`/`ClientesModule` para orquestar el checkout, sin acoplarse a sus
internos.

## Estado

**Dos tracks de trabajo independientes, con numeraciones de "Fase" propias y sin relación entre
sí** — ver `.claude/MEMORY.md §Contradicción registrada` para el detalle completo de por qué
coexisten:

1. **Track de negocio** (construcción de módulos ERP): 10 de 27 módulos con backend real (37%).
   Núcleo de identidad/administración ya endurecido para producción (2FA, bloqueo por intentos,
   revocación de sesión, CSRF). Última fase reportada: Módulo de Ventas Enterprise Parte 1
   (`v0.24.0`, 2026-07-27). Ver `ROADMAP.md`/`PROJECT_STATUS.md` — **nota**: estos dos documentos
   están fechados 2026-07-26/27 y pueden no reflejar decisiones más recientes que sí aparecen en
   `docs/AKB/00 Governance/Decision Log.md` (Compras/Inventario Parte 05, hasta 2026-08-07).
2. **Track de infraestructura/operaciones** (esta numeración de "Fase" es de sesiones recientes,
   sin documento propio hasta la sincronización del 2026-08-13): Fase 1 (migración de storage
   Docker a D:\) a Fase 6 (roles PostgreSQL, completa) ya cerradas. Fase 7 (API Runtime)
   pendiente. Ver `.claude/ROADMAP.md`.

## Database

Ver `docs/INFRASTRUCTURE_CURRENT.md §PostgreSQL` para el baseline técnico verificado (23 schemas,
736 tablas, 5217 FK, 3260 índices, RLS forzado). El modelo de datos es el contrato que el backend
consume, no al revés — está congelado en su estructura fundamental (`VERSION.md`), cualquier
cambio real requiere una migración versionada en `docs/database/sql/`.

## API

`apps/api` (NestJS). **Problema activo**: no puede levantarse vía Nx (`build`/`serve`
desincronizados, ver `docs/KNOWN_ISSUES.md`) — objetivo de la Fase 7 de infraestructura, no
iniciada al momento de este documento.

## Frontend

`apps/web` (React 19). 4 pantallas reales completas (Login, Dashboard, Usuarios, POS) más
`ComingSoonPage` para los módulos sin UI todavía. `nx run web:test` roto desde antes de esta
sincronización — ver `TECHNICAL_DEBT.md §4`.

## Mobile

Sin evidencia de un proyecto mobile en este repositorio.

## Seguridad

Ver `docs/SECURITY_BASELINE.md`. Resumen: RLS forzado, roles de aplicación sin superusuario,
2FA/bloqueo por intentos/CSRF en `auth`, secretos exclusivamente en `.env` (no trackeado).

## Workflows de trabajo

- Toda tarea de infraestructura/operaciones sigue `.claude/STARTUP_PROTOCOL.md` al empezar y
  `.claude/CLOSING_PROTOCOL.md` al cerrar.
- Cambios destructivos (roles, secretos, storage, git) requieren autorización explícita del
  usuario en la conversación — nunca se ejecutan "a ver qué pasa" ni por inferencia de un
  documento. Ver `docs/DO_NOT_TOUCH.md`.
- El Segundo Cerebro (`docs/AKB/`) es la fuente oficial de decisiones de arquitectura — ante
  contradicción con una sugerencia genérica de buenas prácticas, el AKB siempre prevalece.

## Fases (resumen — ver los roadmaps completos para el detalle)

Ver `.claude/ROADMAP.md` (infraestructura) y `ROADMAP.md`/`NEXT_STEPS.md` (negocio, raíz del
repo) — no repetido acá para no duplicar.

## Restricciones

Ver `docs/DO_NOT_TOUCH.md` — la lista completa y autoritativa. Las más críticas: nunca escribir
en `C:\`, nunca habilitar LOGIN para `gorazus_migrator`/`gorazus_readonly` sin autorización,
nunca rotar secretos existentes, nunca `pnpm db:pull`.
