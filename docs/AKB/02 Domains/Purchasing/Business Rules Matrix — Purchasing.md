---
id: business-rules-matrix-purchasing
title: Business Rules Matrix — Purchasing
version: 2.0.0
status: accepted
owner: ERP Domain Expert
domain: business-rules
subdomain: purchasing-audit
created: 2026-08-04
updated: 2026-08-04
tags: [business-rules, audit, purchasing]
related:
  - '[[Purchasing]]'
  - '[[Suppliers]]'
  - '[[ADR-PUR-001]]'
  - '[[ADR-PUR-002]]'
  - '[[ADR-PUR-003]]'
  - '[[ADR-PUR-004]]'
  - '[[ADR-PUR-005]]'
  - '[[ADR-PUR-006]]'
  - '[[ADR-PUR-007]]'
  - '[[ADR-PUR-008]]'
  - '[[ADR-PUR-009]]'
  - '[[ADR-PUR-010]]'
---

# Purpose

Matriz de reglas de negocio del dominio de Compras, construida en la misma sesión de implementación
(2026-08-04, Fases 2-11 — roadmap completo: Suppliers, Purchase Requisition, Purchase Order, Goods
Receipt, Purchase Invoice, Purchase Matching, Purchase Returns, Purchase Credit Notes, Purchase
Withholdings, Imports) — cada fila verificada contra el código y el schema real, nunca inventada.
Mismo formato que [[Business Rules Matrix — Inventory]]. Actualizada al cierre del roadmap
(auditoría de Fase Final).

# Domain Model

| Regla                                                                                              | Aggregate dueño                                   | Fuente                                                        | API                                                                | Objetos de BD                                                                      | Seguridad                                | Estado                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **BR-P01** Razón social/tax id no vacíos                                                           | [[Suppliers]]                                     | `Proveedor.entity.ts`                                         | `POST /proveedores`                                                | `suppliers.suppliers`                                                              | RLS tenant+company                       | ✅                                                             |
| **BR-P02** No bloquear/desbloquear dos veces                                                       | [[Suppliers]]                                     | `ProveedoresService.bloquear/desbloquear`                     | `POST /proveedores/:id/bloquear\|desbloquear`                      | `supplier_block_history` (ledger)                                                  | RBAC `proveedores.gestionar_proveedores` | ✅                                                             |
| **BR-P03** Solicitud: mínimo 1 línea, cantidad > 0                                                 | [[ADR-PUR-002]]                                   | `SolicitudCompra.entity.ts`                                   | `POST /compras/solicitudes`                                        | `purchase_requisitions`/`_lines`                                                   | RBAC `compras.gestionar_solicitudes`     | ✅                                                             |
| **BR-P04** Solicitante = usuario autenticado                                                       | [[ADR-PUR-002]]                                   | `SolicitudesCompraService.crear`                              | Implícito (`context.userId`)                                       | `purchase_requisitions.requested_by_user_id`                                       | JWT ya verificado                        | ✅                                                             |
| **BR-P05** Transición de solicitud solo desde el estado correcto                                   | [[ADR-PUR-002]]                                   | `SolicitudesCompraService` (enviar/aprobar/rechazar/cancelar) | `POST /compras/solicitudes/:id/{enviar,aprobar,rechazar,cancelar}` | `purchase_requisition_status_history`                                              | RBAC                                     | ✅                                                             |
| **BR-P06** Proveedor no bloqueado para emitir OC                                                   | [[ADR-PUR-003]]                                   | `OrdenesCompraService.validarReferencias`                     | `POST /compras/ordenes` (409 `PROVEEDOR_BLOQUEADO`)                | `suppliers.suppliers.is_blocked`                                                   | RBAC `compras.gestionar_ordenes`         | ✅                                                             |
| **BR-P07** Orden: mínimo 1 línea, cantidad > 0, precio ≥ 0                                         | [[ADR-PUR-003]]                                   | `OrdenCompra.entity.ts`                                       | `POST /compras/ordenes`                                            | `purchase_orders`/`_lines`                                                         | —                                        | ✅                                                             |
| **BR-P08** No recibir contra orden inexistente/no aprobada                                         | [[ADR-PUR-004]]                                   | `RecepcionesCompraService.validarOrdenYLineas`                | `POST /compras/recepciones` (409)                                  | `purchase_orders.status_id`                                                        | RBAC `compras.gestionar_recepciones`     | ✅                                                             |
| **BR-P09** No recibir productos fuera de la orden                                                  | [[ADR-PUR-004]]                                   | `RecepcionesCompraService.validarOrdenYLineas`                | `POST /compras/recepciones` (400)                                  | `purchase_order_lines.product_id`                                                  | —                                        | ✅                                                             |
| **BR-P10** No exceder cantidad ordenada (acumulado)                                                | [[ADR-PUR-004]]                                   | `RecepcionCompraRepository.sumarCantidadRecibida`             | `POST /compras/recepciones` (409 `CANTIDAD_EXCEDE_ORDEN`)          | `goods_receipt_note_lines` (suma sobre recepciones activas)                        | —                                        | ✅                                                             |
| **BR-P11** Anular recepción libera la cantidad                                                     | [[ADR-PUR-004]]                                   | `RecepcionesCompraService.anular` (soft delete)               | `POST /compras/recepciones/:id/anular`                             | `goods_receipt_notes.deleted_at`                                                   | —                                        | ✅                                                             |
| **BR-P12** Factura: no rechaza por proveedor bloqueado                                             | [[ADR-PUR-005]]                                   | `FacturasCompraService.validarReferencias`                    | `POST /compras/facturas`                                           | `suppliers.suppliers.is_blocked` (ignorado a propósito)                            | RBAC `compras.gestionar_facturas`        | ✅ Decisión deliberada, ver [[ADR-PUR-005]]                    |
| **BR-P13** Sin duplicidad de referencia fiscal                                                     | [[ADR-PUR-005]]                                   | `FacturaCompraRepository.existeConReferencia`                 | `POST /compras/facturas` (409 `FACTURA_COMPRA_DUPLICADA`)          | `purchase_invoices` (sin constraint de BD — validado en service)                   | —                                        | 🟡 Enforced solo en aplicación                                 |
| **BR-P14** No modificar factura contabilizada (`posted`)                                           | [[ADR-PUR-005]]                                   | `FacturasCompraService.cancelar`                              | `POST /compras/facturas/:id/cancelar` (409 desde `posted`)         | `purchase_invoice_status`                                                          | —                                        | ✅                                                             |
| **BR-P15** Impuesto de factura en 0 (sin motor real)                                               | [[ADR-PUR-005]]                                   | `calcularTotales()`                                           | —                                                                  | `purchase_invoices.tax_amount`                                                     | —                                        | 🔴 Documentado como no implementado, no fingido                |
| **BR-P16** Recepción sin flujo de estados (limitación de schema)                                   | [[ADR-PUR-004]]                                   | Verificado en `schema.prisma`                                 | Sin endpoint "cambiar estado"                                      | `goods_receipt_notes` sin `status_id`                                              | —                                        | 🔴 Limitación real del schema, no del diseño                   |
| **BR-P17** Cotejo calcula discrepancia por producto (facturado vs. recibido×precio orden)          | [[ADR-PUR-006]]                                   | `CotejosCompraService.ejecutar`                               | `POST /compras/cotejos`                                            | `purchase_invoice_matching.discrepancy_amount`                                     | RBAC `compras.gestionar_cotejos`         | ✅                                                             |
| **BR-P18** Tolerancia de cotejo fija en 2%, sin configuración real                                 | [[ADR-PUR-006]]                                   | Constante `TOLERANCE_PERCENTAGE`                              | —                                                                  | `purchase_invoice_matching.is_within_tolerance`                                    | —                                        | 🔴 Placeholder documentado, no una regla de negocio confirmada |
| **BR-P19** No devolver contra factura inexistente/cancelada, ni productos fuera de la factura      | [[ADR-PUR-007]]                                   | `DevolucionesCompraService.validarFacturaYLineas`             | `POST /compras/devoluciones` (409/400)                             | `purchase_returns`/`_lines`                                                        | RBAC `compras.gestionar_devoluciones`    | ✅                                                             |
| **BR-P20** No exceder cantidad facturada devuelta (acumulado)                                      | [[ADR-PUR-007]]                                   | `DevolucionCompraRepository.sumarCantidadDevuelta`            | `POST /compras/devoluciones` (409 `CANTIDAD_EXCEDE_FACTURA`)       | `purchase_return_lines` (suma sobre devoluciones activas)                          | —                                        | ✅                                                             |
| **BR-P21** Nota de crédito: monto calculado server-side desde el costo de factura                  | [[ADR-PUR-008]]                                   | `NotasCreditoCompraService.validarFacturaYLineas`             | `POST /compras/notas-credito`                                      | `purchase_credit_notes.total_amount` (derivado, nunca del cliente)                 | RBAC `compras.gestionar_notas_credito`   | ✅                                                             |
| **BR-P22** No exceder cantidad facturada acreditada (acumulado)                                    | [[ADR-PUR-008]]                                   | `NotaCreditoCompraRepository.sumarCantidadAcreditada`         | `POST /compras/notas-credito` (409 `CANTIDAD_EXCEDE_FACTURA`)      | `purchase_credit_note_lines`                                                       | —                                        | ✅                                                             |
| **BR-P23** Retención no excede el total de la factura (acumulado)                                  | [[ADR-PUR-009]]                                   | `RetencionCompraRepository.sumarMontoRetenido`                | `POST /compras/retenciones` (409 `MONTO_EXCEDE_FACTURA`)           | `purchase_withholdings.amount`                                                     | RBAC `compras.gestionar_retenciones`     | ✅                                                             |
| **BR-P24** `withholdingRuleId` sin validar contra `taxes.withholding_rules`                        | [[ADR-PUR-009]]                                   | `RetencionesCompraService` (sin lookup)                       | `POST /compras/retenciones` (acepta cualquier UUID)                | `purchase_withholdings.withholding_rule_id`                                        | —                                        | 🔴 Integración fiscal completa fuera de alcance                |
| **BR-P25** Expediente de importación requiere OC existente y `approved`                            | [[ADR-PUR-010]]                                   | `ImportacionesService.crear`                                  | `POST /compras/importaciones` (409 si no `approved`)               | `imports.purchase_order_id`/`purchase_orders.status_id`                            | RBAC `compras.gestionar_importaciones`   | ✅                                                             |
| **BR-P26** `import_status` sin columna `is_final` (limitación de schema)                           | [[ADR-PUR-010]]                                   | Verificado en `schema.prisma`                                 | —                                                                  | `import_status`                                                                    | —                                        | 🔴 Limitación real del schema, único catálogo de Compras así   |
| **BR-P27** Returns/Credit Notes/Withholdings sin flujo de estados (mismo patrón que Goods Receipt) | [[ADR-PUR-007]], [[ADR-PUR-008]], [[ADR-PUR-009]] | Verificado en `schema.prisma` antes de diseñar cada uno       | Sin endpoint "cambiar estado" en ninguno de los tres               | `purchase_returns`/`purchase_credit_notes`/`purchase_withholdings` sin `status_id` | —                                        | 🔴 Limitación real del schema, no del diseño                   |

# Business Rules

Ver tabla en Domain Model — cada fila verificada contra el código real escrito en esta sesión
(`modules/proveedores/backend/`, `modules/compras/backend/`) y los tests que la cubren.

# Risks

- BR-P13 depende enteramente de la capa de aplicación — una escritura directa a Postgres (fuera de la
  API) podría crear una factura duplicada sin que nada lo impida.
- BR-P15/BR-P16/BR-P24/BR-P26/BR-P27 son limitaciones reales documentadas, no elecciones de diseño —
  quedarán así hasta que exista una fase de Impuestos/Contabilidad real o una migración que agregue
  estado a los aggregates que no lo tienen.
- BR-P18 (tolerancia de cotejo fija) es un placeholder — sin perfil de tolerancia configurable no
  puede ajustarse por empresa/proveedor.
- Duplicación de código real, no cubierta por ninguna fila de esta matriz: el patrón
  `resolverEstadoPorCodigo`/`obtenerCodigoEstado`/`transicionar` se repite en 4 servicios
  (Requisition/Order/Invoice/Imports) y el patrón `sumarCantidad*`/`sumarMonto*` en 4 repositorios
  (Goods Receipt/Returns/Credit Notes/Withholdings) — ver [[Issue Register]] ISSUE-28/ISSUE-29
  (hallazgos de la auditoría de cierre, 2026-08-04).
- Ninguna de las 27 reglas tiene verificación e2e ejecutada contra Postgres real (Docker inactivo en
  el entorno donde se construyeron) — solo unitarias (163 tests en verde entre `proveedores-backend`
  y `compras-backend`, ver auditoría de cierre).

# Future Improvements

- Evaluar `CHECK`/índice único parcial para BR-P13 si la duplicidad de referencia fiscal resulta
  crítica en producción.
- Migración de estado para Goods Receipt/Returns/Credit Notes/Withholdings (BR-P16/BR-P27) si aparece
  necesidad real de flujo de aprobación en alguno de los cuatro.
- Motor de impuestos real (BR-P15) y validación de `withholding_rule_id` (BR-P24) cuando se aborde una
  fase de Impuestos/Contabilidad de Compras.
- Perfil de tolerancia configurable para Purchase Matching (BR-P18).
- Extraer la lógica duplicada de flujo de estados y de acumulación de cantidad/monto a una base
  compartida dentro de `modules/compras/backend` (ver ISSUE-28/ISSUE-29).

# Related ADRs

[[ADR-PUR-001]] · [[ADR-PUR-002]] · [[ADR-PUR-003]] · [[ADR-PUR-004]] · [[ADR-PUR-005]] ·
[[ADR-PUR-006]] · [[ADR-PUR-007]] · [[ADR-PUR-008]] · [[ADR-PUR-009]] · [[ADR-PUR-010]]

# References

`modules/proveedores/backend/` · `modules/compras/backend/` · [[Purchasing]] ·
[[Business Rules Matrix — Inventory]]
