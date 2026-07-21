# 02 — Modelo Lógico

## 1. Cómo se pasa de ~350 entidades conceptuales a ~700-1000 tablas físicas

El [modelo conceptual](./01-modelo-conceptual.md) listó ~350 entidades
de negocio. El modelo lógico las expande a tablas físicas aplicando,
de forma sistemática y documentada (no ad-hoc), estos cuatro patrones:

### 1.1 Patrón de estado (`_status` / `_status_history`)

Las entidades con ciclo de vida transaccional complejo (una Orden de
Venta pasa por Borrador→Confirmada→Facturada→Anulada, con reglas sobre
qué transición es válida) reciben:

- Una tabla catálogo `<entidad>_status` (código, nombre, es_estado_final,
  color/ícono sugerido para UI) — permite agregar estados nuevos por
  tenant sin `ALTER TYPE`, a diferencia de un `ENUM` nativo.
- Una tabla `<entidad>_status_history` que registra cada transición
  (estado anterior, estado nuevo, usuario, momento, motivo).

Se aplica a los ~20 flujos de mayor complejidad de negocio (órdenes de
venta/compra, facturas, órdenes de servicio, proyectos, órdenes de
producción, corridas de nómina, etc. — cada módulo lo indica
explícitamente). Para estados simples de dos/tres valores sin historial
de negocio relevante, se usa la columna `is_active` universal o un
`CHECK` de valores fijos — no toda entidad necesita esta expansión.

### 1.2 Patrón de traducción (`_translations`)

Las entidades maestras cuyo texto es visible para el usuario final y
tiene sentido traducir (nombre de producto, nombre de categoría,
nombre de impuesto, plantilla de notificación) reciben una tabla hija
`<entidad>_translations` con `(parent_id, language_code, campo_1,
campo_2, ...)` y `UNIQUE (parent_id, language_code)`. **No** se aplica
a entidades transaccionales (una Orden de Venta no se traduce, sus
datos son hechos, no contenido editorial) ni a datos que ya son
universales por naturaleza (un código ISO no se traduce).

### 1.3 Patrón de unión N:M

Toda relación muchos-a-muchos es su propia tabla física con las 18
columnas universales completas (no una tabla "liviana" sin auditoría —
ver [01-modelo-conceptual §1](./01-modelo-conceptual.md#1-el-patrón-universal-toda-tabla-de-negocio),
la decisión del usuario fue explícita: **toda** tabla lleva el patrón
completo, incluidas las de unión, porque en un ERP auditable "quién
otorgó este permiso y cuándo" es dato de negocio real, no ruido).

### 1.4 Patrón de línea de documento (`_line` / `_detail`)

Todo documento transaccional (cotización, orden, factura) tiene su
tabla de encabezado y una tabla `_line` separada — nunca líneas como
array/JSONB, porque las líneas se filtran, se indexan y se referencian
individualmente (p. ej. una línea de factura referenciada por un
movimiento de inventario puntual).

## 2. Convención de nombres de tabla

`<schema>.<entidad_en_plural_snake_case>` — ejemplo: `sales.sales_orders`,
`sales.sales_order_lines`, `sales.sales_order_status`,
`products.product_translations`. El schema **es** el módulo (ver
[docs/architecture/01-estructura-monorepo.md](../architecture/01-estructura-monorepo.md)) —
nunca hay ambigüedad de a qué módulo pertenece una tabla mirando su
nombre completo.

## 3. Inventario completo por módulo

Cada módulo tiene su propio documento de inventario (mismo criterio de
navegabilidad que `docs/menus/`: un archivo grande por dominio, no un
único archivo de miles de líneas). Cada tabla lista: nombre físico,
propósito en una línea, y sus FKs no-universales más relevantes (las
FKs universales — `tenant_id`, `company_id`, `branch_id`, `created_by`,
`updated_by`, `deleted_by` hacia `core.*` — se dan por sabidas en
**todas**, no se repiten fila por fila).

| #   | Módulo         | Documento                                                  | Tablas reales |
| --- | -------------- | ---------------------------------------------------------- | ------------- |
| 1   | Core           | [logico/01-core.md](./logico/01-core.md)                   | 65            |
| 2   | Security       | [logico/02-security.md](./logico/02-security.md)           | 24            |
| 3   | Customers      | [logico/03-customers.md](./logico/03-customers.md)         | 18            |
| 4   | Suppliers      | [logico/04-suppliers.md](./logico/04-suppliers.md)         | 13            |
| 5   | Products       | [logico/05-products.md](./logico/05-products.md)           | 35            |
| 6   | Inventory      | [logico/06-inventory.md](./logico/06-inventory.md)         | 34            |
| 7   | Sales          | [logico/07-sales.md](./logico/07-sales.md)                 | 54            |
| 8   | Purchases      | [logico/08-purchases.md](./logico/08-purchases.md)         | 27            |
| 9   | Cash           | [logico/09-cash.md](./logico/09-cash.md)                   | 11            |
| 10  | Banks          | [logico/10-banks.md](./logico/10-banks.md)                 | 14            |
| 11  | Accounting     | [logico/11-accounting.md](./logico/11-accounting.md)       | 28            |
| 12  | Taxes          | [logico/12-taxes.md](./logico/12-taxes.md)                 | 13            |
| 13  | CRM            | [logico/13-crm.md](./logico/13-crm.md)                     | 17            |
| 14  | HR             | [logico/14-hr.md](./logico/14-hr.md)                       | 28            |
| 15  | Payroll        | [logico/15-payroll.md](./logico/15-payroll.md)             | 22            |
| 16  | Services       | [logico/16-services.md](./logico/16-services.md)           | 18            |
| 17  | Projects       | [logico/17-projects.md](./logico/17-projects.md)           | 16            |
| 18  | Assets         | [logico/18-assets.md](./logico/18-assets.md)               | 10            |
| 19  | Reports        | [logico/19-reports.md](./logico/19-reports.md)             | 11            |
| 20  | BI             | [logico/20-bi.md](./logico/20-bi.md)                       | 14            |
| 21  | Configuration  | [logico/21-configuration.md](./logico/21-configuration.md) | 23            |
|     | **Total real** |                                                            | **495**       |

Llave primaria, cardinalidad, restricciones e índices — universales y
por rol de tabla, con ejemplo completo aplicado a un módulo real — se
documentan por separado en
[02a-restricciones-e-indices.md](./02a-restricciones-e-indices.md)
para no mezclar el inventario funcional (este documento) con el detalle
estructural (ya resuelto, además, como fuente de verdad en
[sql/](./sql/)).

## 4. Nota transparente sobre el número: 494 vs. el rango 700-1000 pedido

> **Actualización 2026-07-13:** el conteo original de esta sección
> (494) es anterior al Core Platform
> ([32-core-platform/](../architecture/32-core-platform/README.md)),
> que agregó 3 tablas genuinamente nuevas a `core`
> (`business_rules`, `business_rule_evaluations`, `background_jobs` —
> ver [01-core.md](./logico/01-core.md#motor-de-reglas-de-negocio-y-trabajos-en-segundo-plano))
> tras confirmar que ningún schema existente cubría un motor de reglas
> genérico ni una cola de trabajo asíncrono on-demand. Después, al
> diseñar los 4 módulos pendientes de la Fase 6
> ([36](../architecture/36-modulos-de-negocio-plan-de-implementacion-fase-6.md)),
> se agregó 1 tabla más
> (`projects.project_role_rates`, ver
> [40-modulo-projects.md](../architecture/40-modulo-projects.md#3-recursos-tarifas-y-tareas))
> — el resto de esos 4 módulos cerró sus gaps con columnas, no tablas
> nuevas. El total real pasa de 494 a **498 tablas**. La narrativa de
> esta sección (por qué 494 y no 700-1000) sigue vigente sin cambios —
> es una explicación de disciplina de diseño, no una promesa de que el
> número nunca crecería ante un gap real y verificado.

El pedido original fue "aproximadamente 700 a 1,000 tablas" y "no
limites la cantidad". El resultado de aplicar la disciplina de
no-duplicación fijada en
[01-modelo-conceptual §3](./01-modelo-conceptual.md#3-regla-de-no-duplicación-entre-módulos)
converge en **494 tablas reales** (498 desde la incorporación del Core
Platform y los 4 módulos de la Fase 6, ver nota arriba), no en
700-1000. Esto es una decisión
consciente, no una limitación por pereza — la diferencia son
exactamente las tablas que se **evitó crear a propósito**:

- Sin `pos_invoices`/`pos_invoice_lines` separadas de `invoices` (canal,
  no entidad nueva).
- Sin tabla `colors`/`sizes`/`materials` paralela al sistema de
  atributos genérico.
- Sin `customer_documents`/`product_documents`/`employee_documents`
  repetidos — todos usan `core.documents` polimórfico.
- Sin `subcategories` como tabla de un único nivel fijo — jerarquía
  auto-referenciada de N niveles en una sola tabla.
- Sin `general_ledger_balances`/`kardex_entries` como tablas base —
  son vistas derivadas (ver [24_views.sql](./sql/24_views.sql)).

Llegar mecánicamente a 700-1000 exigiría una de estas dos rutas, y
**ninguna se tomó por defecto**:

1. **Fragmentar por país/vertical de industria**: una tabla
   `mx_cfdi_invoices`, `cl_dte_invoices`, `br_nfe_invoices`... en vez de
   `fiscal_document_types` genérico; o módulos específicos de
   hotelería/restaurante/farmacia en vez del modelo genérico
   producto/servicio + `metadata`. Esto multiplica tablas reales pero
   viola directamente la memoria de proyecto de no construir de forma
   pareja capacidades que el negocio no confirmó necesitar, y además
   contradice "escalable sin rediseño": cada país/vertical nuevo
   agregaría tablas en vez de usar el modelo genérico ya preparado para
   eso (`fiscal_document_types`, `metadata JSONB`, atributos
   dinámicos).
2. **Normalizar en exceso tablas de 2-3 valores fijos** (un catálogo
   `address_types` de 3 filas, por ejemplo) en vez de un `CHECK`. Suma
   tablas sin sumar capacidad real.

**Si el objetivo numérico es un requisito duro** (por ejemplo, porque
el número mismo importa para una propuesta o benchmark frente a SAP/
Dynamics), decilo explícitamente y se agregan más tablas de extensión
funcional real en áreas concretas — candidatos ya identificados y no
construidos todavía: comprobantes fiscales electrónicos con un formato
por país (en vez de uno genérico), profundidad de manufactura (rutas de
producción, centros de trabajo con capacidad, control de calidad
detallado), profundidad de RRHH/nómina por país (cada régimen de
seguridad social como su propio conjunto de tablas en vez de tablas
paramétricas), y automatización de marketing en CRM (secuencias de
email, scoring de leads). Mientras tanto, se continúa con 494 como base
para el diagrama de relaciones, las estrategias y el SQL — es la base
real sobre la que se construye todo lo que sigue.
