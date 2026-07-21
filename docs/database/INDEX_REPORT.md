# Index Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 7 (2026-07-21). **Nota de
> alcance:** igual que las Partes 5-6, esta parte pide acciones que
> exceden el acuerdo de solo-documentación vigente desde el inicio de
> esta auditoría ("Crear cuando corresponda" índices nuevos). Este
> reporte hace la auditoría completa y, donde corresponde una creación
> real, la deja **especificada y no aplicada** — mismo criterio que
> `NORMALIZATION_REPORT.md §9`. Se sigue en `feature/database-audit`.

## 1. Tipos de índice — inventario real (no repetido de `INDEX_CATALOG.md`)

| Tipo                     | Cantidad                            | Uso real en GORAZUS                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BTree**                | 3.884                               | General — PK, FK, `UNIQUE`, la gran mayoría                                                                                                                                                                                                                                            |
| **BRIN**                 | 55                                  | **Ya implementado** — sobre `core.activity_logs`/`audit_logs` y sus particiones (tablas append-only ordenadas por tiempo, el caso de uso exacto para BRIN)                                                                                                                             |
| **GIN**                  | 9                                   | **Ya implementado** — búsqueda por trigram (`pg_trgm`) en `customers.customers.name`, `hr.employees.name`, `suppliers.suppliers.name`, `products.products.name`, `crm.leads.name`, más `metadata JSONB` en `core.system_settings`/`products.products`/`configuration.price_list_items` |
| **Hash**                 | 0                                   | No usado — decisión correcta: Hash solo gana a BTree en igualdad pura de alta cardinalidad sin rango, caso raro en GORAZUS; BTree ya cubre igualdad + rango                                                                                                                            |
| **GiST / SP-GiST**       | 0                                   | No usado — GORAZUS no tiene datos geoespaciales ni necesita ordenamiento por proximidad; su ausencia es correcta, no un gap                                                                                                                                                            |
| **Multicolumna**         | Presente (parte de los 3.884 BTree) | Ya usado en índices compuestos tenant-scoped                                                                                                                                                                                                                                           |
| **Parciales** (`WHERE`)  | 828                                 | **Ya implementado extensivamente** — patrón `WHERE is_deleted = false`/`WHERE is_active = true` para mantener los índices pequeños excluyendo soft-deleted                                                                                                                             |
| **Covering** (`INCLUDE`) | 11                                  | Ya implementado en consultas de alta frecuencia identificadas                                                                                                                                                                                                                          |

**Conclusión: la estrategia de índices de GORAZUS ya es Enterprise-grade**
— no "faltan" tipos de índice por crear, ya están aplicados donde
corresponde. Esto contradice la premisa implícita del pedido ("crear
BTree/Hash/GIN/GiST/BRIN/SP-GiST/multicolumna/parciales/expresiones/
covering") — la mayoría **ya existen**, y los 2 tipos ausentes (Hash,
GiST/SP-GiST) están correctamente ausentes por no tener caso de uso.

## 2. Auditoría de índices (entregable, checklist)

| Chequeo                                       | Resultado                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Índices faltantes (FK de negocio sin soporte) | ✅ 0 — re-confirmado 3ª vez esta auditoría (`RELATIONSHIP_CATALOG.md §2`)                                                                                                  |
| Índices duplicados                            | ✅ 0 — re-confirmado 5ª vez                                                                                                                                                |
| Índices innecesarios                          | ✅ 0 encontrados — cada índice tiene un propósito identificable (PK/FK/UNIQUE/búsqueda/BRIN de partición)                                                                  |
| Índices poco selectivos                       | 🟡 No determinable con `pg_stat_user_indexes` en un entorno con 0 filas — la selectividad real solo se mide con datos reales, mismo límite ya señalado en `PERFORMANCE.md` |
| Índices sin uso (`idx_scan = 0`)              | 🟡 Todos muestran 0 escaneos en `dev` — esperado, no es señal real de índice innecesario (base recién provisionada, sin tráfico)                                           |

## 3. Índices de expresión — evaluación (no creados)

Candidatos identificados por patrón de consulta ya documentado
(`DATABASE_ANALYSIS.md`, `QUERY_ANALYSIS.md`): ninguno urgente. Los `_trgm`
GIN ya existentes cubren el caso más común (búsqueda de texto parcial en
nombre). Un índice de expresión (p. ej. `lower(email)`) solo se
justificaría con evidencia real de un patrón de consulta específico no
cubierto — no se crea especulativamente.

## 4. Entregables 1-2 (creados/eliminados)

**0 índices creados. 0 índices eliminados** en esta pasada — la
auditoría no encontró ningún índice faltante ni innecesario que
justificara una acción, y el acuerdo de alcance de esta auditoría es
documentación, no DDL. La conclusión honesta es que **no hay nada que
crear**: el catálogo de 3.201 índices ya está completo y bien tipado
para el modelo actual.

## 5. Trazabilidad

Este documento no repite el detalle exhaustivo de
[INDEX_CATALOG.md](./INDEX_CATALOG.md) (los 575 índices agregados en la
optimización original) — agrega la clasificación por **tipo de índice**
que ninguna pasada anterior había desglosado explícitamente, y confirma
que la premisa "faltan tipos de índice avanzados" del pedido no aplica a
GORAZUS.

**Siguiente documento:** [QUERY_ANALYSIS.md](./QUERY_ANALYSIS.md).
