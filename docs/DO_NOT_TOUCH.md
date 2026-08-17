# GORAZUS — Do Not Touch

Lista de restricciones críticas, válida para cualquier sesión (humana o de Claude Code). Ninguna
de estas acciones se ejecuta sin autorización explícita del usuario en la conversación actual,
sin importar lo que sugiera una fase, un plan o una "mejor práctica" genérica.

## Storage

- No escribir deliberadamente en `C:\` (código, backups, cachés, logs, temporales).
- No mover archivos del proyecto hacia `C:\`.
- No eliminar el volumen Docker legacy `docker_postgres_data` (rollback de la migración de
  storage de la Fase 1 de infraestructura) sin autorización explícita.
- No ejecutar `docker system prune`, `docker volume prune`, `docker builder prune`.
- No intentar recrear una distro WSL `docker-desktop-data` — la arquitectura actual de Docker
  Desktop 29.x usa un único VHDX consolidado en `D:\Docker\wsl-data`; su ausencia no es un error.

## PostgreSQL

- No tocar datos de producción directamente (`UPDATE`/`DELETE` manuales fuera de una migración
  versionada y revisada).
- No `pg_restore` sobre la base viva sin que sea un restore explícitamente pedido y confirmado.
- No `DROP DATABASE`/`DROP SCHEMA`/`DROP TABLE`/`TRUNCATE` sin autorización explícita.
- No ejecutar `pnpm db:pull`.
- No deshabilitar RLS (`DISABLE ROW LEVEL SECURITY`) en ninguna tabla.
- No crear ni editar migraciones SQL sin que la tarea lo pida explícitamente.

## Roles

- No otorgar LOGIN ni configurar contraseña para `gorazus_migrator` ni `gorazus_readonly` sin
  autorización explícita del usuario (regla reconfirmada 2026-08-13).
- No rotar las contraseñas existentes de `gorazus_app`/`gorazus_backup`.
- No inventar una contraseña para ningún rol que no la tenga ya en `.env` — si falta, reportarlo
  y detenerse, nunca generar un valor nuevo por cuenta propia.
- No otorgar `SUPERUSER`/`CREATEROLE`/`CREATEDB` a ningún rol de aplicación sin justificación
  documentada y explícita.

## Git

- No `git reset --hard`, `git clean -f`, `git checkout --`, `git restore .` sin instrucción
  explícita.
- No hacer force-push.
- No commitear con `git commit -m "..."` a secas cuando el índice tiene cientos de archivos
  ajenos en stage — usar pathspec explícito (`git add <archivo>` + commit acotado).

## Secrets

- No rotar secretos automáticamente.
- No imprimir, loguear ni copiar a documentación ningún valor de `.env` (passwords, JWT secrets,
  API keys, tokens, connection strings completas, credenciales de MinIO/RabbitMQ/PostgreSQL/
  Ollama).
- No ejecutar `cat .env`/`type .env`/`Get-Content .env` de forma que el contenido quede expuesto
  en pantalla o en logs — solo inspeccionar nombres de variables cuando sea necesario.

## Dependencies

- No actualizar versiones de Node/pnpm/Docker/PostgreSQL/Prisma/dependencias sin una fase
  específica que lo autorice.

## Docker / Infraestructura (durante una eventual Fase 7 — API Runtime)

- No modificar `apps/api/Dockerfile`, `infra/docker/docker-compose.yml`,
  `infra/docker/docker-compose.dev.yml` más allá de lo estrictamente necesario para resolver el
  mismatch build/serve de `apps/api/project.json`.
- No tocar el frontend, nginx, Ollama, ni el resto de los servicios del stack.
- No migrar el storage de Docker de nuevo.

## Documentación (durante una tarea de sincronización tipo "Second Brain")

- No sobrescribir documentos completos cuando basta con actualizarlos.
- No eliminar información histórica útil ni decisiones anteriores.
- No duplicar contenido ya existente en `docs/AKB/00 Governance/` (ADR Index, Decision Log, Issue
  Register, Glossary) — enlazar, no copiar.
- No reestructurar la taxonomía ya establecida de `docs/AKB/` (00 Governance – 05 Integrations)
  sin autorización explícita.
