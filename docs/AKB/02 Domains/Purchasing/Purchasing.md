---
id: concept-purchasing
title: Purchasing
version: 2.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: bounded-context
created: 2026-07-27
updated: 2026-08-04
tags: [concept, purchasing, bounded-context]
related:
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
  - '[[Business Rules Matrix — Purchasing]]'
  - '[[Inventory]]'
---

# Purpose

Bounded Context de Compras — espejo de [[Sales]] del lado de abastecimiento
(`docs/database/logico/08-purchases.md`). Hasta el 2026-08-04 era solo schema sin código (`Purpose`
original: "sin ADR propio todavía"); desde esa fecha tiene el **roadmap funcional completo
implementado de forma provisional** (10 fases, aceptadas condicionalmente por el usuario, pendientes
de verificación e2e real — ver `Business Rules Matrix — Purchasing` Risks).

# Domain Model

[[Suppliers]] (schema propio `suppliers`, maestro único) → [[ADR-PUR-002]] Purchase Requisition
(solicitud interna, sin precio) → [[ADR-PUR-003]] Purchase Order (confirmada hacia un proveedor, con
precio) → [[ADR-PUR-004]] Goods Receipt (qué llegó físicamente) → [[ADR-PUR-005]] Purchase Invoice
(ingresa como CxP) → [[ADR-PUR-006]] Purchase Matching (3-way match OC↔Recepción↔Factura, resultado
calculado) → [[ADR-PUR-007]] Purchase Returns / [[ADR-PUR-008]] Purchase Credit Notes / [[ADR-PUR-009]]
Purchase Withholdings (los tres contra la factura, independientes entre sí) → [[ADR-PUR-010]] Imports
(expediente que agrupa una OC al exterior + gastos incrementales).

`purchase_quotes`/`purchase_quote_lines` (RFQ) y `purchase_expenses` (gasto no ligado a importación)
**siguen sin código** — nunca formaron parte de las 10 fases autorizadas, no son deuda técnica de este
roadmap (ver [[ADR-PUR-010]] Future Improvements). 24 de las 27 tablas del schema `purchases` tienen
código real; las 3 restantes son estas.

Relación con Inventario: `goods_receipt_notes` (documento de **compras**, este dominio) es distinto de
`inventory.goods_receipts` (movimiento físico, dueño Inventario) — mismo hecho, dos módulos dueños,
correlacionados por `inventory_receipt_id` (hoy sin usar, ver [[ADR-PUR-004]]).

# Architecture

Un solo módulo NestJS dueño (`modules/compras/backend`, `ComprasModule`) para las 9 partes de
`purchases` ya construidas, más `modules/proveedores/backend` (`ProveedoresModule`) para `suppliers` —
mismo criterio "un módulo dueño único por schema" que [[Sales]]/Productos. Cada aggregate reutiliza
lookups locales de solo lectura hacia otros schemas (`suppliers`, `products`, `core`) en vez de
importar entre módulos de negocio — fronteras de Nx (`@nx/enforce-module-boundaries`), verificado sin
excepciones en la auditoría de cierre (2026-08-04): cero escrituras cross-schema fuera del dueño de
cada tabla.

**Duplicación real encontrada en la auditoría de cierre** (no bloqueante, technical debt): el patrón
`resolverEstadoPorCodigo`/`obtenerCodigoEstado`/`transicionar` se repite en 4 servicios (Requisition,
Order, Invoice, Imports); el patrón `sumarCantidad*`/`sumarMonto*` se repite en 4 repositorios (Goods
Receipt, Returns, Credit Notes, Withholdings). Ver [[Issue Register]] ISSUE-28/ISSUE-29.

# Business Rules

Ver [[Business Rules Matrix — Purchasing]] — 27 reglas verificadas, cruzando cada una contra su
aggregate dueño, endpoint real y objeto de BD.

# Risks

- Sin flujo de estados en el schema real para Goods Receipt/Returns/Credit Notes/Withholdings (mismo
  patrón en los cuatro) — limitación heredada del schema, no elegida en esta serie de fases.
- `purchase_invoices` particionada por `received_at` deja `purchase_invoice_lines`/
  `purchase_invoice_status_history`/`purchase_returns.purchase_invoice_id`/
  `purchase_credit_notes.purchase_invoice_id`/`purchase_withholdings.purchase_invoice_id` sin FK real
  — integridad depende enteramente de la capa de aplicación en las cinco.
- Purchase Order no tiene `partially_received`/`received`/`closed` — Purchase Matching (ya construido)
  calcula la correlación bajo demanda (`sumarCantidadRecibida`), no la refleja en el `status_id` de la
  orden.
- Ninguno de los 10 e2e suites (9 de `compras` + 1 de `proveedores`) fue ejecutado contra Postgres real
  — Docker inactivo en todo el entorno donde se construyó el roadmap.
- Duplicación de código intra-módulo (ver Architecture, arriba) — deuda Media, no crítica.

# Future Improvements

Con el roadmap autorizado completo, los candidatos naturales siguientes son: `purchase_quotes`/
`purchase_quote_lines` (RFQ), `purchase_expenses` (gasto no ligado a importación), motor de tolerancia
configurable para Purchase Matching, extracción de la lógica duplicada de estado/acumulación a una
base compartida dentro de `compras`, y verificación e2e real contra Postgres (bloqueada por entorno,
no por diseño).

# Related ADRs

[[ADR-PUR-001]] · [[ADR-PUR-002]] · [[ADR-PUR-003]] · [[ADR-PUR-004]] · [[ADR-PUR-005]] ·
[[ADR-PUR-006]] · [[ADR-PUR-007]] · [[ADR-PUR-008]] · [[ADR-PUR-009]] · [[ADR-PUR-010]]

# References

`docs/database/logico/08-purchases.md` · `docs/database/logico/04-suppliers.md` · [[Inventory]]
