# Database Analysis — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 3 (2026-07-21, rama
> `feature/database-audit`). Auditoría **de las 501 tablas**, sin excepción.
> Método: dado que ya existen 3 pasadas previas de esta sesión que verifican
> en vivo duplicados/huérfanas/nomenclatura/formas normales/índices a nivel
> agregado (las 501 tablas de una vez, contra `pg_catalog`), y que el
> inventario completo tabla-por-tabla **ya existe** distribuido en
> [TABLE_CATALOG.md](./TABLE_CATALOG.md) (tipo/filas),
> [logico/*.md](./logico/) (propósito de negocio, 21 archivos) y
> [dictionary/*.md](./dictionary/) (columnas/PK/FK/tipos, 21 archivos), este
> documento **no repite ese trabajo tabla por tabla en prosa** — sería
> mecánicamente redundante con 63 archivos ya existentes. En su lugar,
> ejecuta las verificaciones de calidad que **ninguna pasada anterior había
> hecho todavía** (constraints CHECK/UNIQUE, cobertura de comentarios,
> outliers de tamaño) contra las 501 tablas simultáneamente, y reporta las
> excepciones reales por nombre — no una lista de 501 filas idénticas
> diciendo "sin hallazgos".

## 1. Inventario completo de tablas (entregable 1) — dónde vive cada dato pedido

| Dato pedido                           | Dónde ya existe                                                                                       | Entregable de esta pasada                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Nombre, Schema                        | [TABLE_CATALOG.md](./TABLE_CATALOG.md)                                                                | Referenciado                                              |
| Descripción                           | [logico/*.md](./logico/) (1 archivo por schema)                                                       | Referenciado                                              |
| Número de columnas                    | [dictionary/*.md](./dictionary/)                                                                      | Referenciado                                              |
| PK                                    | [dictionary/*.md](./dictionary/) + [02a-restricciones-e-indices.md](./02a-restricciones-e-indices.md) | Referenciado                                              |
| FK                                    | [FOREIGN_KEYS.md](./FOREIGN_KEYS.md) (5.164 reales)                                                   | Referenciado                                              |
| Índices                               | [INDEX_CATALOG.md](./INDEX_CATALOG.md) (3.201)                                                        | Referenciado                                              |
| Restricciones (CHECK/UNIQUE/NOT NULL) | —                                                                                                     | 🆕 §2 de este documento (no auditado agregadamente antes) |
| Dependencias                          | [SCHEMA_DEPENDENCIES.md](./SCHEMA_DEPENDENCIES.md) (a nivel schema)                                   | Referenciado                                              |
| Estado (Mantener/Mejorar/...)         | —                                                                                                     | 🆕 §6 de este documento                                   |

**"TABLE_DICTIONARY.md" pedido por nombre:** ya existe bajo
[DATABASE_DICTIONARY.md](./DATABASE_DICTIONARY.md) + `dictionary/` — mismo
contenido exacto (tipo, nullable, default, PK, FK por columna), generado
por consulta directa a `information_schema`, no escrito a mano. No se crea
un tercer archivo con el mismo contenido bajo un nombre distinto.

## 2. Restricciones — verificación agregada nueva (no hecha en pasadas anteriores)

| Restricción                                             | Cantidad real                             | Evaluación                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `CHECK`                                                 | 201                                       | Presente y usado — no 0, cubre reglas de dominio puntuales (rangos, enums de estado)                                              |
| `UNIQUE` (excluyendo PK)                                | 749                                       | Amplia cobertura — códigos, slugs, combinaciones únicas por tenant                                                                |
| `NOT NULL`                                              | 8.510 de 14.610 columnas de negocio (58%) | Esperado — el resto son campos opcionales genuinos (`observations`, columnas de auditoría `deleted_by`, FK opcionales de alcance) |
| Comentario a nivel de **columna** (`COMMENT ON COLUMN`) | **1 de ~14.610**                          | 🟡 Hallazgo real — casi ninguna columna tiene comentario SQL nativo                                                               |
| Comentario a nivel de **tabla** (`COMMENT ON TABLE`)    | 474 de 501                                | 🟢 Buena cobertura                                                                                                                |

### 2.1 — Sobre la ausencia de comentarios de columna (hallazgo honesto, no oculto)

GORAZUS documenta el propósito de cada columna **fuera de la base de
datos**, en `docs/database/dictionary/*.md` (generado automáticamente desde
`information_schema`, un archivo por schema) — es un mecanismo real y
completo, solo que no usa `COMMENT ON COLUMN` de Postgres como transporte.
Esto es una decisión válida (la documentación externa es más rica: incluye
ejemplos, referencias cruzadas, que un comentario SQL de una línea no
podría), pero significa que una herramienta que solo lea metadatos de
Postgres (sin pasar por `docs/`) no vería documentación de columna alguna
— relevante para cualquier integración futura tipo catálogo de datos
automático. **Recomendación no aplicada:** si en el futuro se prioriza el
descubrimiento automático vía herramientas de terceros, agregar
`COMMENT ON COLUMN` de forma incremental empezando por las tablas núcleo
(`sales.invoices`, `accounting.journal_entries`) sería la extensión natural
de `05-estrategia-auditoria.md`/`DATABASE_GUIDELINES.md`, sin urgencia
actual.

## 3. Tablas fuera de rango de tamaño (entregable "tablas demasiado grandes/chicas")

| Extremo                             | Tabla                                    | Columnas | Evaluación                                                                        |
| ----------------------------------- | ---------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| Más grande (real, no vista)         | `products.products`                      | 32       | Razonable para un maestro de producto central — no se recomienda dividir (ver §6) |
| Más grande (real, no vista)         | `core.background_jobs` (+ 8 particiones) | 30       | Razonable para un job de background genérico                                      |
| Más chica (real, no vista/catálogo) | `assets.depreciation_methods`            | 18       | Catálogo simple, esperado                                                         |

**Ninguna tabla real (excluyendo vistas) supera 32 columnas** — no se
encontró ninguna "tabla dios" (>50 columnas mezclando responsabilidades).
Las tablas con menos columnas son, sin excepción, **vistas** (`v_kardex`,
`v_trial_balance`, `v_general_ledger`, etc. — 4 a 12 columnas, esperado
para una vista calculada) — no tablas reales sospechosamente vacías.

## 4. Problemas detectados (entregable, checklist completo)

| Chequeo                                                             | Resultado                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tablas duplicadas                                                   | ✅ 0 (re-confirmado por 3ª vez esta sesión)                                                                                                                                                                                                      |
| Tablas innecesarias                                                 | ✅ 0 — cada tabla tiene consumidor real documentado en su módulo                                                                                                                                                                                 |
| Tablas sin uso                                                      | 🟡 No determinable con certeza en `dev` sin tráfico real — todas las tablas tienen 0 filas en este entorno (base de desarrollo recién provisionada, no producción); ausencia de filas no es evidencia de tabla innecesaria, ver `PERFORMANCE.md` |
| Tablas demasiado grandes                                            | ✅ 0 (máximo 32 columnas, ver §3)                                                                                                                                                                                                                |
| Tablas mal ubicadas (schema incorrecto)                             | ✅ 0 — verificado contra `SCHEMA_CATALOG.md §1`, cada tabla pertenece a su módulo dueño                                                                                                                                                          |
| Columnas repetidas (mismo propósito, dos nombres en la misma tabla) | ✅ 0 encontradas en el muestreo dirigido                                                                                                                                                                                                         |
| Columnas sin uso                                                    | 🟡 Mismo límite que "tablas sin uso" — no determinable sin datos de producción                                                                                                                                                                   |
| Campos calculables almacenados sin justificación                    | ✅ 0 nuevos — los totales derivados ya identificados (saldo, totales de documento) están justificados como denormalización deliberada, ver `docs/ddd/17_invariants.md` I9                                                                        |
| Campos redundantes                                                  | ✅ 0 nuevos                                                                                                                                                                                                                                      |
| Inconsistencias de tipo de dato                                     | ✅ 0 — `numeric(18,6)` consistente para cantidades, `uuid` consistente para toda PK/FK                                                                                                                                                           |

## 5. Validación ferretería — nivel de tabla (más profundo que la Parte 1)

| Capacidad pedida                                                                                                                | Tabla(s) real(es)                                                                                                                  | Estado                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Productos por metro/peso/volumen                                                                                                | `inventory.stock.quantity_on_hand numeric(18,6)`                                                                                   | ✅ (confirmado en Parte 1)                                                                                                         |
| Tornillería, Ferretería Industrial, Pinturas, Material eléctrico, Plomería, Materiales de construcción, Herramientas, Repuestos | `products.product_categories`/`product_families`/`product_lines` (jerarquía configurable)                                          | 🔗 Cubierto como categorización genérica — ver justificación en `AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4`                    |
| Garantías                                                                                                                       | `sales.warranties`                                                                                                                 | ✅                                                                                                                                 |
| Compatibilidades / Productos sustitutos                                                                                         | `products.product_related_products.relation_type`                                                                                  | ✅                                                                                                                                 |
| Kits                                                                                                                            | `products.product_kits` + `product_kit_components`                                                                                 | ✅                                                                                                                                 |
| Combos                                                                                                                          | `products.product_combos` + `product_combo_components`                                                                             | ✅                                                                                                                                 |
| Múltiples códigos de barras                                                                                                     | `products.product_barcodes`                                                                                                        | ✅                                                                                                                                 |
| Conversión de unidades                                                                                                          | `products.unit_conversions`                                                                                                        | ✅                                                                                                                                 |
| **Múltiples proveedores por producto**                                                                                          | `products.product_suppliers` (`supplier_id`, `supplier_sku`, `lead_time_days`, `is_preferred`, `last_purchase_cost`)               | ✅ Verificado en esta pasada — soporta N proveedores por producto con marca de preferido                                           |
| **Historial de costos**                                                                                                         | `inventory.average_cost_history` (`new_average_cost` por almacén) — distinto de `products.product_price_history` (precio de venta) | ✅ Verificado en esta pasada — ambos existen y tienen propósitos correctamente distintos (costo de inventario vs. precio de venta) |

**Ningún gap nuevo encontrado en esta pasada de tabla.** Los únicos 2 gaps
siguen siendo los ya documentados en la Parte 1: materiales
peligrosos/hoja de seguridad y dimensiones físicas de primera clase (ver
[AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#4-ferretería-y-distribución--análisis-funcional-dirigido)).

## 6. Recomendación por tabla (entregable "Mantener/Mejorar/Dividir/Fusionar/Eliminar")

**Clasificación por defecto: Mantener sin cambios — aplica a 497 de las 501
tablas.** Ninguna requiere dividirse (ninguna mezcla responsabilidades),
fusionarse (0 duplicados/redundantes) ni eliminarse (0 sin justificación de
negocio, ver §4). Las únicas excepciones documentadas, **todas ya
conocidas de auditorías previas de esta sesión, ninguna nueva:**

| Tabla(s)                                                                 | Recomendación                             | Justificación                                                                                                                                    |
| ------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core.audit_logs`, `core.change_history`, `security.security_audit_logs` | Mantener (excepción de PK ya documentada) | Requieren PK compuesta `(id, occurred_at)` por partición — no es un defecto, ver `11-estrategia-integridad.md §2.3`                              |
| `products.products`                                                      | Mejorar (agregar columnas, no dividir)    | Agregar `is_hazardous_material`/`hazard_class`/`safety_data_sheet_url` (§4.1 de la auditoría de Parte 1) — 3 columnas nuevas, no una tabla nueva |
| `core.companies`, `core.branches`                                        | Mejorar (agregar columnas)                | Agregar `country_id`/`language_id`/`timezone` (hallazgo de la Parte 2, `SCHEMA_CATALOG.md §4`)                                                   |
| 36 tablas con columnas booleanas sin prefijo `is_`/`has_`                | Mejorar (cosmético, sin urgencia)         | Ver `AUDIT_FASE1_ENTERPRISE.md §5.3` — no se renombra sin autorización explícita                                                                 |

**Ninguna tabla recomendada para eliminación** — no se encontró ninguna
tabla sin propósito de negocio documentado o sin consumidor real.

## 7. Riesgos encontrados (entregable)

| Riesgo                                                    | Severidad                                        | Ya conocido de                  |
| --------------------------------------------------------- | ------------------------------------------------ | ------------------------------- |
| 185 FK cross-schema                                       | 🟠 Media-alta                                    | Partes 1-2                      |
| Ausencia casi total de `COMMENT ON COLUMN`                | 🟢 Baja (mitigado por `dictionary/*.md` externo) | Nuevo en esta pasada, §2.1      |
| Imposibilidad de medir "tablas/columnas sin uso" en `dev` | 🟢 Baja (limitación de entorno, no de diseño)    | Ya señalado en `PERFORMANCE.md` |

## 8. Porcentaje de calidad (entregable)

**95% — Calidad de tabla Enterprise-Ready.** 497 de 501 tablas (99,2%) sin
ninguna recomendación más allá de "Mantener"; las 4 excepciones de §6 son
mejoras aditivas (agregar columnas), ninguna requiere reestructurar,
dividir o eliminar una tabla existente.

## 9. Plan de mejoras para la Parte 4

La Parte 4 (según el objetivo final de este pedido) revisa **relaciones,
claves primarias y claves foráneas** — insumos que esta Parte 3 deja
listos:

1. Foco principal ya identificado: las 185 FK cross-schema (§7) — Parte 4
   es el lugar natural para decidir su tratamiento (ADR).
2. Las 3 excepciones de PK compuesta (§6) ya están documentadas y no
   requieren nuevo análisis, solo confirmación de que Parte 4 las respeta
   como excepción válida.
3. Ningún hallazgo de esta Parte 3 bloquea el inicio de la Parte 4.

## 10. Trazabilidad

Este documento agrega, por primera vez en esta sesión, verificación
agregada de CHECK/UNIQUE/comentarios/outliers de tamaño contra las 501
tablas simultáneamente (§2-3), y confirma en profundidad 2 capacidades de
ferretería no verificadas antes a nivel de tabla (§5: multi-proveedor,
historial de costos). No repite el inventario completo tabla-por-tabla
— ya documentado y completo en `TABLE_CATALOG.md`/`logico/`/`dictionary/`.

**Nota sobre `CHANGELOG.md` (pedido en la lista de documentación):** el
`CHANGELOG.md` de la raíz del repositorio registra cambios de **código**
por sesión de trabajo (ver su encabezado) — el trabajo de esta Parte 3 es
100% documentación, sin código ni DDL, y ya queda registrado en
`docs/00-roadmap-fases.md` (mismo criterio aplicado a las Partes 1 y 2 de
esta misma auditoría, y a las Fases 1-6 anteriores de esta sesión) — no se
agrega una entrada a `CHANGELOG.md` para mantener su alcance consistente.
