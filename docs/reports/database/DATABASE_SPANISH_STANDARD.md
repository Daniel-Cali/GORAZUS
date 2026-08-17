# Estándar de Nomenclatura en Español — Base de Datos GORAZUS

> **Fase de diseño (Database Refactor, Fase 01).** Este documento define el estándar completo,
> pero **no se ejecutó ningún renombrado real todavía** — decisión explícita del usuario dado que
> la base está certificada como "Enterprise v1.0.0" y congelada (`VERSION.md`), con 501 tablas,
> 10.153 columnas y ~5.164 Foreign Keys en producción-patrón. Ver `DATABASE_MIGRATION_REPORT.md`
> para el plan de ejecución futura, todavía sin aprobar ni comenzar.

## 1. Por qué diseño primero, no ejecución

Renombrar 501 tablas, miles de columnas, índices, constraints, triggers y funciones **en una sola
sesión, contra una base ya certificada, sin poder correr la suite completa de tests de forma
confiable** (ver `PROJECT_STATUS.md`/`TECHNICAL_DEBT.md` — `nx run web:test` roto, e2e dependiente
de Docker) es una operación de altísimo riesgo real: blast radius total (toca cada módulo backend
ya construido), prácticamente irreversible en la práctica una vez que el código empieza a depender
de los nombres nuevos, y contradice la propia regla del proyecto de que el modelo de datos está
congelado y "todo cambio estructural futuro requiere una migración versionada" (`VERSION.md`).
Se generó igual el **estándar completo y el mapeo real de los 501+728 objetos** (no un boceto de 20
ejemplos) para que la ejecución futura, si se aprueba, no tenga que rediseñar nada — solo ejecutar.

## 2. Alcance real auditado antes de diseñar

Por las reglas obligatorias de esta fase, se revisó en vivo (no de memoria) antes de diseñar nada:

- `CHANGELOG.md`, `VERSION.md` (**0.11.1** actual), `ROADMAP.md`, `PROJECT_STATUS.md`.
- La base PostgreSQL 17.10 real corriendo en Docker: 21 schemas de negocio, **501 tablas lógicas**,
  **10.153 columnas** (728 nombres distintos), **2.948 índices**, **4.752 constraints** (3.631 FK +
  501 PK + 501 UNIQUE + 119 CHECK), **501 secuencias**, 9 vistas, 4 vistas materializadas, 87
  funciones/procedimientos, 982 triggers (solo 5 nombres distintos — funciones de trigger
  compartidas), 0 tipos ENUM nativos.
- `core/database/prisma/schema.prisma` completo (generado por introspección, 21 schemas
  declarados).
- Los 34 scripts SQL de `docs/database/sql/` (fuente real del esquema, no Prisma Migrate).
- 61 archivos backend que llaman modelos de Prisma directamente (`tx.<modelo>.create/...`) y 8
  archivos (sin contar el cliente Prisma generado) que usan SQL crudo con nombres de tabla/columna
  embebidos como texto — el punto de mayor riesgo de compatibilidad, ver
  `DATABASE_COMPATIBILITY_REPORT.md`.

## 3. Regla general

**Todo objeto nuevo de la base de datos se nombra en español, en `snake_case`, sin tildes ni ñ**
(Postgres identifica sin comillas solo ASCII en minúscula — usar tildes obligaría a citar cada
identificador con comillas dobles en cada consulta, un costo real e innecesario). `ñ` se reemplaza
por `n` (ej. `diseño` → `diseno`), vocales acentuadas pierden la tilde (`año` → `anio`,
`código` → `codigo`).

## 4. Esquemas

Los 21 schemas de negocio se traducen 1:1. Dos siglas ya universales se mantienen sin traducir
(`bi`, `crm`) — traducirlas (`ni`, `grc`) generaría confusión, no claridad, y no son palabras que
un hispanohablante técnico no reconozca. `core` se traduce a `nucleo` (no `core` ni `centro`,
`nucleo` es el término ya usado informalmente en la documentación de arquitectura del proyecto
para referirse a esta capa). `partman` (schema propio de la extensión `pg_partman`) y `public` no
se tocan — son infraestructura de PostgreSQL, no del dominio de GORAZUS.

Ver el mapeo completo de los 21 esquemas en `docs/database/spanish-standard/tablas-es.json`
(columnas `esquema_en`/`esquema_es`).

## 5. Tablas

**Regla mecánica**: se preserva el orden de los tokens del nombre en inglés, se traduce cada
token, respetando singular/plural — esto es 100% consistente y verificable sobre 501 tablas sin
juicio caso por caso. **Excepción explícita**: los 4 ejemplos textuales del pedido original
(`stock_movements` → `movimientos_inventario`, `purchase_orders` → `ordenes_de_compra`,
`sales_orders` → `pedidos_de_venta`, `product_categories` → `categorias_de_producto`) invierten el
orden porque así se pidió explícitamente — y esa misma inversión se aplicó, por consistencia, a
las tablas hermanas de esas mismas entidades (líneas, estados, historial: p. ej.
`purchase_order_lines` → `lineas_de_orden_de_compra`, `sales_order_status` →
`estados_de_pedido_de_venta`).

Mapeo completo de las 501 tablas: `docs/database/spanish-standard/tablas-es.json`.

## 6. Columnas

**10.153 columnas reales se reducen a 728 nombres distintos** — el patrón `BaseEntity` compartido
por las 501 tablas (`id`, `tenant_id`, `company_id`, `branch_id`, `created_at`, `updated_at`,
`deleted_at`, `created_by`, `updated_by`, `deleted_by`, `version`, `row_version`, `is_active`,
`is_deleted`, `observations`, `metadata`) por sí solo explica 8.517 de las 10.153 (84%). Traducir
esas 17 columnas correctamente, una sola vez, ya cubre la enorme mayoría del trabajo real:

| Inglés                                     | Español                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `id`                                       | `id`                                                           |
| `local_id`                                 | `id_local`                                                     |
| `tenant_id`                                | `inquilino_id`                                                 |
| `company_id`                               | `empresa_id`                                                   |
| `branch_id`                                | `sucursal_id`                                                  |
| `created_at` / `updated_at` / `deleted_at` | `fecha_creacion` / `fecha_actualizacion` / `fecha_eliminacion` |
| `created_by` / `updated_by` / `deleted_by` | `creado_por` / `actualizado_por` / `eliminado_por`             |
| `version` / `row_version`                  | `version` / `version_fila`                                     |
| `is_active` / `is_deleted`                 | `esta_activo` / `esta_eliminado`                               |
| `observations` / `metadata`                | `observaciones` / `metadatos`                                  |

**Nota de terminología deliberada**: `tenant_id` → `inquilino_id`, no `arrendatario_id` ni se deja
`tenant_id` sin traducir — "inquilino" es el término ya adoptado en documentación SaaS
multi-tenant en español; se documenta acá para que no se reinvente ni se traduzca distinto en
otra parte del proyecto.

### 6.1 Reordenamiento adjetivo

Un puñado de patrones en inglés anteponen un modificador que en español natural va después del
sustantivo — igual que en los ejemplos del pedido (`unit_price` → `precio_unitario`, no
`unitario_precio`). Se identificaron y aplicaron sistemáticamente estos prefijos:

`unit_X → X_unitario`, `total_X → X_total`, `min_X/max_X → X_minimo/X_maximo`,
`available_X → X_disponible`, `reserved_X → X_reservado`, `estimated_X → X_estimado`,
`planned_X → X_planificado`, `actual_X → X_real`, `previous_X → X_anterior`, `new_X → X_nuevo`,
`current_X → X_actual`, `expected_X → X_esperado`, `remaining_X → X_restante`,
`standard_X → X_estandar`, `budgeted_X → X_presupuestado`, `gross_X/net_X → X_bruto/X_neto`,
`default_X → X_predeterminado`, `preferred_X → X_preferido`, `required_X → X_requerido`.

**Excepción real encontrada al aplicar esta regla**: cuando el resto es solo `id` (p. ej.
`unit_id`), el prefijo NO es un adjetivo — es el nombre de la entidad referenciada. `unit_id`
significa "el id de la unidad", no "un id unitario". La regla excluye explícitamente ese caso
(`unit_id → unidad_id`, no `id_unitario`) — bug real que el motor de traducción cometió en el
primer intento y se corrigió antes de generar el mapeo final, documentado en
`DATABASE_VALIDATION_REPORT.md`.

### 6.2 Columnas `_amount` que colapsan al sustantivo solo

Siguiendo el ejemplo explícito del pedido (`tax_amount → impuesto`, no `impuesto_monto`), el mismo
criterio se aplicó a `subtotal_amount → subtotal` y `total_amount → total` — en estos tres casos
"amount" es redundante en español (el sustantivo ya implica un monto). El resto de las columnas
`_amount` (hay ~40) sí conservan `monto_de_X` porque ahí "amount" agrega información real (p. ej.
`discount_amount → monto_de_descuento`, distinto de `discount_percentage →
porcentaje_de_descuento`, ambas columnas coexisten en la misma tabla).

Mapeo completo de las 728 columnas distintas: `docs/database/spanish-standard/columnas-es.json`.
Ver `DATABASE_DICTIONARY.md` para la versión organizada por categoría, legible.

## 7. Índices, constraints y secuencias

Se derivan **mecánicamente** de los nombres de tabla/columna ya traducidos, seteando el mismo
patrón que ya usa el proyecto:

| Objeto            | Patrón actual (inglés)           | Patrón nuevo (español)                    |
| ----------------- | -------------------------------- | ----------------------------------------- |
| Primary Key       | `<tabla>_pkey`                   | `<tabla_es>_pkey`                         |
| Unique (local_id) | `<tabla>_local_id_key`           | `<tabla_es>_id_local_key`                 |
| Foreign Key       | `<tabla>_<columna>_fkey`         | `<tabla_es>_<columna_es>_fkey`            |
| Check             | `<tabla>_<columna>_check`        | `<tabla_es>_<columna_es>_check`           |
| Índice custom     | `idx_<schema>_<tabla>_<columna>` | `idx_<schema_es>_<tabla_es>_<columna_es>` |
| Secuencia         | `<tabla>_local_id_seq`           | `<tabla_es>_id_local_seq`                 |

**Hallazgo real de esta fase**: aplicado mecánicamente, **112 de los ~2.948 nombres de índice**
(3,8%) superarían el límite de 63 bytes de PostgreSQL para identificadores sin comillas — porque
el español es en promedio más largo que el inglés en estos compuestos. El sufijo estándar más
largo (PK/FK/UNIQUE/secuencia) llega a 58 bytes, ninguno se pasa. Ver el mecanismo de mitigación
propuesto en `DATABASE_MIGRATION_REPORT.md §4`.

## 8. Vistas, funciones, procedimientos y triggers

Conjuntos pequeños, traducidos a mano (no hace falta motor automático):

| Categoría                                   |                  Cantidad real                   | Ejemplo                                                   |
| ------------------------------------------- | :----------------------------------------------: | --------------------------------------------------------- |
| Vistas                                      |                        9                         | `v_kardex` → se mantiene (ya en español)                  |
| Vistas materializadas                       |                        4                         | `mv_daily_sales_summary` → `mv_resumen_diario_de_ventas`  |
| Funciones/procedimientos propias de GORAZUS |      **20** (16 función + 4 procedimiento)       | `fn_apply_stock_movement` → `fn_aplicar_movimiento_stock` |
| Triggers (nombres distintos)                | 5 (aplicados 982 veces sobre tablas/particiones) | `trg_audit_log` → `trg_registro_auditoria`                |

**Corrección real hecha durante esta fase**: la consulta inicial a `pg_proc` contaba 87 funciones,
pero 67 de esas son funciones **propias de las extensiones `pg_trgm` y `pgcrypto`** (schema
`public` — `armor`, `crypt`, `digest`, `gtrgm_*`, `pgp_*`, `similarity`, etc.), no código de
GORAZUS. Esas **nunca se renombran** — son parte del contrato de la extensión, romperlas rompe
`pg_trgm`/`pgcrypto` enteras. Solo 20 funciones/procedimientos son código propio del proyecto y
entran en el alcance de esta estandarización.

Detalle completo (las 38 vistas/matviews/funciones/triggers propias) en `DATABASE_DICTIONARY.md §5-§6`.

## 9. Enums

**0 tipos ENUM nativos de PostgreSQL en toda la base** — el proyecto ya usa el patrón
`text` + `CHECK constraint` (o tabla de catálogo con FK) para todo lo que en otros proyectos sería
un `enum`, decisión de arquitectura ya tomada antes de esta fase. No hay nada que traducir en esta
categoría — los _valores_ de esos `CHECK` (p. ej. `'draft'`, `'issued'`) son datos, no nombres de
objeto, y están explícitamente fuera del alcance de "estandarización de nomenclatura de objetos".

## 10. Comentarios de base de datos y documentación

Los `COMMENT ON TABLE/COLUMN` existentes (varios, ver
`docs/database/sql/*.sql`) y la documentación (`docs/database/*.md`) también deberían traducirse
en la fase de ejecución para mantener coherencia — no se generó ese mapeo en esta fase de diseño
por ser contenido libre (no un identificador con reglas mecánicas), pero queda listado como parte
del alcance de ejecución en `DATABASE_MIGRATION_REPORT.md`.
