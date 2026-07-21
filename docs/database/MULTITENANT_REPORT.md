# Multitenant Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 8 (2026-07-21). Estrategia
> Multiempresa (entregable 4), Multisucursal (entregable 5), y Backup/
> Recuperación (entregable 7).

## 1. Las 8 columnas de multiempresa pedidas — verificación final

| Columna        | ¿Universal?                         | Realidad verificada                                                                                                                                                                                |
| -------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant_id`    | ✅ Sí                               | Universal, RLS forzado (`tenant_isolation`)                                                                                                                                                        |
| `company_id`   | ✅ Sí                               | Universal, nullable ("aplica a todo el Tenant"), **sin RLS** — ver `RLS_DESIGN.md`                                                                                                                 |
| `branch_id`    | ✅ Sí                               | Universal, nullable, **sin RLS** — ver `RLS_DESIGN.md`                                                                                                                                             |
| `warehouse_id` | 🔗 Correctamente NO universal       | Solo en `inventory` (27 tablas) — es un alcance operativo de stock, no un nivel de aislamiento multiempresa; extenderlo a las 501 no tendría sentido (¿qué "almacén" tendría un asiento contable?) |
| `country_id`   | ❌ No existe en ningún nivel        | Gap ya conocido — `FUNCTIONAL_GAPS.md #2`                                                                                                                                                          |
| `currency_id`  | 🔗 Resuelto distinto, correctamente | `functional_currency_code` en Empresa + `currency_code` por transacción — ver `SCHEMA_CATALOG.md §4`                                                                                               |
| `language_id`  | ❌ No existe en ningún nivel        | Mismo gap ya conocido                                                                                                                                                                              |
| `timezone`     | ❌ No existe en ningún nivel        | Mismo gap ya conocido                                                                                                                                                                              |

**Sin hallazgos nuevos** — las 8 columnas ya fueron evaluadas con el
mismo resultado en la Parte 2 (`SCHEMA_CATALOG.md §4`); esta pasada las
re-confirma en el contexto específico de seguridad/multiempresa sin
encontrar drift.

## 2. Estrategia Multiempresa (entregable 4)

- **Aislamiento estructural:** `tenant_id` universal + RLS forzado — un
  Tenant nunca ve datos de otro, garantizado por Postgres, no solo por
  la aplicación.
- **Empresas dentro de un Tenant:** `company_id` universal (nullable),
  patrón "NULL = todo el Tenant" ya fijado — pero **sin RLS**, ver
  hallazgo principal en [RLS_DESIGN.md](./RLS_DESIGN.md).
- **Consolidación entre Empresas:** `core.corporate_groups` +
  `corporate_group_members` (Fase 5 de arquitectura) — una Empresa
  pertenece a lo sumo a un Grupo, ya diseñado.
- **Moneda funcional por Empresa, moneda de transacción por documento:**
  ya correcto, ver §1.

## 3. Estrategia Multisucursal (entregable 5)

- **Alcance estructural:** `branch_id` universal (nullable, "NULL =
  toda la Empresa") — mismo patrón que `company_id`, **sin RLS**, mismo
  hallazgo.
- **Almacenes por Sucursal:** `inventory.warehouses` referencia
  Sucursal — una Sucursal puede tener varios Almacenes.
- **Series de numeración por Sucursal:** `configuration.numbering_series`
  ya soporta alcance de Sucursal (correlativos independientes por punto
  de venta/sucursal, requisito fiscal común en LatAm).
- **Caja/Vendedores por Sucursal:** `cash.cash_registers`,
  `sales.salespeople` ya tienen `branch_id`.

## 4. Backup y recuperación (entregable 7) — referencia, no repetido

Ya diseñado en detalle en
[08-estrategia-respaldo.md](./08-estrategia-respaldo.md) (backup
físico/lógico, PITR, retención, pruebas de restauración) y verificado
operativo en [BACKUP.md](./BACKUP.md) (contenedor `docker-backup-1`
activo). Cobertura contra lo pedido explícitamente en esta Parte 8:

| Pedido                                        | Cubierto en                                                                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backup diario/incremental/completo            | `08-estrategia-respaldo.md §1-2`                                                                                                                           |
| Restauración                                  | `08-estrategia-respaldo.md §3`                                                                                                                             |
| Pruebas de recuperación                       | `core.restore_test_logs` (tabla real, verificada en Partes 1-2 — la única tabla sin RLS de Tenant, hallazgo ya conocido y distinto del de `RLS_DESIGN.md`) |
| Error humano / Corrupción / Fallo de servidor | PITR (`08-estrategia-respaldo.md §2`) cubre los 3 — recuperación a un punto en el tiempo antes del error, independiente de la causa                        |
| Desastres                                     | `10-evolucion-a-microservicios.md`... no — corrección: `10-estrategia-alta-disponibilidad.md` (RPO/RTO, replicación cross-zona)                            |

**Sin hallazgos nuevos** — la estrategia ya estaba completa antes de
esta Parte 8.

## 5. Trazabilidad

| Entregable pedido           | Sección |
| --------------------------- | ------- |
| 4. Estrategia Multiempresa  | §2      |
| 5. Estrategia Multisucursal | §3      |
| 7. Estrategia Backup        | §4      |

**Ver también:** [RLS_DESIGN.md](./RLS_DESIGN.md) (entregable 6, el
hallazgo principal) y [SECURITY_REPORT.md](./SECURITY_REPORT.md)
(entregables 1, 2, 8, 9, 10).
