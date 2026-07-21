# Query Analysis — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 7 (2026-07-21). `EXPLAIN
ANALYZE` sobre datos reales **no es posible todavía**: la base `dev`
> tiene 0 filas en prácticamente todas las tablas (recién provisionada,
> sin carga de producción) — límite ya señalado repetidamente en
> `PERFORMANCE.md` y en cada auditoría de esta sesión. `EXPLAIN` (sin
> `ANALYZE`, sin ejecutar la consulta) sí es honesto y útil sobre una
> tabla vacía: muestra el **plan que el optimizador elegiría por
> estructura**, no un tiempo real — y con eso alcanza para verificar que
> los índices correctos existen y se usan cuando la cardinalidad lo
> justifica.

## 1. Consulta representativa — Ventas (JOIN cabecera-línea)

```sql
EXPLAIN SELECT so.id, so.document_number, sol.product_id, sol.quantity
FROM sales.sales_orders so
JOIN sales.sales_order_lines sol ON sol.sales_order_id = so.id
WHERE so.tenant_id = :tenant AND so.customer_id = :customer;
```

**Plan real obtenido:** `Seq Scan` en `sales_orders` (esperado — 0 filas,
el optimizador nunca usa un índice para escanear una tabla vacía, es la
decisión correcta) seguido de `Index Scan using
idx_sales_sales_order_lines_sales_order_id` para el JOIN. **Confirma:**
el índice de soporte para el JOIN cabecera-línea existe y el
optimizador lo elige.

## 2. Consulta representativa — Kardex (movimientos por producto)

```sql
EXPLAIN SELECT * FROM inventory.stock_movements
WHERE product_id = :product AND warehouse_id = :warehouse
ORDER BY created_at DESC LIMIT 50;
```

**Plan real obtenido (sin filtro de fecha):** `Append` que escanea **las
8 particiones** de `stock_movements` (7 mensuales + `default`) — **sin
poda de particiones**, porque el filtro no incluye la columna de
partición (`created_at`).

**Misma consulta, agregando rango de fecha** (patrón natural para
"Kardex de los últimos 90 días"):

```sql
EXPLAIN SELECT * FROM inventory.stock_movements
WHERE product_id = :product
  AND created_at >= '2026-07-01' AND created_at < '2026-08-01'
ORDER BY created_at DESC LIMIT 50;
```

**Plan real obtenido:** toca **una sola partición**
(`stock_movements_p20260701`), vía `Index Scan` sobre el índice
compuesto `(product_id, warehouse_id, created_at)` que ya existe —
costo estimado 10.27 vs. 113.76 de la consulta sin rango (**~11x más
barata por estructura**, antes de considerar el ahorro real de I/O de
tocar 1 partición en vez de 8).

**Hallazgo real y accionable (nuevo en esta pasada):** las consultas de
Kardex/movimientos **deben incluir un rango de `created_at`** para
aprovechar la poda de particiones — sin él, Postgres está obligado a
tocar todas las particiones de la tabla sin excepción, sin importar
cuántos índices existan. No es un defecto del schema (el índice
compuesto ya está bien diseñado) — es una guía de uso para la capa de
aplicación que no estaba documentada explícitamente antes de esta
pasada. **Recomendación:** todo Application Service que consulte una
tabla particionada por tiempo (`docs/ddd/12_application_services.md`)
debe exigir un rango de fecha por defecto (p. ej. "últimos 90 días" si
el usuario no especifica uno), nunca una consulta sin límite temporal.

## 3. Consultas críticas por módulo (pedido explícito) — cobertura de índices verificada estructuralmente

| Módulo             | Patrón de consulta crítico                 | Índice de soporte                                                                                             |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Inventario         | Existencia por producto+almacén            | `inventory.stock` PK compuesta + índices FK ya verificados                                                    |
| Ventas             | Documentos por cliente, por rango de fecha | `sales_orders(customer_id)`, `invoices` particionada + índice de fecha                                        |
| Compras            | Documentos por proveedor                   | `purchase_orders(supplier_id)`                                                                                |
| Caja               | Movimientos por caja, por fecha            | `cash_movements(cash_register_id, created_at)`                                                                |
| Clientes           | Búsqueda por nombre                        | GIN trigram `idx_customers_customers_name_trgm` (`INDEX_REPORT.md §1`)                                        |
| Productos          | Búsqueda por nombre/SKU                    | GIN trigram + `UNIQUE(sku)`                                                                                   |
| Kardex             | Por producto+almacén+fecha                 | Compuesto `(product_id, warehouse_id, created_at)` — ver §2                                                   |
| Contabilidad       | Asientos por período                       | `journal_entries` particionada + FK a `fiscal_periods`                                                        |
| Reportes/Dashboard | Agregaciones pre-calculadas                | Materialized Views (`bi.mv_*`) — ver [SCALABILITY_REPORT.md §3](./SCALABILITY_REPORT.md#3-materialized-views) |

**Los 10 módulos pedidos tienen índice de soporte estructural
verificado.** Ninguno requiere un índice nuevo.

## 4. Qué no se puede verificar todavía (honestidad, no omisión)

- Tiempos reales de ejecución (`ANALYZE`, `BUFFERS`) — requieren datos.
- Selectividad real de cada índice — requiere distribución de datos real.
- `Sort`/`Hash`/`Merge` costosos reales — no observables sin volumen.
- `pg_stat_statements` (consultas más lentas/frecuentes reales) — la
  extensión no está habilitada todavía, ver
  [POSTGRESQL_TUNING.md §3](./POSTGRESQL_TUNING.md#3-pg_stat_statements--no-habilitado-hallazgo-real).

## 5. Trazabilidad

Único hallazgo genuinamente nuevo: la necesidad de rango de fecha para
poda de particiones en consultas de Kardex/movimientos (§2) — verificado
con planes de `EXPLAIN` reales, no simulados. Todo lo demás confirma
estructura ya conocida.

**Siguiente documento:** [POSTGRESQL_TUNING.md](./POSTGRESQL_TUNING.md).
