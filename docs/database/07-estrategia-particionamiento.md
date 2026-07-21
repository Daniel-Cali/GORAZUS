# 07 — Estrategia de Particionamiento

## 1. Qué se particiona y qué no

Particionar todo por igual es tan equivocado como no particionar nada.
Se particiona únicamente donde hay un patrón de acceso que se
beneficia realmente: tablas de **alto volumen de escritura append-only**
donde las consultas casi siempre filtran por un rango reciente, y donde
la retención/purga por antigüedad es una operación de negocio real
(no solo técnica).

| Tabla                                                | Estrategia                                                                                         | Clave                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `core.audit_logs`                                    | `RANGE` mensual                                                                                    | `occurred_at`                                   |
| `core.system_logs`                                   | `RANGE` mensual                                                                                    | `created_at`                                    |
| `core.activity_logs`                                 | `RANGE` mensual                                                                                    | `created_at`                                    |
| `core.notification_delivery_logs`                    | `RANGE` mensual                                                                                    | `created_at`                                    |
| `security.login_attempts`                            | `RANGE` mensual                                                                                    | `created_at`                                    |
| `security.session_activity_logs`                     | `RANGE` mensual                                                                                    | `created_at`                                    |
| `inventory.stock_movements`                          | `RANGE` mensual                                                                                    | `created_at`                                    |
| `accounting.journal_entries` + `journal_entry_lines` | `RANGE` anual (alineado a ejercicio fiscal)                                                        | `posting_date`                                  |
| `sales.invoice_lines`                                | `RANGE` anual                                                                                      | `created_at` (vía la fecha de la factura padre) |
| `crm.call_logs` / `email_logs` / `whatsapp_logs`     | `RANGE` mensual                                                                                    | `created_at`                                    |
| `core.business_rule_evaluations`                     | `RANGE` mensual                                                                                    | `created_at`                                    |
| `core.background_jobs`                               | `RANGE` mensual                                                                                    | `created_at`                                    |
| `assets.asset_depreciation_entries`                  | `RANGE` anual (alineado a ejercicio fiscal, mismo criterio que `journal_entries`)                  | `created_at`                                    |
| `inventory.production_consumptions`                  | `RANGE` mensual (mismo criterio que `stock_movements` — volumen de ejecución, no de cierre fiscal) | `created_at`                                    |
| `services.service_visits`                            | `RANGE` mensual (volumen de ejecución de campo)                                                    | `created_at`                                    |
| `services.service_parts_consumed`                    | `RANGE` mensual (mismo criterio que `production_consumptions`)                                     | `created_at`                                    |
| `projects.project_timesheets`                        | `RANGE` mensual (volumen de ejecución, un parte de horas por empleado/tarea/día)                   | `created_at`                                    |
| `projects.project_costs`                             | `RANGE` mensual (mismo criterio que `service_parts_consumed`)                                      | `created_at`                                    |
| `taxes.withholding_certificates`                     | `RANGE` mensual (un certificado por pago/factura retenida — volumen de ejecución)                  | `created_at`                                    |

Las dos últimas se agregaron junto con el Core Platform
([32-core-platform/05](./../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#1-business-rules-engine)
y [32-core-platform/08](./../architecture/32-core-platform/08-frameworks-de-infraestructura.md#6-background-jobs)):
mismo patrón append-only con retención corta que `crm.call_logs` — cada
evaluación de regla y cada ejecución de trabajo asíncrono es un evento
puntual, no un registro que se consulte por su antigüedad completa.

**No** se particionan: tablas de catálogo/maestro (`products.products`,
`customers.customers`, `configuration.*`) ni tablas de saldo actual
(`inventory.stock`) — su volumen crece con el número de entidades de
negocio, no con el tiempo, y sus consultas no siguen un patrón de rango
reciente.

## 2. Por qué `RANGE` y no `HASH` por defecto

`RANGE` sobre una columna de fecha da **partition pruning** real: una
consulta de reportes de "este mes" solo toca una partición, no 494GB
de historia. `HASH` distribuye uniformemente pero no acelera ninguna
consulta típica de este dominio (nadie consulta "el hash 7 de los
movimientos de stock"). `HASH` se reserva como técnica de segundo nivel
(ver §4) para el caso específico de un tenant desproporcionadamente
grande.

## 3. Automatización de particiones

Ninguna partición se crea a mano. `core.scheduled_jobs` ejecuta
mensualmente (o anualmente, según la tabla) la creación de la partición
siguiente con antelación de un período completo — nunca reactivamente
el mismo día que se necesita. Implementado con `pg_partman` (extensión
estándar de gestión de particiones de Postgres) en vez de lógica ad-hoc,
por confiabilidad y por ser la herramienta de facto de la comunidad
para este problema. Ver el detalle de creación/mantenimiento en
[29_partitioning.sql](./sql/29_partitioning.sql).

## 4. Sub-particionamiento por tenant (técnica de escape, no default)

Si un tenant específico concentra un volumen desproporcionado en una
tabla particionada por fecha (el "vecino ruidoso" de una base
multi-tenant), la mitigación es sub-particionar esa tabla puntual con
`HASH(tenant_id)` dentro de cada partición de rango de fecha
(particionamiento compuesto, soportado nativamente por Postgres desde
la v11). **No se activa preventivamente** en las 494 tablas — se activa
quirúrgicamente sobre la tabla y el tenant que lo justifiquen con datos
reales de producción.

## 5. Interacción con RLS, FK e índices

- Las políticas de RLS (ver
  [06-estrategia-seguridad.md](./06-estrategia-seguridad.md)) se
  definen una vez sobre la tabla particionada raíz y se heredan
  automáticamente a cada partición — no se redefinen partición por
  partición.
- Los índices declarados en la definición de la tabla particionada
  (`23_indexes.sql`) se propagan como índices locales a cada partición
  automáticamente.
- Las FK **hacia** una tabla particionada requieren que la clave de
  partición forme parte de la PK/UNIQUE referenciada (limitación de
  Postgres) — se documenta explícitamente en cada tabla particionada
  del [modelo lógico](./02-modelo-logico.md) dónde esto obliga a una
  FK compuesta en vez de solo `id`.

## 6. Retención y archivado

Cada tabla particionada tiene una política de retención asociada en
`core.data_retention_policies` (ver
[05-estrategia-auditoria.md §6](./05-estrategia-auditoria.md#6-retención-y-purga)).
Cuando una partición completa queda fuera de la ventana de retención
activa, se **desconecta** (`DETACH PARTITION`, operación instantánea,
sin bloquear el resto de la tabla) y se archiva a almacenamiento frío
antes de eliminarse — nunca se hace `DELETE` fila por fila sobre datos
históricos masivos. Detalle en
[08-estrategia-respaldo.md §4](./08-estrategia-respaldo.md#4-archivado-en-frío).

## 7. Notas de portabilidad

MySQL 8/MariaDB soportan `RANGE`/`HASH` partitioning nativo con
sintaxis distinta pero conceptos equivalentes; ambos tienen
limitaciones más estrictas sobre claves únicas en tablas particionadas
que Postgres. SQL Server usa "partitioned tables" con un esquema y
función de partición separados (paradigma distinto pero con el mismo
resultado). `pg_partman` es exclusivo de Postgres — al portar, la
automatización de creación/rotación de particiones se reimplementa con
el scheduler nativo de cada motor (`pg_cron` no aplica; MySQL usa
`information_schema` + eventos programados, SQL Server usa SQL Agent).
