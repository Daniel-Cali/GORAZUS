# GORAZUS — Infrastructure (Current State)

Estado real de infraestructura, verificado el 2026-08-13. Complementa a
`docs/architecture/08-infraestructura-y-despliegue.md` (diseño) e `infra/docker/README.md`
(detalle de la migración de storage) sin duplicarlos.

## Host

Windows 10 Pro. Shell principal: PowerShell (el tool Bash de este entorno de agente está roto
desde antes de la Fase 6 de infraestructura — no es un problema del proyecto, es del entorno de
ejecución del agente).

## Project

`D:\15_Codigo_Fuente\GORAZUS`.

## Docker

- **Docker Desktop**: 29.7.2, instalado en `D:\Docker\Docker` (`--installation-dir`).
- **Docker storage (WSL2)**: `D:\Docker\wsl-data` (`--wsl-default-data-root`). Distro activa:
  `docker-desktop` (única — la arquitectura consolidada de Docker Desktop 29.x no separa
  `docker-desktop-data`; su ausencia no es un error, no intentar recrearla).
- **Docker Compose**: v5.3.1.
- **Instalación**: reinstalado el 2026-08-13 (con autorización explícita del usuario) tras un
  incidente no explicado de desaparición del sistema (Docker Desktop y Git faltaban de
  `C:\Program Files` sin registro de desinstalación MSI). Preservó la regla de no escribir en
  C:\ colocando tanto los binarios como el storage WSL2 en D:\.

## PostgreSQL

- **Motor**: PostgreSQL 17.10 + `pg_partman` 5.5.0-1.pgdg13+1 + `pg_trgm` 1.6 + `pgcrypto` 1.3.
- **Storage real**: `D:\15_Codigo_Fuente\GORAZUS\docker-data\postgres` — bind mount NTFS directo
  (no un volumen Docker nombrado), desde la migración de Fase 1. Esta decisión de arquitectura se
  validó de forma retroactiva el 2026-08-13: cuando Docker Desktop perdió todos sus volúmenes
  gestionados en el incidente de reinstalación, este bind mount sobrevivió intacto por no
  depender del storage interno de Docker/WSL2.
- **Legacy**: el volumen Docker nombrado `docker_postgres_data` (el storage original antes de la
  migración a D:\) sigue existiendo como rollback — no tocar sin autorización explícita.

## Backups

`D:\15_Codigo_Fuente\GORAZUS\backups\` — dumps `pg_dump --format=custom`, verificados con
`pg_restore --list`. Automatizados diariamente vía el contenedor `backup` (usa el rol
`gorazus_backup`).

## Servicios Docker Compose

Definidos en `infra/docker/docker-compose.yml` + overlay `infra/docker/docker-compose.dev.yml`:

| Servicio                          | Estado verificado 2026-08-13 (Fase 7)                                        |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `postgres`                        | Healthy                                                                      |
| `redis`                           | Healthy                                                                      |
| `rabbitmq`                        | Healthy                                                                      |
| `minio`                           | Healthy                                                                      |
| `backup`                          | Arriba, backup automático probado con éxito                                  |
| `pgadmin`                         | Arriba                                                                       |
| `mailhog`                         | Arriba                                                                       |
| `api`                             | **Healthy** — corregido en Fase 7, ver `docs/INFRA-F7_API_RUNTIME_REPORT.md` |
| `web`                             | Arriba (dev server, sin healthcheck definido)                                |
| `nginx`                           | **Healthy**                                                                  |
| `ollama` (perfil `ollama-docker`) | No usado por defecto — ver abajo                                             |

## Ollama

Nativo en Windows (no contenedor por defecto) — decisión de Fase 3 de infraestructura. ~34GB de
modelos ya descargados. Los contenedores acceden vía `OLLAMA_BASE_URL=http://host.docker.internal:11434`.
Un perfil Docker (`ollama-docker`) existe por si algún entorno futuro (CI, máquina sin Ollama
nativo) lo necesita — no se activa con `docker compose up -d` por defecto.

## Baseline de software (verificado, no actualizar sin fase específica)

| Componente     | Versión verificada                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Node.js        | v24.18.0                                                                                                     |
| pnpm           | 9.15.0                                                                                                       |
| Docker         | 29.7.2                                                                                                       |
| Docker Compose | v5.3.1                                                                                                       |
| PostgreSQL     | 17.10                                                                                                        |
| Prisma         | ^5.22.0                                                                                                      |
| pg_partman     | 5.5.0-1.pgdg13+1 (drift conocido vs. 5.4.3 documentado en versiones anteriores del proyecto — no bloqueante) |
| pg_trgm        | 1.6                                                                                                          |
| pgcrypto       | 1.3                                                                                                          |
