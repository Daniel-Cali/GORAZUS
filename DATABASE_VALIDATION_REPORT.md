# Informe de Validación — Estándar de Nomenclatura en Español

> Validaciones reales, ejecutadas por script contra el mapeo completo generado (501 tablas + 728
> columnas distintas), no revisadas a ojo. Como esta fase es de diseño, no hay "tests de
> aplicación" que correr todavía (nada del backend cambió) — lo que sí se validó es que el diseño
> en sí mismo es correcto y ejecutable sin sorpresas más adelante.

## 1. Cobertura de traducción

| Categoría                        | Total |                  Traducidos                   | Cobertura |
| -------------------------------- | :---: | :-------------------------------------------: | :-------: |
| Tablas                           |  501  |                      501                      | **100%**  |
| Columnas distintas               |  728  |                      728                      | **100%**  |
| Esquemas de negocio              |  21   | 21 (19 traducidos + 2 mantenidos a propósito) | **100%**  |
| Vistas                           |   9   |      9 (8 traducidas + 1 ya en español)       | **100%**  |
| Vistas materializadas            |   4   |                       4                       | **100%**  |
| Funciones/procedimientos propios |  20   |                      20                       | **100%**  |
| Triggers (nombres distintos)     |   5   |                       5                       | **100%**  |

Ninguna columna quedó con un token sin traducir en la versión final del diccionario — el primer
intento automático dejó 29 columnas con al menos un token sin resolver (ver §3), corregidas antes
de dar por completo el diccionario.

## 2. Colisiones

- **Colisiones de nombre de columna dentro de una misma tabla**: 0 de 10.153 columnas revisadas
  (recorridas las 501 tablas completas, no solo los 728 nombres distintos — dos columnas de una
  misma tabla que tradujeran al mismo nombre en español sería un error real de diseño).
- **Colisiones de nombre de tabla dentro de un mismo esquema**: 0 de 501.
- **Palabras reservadas de PostgreSQL**: 0 de 501 tablas y 0 de 728 columnas coinciden con una
  palabra reservada (`pg_get_keywords()` con `catcode` `R`/`T` — reservadas estrictas, consultado
  contra la base real, no una lista estática).

## 3. Bug real encontrado y corregido durante el diseño

La regla de reordenamiento adjetival (`unit_X → X_unitario`, ver
`DATABASE_SPANISH_STANDARD.md §6.1`) se aplicó primero de forma ciega a **cualquier** columna que
empezara con un prefijo conocido — y produjo `unit_id → id_unitario`, incorrecto: `unit_id`
significa "el id de la unidad (de medida)", no "un id de tipo unitario". Encontrado al revisar
manualmente las columnas traducidas por composición automática (no por override manual) antes de
cerrar el diccionario. Corregido agregando una excepción explícita: la regla de reordenamiento no
aplica cuando el resto del nombre es solo `id`. Verificado el resultado correcto
(`unit_id → unidad_id`) y que ninguna otra columna con patrón `<adjetivo>_id` haya quedado mal
traducida por el mismo motivo (revisión de las 728 traducciones completas, no solo la que falló).

## 4. Longitud de identificadores (límite real de PostgreSQL: 63 bytes)

- **Nombres de tabla**: 0 de 501 superan 63 bytes (el más largo, `consolidated_financial_snapshots`
  → `instantaneas_financieras_consolidadas`, queda en 39 bytes).
- **Nombres de columna**: 0 de 728 superan 63 bytes.
- **Sufijos estándar derivados** (`_pkey`, `_id_local_key`, `_fkey`, `_check`, `_id_local_seq`): 0
  de los peores casos calculados superan 63 bytes (el más largo, 58 bytes).
- **Índices custom** (`idx_<esquema>_<tabla>_<columna>`): **112 de ~2.948 candidatos en el peor
  caso superarían 63 bytes** — hallazgo real, no un problema del diccionario de nombres en sí (cada
  pieza individual es válida) sino de la longitud combinada del patrón de nomenclatura de índices
  ya usado por el proyecto, aplicado en español. Mitigación diseñada en
  `DATABASE_MIGRATION_REPORT.md §4` (sufijo hash o eliminar el prefijo de esquema redundante),
  pendiente de aprobación antes de ejecutar — no se resolvió unilateralmente en esta fase porque
  implica elegir entre dos convenciones distintas.

## 5. Consistencia interna del estándar

- Todas las tablas hermanas de un mismo patrón (líneas/estados/historial de una misma entidad)
  siguen la misma convención de orden de palabras — verificado manualmente para los 4 grupos que
  usan la inversión adjetiva (`purchase_orders`/`purchase_order_lines`/`purchase_order_status`/
  `purchase_order_status_history`, y los mismos 4 sufijos para `sales_orders`, `stock_movements`
  no tiene sufijos hermanos, `product_categories` tampoco).
- Las 17 columnas de `BaseEntity` se tradujeron una sola vez y se aplicaron literalmente a las 501
  tablas — 0 excepciones, 0 tablas con una variante distinta de `created_at`/`tenant_id`/etc.

## 6. Lo que esta validación NO cubre (honesto, no fingido)

- **No se ejecutó ningún test de aplicación** (unitario/integración/e2e/regresión) — no hay código
  nuevo que probar, el pedido de "Testing: no failing tests allowed" aplica a la fase de
  _ejecución_ (`DATABASE_MIGRATION_REPORT.md`), todavía no iniciada.
- **No se verificó el comportamiento real de Prisma con `@map`/`@@map` aplicado** — es un mecanismo
  documentado y estable de Prisma, pero no se generó un cliente de prueba con el mapeo completo en
  esta fase (el schema.prisma real del repo no se tocó, por regla explícita de "no romper la
  aplicación").
- **No se auditó la ortografía/gramática de las 728 traducciones por un hablante nativo
  humano** — se aplicaron reglas sistemáticas y se revisaron los casos límite (composición
  automática sin override, ver §3), pero un vocabulario de 728 términos técnicos de 21 dominios de
  negocio distintos (contabilidad, nómina, activos fijos, etc.) tiene margen real de matices
  regionales (México/Argentina/España usan términos distintos para lo mismo, p. ej. "nómina" vs
  "planilla") — se documenta como riesgo conocido, no oculto, en `TECHNICAL_DEBT.md`.
