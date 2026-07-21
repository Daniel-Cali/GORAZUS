# 06 — Estrategia de Seguridad

## 1. Row-Level Security: el mecanismo central de aislamiento multiempresa

`tenant_id`/`company_id`/`branch_id` en cada tabla (ver
[01-modelo-conceptual](./01-modelo-conceptual.md)) son **inútiles como
control de seguridad si dependen de que la aplicación nunca se
olvide de un `WHERE`**. La garantía real es RLS a nivel de Postgres:

```sql
ALTER TABLE sales.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON sales.invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY company_isolation ON sales.invoices
  USING (
    company_id IS NULL
    OR company_id = ANY (
      string_to_array(current_setting('app.current_company_ids'), ',')::uuid[]
    )
  );
```

- `app.current_tenant_id` y `app.current_company_ids` se setean una vez
  por conexión/transacción desde `core/http` (el `TenantInterceptor` de
  [05-flujo-de-datos.md](../architecture/05-flujo-de-datos.md)) — nunca
  confiados desde un parámetro que el cliente HTTP pueda manipular.
- **RLS se habilita en las 494 tablas sin excepción** (ver
  [29_partitioning.sql](./sql/29_partitioning.sql) para la interacción
  con tablas particionadas — la política se hereda a cada partición).
  Los catálogos globales de `configuration` usan la misma política:
  como su `tenant_id` es el sentinela del sistema, la política incluye
  `OR tenant_id = '00000000-0000-0000-0000-000000000000'` para que todo
  tenant vea los catálogos compartidos sin excepción especial en el
  código de aplicación.
- Esto convierte un bug de aplicación (olvidar filtrar por tenant) de
  "fuga de datos entre clientes" a "cero filas devueltas" — el peor
  caso posible pasa de catastrófico a inofensivo.

## 2. Roles de base de datos: privilegio mínimo

| Rol                    | Uso                                                                                                    | Privilegios                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gorazus_app`          | Conexión de `apps/api` en producción                                                                   | `SELECT/INSERT/UPDATE/DELETE` en schemas de negocio, sujeto a RLS. Sin `DROP`/`ALTER`/`TRUNCATE`.                                                                                                                                  |
| `gorazus_migrator`     | Aplicación de los archivos `sql/*.sql` versionados                                                     | DDL completo. Nunca usado por la aplicación en tiempo de ejecución, solo por el pipeline de despliegue.                                                                                                                            |
| `gorazus_readonly`     | Réplicas de lectura, BI, reportes (ver [09-estrategia-replicacion.md](./09-estrategia-replicacion.md)) | Solo `SELECT`, sujeto a RLS igual que `gorazus_app`.                                                                                                                                                                               |
| `gorazus_backup`       | Proceso de respaldo                                                                                    | `pg_read_all_data` o equivalente mínimo para `pg_dump`/WAL archiving — sin acceso a datos vía SQL normal.                                                                                                                          |
| `gorazus_audit_writer` | Función/trigger de auditoría (`SECURITY DEFINER`)                                                      | `INSERT` únicamente en `core.audit_logs`/`change_history`, ni siquiera `gorazus_app` tiene `UPDATE`/`DELETE` ahí (ver [05-estrategia-auditoria.md §2](./05-estrategia-auditoria.md#2-coreaudit_logs-captura-genérica-de-cambios)). |

Ningún rol de aplicación tiene privilegio de superusuario ni de
`BYPASSRLS` — ni siquiera para debugging; el acceso de excepción pasa
por `gorazus_migrator` con auditoría de sesión reforzada.

## 3. Cifrado

- **En tránsito**: `sslmode=verify-full` obligatorio en todas las
  conexiones — sin excepción ni en entornos internos.
  Certificados gestionados vía el KMS de la infraestructura, rotados
  automáticamente.
- **En reposo, a nivel de volumen**: cifrado de disco del proveedor de
  infraestructura (estándar, transparente a Postgres).
- **En reposo, a nivel de columna**: campos de sensibilidad alta que
  ameritan cifrado adicional más allá del volumen —
  `customers.customer_bank_accounts`, `suppliers.supplier_bank_accounts`,
  `hr.employees` (identificación personal), `security.integration_credentials`
  — cifrados con `pgcrypto` (`pgp_sym_encrypt`) usando una clave
  gestionada por `security.data_encryption_keys` (metadato de
  referencia, la clave real vive en un KMS externo, nunca en la base).
- Las claves de cifrado rotan según
  `security.encryption_key_rotations`, sin tiempo de inactividad
  (cifrado con clave nueva, descifrado válido con clave anterior
  durante la ventana de rotación).

## 4. Gestión de secretos

Ningún secreto (contraseña, API key, credencial de integración) se
guarda en texto plano en ninguna tabla. `security.integration_credentials`
guarda el secreto cifrado; `core.api_keys` guarda solo el hash
(`argon2id`) de la clave, igual que `core.users` con contraseñas — el
valor en texto plano se muestra una única vez al usuario en el momento
de creación y nunca se puede recuperar, solo regenerar.

## 5. Enmascaramiento de datos para entornos no productivos

`staging`/`local` (ver
[08-infraestructura-y-despliegue.md](../architecture/08-infraestructura-y-despliegue.md#6-entornos))
nunca reciben un dump directo de producción sin pasar por un pipeline
de anonimización: nombres/identificaciones fiscales/direcciones se
sustituyen por datos sintéticos preservando forma y distribución
estadística (útil para probar performance), montos se escalan con
ruido aleatorio. Esto es una función SQL dedicada (ver
[25_functions.sql](./sql/25_functions.sql)), no un paso manual.

## 6. Prevención de inyección y superficie de ataque

Responsabilidad primaria de la capa de aplicación (Prisma parametriza
por defecto, ver
[docs/architecture](../architecture/02-arquitectura-modulos-backend.md)),
pero la base de datos no depende únicamente de eso: ninguna función
`SECURITY DEFINER` construye SQL dinámico por concatenación de texto de
usuario — siempre `format()` con `%L`/`%I` o parámetros tipados.

## 7. Notas de portabilidad

RLS con esta expresividad es una feature nativa de PostgreSQL sin
equivalente directo. SQL Server tiene Row-Level Security con sintaxis
distinta pero conceptualmente equivalente (funciones de predicado de
seguridad). MySQL/MariaDB **no tienen RLS nativo** — portar exige
mover el filtro de tenant a una capa de vista obligatoria
(`CREATE VIEW` con `WHERE` fijo) o de vuelta a disciplina de aplicación
reforzada con tests, perdiendo la garantía a nivel de motor. Esto se
documenta como el mayor riesgo de portabilidad de todo el diseño.
