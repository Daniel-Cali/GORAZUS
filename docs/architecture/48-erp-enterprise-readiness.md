# 48 — ERP Enterprise Readiness (Fase 5 — capstone final)

> 2026-07-21. Fase 5, final, de la secuencia de trabajo del usuario
> (Arquitecto Principal), continuando desde
> [47-modulo-ia.md](./47-modulo-ia.md). **No elimina nada existente, no
> simplifica.** Objetivo del pedido: que GORAZUS sea comparable con
> SAP S/4HANA, Business One, Oracle NetSuite, Dynamics 365, Infor
> CloudSuite, Epicor, IFS Cloud. Este documento es el **capstone** —
> el índice/checklist/matriz definitivo de las 4 fases anteriores más
> el diseño de los **11 gaps genuinamente nuevos** que el pedido de
> ~50 capacidades reveló. Solo documentación.

## 0. Nota de gobernanza — MRP/MRP II/APS

`38-modulo-production.md §7` dejó Routing/Centro de Trabajo/MRP/Control
de Calidad **explícitamente fuera** por falta de necesidad de negocio
confirmada — mismo patrón que Fase 27 (IA) antes de la Fase 4. El
pedido actual de esta Fase 5 es esa confirmación. Se documenta acá,
igual que en `47-modulo-ia.md §0`, para que el cambio de alcance quede
trazable y no parezca una reversión silenciosa — ver §6.

## 1. Matriz de Módulos — estado definitivo (29 módulos de negocio)

| Módulo                       | Backend                                     | Frontend       | Diseño (arquitectura)                                                                                                                     |
| ---------------------------- | ------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`                       | ✅ Real                                     | ✅ Real        | [13-modulo-auth.md](./13-modulo-auth.md)                                                                                                  |
| `seguridad`                  | ✅ Real                                     | ✅ Real        | [15-modulo-security.md](./15-modulo-security.md)                                                                                          |
| `configuracion`              | ✅ Real (Fase 02 sesión)                    | ❌             | [14-modulo-core.md](./14-modulo-core.md)                                                                                                  |
| `ia` (nuevo)                 | ❌ Solo diseño                              | ❌             | [47-modulo-ia.md](./47-modulo-ia.md)                                                                                                      |
| `ventas`                     | ❌ Solo diseño                              | 🟡 Placeholder | [20-modulo-sales.md](./20-modulo-sales.md)                                                                                                |
| `pos`                        | ❌ Solo diseño                              | 🟡 Placeholder | [45-modulo-pos-frontend.md](./45-modulo-pos-frontend.md)                                                                                  |
| `compras`                    | ❌ Solo diseño                              | 🟡 Placeholder | [21-modulo-purchases.md](./21-modulo-purchases.md)                                                                                        |
| `inventario`                 | ❌ Solo diseño                              | 🟡 Placeholder | [19-modulo-inventory.md](./19-modulo-inventory.md) — incluye WMS base, ver §8                                                             |
| `productos`                  | ❌ Solo diseño                              | 🟡 Placeholder | [18-modulo-products.md](./18-modulo-products.md) — incluye BOM base, ver §6                                                               |
| `clientes`                   | ❌ Solo diseño                              | 🟡 Placeholder | [16-modulo-customers.md](./16-modulo-customers.md)                                                                                        |
| `proveedores`                | ❌ Solo diseño                              | 🟡 Placeholder | [17-modulo-suppliers.md](./17-modulo-suppliers.md)                                                                                        |
| `caja`                       | ❌ Solo diseño                              | 🟡 Placeholder | [23-modulo-cash.md](./23-modulo-cash.md)                                                                                                  |
| `bancos`                     | ❌ Solo diseño                              | 🟡 Placeholder | [24-modulo-banking.md](./24-modulo-banking.md)                                                                                            |
| `contabilidad`               | ❌ Solo diseño                              | 🟡 Placeholder | [22-modulo-accounting.md](./22-modulo-accounting.md) — NIIF ya diseñado, consolidación nueva §4                                           |
| `impuestos`                  | 🔗 Parcial (Fase 02 sesión, alcance mínimo) | ❌             | [46-modulo-taxes.md](./46-modulo-taxes.md) + facturación electrónica nueva §5                                                             |
| `crm`                        | ❌ Solo diseño                              | 🟡 Placeholder | [27-modulo-crm.md](./27-modulo-crm.md) — CRM Enterprise, ver §11                                                                          |
| `rrhh`                       | ❌ Solo diseño                              | 🟡 Placeholder | [25-modulo-hr.md](./25-modulo-hr.md)                                                                                                      |
| `nomina`                     | ❌ Solo diseño                              | 🟡 Placeholder | [26-modulo-payroll.md](./26-modulo-payroll.md)                                                                                            |
| `produccion`                 | ❌ Solo diseño                              | 🟡 Placeholder | [38-modulo-production.md](./38-modulo-production.md) + MRP/MRP II/APS nuevo §6                                                            |
| `servicios`                  | ❌ Solo diseño                              | 🟡 Placeholder | [39-modulo-services.md](./39-modulo-services.md)                                                                                          |
| `activos-fijos`              | ❌ Solo diseño                              | 🟡 Placeholder | [37-modulo-assets.md](./37-modulo-assets.md)                                                                                              |
| `proyectos`                  | ❌ Solo diseño                              | 🟡 Placeholder | [40-modulo-projects.md](./40-modulo-projects.md)                                                                                          |
| `reportes`                   | ❌ Solo diseño                              | 🟡 Placeholder | [28-modulo-reports-bi.md](./28-modulo-reports-bi.md)                                                                                      |
| `bi`                         | ❌ Solo diseño                              | 🟡 Placeholder | Ídem + [41-modulo-bi.md](./41-modulo-bi.md) + [database/12-arquitectura-data-warehouse.md](../database/12-arquitectura-data-warehouse.md) |
| `dashboard`                  | N/A (composición pura)                      | 🟡 Placeholder | [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md)                                                                        |
| `documentos`                 | ❌ Solo diseño                              | 🟡 Placeholder | [32-core-platform/14 §2](./32-core-platform/14-motores-enterprise-avanzados.md#2-document-management-system) — DMS = base de ECM, ver §10 |
| `administracion`             | ❌ Solo diseño                              | 🟡 Placeholder | [32-core-platform/14 §5](./32-core-platform/14-motores-enterprise-avanzados.md#5-integration-engine)                                      |
| `tesoreria`                  | N/A (sin schema propio)                     | 🟡 Placeholder | [04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md#tesoreria-vs-caja--bancos-por-qué-son-módulos-distintos)                |
| **`logistica`** (nuevo, TMS) | ❌ Solo diseño                              | ❌             | **§9, nuevo**                                                                                                                             |

**2 de 29 con backend real** (`auth`, `seguridad`), **1 parcial**
(`configuracion`) — sin cambios respecto al estado ya documentado en
`ROADMAP.md` raíz; esta fase es de **diseño**, no de implementación
(pedido explícito: "no escribir código").

## 2. Checklist Enterprise Readiness — las ~50 capacidades pedidas

| Capacidad                                          | Estado                                                                                                                           | Dónde                                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multiempresa, Multisucursal, Multialmacén          | ✅ Ya existe                                                                                                                     | [32-core-platform/02](./32-core-platform/02-multiempresa-y-alcance-organizacional.md)                                                                   |
| Multipaís, Multiidioma, Multimoneda                | ✅ Ya existe                                                                                                                     | [32-core-platform/03](./32-core-platform/03-localizacion-y-globalizacion.md)                                                                            |
| **Holding, Corporativos, Filiales**                | 🆕 Nuevo                                                                                                                         | §3                                                                                                                                                      |
| **Facturación electrónica por país**               | 🆕 Nuevo                                                                                                                         | §5                                                                                                                                                      |
| **Consolidación financiera**                       | 🔗 Extiende (`accounting.consolidated_financial_snapshots` ya existe, sin flujo)                                                 | §4                                                                                                                                                      |
| **MRP, MRP II, APS**                               | 🔗 Extiende (BOM/`production_orders` ya existen)                                                                                 | §6                                                                                                                                                      |
| **WMS**                                            | 🔗 Sustancialmente ya existe (`picking_rules`/`putaway_rules`/`replenishment_rules`/lotes/series/conteos cíclicos) — gap acotado | §7                                                                                                                                                      |
| **TMS**                                            | 🆕 Nuevo                                                                                                                         | §8                                                                                                                                                      |
| CRM (base)                                         | ✅ Ya existe                                                                                                                     | [27-modulo-crm.md](./27-modulo-crm.md)                                                                                                                  |
| **CRM Enterprise** (territorios, cuotas)           | 🔗 Extiende                                                                                                                      | §9                                                                                                                                                      |
| SCM                                                | ✅ Ya existe (Compras+Inventario+Proveedores)                                                                                    | §10                                                                                                                                                     |
| **PLM**                                            | 🆕 Nuevo                                                                                                                         | §11                                                                                                                                                     |
| **ECM**                                            | 🔗 Extiende (Document Management System, Fase 2)                                                                                 | §12                                                                                                                                                     |
| BPM                                                | ✅ Ya existe (Fase 2, esta sesión)                                                                                               | [32-core-platform/14 §1](./32-core-platform/14-motores-enterprise-avanzados.md#1-bpm-engine)                                                            |
| ESB                                                | 🔗 Mapea a Integration Engine + Event Bus, ya existentes                                                                         | §13                                                                                                                                                     |
| API Gateway                                        | ✅ Decisión ya tomada (KISS, diferido)                                                                                           | §13.1                                                                                                                                                   |
| Event Bus, RabbitMQ, Redis                         | ✅ Ya existe                                                                                                                     | [32-core-platform/06](./32-core-platform/06-eventos-y-mensajeria.md), [08 §1](./32-core-platform/08-frameworks-de-infraestructura.md#1-cache-framework) |
| **Kafka**                                          | ✅ Decisión ya tomada — no adoptado                                                                                              | §13.2                                                                                                                                                   |
| Alta Disponibilidad, Replicación, DR, Backups      | ✅ Ya existe                                                                                                                     | [database/08-10](../database/08-estrategia-respaldo.md), [32-core-platform/11](./32-core-platform/11-resiliencia-y-continuidad.md)                      |
| **Sharding**                                       | 🆕 Nuevo (decisión)                                                                                                              | §14                                                                                                                                                     |
| Observabilidad, OpenTelemetry, Prometheus, Grafana | ✅ Ya existe                                                                                                                     | `core/observability`, `infra/prometheus`, `infra/grafana` (CHANGELOG FASE 05)                                                                           |
| RBAC, RLS                                          | ✅ Ya existe y auditado                                                                                                          | [11-estrategia-integridad.md §6](../database/11-estrategia-integridad.md#6-integridad-transaccional--multiempresa--rls-como-mecanismo-de-integridad)    |
| ACL                                                | ✅ Ya existe                                                                                                                     | [15-modulo-security.md §4](./15-modulo-security.md#4-acl--administración-nuevo-la-precedencia-ya-está-en-13-8)                                          |
| ABAC                                               | 🔗 Propuesta ya escrita, pendiente de ADR — no se fuerza acá                                                                     | [15-modulo-security.md §6](./15-modulo-security.md#6-abac-attribute-based-access-control--diseño-nuevo-candidato-pendiente-de-adr)                      |
| **Zero Trust**                                     | 🆕 Nuevo (síntesis)                                                                                                              | §15                                                                                                                                                     |
| **Compliance: ISO 27001, SOC 2, PCI DSS**          | 🆕 Nuevo                                                                                                                         | §16                                                                                                                                                     |
| NIIF                                               | ✅ Ya existe                                                                                                                     | [22-modulo-accounting.md §8](./22-modulo-accounting.md#8-niif-ifrs_adjustments)                                                                         |

**Resultado: 15 de 26 filas ya existían (58%), 11 son genuinamente
nuevas** — el resto de este documento diseña exactamente esas 11.

## 3. Holding, Corporativos, Filiales

**Trazabilidad:** 🆕 — `core.companies` es hoy una lista plana, sin
relación de jerarquía entre empresas del mismo grupo económico
(verificado: no existe `parent_company_id` ni tabla de agrupación).

- **Objetivo:** modelar que varias `companies` (cada una ya
  multiempresa/multisucursal por diseño) pertenecen al mismo grupo
  corporativo (holding), con una empresa matriz y N filiales, sin
  romper el aislamiento de tenant ya existente — un holding **no** es
  un tenant nuevo, es una relación **entre** companies del mismo
  tenant (una holding centraliza varias empresas legales bajo un mismo
  grupo, pero típicamente todas dentro de la misma instalación/tenant
  de GORAZUS).
- **Tablas:** `core.corporate_groups` (`name`, `parent_company_id` —
  la matriz —, `consolidation_currency_code` — moneda funcional del
  grupo para consolidar, puede diferir de la de cada filial); tabla de
  membresía `core.corporate_group_members` (`corporate_group_id`,
  `company_id`, `ownership_percentage` — relevante para interés
  minoritario en consolidación, §4 —, `joined_at`).
- **Relaciones:** `corporate_groups.parent_company_id → companies`
  (FK real, mismo schema `core`); `corporate_group_members.company_id
→ companies` (FK real); una `company` pertenece a **como máximo un**
  `corporate_group` a la vez (regla de negocio, no de schema —
  evita jerarquías ambiguas de "¿a qué grupo consolida esta filial?").
- **Flujo:** alta de un `corporate_group` con su matriz → alta de
  filiales como miembros con su `ownership_percentage` → cualquier
  reporte o proceso que necesite "vista de grupo" (Consolidación
  Financiera §4, Reportes/BI) resuelve las `companies` del grupo por
  esta relación en vez de una lista manual repetida en cada consulta.
- **Permisos:** administrar la estructura de grupo requiere permiso a
  nivel `configuracion` de alcance de **tenant completo** (no de una
  sola empresa) — mismo criterio de gobernanza ya usado para
  Integraciones/Reglas de negocio (acciones que afectan a más de una
  empresa nunca las autoriza un rol operativo de una sola filial).
- **Auditoría:** alta/baja de un miembro del grupo es evento de
  dominio (`corporate-group.member-added/removed`), auditado igual
  que cualquier otro cambio administrativo.
- **Seguridad:** pertenecer al mismo `corporate_group` **no** otorga
  automáticamente acceso a los datos de otra filial — RLS sigue
  aislando por `company_id`/`branch_id` dentro del tenant sin
  excepción; ver una vista consolidada de grupo requiere un permiso
  explícito adicional (`configuracion.ver_consolidado_grupo`), nunca
  implícito por pertenecer al mismo grupo.

## 4. Consolidación Financiera

**Trazabilidad:** 🔗 Extiende diseño existente —
`accounting.consolidated_financial_snapshots`
(`consolidation_label`, `snapshot_data JSONB`) ya existe, sin flujo
documentado (mismo patrón que Forecast antes de la Fase 4).

- **Objetivo:** producir un estado financiero único para un
  `corporate_group` (§3) a partir de los estados individuales de cada
  filial, aplicando los 3 ajustes contables reales que la
  consolidación exige: eliminación de transacciones intercompañía,
  traducción de moneda de filiales con moneda funcional distinta a la
  de consolidación, e interés minoritario cuando `ownership_percentage
< 100`.
- **Tablas:** ninguna nueva más allá de la ya existente. Se agrega
  **conceptualmente** al `snapshot_data JSONB` (sin comprometer forma
  de columna, mismo criterio ya aplicado a `cash_flow_snapshots` en
  `22-modulo-accounting.md §7`) tres secciones: `individual_statements`
  (uno por filial, antes de ajustar), `elimination_entries` (partidas
  intercompañía anuladas — ver Relaciones), `consolidated_totals`
  (el resultado final).
- **Relaciones:** las transacciones intercompañía a eliminar se
  identifican vía `sales.invoices`/`purchases.purchase_invoices` donde
  el cliente/proveedor de una filial **es** otra filial del mismo
  grupo (`customers.customers`/`suppliers.suppliers` con un
  `linked_company_id` opcional — **gap real, no modelado hoy**: no hay
  forma de marcar "este cliente es en realidad la filial X del mismo
  grupo" — se documenta como prerrequisito de datos para automatizar
  la eliminación, sin proponer la columna acá).
- **Flujo:** al cierre de período de cada filial (`balance_sheet_snapshots`/
  `cash_flow_snapshots` ya existentes, uno por `company_id`) →
  `Forecast Engine`... no, **motor de Consolidación** (nuevo, análogo
  en patrón a `Forecast Engine` de la Fase 4: un `Background Jobs` que
  lee los snapshots individuales de todas las filiales de un
  `corporate_group`, resta eliminaciones intercompañía, convierte
  moneda vía `Currency Manager`
  ([32-core-platform/03 §4](./32-core-platform/03-localizacion-y-globalizacion.md#4-currency-manager),
  ya existente) al tipo de cambio de cierre, y calcula interés
  minoritario según `ownership_percentage` → escribe
  `consolidated_financial_snapshots`.
- **Auditoría:** cada consolidación es trazable a los snapshots
  individuales que la originaron (mismo principio de reproducibilidad
  ya aplicado en el módulo IA, Fase 4).
- **Seguridad:** mismo permiso de alcance de grupo que §3.

## 5. Facturación Electrónica por País

**Trazabilidad:** 🆕 — confirmado ausente en toda la documentación;
coincide con el punto ya señalado como pendiente en
[42-integraciones-plan-fase-8.md](./42-integraciones-plan-fase-8.md)
("DGII/SUNAT/SAT... documentados como pendientes de confirmación de
negocio, sin diseño especulativo").

- **Objetivo:** emitir comprobantes fiscales electrónicos válidos ante
  la autoridad tributaria de cada país donde opera un tenant (DGII
  República Dominicana, SUNAT Perú, SAT México/Guatemala, y otros según
  expansión), sin que `ventas`/`compras` conozcan el formato específico
  de cada autoridad.
- **Arquitectura:** **no es un motor nuevo** — es una aplicación
  directa de `Integration Engine`
  ([32-core-platform/14 §5](./32-core-platform/14-motores-enterprise-avanzados.md#5-integration-engine),
  Fase 2) con `edi_transactions.document_type` mapeado a cada formato
  fiscal (p. ej. `'dgii-e-cf'`, `'sunat-cpe'`, `'sat-cfdi'`) — cada país
  es un `core.integrations` con su propio `integration_type='e-invoicing'`
  y credenciales cifradas vía el mecanismo ya existente.
- **Tablas:** ninguna nueva — reutiliza `core.integrations`/
  `integration_credentials`/`edi_transactions` (Fase 2) +
  `taxes.taxes`/`tax_jurisdictions`
  ([modules/configuracion/backend](../../modules/configuracion/backend),
  Fase 02 de la sesión de backend) para resolver qué régimen fiscal
  aplica.
- **Flujo — saliente (emisión):** `sales.invoices` confirmada dispara
  un evento de dominio → `Integration Engine` (§ ya diseñado) arma el
  documento en el formato del país de la sucursal emisora (XML CFDI,
  JSON DGII, etc. — el formato exacto es decisión de implementación
  por país, no de arquitectura) → lo envía a la autoridad fiscal →
  registra la respuesta (folio/CAE/timbre fiscal según el país) en
  `edi_transactions` → si la autoridad rechaza, el evento
  `integration.failed` (ya diseñado en Fase 2) notifica al emisor
  antes de que la factura salga a un cliente sin validez fiscal.
- **Flujo — contingencia:** si la autoridad fiscal está caída (todas
  tienen ventanas de indisponibilidad reales), la factura se emite
  localmente con estado `'pending-fiscal-authorization'` y un job de
  `Scheduler` reintenta hasta obtener la autorización — nunca bloquea
  la operación comercial por una caída externa, mismo principio ya
  aplicado a reintentos de `Notification Center`/webhooks.
- **Seguridad:** certificados digitales de firma fiscal (obligatorios
  en la mayoría de estos esquemas) se guardan cifrados vía
  `integration_credentials`, nunca en texto plano ni en `Storage
Framework` sin cifrar.
- **Auditoría:** cada documento fiscal emitido/rechazado es
  inmutable en `edi_transactions` — el mismo registro que ya sirve de
  bitácora legal ante una auditoría fiscal externa.

## 6. MRP, MRP II, APS

**Trazabilidad:** 🔗 Extiende diseño existente —
`products.bill_of_materials`/`bom_components` (BOM de un nivel, pero
**recursivo por construcción**: un `component_product_id` puede a su
vez tener su propio `bill_of_materials`, habilitando explosión
multinivel sin tabla nueva) e `inventory.production_orders`/
`production_order_components`/`production_order_outputs` (ejecución)
ya existen — lo que falta es la capa de **planificación**.

### 6.1 MRP (Material Requirements Planning)

- **Objetivo:** calcular, para un horizonte de tiempo, qué materiales
  hacen falta comprar o producir, explotando el BOM multinivel contra
  demanda proyectada (pedidos de venta confirmados + `Demand
Prediction` de IA, Fase 4, ya diseñado) y neteando contra inventario
  disponible + órdenes ya en curso.
- **Tablas:** `inventory.mrp_runs` (`run_date`, `horizon_days`,
  `status`); `inventory.planned_orders` (`mrp_run_id`, `product_id`,
  `planned_type`: `'purchase' | 'production'`, `suggested_quantity`,
  `suggested_date`, `status`: `'suggested' | 'firmed' | 'cancelled'`).
  **`planned_orders` nunca es una orden real** — es una sugerencia,
  mismo principio rector de "nunca escritura directa" ya aplicado en
  IA (Fase 4): firmarla (`'firmed'`) es lo que dispara la creación
  real de una `purchases.purchase_orders` o `inventory.production_orders`,
  vía acción humana o `Approval Engine` si el monto lo amerita.
- **Relaciones:** `planned_orders.product_id → products.products` (FK
  real, mismo schema de negocio); resolución de BOM vía
  `bill_of_materials`/`bom_components` ya existentes, recorridas
  recursivamente por el motor (sin cambio de schema).
- **Flujo:** corrida de MRP (`Scheduler`, semanal/diaria según
  configuración) → para cada producto con demanda proyectada, explota
  su BOM completo (todos los niveles) → calcula requerimiento bruto
  por nivel y período → neta contra `inventory.stock`+`stock_reservations`
  ya existentes + `planned_orders`/`production_orders`/
  `purchases.purchase_orders` ya en curso → genera `planned_orders`
  nuevas para el déficit, respetando lead time de cada producto/
  proveedor (`products.product_suppliers`, ya existente).
- **Auditoría/Seguridad:** cada corrida de MRP es trazable
  (`mrp_runs`); firmar una `planned_order` como orden real requiere el
  mismo permiso que crear esa orden manualmente — el MRP nunca eleva
  privilegios.

### 6.2 MRP II (Manufacturing Resource Planning) — agrega capacidad

**Gap real no resuelto por 6.1 solo:** MRP asume capacidad infinita
(cuándo se necesita el material, no si hay máquina/operario disponible
para producirlo a tiempo). MRP II agrega esa dimensión.

- **Tablas adicionales:** `inventory.work_centers` (`name`,
  `capacity_per_day` — horas o unidades, según el tipo de producto —,
  `branch_id`); `inventory.routing_operations` (`bom_id` — a qué BOM
  aplica esta secuencia de operaciones —, `work_center_id`,
  `sequence_number`, `standard_time_minutes`).
- **Relaciones:** `routing_operations.bom_id → bill_of_materials` (FK
  real); `.work_center_id → work_centers` (FK real).
- **Flujo:** el mismo `mrp_runs` de §6.1, al firmar una `planned_order`
  de tipo `'production'`, ahora también verifica capacidad disponible
  en los `work_centers` de la ruta (`routing_operations`) para las
  fechas sugeridas — si no alcanza, ajusta la fecha sugerida hacia
  atrás (capacidad finita) en vez de asumirla siempre disponible.

### 6.3 APS (Advanced Planning & Scheduling)

- **Objetivo:** optimizar la secuencia de órdenes de producción sobre
  los `work_centers` (§6.2) cuando hay más demanda que capacidad —
  problema de programación de operaciones (scheduling), no solo de
  planificación de materiales.
- **Alcance de este documento:** **no se diseña el algoritmo de
  optimización en sí** (programación lineal, heurísticas de
  scheduling — decisión de implementación, potencialmente candidato
  real de `Prediction Engine`/optimización del módulo IA, Fase 4, en
  una fase de implementación futura) — se documenta el **punto de
  extensión**: `production_order_status_history` (ya existente) más
  `routing_operations.sequence_number` (§6.2) ya dan la estructura de
  datos necesaria para que un motor de scheduling la consuma; no
  diseñar el algoritmo especulativamente es el mismo criterio de
  gobernanza aplicado a Forecast/ML en la Fase 4 (§4 de ese
  documento) — la estructura de datos está lista, el algoritmo se
  define cuando haya necesidad de negocio concreta sobre qué
  optimizar (throughput, fecha de entrega, costo de setup).

## 7. WMS — gap acotado sobre lo ya existente

**Trazabilidad:** 📎 Referencia con extensión puntual — `inventory` ya
tiene `picking_rules`, `putaway_rules`, `replenishment_rules`,
`cycle_count_schedules`/`physical_counts`, `inventory_lots`/`serials`,
`goods_receipts`/`goods_issues`, `stock_reservations`,
`stock_transfer_lines` — un WMS funcional de nivel medio ya está
modelado, no se rediseña.

**Gap real identificado:** ninguna tabla resuelve **wave planning**
(agrupar múltiples pedidos de venta en una ola de picking conjunta
para optimizar recorrido) ni **slotting** (qué ubicación física
conviene asignar a qué producto según rotación) — ambos son
optimizaciones de nivel operativo-avanzado, no requisitos de un WMS
base. Se documentan como extensión candidata de una fase de
implementación futura (mismo criterio que APS, §6.3) — no se diseña
tabla nueva especulativamente para un caso de uso sin volumen real
todavía que lo justifique (un tenant con 2 pedidos por hora no necesita
wave planning).

## 8. TMS (Transportation Management System)

**Trazabilidad:** 🆕 — no existe ningún módulo de logística/transporte
en el catálogo de 29 módulos (§1). Nuevo módulo `logistica`, schema
`logistics` propuesto (sin DDL).

- **Objetivo:** planificar y rastrear el transporte de mercancía
  (entregas a cliente desde `ventas`, recepciones desde `compras`)
  — ruteo, asignación de transportista/vehículo, y estado de entrega
  — sin que `ventas`/`compras` conozcan detalle logístico.
- **Tablas:** `logistics.carriers` (`name`, `carrier_type`:
  `'own_fleet' | 'third_party'`); `logistics.vehicles` (`carrier_id`,
  `plate_number`, `capacity_kg`/`capacity_volume`); `logistics.shipments`
  (`source_module` + `source_entity_id` — ID suelto hacia
  `sales.invoices`/`purchases.purchase_orders` —, `carrier_id`,
  `vehicle_id` nullable, `origin_branch_id`, `destination_address`,
  `status`: `'planned' | 'in_transit' | 'delivered' | 'failed'`);
  `logistics.shipment_events` (`shipment_id`, `event_type`:
  `'dispatched' | 'in_transit' | 'delivered' | 'exception'`,
  `occurred_at`, `location` nullable).
- **Relaciones:** `shipments.carrier_id → carriers` (FK real);
  `.vehicle_id → vehicles` (FK real); `.source_entity_id` → ID suelto
  (mismo patrón universal, sin FK cruzada hacia `sales`/`purchases`).
- **Flujo:** una venta confirmada con entrega dispara la creación de
  un `shipments` (`'planned'`) → asignación de transportista/vehículo
  (manual o vía `AI Agent`/`Recommendation Engine`, Fase 4, como
  optimización futura, no obligatoria) → cada evento real de tránsito
  (dispatch, entrega, excepción) registra un `shipment_events` →
  `status` se deriva del último evento → al llegar a `'delivered'`,
  publica `logistics.shipment.delivered`, consumido por `ventas` (para
  marcar la entrega cumplida) y `Notification Center` (aviso al
  cliente).
- **Permisos:** gestionar transportistas/vehículos requiere permiso de
  `logistica`; cualquier usuario con visibilidad sobre la venta/compra
  de origen puede consultar el estado de su envío (heredado, sin ACL
  nueva).
- **Auditoría:** `shipment_events` es en sí mismo el registro de
  auditoría de cadena de custodia del envío.
- **Escalabilidad:** `shipment_events` es candidata de particionamiento
  por fecha si el volumen crece al ritmo de `fact_sales` (mismo
  criterio de la Fase 3) — no se activa preventivamente.

## 9. CRM Enterprise

**Trazabilidad:** 🔗 Extiende diseño existente — `27-modulo-crm.md`
(✅ completo) ya cubre leads/oportunidades/pipeline/actividades. Lo que
"Enterprise" agrega, verificado ausente: **territorios de venta** y
**cuotas por vendedor/período**.

- **Tablas:** `crm.sales_territories` (`name`, `criteria JSONB` — p. ej.
  zona geográfica o segmento de cliente que define el territorio);
  `crm.sales_quotas` (`user_id` — el vendedor —, `territory_id`
  nullable, `period_start`/`period_end`, `target_amount`).
- **Relaciones:** `sales_quotas.user_id → core.users` (FK universal
  hacia `core`, mismo patrón que toda tabla de negocio);
  `.territory_id → sales_territories` (FK real, mismo schema `crm`).
- **Flujo:** una oportunidad se asigna automáticamente a un territorio
  según `criteria` (evaluado vía `Business Rules Engine`, Fase 2, ya
  existente — no un motor de reglas nuevo) → el avance de cuota de un
  vendedor se calcula agregando sus oportunidades ganadas del período
  contra `target_amount` — candidato directo de un `bi.kpis` (Fase 3,
  ya existente) con `target_value = sales_quotas.target_amount`, sin
  mecanismo de KPI nuevo.
- **Seguridad:** un vendedor ve su propia cuota; un gerente ve las de
  su equipo — mismo mecanismo de alcance ya usado en el resto del
  sistema (`Policy Engine`, Fase 2), sin ACL nueva.

## 10. SCM — sin gap, solo síntesis

**Trazabilidad:** 📎 Referencia pura, sin extensión. SCM (Supply Chain
Management) en el vocabulario de este pedido **es** la combinación ya
existente de `compras` + `inventario` (incluido WMS, §7) +
`proveedores` + ahora `logistica` (§8) — no es un módulo con tablas
propias en ningún ERP de referencia tampoco (SAP/Oracle lo tratan
igual, como una capa de proceso end-to-end sobre módulos ya
existentes, no una tabla). No se diseña nada nuevo acá — se deja
constancia de que el pedido está cubierto por síntesis, no por
omisión.

## 11. PLM (Product Lifecycle Management)

**Trazabilidad:** 🆕 — `products.products`/`bill_of_materials` ya
existen (Fase de diseño del catálogo), pero no hay control de
**versión de ingeniería** ni **orden de cambio** (ECO — Engineering
Change Order), los dos conceptos centrales de PLM que un catálogo de
producto simple no cubre.

- **Objetivo:** versionar formalmente un producto/BOM a través de su
  ciclo de vida de ingeniería (diseño → prototipo → producción →
  descontinuado), con control de qué cambió, por qué, y quién lo
  aprobó — sin el cual un BOM "simplemente cambia" sin rastro de por
  qué la versión anterior dejó de fabricarse.
- **Tablas:** `products.engineering_change_orders` (`product_id`,
  `eco_number`, `reason`, `status`: `'draft' | 'pending_approval' |
'approved' | 'implemented' | 'rejected'`, `effective_date`);
  `products.bom_versions` (`bom_id`, `version_number`, `eco_id`
  nullable — nulo para la versión inicial, poblado para cada revisión
  —, `effective_from`, `effective_to` nullable — mismo patrón SCD
  Tipo 2 ya usado en `warehouse.dim_product`, Fase 3, aplicado acá al
  BOM mismo).
- **Relaciones:** `bom_versions.bom_id → bill_of_materials` (FK real);
  `.eco_id → engineering_change_orders` (FK real);
  `engineering_change_orders.product_id → products` (FK real).
- **Flujo:** un cambio de ingeniería se propone (`'draft'`) → pasa por
  `Approval Engine` (Fase 2, ya existente — un ECO **es** un caso de
  aprobación como cualquier otro, no un mecanismo aparte) →
  aprobado y con `effective_date` alcanzada, se activa la nueva
  `bom_versions` (cierra la vigencia de la anterior, nunca la borra —
  mismo principio de "el pasado no se reescribe" ya aplicado en todo
  el sistema) → `inventory.production_orders` nuevas usan la versión
  vigente a su fecha, las ya en curso siguen con la versión con la que
  arrancaron (trazabilidad real de "con qué BOM se fabricó este lote").
- **Auditoría:** el propio `engineering_change_orders` + su paso por
  `Approval Engine` es el registro completo — quién propuso, quién
  aprobó, cuándo se activó.
- **Seguridad:** proponer un ECO requiere permiso de `productos`;
  aprobarlo requiere el permiso de aprobación que `Approval Engine` ya
  resuelve vía matriz configurable (Fase 2, sin mecanismo nuevo).

## 12. ECM (Enterprise Content Management)

**Trazabilidad:** 🔗 Extiende diseño existente — es
`Document Management System`
([32-core-platform/14 §2](./32-core-platform/14-motores-enterprise-avanzados.md#2-document-management-system),
Fase 2) con dos capacidades que un ECM formal agrega sobre una DMS
base: **gestión de registros** (records management — un documento con
valor legal/regulatorio que no puede editarse ni borrarse hasta
cumplir su retención, más allá del soft-delete estándar) y
**flujos de contenido** (un documento que pasa por revisión antes de
publicarse). Ambos ya tienen la base necesaria:

- **Records management:** `core.document_types.retention_period_months`
  (ya existente, Fase 2) + el `legal_hold` identificado como gap real
  en `14-motores-enterprise-avanzados.md §2` — la extensión de ECM
  **es** cerrar ese mismo gap ya documentado, no uno nuevo.
- **Flujos de contenido:** `Workflow Engine` (Fase 2, ya existente)
  aplicado a `core.documents` — un documento en estado `'draft'` que
  requiere revisión antes de `'published'` es un caso de uso directo
  de `State Machine` + `Workflow Engine`, sin motor de flujo de
  contenido aparte.

No se diseña tabla nueva en esta sección — ECM es 100% composición de
lo ya diseñado en Fase 2, con el gap de `legal_hold` ya identificado
como el único pendiente real.

## 13. ESB, API Gateway, Kafka — decisiones de arquitectura, no gaps

### 13.1 ESB

**Trazabilidad:** 📎 Referencia pura. Un ESB (Enterprise Service Bus)
es, funcionalmente, la combinación de `Event Bus` + `Integration Engine`
ya diseñados (Fase 2) — enrutamiento de mensajes entre sistemas,
transformación de formato, mediación de protocolo. GORAZUS no necesita
un componente adicional llamado "ESB": ya tiene sus dos mitades
(mensajería interna vía RabbitMQ/`Event Bus`, integración externa vía
`Integration Engine`) sin la complejidad operativa de una pieza de
infraestructura ESB dedicada (Mulesoft/Biztalk-style) que un monolito
modular con 21-22 schemas no necesita todavía.

### 13.2 API Gateway

**Ya es una decisión tomada, no un gap** —
[00-arquitectura-general.md §10](./00-arquitectura-general.md#10-gaps-identificados-candidatos-a-adr-no-decisiones-tomadas):
Nginx/Ingress es suficiente mientras GORAZUS sea monolito modular.
**Refinamiento agregado en esta fase** (el documento original dejaba
"sin número concreto" el umbral): se propone, sin comprometer una
cifra final sin ADR, el criterio cualitativo de activación — cuando
existan **3 o más servicios extraídos** con necesidad de políticas
cruzadas (rate limiting por cliente API, autenticación centralizada
multi-servicio, versionado de contrato independiente) que Nginx no
resuelve bien por sí solo. Sigue siendo candidato de ADR formal, no se
decide el número exacto acá — se acota el criterio cualitativo.

### 13.3 Kafka

**Decisión ya tomada implícitamente (RabbitMQ adoptado, Fase 1 del
Core Platform), formalizada explícitamente acá por primera vez:**
GORAZUS **no adopta Kafka**. RabbitMQ ya cubre el 100% de los casos de
uso reales del sistema (domain events, colas de trabajo, notificaciones)
con colas cuórum de alta disponibilidad ya diseñadas
([31-infraestructura-completa.md](./31-infraestructura-completa.md)).
Kafka aporta valor diferencial en streaming de altísimo volumen con
reproceso de log completo (event sourcing a escala, analítica de
streaming en tiempo real) — ninguno de los cuales es un requisito
confirmado de GORAZUS hoy (el Data Warehouse, Fase 3, es batch/
incremental, no streaming). Mismo criterio de "no adoptado, con
razones" ya aplicado a GraphQL en
[30-api-completa.md](./30-api-completa.md). Reevaluar solo si aparece
un caso de uso real de streaming de alto volumen que RabbitMQ no pueda
sostener — no antes.

## 14. Sharding

**Trazabilidad:** 🆕 — sin mención previa en ningún documento.

- **Decisión:** **GORAZUS no sharda horizontalmente por ahora** — la
  estrategia de escala ya diseñada (particionamiento por rango de
  fecha vía `pg_partman`,
  [07-estrategia-particionamiento.md](../database/07-estrategia-particionamiento.md),
  más réplicas de lectura,
  [09-estrategia-replicacion.md](../database/09-estrategia-replicacion.md))
  ya sostiene el objetivo declarado de "100M+ registros" del propio
  principio rector del proyecto
  ([database/README.md](../database/README.md#principio-rector-de-todo-el-diseño))
  **dentro de una sola instancia Postgres**. Sharding (dividir los
  datos entre múltiples instancias de base de datos, por tenant o por
  rango) resuelve un problema distinto — volumen que excede lo que
  **una** instancia (aunque sea grande, con répicas) puede sostener —
  que no es el problema actual de GORAZUS.
- **Punto de extensión ya existente, sin cambio necesario:**
  `tenant_id` como columna universal en las 501 tablas (en vez de
  schema-por-tenant o base-por-tenant) es precisamente lo que
  **habilita** sharding por tenant el día que haga falta — una
  instancia Postgres adicional puede alojar un subconjunto de tenants
  sin cambiar una sola tabla, solo el enrutamiento de conexión (qué
  instancia atiende qué `tenant_id`) — decisión de infraestructura
  operativa, no de schema.
- **Criterio de activación (documentado, no implementado):**
  reevaluar cuando el volumen total supere lo que una instancia
  Postgres con la topología ya diseñada
  ([10-estrategia-alta-disponibilidad.md](../database/10-estrategia-alta-disponibilidad.md))
  sostenga con el SLA de latencia acordado — mismo criterio de "no
  agregar complejidad sin necesidad real" ya aplicado a Kafka (§13.3)
  y al motor de scheduling de APS (§6.3).

## 15. Zero Trust — síntesis de controles ya existentes

**Trazabilidad:** 🆕 (como síntesis nombrada) sobre controles que, en
su mayoría, **ya existen dispersos**. Zero Trust no es una pieza de
infraestructura nueva — es un principio ("nunca confiar, siempre
verificar", sin perímetro de confianza implícito) que se cumple o no
según cómo se combinan controles ya diseñados.

| Principio Zero Trust                                         | Control real en GORAZUS                                                                                    | Estado                                                                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verificar identidad en cada request, nunca confiar en la red | JWT en cada request, sin sesión de servidor implícita                                                      | ✅ Ya existe (`modules/auth`)                                                                                                                                       |
| Menor privilegio por defecto                                 | RBAC + ACL + Policy Engine, deny-by-default (`NoopPermissionsResolver` deniega todo sin permiso explícito) | ✅ Ya existe ([32-core-platform/05 §3](./32-core-platform/05-motores-de-logica-de-negocio.md#3-policy-engine))                                                      |
| Micro-segmentación de datos                                  | RLS `FORCE` por tenant en el 100% de tablas habilitadas, verificado en vivo                                | ✅ Ya existe ([11-estrategia-integridad.md §6](../database/11-estrategia-integridad.md#6-integridad-transaccional--multiempresa--rls-como-mecanismo-de-integridad)) |
| Cifrado en tránsito                                          | HTTPS/TLS 1.2-1.3 (nginx), sin excepción                                                                   | ✅ Ya existe (CHANGELOG FASE 05)                                                                                                                                    |
| Cifrado en reposo (secretos/credenciales)                    | AES-256-GCM para credenciales de integración/2FA                                                           | ✅ Ya existe (Fase 2 de esta sesión)                                                                                                                                |
| Verificación continua de sesión, no solo al login            | Refresh token con rotación, revocación de sesión real                                                      | ✅ Ya existe (Fase 02 de la sesión de backend)                                                                                                                      |
| Dispositivos/contexto como señal de confianza                | `security.trusted_devices` (tabla ya existe) sin flujo de verificación de dispositivo documentado          | 🔗 Gap acotado, no se diseña acá (candidato ABAC, ya pendiente de ADR, §2 checklist)                                                                                |
| Auditoría exhaustiva de cada acceso                          | `core.audit_logs` + `security.login_attempts`/`session_activity_logs`, ya particionados                    | ✅ Ya existe                                                                                                                                                        |

**Conclusión:** GORAZUS ya cumple 6 de 8 principios Zero Trust por
diseño (no por casualidad — RLS+RBAC+JWT sin sesión de servidor son
exactamente los mecanismos que un modelo Zero Trust exige). El único
gap real es verificación de confianza de dispositivo, ya identificado
como parte del ABAC pendiente de ADR — no un componente nuevo
separado.

## 16. Compliance — ISO 27001, SOC 2, PCI DSS

**Trazabilidad:** 🆕 — sin mapeo previo. **Alcance de este documento:**
matriz de controles **ya existentes** contra cada framework — no se
diseña un programa de certificación completo (auditoría externa,
políticas organizacionales no técnicas) — eso excede lo que un
documento de arquitectura de software puede resolver.

| Dominio de control                | ISO 27001 (Anexo A) | SOC 2 (Trust Services Criteria) | PCI DSS                                               | Control real en GORAZUS                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------- | ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Control de acceso                 | A.9                 | Security (Logical Access)       | Req. 7-8                                              | RBAC/ACL/RLS, ya existentes                                                                                                                                                                                                                                                                                                                                                                                                               |
| Criptografía                      | A.10                | Security (Confidentiality)      | Req. 3-4                                              | AES-256-GCM + TLS, ya existentes                                                                                                                                                                                                                                                                                                                                                                                                          |
| Registro y monitoreo              | A.12.4              | Security (Monitoring)           | Req. 10                                               | `Audit Framework` + Prometheus/Grafana/Loki, ya existentes                                                                                                                                                                                                                                                                                                                                                                                |
| Gestión de incidentes             | A.16                | Availability                    | Req. 12                                               | 🔗 Gap — sin runbook de respuesta a incidentes documentado (candidato de fase operativa, no de arquitectura)                                                                                                                                                                                                                                                                                                                              |
| Continuidad de negocio            | A.17                | Availability                    | Req. —                                                | Backup/Restore/DR, ya existentes                                                                                                                                                                                                                                                                                                                                                                                                          |
| Gestión de cambios                | A.12.1              | Processing Integrity            | Req. 6                                                | Conventional Commits + CI/CD + code review obligatorio, ya existentes ([standards/CODE_REVIEW.md](../standards/CODE_REVIEW.md))                                                                                                                                                                                                                                                                                                           |
| Datos de tarjeta (específico PCI) | —                   | —                               | Req. 3 (nunca almacenar CVV; PAN truncado/tokenizado) | 🔗 Gap — GORAZUS no procesa pagos con tarjeta directamente hoy (sin pasarela de pago integrada, `Stripe/PayPal` listados como integraciones pendientes en `42-integraciones-plan-fase-8.md`) — **PCI DSS no aplica todavía en alcance real**, se documenta la postura correcta (nunca tokenizar/almacenar datos de tarjeta propios, delegar 100% a la pasarela cuando se integre) en vez de diseñar un control para un caso que no existe |
| Segregación de funciones          | A.6.1               | Processing Integrity            | Req. 6-7                                              | RBAC con roles de fábrica no eliminables/renombrables, ya existente ([15-modulo-security.md](./15-modulo-security.md))                                                                                                                                                                                                                                                                                                                    |

**Conclusión:** GORAZUS cumple la mayoría de controles técnicos de
ISO 27001/SOC 2 por diseño ya existente. El gap real más concreto es
un **runbook de respuesta a incidentes** formal (documento operativo,
no de arquitectura de software — candidato de
`docs/manuals/`, fuera del alcance de este documento). PCI DSS
correctamente no aplica todavía porque GORAZUS no toca datos de
tarjeta — postura documentada explícitamente en vez de sobre-diseñar
un control para un riesgo inexistente.

## 17. Escalabilidad consolidada

Sin mecanismo nuevo — resumen de lo ya diseñado en las 5 fases:
particionamiento (`pg_partman`, OLTP y `warehouse.fact_*`), réplicas de
lectura, cache distribuido (Redis), colas escalables horizontalmente
(`Background Jobs`), Kubernetes con HPA, y la decisión explícita de
diferir sharding (§14) hasta que el volumen real lo exija. Ningún
punto de esta fase agrega una dimensión de escalabilidad no cubierta
ya por alguno de esos mecanismos.

## 18. Buenas prácticas

Sin cambio — `docs/standards/` (13 documentos, EPIC 04) sigue siendo
la fuente única de convenciones de código/nomenclatura/testing/
seguridad de aplicación. Este documento no repite ni reemplaza ese set.

## 19. Roadmap final

| Orden | Qué sigue                                                                                                                                                         | Por qué en ese orden                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Implementación de código de los módulos ya diseñados (`ventas`, `inventario`, etc. — 0 de 27 con backend real hoy, sin contar `auth`/`seguridad`/`configuracion`) | El diseño de las 5 fases de este usuario está completo; el ERP no es usable sin código real                                                    |
| 2     | ADR de ABAC (§2) y del umbral exacto de API Gateway (§13.2)                                                                                                       | Únicos 2 puntos de este documento que requieren una decisión formal antes de implementarse, no más diseño                                      |
| 3     | Runbook de incidentes (§16)                                                                                                                                       | Gap operativo real, corto de escribir, alto valor de compliance                                                                                |
| 4     | Implementación de los 11 gaps de esta fase (§3-16), en el orden en que cada uno tenga demanda de negocio real                                                     | Mismo criterio de "alcance real, no simetría" de todo el proyecto — no se implementa TMS antes que Ventas solo porque este documento lo diseñó |

## 20. Trazabilidad

| Punto pedido en la Fase 5                                                                                                            | Cerrado en                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Las ~50 capacidades pedidas                                                                                                          | §2 (checklist completo)                                                                            |
| Holding/Corporativos/Filiales                                                                                                        | §3                                                                                                 |
| Multipaís/Multiidioma/Multimoneda                                                                                                    | §2 (ya existían)                                                                                   |
| Facturación electrónica por país                                                                                                     | §5                                                                                                 |
| Consolidación financiera                                                                                                             | §4                                                                                                 |
| MRP, MRP II, APS                                                                                                                     | §6                                                                                                 |
| WMS, TMS                                                                                                                             | §7, §8                                                                                             |
| CRM Enterprise, SCM, PLM, ECM                                                                                                        | §9, §10, §11, §12                                                                                  |
| BPM, ESB, API Gateway, Event Bus, Kafka, RabbitMQ, Redis                                                                             | §2 (ya existían) + §13                                                                             |
| Alta Disponibilidad, Replicación, Sharding, DR, Backups                                                                              | §2 (ya existían) + §14                                                                             |
| Observabilidad, OpenTelemetry, Prometheus, Grafana                                                                                   | §2 (ya existían)                                                                                   |
| Seguridad Enterprise: RBAC, ABAC, ACL, RLS, Zero Trust                                                                               | §2 (ya existían, salvo síntesis) + §15                                                             |
| Compliance: ISO 27001, SOC2, PCI DSS, NIIF                                                                                           | §16 (NIIF ya existía)                                                                              |
| Arquitectura, Modelo de datos, Infraestructura, Dependencias, Escalabilidad, Buenas prácticas, Roadmap, Checklist, Matriz de módulos | §1, §2, §17-19, más las 4 fases previas de esta sesión                                             |
| No eliminar nada existente, no simplificar                                                                                           | 0 documentos existentes reescritos — solo referenciados o extendidos con nuevas secciones acotadas |
| No SQL, no código                                                                                                                    | Confirmado — todas las tablas de §3-16 descritas conceptualmente, sin DDL                          |
