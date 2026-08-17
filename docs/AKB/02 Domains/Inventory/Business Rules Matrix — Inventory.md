---
id: business-rules-matrix-inventory
title: Business Rules Matrix — Inventory
version: 1.0.0
status: accepted
owner: ERP Domain Expert
domain: business-rules
subdomain: inventory-audit
created: 2026-07-27
updated: 2026-07-27
tags: [business-rules, audit, inventory]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Warehouse]]'
  - '[[Cost Engine]]'
  - '[[Product]]'
---

# Purpose

Matriz final de la Auditoría Enterprise de Reglas de Negocio del dominio de Inventario
(2026-07-27) — consolida cada regla documentada con su dueño, eventos, APIs, objetos de base de
datos y requisitos de seguridad, cruzada contra [[ADR-INV-000]] y `docs/ddd/16_domain_policies.md`.

# Domain Model

| Regla                                    | Aggregate dueño                                                              | Fuente                                                   | Eventos relacionados                              | API                                            | Objetos de BD                                    | Seguridad                                   | Estado                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------- | -------------------------------------------- |
| **BR-01** Disponible nunca negativo      | [[Stock]]                                                                    | `Stock.entity.ts` real; Invariante I1 (`ddd/17`)         | InventoryAdjusted, StockReceived                  | Implícito en escritura de stock                | `inventory.stock` (sin `CHECK` cruzado)          | RLS tenant+company real                     | 🟡 Enforced solo en dominio, no en BD        |
| **BR-02** Movimiento inmutable           | [[Movement Engine]]                                                          | `MovimientoStock.entity.ts`; Invariante I2               | Todos los de §9.2 de `ADR-INV-000`                | Sin `PATCH`/`DELETE` real                      | `inventory.stock_movements` (partición mensual)  | Auditoría universal real                    | ✅                                           |
| **BR-03** Transferencia origen≠destino   | Transfer                                                                     | `Transferencia.entity.ts`; Invariante I3                 | TransferenciaCompletada                           | `POST /inventario/transferencias` real         | `inventory.stock_transfers`                      | RLS + permiso `inventario.*`                | ✅                                           |
| **BR-04** Reserva siempre con dueño      | [[Reservation]]                                                              | `ReservaStock.entity.ts` real                            | ReservaCreada                                     | `POST /inventario/reservas` real               | `inventory.stock_reservations`                   | RLS + permiso                               | ✅                                           |
| **BR-05** Costeo fijo por producto       | [[Cost Engine]]                                                              | Domain Policy P11 (`ddd/16 §5`)                          | —                                                 | Sin endpoint (sin código, `ADR-INV-002 §14`)   | `fifo_cost_layers`, `average_cost_history`       | Auditoría universal                         | 🟡 Diseñado, sin código                      |
| **BR-06** Reserva antes de salida física | [[Reservation]] → [[Movement Engine]]                                        | Domain Policy P12 (`ddd/16 §5`)                          | ReservaLiberada → RecepcionConfirmada             | Sin endpoint (`goods_issues` sin código)       | Sin FK entre `stock_reservations`/`goods_issues` | —                                           | 🔴 Sin enforcement de BD cuando se construya |
| **BR-07** Código único por sucursal      | [[Warehouse]]                                                                | `Almacen.entity.ts` + SQL real                           | AlmacenCreado                                     | `POST /inventario/almacenes` real              | `uq_inventory_warehouses_code`                   | RLS company; **sin RLS de sucursal**        | 🟡 Ver brecha de seguridad                   |
| **BR-08** Lote XOR Serie                 | [[Product]]                                                                  | Invariante I4 (`ddd/17`) — **asertada, no implementada** | —                                                 | —                                              | `products.products` (sin `CHECK` cruzado)        | —                                           | 🔴 Documentada como protegida, no lo está    |
| **BR-09** Ajuste requiere motivo         | AjusteStock (sin Aggregate Root propio en `ADR-INV-000 §5.2` — brecha menor) | `AjusteStock.entity.ts` real                             | AjusteInventarioAplicado                          | `POST /inventario/ajustes` real                | `stock_adjustments`, `stock_adjustment_reasons`  | RLS + permiso; **sin Approval Engine (P8)** | 🟡 Ver Gap Analysis §8                       |
| **BR-10** Conteo reconcilia vía Ajuste   | Cycle Count                                                                  | `19-modulo-inventory.md §8`                              | ConteoFisicoCompletado → AjusteInventarioAplicado | `POST /inventario/conteos/{id}/completar` real | `physical_counts`, `physical_count_lines`        | RLS + permiso                               | ✅                                           |
| **BR-11** Min/Max stock                  | Replenishment (propuesto)                                                    | `ADR-INV-002 §6`                                         | ReposicionDisparada (propuesto)                   | Sin endpoint                                   | `inventory.replenishment_rules`                  | —                                           | 🔴 Sin código                                |
| **BR-12** Lead time por proveedor        | Fuera de Inventory ([[Product]])                                             | `products.product_suppliers.lead_time_days`              | —                                                 | —                                              | `products.product_suppliers`                     | —                                           | ✅ Real, cross-dominio                       |

# Business Rules

Ver tabla en Domain Model — cada fila es una regla verificada contra evidencia documental real,
nunca inventada. Fuente completa del proceso de auditoría: turno "GORAZUS ERP ENTERPRISE — BUSINESS
RULES ENTERPRISE AUDIT" (2026-07-27), 9 secciones completas en el chat de la sesión.

# Risks

- BR-01, BR-06, BR-08 no tienen enforcement a nivel de base de datos — dependen enteramente de la
  capa de aplicación, hoy parcialmente sin construir.
- BR-08 es una Invariante documentada como protegida (`ddd/17_invariants.md` I4) que **no lo está**
  en el código real (`producto.entity.ts`) — el riesgo mayor de toda la auditoría: documentación que
  afirma una garantía que no existe.
- Ninguna política RLS de sucursal/almacén — un usuario con permiso a nivel de empresa puede, en
  principio, operar sobre almacenes de cualquier sucursal de esa empresa.

# Future Improvements

- Agregar `CHECK` o enforcement de aplicación para BR-01 antes de permitir escritura real de
  `goods_issues`.
- Conectar BR-06 (P12) con una FK real `goods_issues.reservation_id` cuando se construya esa parte.
- Implementar el `CHECK`/validación real de BR-08 en `Producto`, o corregir `ddd/17_invariants.md`
  para dejar de afirmar que ya está protegida.
- Evaluar RLS de sucursal/almacén como extensión de `06-estrategia-seguridad.md §1`.
- Evaluar si confirmar un Ajuste de Inventario debería pasar por `Approval Engine` (P8).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]]

# References

`docs/ddd/16_domain_policies.md` · `docs/ddd/17_invariants.md` · `docs/database/06-estrategia-seguridad.md` · `docs/architecture/09-seguridad-y-multiempresa.md` · `docs/api/API.md`
