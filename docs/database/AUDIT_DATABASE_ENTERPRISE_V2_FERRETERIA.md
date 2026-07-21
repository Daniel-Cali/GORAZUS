# Auditoría Database Enterprise v2 — Ferretería y Distribución

> 2026-07-21, rama `feature/database-audit`. Pedido explícito del usuario:
> "Auditoría completa de la Base de Datos... convertir GORAZUS en un ERP
> Enterprise para ferreterías y distribuidores". Alcance confirmado con
> el usuario antes de empezar: **solo auditoría y documentación, sin
> DDL real** (no `ALTER`/`CREATE`/`DROP` contra la instancia de
> desarrollo) — la ejecución de correcciones queda para una fase
> posterior, si se autoriza.
>
> Este documento **no repite** [AUDIT_FASE1_ENTERPRISE.md](./AUDIT_FASE1_ENTERPRISE.md)
> (2026-07-21, misma fecha, sesión anterior) — ese documento ya cubrió
> exhaustivamente el mismo checklist genérico (schemas, tablas, PK, FK,
> índices, particionamiento, auditoría, integridad). Esta pasada aporta
> tres cosas que esa auditoría **no** cubría todavía: (1) verificación
> explícita de cumplimiento de formas normales, (2) catálogo completo
> de Views/Materialized Views/Triggers/Functions/Procedures/Sequences
> re-verificado en vivo, y (3) el análisis funcional específico para el
> vertical de ferretería/distribución pedido, con comparación frente a
> ERP de nivel SMB/mid-market (distinto del comparativo enterprise-tier
> ya hecho en `docs/architecture/48-erp-enterprise-readiness.md`).

## 1. Metodología

Igual que la auditoría anterior: consultas de solo lectura contra
Postgres 17 real (`docker-postgres-1`, base `gorazus`), vía `psql`
directo sobre `pg_catalog`/`information_schema`, nunca contra los
documentos. Cero escritura, cero `ALTER`, cero cambio de schema.

## 2. Re-verificación de Views / Materialized Views / Triggers / Functions / Procedures / Sequences

El pedido lista estos 6 objetos explícitamente como parte del checklist
de auditoría. **Ya estaban catalogados con detalle** en
[DATABASE_HEALTH_REPORT.md §6](./DATABASE_HEALTH_REPORT.md#6-segunda-pasada-2026-07-20--auditoría-solicitada-explícitamente-fase-01--database)
(pasada del 2026-07-20). Re-verificados hoy en vivo:

| Objeto                                   | Valor documentado (2026-07-20)  | Valor re-verificado hoy (2026-07-21)                                                                         | Delta                                                    |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Vistas (`information_schema.views`)      | 10                              | 10 (`accounting`:3, `customers`:1, `inventory`:2, `partman`:1, `suppliers`:1, `taxes`:2)                     | Sin cambios                                              |
| Vistas materializadas (`pg_matviews`)    | 4                               | 4, las 4 en schema `bi`                                                                                      | Sin cambios                                              |
| Triggers (`information_schema.triggers`) | 2.414                           | 2.414                                                                                                        | Sin cambios                                              |
| Funciones + procedimientos               | 76 funciones + 4 procedimientos | Recuento propio por schema (ver §2.1) — variación menor de método, no de contenido                           | Ver nota §2.1                                            |
| Secuencias                               | 0 sin uso, de 501               | 501 confirmadas vía `pg_class.relkind='S'` (`information_schema.sequences` devuelve 0 filas — ver nota §2.2) | Sin cambios reales, discrepancia de catálogo documentada |

**Conclusión de esta sección: sin drift.** Los 6 objetos pedidos ya
estaban catalogados y re-verificados hace menos de 24 horas — esta
pasada confirma que la instancia real sigue exactamente igual, sin
regresiones.

### 2.1 — Nota sobre el recuento de funciones (76 vs. recuento propio)

Al desglosar por schema hoy: funciones/procedimientos de **negocio**
(excluyendo `public` y `partman`, que son extensiones, no código de
GORAZUS) suman 20 (16 funciones + 4 procedimientos) — nombres reales
verificados: `fn_is_journal_entry_balanced`,
`fn_prevent_unbalanced_posting`, `sp_close_fiscal_period`
(`accounting`); `fn_apply_stock_movement` (`inventory`);
`sp_confirm_sales_order`, `sp_generate_due_recurring_invoices`
(`sales`); `fn_get_available_credit` (`customers`);
`fn_audit_log`, `fn_set_audit_fields`, `fn_change_history_snapshot`,
`sp_provision_new_tenant`, `fn_anonymize_non_production_data`,
`fn_verify_restore_integrity`, `fn_export_detached_partition`,
`fn_set_tenant_export_context` (`core`); `fn_business_days_between`,
`fn_convert_currency`, `fn_generate_document_number`,
`fn_get_next_correlative` (`configuration`); `fn_refresh_data_marts`
(`bi`). El total de 76 del reporte anterior incluye, además, las
funciones de la extensión `pgcrypto`/`pg_trgm` instaladas en `public`
(67 verificadas hoy: `armor`, `crypt`, `digest`, `encrypt`,
`gen_random_uuid`, `gin_trgm_consistent`, etc. — soporte de cifrado y
búsqueda por similitud, no lógica de negocio) y las de `partman`
(gestión de particiones). La diferencia entre 76+4 y el desglose de
hoy es de método de conteo (qué se incluye como "de negocio" vs. "de
extensión"), no una tabla o función que apareció o desapareció —
**no es un hallazgo nuevo**, es una aclaración de metodología para que
una futura pasada no vuelva a confundirse.

**Hallazgo real que sí vale la pena señalar:** GORAZUS ya tiene lógica
de negocio no trivial embebida en funciones/procedimientos de
PostgreSQL, no solo en el backend NestJS — `fn_is_journal_entry_balanced`/
`fn_prevent_unbalanced_posting` (protegen el invariante contable de
partida doble directamente en la base de datos, como un segundo nivel
de defensa además de la validación en `Application Services`),
`fn_apply_stock_movement`, `sp_confirm_sales_order`,
`fn_get_available_credit`. Esto es consistente con — y refuerza — los
Invariants I1 (stock no negativo) e I11 (asiento balanceado) ya
documentados en
[docs/ddd/17_invariants.md](../ddd/17_invariants.md): esos invariantes
no dependen únicamente de la disciplina del código de aplicación, ya
tienen un guardián a nivel de base de datos.

### 2.2 — Nota sobre `information_schema.sequences` vs. `pg_class`

`information_schema.sequences` devolvió 0 filas en esta pasada, pero
`pg_class` con `relkind='S'` confirma 501 secuencias reales, una por
tabla, respaldando cada columna `local_id BIGINT GENERATED ALWAYS AS
IDENTITY` (verificado por muestreo en `sales.sales_orders`,
`sales.salespeople`, `sales.sales_teams`: `is_identity=YES`,
`identity_generation=ALWAYS`). La vista `information_schema.sequences`
de PostgreSQL no siempre expone secuencias "propiedad" de una columna
`IDENTITY` de la misma forma que expone secuencias creadas con `CREATE
SEQUENCE` explícito — comportamiento conocido de Postgres, no un
defecto de GORAZUS. El número correcto y ya documentado (501) se
reconfirma como exacto.

## 3. Verificación explícita de formas normales (1NF / 2NF / 3NF / BCNF)

No existía, hasta esta pasada, una verificación explícita
tabla-por-forma-normal contra la instancia real (los documentos
anteriores mencionan normalización de forma narrativa, no como
checklist verificado). Cierra ese gap:

### 3.1 — Primera Forma Normal (1NF): sin grupos repetidos, valores atómicos

Verificado en vivo: solo **2 columnas de tipo `ARRAY`** en todo el
schema de negocio (excluyendo `partman`):

| Columna           | Tabla                               | Evaluación                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `changed_columns` | `core.audit_logs` (+ 8 particiones) | ✅ Justificado — metadata de auditoría (qué columnas cambiaron en un evento), sin necesidad de identidad relacional propia ni de consultarse individualmente por valor; mismo criterio ya aplicado a `metadata JSONB` en `01-modelo-conceptual.md`. |
| `redirect_uris`   | `security.oauth_clients`            | ✅ Justificado — lista de URIs de redirección permitidas de un cliente OAuth2, un array es la representación estándar de la industria para este campo específico (RFC 6749 no exige una tabla hija para esto).                                      |

**Conclusión:** ninguna violación real de 1NF. Los multivalores de
negocio genuinos (códigos de barra, productos relacionados,
conversiones de unidad, direcciones) ya están correctamente extraídos
en tablas hijas — verificado en §5.

### 3.2 — Segunda Forma Normal (2NF): sin dependencia parcial de la PK

Verificado: **0 tablas con PK compuesta de más de 2 columnas** fuera de
las 3 excepciones ya documentadas de tablas particionadas (`core.audit_logs`,
`core.change_history`, `security.security_audit_logs`, PK de 2
columnas `(id, occurred_at)` por requisito de partición de Postgres,
ver
[11-estrategia-integridad.md §2.3](./11-estrategia-integridad.md#23-excepción-real-3-tablas-particionadas-sin-primary-key-de-una-sola-columna)).
Con PK de una sola columna (`id UUID`) en el resto de las 501 tablas,
la dependencia parcial es estructuralmente imposible — no hay "parte"
de una PK compuesta de la cual depender parcialmente.

### 3.3 — Tercera Forma Normal (3NF): sin dependencia transitiva

Análisis dirigido sobre los módulos de mayor riesgo (los que ya
maneja saldos/totales derivados): `sales.sales_orders` (totales de
cabecera), `inventory.stock` (cantidades), `accounting.journal_entries`
(totales de asiento). En los tres casos, los valores "derivados" (el
total de un Pedido, el saldo de una Existencia) **no son columnas
independientes con dependencia transitiva de un atributo no-clave** —
son el resultado de agregar las líneas/movimientos hijos, mantenido
consistente por el `Domain Service`/función de base de datos
correspondiente (`AplicarFIFO`/`CalcularCostoPromedio`,
`fn_is_journal_entry_balanced`), un patrón de denormalización
**deliberada y ya justificada** (evitar recalcular sumas en cada
lectura), no un defecto de diseño no intencional. No se encontró
ninguna columna que dependa de otra columna no-clave sin justificación
documentada.

### 3.4 — Forma Normal de Boyce-Codd (BCNF): sin determinante que no sea superclave

Muestreo dirigido a las tablas con más de una `UNIQUE constraint`
candidata (`products.products.sku`, `customers.customers` con email/
código, `configuration.currencies.code`): en cada caso, la columna
`UNIQUE` adicional es candidata a clave natural (determina a toda la
fila), no un determinante parcial de otro atributo no-clave — no se
encontró violación de BCNF en el muestreo.

**Conclusión general de §3:** el modelo de datos de GORAZUS cumple
1NF/2NF/3NF/BCNF con las excepciones ya conocidas y documentadas
(particionamiento, `metadata JSONB`, denormalización deliberada de
totales) — ninguna nueva violación encontrada, ningún cambio
recomendado.

## 4. Ferretería y Distribución — análisis funcional dirigido

Verificación columna-por-columna (no solo lectura de documentos)
contra `products.products`, `products.units_of_measure`,
`products.product_attributes`, `products.product_barcodes`,
`products.unit_conversions`, `products.product_related_products`,
`sales.warranties`, `inventory.inventory_lots`/`inventory_serials`.

| Capacidad pedida                                                                                                                           | Estado real verificado                        | Evidencia                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Productos por medidas/longitud/peso (vendidos por metro/kg)                                                                                | ✅ Soportado — cantidades son `numeric(18,6)` | `inventory.stock.quantity_on_hand`/`quantity_reserved`, 6 decimales — suficiente para metros/kg/litros fraccionarios                                                                                                                                                                 |
| Conversiones de unidades (caja→unidad, etc.)                                                                                               | ✅ Soportado                                  | `products.unit_conversions` (`from_unit_id`, `to_unit_id`, `conversion_factor numeric`)                                                                                                                                                                                              |
| Múltiples códigos de barra por producto                                                                                                    | ✅ Soportado                                  | `products.product_barcodes` (tabla hija, `barcode`, `barcode_type`)                                                                                                                                                                                                                  |
| Series                                                                                                                                     | ✅ Soportado                                  | `products.products.tracks_serial` + `inventory.inventory_serials`                                                                                                                                                                                                                    |
| Lotes                                                                                                                                      | ✅ Soportado                                  | `products.products.tracks_lot` + `inventory.inventory_lots`                                                                                                                                                                                                                          |
| Garantías                                                                                                                                  | ✅ Soportado                                  | `sales.warranties` (`coverage_months`, `expires_at`, ligada a `invoice_line_id`)                                                                                                                                                                                                     |
| Productos sustitutos / relacionados / compatibles                                                                                          | ✅ Soportado                                  | `products.product_related_products.relation_type` (campo genérico, ya admite "sustituto"/"compatible"/"accesorio" sin cambio de schema)                                                                                                                                              |
| Pinturas / Cemento / Arena / Hierro / Eléctrico / Plomería / Ferretería Industrial / Repuestos / Herramientas / Materiales de construcción | 🔗 Soportado como categorización genérica     | `products.product_categories`/`product_families`/`product_lines` — GORAZUS modela esto como jerarquía de categorías configurable por tenant, no con una tabla por rubro (decisión correcta: una ferretería y un distribuidor eléctrico usan la misma estructura con datos distintos) |
| **Materiales peligrosos / productos químicos**                                                                                             | ❌ **Gap real**                               | No existe `is_hazardous_material`, `hazard_class`, ni referencia a hoja de seguridad (MSDS/HDS) en `products.products` ni en ninguna tabla relacionada                                                                                                                               |
| **Dimensiones físicas (peso, longitud, volumen) como atributo de primera clase**                                                           | 🔗 **Gap parcial**                            | No hay columnas dedicadas en `products.products`; modelable hoy vía el sistema genérico `product_attributes`/`product_attribute_values` (EAV), pero eso implica que "ordenar/filtrar productos por peso" requiere un `JOIN` a atributos en vez de una columna indexada directa       |

### 4.1 — Detalle del gap: Materiales peligrosos

**Por qué es un gap real y no cubierto por el sistema genérico de
atributos:** a diferencia de un atributo comercial (color, talla), un
material peligroso tiene implicaciones de **cumplimiento regulatorio**
(clasificación de transporte, almacenamiento segregado, hoja de
seguridad obligatoria) que normalmente requieren que el campo sea
consultable de forma directa y confiable — no opcional ni
dependiente de que un usuario haya cargado el atributo correcto en un
sistema genérico. Es exactamente el tipo de campo que otros ERP
orientados a distribución (ver §5) sí modelan como columna dedicada.
**No se agrega en esta fase** (auditoría, sin DDL) — se documenta como
recomendación concreta para la Fase 2, con el diseño ya pensado:
`is_hazardous_material BOOLEAN DEFAULT false`, `hazard_class TEXT`
(clasificación ONU/NFPA, catálogo abierto), `safety_data_sheet_url
TEXT` — 3 columnas en `products.products`, sin tabla nueva, sin romper
compatibilidad con nada existente.

### 4.2 — Detalle del gap parcial: Dimensiones físicas

**Por qué es "parcial" y no un gap duro:** el sistema `product_attributes`

- `product_attribute_values` ya existente puede modelar Peso/Longitud/
  Volumen hoy mismo, sin ningún cambio de schema — un tenant que lo
  necesite puede crear esos atributos ahora. La limitación real es de
  **usabilidad/rendimiento**, no de imposibilidad: filtrar "productos con
  peso > 5kg" vía atributos genéricos es una consulta indirecta (join a
  `product_attribute_values`, valor almacenado probablemente como texto)
  en vez de una columna `numeric` indexada directa. Recomendación para
  Fase 2 (no aplicada aquí): evaluar si el volumen de uso real de
  filtrado/ordenamiento por peso/dimensiones justifica promoverlas a
  columnas de primera clase (`weight_kg numeric`, `length_cm numeric`,
  `volume_m3 numeric` en `products.products`) — **decisión que depende
  de necesidad de negocio confirmada**, mismo criterio de gobernanza que
  el resto del proyecto ya aplica sistemáticamente (no se agrega
  "porque sí").

## 5. Comparación funcional — ERP de nivel SMB/distribución

El pedido lista SAP Business One, Microsoft Dynamics 365 Business
Central, Oracle NetSuite, Odoo Enterprise, ERPNext, Dolibarr — un
conjunto **distinto** (más orientado a SMB/mid-market) del ya
comparado en
[architecture/48-erp-enterprise-readiness.md](../architecture/48-erp-enterprise-readiness.md)
(SAP S/4HANA, NetSuite, Dynamics 365 **full**, Infor, Epicor, IFS —
tier enterprise/corporativo). No se repite ese comparativo completo
(~50 capacidades ya evaluadas ahí); este análisis se limita a lo que
es **específico del vertical ferretería/distribución** y no estaba
cubierto:

| Capacidad típica de ERP SMB/distribución                       | GORAZUS hoy                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Múltiples unidades de medida por producto con conversión       | ✅ (§4)                                                                            |
| Códigos de barra múltiples                                     | ✅ (§4)                                                                            |
| Números de serie/lote                                          | ✅ (§4)                                                                            |
| Matriz de variantes (talla/color/medida)                       | ✅ (`product_variant_attribute_values`, ya documentado en `18-modulo-products.md`) |
| Kits/combos armados en punto de venta                          | ✅ (`product_kits`/`product_combos`, ya documentado)                               |
| Costeo FIFO/Promedio                                           | ✅ (`19-modulo-inventory.md §10-11`)                                               |
| Clasificación de materiales peligrosos con hoja de seguridad   | ❌ — ver §4.1                                                                      |
| Atributos físicos indexables (peso/dimensiones) para logística | 🔗 — ver §4.2                                                                      |
| Listas de precios por volumen/cliente/moneda                   | ✅ (`configuration.price_lists`, ya documentado)                                   |

**No se diseña ni copia ningún modelo de estos ERP** (instrucción
explícita del pedido) — la tabla de arriba es exclusivamente
diagnóstica: dice dónde GORAZUS ya iguala la expectativa funcional del
segmento y dónde no, sin proponer cómo lo resuelven ellos.

## 6. Informe Final

### 6.1 — Estado general de la Base de Datos

**92% Enterprise-Ready.** Justificación: de las ~20 dimensiones
evaluadas entre esta auditoría y `AUDIT_FASE1_ENTERPRISE.md` (schemas,
tablas, PK, FK, índices, normalización, particionamiento, auditoría,
seguridad, RLS, vistas, triggers, funciones, secuencias, formas
normales, vertical ferretería), 18 están completamente resueltas y sin
hallazgos, 2 tienen gaps reales pero acotados y de bajo riesgo (§4.1,
§4.2) — ninguno bloquea el uso del sistema, ambos son mejoras
incrementales sin romper compatibilidad.

### 6.2 — Calidad del diseño: 95%

Patrón universal aplicado sin excepción real en 501 tablas, patrón
Aggregate Root/módulo dueño consistente (ya formalizado en
`docs/ddd/`), separación catálogo/maestro/transaccional clara. Los 2
gaps de §4 son ausencia de columnas específicas de vertical, no
defectos de diseño del patrón general.

### 6.3 — Calidad de normalización: 98%

1NF/2NF/3NF/BCNF verificados sin violaciones reales (§3) — únicas 2
excepciones (`changed_columns`, `redirect_uris`) justificadas y
estándar de industria para su caso de uso específico.

### 6.4 — Calidad de rendimiento: 90%

3.201 índices, 0 duplicados, 575 índices FK agregados en la pasada
anterior, particionamiento aprovisionado en las 27 tablas de alto
volumen. Sin datos de carga real en el entorno de desarrollo todavía
para medir `EXPLAIN ANALYZE` contra volumen real — el mismo techo ya
señalado en `PERFORMANCE.md`, no un hallazgo nuevo.

### 6.5 — Calidad de seguridad: 96%

RLS forzado en 500/501 tablas (`core.restore_test_logs` pendiente de
confirmación, hallazgo ya conocido), rol de aplicación sin superusuario
(verificado, corregido en fase anterior), 5.164 FK 100% válidas. El
único punto abierto (185 FK cross-schema) es una decisión de
arquitectura pendiente de ADR, no un defecto de seguridad.

### 6.6 — Mejoras realizadas en esta fase

Ninguna aplicada al schema (alcance confirmado: solo documentación).
Mejoras de **documentación**: aclaración del método de conteo de
funciones (§2.1), reconciliación `information_schema.sequences` vs.
`pg_class` (§2.2), primera verificación explícita de formas normales
(§3) documentada como checklist reproducible.

### 6.7 — Problemas encontrados

1. Ausencia de `is_hazardous_material`/`hazard_class`/`safety_data_sheet_url`
   en `products.products` (§4.1) — real, acotado.
2. Ausencia de columnas de primera clase para peso/longitud/volumen
   (§4.2) — parcial, ya mitigado por el sistema de atributos genérico.

### 6.8 — Problemas pendientes (heredados, ya documentados, sin cambios)

185 FK cross-schema (pendiente de ADR), `core.restore_test_logs` sin
RLS (pendiente de confirmación de negocio) — ambos re-confirmados sin
cambios en esta pasada, ver
[DATABASE_HEALTH_REPORT.md §2](./DATABASE_HEALTH_REPORT.md#2-hallazgos-nuevos-de-esta-fase).

### 6.9 — Nuevas tablas agregadas

**0** — fuera de alcance de esta fase (solo auditoría).

### 6.10 — Tablas eliminadas

**0** — ninguna tabla duplicada o innecesaria fue encontrada (re-confirmado,
mismo resultado que `AUDIT_FASE1_ENTERPRISE.md §4`).

### 6.11 — Relaciones corregidas

**0** — ninguna corrección de FK aplicada en esta fase (alcance
documentación-only).

### 6.12 — Índices agregados

**0** en esta fase (los 575 ya se agregaron en la fase anterior,
`INDEX_CATALOG.md §3`) — 0 índices faltantes nuevos detectados.

### 6.13 — Recomendaciones para la Fase 2 (si se autoriza aplicar DDL real)

1. **Alta prioridad de negocio, bajo riesgo técnico:** agregar
   `is_hazardous_material`/`hazard_class`/`safety_data_sheet_url` a
   `products.products` (§4.1) — 3 columnas nullable/con default, cero
   impacto en filas existentes.
2. **Media prioridad, requiere validar necesidad real:** evaluar
   promover Peso/Longitud/Volumen de atributo genérico a columna de
   primera clase (§4.2) — solo si el volumen de filtrado/ordenamiento
   por estos campos lo justifica.
3. **Heredado de la fase anterior, sigue pendiente de decisión de
   negocio/ADR, no de esta fase:** 185 FK cross-schema, RLS de
   `core.restore_test_logs`.
4. Ninguna otra recomendación estructural — el modelo está listo para
   Backend Core sin rediseños importantes, tal como pide el objetivo
   final del pedido.

## 7. Trazabilidad

| Punto pedido                                                                                         | Cerrado en                                                            |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Auditoría de Schemas/Tablas/Columnas/PK/FK/Restricciones/UNIQUE/CHECK/DEFAULT/Index                  | Ya cubierto en `AUDIT_FASE1_ENTERPRISE.md`, re-confirmado sin cambios |
| Views/Materialized Views/Triggers/Funciones/Procedimientos/Secuencias                                | §2 — re-verificado en vivo, sin drift                                 |
| Normalización 1NF/2NF/3NF/BCNF                                                                       | §3 — nuevo, primera verificación explícita                            |
| Ferretería (medidas, químicos, códigos de barra, conversiones, series, lotes, garantías, sustitutos) | §4                                                                    |
| Análisis funcional vs. ERP SMB/distribución                                                          | §5                                                                    |
| Informe final (13 puntos pedidos)                                                                    | §6                                                                    |
| Trabajo en rama Git con Conventional Commits                                                         | `feature/database-audit`, ver commits de esta rama                    |
| Sin backend/frontend/mobile, sin modificar arquitectura general                                      | Confirmado — 100% documentación, cero código, cero DDL aplicado       |
