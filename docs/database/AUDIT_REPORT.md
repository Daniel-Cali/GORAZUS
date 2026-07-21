# Audit Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 8 (2026-07-21). Auditoría,
> bitácora, soft delete y trazabilidad — entregable 3 de esta parte.

## 1. Columnas de auditoría — las 11 pedidas

| Columna pedida | ¿Universal en las 501 tablas?                    | Realidad verificada                                                                                                                                  |
| -------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `created_at`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `updated_at`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `deleted_at`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `created_by`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `updated_by`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `deleted_by`   | ✅ Sí                                            | Columna universal                                                                                                                                    |
| `version`      | ✅ Sí                                            | Columna universal (+ `row_version`, ambas ya existentes)                                                                                             |
| `revision`     | 🔗 Mismo concepto que `version`, nombre distinto | No se agrega una tercera columna — `version`/`row_version` ya cubren "número de revisión"                                                            |
| `ip_address`   | ❌ No universal, **correctamente**               | Solo en tablas de eventos de seguridad: `core.sessions`, `security.login_attempts`, `security.security_audit_logs`, `security.two_factor_challenges` |
| `device`       | 🔗 Modelado como entidad, no columna             | `core.user_devices` (tabla completa: `device_type`, `push_token`, `last_seen_at`) — más robusto que una columna string                               |
| `user_agent`   | ❌ No universal, **correctamente**               | `core.sessions`, `security.login_attempts`                                                                                                           |

**Aclaración de diseño (por qué `ip_address`/`user_agent` no son
universales, y por qué eso es correcto):** son atributos de un **evento
de sesión/seguridad** (login, sesión activa), no de una fila de negocio
cualquiera — agregarlos a las 501 tablas sería ruido sin valor (¿qué
significaría la IP desde la que se creó una línea de factura, aparte de
la IP desde la que se autenticó el usuario, ya capturada en `sessions`?).
Ya están donde corresponde.

## 2. Bitácora (entregable, sección "Bitácora")

| Evento pedido             | Registrado en                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Insert/Update/Delete      | `core.audit_logs` (trigger `fn_audit_log`, universal) + `core.change_history` (snapshot de cambios)        |
| Login/Logout              | `core.sessions` (creación/revocación), `security.login_attempts` (intentos, exitosos y fallidos)           |
| Errores                   | `core.system_logs`                                                                                         |
| Permisos (cambios)        | `core.audit_logs` captura cualquier `UPDATE`/`INSERT`/`DELETE` sobre `security.role_permissions`, incluido |
| Configuraciones (cambios) | Mismo mecanismo, sobre `core.system_settings`/`system_parameters`                                          |
| Cambios críticos          | `core.change_history` (snapshot antes/después, no solo el hecho de que cambió)                             |

**Los 9 eventos pedidos ya se registran.** Ninguno requiere tabla nueva.

## 3. Soft Delete (entregable, sección "Soft Delete")

| Chequeo                         | Resultado                                                                                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deleted_at` en tablas críticas | ✅ Universal, las 501                                                                                                                                                                                                                           |
| `deleted_by` en tablas críticas | ✅ Universal                                                                                                                                                                                                                                    |
| Motivo de eliminación           | 🟡 No hay columna dedicada `deletion_reason` — el campo genérico `observations` (columna universal) es el mecanismo disponible hoy, sin estructura propia                                                                                       |
| Restauración                    | 🔗 Mecánicamente trivial (`UPDATE ... SET is_deleted = false, deleted_at = NULL`), pero sin un procedimiento/Domain Service dedicado documentado todavía — la reversión queda registrada igual en `change_history` como cualquier otro `UPDATE` |

**1 gap menor real:** ausencia de un campo estructurado de "motivo de
eliminación" — hoy se puede registrar en `observations` (texto libre),
pero no hay un catálogo de motivos ni un campo dedicado. Impacto bajo,
complejidad baja si se decide agregar (ver
[FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md) para el formato de gap ya
establecido en esta auditoría — no se agrega aquí como gap #5 formal
porque es puramente de auditoría, no funcional de negocio, pero se dej
señalado).

## 4. Trazabilidad — los 11 procesos pedidos (entregable 3)

| Proceso                                         | Trazable de punta a punta                                                                                                                                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compras                                         | ✅ Requisición→Cotización→Orden→Recepción→Factura, cada paso con `created_by`/`created_at` propio y evento de dominio (`docs/ddd/13_integration_events.md`)                                                                                                          |
| Ventas                                          | ✅ Cotización→Pedido→Factura→Cobro, mismo patrón                                                                                                                                                                                                                     |
| Inventario                                      | ✅ Kardex (`stock_movements`, append-only, nunca editado) — la trazabilidad más fuerte del modelo por diseño                                                                                                                                                         |
| Caja                                            | ✅ `cash_movements` append-only + `cash_register_closings`                                                                                                                                                                                                           |
| Contabilidad                                    | ✅ `journal_entries` + `journal_entry_status_history`, período cerrado inmutable                                                                                                                                                                                     |
| Clientes                                        | ✅ `customer_credit_limit_history`, `customer_block_history`, `customer_statements`                                                                                                                                                                                  |
| Proveedores                                     | ✅ `supplier_credit_limit_history`, `supplier_block_history`, `supplier_history`                                                                                                                                                                                     |
| Productos                                       | ✅ `product_price_history` + `average_cost_history`/`fifo_cost_layers`                                                                                                                                                                                               |
| Pagos                                           | ✅ `receipt_allocations` (qué recibo pagó qué factura, y cuánto)                                                                                                                                                                                                     |
| Facturas                                        | ✅ `invoice_status_history`, inmutable tras emisión (Invariante I8)                                                                                                                                                                                                  |
| **NCF** (Comprobante Fiscal, numeración fiscal) | ✅ Vía `configuration.correlatives`/`fiscal_document_types` + el mecanismo de Facturación Electrónica ya diseñado (`48-erp-enterprise-readiness.md §5`) — NCF es un caso específico (República Dominicana) del mecanismo genérico ya construido, no una tabla propia |

**Los 11 procesos pedidos tienen trazabilidad completa verificada.**

## 5. Trazabilidad de este documento

Corrige/precisa una afirmación de `06-estrategia-seguridad.md`/
`00-modelo-general.md` sobre columnas de auditoría "completas" —
confirma que lo están para el set universal de 8 (created/updated/
deleted × at/by + version), y precisa que las 3 columnas adicionales
pedidas en esta Parte 8 (`ip_address`/`device`/`user_agent`) ya existen,
correctamente, solo en tablas de eventos de seguridad, no como columnas
universales — evitando la interpretación errónea de que serían un gap.

**Siguiente documento:** [MULTITENANT_REPORT.md](./MULTITENANT_REPORT.md).
