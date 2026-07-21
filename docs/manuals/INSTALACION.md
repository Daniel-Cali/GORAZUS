# Manual de Instalación — GORAZUS ERP

> FASE 05 (2026-07-20). Cada paso de este manual fue ejecutado y verificado de verdad esta sesión
> — no es un procedimiento teórico. Cubre instalación local (Docker Compose); Kubernetes
> (staging/production) está en `infra/kubernetes/README.md`, sin cluster real disponible para
> verificar contra él todavía.

## 1. Prerrequisitos

- Docker Desktop (con soporte de contenedores Linux) + Docker Compose v2.
- Node.js ≥20, pnpm ≥9 (`corepack enable` los resuelve automáticamente dentro de los contenedores;
  para correr fuera de Docker con `ts-node` local hace falta tenerlos también en el host).
- OpenSSL (para el certificado autofirmado de desarrollo).
- Git.

## 2. Clonar y configurar

```bash
git clone <repo> GORAZUS && cd GORAZUS
cp .env.example .env
```

Completar en `.env` (ver comentarios de cada variable en el propio archivo):

- `POSTGRES_PASSWORD`, `POSTGRES_APP_PASSWORD`, `POSTGRES_BACKUP_PASSWORD`, `RABBITMQ_PASSWORD`,
  `MINIO_ROOT_PASSWORD`, `PGADMIN_PASSWORD`, `GRAFANA_ADMIN_PASSWORD` — cualquier valor para
  desarrollo local.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — cualquier string largo para desarrollo.
- `NOTIFICATIONS_ENCRYPTION_KEY` — hex de 64 caracteres (32 bytes). Generar con:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `OLLAMA_DEFAULT_MODEL` — cualquier nombre de modelo (p. ej. `llama3.1`); no se descarga
  automáticamente, ver §7.
- **`POSTGRES_USER` debe quedar en `gorazus_superuser`, NUNCA `gorazus_app`** — es el hallazgo
  crítico de seguridad corregido en FASE 05 (`docs/database/SECURITY.md §2`): si coinciden, el rol
  de aplicación termina siendo superusuario real y Row-Level Security deja de aislar nada.

## 3. Certificado HTTPS de desarrollo

```bash
sh infra/nginx/generate-dev-cert.sh
```

Genera `infra/nginx/certs/dev.crt`/`dev.key` (gitignored, nunca se commitea). El navegador va a
marcar el certificado como no confiable (autofirmado) — es esperado en desarrollo local.

## 4. Levantar la infraestructura base

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis rabbitmq minio
```

Esperar a que los 4 healthchecks pasen (`docker compose ps`).

## 5. Aplicar el esquema de base de datos

Los 34 scripts SQL en `docs/database/sql/` se aplican en orden numérico contra `gorazus_superuser`
(el bootstrap, no `gorazus_app` — ese lo crea `30_backup_restore.sql`). **Dos archivos requieren
tolerancia a error conocida y documentada** (`22_seed_data.sql`, `24_views.sql` — ver el propio
`docs/database/sql/32_bugfixes.sql` para el porqué, son estatutos ya corregidos más adelante en la
secuencia, no bugs sin resolver):

```bash
cd docs/database/sql
for f in 01_core.sql 02_security.sql 03_customers.sql 04_suppliers.sql 05_products.sql \
         06_inventory.sql 07_sales.sql 08_purchases.sql 09_cash.sql 10_banks.sql \
         11_accounting.sql 12_taxes.sql 13_hr.sql 14_payroll.sql 15_crm.sql 16_services.sql \
         17_projects.sql 18_assets.sql 19_reports.sql 20_bi.sql 21_configuration.sql; do
  docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus -v ON_ERROR_STOP=1 < "$f"
done

# Estos dos SIN -v ON_ERROR_STOP=1 — algunas filas fallan a propósito, se completan más abajo
docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus < 22_seed_data.sql
docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus < 23_indexes.sql
docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus < 24_views.sql

for f in 25_functions.sql 26_triggers.sql 27_procedures.sql 28_materialized_views.sql \
         29_partitioning.sql 30_backup_restore.sql 31_missing_fk_indexes.sql 32_bugfixes.sql \
         33_partition_provisioning_completion.sql 34_rls_hardening.sql; do
  docker exec -i <contenedor-postgres> psql -U gorazus_superuser -d gorazus -v ON_ERROR_STOP=1 < "$f"
done
```

Verificar el resultado del último script (`34_rls_hardening.sql` debe terminar con
`NOTICE: 34_rls_hardening: OK`). Confirmar:

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'gorazus_app';
-- debe dar: f, f
```

Setear la contraseña real de `gorazus_app` (el script SQL la deja `NULL` a propósito, ver
`30_backup_restore.sql`):

```sql
ALTER ROLE gorazus_app PASSWORD '<mismo valor que POSTGRES_APP_PASSWORD en .env>';
ALTER ROLE gorazus_backup PASSWORD '<mismo valor que POSTGRES_BACKUP_PASSWORD en .env>';
```

## 6. Sembrar RBAC y un tenant/usuario de prueba

`seed-rbac.ts` siembra el catálogo de permisos + rol Administrador, pero necesita un tenant y un
usuario ya existentes para asignárselo — no crea ninguno de los dos (ver el script para el porqué).
Crear un tenant `demo` + usuario admin a mano (o adaptar a datos reales):

```sql
WITH new_tenant AS (SELECT gen_random_uuid() AS tid)
INSERT INTO core.tenants (id, tenant_id, legal_name, slug, contact_email, status, created_by)
SELECT tid, tid, 'Mi Empresa', 'mi-empresa', 'admin@mi-empresa.local', 'active',
       '00000000-0000-0000-0000-000000000001'
FROM new_tenant;

-- Password hasheada con argon2id — generar con:
-- node -e "require('argon2').hash('MiPassword123!',{type:1}).then(console.log)"
INSERT INTO core.users (id, tenant_id, email, password_hash, full_name, is_active, created_by)
SELECT gen_random_uuid(), t.id, 'admin@mi-empresa.local', '<hash argon2id>', 'Admin', true,
       '00000000-0000-0000-0000-000000000001'
FROM core.tenants t WHERE t.slug = 'mi-empresa';
```

```bash
export DATABASE_URL="postgresql://gorazus_app:<password>@localhost:5432/gorazus?schema=core"
npx ts-node --transpile-only modules/seguridad/backend/scripts/seed-rbac.ts mi-empresa admin@mi-empresa.local
```

## 7. Levantar la aplicación completa

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build api web nginx
```

Verificar:

```bash
curl -k https://localhost/api/v1/health/live   # {"status":"ok"}
curl -k https://localhost/                     # HTML de apps/web
```

Login real: entrar a `https://localhost/login` con el tenant/email/password sembrados en el §6.

## 8. Opcional — monitoreo, backups, IA

```bash
# Prometheus + Grafana + Loki (Grafana en :3001, admin / $GRAFANA_ADMIN_PASSWORD)
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d

# Backup automático (ya corre solo, diario — ver infra/postgres/backup/)
docker compose -f docker-compose.yml up -d backup

# Ollama (infraestructura de IA, sin modelo descargado por defecto)
docker compose -f docker-compose.yml up -d ollama
docker exec -it <contenedor-ollama> ollama pull llama3.1
```

## 9. Verificación completa (opcional)

```bash
# Tests unitarios/e2e de backend (contra la misma base, no una aislada — ver limitación conocida)
export DATABASE_URL="postgresql://gorazus_app:<password>@localhost:5432/gorazus?schema=core"
npx jest --config modules/auth/backend/jest.config.ts --rootDir modules/auth/backend
npx jest --config modules/seguridad/backend/jest.config.ts --rootDir modules/seguridad/backend

# E2E de navegador real (requiere el tenant "demo"/"admin@demo.local" — ajustar env vars si se usó otro)
cd apps/web-e2e
PLAYWRIGHT_BROWSERS_PATH="$PWD/../../.playwright-browsers" E2E_BASE_URL=https://localhost npx playwright test

# Testing de carga (opcional, ver infra/k6/README.md — el rate limiter de la API responde 429 bajo carga sostenida, es esperado)
docker run --rm -i --network <red-del-compose> -e BASE_URL=https://nginx grafana/k6 run --insecure-skip-tls-verify - < infra/k6/smoke.js
```
