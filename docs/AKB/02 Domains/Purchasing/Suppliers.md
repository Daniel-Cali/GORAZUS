---
id: concept-suppliers
title: Suppliers
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: supplier-master
created: 2026-08-04
updated: 2026-08-04
tags: [concept, suppliers, aggregate-root]
related:
  - '[[ADR-PUR-001]]'
  - '[[Purchasing]]'
  - '[[ADR-PUR-003]]'
---

# Purpose

Responde "¿a quién le compramos?" — maestro único de proveedores, schema propio (`suppliers`, no
`purchases`). `purchases`/`banks` lo referencian por ID, nunca lo duplican
(`docs/database/logico/04-suppliers.md`). Detalle completo en [[ADR-PUR-001]].

# Domain Model

Aggregate Root `Proveedor` — implementado: identidad (`legal_name`/`tax_id`), plazo de pago
(`payment_terms_days`), y estado de bloqueo (`is_blocked`/`block_reason`, con
`supplier_block_history` como ledger append-only). El schema real tiene 13 tablas — contactos,
direcciones, cuentas bancarias, crédito, evaluaciones, clasificación y contratos **siguen sin código**
(satélites, alcance de una parte siguiente).

# Business Rules

`is_blocked` es la única señal que otro aggregate de Compras consume hoy — [[ADR-PUR-003]] (Purchase
Order) rechaza emitir una orden a un proveedor bloqueado. Bloquear/desbloquear un proveedor ya
bloqueado/desbloqueado se rechaza (transición inválida), y cada acción se registra en
`supplier_block_history` con motivo opcional.

# Integration

Consumido por Purchase Order ([[ADR-PUR-003]], obligatorio) y Purchase Invoice ([[ADR-PUR-005]],
obligatorio, sin bloquear por `is_blocked` — se puede seguir registrando la deuda de un proveedor ya
bloqueado). Purchase Requisition ([[ADR-PUR-002]]) no lo consume — la solicitud interna no elige
proveedor todavía, eso lo decide la Orden de Compra.

# Related ADRs

[[ADR-PUR-001]]

# References

`docs/database/logico/04-suppliers.md` · [[ADR-PUR-001]]
