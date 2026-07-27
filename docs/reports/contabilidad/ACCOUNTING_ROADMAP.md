# Roadmap — Contabilidad Enterprise

Índice de las 20 secciones pedidas en el "PROMPT MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE",
qué cubre la Parte 1 y qué queda para partes siguientes.

## Parte 1 — Núcleo Contable + Estados Financieros (`v0.23.0`, completa)

| #   | Sección del pedido        | Estado                                                                    |
| --- | ------------------------- | ------------------------------------------------------------------------- |
| 1   | Plan de cuentas           | ✅ `PlanCuentasService`                                                   |
| 2   | Motor contable automático | ✅ `MotorContableService`, integrado con `ventas`                         |
| 3   | Asientos contables        | ✅ `AsientosService` (borrador/pendiente/contabilizado/anulado/revertido) |
| 4   | Libro Diario              | ✅ `AsientosService.listar()`                                             |
| 5   | Libro Mayor               | ✅ `AsientosService.libroMayor()`                                         |
| 6   | Balance General           | ✅ `EstadosFinancierosService.balanceGeneral()`                           |
| 7   | Estado de Resultados      | ✅ `EstadosFinancierosService.estadoResultados()`                         |
| 8   | Flujo de Efectivo         | 🟡 Versión aproximada (ver `ACCOUNTING_HEALTH_REPORT.md §3`)              |
| 16  | Centros de costo          | ✅ `CentrosCostoService` (sin subcentros/proyectos todavía)               |

## Partes siguientes (sin código todavía)

| #   | Sección                    | Nota                                                                                                                                       |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 9   | Cuentas por cobrar         | Parcialmente cubierta por `clientes` (`v_accounts_receivable_aging`) — abonos/vencimientos/intereses/bloqueo de crédito reales pendientes. |
| 10  | Cuentas por pagar          | Sin código — depende del módulo `proveedores`/`suppliers`, sin backend todavía.                                                            |
| 11  | Bancos                     | Schema `banks` existe, sin código de aplicación.                                                                                           |
| 12  | Conciliación bancaria      | Depende de Bancos. Importación CSV/Excel/OFX/QIF sin diseñar.                                                                              |
| 13  | Activos fijos              | Schema `assets` existe, sin código de aplicación.                                                                                          |
| 14  | Depreciaciones             | Depende de Activos Fijos.                                                                                                                  |
| 15  | Impuestos (motor completo) | Catálogo mínimo ya existe en `configuracion` (Fase 02) — motor de reglas/percepciones/retenciones real sin construir.                      |
| 17  | Presupuestos (ejecución)   | Tablas `budgets`/`budget_lines` existen, sin comparativos/desviaciones/ejecución real.                                                     |
| 18  | Cierre contable            | `fiscal_periods.status` existe pero no se usa — sin endpoint de cierre/reapertura/bloqueo/versionado.                                      |
| 19  | Auditoría completa         | Se apoya en `core.audit_log` genérico — sin bitácora dedicada por asiento con antes/después.                                               |
| 20  | Reportes exportables       | Sin PDF/Excel/CSV — mismo criterio que Facturación Parte 2 (sin librería de PDF en el proyecto todavía).                                   |

## Gaps reales del schema (no de alcance, de estructura) — ver `ACCOUNTING_HEALTH_REPORT.md §3`

- Sin soporte de multi-moneda en `journal_entries`/`journal_entry_lines`.
- `account_types.code` limitado a 5 valores por CHECK real — Costos/Otros Ingresos/Otros Gastos se
  resuelven con listas explícitas de cuentas, no con tipos dedicados.
- Sin flag `is_cash_account` en `chart_of_accounts` — Flujo de Efectivo requiere `cashAccountIds`
  explícito.
- Sin columna de clasificación Operación/Inversión/Financiamiento en ningún lado del schema.

## Integraciones automáticas pendientes (motor de reglas ya existe, falta configurar/disparar)

El motor (`MotorContableService.registrarEvento`) es genérico — cualquier módulo puede invocarlo
con su propio `eventCode`. Solo `ventas.factura.confirmada` está integrado (Parte 1). El pedido
original lista 17 fuentes más: Compras, Devoluciones, Pagos, Cobros, Transferencias, Notas de
Crédito/Débito, Ajustes, Producción, Nómina, Inventario, Activos, Depreciaciones, Impuestos,
Cierres, Aperturas, Reversiones — cada una requiere (a) que el módulo de origen exista con código
real, y (b) una llamada a `registrarEvento()` en su punto de confirmación, mismo patrón que
`VentasService.confirmarFactura()`.
