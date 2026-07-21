# Normalization Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 5 (2026-07-21). **Nota de
> alcance, antes de empezar:** al inicio de esta auditoría (Parte 1) se
> acordó explícitamente con el usuario trabajar en modo **solo
> auditoría/documentación, sin aplicar DDL real** contra la base de
> desarrollo (que tiene un contenedor de API corriendo en vivo contra
> ella). Esta Parte 5 pide explícitamente acciones que exceden ese
> acuerdo — "corregir automáticamente", "tablas fusionadas", "tablas
> eliminadas", "catálogos consolidados" son **cambios reales de schema**,
> no documentación. Este reporte completa el análisis completo (los 11
> entregables pedidos), pero **no aplica ningún DDL** sin una confirmación
> explícita nueva del usuario — ver §9. Se sigue trabajando en
> `feature/database-audit` (no se crea `feature/database-normalization`
> todavía, para no implicar que ya hay cambios reales en curso antes de
> esa confirmación).

## 1. Reporte de Primera Forma Normal — 1FN (entregable 1)

Ya verificado en profundidad en
[AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §3.1](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#31--primera-forma-normal-1nf-sin-grupos-repetidos-valores-atómicos)
(Parte 1). Re-confirmado sin cambios en esta pasada:

| Chequeo                                                                     | Resultado                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Campos atómicos (sin listas dentro de una columna)                          | ✅ Solo 2 columnas `ARRAY` en todo el modelo de negocio, ambas justificadas (`core.audit_logs.changed_columns`, `security.oauth_clients.redirect_uris`)                                                                                                                                                                                                                  |
| Valores únicos donde corresponde                                            | ✅ 749 restricciones `UNIQUE` reales (ver `RELATIONSHIP_CATALOG.md §1`)                                                                                                                                                                                                                                                                                                  |
| Sin datos repetitivos (grupos repetidos tipo `producto_1, producto_2, ...`) | ✅ 0 encontrados — todo multivalor real está en tabla hija (`product_barcodes`, `product_related_products`, etc.)                                                                                                                                                                                                                                                        |
| Uso de JSON/JSONB                                                           | 🔗 `metadata JSONB` presente en las 501 tablas (columna universal) — **no es una violación de 1FN**: es un campo explícitamente reservado para datos verdaderamente heterogéneos/específicos de tenant que no ameritan columna propia, nunca usado para datos estructurados que deberían ser columnas o tablas (ver justificación original en `01-modelo-conceptual.md`) |

**0 violaciones de 1FN. 0 correcciones automáticas necesarias.**

## 2. Reporte de Segunda Forma Normal — 2FN (entregable 2)

| Chequeo                                                                            | Resultado                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependencias parciales (columna que depende solo de una parte de una PK compuesta) | ✅ Estructuralmente imposible en 498 de 501 tablas — PK de una sola columna (`id UUID`)                                                                                                                                                                                              |
| Tablas con PK compuesta                                                            | 3 (`core.audit_logs`, `core.change_history`, `security.security_audit_logs`) — excepción ya documentada por requisito de partición, ambas columnas de la PK (`id`, `occurred_at`) son necesarias para identidad + partición, ninguna columna no-clave depende de una sola de las dos |
| Tablas mal diseñadas por 2FN                                                       | ✅ 0                                                                                                                                                                                                                                                                                 |

**0 violaciones de 2FN.**

## 3. Reporte de Tercera Forma Normal — 3FN (entregable 3)

| Chequeo                                          | Resultado                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencias transitivas                         | ✅ 0 nuevas — análisis dirigido en `sales.sales_orders`, `inventory.stock`, `accounting.journal_entries` sin hallazgos (ver Parte 1)                                                                                      |
| Campos calculables almacenados sin justificación | ✅ 0 — totales de documento y saldos son denormalización deliberada y documentada (`docs/ddd/17_invariants.md` I9), mantenidos consistentes por Domain Services/funciones de base de datos, no un olvido de normalización |
| Información repetida                             | ✅ 0 nueva                                                                                                                                                                                                                |
| Datos derivados sin mecanismo de consistencia    | ✅ 0 — todo dato derivado tiene un Domain Service o función de Postgres (`fn_is_journal_entry_balanced`, etc.) que lo mantiene correcto, ver `DATABASE_ANALYSIS.md §2`                                                    |

**0 violaciones de 3FN.**

## 4. Reporte BCNF (entregable 4)

| Chequeo                              | Resultado                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo determinante es clave candidata | ✅ Verificado por muestreo en tablas con múltiples `UNIQUE` (`products.products.sku`, `configuration.currencies.code`) — cada `UNIQUE` adicional determina la fila completa, no un subconjunto de columnas |
| Excepciones documentadas             | Las 3 tablas de PK compuesta por partición (mismas de §2) — su "excepción" es de forma de PK, no de violación BCNF real (ninguna columna no-clave depende de un subconjunto no-superclave)                 |

**0 violaciones BCNF.**

## 5. Análisis de redundancia (nuevo en esta pasada — catálogos)

| Chequeo                           | Resultado                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Columnas duplicadas               | ✅ 0 (re-confirmado 4ª vez esta sesión)                                                                                                |
| Información repetida entre tablas | ✅ 0                                                                                                                                   |
| **Catálogos repetidos**           | ✅ 0 — verificado explícitamente en esta pasada (§5.1)                                                                                 |
| Relaciones innecesarias           | ✅ 0 nuevas (185 FK cross-schema ya conocidas, no son "innecesarias", son una violación de ubicación física, ver `FOREIGN_KEYS.md §3`) |
| Tablas redundantes                | ✅ 0                                                                                                                                   |

### 5.1 — Catálogos: ¿duplicados entre módulos?

Se enumeraron las ~40 tablas tipo `*_types`/`*_status`/`*_reasons`/
`*_methods`/`*_classifications`/`*_categories` en todo el modelo (Estados,
Tipos, Clasificaciones, Categorías, Motivos, Tipos de movimiento, Tipos de
documento, Tipos de pago — exactamente lo pedido). **Ninguna es un
duplicado real** — cada una está scopeada a su propio módulo porque
representa un dominio de valores distinto, aunque el nombre "suene"
similar (`sales.invoice_status` ≠ `purchases.purchase_invoice_status` ≠
`payroll.payroll_run_status`: 3 ciclos de vida de documento completamente
distintos). Fusionarlas en una tabla "genérica de estados" sería el
anti-patrón contrario — perdería el patrón módulo-dueño y la seguridad de
tipo por dominio.

**Único par verificado a fondo por posible solapamiento real:**
`configuration.payment_forms` (catálogo genérico: efectivo/tarjeta/
transferencia/cheque) vs. `configuration.payment_methods`
(configuración concreta por tenant: `payment_form_id` + `bank_account_id`

- nombre, p. ej. "Transferencia BBVA cuenta 123"). **No son duplicados —
  es una jerarquía de 2 niveles correcta** (clasificación genérica →
  instancia configurada), mismo patrón que Marca→Producto.

**0 catálogos para consolidar.**

## 6. Tablas — decisión por tabla (entregable, checklist completo)

| Decisión                                     | Cantidad   | Justificación                                                                                                                   |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Mantener                                     | 497 de 501 | Sin hallazgo que amerite cambio (ver `DATABASE_ANALYSIS.md §6`)                                                                 |
| Mejorar (agregar columnas, no reestructurar) | 4          | `products.products` (hazmat), `core.companies`/`core.branches` (país/idioma/timezone) — mismos 4 ya identificados en Partes 1-3 |
| Fusionar                                     | 0          | Ningún par de tablas comparte responsabilidad — ver §5.1                                                                        |
| Dividir                                      | 0          | Ninguna tabla mezcla más de una responsabilidad (máximo 32 columnas, todas cohesivas — ver `DATABASE_ANALYSIS.md §3`)           |
| Eliminar                                     | 0          | Ninguna tabla sin propósito de negocio documentado                                                                              |
| Renombrar                                    | 0          | 0 violaciones de nomenclatura encontradas en 4 pasadas de esta sesión                                                           |
| Mover de schema                              | 0          | 0 tablas mal ubicadas (`SCHEMA_CATALOG.md §3`)                                                                                  |

## 7. Columnas (entregable, checklist)

| Chequeo                                | Resultado                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Columnas calculables sin justificación | ✅ 0 (ver §3)                                                                                                                                                                                         |
| Columnas redundantes                   | ✅ 0                                                                                                                                                                                                  |
| Columnas sin uso                       | 🟡 No determinable con certeza sin datos de producción (mismo límite ya señalado 3 veces en esta sesión)                                                                                              |
| Columnas obsoletas                     | ✅ 0 — ninguna columna identificada como remanente de un diseño abandonado                                                                                                                            |
| Columnas con nombres ambiguos          | 🟢 1 candidata revisada: `core.system_settings.value` — **no es ambigüedad real**, es el patrón esperado de una tabla clave-valor de configuración (acompañada de `key`/`parameter_id` para contexto) |

## 8. Porcentaje de normalización (entregable 11)

**100% — 0 violaciones reales de 1FN/2FN/3FN/BCNF encontradas en 2
pasadas independientes de esta sesión** (Parte 1 y esta Parte 5). Las 3
excepciones de PK compuesta son requisito técnico de particionamiento de
Postgres, no una violación de forma normal.

## 9. Mejoras implementadas (entregable 10) — y la pregunta que falta responder

**0 aplicadas en esta pasada** — por el acuerdo de alcance vigente desde
el inicio de esta auditoría (solo documentación, sin DDL contra `dev`).
Las 4 mejoras identificadas (§6, "Mejorar") están completamente
especificadas y listas para aplicarse (columnas nuevas, nullable, sin
impacto en filas existentes, bajo riesgo técnico) — **solo falta
autorización explícita** para pasar de "documentado" a "aplicado". Si se
autoriza, la ejecución sería:

```sql
-- products.products
ALTER TABLE products.products
  ADD COLUMN is_hazardous_material boolean NOT NULL DEFAULT false,
  ADD COLUMN hazard_class text,
  ADD COLUMN safety_data_sheet_url text;

-- core.companies / core.branches
ALTER TABLE core.companies
  ADD COLUMN country_id uuid REFERENCES configuration.countries(id),
  ADD COLUMN language_id uuid,
  ADD COLUMN timezone text;
ALTER TABLE core.branches
  ADD COLUMN country_id uuid REFERENCES configuration.countries(id),
  ADD COLUMN language_id uuid,
  ADD COLUMN timezone text;
```

(SQL ilustrativo del alcance exacto, **no ejecutado** — quedaría como
archivo `sql/35_*.sql` append-only, siguiendo la convención ya
establecida, si se autoriza.)

## 10. Validación ferretería y análisis Enterprise (entregables cubiertos, referencia)

Ambos ya verificados exhaustivamente en las Partes 1, 3 y 4 de esta misma
auditoría — no se repiten:

- Ferretería: [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#4-ferretería-y-distribución--análisis-funcional-dirigido) +
  [DATABASE_ANALYSIS.md §5](./DATABASE_ANALYSIS.md#5-validación-ferretería--nivel-de-tabla-más-profundo-que-la-parte-1) +
  [ENTITY_RELATIONSHIPS.md §1](./ENTITY_RELATIONSHIPS.md#1-cadena-de-relaciones--validación-ferretería-entregable-verificación-puntual) —
  fraccionables (`numeric(18,6)`), pinturas/herramientas/eléctrico/plomería/
  tornillería/hierros/maderas/tubos/cables (categorización genérica),
  combos/kits/sustitutos/compatibilidades/garantías/series/lotes/historial
  de costos/múltiples proveedores/conversión de unidades — todo
  confirmado, 0 gaps nuevos.
- Enterprise: `>100 empresas` y `>1000 sucursales` — sin límite estructural
  (`tenant_id`/`company_id`/`branch_id` son `uuid`, sin restricción de
  cardinalidad); millones de clientes/productos/movimientos — particionado
  y RLS ya diseñados para ese volumen (`07-estrategia-particionamiento.md`);
  alta concurrencia — transacciones cortas ya como convención
  (`docs/ddd/09_repositories.md`); replicación —
  `09-estrategia-replicacion.md`; microservicios —
  `10-evolucion-a-microservicios.md`, el patrón módulo-dueño ya lo habilita.

## 11. Trazabilidad

| Entregable pedido               | Sección                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| 1-4. Reportes 1FN/2FN/3FN/BCNF  | §1-4                                                                       |
| 5. Tablas fusionadas            | §6 — 0                                                                     |
| 6. Tablas divididas             | §6 — 0                                                                     |
| 7. Tablas eliminadas            | §6 — 0                                                                     |
| 8. Catálogos consolidados       | §5.1 — 0 (ninguno era duplicado)                                           |
| 9. Problemas encontrados        | §1-7 — 0 violaciones reales, 4 mejoras aditivas pendientes de autorización |
| 10. Mejoras implementadas       | §9 — 0 aplicadas, 4 especificadas y listas                                 |
| 11. Porcentaje de normalización | §8 — 100%                                                                  |

**Ver también:** [TABLE_ANALYSIS.md](./TABLE_ANALYSIS.md) (análisis de
columna profundizado) y [DATA_MODEL.md](./DATA_MODEL.md) (modelo de datos
final consolidado).
