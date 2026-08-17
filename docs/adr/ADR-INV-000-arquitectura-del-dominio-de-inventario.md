# ADR-INV-000 — Arquitectura del Dominio de Inventario (Inventory Domain Architecture)

|                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**                  | Aceptada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Fecha**                   | 2026-07-27                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Autor**                   | Chief Software Architect, GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Ámbito**                  | El Bounded Context de Inventario como capacidad de negocio completa — abarca los schemas `products` e `inventory`, y define sus límites contra `purchases`, `sales`, `pos`, `accounting`, `crm`, `services` (manufactura), `bi`/`reports`, la capa de API, y `core.notifications`. Documento fundacional de la familia `ADR-INV-*`.                                                                                                                                                                                                                                                                                                   |
| **Documentos relacionados** | [ADR-INV-001](./ADR-INV-001-arquitectura-del-catalogo-de-productos.md) (detalle del Catálogo de Productos — subdominio de identidad), [ADR-INV-002](./ADR-INV-002-arquitectura-de-gestion-de-almacenes.md) (detalle de Gestión de Almacenes, cantidades, trazabilidad, kardex y eventos — subdominio de ejecución), [ADR-DB-001](./ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md) (estrategia de particionamiento que sostiene los objetivos de volumen de este documento), [docs/architecture/08-infraestructura-y-despliegue.md](../architecture/08-infraestructura-y-despliegue.md) (topología real de despliegue) |

Este documento es el ADR **fundacional** de la familia `ADR-INV-*` — a diferencia de `ADR-INV-001` y
`ADR-INV-002`, que documentan _cómo_ está construido cada subdominio (tabla por tabla, columna por
columna, con estado real vs. recomendación), este documento explica _qué es_ el dominio de Inventario
como capacidad de negocio, _dónde_ terminan sus límites, y _qué vocabulario_ comparten quienes lo
diseñan, lo implementan y lo usan. Numerado `000` deliberadamente — es el documento que los otros dos
presuponen, aunque se haya escrito después. Mantiene el mismo criterio de honestidad que el resto de
la serie: cada afirmación sobre capacidad real está respaldada por lo ya verificado en `ADR-INV-001`/
`ADR-INV-002`, y cada aspiración no construida todavía se marca como tal.

---

## 1. Propósito

### 1.1 Por qué Inventario es el dominio central de un ERP

Un ERP puede perder su módulo de CRM y seguir facturando; puede perder su módulo de proyectos y
seguir vendiendo. No puede perder Inventario sin dejar de saber, con autoridad, **qué existe y dónde**
— y esa es precisamente la pregunta sobre la que se apoya cualquier otra decisión operativa del
negocio: si se puede vender (¿hay disponible?), si hay que comprar (¿está por debajo del mínimo?), si
un asiento contable de costo de venta es correcto (¿a qué costo salió?), y si una promesa de entrega es
realista (¿en qué almacén, en qué cantidad?). SAP (Materials Management + Inventory Management),
Oracle (Inventory Management Cloud) y Microsoft Dynamics 365 (Supply Chain Management) tratan a
Inventario como el módulo sobre el que se certifica primero la integridad transaccional del sistema
completo, antes que Ventas o Compras — GORAZUS sigue el mismo orden de dependencia, ya verificado en
`ADR-INV-001 §1.1` para el Catálogo de Productos y extendido aquí a la ejecución de existencias: `sales`
y `purchases` **consumen** disponibilidad de `inventory`, `inventory` no depende de ninguno de los dos
para poder operar.

### 1.2 Cómo interactúa Inventario con cada dominio vecino

| Dominio                    | Cómo interactúa (estado real, verificado en `ADR-INV-001`/`ADR-INV-002`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purchasing**             | Sin FK directa (`purchases` no tiene columna `warehouse_id`, confirmado por `grep`, `ADR-INV-002 §1.3`). Se conecta vía `inventory.goods_receipts` polimórfico (`source_module`/`source_entity_id`) — schema real, sin código de aplicación todavía. `product_suppliers.lead_time_days` (dominio `products`) es el único puente real hoy entre ambos, y solo a nivel de referencia, no de ejecución.                                                                                                                                                                               |
| **Sales**                  | Mismo patrón indirecto — `stock_reservations`/`goods_issues` polimórficos. `stock_reservations` ya tiene código real (`ReservasController`), pero `sales` no lo invoca todavía (`ADR-INV-002 §4`, §1.3). `v_available_stock` es la vista que `sales` debería consultar antes de confirmar una venta — no lo hace hoy.                                                                                                                                                                                                                                                              |
| **POS**                    | El punto de venta de mostrador no es un dominio de datos propio en GORAZUS — es un canal de `sales` (una venta de mostrador es una factura directa de `sales.invoices`, ya señalado en `ADR-INV-001 §1.2`). Su relación con Inventario es, por tanto, exactamente la misma que la de Sales — vía disponibilidad y salida de mercadería, sin ruta propia.                                                                                                                                                                                                                           |
| **Accounting**             | No hay integración directa construida — el puente conceptual es el `costing_method` (`ADR-INV-001 §7`, FIFO/promedio) y las tablas de costeo ya reales (`fifo_cost_layers`, `average_cost_history`, `ADR-INV-002 §10.1`), que en principio alimentarían el asiento de costo de venta en `accounting.journal_entries`. Es uno de los tres consumidores propuestos (no construidos) del bus de eventos en `ADR-INV-002 §13.3`.                                                                                                                                                       |
| **CRM**                    | **Límite más limpio de todo el dominio** — verificado por `grep` exhaustivo sobre `crm/schema.prisma`: la única referencia es `crm_opportunity_lines.product_id`, una línea de oportunidad de venta que apunta al Catálogo de Productos (identidad/precio de referencia). CRM **nunca** referencia `inventory` — ni una fila de `stock`, ni un almacén, ni una reserva. Confirma la separación ya declarada en `ADR-INV-001 §1.2`: CRM consume `products`, no inventario.                                                                                                          |
| **Manufacturing (futuro)** | Ya modelado como parte del propio schema `inventory` (`production_orders`, `production_order_components`, `production_order_outputs`, `production_consumptions` — esta última particionada, `ADR-DB-001`), sin código de aplicación todavía (`ADR-INV-002 §3.2` "Production Warehouse", §11.2 "Production"). No es un dominio externo a Inventario — es un subdominio de ejecución dentro de él, correctamente marcado como "futuro" por el propio estado del proyecto.                                                                                                            |
| **Reporting**              | Vía vistas derivadas, nunca acceso directo a tablas transaccionales — `v_available_stock`, `v_kardex` (ambas reales, `ADR-INV-002 §5`, §12), y `bi.kpi_snapshots` (dominio propio, ya catalogado en `ADR-DB-001 §7`) como destino de agregación periódica, no como consumidor en tiempo real de `stock_movements`.                                                                                                                                                                                                                                                                 |
| **API**                    | `metadata JSONB` con índice `GIN` (mismo mecanismo de extensión sin migración ya usado en `products`, `ADR-INV-001 §1.2`) es el punto de extensión para integraciones externas sobre entidades de Inventario. No existe hoy un código de barras de ubicación (`ADR-INV-002 §4` "Barcode support", brecha real) que sería el segundo punto de integración natural para picking guiado por escáner externo.                                                                                                                                                                          |
| **Notifications**          | `core.notifications` es un mecanismo real, pero **dirigido a usuario** (`recipient_user_id` obligatorio), no polimórfico por entidad como `core.documents`/`core.tags` (`ADR-INV-001 §6`) — a diferencia de auditoría (§8.3 de `ADR-INV-002`, universal y automática), una alerta de "stock bajo mínimo" (`replenishment_rules.min_quantity`, ya real) requeriría que Inventario resuelva explícitamente **a qué usuarios** notificar (p. ej. vía RBAC/rol de "gestor de almacén") y cree la fila de notificación él mismo — no hay una suscripción automática por tipo de evento. |

### 1.3 Por qué Inventario debe permanecer independiente

La independencia de Inventario no es una preferencia estética de arquitectura — es la precondición
para que la verdad sobre "qué hay y dónde" sea una sola, consultada por todos, nunca copiada ni
recalculada de forma distinta en cada módulo que la necesita. Tres razones concretas, cada una ya
verificada en este dominio:

1. **Un solo lugar donde el saldo puede cambiar.** `stock_movements` es la única fuente de verdad de
   toda alteración de existencias (`ADR-INV-002 §11.3`) — si `sales`, `purchases` o `pos` pudieran
   escribir directamente sobre `inventory.stock`, existirían tantas versiones de "cuánto hay" como
   módulos con acceso de escritura. La integración polimórfica (`source_module`/`source_entity_id`,
   §1.2 de esta sección) preserva esto: otros dominios **piden** un movimiento, nunca lo ejecutan ellos
   mismos.
2. **Los dos patrones de crecimiento son incompatibles si se mezclan.** La estructura física (almacenes,
   zonas, ubicaciones) crece con la infraestructura del negocio; las cantidades y movimientos crecen
   con cada transacción, a un ritmo órdenes de magnitud mayor (`ADR-INV-002 §1.2`, ya citando
   `ADR-DB-001 §2.4`). Si Inventario no fuera un dominio separado con su propia estrategia de
   particionamiento, esa asimetría de volumen contaminaría el diseño de cualquier dominio que lo
   contuviera.
3. **La independencia de schema es lo que habilita escalar solo lo que hace falta escalar.** La
   separación física en un schema Postgres propio (§2 más abajo) es, según la propia documentación de
   infraestructura, _"el camino para mover schemas calientes a su propia instancia si el volumen de un
   módulo específico lo justifica, sin rediseñar el resto"_
   (`docs/architecture/08-infraestructura-y-despliegue.md §7`) — una posibilidad real solo porque
   Inventario no está entrelazado con `sales`/`purchases` a nivel de motor de base de datos.

---

## 2. Objetivos de Negocio (Business Goals)

Cada objetivo se documenta con su estado real de soporte — mismo criterio de honestidad que el resto
de la serie. El hallazgo más relevante de esta sección: los objetivos de **escala transaccional** y
**multi-empresa/sucursal/almacén** están sólidamente resueltos por el diseño ya certificado; los de
**multi-moneda**, **multi-idioma** y **alta disponibilidad de base de datos** tienen soporte real mucho
más parcial de lo que un documento de venta comercial asumiría.

| Objetivo                                             | Estado real                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Millones de productos**                            | 🟢 Sin límite de diseño — claves primarias `UUID`, sin restricción artificial de cardinalidad en ninguna tabla del dominio. No verificado bajo carga real (ningún reporte de esta serie prueba volumen a esa escala), pero nada en el schema lo impide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Miles de millones de transacciones de inventario** | 🟢 Diseño deliberado para esto — `stock_movements` particionada `RANGE (created_at)`, mensual, con índice `BRIN` (`ADR-DB-001 §7`, `ADR-INV-002 §1.2`). Es, explícitamente, la tabla que la propia estrategia de particionamiento identifica como _"el patrón de mayor volumen de escritura del sistema"_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Multi-empresa (multi-company)**                    | ✅ Real — `tenant_id`/`company_id` en las 494 tablas del sistema (patrón universal, `ADR-DB-001`); `inventory.warehouses.company_id NOT NULL` (`ADR-INV-002 §2.2`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Multi-sucursal (multi-branch)**                    | ✅ Real — `warehouses.branch_id NOT NULL`, a diferencia de la mayoría de tablas de negocio del sistema (`ADR-INV-002 §2.2`); `code` único por sucursal, no por empresa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Multi-almacén (multi-warehouse)**                  | ✅ Real y es, literalmente, el objeto de `ADR-INV-002` completo — jerarquía Empresa→Sucursal→Almacén→Zona→Ubicación ya certificada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Multi-moneda**                                     | 🔴 Soporte real muy parcial — `companies.functional_currency_code CHAR(3)` existe **por empresa** (`ADR-INV-001`, investigación de `core`), pero **ninguna** columna de `inventory` ni de `products` tiene `currency_code` propio (confirmado por `grep` exhaustivo, cero resultados en ambos schemas). `standard_cost`/`unit_cost`/`list_price` son montos sin moneda explícita — se asume, sin poder registrarlo, que están en la moneda funcional de la empresa dueña. No hay forma hoy de capturar "este costo llegó facturado en USD" si la empresa opera en otra moneda funcional.                                                                                                                                                                                                                                                                                                                                                       |
| **Multi-idioma**                                     | 🟡 Real y extenso para `products` (seis tablas `*_translations`, `ADR-INV-001 §5.5`), **inexistente para `inventory`** — confirmado, cero tablas de traducción en `inventory/schema.prisma`. El nombre de un almacén, una zona o el código de un motivo de ajuste no son traducibles hoy — asimetría real entre los dos schemas que conforman este dominio.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Alta disponibilidad**                              | 🟡 Diseño completo, no desplegado en la fase actual — **corregido tras revisión de gobernanza**: la primera versión de esta fila solo citaba `08-infraestructura-y-despliegue.md §7` ("un único primario") y concluía que no había plan de HA. Una revisión completa de `docs/database/` encontró `09-estrategia-replicacion.md` y `10-estrategia-alta-disponibilidad.md` — un diseño real y detallado (Patroni sobre etcd/Consul, standby síncrono con RPO≈0, standby asíncrono multi-región, PgBouncer como capa de indirección, SLA 99.9%, RTO<60s) que la topología de `08 §1` (Docker Compose, un solo servicio `postgres`, sin Patroni/PgBouncer) todavía no refleja. Los dos documentos no se contradicen — describen fases distintas: `08` es la topología actual de despliegue simple; `09`/`10` son el diseño ya acordado para producción madura, sin desplegar todavía. `api` sí tiene réplicas reales en Kubernetes hoy (`08 §6`). |
| **Escalabilidad horizontal**                         | 🟡 Parcial, por capa — la capa de API sí escala horizontalmente hoy (réplicas sin coordinación adicional más allá del adapter de Redis para WebSocket, `08 §7`). La capa de base de datos no escala horizontalmente en la topología actual de Docker Compose, pero **sí tiene un camino de escalado vertical/HA ya diseñado** (fila anterior) más réplicas de lectura para `reports`/`bi` (`09-estrategia-replicacion.md §2`) — la separación por schema (`ADR-DB-001`) es adicionalmente el camino para extraer `inventory` a su propia instancia si el volumen de un módulo específico lo justifica.                                                                                                                                                                                                                                                                                                                                         |

---

## 3. Bounded Context

### 3.1 Inventario como Bounded Context de Domain-Driven Design

En términos de DDD, Inventario es el Bounded Context responsable de responder, de forma autoritativa
y sin ambigüedad, dos preguntas relacionadas pero distintas — y GORAZUS ya las separa en dos
subdominios reales dentro del mismo contexto:

- **Identidad y capacidad** (subdominio `products`, `ADR-INV-001`): _qué es_ un artículo, y _qué
  puede hacer_ (¿rastrea lote?, ¿rastrea serie?, ¿cómo se costea?) — sin poseer nunca una cantidad.
- **Ejecución y existencia física** (subdominio `inventory`, `ADR-INV-002`): _cuánto hay_, _dónde_, y
  _qué le pasó_ — consumiendo la capacidad declarada por `products` sin redefinirla.

Esta división interna ya está certificada a nivel de schema (dos schemas Postgres distintos dentro
del mismo Bounded Context conceptual) — es intencional, no una fragmentación accidental: permite que
la tasa de cambio de cada subdominio evolucione a su propio ritmo (el catálogo cambia con la
estrategia comercial, las existencias cambian con cada transacción) sin que uno bloquee al otro.

### 3.2 Responsabilidades

- Declarar y mantener la **estructura física** donde puede existir inventario (Empresa→Sucursal→
  Almacén→Zona→Ubicación, `ADR-INV-002 §2`).
- Ser la **única autoridad de escritura** sobre cantidades de existencia — `quantity_on_hand`/
  `quantity_reserved`, y todo movimiento que las altera (`ADR-INV-002 §5`, §11).
- Registrar **por qué** cambió una cantidad, de forma inmutable y consultable (Kardex, `ADR-INV-002 §12`).
- Rastrear **identidad física** cuando el negocio lo requiere — lote, serie (`ADR-INV-002 §8-9`), con
  las brechas reales ya señaladas en la trazabilidad completa (§10).
- Aplicar el **método de costeo** declarado por `products` (FIFO/promedio, `ADR-INV-001 §7`) para
  valuar cada salida.
- Ofrecer **disponibilidad como vista derivada** (`v_available_stock`) para que otros dominios decidan
  sobre ella, sin exponer las tablas transaccionales subyacentes.

### 3.3 Qué pertenece dentro de Inventario

- `products` completo (identidad, clasificación, composición, atributos — `ADR-INV-001`).
- `inventory` completo: almacenes/zonas/ubicaciones, stock, movimientos, reservas, transferencias,
  ajustes, conteos físicos, lotes, series, costeo FIFO/promedio, reglas de picking/putaway/reposición
  (`ADR-INV-002`).
- El Kardex, como vista derivada de `stock_movements` (`ADR-INV-002 §12`) — no una tabla propia.
- Las brechas y recomendaciones señaladas en `ADR-INV-001`/`ADR-INV-002` (clasificación de negocio de
  tipo de producto/almacén, `lot_id`/`serial_id` en el motor de movimiento, columna `owner`) son
  **extensiones del propio dominio**, no de dominios vecinos.

### 3.4 Qué NO pertenece dentro de Inventario

| No pertenece                                                 | Por qué, y dónde vive realmente                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La ejecución de una orden de compra o una factura de venta   | `purchases`/`sales` — Inventario solo reacciona a la confirmación de esos documentos vía el mecanismo polimórfico (§1.2), nunca los origina ni los valida.                                        |
| El precio de venta al cliente, descuentos, listas de precio  | `sales`/`configuration.price_lists` — ya delimitado en `ADR-INV-001 §2.2` para `products`, aplica igual aquí: Inventario informa costo, nunca precio de venta.                                    |
| La definición y tasa de un impuesto                          | `taxes` — dominio de catálogo propio (`ADR-INV-001 §1.2`).                                                                                                                                        |
| El asiento contable en sí                                    | `accounting.journal_entries` — Inventario provee el dato de costo (§1.2), no contabiliza.                                                                                                         |
| La relación comercial con el cliente, oportunidades de venta | `crm` — límite más limpio de todo el dominio (§1.2): CRM solo lee `products`, nunca `inventory`.                                                                                                  |
| Activos fijos de la empresa                                  | `assets` — límite ya explícito en `ADR-INV-001 §3.7`: una máquina que la empresa posee y deprecia no es una fila de `products`, y por extensión, nunca tiene una fila de `stock`.                 |
| El envío/logística de última milla hacia el cliente          | Fuera del alcance de cualquier dominio verificado en esta serie — Inventario termina su responsabilidad en el movimiento `issue` (`ADR-INV-002 §11.2`), no en la entrega física al cliente final. |
| La resolución de a qué usuario notificar una alerta          | `core.notifications`/RBAC — Inventario puede _disparar_ la necesidad de una alerta (p. ej. stock bajo mínimo), pero no posee el mecanismo de entrega ni la lista de destinatarios (§1.2).         |

---

## 4. Lenguaje Ubicuo (Ubiquitous Language)

Glosario de términos de negocio, cada uno con su definición real dentro de GORAZUS — no una
definición genérica de manual, sino la que corresponde exactamente a cómo el schema y el código ya
construido los usan (con la brecha señalada cuando el término no tiene, todavía, representación real).

| Término                                        | Definición                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stock**                                      | El saldo actual de un producto en un almacén (y opcionalmente una ubicación) — `inventory.stock.quantity_on_hand`. Nunca un histórico; el histórico es el Movimiento (más abajo).                                                                                                                                                     |
| **Warehouse (Almacén)**                        | Unidad física o virtual de custodia de existencias, siempre perteneciente a una Empresa y una Sucursal concretas (`branch_id NOT NULL`, a diferencia de la mayoría de entidades del sistema). Ver clasificación de negocio en `ADR-INV-002 §3`.                                                                                       |
| **Lot (Lote)**                                 | Agrupación de unidades de un mismo producto recibidas o producidas juntas, identificada por `lot_number`, con fecha de vencimiento opcional (`expiry_date`). Hoy sin conexión real a la recepción que lo originó (`ADR-INV-002 §8.1`, brecha real).                                                                                   |
| **Serial Number (Número de Serie)**            | Identificador único de una unidad individual de un producto serializado, con ciclo de vida propio (`in_stock → sold → under_warranty → scrapped`). El campo `serial_number` es texto libre — cubre IMEI/VIN/MAC/convenciones propias sin necesitar columnas separadas (`ADR-INV-002 §9`).                                             |
| **Reservation (Reserva)**                      | Cantidad de `stock` apartada para un propósito específico (típicamente un pedido de venta), sin haber salido físicamente todavía — reduce `v_available_stock` sin reducir `quantity_on_hand`. Polimórfica (`source_module`/`source_entity_id`) — no distingue hoy "reservado" de "comprometido" (§5, `ADR-INV-002 §5.2`).             |
| **Transfer (Transferencia)**                   | Movimiento de existencia de un almacén origen a un almacén destino, siempre generando **dos** Movimientos (`transfer_out` + `transfer_in`) — nunca uno solo. Mientras está `in_transit`, la mercadería no pertenece a ningún almacén (`ADR-INV-002 §3.2`).                                                                            |
| **Movement (Movimiento)**                      | La unidad atómica e inmutable de cambio de `stock` — toda alteración de cantidad, sin excepción, pasa por una fila de `stock_movements` con una dirección (`in`/`out`) determinada por su tipo, nunca por el signo de la cantidad (`ADR-INV-002 §11.3`).                                                                              |
| **Adjustment (Ajuste)**                        | Corrección puntual de `quantity_on_hand` hacia un valor conocido, con un motivo auditable (Daño, Pérdida, Diferencia de Conteo, Inventario Inicial...) — genera un Movimiento de tipo `adjustment_increase`/`adjustment_decrease` al confirmarse (`ADR-INV-002 §11.2`).                                                               |
| **Available Quantity (Cantidad Disponible)**   | `v_available_stock = quantity_on_hand − quantity_reserved` — lo único que otro dominio debería consultar antes de comprometer una venta. Vista derivada, nunca una columna almacenada (`ADR-INV-002 §5.1`).                                                                                                                           |
| **Committed Quantity (Cantidad Comprometida)** | **Sin representación real distinta de Reserved Quantity** en GORAZUS hoy — un WMS de referencia distingue "reservado para un pedido" de "ya en proceso de picking, sin vuelta atrás"; GORAZUS usa la misma fila para ambos casos (`ADR-INV-002 §5.2`, brecha señalada, recomendación de columna `status` sobre `stock_reservations`). |
| **Reserved Quantity (Cantidad Reservada)**     | `stock.quantity_reserved` — total denormalizado, mantenido por la aplicación en cada creación/liberación de una fila de `stock_reservations`, nunca recalculado con `SUM` en cada lectura (decisión de rendimiento explícita, `ADR-INV-002 §5.2`).                                                                                    |
| **Cost (Costo)**                               | El valor unitario de una unidad de inventario, determinado por el `costing_method` del producto (`ADR-INV-001 §7`) — FIFO (`fifo_cost_layers`, capas con trazabilidad a la recepción origen) o Promedio Ponderado (`average_cost_history`, snapshot recalculado en cada entrada, sin capas).                                          |
| **Inventory Value (Valor de Inventario)**      | **Sin vista ni columna dedicada hoy** — se derivaría de `SUM(quantity_on_hand × costo vigente)` por producto/almacén, combinando `stock` con `fifo_cost_layers`/`average_cost_history` según el método — cálculo no materializado en ningún lado del schema verificado, brecha real de reporting.                                     |
| **Kardex**                                     | Libro mayor de existencias con saldo corrido, `inventory.v_kardex` — vista derivada de `stock_movements`, nunca una tabla propia, por diseño explícito ("100% derivable", `ADR-INV-002 §12.1`). Debe ser inmutable por construcción matemática, no solo por convención (§12.3).                                                       |
| **Replenishment (Reposición)**                 | Movimiento de existencia entre la zona de reserva (`storage`) y la zona de picking de un almacén, disparado cuando la cantidad en picking cae bajo `replenishment_rules.min_quantity` — schema real, sin motor de ejecución automática todavía (`ADR-INV-002 §4`, §6).                                                                |
| **Cycle Count (Conteo Cíclico)**               | Modalidad de conteo físico recurrente, por zona, sin "campaña" (a diferencia de la Toma Física ad-hoc) — `cycle_count_schedules`, genera automáticamente `physical_counts` acotados a su zona; toda diferencia reconcilia vía Ajuste, nunca escribe `stock` directamente (`19-modulo-inventory.md §8`).                               |
| **Safety Stock (Stock de Seguridad)**          | **Conflado con Minimum Stock** en GORAZUS — `replenishment_rules.min_quantity` cumple hoy ambos roles (colchón que nunca se toca vs. umbral que dispara reposición) sin distinguirlos; brecha real ya señalada en `ADR-INV-002 §6`.                                                                                                   |

---

## 5. Aggregates (Raíces de Agregado)

### 5.1 Principio aplicado — agregados pequeños, referencia por ID entre ellos

**Hallazgo real importante**: GORAZUS ya construyó, sin nombrarlo explícitamente como tal, un modelo
de agregados DDD correcto en `modules/inventario/backend/entities/` — clases de dominio puras
("sin decoradores de framework... contienen invariantes... 100% testeables sin levantar Nest ni base
de datos", `docs/architecture/02-arquitectura-modulos-backend.md §3`), cada una validando sus propios
invariantes en el constructor, referenciando otros agregados **solo por `id` de tipo `string`**, nunca
por objeto anidado. Este documento no inventa el patrón — lo hace explícito y lo completa donde faltan
agregados (Lote, Serie, Reposición).

### 5.2 Tabla de Aggregate Roots — real vs. propuesto

| Aggregate Root                      | Estado real                                                                                                                                                                                                                           | Invariantes (reales, citadas literalmente donde ya existen)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Product (Producto)**              | ✅ Real — `modules/productos/backend/entities/`, fuera de este Bounded Context en sentido estricto de módulo, referenciado por `id` desde todo agregado de Inventario.                                                                | Invariante marca↔modelo ya citado en `stock.entity.ts` como precedente de "invariante que la tabla no fuerza".                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Warehouse (Almacén)**             | ✅ Real — `Almacen` (`almacen.entity.ts`).                                                                                                                                                                                            | `name`/`code` no vacíos; `warehouseType ∈ {physical, virtual}` (`ADR-INV-002 §3`).                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Stock**                           | ✅ Real — `Stock` (`stock.entity.ts`).                                                                                                                                                                                                | `quantityOnHand ≥ 0`; `quantityReserved ≥ 0`; `quantityReserved ≤ quantityOnHand` — **invariante que la tabla física no fuerza** (columnas `NUMERIC` independientes, sin `CHECK` cruzado), validado en el dominio. `quantityAvailable` es una propiedad calculada (`get`), nunca almacenada.                                                                                                                                                                                                                       |
| **Movement (Movimiento)**           | ✅ Real — `MovimientoStock` (`movimiento-stock.entity.ts`). Agregado de una sola entidad, **append-only** — nunca se actualiza ni se elimina una vez creado.                                                                          | `quantity > 0`; `unitCost ≥ 0` si no es `null`; `sourceModule`/`sourceEntityId` — "o los dos están presentes, o ninguno: un origen a medias no es trazable" (cita literal del código real).                                                                                                                                                                                                                                                                                                                        |
| **Transfer (Transferencia)**        | ✅ Real — `Transferencia` (`transferencia.entity.ts`), agregado multi-entidad (encabezado + líneas).                                                                                                                                  | `sourceWarehouseId ≠ destinationWarehouseId`; ≥ 1 línea; cada línea `quantity > 0`; máquina de estados real: `draft → {in_transit, cancelled}`, `in_transit → received`, sin transición de salida desde `received`/`cancelled`.                                                                                                                                                                                                                                                                                    |
| **Reservation (Reserva)**           | ✅ Real — `ReservaStock` (`reserva-stock.entity.ts`).                                                                                                                                                                                 | `quantity > 0`; `sourceModule`/`sourceEntityId` **ambos obligatorios** (a diferencia de `Movement`, donde el par es opcional) — "una reserva siempre tiene un dueño identificable, nunca es suelta" (cita literal).                                                                                                                                                                                                                                                                                                |
| **Lot (Lote)**                      | 🔴 No existe como entidad de dominio — solo modelo Prisma (`ADR-INV-002 §8.1`).                                                                                                                                                       | **Propuesto**: `lotNumber` no vacío; `remainingQuantity ≥ 0`. **Brecha real que limita el invariante posible**: `inventory_lots` no tiene columna `originalQuantity` (a diferencia de `fifo_cost_layers`, que sí la tiene) — no es posible validar hoy "lo restante nunca supera lo recibido" sin antes agregar esa columna, recomendación ya alineada con `ADR-INV-002 §10.4` (conectar el lote a su línea de recepción).                                                                                         |
| **Serial Number (Número de Serie)** | 🔴 No existe como entidad de dominio (`ADR-INV-002 §9.1`).                                                                                                                                                                            | **Propuesto**: `serialNumber` no vacío; `status ∈ {in_stock, sold, under_warranty, scrapped}` (mismo `CHECK` real de la tabla); transición lineal `in_stock → sold → under_warranty → scrapped`, tal como documenta `18-modulo-products.md §7` — **pregunta de diseño abierta señalada por este ADR**: el diagrama real es estrictamente lineal, sin retorno de `under_warranty` a `in_stock` (¿una reparación exitosa no debería poder devolver la unidad a stock?) — no resuelta en ningún documento verificado. |
| **Cycle Count (Conteo Físico)**     | ✅ Real — `ConteoFisico` (`conteo-fisico.entity.ts`), agregado multi-entidad (encabezado + líneas). `ProgramaConteoCiclico` es un **agregado separado** (ciclo de vida propio: genera instancias de `ConteoFisico`, no las contiene). | ≥ 1 línea; cada línea `systemQuantity ≥ 0`. `systemQuantity` se resuelve del `Stock` real en el servicio de aplicación, no en el constructor — "una entidad de dominio pura no consulta la base" (cita literal), límite de responsabilidad ya aplicado consistentemente.                                                                                                                                                                                                                                           |
| **Replenishment (Reposición)**      | 🔴 No existe como entidad de dominio — `replenishment_rules` sin código de aplicación (`ADR-INV-002 §4`).                                                                                                                             | **Propuesto**: `minQuantity < maxQuantity` (invariante de comparación, hoy no verificable porque no hay entidad que la aplique); `warehouseId`/`productId` obligatorios.                                                                                                                                                                                                                                                                                                                                           |

### 5.2.1 Contradicción real detectada: Zona/Ubicación como agregados propios vs. entidades hijas de Almacén

**Corrección/hallazgo de la revisión de gobernanza (2026-07-27)**: `docs/ddd/04_aggregates.md §2`
(catálogo de agregados, fila "Almacén") modela `warehouse_locations`/`warehouse_zones` como
**entidades hijas** de `Almacén`, dentro de su misma frontera de consistencia. Este ADR, en cambio,
concluyó en §6.2 que `ZonaAlmacen`/`UbicacionAlmacen` son **Aggregate Roots separados** — conclusión
basada en evidencia directa de código: ambas tienen su propio servicio, controller y repositorio
(`ZonasAlmacenService`/`ZonasAlmacenController`, `UbicacionesAlmacenService`/
`UbicacionesAlmacenController`), con endpoints REST propios e independientes de `AlmacenesController`
— en DDD, tener repositorio propio es, por definición, ser un Aggregate Root (un repositorio existe
por agregado, nunca por entidad hija).

Las dos fuentes describen intenciones de momentos distintos: `docs/ddd/04_aggregates.md` es un
documento de **diseño conceptual**, escrito antes o independientemente de la implementación;
`modules/inventario/backend/` es el **código real ya desplegable**, con endpoints ya documentados en
`docs/reports/inventory/INVENTORY_STATUS.md`. Este ADR prioriza el código real sobre el diseño
conceptual cuando divergen (mismo criterio aplicado en toda esta serie a `ADR-DB-001`/`ADR-INV-001`/
`ADR-INV-002`) — **recomendación de este ADR**: actualizar `docs/ddd/04_aggregates.md §2` para
reflejar que Zona y Ubicación son agregados propios, no entidades hijas, preservando compatibilidad
hacia atrás porque no requiere ningún cambio de código, solo de documentación — el sistema ya
funciona según el modelo correcto, es la documentación conceptual la que quedó desactualizada.

### 5.3 Por qué "Inventory" no es, en sí mismo, un Aggregate Root

La solicitud original incluye "Inventory" como ejemplo de agregado — este ADR recomienda
explícitamente **no** modelarlo así. Un agregado existe para delimitar una frontera de consistencia
transaccional real: el conjunto de invariantes que deben ser verdaderas _juntas_, siempre, tras cada
cambio. No existe ninguna operación de negocio real en este dominio que necesite bloquear
simultáneamente _todos_ los almacenes, _todo_ el stock y _todos_ los movimientos para garantizar una
invariante conjunta — cada uno de los agregados de §5.2 ya tiene su propia frontera de consistencia
independiente (`Stock` valida su propio par cantidad-a-mano/reservado; `Transferencia` valida su
propio par origen/destino). "Inventory" es, correctamente, el nombre del **Bounded Context** (§3), no
de un agregado — modelarlo como agregado único sería el anti-patrón clásico de "agregado dios",
serializando en la práctica todas las escrituras del dominio contra un candado que no protege ninguna
invariante real.

### 5.4 Diagrama ASCII — fronteras de agregado y referencia por ID

```text
┌─────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│  Warehouse (Almacén)       │        │  Zone (Zona)               │        │  Location (Ubicación)      │
│  AGGREGATE ROOT             │        │  AGGREGATE ROOT             │        │  AGGREGATE ROOT             │
│  id, name, code,            │◀╌╌╌╌╌╌╌│  warehouseId (por id)      │◀╌╌╌╌╌╌╌│  zoneId (por id)           │
│  warehouseType               │        │  zoneFunction                │        │  parentLocationId (self)    │
└─────────────────────────┘        └─────────────────────────┘        └─────────────────────────┘
      ▲                                                                              ▲
      │ warehouseId (por id, nunca objeto anidado)                                    │ locationId (opcional, por id)
      │                                                                              │
┌─────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│  Stock                     │        │  Movement (Movimiento)      │        │  Lot (Lote) [PROPUESTO]     │
│  AGGREGATE ROOT             │        │  AGGREGATE ROOT (1 entidad, │        │  AGGREGATE ROOT [PROPUESTO] │
│  productId, warehouseId,    │        │  append-only, inmutable)     │        │  lotNumber, expiryDate,     │
│  locationId, on_hand,       │        │  productId, warehouseId,     │        │  remainingQuantity          │
│  reserved (≤ on_hand)       │        │  quantity>0, unitCost≥0      │        └─────────────────────────┘
└─────────────────────────┘        └─────────────────────────┘
      ▲                                    ▲
      │ productId+warehouseId (por id)      │ productId, warehouseId (por id)
      │                                    │
┌─────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│  Reservation (Reserva)      │        │  Transfer (Transferencia)   │        │  Cycle Count (Conteo)       │
│  AGGREGATE ROOT (1 entidad) │        │  AGGREGATE ROOT (multi-      │        │  AGGREGATE ROOT (multi-     │
│  productId, warehouseId,    │        │  entidad: encabezado+líneas) │        │  entidad: encabezado+líneas)│
│  sourceModule+EntityId      │        │  source≠destination,         │        │  warehouseId, scheduledDate,│
│  (ambos obligatorios)        │        │  estado draft→in_transit→    │        │  líneas ≥ 1                 │
└─────────────────────────┘        │  received | draft→cancelled  │        └─────────────────────────┘
                                       └─────────────────────────┘
```

---

## 6. Entities

### 6.1 Raíces de agregado vs. entidades locales — la distinción real que el código ya hace

No toda fila de una tabla real es una Entity de dominio con identidad propia a nivel de dominio.
**Hallazgo preciso**: las "líneas" de los tres agregados multi-entidad (`Transferencia`, `AjusteStock`,
`ConteoFisico`) están tipadas hoy como **interfaces planas** (`LineaTransferenciaInput`,
`LineaAjusteInput`, `LineaConteoInput`), sin `id` expuesto a nivel de dominio — aunque la fila física
en base de datos sí tiene su propio `id` (`stock_transfer_lines.id`, etc.). Esto significa que, en la
práctica, GORAZUS ya trata esas líneas como estructuras de datos dentro de la frontera de su agregado
padre, no como Entities independientes — una decisión de diseño válida (no toda tabla necesita una
Entity de dominio propia) que este ADR documenta en vez de "corregir".

### 6.1.1 Segunda contradicción real detectada: ¿quién es dueño de reservar/liberar?

**Hallazgo de la continuación de la revisión de gobernanza**: `docs/ddd/09_repositories.md §1`
diseña `ExistenciaRepository` (el repositorio de `Stock`) con métodos propios `reservar()`/
`liberarReserva()`/`consultarDisponible()` — es decir, modela la reserva como una operación que
**pertenece al repositorio de Stock**, sin un repositorio propio para Reserva. El código real
contradice esto directamente: `modules/inventario/backend/repositories/` tiene
`stock.repository.ts` **y** `reserva-stock.repository.ts` como archivos separados — dos
repositorios, uno por agregado, exactamente el criterio que `ADR-INV-000 §5`/`§6.2` de este mismo
documento ya había concluido a partir de la evidencia de código (`ReservasController`/
`ReservasService`/`ReservaStockRepository` independientes de `AlmacenesController`/`StockService`).

Misma resolución que la divergencia de Zona/Ubicación (§5.2.1): el código real, ya desplegable, pesa
más que el diseño conceptual de `docs/ddd/09_repositories.md` cuando divergen. **Recomendación de
este ADR**: actualizar `docs/ddd/09_repositories.md §1`, fila "Existencia (Inventario)" — mover
`reservar()`/`liberarReserva()` a una fila nueva `ReservaStockRepository` propia, dejando
`ExistenciaRepository` solo con `consultarDisponible()` y las consultas de lectura. Sin cambio de
código, solo de documentación.

### 6.2 Tabla de relaciones y propiedad (ownership)

| Entity                             | Tipo real                                                                                                                     | Pertenece a (ownership)                                                                                                                 | Relación                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Almacen` (Warehouse)              | Aggregate Root propio                                                                                                         | Sí mismo — referenciado por `companyId`/`branchId` (`core`, otro Bounded Context)                                                       | 1 Almacén → N Zonas (por `warehouseId`, no anidado)                                                                       |
| `ZonaAlmacen` (Zone)               | Aggregate Root propio, con servicio/controller propio (`ZonasAlmacenService`) — **no** un hijo cargado a través de `Almacen`. | Referencia a `Almacen` solo por `warehouseId`.                                                                                          | 1 Zona → N Ubicaciones (por `zoneId`)                                                                                     |
| `UbicacionAlmacen` (Location)      | Aggregate Root propio, auto-referenciado (`parentLocationId`) — mismo patrón que `product_categories` (`ADR-INV-002 §2.3`).   | Referencia a `ZonaAlmacen` solo por `zoneId`.                                                                                           | Jerarquía de profundidad libre (Aisle→Rack→Shelf→Bin vía convención `metadata.locationType`, `ADR-INV-002 §2.3`)          |
| `Stock`                            | Aggregate Root propio                                                                                                         | Referencia `Producto` (otro Bounded Context), `Almacen`, `UbicacionAlmacen` (opcional) — todo por `id`.                                 | 1 fila por `(productId, warehouseId, locationId)` — único índice real con `COALESCE`.                                     |
| `MovimientoStock` (Movement)       | Aggregate Root de una sola entidad                                                                                            | Referencia `Producto`, `Almacen`, `TipoMovimientoStock` por `id`; `sourceModule`/`sourceEntityId` como referencia polimórfica opcional. | Ninguna entidad es dueña de un Movimiento — se crea una vez, no pertenece a ningún otro agregado.                         |
| `TipoMovimientoStock`              | Aggregate Root pequeño (catálogo abierto, §11.1 de `ADR-INV-002`)                                                             | Independiente — referenciado por `id` desde `MovimientoStock`.                                                                          | 1 Tipo → N Movimientos.                                                                                                   |
| `Transferencia` (Transfer)         | Aggregate Root, dueño de sus líneas (`LineaTransferenciaInput[]`)                                                             | Las líneas **pertenecen** a la Transferencia — no tienen ciclo de vida propio fuera de ella.                                            | 1 Transferencia → 2 Movimientos generados (`transfer_out`/`transfer_in`, `ADR-INV-002 §3.2`), nunca anidados como objeto. |
| `ReservaStock` (Reservation)       | Aggregate Root de una sola entidad                                                                                            | Referencia `Producto`, `Almacen` por `id`; dueño identificado obligatorio vía `sourceModule`/`sourceEntityId`.                          | Ninguna — vive independiente, se libera (`releasedAt`), no se transforma en otra cosa.                                    |
| `AjusteStock` (Adjustment)         | Aggregate Root, dueño de sus líneas (`LineaAjusteInput[]`)                                                                    | Las líneas pertenecen al Ajuste.                                                                                                        | Referencia `MotivoAjuste` por `id`; al confirmarse genera Movimientos (`ADR-INV-002 §11.2`).                              |
| `MotivoAjuste`                     | Aggregate Root pequeño (catálogo abierto)                                                                                     | Independiente.                                                                                                                          | 1 Motivo → N Ajustes.                                                                                                     |
| `ConteoFisico` (Cycle Count)       | Aggregate Root, dueño de sus líneas (`LineaConteoInput[]`)                                                                    | Las líneas pertenecen al Conteo.                                                                                                        | Genera `AjusteStock` automáticamente al completarse (`19-modulo-inventory.md §8`) — no lo contiene, lo crea.              |
| `ProgramaConteoCiclico`            | Aggregate Root independiente                                                                                                  | Referencia `ZonaAlmacen` por `zoneId`.                                                                                                  | 1 Programa → N instancias de `ConteoFisico` generadas a lo largo del tiempo.                                              |
| `Lote` (Lot) — propuesto           | Aggregate Root propuesto (§5.2)                                                                                               | Referencia `Producto`, `Almacen` por `id`.                                                                                              | **Sin propietario real hoy** — ninguna línea de recepción lo referencia (`ADR-INV-002 §8.1`, brecha).                     |
| `NumeroSerie` (Serial) — propuesto | Aggregate Root propuesto (§5.2)                                                                                               | Referencia `Producto`, `Almacen` por `id`.                                                                                              | **Sin propietario real hoy** — mismo tipo de brecha que Lote (`ADR-INV-002 §9.1`).                                        |

---

## 7. Value Objects

### 7.1 Corrección de expectativa — algunos "Value Objects" solicitados son, en realidad, Entities

Antes de la tabla: dos de los diez elementos solicitados no son, en sentido estricto de DDD, Value
Objects — son Entities, porque tienen identidad y estado que cambia en el tiempo, independiente de sus
atributos. Un Value Object se define únicamente por sus valores (dos instancias con los mismos
atributos son intercambiables); una Entity tiene una identidad que persiste aunque sus atributos
cambien.

- **Serial Number**: la _cadena_ `serial_number` (el texto en sí) es un Value Object. La _unidad
  rastreada_ (la fila de `inventory_serials`, con `status` que cambia de `in_stock` a `sold` a lo
  largo del tiempo, §5.2) es una **Entity** (`NumeroSerie`) — ya diseñada como Aggregate Root en §5.
- **Location**: por la misma razón — `warehouse_locations` tiene identidad propia, persistente, con
  hijos propios (§2.3 de `ADR-INV-002`) — ya es la Entity `UbicacionAlmacen` (§6), no un Value Object.

Con esa corrección, la tabla siguiente cubre los ocho elementos que sí son Value Objects genuinos, más
la aclaración de los dos anteriores.

### 7.2 Corrección mayor tras revisión de gobernanza (2026-07-27)

La primera versión de esta sección afirmaba que `Money`, `Quantity` y `Weight/Dimensions` **no
existían**, ni siquiera como diseño — conclusión basada solo en el código real de
`modules/inventario/backend/entities/`, sin haber revisado `docs/ddd/06_value_objects.md`. Ese
documento **ya tiene los tres completamente diseñados** (atributos, validaciones, reglas), como
Shared Kernel o locales al dominio:

- **Dinero (`Money`)** (`ddd/06 §1.1`): `monto`/`moneda` (ISO 4217), validado contra
  `configuration.currencies` (**tabla real, verificada** —
  `core/database/prisma/schemas/configuration/schema.prisma:116`), aritmética que rechaza operar
  entre monedas distintas. Shared Kernel — no específico de Inventario.
- **Cantidad (`Quantity`)** (`ddd/06 §2.4`): `valor` + `unidad_de_medida` (referencia a
  `products.units_of_measure`), `Cantidad.convertirA(otraUnidad)` reutilizando
  `products.unit_conversions` — explícitamente **local a** `productos`/`inventario`/`ventas`/
  `compras`/`producción` (no Shared Kernel, porque su validación depende de una tabla de referencia
  propia de `productos`).
- **Peso / Volumen / Medidas** (`ddd/06 §2.6`): `valor` + `unidad`, con conversión entre unidades del
  mismo tipo físico — local a `productos`/`logística`.

**Lo que sigue siendo cierto** de la versión anterior: ninguno de los tres tiene **código de
aplicación** real (`ddd/06` es diseño, no implementación — mismo patrón "schema/diseño real, cero
código" que el resto de esta serie de ADRs). Y el hallazgo de §2 ("Multi-moneda") se mantiene con un
matiz: el catálogo `configuration.currencies` y el VO `Money` **sí están diseñados**, pero
`inventory`/`products` no tienen columna `currency_code` que los conecte — la capacidad arquitectónica
existe a nivel de Shared Kernel, simplemente no está cableada hacia los campos de costo/precio de este
dominio.

### 7.3 Tabla de Value Objects, corregida

| Value Object            | Estado real                                                                                                                                                                                          | Por qué es un Value Object                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Money**               | 🟡 Diseñado en `ddd/06 §1.1`, Shared Kernel — sin código de aplicación. `standard_cost`/`unit_cost`/`list_price` de `products` no lo usan todavía (`Decimal` suelto).                                | Dos montos son intercambiables si tienen el mismo valor **y** la misma moneda — el diseño ya existente lo modela correctamente; falta conectarlo a los campos de costo de este dominio.                |
| **Quantity (Cantidad)** | 🟡 Diseñado en `ddd/06 §2.4`, local a Inventario — sin código de aplicación. Las entidades reales (`Stock.quantityOnHand`, `MovimientoStock.quantity`) usan `number` primitivo.                      | Dos cantidades de `10` son intercambiables entre sí — el diseño ya existente centraliza la validación (`> 0`/`≥ 0` según el caso) y la conversión de unidades, hoy duplicada en cada constructor real. |
| **Weight / Dimensions** | 🟡 Diseñado en `ddd/06 §2.6`, local a `productos`/`logística` — columnas planas en `products.product_physical_attributes` (`ADR-INV-001 §6`), fuera de este Bounded Context.                         | Un peso de `2.3kg` es intercambiable con cualquier otro `2.3kg` — no tiene identidad, solo valor y unidad.                                                                                             |
| **Barcode**             | 🔴 Sin diseño formal en `ddd/06` ni código propio — `products.product_barcodes.barcode` + `barcode_type` (texto libre, `ADR-INV-001 §6`) son la única representación, fuera de este Bounded Context. | Definido completamente por su cadena y su tipo — dos códigos iguales son el mismo código de barras, sin importar en qué producto se usen.                                                              |
| **SKU**                 | 🔴 Sin diseño formal en `ddd/06` ni código propio — `products.sku`, único por empresa (`ADR-INV-001 §1`), fuera de este Bounded Context.                                                             | Igual criterio — el valor de la cadena **es** la identidad de negocio, pero como objeto de dominio es inmutable y comparable por valor.                                                                |
| **Expiration Date**     | 🔴 Sin diseño formal en `ddd/06` — `inventory_lots.expiry_date` (§8.1 de `ADR-INV-002`) es un `Date` primitivo real, sin envoltura de VO en ningún documento revisado.                               | Dos fechas de vencimiento iguales son intercambiables — candidata natural a Value Object con comportamiento (`isExpired(referenceDate)`) en vez de comparación dispersa en servicios.                  |
| **Lot Number**          | 🔴 Sin diseño formal en `ddd/06` — `inventory_lots.lot_number`, texto libre (§8.2 de `ADR-INV-002`), real como columna, no como VO en ningún documento.                                              | La _cadena_ del número de lote es un Value Object (comparable por valor); la _entidad_ `Lote` que la contiene es un Aggregate Root (§5.2) — misma dualidad que Serial Number (§7.1).                   |

### 7.4 Recomendación de este ADR, corregida

Con `Money`/`Quantity`/`Weight`/`Dimensions` ya diseñados en `ddd/06`, la recomendación cambia de
"diseñar estos VOs" a **"implementar los ya diseñados cuando se construya código real de Inventario"**
— no hay trabajo de diseño pendiente para esos tres, solo de implementación, y debe hacerse siguiendo
`ddd/06` exactamente (mismos atributos/reglas), no reinventando la forma. `Barcode`, `SKU`,
`Expiration Date` y `Lot Number` siguen sin diseño formal en ningún documento revisado — para esos
sí se mantiene la recomendación original: no crear clases sin evidencia de que la duplicación actual
cause un problema real (mismo criterio de "no diseñar para lo hipotético" de toda esta serie), y si se
decide diseñarlos, hacerlo como una extensión de `ddd/06 §2`, no como una decisión aislada de este ADR.

---

## 8. Domain Services

### 8.1 Corrección tras revisión de gobernanza: `Cost Service` ya está nombrado y diseñado

La versión anterior de esta sección decía que `Cost Service` "no existe" — cierto a nivel de código,
falso a nivel de diseño formal: `docs/ddd/08_domain_services.md §1.1-1.3` ya nombra y especifica tres
Domain Services directamente equivalentes, remitiendo al mismo algoritmo real ya citado en
`ADR-INV-002 §10.1`:

- **`AplicarFIFO`** — "determinar el costo de una salida de Inventario consumiendo las capas de costo
  más antiguas primero", diseño completo en `19-modulo-inventory.md §10` (la misma fuente que este
  ADR ya citaba).
- **`CalcularCostoPromedio`** — recálculo de costo promedio ponderado tras cada entrada, diseño
  completo en `19-modulo-inventory.md §11`. Mutuamente excluyente con `AplicarFIFO` por producto.
- **`ActualizarInventario`** — el nombre formal más preciso que "Movement Service": opera sobre **dos**
  agregados (Movimiento + Existencia) en la misma transacción, disparando `AplicarFIFO`/
  `CalcularCostoPromedio` según corresponda y verificando la invariante de disponible no-negativo —
  invocado por los Application Services que reaccionan a `RecepcionConfirmada`/
  `TransferenciaCompletada`/`AjusteInventarioAplicado` (§9.2, ya reconciliados con este mismo
  documento).

`Replenishment Service` **sí sigue sin precedente** — `ddd/08_domain_services.md §2` ("Por qué estos
siete y no más") enumera explícitamente los siete Domain Services de esta fase y ninguno cubre
reposición; la ausencia es una decisión de alcance ya documentada, no un vacío sin explicar.

### 8.2 Tabla de los seis servicios solicitados, corregida

| Domain Service solicitado | Estado real                                                                                                                                               | Responsabilidad                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inventory Service**     | ✅ Real — `StockService` (consultas de solo lectura sobre `Stock`, confirmado en el estado del módulo).                                                   | Responde "¿cuánto hay?" (`v_available_stock`) — nunca escribe, delega toda escritura a `MovimientosService`/`ActualizarInventario`.                                                                                                                       |
| **Reservation Service**   | ✅ Real — `ReservasService`.                                                                                                                              | Crea/libera `ReservaStock`, mantiene sincronizado `Stock.quantityReserved` como total denormalizado (`ADR-INV-002 §5.2`) — el único servicio con permiso de escribir esa columna sin pasar por un Movimiento.                                             |
| **Cost Service**          | 🟡 Diseñado (`AplicarFIFO`/`CalcularCostoPromedio`, `ddd/08 §1.1-1.2`) — sin código de aplicación (Parte 06 pendiente, `ADR-INV-002 §10.1`, §14).         | Resolver el costo de salida según `products.costingMethod` — el algoritmo ya está formalmente especificado, falta implementarlo.                                                                                                                          |
| **Movement Service**      | ✅ Real (`MovimientosService`, con bloqueo de filas) — y formalmente nombrado como Domain Service cross-agregado (`ActualizarInventario`, `ddd/08 §1.3`). | Único punto de escritura real de `stock_movements` — todo otro servicio que necesita alterar cantidad (`TransferenciasService`, `AjustesService`) lo invoca, nunca escribe `stock_movements` directamente.                                                |
| **Transfer Service**      | ✅ Real — `TransferenciasService`.                                                                                                                        | Orquesta la máquina de estados de `Transferencia` (§5.2) y delega en `MovimientosService` la creación de los dos movimientos (`transfer_out`/`transfer_in`).                                                                                              |
| **Replenishment Service** | 🔴 No existe, ni código ni diseño — confirmado ausente incluso en `ddd/08_domain_services.md §2`, exclusión explícita de esta fase.                       | **Propuesto**: evaluar `Stock` de la zona `picking` contra `ReglaReposicion.minQuantity`, generar la reposición (probablemente vía `MovimientosService`/`ActualizarInventario`, reutilizando `transfer_out`/`transfer_in` entre zonas del mismo almacén). |

### 8.2 Diagrama ASCII — orquestación real entre servicios (con lo propuesto marcado)

```text
┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
│  ReservasService       │        │  TransferenciasService │        │  AjustesService         │
│  (real)                 │        │  (real)                  │        │  (real)                   │
└──────────┬─────────┘        └──────────┬─────────┘        └──────────┬─────────┘
           │ libera reserva,                │ delega creación de           │ al confirmar, delega
           │ ajusta quantityReserved         │ 2 movimientos                │ creación de movimientos
           │ directo sobre Stock              │                              │
           ▼                                ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MovimientosService (real)                                 │
│   Único escritor real de `stock_movements` — bloqueo de filas (stock-lock.util.ts)  │
└──────────┬─────────────────────────────────────────┬──────────────────────────────┘
           │ consulta costo a resolver                  │ dispara evento de dominio (§9,
           ▼                                            │ ADR-INV-002 §13 — sin publish() real todavía)
┌────────────────────┐                                 ▼
│  CostService           │                    RecepcionConfirmada / TransferenciaCompletada /
│  [PROPUESTO]            │                    AjusteInventarioAplicado / ConsumoProduccionRegistrado
│  FIFO / Promedio        │                    (routing keys reales, sin publicar aún — nombres
└────────────────────┘                         reconciliados con `docs/ddd/07`, §9.2)
           ▲
           │ evalúa Stock de zona 'picking' contra minQuantity
┌────────────────────┐
│  ReplenishmentService  │
│  [PROPUESTO]            │
└────────────────────┘
           ▲
           │ solo lectura
┌────────────────────┐
│  StockService (real,   │
│  "Inventory Service")   │
└────────────────────┘
```

### 8.3 Addendum de gobernanza: CQRS y Observabilidad (2026-07-27)

**Corrección de un hallazgo previamente solo verbal, ahora persistido**: una revisión de gobernanza
anterior evaluó `CQRS` y `Observability` como parte de una validación Enterprise retrospectiva
(DDD, Clean Architecture, Hexagonal, SOLID, Repository Pattern, CQRS, OpenAPI, Security, Performance,
Scalability, Maintainability, Observability, Auditability) — el resultado se reportó en el chat de la
sesión pero nunca se escribió en este documento, lo cual lo dejaba, en la práctica, sin efecto sobre
el Knowledge Base real. Se corrige aquí:

- **CQRS**: `docs/ddd/20_architecture_summary.md §3.1` documenta un patrón real y deliberado,
  **"CQRS ligero (sin event sourcing)"** — separación de `*.usecase.ts` (comandos) vs.
  `*-query.service.ts` (consultas, fachada pública de solo lectura), ya nombrado en
  `docs/architecture/00-arquitectura-general.md §3.2`. `StockService` (real, solo lectura) y
  `MovimientosService` (real, escritura) son una instancia directa de este patrón. CQRS pleno
  (stores de lectura separados) está evaluado como **"preparado, no construido"** — extensión del
  catálogo existente si el negocio lo confirma, no un rediseño. No es una brecha, es una decisión
  arquitectónica real y consistente con la política de no diseñar especulativamente
  (`docs/ddd/20_architecture_summary.md §4`).
- **Observability**: real y extensamente diseñado en
  `docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md` — Audit Framework, Logging
  Framework (JSON estructurado, correlación por `requestId`, destino Loki/Grafana vía Promtail),
  Exception Framework, Health Checks, Metrics, Monitoring, Tracing — los siete componentes con
  diseño real referenciado, no inventado para esta sesión. Verificado en código real solo
  parcialmente: `event-bus.service.ts` (`core/messaging`) inyecta `LoggerService` real; no se
  verificó su uso dentro de `modules/inventario/backend/` específicamente.

---

## 9. Eventos de Dominio (ampliación de `ADR-INV-002 §13`)

### 9.1 Relación con los eventos ya diseñados

**Corrección aplicada tras revisión de gobernanza (2026-07-27)**: la primera versión de esta sección
nombraba los once eventos en inglés (`StockReceived`, `InventoryAdjusted`, etc.), unificándolos solo
contra `ADR-INV-002 §13` (que usaba el mismo idioma). Una revisión completa de la base de
conocimiento — obligatoria antes de escribir contenido nuevo, ver gobernanza del proyecto — encontró
que **ya existe un catálogo formal de eventos de dominio para Inventario**, en español, en
`docs/ddd/07_domain_events.md §1.2` y `docs/ddd/04_aggregates.md §1.1/§1.8/§2`:
`StockActualizado`, `StockInsuficiente`, `AlmacenCreado`, `TransferenciaCompletada`,
`AjusteInventarioAplicado`, `ConteoFisicoCompletado`, `ProductoCreado`, `RecepcionConfirmada`. Ninguno
de los once eventos de la versión anterior de esta sección coincidía con esos nombres ya aceptados —
una inconsistencia real, no cosmética, exactamente del tipo que la gobernanza del proyecto exige
detectar y corregir antes de seguir. Esta versión **adopta los nombres ya catalogados donde existen**
y extiende la misma convención (español, PascalCase, payload en `camelCase` español) para los eventos
sin precedente — en vez de mantener dos catálogos de eventos de Inventario contradictorios entre
`docs/ddd/` y `docs/adr/`.

### 9.2 Los doce eventos, reconciliados con `docs/ddd/07_domain_events.md`

| Evento                          | Precedente                                                                                                                                 | `routingKey` (convención real `<modulo>.<entidad>.<evento>`) | Se publicaría cuando...                                                                                                                                                                                                                              | Estado                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **ProductoCreado**              | ✅ Ya catalogado (`ddd/04_aggregates.md §1.1`)                                                                                             | `productos.producto.creado`                                  | Se crea un `Producto` (§5.2) — fuera de `inventory` en sentido estricto (subdominio `products`, §3.1), pero Inventory lo **consume** para saber que puede empezar a rastrear stock.                                                                  | 🔴 Propuesto — cero eventos publicados en `productos` (mismo estado que `ventas`/`auth`/`seguridad`, `ADR-INV-002 §13.1`). |
| **RecepcionConfirmada**         | ✅ Ya catalogado (`ddd/04_aggregates.md §1.6`, agregado "Recepción")                                                                       | `inventario.recepcion.confirmada`                            | Se confirma un `goods_receipts` — payload: `productoId`, `almacenId`, `cantidad`, `costoUnitario`, `loteId`/`serieId` si aplica.                                                                                                                     | 🔴 Propuesto (`ADR-INV-002 §13.2`, antes nombrado `StockReceived`).                                                        |
| **StockActualizado**            | ✅ Ya catalogado, estado "✅" en `ddd/07_domain_events.md §1.2`                                                                            | `inventario.stock.actualizado`                               | Señal amplia de "cambió el saldo de este producto/almacén" — consumida por `core/realtime` para UI en vivo — payload: `productoId`, `almacenId`, `cantidadDisponible`. Se publicaría junto con (no en vez de) los eventos específicos de esta tabla. | 🔴 Propuesto — sin publicador real todavía, aunque catalogado con "✅" en `ddd/07`.                                        |
| **StockInsuficiente**           | ✅ Ya catalogado, estado "✅" en `ddd/07_domain_events.md §1.2`                                                                            | `inventario.stock.insuficiente`                              | `v_available_stock` insuficiente para una línea de venta — payload: `ventaId`, `productoId`, `cantidadFaltante`. Cierra la brecha de "Backorders" ya señalada en `ADR-INV-002 §6`.                                                                   | 🔴 Propuesto — depende de que `sales` consulte disponibilidad, todavía sin construir (§1.2).                               |
| **ReservaCreada**               | 🔴 Sin precedente — nombrado aquí siguiendo la convención ya establecida                                                                   | `inventario.reserva.creada`                                  | Se crea una fila en `stock_reservations` (`ReservasService`, real) — payload: `productoId`, `almacenId`, `cantidad`, `moduloOrigen`, `entidadOrigenId`.                                                                                              | 🔴 Propuesto sobre servicio real.                                                                                          |
| **ReservaLiberada**             | 🔴 Sin precedente, misma convención                                                                                                        | `inventario.reserva.liberada`                                | `stock_reservations.released_at` se completa — mismo payload que `ReservaCreada`.                                                                                                                                                                    | 🔴 Propuesto sobre servicio real.                                                                                          |
| **TransferenciaCompletada**     | ✅ Ya catalogado (`ddd/04_aggregates.md §2`, agregado "Transferencia de Inventario")                                                       | `inventario.transferencia.completada`                        | `Transferencia.status` pasa a `received` (§5.2) — payload: `transferenciaId`, `origenId`, `destinoId`, `productoId`, `cantidad`.                                                                                                                     | 🔴 Propuesto sobre servicio real.                                                                                          |
| **AjusteInventarioAplicado**    | ✅ Ya catalogado (`ddd/04_aggregates.md §2`, agregado "Ajuste de Inventario")                                                              | `inventario.ajuste.aplicado`                                 | `AjusteStock` se confirma — payload: `ajusteId`, `productoId`, `almacenId`, `diferencia`, `motivoId`.                                                                                                                                                | 🔴 Propuesto sobre servicio real.                                                                                          |
| **ConsumoProduccionRegistrado** | 🟡 Relacionado con `OrdenProduccionLiberada`/`OrdenProduccionCerrada` (`ddd/04_aggregates.md §2`), sin evento propio para el consumo en sí | `inventario.produccion.consumo-registrado`                   | Movimiento `production_consumption` (`ADR-INV-002 §11.2`) — payload: `productoId`, `almacenId`, `cantidad`, `ordenProduccionId`.                                                                                                                     | 🔴 Propuesto — `production_orders` sin código de aplicación (`ADR-INV-002 §3.2`).                                          |
| **ConteoFisicoCompletado**      | ✅ Ya catalogado (`ddd/04_aggregates.md §2`, agregado "Conteo Físico")                                                                     | `inventario.conteo.completado`                               | `ConteoFisico.status` pasa a `completed` — dispara la reconciliación automática ya documentada (genera `AjusteStock` por cada línea con diferencia, `19-modulo-inventory.md §8`) — payload: `conteoId`, `almacenId`, `diferenciasEncontradas`.       | 🔴 Propuesto sobre servicio real (`ConteosService`).                                                                       |
| **LoteCreado**                  | 🔴 Sin precedente, misma convención                                                                                                        | `inventario.lote.creado`                                     | Se crea un `Lote` (§5.2, agregado propuesto) — payload: `numeroLote`, `productoId`, `almacenId`, `fechaVencimiento`.                                                                                                                                 | 🔴 Propuesto — `Lote` ni siquiera existe como entidad de dominio todavía (§5.2).                                           |
| **SerieAsignada**               | 🔴 Sin precedente, misma convención                                                                                                        | `inventario.serie.asignada`                                  | Se crea un `NumeroSerie` (§5.2, agregado propuesto) — payload: `numeroSerie`, `productoId`, `almacenId`.                                                                                                                                             | 🔴 Propuesto — mismo estado que `LoteCreado`.                                                                              |
| **ReposicionDisparada**         | 🔴 Sin precedente, misma convención                                                                                                        | `inventario.reposicion.disparada`                            | `ReplenishmentService` (§8, propuesto) detecta `Stock` de zona `picking` bajo `ReglaReposicion.minQuantity` — payload: `productoId`, `almacenId`, `cantidadActual`, `cantidadMinima`, `cantidadSugerida`.                                            | 🔴 Propuesto — ni el servicio ni la entidad existen (§5.2, §8).                                                            |

No se incluye `AlmacenCreado` (también ya catalogado en `ddd/04_aggregates.md §2`) en la tabla de
eventos consumidos por otros dominios de §9.3 — es relevante para auditoría/`Notifications`, pero
ningún dominio vecino de este ADR lo consume hoy de forma identificada.

### 9.3 Por qué cada evento importa — quién lo consumiría y para qué

- **ProductoCreado**: consumido por Inventory para decidir si el producto nuevo participa de `stock`
  (según `tracksSerial`/`tracksLot`, `ADR-INV-001 §2.1`) — sin este evento, Inventory no tiene forma
  reactiva de saber que existe un producto nuevo, solo lo descubre al primer movimiento.
- **RecepcionConfirmada/TransferenciaCompletada/AjusteInventarioAplicado/ConsumoProduccionRegistrado**:
  los cuatro eventos que representan una **variación real de cantidad** — los candidatos naturales
  para que `Accounting` genere el asiento de costo correspondiente (§10, §11).
- **StockActualizado/StockInsuficiente**: los dos únicos de esta lista ya marcados "✅" en
  `ddd/07_domain_events.md` — `StockActualizado` alimenta UI en tiempo real (`core/realtime`),
  `StockInsuficiente` es la señal que `Sales` necesitaría para no vender lo que no puede prometer.
- **ReservaCreada/ReservaLiberada**: relevantes para `Sales` (saber cuándo reintentar una venta
  bloqueada por falta de disponibilidad, ya señalado como brecha en `ADR-INV-002 §6` "Backorders") y
  para `Notifications` (alertar a un vendedor cuando el producto que su cliente esperaba ya está
  disponible).
- **ConteoFisicoCompletado**: el único evento de esta lista que representa una **corrección de la
  verdad**, no una operación planeada — relevante para auditoría interna y para `Reporting` (medir
  precisión de inventario a lo largo del tiempo, KPI real de operación de almacén).
- **LoteCreado/SerieAsignada**: la base para que `Notifications` implemente alertas de vencimiento
  próximo o `CRM` pueda, eventualmente, asociar una unidad serializada vendida a un cliente sin que
  Inventory necesite saber nada de CRM (§11).
- **ReposicionDisparada**: el evento que cerraría el ciclo de reposición automática (`ADR-INV-002 §6`
  "Automatic replenishment") — hoy esa evaluación no ocurre en ningún lado, ni sincrónica ni
  asincrónicamente.

### 9.4 Acción pendiente sobre `ADR-INV-002 §13`

`ADR-INV-002 §13` (ya "Aceptada") todavía tiene los seis nombres en inglés de la versión original de
esta sección. Se corrige en el mismo pase de gobernanza que esta sección — ver el ADR real,
`docs/adr/ADR-INV-002-arquitectura-de-gestion-de-almacenes.md §13`, ya actualizado para usar los
mismos doce nombres de esta tabla.

---

## 10. Flujo de Eventos (Event Flow)

### 10.1 La cadena solicitada, sobre la infraestructura real

`Purchasing → Inventory → Accounting → Reporting → Notifications → Analytics` no es un pipeline
secuencial de un solo hilo — sobre el bus real (`core/messaging`, exchange topic `gorazus.eventos`,
§9 de `ADR-INV-002`), es una cadena de **publicación/suscripción independiente en cada eslabón**: cada
módulo publica lo suyo sin saber quién escucha, y cada consumidor declara su propia cola durable con
su propio _binding_ — el fallo o la lentitud de `Analytics` nunca bloquea a `Accounting`, porque no
comparten cola (regla real ya citada, `08-infraestructura-y-despliegue.md §4`).

### 10.2 Diagrama — la cadena completa, con routing keys reales/propuestos

```text
Purchasing                Inventory                  Accounting              Reporting            Notifications         Analytics
    │                          │                          │                     │                      │                    │
    │ goods_receipts           │                          │                     │                      │                    │
    │ confirmado                │                          │                     │                      │                    │
    │  [PROPUESTO, §4 de        │                          │                     │                      │                    │
    │   ADR-INV-002]            │                          │                     │                      │                    │
    │──────────────────────────▶│                          │                     │                      │                    │
    │                          │ publish(                  │                     │                      │                    │
    │                          │  'inventario.stock.       │                     │                      │                    │
    │                          │   recibido')               │                     │                      │                    │
    │                          │──────────────────────────▶│                     │                      │                    │
    │                          │                          │ cola propia:         │                     │                      │                    │
    │                          │                          │ accounting.          │                     │                      │                    │
    │                          │                          │ inventory-valuation  │                     │                      │                    │
    │                          │                          │ → genera asiento     │                     │                      │                    │
    │                          │                          │   de valuación        │                     │                      │                    │
    │                          │                          │──────────────────────▶│                     │                      │                    │
    │                          │                          │                     │ cola propia:         │                      │                    │
    │                          │                          │                     │ bi.kpi-snapshots      │                      │                    │
    │                          │                          │                     │ (ADR-DB-001 §7)       │                      │                    │
    │                          │──────────────────────────┼─────────────────────┼──────────────────────▶│                    │
    │                          │  (Inventory también       │                     │                      │ cola propia:         │
    │                          │   publica directo a        │                     │                      │ notifications.        │
    │                          │   Notifications —          │                     │                      │ low-stock              │
    │                          │   no pasa por Accounting)  │                     │                      │ (ReorderTriggered)     │
    │                          │                          │                     │                      │──────────────────────▶│
    │                          │                          │                     │                      │                      │ cola propia:
    │                          │                          │                     │                      │                      │ analytics.
    │                          │                          │                     │                      │                      │ all-events
```

**Corrección importante frente al pedido**: la cadena no es literalmente secuencial
(Purchasing→Inventory→Accounting→Reporting→Notifications→Analytics, cada uno esperando al anterior) —
sobre un exchange topic, **todos los suscriptores de interés reciben el evento en paralelo**, apenas
Inventory lo publica. `Notifications` no necesita esperar a que `Reporting` termine de procesar; ambos
consumen la misma publicación de forma independiente. Este ADR corrige la expectativa de "cadena" por
la de "difusión" (fan-out), que es como el mecanismo real ya construido efectivamente funciona.

### 10.3 Estado real de cada eslabón

| Eslabón                   | Estado real                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purchasing → Inventory    | 🔴 Sin integración — `purchases` no invoca `inventory` (`ADR-INV-002 §1.3`, ya confirmado por `grep`).                                                          |
| Inventory → Accounting    | 🔴 Sin integración — propuesta en `ADR-INV-002 §13.3`, ningún código real.                                                                                      |
| Accounting → Reporting    | 🟡 Parcialmente real por otra vía — `bi.kpi_snapshots` existe como tabla (`ADR-DB-001 §7`), pero no confirmado si se alimenta de eventos o de un job periódico. |
| Reporting → Notifications | 🔴 Sin integración — `core.notifications` es dirigido a usuario, no polimórfico (`ADR-INV-000 §1.2`), requeriría lógica explícita de a quién notificar.         |
| Notifications → Analytics | 🔴 Sin integración construida en ningún lado verificado de esta serie.                                                                                          |

---

## 11. Integración

### 11.1 Purchasing, Sales, POS, Accounting, CRM — mismo mecanismo, reformulado en clave de eventos

Estos cinco ya se documentaron como integración de **datos** en §1.2 (FKs polimórficas
`source_module`/`source_entity_id`). En clave de **eventos**, la integración correcta no sustituye esa
capa — la complementa: la escritura sigue siendo síncrona y transaccional (`MovimientosService`
resuelve el movimiento dentro de su propia transacción, `docs/architecture/02 §3`), el evento se
publica **después**, solo para que otros dominios reaccionen sin acoplarse. Ningún dominio debería
depender de un evento para saber si su propia escritura fue exitosa — eso ya lo sabe por la respuesta
síncrona de la API.

| Dominio        | Integración de datos (síncrona, ya documentada)                 | Integración por eventos (asíncrona, propuesta)                                                                                                                                                  |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purchasing** | `goods_receipts.source_module='purchases'` (§1.2)               | Suscribiría `inventario.stock.recibido` para cerrar la orden de compra cuando la cantidad recibida coincide con la pedida.                                                                      |
| **Sales**      | `stock_reservations.source_module='sales'` (§1.2)               | Suscribiría `inventario.reserva.liberada` para reintentar una venta bloqueada por falta de disponibilidad (§9.3).                                                                               |
| **POS**        | Mismo canal que Sales (§1.2 — no es un dominio de datos propio) | Mismo evento que Sales — POS es un canal de `sales`, no un suscriptor distinto.                                                                                                                 |
| **Accounting** | Ninguna hoy (§1.2, brecha)                                      | Suscribiría `inventario.stock.recibido`/`inventario.ajuste.confirmado`/`inventario.produccion.consumido` para generar el asiento de valuación (§10.2).                                          |
| **CRM**        | Ninguna — límite más limpio del dominio (§1.2, §3.4)            | **No debería suscribir eventos de Inventory** — mismo criterio que la integración de datos: CRM conoce `products`, nunca `inventory`. Ningún evento de esta lista (§9.2) es relevante para CRM. |

### 11.2 API

El punto de integración externa ya real es `metadata JSONB` con índice `GIN` (§1.2, mismo mecanismo
que `products`) — sin migración de schema, cualquier integración externa puede anexar datos sin que
Inventory conozca su forma de antemano. El segundo punto de integración natural, código de barras de
ubicación para picking guiado por escáner externo, es una brecha real ya señalada (`ADR-INV-002 §4`
"Barcode support") — no existe hoy.

### 11.3 Webhooks

**Hallazgo real**: existe un mecanismo de webhooks genuino a nivel de schema —
`core.webhook_subscriptions` (`integration_id`, `event_code`, `target_url`) y
`core.webhook_delivery_logs` (`http_status`, `attempt_number`) — confirmado en
`core/database/prisma/schemas/core/schema.prisma`. `event_code` es texto libre, lo que significa que
los once eventos de §9.2 ya tendrían, sin cambio de schema, un identificador natural para suscribirse
externamente (`inventario.stock.recibido` como `event_code` de una suscripción). **Pero, confirmado
por búsqueda exhaustiva de código**: ninguna clase en todo el repositorio referencia
`webhook_subscriptions` — el mecanismo existe únicamente en el schema, sin ningún servicio que
resuelva "qué suscripciones externas están interesadas en este evento" ni que efectivamente haga el
`POST` HTTP hacia `target_url`. Sería, correctamente, un **consumidor más** del bus de eventos (§10):
una cola propia `core.webhook-dispatcher` bindeada a `#` (todos los routing keys) o a los patrones que
cada integración externa haya contratado, que resuelve `webhook_subscriptions` por `event_code` y
entrega vía HTTP, registrando el resultado en `webhook_delivery_logs`.

### 11.4 Background Jobs

**Hallazgo real, mismo patrón**: `core.background_jobs` es una cola de trabajos real a nivel de
schema — `job_key`, `queue_name` (`default: "normal"`), `payload JSONB`, `priority`, `status`,
`attempts`/`max_attempts`, `available_at` (para reintentos programados). Es un diseño de cola
**basada en base de datos** (polling sobre `available_at`/`status`), distinto en naturaleza del bus de
eventos de RabbitMQ (§10) — apropiado para trabajo que debe ejecutarse una vez, de forma confiable,
sin necesidad de un consumidor persistente escuchando (p. ej. recalcular `bi.kpi_snapshots` cada
noche, o reevaluar todas las `replenishment_rules` de un tenant en un batch programado en vez de
reaccionar evento por evento). **Confirmado, mismo hallazgo que Webhooks**: ningún worker o
procesador real consume `background_jobs` en ningún módulo del repositorio — la tabla existe, nada la
vacía. La relación correcta entre los dos mecanismos asíncronos de GORAZUS: el **bus de eventos**
(§10) es para "algo pasó, quien le interese que reaccione, en paralelo, sin coordinación"; los
**background jobs** son para "esta tarea específica debe ejecutarse, con reintentos y prioridad
explícita, aunque nadie esté escuchando en este momento" — `ReplenishmentService` (§8, propuesto)
encaja más naturalmente como un `background_job` periódico (evaluar todas las reglas cada N minutos)
que como un consumidor de eventos, ya que no reacciona a un evento puntual sino a una condición que
debe revisarse activamente.

---

Este documento, junto con `ADR-INV-001` y `ADR-INV-002`, completa la documentación de arquitectura del
Bounded Context de Inventario de GORAZUS ERP Enterprise. Ningún término de este glosario, agregado,
entidad, value object, servicio de dominio, evento o mecanismo de integración implica que la
funcionalidad correspondiente ya esté operando en producción — cada uno remite a la sección exacta de
`ADR-INV-001`/`ADR-INV-002` (o al archivo de código/schema real citado directamente) donde su estado
real, verificado, está documentado.
