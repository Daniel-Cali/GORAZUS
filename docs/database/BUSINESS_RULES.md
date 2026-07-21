# Business Rules — GORAZUS (verificadas contra la simulación de Parte 6)

> "Database Enterprise v1.0" — Fase 1, Parte 6 (2026-07-21). Las reglas de
> negocio de GORAZUS **ya están documentadas en detalle** en
> [docs/ddd/16_domain_policies.md](../ddd/16_domain_policies.md) (12
> políticas globales) y
> [docs/ddd/17_invariants.md](../ddd/17_invariants.md) (21 invariantes) —
> este documento no las repite. Lista, en cambio, cuáles de esas reglas se
> ejercitaron concretamente durante la simulación de negocio de
> [BUSINESS_VALIDATION.md](./BUSINESS_VALIDATION.md), confirmando que el
> modelo las hace cumplir de verdad, no solo en la documentación.

## 1. Reglas de crédito y límite (Clientes)

| Regla                                                                                    | Ya documentada en                                                       | Verificada en la simulación       |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Un Cliente bloqueado no puede recibir un nuevo Pedido                                    | Specification `ClienteActivo`, `docs/ddd/11_specifications.md §1.1`     | ✅ §9 de `BUSINESS_VALIDATION.md` |
| Una Venta a crédito no puede exceder el límite disponible                                | Specification `CréditoDisponible`, `docs/ddd/11_specifications.md §1.2` | ✅ §7                             |
| El límite de crédito es un campo de `customer_credit_profiles`, no una regla hardcodeada | `01-modelo-conceptual.md`                                               | ✅                                |

## 2. Reglas de Caja

| Regla                                               | Ya documentada en                             | Verificada en la simulación |
| --------------------------------------------------- | --------------------------------------------- | --------------------------- |
| No se cierra una Caja con diferencia no justificada | Invariante I5, `docs/ddd/17_invariants.md §2` | ✅ §8                       |
| No se abre una Caja ya abierta                      | Invariante I6                                 | ✅ §8                       |
| Movimientos de Caja son append-only                 | Invariante I7                                 | ✅ §8                       |

## 3. Reglas de Contabilidad

| Regla                                             | Ya documentada en                                                                                                                                           | Verificada en la simulación |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Todo Asiento Contable balancea (Débito = Crédito) | Invariante I11 — reforzado además a nivel de base de datos por `fn_is_journal_entry_balanced`/`fn_prevent_unbalanced_posting` (`DATABASE_ANALYSIS.md §2.1`) | ✅ §8                       |
| No se modifican Movimientos de un Período cerrado | Invariante I12                                                                                                                                              | ✅ §8                       |

## 4. Reglas de Inventario

| Regla                                                                              | Ya documentada en                                      | Verificada en la simulación |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| No se vende stock negativo                                                         | Invariante I1, reforzado por `fn_apply_stock_movement` | ✅ §6                       |
| Reserva antes que compromiso físico                                                | Política P12, `docs/ddd/16_domain_policies.md §5`      | ✅ §6 (Reservas)            |
| Método de costeo fijo por Producto (no mezclar FIFO/Promedio en el mismo Producto) | Política P11                                           | ✅ §6                       |

## 5. Reglas de documentos fiscales

| Regla                                                                    | Ya documentada en          | Verificada en la simulación                     |
| ------------------------------------------------------------------------ | -------------------------- | ----------------------------------------------- |
| Una Factura emitida nunca se edita/elimina — solo Nota de Crédito/Débito | Política P6, Invariante I8 | ✅ §5, §7 (Compras y Ventas)                    |
| Numeración exclusiva por serie, sin saltos ni reutilización              | Política P5                | ✅ (Correlativos, `configuration.correlatives`) |

## 6. Regla nueva identificada en esta pasada (no en el catálogo original)

**Pago mixto/parcial sin romper la integridad de la Factura:** el Invariante
I9 (`docs/ddd/17_invariants.md`, "el total de cabecera siempre coincide con
la suma de sus líneas") se extiende naturalmente al patrón de cobro: la
suma de `receipt_allocations.amount_applied` para una Factura nunca puede
exceder su total — no estaba explícitamente enunciada como invariante
independiente antes de esta simulación. **Recomendación:** agregar como
Invariante I22 en una futura actualización de `docs/ddd/17_invariants.md`
(no aplicado en esta pasada, es un documento de la Fase 6 DDD, fuera del
alcance de esta auditoría de base de datos).

## 7. Trazabilidad

Ninguna regla de este documento es nueva como comportamiento — todas
provienen de `docs/ddd/16_domain_policies.md`/`17_invariants.md` ya
existentes, con una sola adición conceptual (§6) documentada como
recomendación, no aplicada.
