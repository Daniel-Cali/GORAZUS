# Index Catalog — GORAZUS

> Generado 2026-07-17 (PHASE 01 — Database Enterprise) desde `pg_indexes`/`pg_index`
> reales. Complementa — no repite — la estrategia ya fijada en
> `docs/database/04-estrategia-indices.md` (qué se indexa, por qué, con qué tipo) y
> `docs/database/02a-restricciones-e-indices.md §5` (regla por rol de tabla): este
> documento es el **inventario verificado** después de cerrar el gap real encontrado
> en esta fase (575 columnas FK de negocio sin índice de soporte). Conteos excluyen
> las ~200 tablas físicas de partición (cada partición hereda automáticamente los
> índices de su tabla padre, no se cuentan aparte — ver `docs/database/07-estrategia-particionamiento.md §5`).

## 1. Resumen por tipo

| Tipo de índice    | Cantidad (lógica)                                                                                                  | Uso                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| B-tree            | 2,932                                                                                                              | Default — PK, únicos, FK, filtros de igualdad/rango                |
| GIN (+ `pg_trgm`) | 9                                                                                                                  | Búsqueda de texto libre (`docs/database/04-estrategia-indices.md`) |
| BRIN              | 7                                                                                                                  | Tablas de alto volumen append-only filtradas por fecha             |
| **Total**         | **2,201 índices únicos** (algunas filas cuentan un índice en más de un tipo agregado arriba por columna compuesta) | —                                                                  |

## 2. Resumen por schema

| Schema          | Índices |
| --------------- | ------- |
| `core`          | 292     |
| `sales`         | 242     |
| `inventory`     | 165     |
| `products`      | 163     |
| `hr`            | 121     |
| `purchases`     | 123     |
| `payroll`       | 94      |
| `configuration` | 93      |
| `security`      | 98      |
| `crm`           | 82      |
| `services`      | 82      |
| `customers`     | 81      |
| `projects`      | 76      |
| `taxes`         | 57      |
| `suppliers`     | 56      |
| `bi`            | 56      |
| `banks`         | 64      |
| `cash`          | 48      |
| `reports`       | 48      |
| `assets`        | 46      |
| `accounting`    | 114     |

## 3. Optimización aplicada en esta fase: 575 índices FK nuevos

**Hallazgo real** (procedimiento de detección: toda columna que participa como
extremo local de una FK, comparada contra el primer atributo de cada índice
existente en su tabla): 575 columnas de FK de negocio sin índice de soporte —
excluidas deliberadamente las 6 columnas universales (`tenant_id`, `company_id`,
`branch_id`, `created_by`, `updated_by`, `deleted_by`), ya cubiertas por RLS y sin
convención de índice individual (`docs/database/06-estrategia-seguridad.md §1`).

Aplicado en `docs/database/sql/31_missing_fk_indexes.sql` (archivo nuevo, ningún
archivo existente editado) — B-tree simple sobre cada columna FK de negocio,
convención de nombre `idx_<schema>_<tabla>_<columna>`. Los 575 cubren las 21
schemas; distribución completa por tabla en el archivo SQL mismo (auto-documentado
por su propio nombre de índice).

**Por qué esto era un anti-patrón real, no una precaución teórica:** una FK sin
índice de soporte en el lado que la referencia obliga a un _sequential scan_ en
cada `JOIN`/`WHERE` sobre esa relación, y a un _sequential scan_ de la tabla
**referenciante completa** en cada `DELETE`/`UPDATE` de la fila referenciada (para
verificar que no quede una FK huérfana) — el segundo caso es particularmente caro en
tablas grandes como `sales.sales_order_lines` o `inventory.stock_movements`.

## 4. Patrones de índice por rol de tabla (referencia)

Ya fijado en `docs/database/02a-restricciones-e-indices.md §5` — no se repite,
solo se confirma que la implementación real lo respeta: B-tree en catálogos/
maestras y FKs, GIN+trigram en búsqueda de texto (`hr.employees`, `crm.leads`,
`configuration.countries`), BRIN en tablas append-only de alto volumen
(`core.audit_logs`, `inventory.stock_movements`, `accounting.journal_entries`,
`sales.invoices`).

## 5. Qué NO se agregó (límite deliberado de esta optimización)

- **Índices compuestos especulativos** — no se agregó ningún índice de más de una
  columna sin evidencia de patrón de consulta real (la base tiene ~427 filas de
  desarrollo, insuficiente para justificar un índice compuesto por análisis de
  plan de ejecución real). Ver [PERFORMANCE.md §3](./PERFORMANCE.md#3-índices-compuestos-pendientes-de-evidencia-real).
- **Índices en las 6 columnas universales** — decisión de diseño ya fijada, no
  revisada en esta fase (requeriría ADR, `docs/standards/ARCHITECTURE_RULES.md §7`).
- **Ningún índice existente fue eliminado o modificado** — solo adiciones, cero
  riesgo de romper una consulta que ya dependía de un índice previo.

## 6. Trazabilidad

| Punto pedido en la fase             | Cerrado en                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Detectar índices faltantes          | §3                                                                                      |
| Detectar índices duplicados         | 0 encontrados — ver `DATABASE_HEALTH_REPORT.md §2` (verificación ya hecha, no repetida) |
| Optimizar sin romper compatibilidad | §3, §5 — solo adiciones, archivo nuevo                                                  |
