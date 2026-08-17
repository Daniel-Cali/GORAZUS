# GORAZUS — Claude Roadmap (Track Infraestructura/Operaciones)

> Este roadmap cubre **exclusivamente el track de infraestructura/operaciones** (Fase 1-7, ver
> `.claude/MEMORY.md` §"Contradicción registrada"). El roadmap de **negocio/producto** (módulos
> ERP) vive en `ROADMAP.md` (raíz del repo) y no se duplica acá.

## Completed

**Track infraestructura, Fases 1-7**:

1. Migracion de storage Docker hacia la unidad D (bind mount docker-data/postgres).
2. Dependencias API.
3. Ollama nativo en Windows.
4. Validacion de base de datos.
5. Baseline tecnico.
6. Roles PostgreSQL (2026-08-13) - docs/FASE_6_POSTGRES_ROLES_REPORT.md, PASSED WITH KNOWN ISSUES.
7. API Runtime (2026-08-13) - docs/INFRA-F7_API_RUNTIME_REPORT.md, PASS. Target serve de apps/api/project.json corregido, healthcheck de api corregido, stack completo healthy.

## Current

Ninguna fase de infraestructura activa. Fase 7 cerrada, sin proxima fase decidida.

## Next

Sin proxima fase de infraestructura decidida todavia. Candidatos identificados en el reporte de
Fase 7: correr la suite completa de tests del monorepo, o registrar indicadores reales en
HealthService para que el endpoint ready deje de ser un no-op.

## Blockers

Ninguno.

## Technical Debt

Ver docs/KNOWN_ISSUES.md seccion Technical Debt (track infraestructura) y TECHNICAL_DEBT.md
(track negocio) - no duplicado aca.

## Deferred

- Diagnostico a fondo del cuelgue de pnpm install observado al cierre de Fase 6 en modo dev - no
  se repitio al recrear el contenedor api en Fase 7, posiblemente transitorio.
- Decision sobre el volumen Docker heredado de la migracion original de storage (rollback de
  Fase 1) - requiere autorizacion explicita antes de tocarlo.
