# GORAZUS — Second Brain Sync Report

**Fecha**: 2026-08-13

## Result

**SECOND BRAIN — SYNCED**, con dos desviaciones deliberadas respecto al pedido original —
documentadas abajo en detalle, no ocultas.

## Claude Memory

Creados en `.claude/` (no existía nada de esto antes — solo había `settings.json` y
`scheduled_tasks.lock`):

- `MEMORY.md` — memoria operativa central, incluye la contradicción de las dos numeraciones de
  "Fase" (ver abajo).
- `ROADMAP.md` — roadmap del track infraestructura/operaciones (Fases 1-7), separado a propósito
  del `ROADMAP.md` de negocio en la raíz.
- `SESSION_STATE.md` — responde las 10 preguntas pedidas, timestamp real.
- `STARTUP_PROTOCOL.md` / `CLOSING_PROTOCOL.md` — protocolos de inicio/cierre de sesión.

## Obsidian

`docs/AKB/` **es** el vault de Obsidian del proyecto (confirmado por su propio `Home.md`: _"El
AKB vive en `docs/AKB/`, bóveda de Obsidian separada, dentro del propio repositorio"_) — no existe
una carpeta `.obsidian` versionada (probablemente ignorada), pero el contenido (frontmatter YAML,
wikilinks) es inequívocamente un vault real y activo, con taxonomía jerárquica propia (`00
Governance` a `05 Integrations`) ya establecida y en uso reciente (última edición 2026-08-07).

**Desviación #1 (deliberada)**: no se creó la estructura numerada pedida en las secciones 29-33
del pedido (`00 - Dashboard/`, `10 - Decisions/`, `11 - Phases/`, `12 - Issues/`, etc.). Esa
plantilla asume un vault vacío o sin taxonomía propia — este vault ya tiene una taxonomía
diferente, activamente mantenida, con exactamente el mismo contenido que se pedía crear (`00
Governance/Decision Log.md` = "Decisions", `00 Governance/Issue Register.md` = "Issues"). Crear
la estructura pedida habría significado una taxonomía paralela y duplicación directa de contenido
— exactamente lo que la regla general del pedido ("no dupliques") y la regla explícita de la
sección 34 prohíben. En su lugar: se agregó una sección nueva a `docs/AKB/Home.md` (edición
aditiva, no reescritura) enlazando la documentación de infraestructura/operaciones creada en esta
sincronización, con una nota explícita de por qué vive fuera de la bóveda (mismo criterio ya
usado ahí para `docs/adr/`).

## Documentation

Creados en `docs/` (ninguno existía antes de esta sincronización, verificado por inventario):

`DOCUMENTATION_INDEX.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE_CURRENT.md`,
`INFRASTRUCTURE_CURRENT.md`, `SECURITY_BASELINE.md`, `DO_NOT_TOUCH.md`, `OPERATIONS_COMMANDS.md`,
`KNOWN_ISSUES.md`, `ADR_INDEX.md`.

Modificado: `docs/AKB/Home.md` (una sección, edición aditiva — ver arriba).

No modificado: ningún ADR (`docs/adr/`), ningún archivo de `docs/AKB/00 Governance/` (ADR Index,
Decision Log, Issue Register, Glossary), ningún documento de negocio (`ROADMAP.md`,
`PROJECT_STATUS.md`, `NEXT_STEPS.md`, `TECHNICAL_DEBT.md`, `CHANGELOG.md`).

**Desviación #2 (deliberada)**: no se creó `docs/FASE_7_API_RUNTIME_REPORT.md`. La Fase 7 no se ha
ejecutado — crear ese archivo, aunque fuera con estado `PENDING`, habría sido documentar una fase
que no existe todavía como trabajo real; la sección 41 del pedido original ya anticipaba esta
posibilidad ("solo si el workflow actual del proyecto lo requiere"). Fase 7 queda registrada como
próxima acción en `.claude/MEMORY.md` y `.claude/ROADMAP.md`, sin inventar un reporte.

## Project State

Ver `docs/PROJECT_CONTEXT.md` para el resumen completo. En una frase: documentación de
arquitectura Enterprise completa, backend real en 10/27 módulos de negocio, infraestructura
reinstalada y verificada el 2026-08-13, base de datos con 5 roles PostgreSQL recreados y
verificados (Fase 6 de infraestructura cerrada).

## Current Phase

**Fase 7 — API Runtime** (track infraestructura), pendiente de iniciar. Ver
`.claude/ROADMAP.md §Next`.

## Critical Constraints

Ver `docs/DO_NOT_TOUCH.md` — lista completa. Resumen: no C:\, no habilitar LOGIN a
`gorazus_migrator`/`gorazus_readonly` sin autorización explícita (reconfirmado por el usuario el
2026-08-13), no rotar secretos, no `db:pull`, no operaciones destructivas de git/Docker.

## Known Issues

Ver `docs/KNOWN_ISSUES.md`. Los dos más relevantes ahora mismo: mismatch build/serve de
`apps/api/project.json` (objetivo de Fase 7) y un cuelgue de `pnpm install` en el contenedor `api`
en modo dev (descubierto 2026-08-13, no diagnosticado a fondo).

## Contradicciones detectadas y registradas (no resueltas en silencio)

1. **Dos numeraciones de "Fase" independientes coexisten** en el repositorio — la del track de
   negocio (FASE 01-06 = módulos ERP, `ROADMAP.md`) y la del track de infraestructura (Fase 1-7 =
   Docker/Ollama/DB/roles/API runtime, sin documento propio hasta hoy). El pedido de
   sincronización asumía implícitamente que "Fase 6"/"Fase 7" se referían solo al track de
   infraestructura — se registró la ambigüedad explícitamente en `.claude/MEMORY.md` para que
   ninguna sesión futura las confunda.
2. **`PROJECT_STATUS.md` (2026-07-26) tiene el conteo de base de datos desactualizado**: reporta
   503 tablas/~5.169 FK/2.964 índices; el estado real verificado el 2026-08-13 es 736 tablas/5217
   FK/3260 índices. No se editó `PROJECT_STATUS.md` (pertenece al track de negocio, fuera del
   alcance de esta tarea de sincronización) — registrado en `docs/KNOWN_ISSUES.md` y
   `.claude/MEMORY.md` para que una sesión futura no reconcilie hacia el número viejo.

Ninguna otra contradicción encontrada en la búsqueda dirigida de los patrones pedidos
(`docker-desktop-data` como obligatorio, roles con LOGIN activo, Fase 6 marcada pendiente, etc.).

## No Changes To

- **Código**: 0 archivos de `apps/`, `modules/`, `core/`, `packages/` tocados.
- **Base de datos**: 0 comandos SQL ejecutados en esta sincronización (Fase 6 ya había cerrado
  antes de empezar esta tarea).
- **Docker/infraestructura**: 0 cambios — no se reconstruyó ninguna imagen ni se modificó ningún
  `docker-compose*.yml`/Dockerfile.
- **Roles**: `gorazus_migrator`/`gorazus_readonly` siguen sin LOGIN/contraseña, sin tocar.
- **Secretos**: ningún valor de `.env` fue leído, impreso ni copiado a documentación en esta
  tarea.

## Git

Branch `feature/database-finalization`, sin cambios fuera de lo listado arriba. `.claude/
settings.json` aparece como modificado en `git status` — **preexistente a esta sesión**, no
tocado por esta sincronización. No se hizo ningún commit.

## Disk C:

Ninguna escritura en `C:\` durante esta tarea — todos los archivos creados/modificados están bajo
`D:\15_Codigo_Fuente\GORAZUS\`.

## Next Action

**Fase 7 — API Runtime** (track infraestructura): diagnosticar y resolver el mismatch build/serve
de `apps/api/project.json`, sin tocar roles/migraciones/secretos/versiones de dependencias. Ver
`.claude/ROADMAP.md §Next` para el criterio de éxito completo.

---

**GORAZUS — SECOND BRAIN SYNCHRONIZED**
