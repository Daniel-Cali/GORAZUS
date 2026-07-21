# Foreign Keys — GORAZUS

> Generado 2026-07-17 (PHASE 01 — Database Enterprise) desde `pg_constraint` real.
> Catálogo operacional de FKs — no repite el modelo de relaciones ya documentado por
> módulo en `docs/database/logico/`, documenta el **comportamiento estructural**
> (self-referencia, `ON DELETE`, y un hallazgo real de incumplimiento de la regla de
> arquitectura ya fijada). Ver también
> [DATABASE_DEPENDENCIES.md](./DATABASE_DEPENDENCIES.md) (corregido en esta misma
> fase, ver §3 de este documento).

## 1. Resumen

| Métrica                                                                               | Valor                           |
| ------------------------------------------------------------------------------------- | ------------------------------- |
| FK totales (constraints físicos, incluye los propagados a particiones)                | 5,164                           |
| FK lógicas (una por relación de diseño, sin contar copias de partición)               | 3,631                           |
| Auto-referenciadas (patrón jerárquico)                                                | 9                               |
| Hacia `core` (FK universales: tenant/company/branch/created_by/updated_by/deleted_by) | 3,573                           |
| Intra-schema (misma tabla y su referencia en el mismo módulo)                         | 1,406                           |
| **Cross-schema entre módulos de negocio (no `core`)**                                 | **185 — ver §3, hallazgo real** |

## 2. `ON DELETE`: casi todo `NO ACTION`

| Comportamiento        | Cantidad | Nota                                                                                                                                           |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `NO ACTION` (default) | 5,163    | Ya fijado como criterio conservador — un `DELETE` que dejaría huérfanos se rechaza explícitamente, nunca se propaga en cascada silenciosamente |
| `CASCADE`             | 1        | Caso puntual — verificar en `docs/database/logico/` cuál es antes de asumir que es intencional o un descuido aislado                           |

Consistente con "Enterprise, auditable" — un ERP financiero no debe permitir que
borrar una fila padre elimine silenciosamente historial relacionado (facturas,
asientos, movimientos). El único `CASCADE` es la excepción, no la regla.

## 3. Hallazgo real: 185 FK cruzan schemas de módulos de negocio

**Contradice directamente** la regla ya fijada en
`docs/architecture/02-arquitectura-modulos-backend.md §4` y
`docs/database/01-modelo-conceptual.md §1.5`: _"las referencias cruzadas entre
módulos de negocio son IDs sueltos... nunca una FK real de Postgres"_. Verificado
contra `pg_constraint` real — **no es una excepción aislada, son 185 FK reales**:

| Desde (schema) | Hacia (schema)  | Cantidad |
| -------------- | --------------- | -------- |
| `inventory`    | `products`      | 35       |
| `crm`          | `customers`     | 29       |
| `sales`        | `customers`     | 14       |
| `sales`        | `products`      | 13       |
| `projects`     | `hr`            | 10       |
| `services`     | `products`      | 10       |
| `payroll`      | `hr`            | 9        |
| `purchases`    | `products`      | 7        |
| `purchases`    | `suppliers`     | 7        |
| `sales`        | `configuration` | 6        |
| `assets`       | `accounting`    | 5        |
| `customers`    | `sales`         | 3        |
| `services`     | `customers`     | 3        |
| `taxes`        | `configuration` | 2        |
| `customers`    | `configuration` | 2        |
| `crm`          | `sales`         | 2        |
| `purchases`    | `taxes`         | 2        |
| `hr`           | `assets`        | 1        |
| `cash`         | `sales`         | 1        |
| `banks`        | `suppliers`     | 1        |

**Corrección de un error propio:** `DATABASE_DEPENDENCIES.md §1` (fase anterior de
este mismo set de documentos) afirmaba _"Las 3,631 FK reales verificadas... son
todas intra-schema"_ — esa afirmación **no estaba verificada realmente**, se asumió
a partir de la regla documentada sin confirmarla contra `pg_constraint`. Se corrige
en ese documento en esta misma fase.

**Por qué no se corrige en esta fase:** eliminar 185 FK reales y reemplazarlas por
IDs sueltos sin FK (el patrón correcto ya documentado) es un cambio de **alto
riesgo** — cada eliminación requiere confirmar que ninguna consulta/vista/función
depende del `ON DELETE`/validación de integridad que esa FK provee hoy, y diseñar
qué reemplaza esa integridad (¿validación a nivel de aplicación? ¿trigger?). Esto
excede "optimización de bajo riesgo, sin romper nada" — es exactamente el tipo de
cambio que debería pasar por un ADR (`docs/standards/ARCHITECTURE_RULES.md §7`) y
decisión explícita de negocio, no una limpieza automática. Se documenta con precisión
para que la decisión se tome con información completa, no se aplica unilateralmente.

## 4. Patrón jerárquico (auto-referencia) — 9 FK

Ya fijado como patrón válido en `docs/database/02a-restricciones-e-indices.md §4`
("jerárquica auto-referenciada... `CHECK (parent_x_id IS DISTINCT FROM id)`") — las
9 FK que apuntan de una tabla a sí misma (`product_categories.parent_category_id`,
`accounting.chart_of_accounts.parent_account_id`, `core.departments.parent_department_id`,
y 6 más) son el patrón esperado, no un hallazgo.

## 5. Trazabilidad

| Punto pedido en la fase            | Cerrado en                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Revisar relaciones/FK              | §1-2                                                                                  |
| Detectar relaciones innecesarias   | §3 — 185 FK que, por la arquitectura ya documentada, no deberían existir como FK real |
| Corrección de documentación propia | §3, y `DATABASE_DEPENDENCIES.md §1` actualizado en esta misma fase                    |
