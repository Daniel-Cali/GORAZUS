# Módulo Contabilidad

> Parte 1 — Núcleo Contable + Estados Financieros. Diseño completo en
> `docs/reports/contabilidad/ACCOUNTING_ARCHITECTURE.md`, roadmap de lo
> pendiente en `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md`.

## Responsabilidad

Plan de cuentas configurable, motor de reglas contables (traduce un
evento de negocio ya confirmado en un asiento balanceado), asientos con
ciclo de vida completo (borrador → contabilizado → anulado/revertido),
Libro Diario, Libro Mayor, Balance General, Estado de Resultados y
Flujo de Efectivo — todo generado en vivo desde `journal_entry_lines`,
nunca digitado manualmente cuando lo dispara el motor.

## Entidades que este módulo posee

17 de las 28 tablas del schema `accounting`:

- `chart_of_accounts` / `account_types` (vía `CuentaContableRepository`/`TipoCuentaRepository`).
- `cost_centers` (vía `CentroCostoRepository`) — `profit_centers` tiene columna en `journal_entry_lines` pero sin CRUD propio todavía.
- `fiscal_years` / `fiscal_periods` (vía `AnioFiscalRepository`/`PeriodoFiscalRepository`).
- `accounting_rules` / `accounting_rule_lines` (vía `ReglaContableRepository`).
- `journal_entries` / `journal_entry_lines` / `journal_entry_status` (vía `AsientoRepository` — `journal_entries` particionada por `posting_date`, mismo patrón que `sales.invoices`).

11 tablas sin código todavía (CxC/CxP avanzadas, Bancos/Conciliación,
Activos Fijos/Depreciaciones, Presupuestos-ejecución, Cierre contable,
dimensiones contables, revaluación de moneda, intercompañía, IFRS,
snapshots de estados financieros) — ver `ACCOUNTING_ROADMAP.md`.

## Motor de reglas — decisión de seguridad

`accounting_rule_lines.amount_formula` es el **nombre de un campo**
dentro del "hecho contable" que dispara el evento (ej.
`subtotal_amount`), nunca una expresión evaluada — evaluar una fórmula
arbitraria guardada en la base como código sería una vulnerabilidad de
ejecución de código real. Ver `services/motor-contable.service.ts`.

## Con qué módulos colabora (síncrono)

- **`ventas`** — `VentasService.confirmarFactura()` invoca
  `MotorContableService.registrarEvento()` con el evento
  `ventas.factura.confirmada`. **No bloqueante**: si la empresa no
  tiene ninguna regla configurada, no pasa nada (mismo comportamiento
  que antes de que existiera `contabilidad`); si la regla existe pero
  está mal configurada, la excepción se deja propagar a propósito.

## Permisos

`contabilidad.gestionar_plan_cuentas` (cuentas/centros de
costo/períodos fiscales/reglas), `contabilidad.gestionar_asientos`
(crear/contabilizar/anular/revertir asientos manuales),
`contabilidad.ver_reportes` (Libro Diario/Mayor, Balance General,
Estado de Resultados, Flujo de Efectivo) — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Seed de ejemplo

`scripts/seed-contabilidad.ts` — plan de cuentas mínimo (5 cuentas),
año fiscal del año actual (12 períodos), una regla de ejemplo para
`ventas.factura.confirmada`. Opcional: sin correrlo, `contabilidad`
sigue siendo un no-op transparente para `ventas`.

```bash
DATABASE_URL="..." npx ts-node --transpile-only modules/contabilidad/backend/scripts/seed-contabilidad.ts <slug-tenant>
```

## Tests

31 tests (2 entidades + 2 servicios + integración real end-to-end
contra Postgres/Redis/RabbitMQ,
`controllers/contabilidad.controller.e2e-spec.ts`).
`nx run contabilidad-backend:test`.
