# GORAZUS — Operations Commands

Comandos seguros de uso frecuente, verificados en este entorno (Windows + PowerShell — el tool
Bash está roto en este entorno desde antes de la Fase 6 de infraestructura, usar PowerShell).
Ninguno de los comandos listados acá es destructivo — ver `docs/DO_NOT_TOUCH.md` para lo que
nunca debe ejecutarse sin autorización explícita.

## Preparar el entorno (cada sesión nueva de PowerShell)

El `PATH` no persiste entre invocaciones separadas del tool PowerShell — repetir al inicio de
cada bloque de comandos que necesite `docker`/`git`:

```powershell
$env:Path = "D:\Docker\Docker\resources\bin;D:\Git\bin;" + $env:Path
Set-Location "D:\15_Codigo_Fuente\GORAZUS"
```

## Diagnóstico general

```powershell
docker version
docker ps
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml ps
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml config --quiet
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml logs <servicio> --tail=100
wsl -l -v
```

## Git

```powershell
git status --short
git branch --show-current
git diff --check
git log --oneline -10
```

## Base de datos (vía contenedor, nunca credenciales en texto plano en el comando)

```powershell
# Estructura/verificación (no requiere contraseña, usa el superusuario del contenedor)
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml exec -T postgres psql -U gorazus_superuser -d gorazus -c "<consulta de solo lectura>"

# Login con contraseña real de .env, sin exponerla en el comando ni en pantalla:
$appPass = (Get-Content ".env" | Select-String -Pattern '^POSTGRES_APP_PASSWORD=(.+)$').Matches[0].Groups[1].Value
$env:PGPASSWORD = $appPass
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml exec -T -e PGPASSWORD postgres psql -U gorazus_app -d gorazus -c "<consulta>"
$env:PGPASSWORD = $null; $appPass = $null
```

## Prisma

```powershell
pnpm db:generate   # regenera los 21 clientes Prisma — seguro, no toca la base
```

**Nunca** ejecutar `pnpm db:pull` sin autorización explícita (ver `docs/DO_NOT_TOUCH.md`).

## Backup

```powershell
node infra/docker/postgres/host-backup.js   # crea un dump verificado en backups/
```

## Comandos de diagnóstico adicionales

```powershell
docker stats <contenedor> --no-stream
docker compose ... exec -T <servicio> ps aux
Test-Path "D:\Docker\wsl-data"
Get-ChildItem "D:\Docker\wsl-data"
node --version
docker compose version
```

## No registrar como recomendados (destructivos — ver docs/DO_NOT_TOUCH.md)

`docker system prune`, `docker volume prune`, `docker builder prune`, `git reset --hard`,
`git clean -f`, `git checkout --`, `pnpm db:pull`, `DROP`/`TRUNCATE` sobre cualquier objeto real,
`cat .env`/`Get-Content .env` sin filtrar.
