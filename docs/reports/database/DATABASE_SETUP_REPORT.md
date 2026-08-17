# Informe de Configuración de Base de Datos — GORAZUS ERP

> Sesión de verificación del 2026-07-24. La base de datos **ya estaba completamente operativa**
> desde sesiones anteriores (Docker arriba, esquema de 34 scripts SQL ya aplicado, tenant `demo`
> sembrado) — este informe documenta la verificación exhaustiva realizada, no una instalación desde
> cero. No se modificó ningún schema, ninguna tabla, ninguna regla de negocio ni código de
> aplicación — regla explícita de esta fase.

## 1. Cómo se determinó la configuración esperada (Paso 1)

Inspección automática del repositorio:

| Archivo                                                  | Hallazgo                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `.env`                                                   | `POSTGRES_USER=gorazus_superuser`, `POSTGRES_DB=gorazus`, `DATABASE_URL` apunta a `localhost:5432`                    |
| `infra/docker/docker-compose.yml`                        | Servicio `postgres`, imagen propia `gorazus-postgres17-partman:local` (Postgres 17 + pg_partman)                      |
| `infra/docker/docker-compose.dev.yml`                    | Mapea el puerto `5432:5432` al host — acceso directo para clientes SQL locales, comentario explícito menciona DBeaver |
| `infra/docker/postgres/Dockerfile`                       | `FROM postgres:17` + extensión `postgresql-17-partman`                                                                |
| `core/database/prisma/schema.prisma`                     | Generado por introspección (`prisma db pull`), 21 schemas de negocio declarados                                       |
| `docs/database/sql/01_core.sql` … `34_rls_hardening.sql` | 34 scripts SQL numerados — el esquema real, no Prisma Migrate                                                         |
| `docs/manuals/INSTALACION.md`                            | Procedimiento completo y ya verificado de instalación (§4 y §5 son los pasos de base de datos)                        |

**Conclusión**: el proyecto no usa Prisma Migrate — el esquema completo (tablas, índices, vistas,
funciones, triggers, particionamiento, RLS) se aplica ejecutando los 34 scripts SQL en orden
numérico contra el rol `gorazus_superuser`. Prisma se usa solo como cliente de acceso a datos
(`schema.prisma` generado por introspección de la base ya existente, no al revés).

## 2. Estado de PostgreSQL (Paso 2)

| Ítem                  | Valor                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| ¿Instalado?           | Sí — como contenedor Docker (`gorazus-postgres17-partman:local`), no como instalación nativa de Windows |
| ¿Corriendo?           | **Sí** — `docker-postgres-1`, `Up 15 hours (healthy)` al momento de esta verificación                   |
| Versión               | **PostgreSQL 17.10** (Debian 17.10-1.pgdg13+1)                                                          |
| Puerto                | **5432** (mapeado al host, `0.0.0.0:5432->5432/tcp`)                                                    |
| Usuario administrador | `gorazus_superuser`                                                                                     |
| Usuario de aplicación | `gorazus_app` (sin privilegios de superusuario, sin bypass de RLS — verificado)                         |
| Base de datos         | `gorazus`                                                                                               |

No hizo falta iniciar nada — el contenedor ya estaba arriba y saludable. Se verificó igual la
versión, el puerto y los roles en vivo (no se asumió nada de sesiones anteriores).

## 3. Estado del esquema (Paso 3)

La base `gorazus` ya existía con el esquema completo aplicado. Verificado en vivo, no asumido:

| Métrica                                        | Valor                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Esquemas de negocio                            | **21** (`accounting`, `assets`, `banks`, `bi`, `cash`, `configuration`, `core`, `crm`, `customers`, `hr`, `inventory`, `payroll`, `products`, `projects`, `purchases`, `reports`, `sales`, `security`, `services`, `suppliers`, `taxes`) + `partman` (control interno de particiones) + `public` |
| Tablas lógicas (sin contar particiones hijas)  | **530** = 501 de negocio + 29 propias de `pg_partman`                                                                                                                                                                                                                                            |
| Tablas físicas totales (incluidas particiones) | 730 (530 lógicas + 200 particiones hijas ya provisionadas automáticamente)                                                                                                                                                                                                                       |
| Vistas                                         | 10                                                                                                                                                                                                                                                                                               |
| Vistas materializadas                          | 4                                                                                                                                                                                                                                                                                                |
| Funciones                                      | 122                                                                                                                                                                                                                                                                                              |
| Triggers                                       | 2.414                                                                                                                                                                                                                                                                                            |
| Extensiones                                    | 4 — `pg_partman` 5.4.3, `pg_trgm` 1.6, `pgcrypto` 1.3, `plpgsql` 1.0                                                                                                                                                                                                                             |
| Tamaño de la base                              | 79 MB                                                                                                                                                                                                                                                                                            |

Los 34 scripts SQL (`docs/database/sql/01_core.sql` … `34_rls_hardening.sql`) ya estaban aplicados
— confirmado indirectamente (no había ningún log de migración que leer, ver §1) verificando que
**todo lo que cada script debía dejar existe realmente**: vistas (script 24), funciones (25),
triggers (26), vistas materializadas (28), particionamiento activo con `pg_partman` (29), rol
`gorazus_backup` con `BYPASSRLS` (30), y RLS forzado en 473 tablas (34). No fue necesario ejecutar
ningún script — ninguna tabla, función, vista, índice o trigger esperado faltaba.

El tenant de prueba `demo` y el usuario `admin@demo.local` (sembrados en una sesión anterior, §6
del manual de instalación) siguen presentes y activos.

## 4. Validación (Paso 4)

| Chequeo                                                                                                     | Resultado                                                                               |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Conexión TCP real (`localhost:5432`, mismo `DATABASE_URL` del `.env`, vía el cliente Prisma real de la app) | ✅ Conectó como `gorazus_app`, `current_database() = gorazus`                           |
| FKs sin validar (`pg_constraint.convalidated = false`)                                                      | ✅ 0                                                                                    |
| Índices inválidos (`pg_index.indisvalid = false`)                                                           | ✅ 0                                                                                    |
| `gorazus_app` — `rolsuper` / `rolbypassrls`                                                                 | ✅ `f` / `f` (regla de seguridad de `docs/database/SECURITY.md §2`, verificada en vivo) |
| `gorazus_backup` — `rolbypassrls`                                                                           | ✅ `t` (correcto, es el rol de respaldo)                                                |
| RLS forzado                                                                                                 | ✅ 473 tablas con `relrowsecurity` y `relforcerowsecurity` activos                      |
| `USAGE` de `gorazus_app` sobre los 21 schemas de negocio + `public`                                         | ✅ Todos `true`                                                                         |
| `USAGE` de `gorazus_app` sobre `partman`                                                                    | ✅ `false` (correcto — es control interno, la app no debe tocarlo)                      |
| `npx prisma validate` (versión fijada del proyecto, **5.22.0**, no la última de npm)                        | ✅ `El schema es válido`                                                                |
| Drift de schema (`prisma db pull --print` comparado contra `core/database/prisma/schema.prisma` commiteado) | 🟡 **1 diferencia real, ya documentada** — ver §6                                       |

**Nota sobre la primera corrida de `prisma validate`**: el primer intento con `npx prisma`
(sin pin) descargó Prisma 7.9.0 de npm y falló — pero el proyecto usa **Prisma 5.22.0**
(`core/database/package.json`), una versión con sintaxis de `datasource` distinta. Se descartó ese
resultado (falso negativo por versión incorrecta, no un problema real) y se repitió con el binario
local del proyecto, que sí validó correctamente. Se deja documentado para no repetir la confusión.

## 5. Conexión desde DBeaver (Paso 5)

**DBeaver no está instalado en esta máquina** (verificado, no se encontró ni el ejecutable ni una
carpeta de configuración) — no se pudo abrir la aplicación para confirmar visualmente la conexión
dentro de su interfaz. En su lugar, se verificó la conectividad real end-to-end por el mismo canal
que DBeaver usaría (TCP a `localhost:5432`, mismas credenciales, protocolo de cable de Postgres) —
ver §4. Cuando se instale DBeaver, estos datos crean la conexión sin ajustes adicionales:

| Campo                    | Valor                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host**                 | `localhost`                                                                                                                                                     |
| **Puerto**               | `5432`                                                                                                                                                          |
| **Base de datos**        | `gorazus`                                                                                                                                                       |
| **Usuario**              | `gorazus_app` (uso normal de la aplicación) **o** `gorazus_superuser` (para ver todo sin restricción de RLS, recomendado para inspección/administración)        |
| **Contraseña**           | `gorazus_dev_local` (ambos roles, ver `.env` — `POSTGRES_APP_PASSWORD`/`POSTGRES_PASSWORD`)                                                                     |
| **SSL**                  | Deshabilitado (`sslmode=disable`) — el servidor de Postgres corre con `ssl = off` en este entorno local; DBeaver debe usar "Disable" o "Allow", nunca "Require" |
| **Driver**               | PostgreSQL (driver JDBC estándar que trae DBeaver por defecto — no hace falta ninguno adicional)                                                                |
| **URL JDBC equivalente** | `jdbc:postgresql://localhost:5432/gorazus`                                                                                                                      |

**Recomendación de usuario según el propósito**: usar `gorazus_superuser` para explorar el modelo
de datos completo sin las restricciones de Row-Level Security (RLS) que aplican por tenant — con
`gorazus_app`, cada consulta queda filtrada por el tenant activo de la sesión (`SET
app.current_tenant_id`), que DBeaver no configura solo, así que las tablas se verían vacías o
incompletas sin ese paso manual extra.

## 6. Salud de la base de datos (Paso 6)

| Categoría                                                         | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tablas faltantes                                                  | Ninguna de las 501 tablas de negocio esperadas falta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Errores de migración                                              | No aplica (no hay historial de migraciones que leer, ver §1) — verificación estructural sin errores                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Extensiones faltantes                                             | Ninguna — las 4 esperadas están instaladas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Problemas de permisos                                             | Ninguno — `gorazus_app` tiene exactamente el acceso que debería (§4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Foreign Keys rotas                                                | Ninguna — 0 no validadas de 5.164 totales                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Problemas de conexión                                             | Ninguno                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 🟡 **Hallazgo real (menor, ya documentado antes de esta sesión)** | `core.restore_test_logs` existe en la base real (creada por `30_backup_restore.sql`, guarda el log de pruebas de restore automatizadas) pero **no está en `core/database/prisma/schema.prisma`** — confirmado con `prisma db pull --print` comparado contra el archivo commiteado, único modelo de diferencia en las 530 tablas lógicas. También tiene RLS deshabilitado (`relrowsecurity = false`), consistente con `PROJECT_STATUS.md §7` y `TECHNICAL_DEBT.md`, que ya listaban este mismo gap. No es nuevo, no se corrigió acá — modificar `schema.prisma` o el schema de base de datos está fuera de las reglas de esta fase. |

**No se encontró ningún problema que requiriera arreglo.** La base de datos ya estaba
completamente operativa; esta sesión fue de verificación exhaustiva, no de reparación.

## 7. Resumen para el reporte pedido

- **Versión de PostgreSQL**: 17.10
- **Nombre de la base de datos**: `gorazus`
- **Total de schemas**: 21 de negocio + `partman` + `public` (23 en total, sin contar `pg_catalog`/`information_schema`)
- **Total de tablas**: 530 lógicas (501 de negocio + 29 de `pg_partman`), 730 físicas contando particiones
- **Total de índices**: 3.204
- **Total de Foreign Keys**: 5.164 (100% validadas)
- **Total de migraciones ejecutadas**: 34 scripts SQL (`01_core.sql`–`34_rls_hardening.sql`), todos ya aplicados y verificados estructuralmente
- **Problemas encontrados**: 1 (menor, ya documentado — `restore_test_logs` fuera del `schema.prisma`)
- **Problemas corregidos**: 0 (nada estaba roto; el hallazgo de arriba es una brecha de documentación/mapeo ORM ya conocida, no un defecto de la base)
- **Información de conexión para DBeaver**: ver §5
