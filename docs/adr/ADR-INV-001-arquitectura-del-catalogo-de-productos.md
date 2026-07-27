# ADR-INV-001 — Arquitectura del Catálogo de Productos

|                             |                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Estado**                  | Aceptada                                                                                                                                                                                                                                                                                                                                                                                         |
| **Fecha**                   | 2026-07-27                                                                                                                                                                                                                                                                                                                                                                                       |
| **Autor**                   | Chief Enterprise Software Architect, GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                      |
| **Ámbito**                  | Dominio de Catálogo de Productos (`products`, 35 tablas certificadas), límites con `inventory`, `sales`, `purchases`, `accounting`, `taxes`, `assets`, `crm`                                                                                                                                                                                                                                     |
| **Documentos relacionados** | [docs/architecture/18-modulo-products.md](../architecture/18-modulo-products.md) (diseño físico ya certificado — fuente principal de verdad de este ADR), [docs/reports/productos/PRODUCTOS_REPORT.md](../reports/productos/PRODUCTOS_REPORT.md) (estado real implementado, `v0.7.0`), [docs/architecture/11-gobernanza-y-adrs.md](../architecture/11-gobernanza-y-adrs.md) (convención de ADRs) |

Este documento formaliza, como decisión de arquitectura de dominio, el diseño del Catálogo de
Productos de GORAZUS ERP Enterprise. A diferencia de `18-modulo-products.md` (que documenta _qué_
existe físicamente, tabla por tabla, ya verificado contra el schema real), este ADR documenta _por
qué_ el dominio está delimitado como está, qué pertenece a él y qué no, y propone la formalización
de dos piezas que hoy existen solo parcialmente: una capa de clasificación de negocio sobre el tipo
de producto (§3) y un ciclo de vida gobernado (§4). Cada afirmación distingue explícitamente entre
**estado real verificado** (contra `core/database/prisma/schemas/products/schema.prisma` y
`modules/productos/backend/`) y **recomendación de este ADR** donde ambos difieren — mismo criterio
de honestidad que `ADR-DB-001`.

---

## 1. Propósito

### 1.1 Por qué todo ERP depende de un catálogo de productos bien diseñado

El Catálogo de Productos es el único punto del sistema donde se responde, de forma autoritativa y
sin ambigüedad, a la pregunta "¿qué es esto que se compra, se vende, se fabrica o se consume?". Todo
otro dominio de GORAZUS — inventario, compras, ventas, POS, contabilidad, CRM, reportes, la API
pública — opera sobre una _referencia_ a un producto, nunca sobre una copia independiente de su
definición. Si esa definición central es ambigua, duplicada o inconsistente, el error se propaga a
cada dominio que la consume: un SKU duplicado produce conteos de inventario incorrectos, una unidad
de medida mal definida produce costos de compra incomparables con precios de venta, un tipo de
producto mal clasificado produce asientos contables en la cuenta equivocada. Esta es la razón por la
que SAP (Material Master), Microsoft Dynamics 365 (Released Products) y Oracle NetSuite (Item
Records) tratan a su catálogo de productos como el módulo fundacional del sistema, construido antes
que cualquier módulo transaccional — GORAZUS sigue el mismo orden de dependencia: `products` no
depende de ningún otro dominio de negocio, todos los demás dependen de él.

### 1.2 Integración con otros dominios

| Dominio                         | Qué consume de `products`                                                                                                                                                                                                                                                      | Qué NO le pertenece a `products`                                                                                                                                                                                                                                                           | Evidencia real                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Inventario** (`inventory`)    | La _declaración_ de si un producto rastrea lote/serie (`tracks_lot`/`tracks_serial`), el `costing_method` para valuar existencias, `base_unit_id` para registrar movimientos en la unidad correcta.                                                                            | Las _cantidades_ reales de existencia (`inventory.stock`), los _movimientos_ (`inventory.stock_movements`, ya catalogada en `ADR-DB-001 §7`), y las _instancias_ de lote/serie (`inventory.inventory_lots`/`inventory_serials`) — `products` declara la capacidad, `inventory` la ejecuta. | `18-modulo-products.md §6-7`, verificado tabla por tabla.                                                   |
| **Compras** (`purchases`)       | `product_suppliers` (proveedor preferido, tiempo de entrega, último costo de compra) como catálogo de referencia para emitir órdenes de compra.                                                                                                                                | La _ejecución_ de la orden de compra y la factura de compra (`purchases.purchase_orders`/`purchase_invoices`, ya catalogadas en `ADR-DB-001 §7`) — `products` solo informa con quién y a qué costo histórico se compró, no ejecuta la compra.                                              | Verificado por `product_id` como FK suelta desde `purchases.purchase_order_lines`/`purchase_invoice_lines`. |
| **Ventas** (`sales`)            | `product_id`, `sku`, `list_price`/`standard_cost` como referencia inicial, `product_tax_profiles` para determinar qué impuesto aplica a la línea.                                                                                                                              | El precio _real_ cobrado en cada línea de venta (`sales.invoice_lines.unit_price`, un valor congelado al momento de la venta — nunca una lectura en vivo de `list_price`, por diseño: el precio histórico de una factura ya emitida no puede cambiar si el catálogo cambia después).       | `sales.invoices`/`invoice_lines`, ya catalogadas en `ADR-DB-001 §7`.                                        |
| **POS** (`pos`)                 | `product_barcodes` para el escaneo en el mostrador, `sku`/`list_price` para la venta directa (`POS Parte 01`, ya construido — la venta de mostrador es una factura directa de `sales`).                                                                                        | Su propia lógica de cobro y turno de caja (`pos.cash_sessions`, fuera del alcance de este dominio).                                                                                                                                                                                        | `modules/ventas/README.md` — integración POS→Ventas ya real.                                                |
| **Contabilidad** (`accounting`) | `product_tax_profiles.tax_id` para el cálculo de impuesto por línea, `costing_method` para saber cómo se valuó el costo de venta que se contabiliza.                                                                                                                           | La _definición_ de la tasa de impuesto (`taxes.taxes`/`tax_rates`, dominio propio) y el asiento contable en sí (`accounting.journal_entries`, disparado por `ventas`/`compras`, no por `products` directamente).                                                                           | `taxes.taxes`/`tax_rates` ya mapeadas en `ADR-DB-001 §8` como catálogo propio, no de `products`.            |
| **CRM** (`crm`)                 | `product_related_products` para venta cruzada/sugerida, `product_reviews` como retroalimentación de cliente sobre un producto.                                                                                                                                                 | La gestión de la relación con el cliente en sí (`crm.leads`/`opportunities`) — `products` es consumido por CRM, no al revés.                                                                                                                                                               | Schema real, sin código de aplicación todavía (§2.3).                                                       |
| **Reportes / BI** (`bi`)        | Las seis dimensiones de clasificación (`category_id`/`brand_id`/`model_id`/`line_id`/`family_id`/`collection_id`) como ejes de agrupación para KPIs y snapshots (`bi.kpi_snapshots`, ya catalogada en `ADR-DB-001 §7`).                                                        | El cálculo del KPI en sí — `products` provee las dimensiones, no el motor analítico.                                                                                                                                                                                                       | Estructura de clasificación verificada en `18-modulo-products.md §1`.                                       |
| **API**                         | `metadata JSONB` (con índice `GIN`, ya certificado — `idx_products_products_metadata`) como mecanismo de extensión sin migración de schema para integraciones externas; `product_barcodes` como punto de búsqueda por código de barras para integraciones de escaneo externas. | Cualquier autenticación/autorización de la API en sí (`auth`/`seguridad`, dominio propio).                                                                                                                                                                                                 | Índice `GIN` verificado en el schema real (§5).                                                             |

## 2. Responsabilidades del Dominio

### 2.1 Lo que pertenece a este dominio

- **Identidad y unicidad del producto**: `sku` único por empresa, tipo de producto
  (`product_type`), y las seis dimensiones de clasificación independientes
  (categoría/marca/modelo/línea/familia/colección).
- **Modelado de composición, como definición, no como ejecución**: variantes (auto-referencia vía
  `parent_product_id`), atributos genéricos y sus valores, kits y combos (agrupación comercial), BOM
  y recetas (composición para producción) — el _qué está hecho de qué_ es responsabilidad de este
  dominio; el _ejecutar_ esa composición (descontar componentes, generar producto terminado) es de
  `inventory` (§2.2).
- **Unidad de medida base y conversiones**: `units_of_measure`, `unit_conversions` — todo producto
  físico tiene una unidad base obligatoria, y el dominio declara cómo convertir entre unidades
  alternativas para el mismo producto (p. ej. comprar por caja, vender por unidad).
- **Metadatos de identificación física**: códigos de barra (`product_barcodes`, con tipo,
  `gtin` por defecto), atributos físicos para logística (`product_physical_attributes`: peso,
  dimensiones, volumen).
- **Material de referencia visual y documental**: imágenes, videos, reseñas — vía referencia al
  repositorio transversal de archivos (`core.files`), sin gestión de almacenamiento propia.
- **Datos de referencia comercial, no reglas de negocio de venta**: `list_price`/`standard_cost`
  como valores de referencia inicial, y el catálogo de proveedores asociados
  (`product_suppliers`) como dato de referencia de abastecimiento.
- **Asociación con perfil fiscal**: qué impuesto(s) aplican a un producto (`product_tax_profiles`),
  sin poseer la definición de esos impuestos.
- **Historial de precios como registro, no como motor de pricing**: `product_price_history` es una
  bitácora de cambios de precio de referencia, no el motor que calcula descuentos/promociones/listas
  de precio por cliente (eso es `sales`/`configuration.price_lists`, dominio ajeno).

### 2.2 Lo que explícitamente NO pertenece a este dominio

- **Cantidades y movimientos de inventario** — `inventory.stock` (saldo actual, no particionada por
  ser tabla de estado, no de eventos — criterio ya establecido en `ADR-DB-001 §8`) y
  `inventory.stock_movements` (particionada, `ADR-DB-001 §7`) son propiedad exclusiva de
  `inventory`. `products` declara la _capacidad_ de rastrear lote/serie; nunca posee una cantidad.
- **Ejecución de producción** — `inventory.production_orders` consume los componentes de un
  `bill_of_materials`/`recipes` y genera el producto terminado; `products` modela la receta, no la
  ejecuta.
- **Instancias de lote y serie** — `inventory.inventory_lots`/`inventory_serials`, con su propio
  ciclo de vida (`in_stock → sold → under_warranty → scrapped` para series, ya documentado en
  `18-modulo-products.md §7`) — fuera de este dominio por diseño explícito.
- **Reglas de precio de venta, descuentos y promociones** — `sales`/`configuration.price_lists`,
  `discounts`, `promotions` (ya catalogadas como fuera de alcance de Ventas Parte 1 en
  `SALES_ROADMAP.md`) son dominio de `sales`/`configuration`, no de `products`.
- **Definición y cálculo de tasas de impuesto** — `taxes.taxes`/`tax_rates` es un dominio de
  catálogo propio, ya identificado en `ADR-DB-001 §8` como tabla que no se particiona por las mismas
  razones que aplican aquí: crece con reglas fiscales configuradas, no con el catálogo de productos.
- **Activos fijos de la empresa** — ver límite explícito en §3.7. GORAZUS ya certifica un dominio
  `assets` completo y dedicado (`assets.fixed_assets`, `asset_categories`, `depreciation_methods`,
  `asset_depreciation_entries`, `asset_maintenances`, `asset_disposals`, `asset_revaluations`,
  `asset_transfers`) — un bien que la empresa posee y deprecia internamente **no** es una fila de
  `products.products`.
- **Datos maestros de proveedor** — `product_suppliers` es una tabla de _asociación_ (qué proveedor
  vende este producto, a qué costo, con qué tiempo de entrega); la entidad `Proveedor` en sí
  pertenece al dominio de `suppliers`/`purchases`, no a `products`.
- **Configuración de tienda en línea/carrito de compra** — `sales.shopping_carts`,
  `sales.shopping_cart_items`, `sales.online_store_configs` (ya identificadas como fuera de alcance
  en `SALES_ROADMAP.md`) son un canal de venta que _consume_ el catálogo, no una extensión de él.

### 2.3 Estado real de implementación (transparencia de alcance)

De las 35 tablas certificadas del schema `products`, **5 tienen código de aplicación real** hoy
(`modules/productos/backend`, `v0.7.0`): `units_of_measure`, `product_categories`, `brands`,
`product_models`, `products` (CRUD base). Las 30 restantes — variantes, atributos genéricos, kits,
combos, BOM, recetas, imágenes/videos, códigos de barra, historial de precios, reseñas,
proveedores, perfiles fiscales, presentaciones, líneas/familias/colecciones, traducciones — existen
en el schema certificado, sin código de aplicación todavía (`PRODUCTOS_REPORT.md §4`). Este ADR
diseña la arquitectura del dominio completo, tal como está modelado en el schema; no implica que
todo lo aquí descrito ya esté operando en producción.

## 3. Tipos de Producto

### 3.1 Modelo de dos capas — motivo de diseño

GORAZUS ya certifica, a nivel de motor, un discriminador de tipo real y validado:
`products.product_type`, con `CHECK IN ('good', 'service', 'kit', 'combo', 'composite')` — cinco
valores que determinan comportamiento físico real (¿tiene existencia que rastrear?, ¿tiene
componentes?, ¿genera transformación de inventario?). Los nueve tipos solicitados para este ADR
(Producto Físico, Servicio, Producto Digital, Materia Prima, Producto Terminado, Producto
Semi-Terminado, Activo Fijo, Consumible, Repuesto) **no son, todos, discriminadores de
comportamiento físico distintos** — varios de ellos son la misma mecánica física (`good`) con una
**clasificación de negocio** distinta encima, relevante para reportes, valuación contable y reglas
de uso, no para el motor de inventario. Este es exactamente el mismo patrón que usa SAP con su
"Tipo de Material" (`ROH` materia prima, `HALB` semi-terminado, `FERT` terminado, `HAWA` mercadería
comercial, `DIEN` servicio) — una clasificación de negocio sobre un conjunto más pequeño de
comportamientos físicos reales. Este ADR recomienda formalizar esa segunda capa
("Clasificación de Producto") **sin modificar el `CHECK` real de `product_type`** — como una
dimensión de clasificación adicional (mismo patrón que categoría/marca/línea, §2.1), no implementada
todavía.

### 3.2 Tabla de mapeo: los 9 tipos solicitados sobre las 5 mecánicas reales

| Tipo solicitado             | `product_type` real                  | Clasificación de negocio (propuesta, no implementada)                         | Reglas de negocio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Producto Físico**         | `good`                               | `physical` (clasificación por defecto de todo `good` sin otra más específica) | Tiene `base_unit_id`, `costing_method`, participa de `inventory.stock`. Es la mecánica física de referencia sobre la que se apoyan Materia Prima/Terminado/Semi-Terminado/Consumible/Repuesto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Servicio**                | `service` (ya real, coincide exacto) | — (el `product_type` mismo ya es la clasificación)                            | Ya implementado: no puede `tracksSerial`/`tracksLot` (`producto.entity.ts`, validado con test), no participa de `inventory.stock`, se vende igual que un `good` en `sales.invoice_lines` pero sin disparar descuento de inventario.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Producto Digital**        | `good` (propuesto — ver nota)        | `digital` (nueva, propuesta)                                                  | **No existe hoy ningún equivalente real** — es la clasificación con menos precedente en el schema actual. Se recomienda modelarlo como `good` con `tracks_serial`/`tracks_lot` forzados a `false` (igual criterio que `service`) y una bandera de clasificación `digital` que indique "sin entrega física" — la diferencia con `service` es que un producto digital es un _entregable_ (licencia, archivo) de una sola transacción, no trabajo/tiempo. No participa de `inventory.stock` real por no tener existencia física, aunque conceptualmente sí podría tener "unidades vendidas" — a definir en una fase de implementación futura, fuera del alcance de este ADR. |
| **Materia Prima**           | `good`                               | `raw_material` (propuesta)                                                    | Es **insumo** de al menos un `bill_of_materials`/`recipes` (aparece como `component_product_id`/`ingredient_product_id`), nunca como el `product_id` dueño de una receta propia. Regla de negocio recomendada: no debería venderse directamente a cliente final salvo excepción explícita (una ferretería sí vende materia prima suelta) — no se recomienda bloquearlo a nivel de motor, sí advertir a nivel de UI/reporte cuando ocurre.                                                                                                                                                                                                                                 |
| **Producto Terminado**      | `good`                               | `finished_product` (propuesta)                                                | Es el `product_id` dueño de un `bill_of_materials`/`recipes` (el resultado de la transformación), **o** un `good` comprado ya terminado para reventa sin receta propia (mercadería, equivalente al `HAWA` de SAP). Es el tipo que normalmente se vende directamente al cliente final.                                                                                                                                                                                                                                                                                                                                                                                     |
| **Producto Semi-Terminado** | `good`                               | `semi_finished` (propuesta)                                                   | Es simultáneamente **salida** de un `bill_of_materials`/`recipes` y **entrada** de otro — una etapa intermedia de manufactura. Regla de negocio recomendada: normalmente no se vende directamente al cliente final (aunque el motor no lo impide, igual criterio que Materia Prima) — existe principalmente para costeo intermedio y planificación de producción.                                                                                                                                                                                                                                                                                                         |
| **Activo Fijo**             | _(fuera de este dominio)_            | No aplica — ver §3.7                                                          | GORAZUS ya posee un dominio `assets` dedicado y completo. Un Activo Fijo **no es** una fila de `products.products`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Consumible**              | `good`                               | `consumable` (propuesta)                                                      | Participa de `inventory.stock` (se rastrea cantidad), pero su patrón de uso es consumo interno de la operación (insumos de oficina, limpieza, empaque) en vez de reventa — normalmente no aparece en `sales.invoice_lines`, sí en movimientos de salida de `inventory.stock_movements` con `source_module` distinto de `sales`. No requiere una regla de motor nueva, es una clasificación de reporte/costeo.                                                                                                                                                                                                                                                             |
| **Repuesto (Spare Part)**   | `good`                               | `spare_part` (propuesta)                                                      | `good` normal, con la particularidad de que típicamente se asocia a un producto "padre" (el equipo que repara) vía `product_related_products` — vendible tanto a cliente final (mercado de reparación) como consumido internamente por `services.service_parts_consumed` (ya catalogada en `ADR-DB-001 §7`) durante una visita de servicio técnico.                                                                                                                                                                                                                                                                                                                       |

### 3.3 Producto Físico

Es la mecánica física de referencia (`product_type = 'good'`) — tiene unidad base obligatoria,
método de costeo, y puede declarar rastreo de lote y/o serie. Toda existencia real en
`inventory.stock` corresponde a un producto de este tipo (directamente, o a través de una de sus
clasificaciones de negocio más específicas de §3.2).

### 3.4 Servicio

`product_type = 'service'`, ya real e implementado. No tiene existencia física que rastrear — la
invariante de dominio ya reforzada en el código real (`producto.entity.ts`) impide que un servicio
declare `tracksSerial`/`tracksLot`. Se vende con el mismo flujo documental que un bien
(`sales.invoice_lines`), pero `inventory` no reacciona al evento de venta confirmada para una línea
de tipo servicio — no hay descuento de stock que ejecutar.

### 3.5 Producto Digital

Sin precedente real en el schema certificado — la propuesta de este ADR es tratarlo como una
extensión natural del mismo criterio ya aplicado a `service`: sin existencia física, sin rastreo de
serie/lote, pero a diferencia de un servicio (que es trabajo/tiempo), un producto digital es un
_entregable_ de una sola transacción (una licencia, un archivo, un acceso). La recomendación de este
ADR es no crear un sexto valor de `product_type` a nivel de motor todavía —insuficiente evidencia de
necesidad real, mismo criterio de "no particionar/clasificar sin beneficio medible" ya aplicado en
`ADR-DB-001 §2.1`— sino modelarlo primero como clasificación de negocio sobre `good`, y solo
promoverlo a un valor propio de `product_type` si emergiera una regla de comportamiento física
genuinamente distinta de `service`.

### 3.6 Materia Prima, Producto Terminado y Producto Semi-Terminado

Las tres comparten la misma mecánica física (`good`) y se distinguen exclusivamente por su
**posición en el grafo de composición** definido por `bill_of_materials`/`recipes`
(`bom_components.component_product_id` / `recipe_ingredients.ingredient_product_id` como entrada,
`bill_of_materials.product_id` / `recipes.product_id` como salida):

- Un producto que **solo aparece como entrada**, nunca como salida de una receta propia → Materia
  Prima.
- Un producto que **solo aparece como salida** (o no participa de ninguna receta, comprado ya
  terminado) → Producto Terminado.
- Un producto que aparece **como salida de una receta y como entrada de otra** → Producto
  Semi-Terminado.

Esta clasificación se puede derivar del grafo real de `bom_components`/`recipe_ingredients` sin
necesidad de una columna nueva — es una propiedad calculada, no un dato a mantener manualmente y que
pueda desincronizarse. Ver diagrama de relación en §5.3.

### 3.7 Activo Fijo — límite explícito de dominio

Un Activo Fijo (edificio, vehículo, maquinaria de producción propia, equipo de oficina) que la
empresa posee y deprecia contablemente **no pertenece al Catálogo de Productos** — GORAZUS ya
certifica un dominio `assets` completo con su propio ciclo de vida (`fixed_assets`,
`asset_categories`, `depreciation_methods`, `asset_depreciation_entries`, `asset_maintenances`,
`asset_disposals`, `asset_revaluations`, `asset_transfers`, `asset_custodian_history`). La distinción
de negocio correcta no es "¿es un bien físico duradero?" sino "¿la empresa lo posee y deprecia
internamente, o lo compra/vende/fabrica como parte de su operación comercial?": una máquina que la
fábrica compra para producir es un Activo Fijo (`assets`); una máquina que la fábrica **vende** a sus
clientes es un Producto Terminado (`products`, `good`). Ambos dominios pueden coexistir sobre el
mismo tipo de bien sin conflicto porque responden preguntas distintas.

### 3.8 Consumible

`good` cuyo patrón de uso es consumo interno de la operación, no reventa — participa de
`inventory.stock`/`stock_movements` igual que cualquier bien físico, pero su clasificación de
negocio existe para separarlo en reportes de costo operativo (gastos generales) de los bienes que
generan ingreso por venta directa.

### 3.9 Repuesto (Spare Part)

`good` con una relación explícita, vía `product_related_products`, hacia el producto o equipo que
repara — doble canal de salida de inventario: venta directa a cliente (mercado de repuestos,
`sales.invoice_lines`) o consumo interno durante un servicio técnico
(`services.service_parts_consumed`, ya catalogada como tabla particionada en `ADR-DB-001 §7`).

## 4. Ciclo de Vida del Producto

### 4.1 Estado real verificado

`products.products.lifecycle_status` es una columna real, `String @default("active")` — pero
**no tiene, hoy, ninguna validación, transición ni exposición en la capa de aplicación**: no
aparece referenciada en `modules/productos/backend/validators/`, `entities/`, ni `services/`. En la
práctica, todo producto creado hoy queda silenciosamente en `"active"` para siempre, sin mecanismo
real para moverlo a otro estado. Este ADR diseña el ciclo de vida completo que se recomienda
formalizar sobre esa columna ya existente — no describe un comportamiento ya implementado.

### 4.2 Los cinco estados

```text
                    ┌─────────┐
                    │  DRAFT  │  Producto en definición — visible solo para quien lo crea/edita,
                    └────┬────┘  no vendible, no comprable, no participa de inventario todavía.
                         │ publicar (validaciones mínimas completas: sku, base_unit_id, category)
                         ▼
                    ┌─────────┐
              ┌────▶│ ACTIVE  │  Estado operativo normal — vendible, comprable, visible en
              │     └────┬────┘  catálogo/POS/API, participa de inventario con normalidad.
              │          │ desactivar (decisión reversible — p. ej. fuera de temporada)
              │          ▼
              │     ┌──────────┐
              └─────│ INACTIVE │  Oculto de catálogo/POS/venta nueva — SIGUE siendo comprable
      reactivar     └────┬─────┘  internamente y participa de inventario (no bloquea recepción
                          │       de mercadería ya en tránsito). Reversible a ACTIVE.
                          │ descontinuar (decisión NO reversible del lado comercial)
                          ▼
                    ┌──────────────┐
                    │ DISCONTINUED │  No vendible, no comprable — el proveedor/la empresa dejó
                    └──────┬───────┘  de ofrecerlo. Su stock remanente puede seguir vendiéndose
                            │         hasta agotarse (regla de negocio, no de motor) o liquidarse.
                            │ archivar (todo el stock remanente ya en cero, o vencido el
                            │ período de retención comercial)
                            ▼
                    ┌──────────┐
                    │ ARCHIVED │  Estado final — de solo lectura para consulta histórica
                    └──────────┘  (auditoría, reportes de productos descontinuados). No admite
                                   ninguna transición de salida — un producto archivado que vuelve
                                   a venderse se recrea como producto nuevo, no se reabre el mismo
                                   registro (mismo criterio que "estado final" ya usado en otros
                                   dominios de GORAZUS, p. ej. factura `cancelled`).
```

### 4.3 Reglas de transición

| Transición                         | Reversible                                                       | Precondición                                                                                                                                                                                                                                     | Efecto en dominios dependientes                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DRAFT → ACTIVE`                   | Sí (puede volver a `DRAFT` mientras no tenga movimientos reales) | Campos mínimos completos: `sku` único, `base_unit_id` válido (si es `good`), clasificación de tipo consistente (§3).                                                                                                                             | Recién aquí el producto se vuelve visible para `sales`/`purchases`/POS/API — antes de este punto, ningún otro dominio debería poder referenciarlo.                   |
| `ACTIVE → INACTIVE`                | Sí, hacia `ACTIVE`                                               | Ninguna — decisión operativa libre (p. ej. temporada, pausa de proveedor).                                                                                                                                                                       | Deja de aparecer en búsquedas de catálogo/POS para venta _nueva_; `inventory`/`purchases` siguen operando con normalidad sobre el stock existente.                   |
| `INACTIVE → ACTIVE`                | — (es la reversión de la anterior)                               | Ninguna.                                                                                                                                                                                                                                         | Vuelve a ser visible para venta nueva.                                                                                                                               |
| `ACTIVE`/`INACTIVE → DISCONTINUED` | No                                                               | Decisión comercial explícita, típicamente iniciada por Compras (proveedor descontinuado) o Ventas (fin de línea).                                                                                                                                | Bloquea compra nueva (`purchases`) y venta nueva (`sales`/POS) — el stock remanente sigue siendo válido para consulta y, según política comercial, para liquidación. |
| `DISCONTINUED → ARCHIVED`          | No (estado final)                                                | Stock remanente en cero (`inventory.stock` de todos los almacenes) **o** vencido el período de retención comercial definido por política (fuera del alcance de motor de este ADR, análogo a `core.data_retention_policies` de `ADR-DB-001 §10`). | El producto deja de ser editable — de aquí en adelante es un registro de solo lectura para trazabilidad histórica (auditoría, reportes).                             |

### 4.4 Por qué estos cinco estados y no menos

`DRAFT` existe para separar "estoy definiendo este producto" de "ya está listo para operar" — sin
él, cualquier producto a medio cargar sería inmediatamente vendible, un riesgo real en un catálogo
donde la carga de un producto físico puede requerir completar 6+ tablas relacionadas (§5) antes de
estar realmente listo. `INACTIVE` existe separado de `DISCONTINUED` porque son decisiones de
naturaleza distinta — una reversible y operativa (pausa), la otra definitiva y comercial (fin de
vida) — colapsarlas en un solo estado "no vendible" perdería esa distinción de intención que Compras
y Ventas necesitan para tomar decisiones distintas. `ARCHIVED` existe separado de `DISCONTINUED`
porque un producto descontinuado con stock remanente todavía tiene operación real pendiente
(liquidarlo); solo al quedar en verdad inerte se convierte en un registro puramente histórico.

## 5. Modelo de Dominio

### 5.1 Núcleo del catálogo (identidad y clasificación)

```text
                                  ┌────────────────────┐
                                  │  units_of_measure   │◀────────────┐
                                  └──────────┬──────────┘             │ (unidad de rendimiento)
                                             │ base_unit_id (NOT NULL)│
                                             ▼                        │
┌──────────────┐   category_id   ┌─────────────────────┐             │
│ product_      │◀────────────── │      products        │────────────┘
│ categories    │  (opcional,    │  (entidad central)   │
│ (jerárquica,  │   jerárquica)  │  sku, product_type,   │──┐ parent_product_id (auto-referencia)
│  N niveles)   │                │  lifecycle_status,     │  │ → variantes de un producto base
└──────────────┘                │  costing_method,       │◀─┘
                                  │  tracks_serial/lot     │
┌──────────────┐   brand_id      │                        │   model_id   ┌────────────────┐
│    brands     │◀────────────── │                        │─────────────▶│ product_models  │
│   (plana)     │                │                        │              │ (brand_id       │
└──────────────┘                 │                        │              │  NOT NULL)      │
                                  │                        │              └────────────────┘
┌──────────────┐  line_id/       │                        │
│ product_lines/│  family_id/    │                        │
│ families/     │◀─────────────── │                       │
│ collections   │  collection_id  └───────────┬────────────┘
└──────────────┘                              │
                                               │ 1:N (independiente de la anterior)
                     ┌─────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
          ┌────────────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
          │ product_variant_    │   │  product_barcodes    │   │ product_physical_     │
          │ attribute_values    │   │  (1:N, por producto)  │   │ attributes (1:1)      │
          │ (valor de atributo  │   └─────────────────────┘   │ peso/dimensiones/vol. │
          │  por variante)      │                              └──────────────────────┘
          └──────────┬──────────┘
                      │ attribute_value_id
                      ▼
          ┌─────────────────────┐        ┌────────────────────┐
          │ product_attribute_   │◀──────│ product_attributes  │
          │ values (p. ej.       │  N:1   │ (genérico: 'color', │
          │ 'Rojo', 'Talla M')   │        │  'size', propios)   │
          └─────────────────────┘        └────────────────────┘
```

### 5.2 Composición para venta (Kits y Combos) — sin transformación física

```text
┌──────────────┐  1:1 (product_type='kit')   ┌────────────────────┐   1:N   ┌───────────────────────┐
│   products    │◀────────────────────────── │   product_kits      │────────▶│ product_kit_components │
│ (kit)         │   pricing_policy CHECK IN   │  (sum_components |  │         │ component_product_id → │
└──────────────┘   ('sum_components','fixed')  │   fixed)            │         │  products (otro good)  │
                                                └────────────────────┘         │ quantity                │
                                                                                └───────────────────────┘
┌──────────────┐  1:1 (product_type='combo') ┌────────────────────┐   1:N   ┌───────────────────────┐
│   products    │◀────────────────────────── │  product_combos      │────────▶│ product_combo_         │
│ (combo)       │   discount_percentage        │                     │         │ components              │
└──────────────┘                              └────────────────────┘         │ component_product_id →  │
                                                                                │  products (otro good)   │
                                                                                │ quantity                 │
                                                                                └───────────────────────┘
```

Ni Kit ni Combo generan movimiento de inventario propio — la venta descuenta stock de cada
componente individualmente (§2.2); el Kit/Combo en sí no tiene existencia en `inventory.stock`.

### 5.3 Composición para producción (BOM y Recetas) — con transformación física

```text
┌──────────────┐  1:N (product_id, salida)  ┌─────────────────────┐  1:N  ┌───────────────────────┐
│   products    │◀───────────────────────── │ bill_of_materials     │──────▶│  bom_components         │
│ (Terminado o  │  output_quantity            │  (name, 1 producto   │       │ component_product_id →  │
│  Semi-Term.)  │                              │   puede tener varias │       │  products (Materia Prima│
└──────────────┘                              │   BOM alternativas)  │       │  o Semi-Terminado)      │
       ▲                                       └─────────────────────┘       │ quantity_required        │
       │                                                                     └───────────────────────┘
       │ component_product_id (entrada, el mismo producto puede ser
       │ salida de una BOM y entrada de otra → Semi-Terminado, §3.6)
       │
┌──────────────┐  1:N (product_id, salida)  ┌─────────────────────┐  1:N  ┌───────────────────────┐
│   products    │◀───────────────────────── │      recipes          │──────▶│  recipe_ingredients     │
│ (Terminado,   │  yield_quantity/yield_unit  │  (variante de BOM,   │       │ ingredient_product_id → │
│  industria    │                              │   rendimiento        │       │  products (Materia      │
│  alimenticia) │                              │   variable)          │       │  Prima)                 │
└──────────────┘                              └─────────────────────┘       │ quantity                 │
                                                                              └───────────────────────┘
```

`bom_components.component_product_id` / `recipe_ingredients.ingredient_product_id` apuntando de
vuelta a `products` es, exactamente, la relación que permite derivar la clasificación
Materia-Prima/Terminado/Semi-Terminado de §3.6 sin una columna adicional — es una propiedad del
grafo, no un dato a mantener.

### 5.4 Comercialización, costeo y trazabilidad

```text
┌──────────────┐ 1:N  ┌───────────────────────┐        ┌──────────────┐ 1:N  ┌───────────────────────┐
│   products    │─────▶│  product_suppliers     │        │   products    │─────▶│ product_tax_profiles   │
│               │      │  supplier_id (externo   │        │               │      │  tax_id (externo a      │
│               │      │  a `suppliers`)          │        │               │      │  `taxes`, dominio ajeno)│
│               │      │  is_preferred,           │        │               │      └───────────────────────┘
│               │      │  last_purchase_cost      │        │               │
└──────────────┘      └───────────────────────┘        └──────┬───────┘
       │                                                        │ 1:N
       │ 1:N                                                    ▼
       ▼                                              ┌───────────────────────┐
┌───────────────────────┐                              │ product_price_history   │
│  product_images/videos  │                              │  (bitácora, no motor    │
│  file_id → core.files    │                              │  de pricing)            │
│  display_order           │                              └───────────────────────┘
└───────────────────────┘

┌──────────────┐ N:M (self, vía tabla puente)    ┌──────────────┐ 1:N   ┌───────────────────────┐
│   products    │◀───────────────────────────────▶│   products    │──────▶│  product_reviews        │
│  (repuesto)   │  product_related_products         │  (equipo)     │       │  (retroalimentación de   │
└──────────────┘  (§3.9 — vínculo repuesto↔equipo) └──────────────┘       │  cliente, sin código hoy)│
                                                                            └───────────────────────┘
```

### 5.5 Resumen de entidades por responsabilidad

| Grupo                         | Entidades                                                                                                                                                                               | Responsabilidad                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identidad y clasificación** | `products`, `product_categories`, `brands`, `product_models`, `product_lines`, `product_families`, `product_collections`                                                                | Qué es el producto y cómo se clasifica — núcleo del dominio (§5.1).                                                                            |
| **Variantes y atributos**     | `product_variant_attribute_values`, `product_attributes`, `product_attribute_values`                                                                                                    | Cómo un producto base se despliega en variantes concretas vendibles (§5.1).                                                                    |
| **Unidades**                  | `units_of_measure`, `unit_conversions`                                                                                                                                                  | En qué unidad se mide, compra, vende y convierte un producto (§5.1).                                                                           |
| **Composición comercial**     | `product_kits`, `product_kit_components`, `product_combos`, `product_combo_components`                                                                                                  | Agrupación para venta, sin transformación física (§5.2).                                                                                       |
| **Composición productiva**    | `bill_of_materials`, `bom_components`, `recipes`, `recipe_ingredients`                                                                                                                  | Transformación física real, base de la clasificación Materia Prima/Terminado/Semi-Terminado (§5.3, §3.6).                                      |
| **Identificación física**     | `product_barcodes`, `product_physical_attributes`                                                                                                                                       | Escaneo y logística (peso/dimensiones/volumen).                                                                                                |
| **Comercialización y costeo** | `product_suppliers`, `product_tax_profiles`, `product_price_history`                                                                                                                    | Referencia de abastecimiento, fiscalidad y evolución de precio — sin ejecutar compra, impuesto ni pricing en sí (§2.1).                        |
| **Contenido y relación**      | `product_images`, `product_videos`, `product_reviews`, `product_related_products`                                                                                                       | Material visual/documental y relaciones producto-a-producto (venta cruzada, repuesto↔equipo).                                                  |
| **Internacionalización**      | `product_translations`, `product_category_translations`, `brand_translations`, `unit_of_measure_translations`, `product_attribute_translations`, `product_attribute_value_translations` | Nombre visible por idioma para cada entidad de clasificación — no altera la identidad ni el comportamiento del producto, solo su presentación. |
