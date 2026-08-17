# GORAZUS — Known Issues (Track Infraestructura/Operaciones)

> Cubre el track de infraestructura/operaciones (Fases 1-7). El track de negocio tiene su propio
> registro extenso en `TECHNICAL_DEBT.md` (raíz) y `docs/AKB/00 Governance/Issue Register.md` —
> no duplicado acá.

## BLOCKING

Ninguno al 2026-08-13.

## KNOWN

### API build/serve mismatch

**Estado**: RESUELTO (2026-08-13, Fase 7) - ver docs/INFRA-F7_API_RUNTIME_REPORT.md. El target
serve de apps/api/project.json ahora usa ts-node contra el codigo fuente (mismo mecanismo ya
probado en el Dockerfile de produccion), en vez de depender de un artefacto compilado que nunca
se generaba y que ademas no podia resolver paquetes del workspace por el linking estricto de pnpm.

### Healthcheck de api apuntaba a la ruta incorrecta

**Estado**: RESUELTO (2026-08-13, Fase 7). El healthcheck de docker-compose.yml y el HEALTHCHECK
del Dockerfile apuntaban a la ruta corta de liveness, pero la app real expone el endpoint bajo el
prefijo api con version v1. Corregido en ambos archivos - ver docs/INFRA-F7_API_RUNTIME_REPORT.md
seccion 8.

### Contenedor `api` (modo dev) se cuelga en `pnpm install`

**Estado**: KNOWN, descubierto 2026-08-13.

Al levantar `docker compose ... up -d --build api`, el proceso `pnpm install --frozen-lockfile`
del entrypoint dev queda con 0% CPU y 0 progreso de I/O (`docker stats`/`ps aux` verificado, sin
avance durante varios minutos) — no es lentitud del bind mount Windows→WSL2 (ya descartado por
evidencia), es un cuelgue real. No relacionado con PostgreSQL/roles. No diagnosticado a fondo
(fuera de alcance de Fase 6, prohibido tocar Dockerfile/compose en esa fase). La conectividad
real de `gorazus_app` se verificó de forma independiente, directamente contra Postgres.

### pg_partman 5.5.0 vs 5.4.3

**Estado**: KNOWN, documentado en sesiones anteriores.

Drift de versión de la extensión `pg_partman` instalada (5.5.0-1.pgdg13+1) respecto a la versión
documentada anteriormente en el proyecto (5.4.3). No bloqueante, no corregido.

### Legacy Docker storage

**Estado**: KNOWN / REQUIRES AUTHORIZATION.

El volumen Docker nombrado `docker_postgres_data` (storage original antes de la migración a D:\
en Fase 1) sigue existiendo como rollback. No eliminar sin autorización explícita — ver
`docs/DO_NOT_TOUCH.md`.

## TECHNICAL DEBT

### Materialized views sin poblar

**Estado**: TECHNICAL DEBT.

Documentado en sesiones anteriores: 4 vistas materializadas con `ispopulated=false`. No
re-verificado en esta sincronización (2026-08-13) — confirmar antes de asumir que sigue siendo
así.

### `gorazus_migrator`/`gorazus_readonly` sin contraseña

**Estado**: no es deuda técnica, es una decisión intencional pendiente de autorización — ver
`docs/DO_NOT_TOUCH.md` y `.env` (no define `POSTGRES_MIGRATOR_PASSWORD` ni
`POSTGRES_READONLY_PASSWORD`).

## DEFERRED

- Reinstalación/verificación completa de `web`/`nginx` en el stack Docker — deliberadamente no
  probados durante la Fase 6 (fuera de su alcance).
- Diagnóstico a fondo del cuelgue de `pnpm install` en el contenedor `api` dev.
- Decisión sobre el volumen Docker legacy (`docker_postgres_data`).
- Reinstalación de Git — resuelta el 2026-08-13 (ya no está diferida, incluida acá solo como
  registro histórico de que estuvo pendiente durante parte de la Fase 6).

## Contradicciones de documentación detectadas (no resueltas automáticamente)

- `PROJECT_STATUS.md` (2026-07-26) reporta "503 tablas, ~5.169 FK, 2.964 índices" — el estado
  real verificado el 2026-08-13 es 736 tablas, 5217 FK, 3260 índices. No se editó
  `PROJECT_STATUS.md` en esta sincronización (pertenece al track de negocio, actualizado en su
  propio ciclo) — señalado acá para evitar que una sesión futura reconcilie hacia el número
  desactualizado. Ver `.claude/MEMORY.md §Contradicción registrada` para el detalle completo,
  incluida la doble numeración de "Fase" que coexiste en el repositorio.
