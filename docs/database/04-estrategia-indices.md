# 04 — Estrategia de Índices

## 1. Principio general

Con 100M+ registros y miles de usuarios concurrentes, el índice
equivocado (o el índice de más) es tan costoso como no tenerlo: cada
índice adicional ralentiza todo `INSERT`/`UPDATE` y consume memoria de
caché que compite con los índices que sí importan. La estrategia no es
"indexar todo" — es indexar exactamente los patrones de acceso reales
del [modelo lógico](./02-modelo-logico.md).

## 2. Índice base obligatorio: el prefijo de aislamiento

Toda tabla de negocio tiene, como mínimo, este índice compuesto:

```sql
CREATE INDEX idx_<tabla>_tenant_scope
  ON <schema>.<tabla> (tenant_id, company_id, branch_id)
  WHERE deleted_at IS NULL;
```

- Es un **índice parcial** (`WHERE deleted_at IS NULL`): la inmensa
  mayoría de las consultas de la aplicación solo ven registros vivos —
  el índice parcial es más chico, más rápido y no indexa basura lógica.
- El orden `tenant_id, company_id, branch_id` sigue la cardinalidad de
  filtrado real: toda query de la aplicación ya trae `tenant_id` fijo
  por RLS (ver
  [06-estrategia-seguridad.md](./06-estrategia-seguridad.md)); este
  índice acelera el filtro adicional de empresa/sucursal sin duplicar
  el trabajo que RLS ya hace a nivel de política.

## 3. Claves foráneas: no todas se indexan igual

- **FK hacia la entidad padre directa de un documento** (`invoice_id`
  en `invoice_lines`, `sales_order_id` en `sales_order_lines`): siempre
  indexada — es el patrón de acceso más común (traer todas las líneas
  de un documento).
- **FK universales hacia `core.users`** (`created_by`, `updated_by`,
  `deleted_by`): **no** se indexan por defecto. Se consultan
  esporádicamente (auditoría puntual), nunca en el camino caliente de
  la aplicación — indexarlas de forma pareja en 494 tablas sería puro
  costo de escritura sin beneficio de lectura real.
- **FK hacia catálogos de baja cardinalidad** (`account_type_id` con 5
  valores posibles): no se indexan solas — Postgres no las usaría de
  todos modos con selectividad tan baja; participan en índices
  compuestos cuando el patrón de consulta real lo justifica.
- **Regla de decisión**: se indexa una FK cuando existe una consulta
  real y frecuente de la forma `SELECT ... WHERE fk_column = ?` — no
  por la presencia de la FK en sí.

## 4. Índices por tipo de dato y patrón de acceso

| Patrón                                                         | Tipo de índice                                               | Ejemplo                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Igualdad sobre columna de baja/media cardinalidad              | B-tree estándar                                              | `invoice_status_id` en `invoices`                                                                                                                                  |
| Búsqueda de texto libre (nombre de cliente/producto)           | GIN + `pg_trgm`                                              | `customers.customers (name gin_trgm_ops)`                                                                                                                          |
| Filtro/consulta sobre `metadata JSONB`                         | GIN (`jsonb_ops` o `jsonb_path_ops` si solo se usa `@>`)     | `products.products USING GIN (metadata jsonb_path_ops)`                                                                                                            |
| Rango de fechas sobre tablas de solo-inserción de gran volumen | BRIN (Block Range Index)                                     | `inventory.stock_movements (created_at)`, `core.audit_logs (created_at)` — mucho más liviano que B-tree para datos append-only ordenados físicamente por inserción |
| Unicidad de negocio (SKU, número de comprobante por serie)     | Índice único parcial                                         | `sales.invoices (company_id, branch_id, series_id, document_number) WHERE deleted_at IS NULL`                                                                      |
| Búsqueda geográfica (visitas, rutas)                           | GiST sobre tipo `point`/`geography` (si se habilita PostGIS) | `customers.customer_visits (location)` — evaluado en fase de implementación, no bloqueante para v1                                                                 |
| Cobertura de query frecuente sin tocar la tabla                | Índice `INCLUDE`                                             | `sales.invoices (customer_id) INCLUDE (total_amount, invoice_date)` para el estado de cuenta                                                                       |

## 5. Índices únicos de negocio (no solo PK)

La `id UUID` es la PK técnica, pero cada tabla con una clave de negocio
real lleva su propio índice único parcial, con alcance de tenant:

```sql
CREATE UNIQUE INDEX uq_products_sku
  ON products.products (tenant_id, company_id, sku)
  WHERE deleted_at IS NULL;
```

Esto es lo que impide, por ejemplo, dos productos con el mismo SKU
activos en la misma empresa — un UUID único no lo garantiza por sí
solo.

## 6. Tablas de altísimo volumen: qué NO se indexa igual

`inventory.stock_movements`, `core.audit_logs`,
`accounting.journal_entry_lines`, `sales.invoice_lines` son las
candidatas naturales a superar 100M de filas primero. Ahí:

- Se prioriza BRIN sobre B-tree para `created_at` (ver tabla arriba).
- No se agregan índices "por si acaso" — cada índice nuevo en estas
  tablas se justifica con un plan de ejecución real (`EXPLAIN ANALYZE`)
  antes de crearse, no antes.
- Ver particionamiento (que reduce la necesidad de indexar tan
  agresivamente, porque cada partición ya es más chica) en
  [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md).

## 7. Índices GIN sobre `metadata JSONB`

`metadata` existe para extensión, no para consulta frecuente (ver
[01-modelo-conceptual §1.3](./01-modelo-conceptual.md#13-cuándo-usar-metadata-jsonb-y-cuándo-no)).
Por eso **no** todas las tablas indexan `metadata` — solo aquellas
donde ya se identificó un patrón de filtro real sobre extensión
(catálogos de `products`, `configuration`). Cuando se indexa, se usa
`jsonb_path_ops` (más chico, soporta `@>`) en vez de `jsonb_ops`
(soporta más operadores pero pesa más) salvo que se necesite búsqueda
por existencia de clave (`?`).

## 8. Convención de nombres

`idx_<schema>_<tabla>_<columnas_abreviadas>` para índices normales,
`uq_<schema>_<tabla>_<columnas>` para únicos,
`pk_<schema>_<tabla>` para primary keys nombradas explícitamente
(nunca el nombre autogenerado de Postgres, para que sea estable entre
motores en la fase de portabilidad).

## 9. Mantenimiento

- `autovacuum` ajustado de forma más agresiva (`autovacuum_vacuum_scale_factor`
  reducido) en las tablas de alto volumen de escritura/borrado lógico —
  el patrón `UPDATE ... SET deleted_at = now()` genera bloat que hay
  que controlar activamente.
- Monitoreo mensual de índices no utilizados (`pg_stat_user_indexes`)
  y de bloat de índice, con `REINDEX CONCURRENTLY` programado fuera de
  horario pico — nunca `REINDEX` bloqueante en producción.
- Todo índice nuevo en una tabla con datos existentes se crea con
  `CREATE INDEX CONCURRENTLY` — nunca bloqueando escrituras.

## 10. Notas de portabilidad

BRIN, índices parciales con `WHERE`, `INCLUDE` e índices funcionales
sobre expresiones son features de Postgres sin equivalente directo en
MySQL/MariaDB (usan solo B-tree/Hash/Fulltext) ni en SQL Server (que sí
tiene índices filtrados, similares a los parciales, pero no BRIN). Al
portar, las tablas de alto volumen pierden la ventaja de BRIN y
requieren revisar el particionamiento como mitigación principal.
