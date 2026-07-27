# Arquitectura — Contabilidad Enterprise, Parte 1 (Núcleo + Estados Financieros)

## 1. Alcance de esta parte

Pedido original: "PROMPT MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE PARA GORAZUS ERP", 20
secciones (plan de cuentas, motor contable automático, asientos, libro diario/mayor, balance
general, estado de resultados, flujo de efectivo, CxC, CxP, bancos, conciliación bancaria, activos
fijos, depreciaciones, impuestos, centros de costo, presupuestos, cierre contable, auditoría,
reportes) — un alcance real de varias semanas, no de una entrega. Antes de escribir código se
acordó con el usuario el orden de partes (`AskUserQuestion`); esta Parte 1 cubre **Núcleo contable

- Estados financieros**: plan de cuentas, motor de reglas, asientos, Libro Diario, Libro Mayor,
  Balance General, Estado de Resultados y Flujo de Efectivo.

## 2. Reality-check antes de programar

`modules/contabilidad/backend` existía con la estructura de carpetas vacía (mismo patrón que
Almacenes antes de `v0.6.0` o CRM antes de `v0.12.0`), pero el schema `accounting` de Prisma **ya
tenía 28 tablas reales y bien diseñadas** desde la certificación original de base de datos —
`chart_of_accounts`, `journal_entries`/`journal_entry_lines`/`journal_entry_status`,
`accounting_rules`/`accounting_rule_lines`, `cost_centers`/`profit_centers`,
`fiscal_years`/`fiscal_periods`, `account_reconciliations`, `balance_sheet_snapshots`/
`income_statement_snapshots`/`cash_flow_snapshots`, etc. Esta parte construye código de aplicación
sobre 17 de esas 28 tablas — no se diseñó ni se agregó ninguna tabla nueva (solo una columna, ver
§7).

## 3. Piezas construidas

| Pieza                  | Tablas reales                                                    | Servicio                                          |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Plan de cuentas        | `chart_of_accounts`, `account_types`                             | `PlanCuentasService`                              |
| Centros de costo       | `cost_centers`                                                   | `CentrosCostoService`                             |
| Años/períodos fiscales | `fiscal_years`, `fiscal_periods`                                 | `PeriodosFiscalesService`                         |
| Motor de reglas        | `accounting_rules`, `accounting_rule_lines`                      | `ReglasContablesService` + `MotorContableService` |
| Asientos               | `journal_entries`, `journal_entry_lines`, `journal_entry_status` | `AsientosService`                                 |
| Libro Diario           | `journal_entries` (listado con filtros)                          | `AsientosService.listar()`                        |
| Libro Mayor            | `journal_entry_lines` por cuenta/rango                           | `AsientosService.libroMayor()`                    |
| Estados financieros    | agregación de `journal_entry_lines`                              | `EstadosFinancierosService`                       |

## 4. Por qué no CQRS / Value Objects / Factories

Mismo criterio ya confirmado en Roles Enterprise (`v0.20.0`) y Facturación Enterprise (`v0.22.0`):
el patrón real del proyecto es Clean Architecture por módulo (entidad + repositorio + servicio +
controlador + validadores Zod), sin CQRS ni Value Objects. `Asiento`/`CuentaContable` (entidades de
dominio, `entities/`) validan invariantes reales en el constructor — partida doble balanceada, cada
línea afecta un solo lado, código/nombre de cuenta con forma válida.

## 5. `journal_entries` particionada

Igual que `sales.invoices` (Facturación), `journal_entries` está particionada por `posting_date` —
el cliente Prisma generado solo expone la clave compuesta `(id, posting_date)`, nunca `id` a secas,
y `journal_entry_lines` no tiene relación real de Prisma hacia `journal_entries` (Postgres no
permite una FK normal hacia una tabla particionada sin incluir la columna de partición). Mismo
patrón ya establecido: encabezado y líneas se escriben por separado en la misma transacción
(`AsientoRepository`), y las agregaciones que cruzan ambas tablas (Libro Mayor, Balance General,
Estado de Resultados, Flujo de Efectivo) usan `$queryRaw` parametrizado con un `JOIN` manual —
mismo patrón que `CuentaPorCobrarRepository` (Clientes).

## 6. Motor de reglas — decisión de seguridad deliberada

`accounting_rule_lines.amount_formula` es una columna de texto libre en la base — evaluarla como
una expresión (`eval`/`new Function`) sería ejecutar código almacenado en la base de datos, una
vulnerabilidad real de ejecución de código arbitrario. Se trata en cambio como el **nombre de un
campo** a buscar en el "hecho contable" (`HechoContable.hechos: Record<string, number>`) que el
módulo de origen le pasa al motor — configurable (qué cuentas, qué lado, qué campo), sin
interpretar código. Si el negocio necesita fórmulas compuestas a futuro (`subtotal * 0.18`), la vía
seria es una whitelist de operaciones conocidas, nunca un intérprete genérico.

Líneas cuyo campo resuelve a `0` se omiten (`MotorContableService.registrarEvento`) — una línea de
asiento en `$0` no tiene sentido contable y el invariante de partida doble de `Asiento` la rechaza
igual que a un lado vacío (ej. un producto exento de impuesto no debería generar una línea de ITBIS
en `$0`).

## 7. Migración de base de datos

Ninguna en esta parte más allá de lo ya certificado — las 17 tablas usadas ya existían completas.
(Ver `ACCOUNTING_HEALTH_REPORT.md §3` para los gaps reales del schema que SÍ requerirían una
migración a futuro: `is_cash_account` para Flujo de Efectivo automático, columnas de moneda para
soporte multi-moneda real.)

## 8. Integración real con Ventas

`VentasService.confirmarFactura()` invoca `MotorContableService.registrarEvento()` con el evento
`ventas.factura.confirmada` y los hechos `{subtotal_amount, tax_amount, total_amount}` de la
factura. **No bloqueante por diseño**: sin ninguna regla configurada para esa empresa (caso real de
la enorme mayoría de empresas hoy, contabilidad recién se está construyendo), el motor devuelve
`null` y `ventas` sigue funcionando exactamente igual que antes — cumple la regla obligatoria
"nunca romper compatibilidad con módulos existentes" del pedido. Si SÍ hay una regla configurada
pero mal armada, la excepción se deja propagar a propósito (silenciar un asiento mal generado es
peor que bloquear la confirmación hasta que se corrija la regla).

Ver `ACCOUNTING_HEALTH_REPORT.md §2` para el hallazgo real (`reversed` excluido de los reportes) que
se descubrió y corrigió durante la verificación end-to-end de esta integración.

## 9. Ecuación contable verificada en vivo

Verificación manual real contra Postgres (no solo tests): crear factura ($100) → confirmar → asiento
automático generado (débito Cuentas por Cobrar $100, crédito Ingresos por Ventas $100) → Balance
General: Activos $100 = Pasivos $0 + Patrimonio $0 + Utilidad Acumulada $100 ✓ → revertir el
asiento → Balance General vuelve a $0/$0 ✓. La ecuación fundamental (Activos = Pasivos +
Patrimonio) se cumple con datos reales, no solo en tests unitarios con mocks.

## 10. Fuera de alcance, explícito (Parte 1)

CxC/CxP avanzadas (ya cubiertas parcialmente por `clientes`), Bancos, Conciliación Bancaria, Activos
Fijos, Depreciaciones, Impuestos (motor de cálculo — ya hay un catálogo mínimo en
`configuracion`), Presupuestos (ejecución/comparativos — las tablas existen, sin código de
aplicación), Cierre Contable (`fiscal_periods.status` sigue en `open`, sin endpoint de cierre),
Auditoría dedicada (se apoya en el `audit_log` genérico ya existente, sin bitácora propia de
`contabilidad`), Reportes exportables a PDF/Excel/CSV.
