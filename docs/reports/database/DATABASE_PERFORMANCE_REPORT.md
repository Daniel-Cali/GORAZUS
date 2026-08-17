# Informe de Performance — Base de Datos GORAZUS

> Database Finalization, Fase 7. Revisión de índices, particionamiento, constraints y
> escalabilidad — enfocada en el impacto real de las 7 adiciones de esta fase, sobre la base ya
> evaluada en `docs/database/PERFORMANCE_REPORT.md` (certificación previa).

## 1. Impacto de las adiciones de esta fase

| Adición                                              |      Filas afectadas hoy      | Índice                                                     | Riesgo de performance                                                                                                                            |
| ---------------------------------------------------- | :---------------------------: | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `products.products` +4 columnas                      | 2 (catálogo de prueba actual) | 2 índices parciales nuevos                                 | Ninguno — columnas nullable/con default, `ALTER TABLE ADD COLUMN` con default constante es metadata-only en Postgres 11+ (no reescribe la tabla) |
| `core.companies`/`core.branches` +3 columnas c/u     |            13 / —             | 2 índices simples nuevos                                   | Ninguno — mismo motivo                                                                                                                           |
| `inventory.inventory_serials` +1 columna             |    0 filas reales todavía     | Sin índice propio (no se consulta por `unit_cost` todavía) | Ninguno                                                                                                                                          |
| `suppliers.supplier_contracts` (tabla nueva)         |               0               | 3 índices                                                  | Ninguno — tabla vacía                                                                                                                            |
| `products.product_physical_attributes` (tabla nueva) |               0               | 2 índices                                                  | Ninguno — tabla vacía                                                                                                                            |

**Conclusión**: cero impacto de performance medible hoy — todas las adiciones son metadata-only o
sobre tablas nuevas vacías. El único costo real es a futuro, cuando estas columnas/tablas se
pueblen con datos reales — dimensionado abajo.

## 2. Índices parciales — diseño deliberado para escalar

`idx_products_products_hazardous` (`WHERE is_hazardous_material = true`) y
`idx_products_products_lifecycle_status` (`WHERE lifecycle_status <> 'active'`) son índices
**parciales**, no sobre la tabla completa — en un catálogo real de ferretería (miles de SKUs), la
gran mayoría de productos NO son hazmat y SÍ están `active`, así que estos índices se mantienen
chicos (proporcionales a la minoría de filas que cumplen la condición) en vez de crecer 1:1 con el
catálogo completo. Mismo patrón ya usado en el resto de la base (`WHERE deleted_at IS NULL` es el
ejemplo universal existente).

## 3. Particionamiento — sin cambios necesarios

Ninguna de las 2 tablas nuevas necesita particionamiento — no son tablas de alto volumen
transaccional (`supplier_contracts` crece con la cantidad de proveedores con contrato formal,
`product_physical_attributes` con la cantidad de productos físicos, ambas órdenes de magnitud muy
por debajo de las tablas ya particionadas del proyecto: `stock_movements`, `audit_logs`,
`invoices`, etc., que sí son de alto volumen por diseño). Confirmado: 0 tablas de esta fase superan
10.000 filas (ambas están en 0).

## 4. Constraints — costo de validación

Los 2 `CHECK` extendidos (`costing_method`, `barcode_type`) y el `CHECK` nuevo
(`ck_supplier_contracts_dates`) son evaluados por Postgres en cada `INSERT`/`UPDATE` de la fila —
costo despreciable (comparación de string/fecha simple, no una subconsulta). Las 5 FK nuevas
agregan el costo estándar de validación de integridad referencial en cada escritura — mismo costo
que cualquiera de las 5.164+ FK ya existentes, no un patrón nuevo.

## 5. Tablas grandes — sin cambios

0 tablas de la base superan 10.000 filas hoy (entorno de desarrollo/demo, no producción con carga
real) — igual que antes de esta fase. `docs/database/PERFORMANCE_REPORT.md` (certificación previa)
ya documentaba que la validación de carga real contra un entorno de staging con volumen de
producción sigue pendiente — sin cambios en esa conclusión, esta fase no la resuelve (no era su
objetivo).

## 6. Auditoría — costo de los 2 triggers nuevos

`trg_set_audit_fields`/`trg_audit_log`, aplicados a las 2 tablas nuevas, tienen el mismo costo por
fila que en las 501 tablas preexistentes (ya evaluado y aceptado en la certificación original) —
no se introduce ningún patrón de trigger nuevo, se reutilizan las mismas 2 funciones compartidas.

## 7. Escalabilidad — conclusión

Sin cambios en la evaluación de escalabilidad estructural de la certificación previa. Las 7
adiciones de esta fase son, por diseño, de bajo volumen (catálogo/configuración, no transaccional
de alto volumen) — no alteran ninguna de las conclusiones de particionamiento/rendimiento ya
certificadas para el resto de la base.
