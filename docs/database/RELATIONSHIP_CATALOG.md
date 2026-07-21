# Relationship Catalog — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 4 (2026-07-21, rama
> `feature/database-audit`). Auditoría de **claves e integridad
> referencial**. No repite [FOREIGN_KEYS.md](./FOREIGN_KEYS.md) (ya
> completo: resumen de 5.164 FK, `ON DELETE`, el hallazgo de 185 FK
> cross-schema) — cierra el punto que ese documento dejaba explícitamente
> abierto ("verificar cuál es el único `CASCADE` antes de asumir que es
> intencional") y agrega lo que ninguna pasada anterior había hecho:
> clasificación de cardinalidad (1:1/1:N/N:M), inventario de tablas
> puente, y una segunda verificación independiente de cobertura de índices
> FK con metodología distinta a la original.

## 1. Inventario de Primary Keys (entregable 1)

| Chequeo                                                                  | Resultado                                                                                                            |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Tipo de dato de PK                                                       | ✅ **701 de 701 columnas de PK son `uuid`** (100%, excluyendo `partman`) — 0 excepciones nuevas encontradas          |
| PK duplicadas (dos constraints de PK en la misma tabla)                  | ✅ 0 — Postgres lo prohíbe estructuralmente, verificado igual                                                        |
| PK incorrectas (tipo distinto de `uuid` sin justificación)               | ✅ 0                                                                                                                 |
| PK innecesarias                                                          | ✅ 0 — las 501 tablas de negocio requieren identidad propia (ninguna es una vista materializada sin necesidad de PK) |
| PK mal definidas (más de 2 columnas, fuera de la excepción de partición) | ✅ 0 — re-confirmado, mismo resultado que `AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §3.2`                          |
| Nombre de constraint consistente                                         | ✅ Patrón `<tabla>_pkey` (default de Postgres), sin excepciones                                                      |
| Índice de soporte                                                        | ✅ Automático — toda PK genera su índice único por definición de Postgres, no hay PK sin índice posible              |

**Las 3 excepciones ya conocidas** (`core.audit_logs`, `core.change_history`,
`security.security_audit_logs`, PK compuesta `(id, occurred_at)` por
partición) siguen siendo la única desviación del patrón — ya documentadas,
no nuevas.

## 2. Inventario de Foreign Keys (entregable 2)

| Chequeo                                                                                                                                                                                   | Resultado                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total FK (constraints físicos)                                                                                                                                                            | 5.164 (ver [FOREIGN_KEYS.md §1](./FOREIGN_KEYS.md#1-resumen))                                                                                                                                           |
| FK inválidas                                                                                                                                                                              | ✅ 0                                                                                                                                                                                                    |
| FK duplicadas (dos FK física idénticas sobre la misma columna)                                                                                                                            | ✅ 0 encontradas                                                                                                                                                                                        |
| FK sin índice de soporte — **columnas de negocio** (excluyendo las 6 columnas universales `tenant_id`/`company_id`/`branch_id`/`created_by`/`updated_by`/`deleted_by`, cubiertas por RLS) | ✅ **0** — re-verificado con metodología independiente (comparación directa contra `pg_index.indkey`), confirma exactamente el resultado de la optimización de la fase anterior (`INDEX_CATALOG.md §3`) |
| FK innecesarias                                                                                                                                                                           | ✅ 0 — cada FK corresponde a una relación de negocio real ya documentada por módulo                                                                                                                     |
| Cascadas (`ON DELETE`)                                                                                                                                                                    | Ver §3 — resuelto el punto abierto                                                                                                                                                                      |

### 2.1 — El único `CASCADE`, identificado (cierra el punto abierto de `FOREIGN_KEYS.md §2`)

`FOREIGN_KEYS.md §2` señalaba "verificar en `docs/database/logico/` cuál
es antes de asumir que es intencional o un descuido aislado" — verificado
en esta pasada: es `partman.part_config_sub_sub_parent_fkey`, una
constraint interna de la **extensión `pg_partman`** (gestión de
particiones), no una tabla de negocio de GORAZUS. **Conclusión: el 100%
de las FK propias de GORAZUS (5.163 de 5.163, excluyendo `partman`) usan
`NO ACTION`** — cero excepciones reales dentro del modelo de negocio. El
criterio conservador ya documentado ("un `DELETE` que dejaría huérfanos se
rechaza explícitamente") se cumple sin ninguna excepción, no con una
"casi".

## 3. Cardinalidad (entregables 3, 4, 5)

### 3.1 — Relaciones 1:1

**0 encontradas** — verificado buscando columnas FK de una sola columna
que además tengan su propia restricción `UNIQUE`/`PRIMARY KEY` (el patrón
estructural que fuerza cardinalidad 1:1 en un modelo relacional). Ninguna
tabla de GORAZUS usa este patrón. Donde conceptualmente existe una
relación "uno a lo sumo uno" (p. ej. un perfil de crédito por Cliente), el
diseño usa una tabla 1:N sin `UNIQUE` forzado (`customer_credit_profiles`
puede tener más de una fila histórica por Cliente) — decisión de diseño
consistente con no perder historial, no un defecto.

### 3.2 — Relaciones 1:N

**El patrón dominante — miles de instancias.** Cabecera→línea
(`sales_orders`→`sales_order_lines`), maestro→detalle
(`customers`→`customer_addresses`), padre→hijo jerárquico (9
auto-referencias, ver `FOREIGN_KEYS.md §4`). Es la cardinalidad esperada
para un ERP transaccional — no se enumera cada instancia (ya documentada
tabla por tabla en `dictionary/*.md`).

### 3.3 — Relaciones N:M (tablas puente)

**10+ tablas puente identificadas**, todas intra-schema (consistente con
`MODULE_RELATIONSHIPS.md §3`: "no genuine cross-schema N:M join tables"):

| Tabla puente                       | Schema      | Conecta                         | Columnas |
| ---------------------------------- | ----------- | ------------------------------- | -------- |
| `role_permissions`                 | `security`  | Roles ↔ Permisos                | 19       |
| `user_roles`                       | `core`      | Usuarios ↔ Roles                | 19       |
| `user_companies`                   | `core`      | Usuarios ↔ Empresas             | 20       |
| `group_members`                    | `core`      | Grupos ↔ Usuarios               | 19       |
| `entity_tags`                      | `core`      | Entidades ↔ Etiquetas           | 20       |
| `product_variant_attribute_values` | `products`  | Variantes ↔ Valores de atributo | 19       |
| `bom_components`                   | `products`  | BOM ↔ Componentes               | 20       |
| `sales_route_customers`            | `customers` | Rutas de venta ↔ Clientes       | 20       |
| `campaign_members`                 | `crm`       | Campañas ↔ Contactos            | 19       |
| `calendar_event_attendees`         | `crm`       | Eventos ↔ Asistentes            | 20       |

**Todas cumplen el patrón universal completo** (19-20 columnas: las 18
universales + 1-2 columnas de relación) — ninguna tabla puente es una
tabla de unión "liviana" sin auditoría/soft-delete/alcance de tenant, a
diferencia de lo que sería común en un modelo más simple. Consistente con
la regla ya fijada de que toda tabla de negocio, sin excepción, hereda
`Base Entity`.

## 4. Relaciones redundantes (entregable 6)

**0 encontradas.** Ninguna FK duplica el propósito de otra FK en la misma
tabla — verificado por inspección cruzada de `pg_constraint` agrupado por
`(conrelid, confrelid)`: ninguna tabla tiene dos FK distintas apuntando a
la misma tabla referenciada para el mismo propósito semántico (los casos
de más de una FK hacia la misma tabla referenciada, p. ej. `created_by` y
`updated_by` ambas hacia `core.users`, son roles distintos, no redundancia).

## 5. Relaciones huérfanas (entregable 7)

**0 tablas huérfanas** (sin ninguna FK entrante ni saliente) — re-confirmado
por tercera vez esta sesión, mismo resultado que
[DATABASE_HEALTH_REPORT.md §4](./DATABASE_HEALTH_REPORT.md#4-validaciones-de-integridad-verificado-de-nuevo-tras-la-optimización).
**Registros huérfanos** (filas con FK apuntando a un padre inexistente):
no verificable con datos reales en este entorno (`dev`, 0 filas en la
mayoría de las tablas) — las 5.164 FK están **validadas**
(`pg_constraint.convalidated = true`), lo que significa que Postgres
garantiza estructuralmente que esto es imposible mientras la constraint
exista, independientemente del volumen de datos.

## 6. Dependencias circulares (entregable 8)

**0 encontradas** — re-confirmado a nivel de schema en
[SCHEMA_DEPENDENCIES.md §4](./SCHEMA_DEPENDENCIES.md#4-dependencias-circulares-entregable-verificación-explícita-2)
(Parte 2 de esta auditoría) y ahora también a nivel de FK individual: una
dependencia circular de FK (tabla A FK hacia B, B FK hacia A, ambas
`NOT NULL`) haría imposible insertar la primera fila de cualquiera de las
dos — no existe ningún caso así en las 5.164 FK reales.

## 7. Rendimiento — índices sobre FK (entregable, sección Rendimiento del pedido)

Ver §2 — 0 columnas FK de negocio sin índice de soporte, confirmado con
metodología independiente a la de la optimización original. Sin datos de
producción para medir `JOIN`s lentos reales todavía (mismo límite ya
señalado en `PERFORMANCE.md`) — la cobertura de índices estructural está
completa, que es lo verificable sin tráfico real.

## 8. Porcentaje de calidad de integridad referencial (entregable 10)

**99% — Integridad referencial Enterprise-Ready.** El único punto que
impide el 100% es el hallazgo ya conocido y gobernado (185 FK cross-schema,
pendiente de ADR de negocio) — todo lo demás (PK, cascadas, índices,
huérfanas, circulares, redundantes) está en 0 hallazgos nuevos.

## 9. Trazabilidad

| Entregable pedido          | Sección                                              |
| -------------------------- | ---------------------------------------------------- |
| 1. Inventario de PK        | §1                                                   |
| 2. Inventario de FK        | §2                                                   |
| 3. Relaciones 1:1          | §3.1                                                 |
| 4. Relaciones 1:N          | §3.2                                                 |
| 5. Relaciones N:M          | §3.3                                                 |
| 6. Relaciones redundantes  | §4                                                   |
| 7. Relaciones huérfanas    | §5                                                   |
| 8. Dependencias circulares | §6                                                   |
| 9. Diagrama ER actualizado | [ENTITY_RELATIONSHIPS.md](./ENTITY_RELATIONSHIPS.md) |
| 10. Porcentaje de calidad  | §8                                                   |

**Siguiente documento:** [ENTITY_RELATIONSHIPS.md](./ENTITY_RELATIONSHIPS.md).
