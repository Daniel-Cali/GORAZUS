# 22 — Módulo Accounting (diseño completo)

> Versión 1.0 — 2026-07-13. Mismo criterio que los documentos de
> módulo anteriores. Sin tablas nuevas — verificado completo contra
> [sql/11_accounting.sql](../database/sql/11_accounting.sql) (28
> tablas) y las vistas reales de
> [sql/24_views.sql](../database/sql/24_views.sql). Sin código.

## 0. Alcance — dos pares de términos ambiguos, cada uno con dos implementaciones reales distintas

A diferencia de los módulos anteriores, acá no hay tensión de
propiedad entre módulos — la tensión es **terminológica dentro del
propio módulo**: dos de los ocho puntos pedidos (Mayor implícito en
"Diario", y "Balance"/"Flujo de Caja") nombran conceptos contables que
el schema real resuelve con **dos objetos distintos cada uno**, fáciles
de confundir si no se verifica contra el SQL:

| Término        | Objeto real #1                                                                                        | Objeto real #2                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Diario / Mayor | `accounting.journal_entries` (tabla — el Diario, registro cronológico)                                | `accounting.v_general_ledger` (**vista**, el Mayor — saldo corrido por cuenta, solo asientos `posted`) |
| Balance        | `accounting.v_trial_balance` (**vista** — Balance de Comprobación, sumas y saldos a la fecha)         | `accounting.balance_sheet_snapshots` (tabla — Balance General, congelado a un cierre)                  |
| Flujo de Caja  | `accounting.v_treasury_position` (**vista** — posición operativa en tiempo real, base de "Tesorería") | `accounting.cash_flow_snapshots` (tabla — Estado de Flujo de Efectivo formal, congelado)               |

Diseñar cada uno sin distinguir cuál de los dos se pide sería
ambiguo — se diseñan los seis objetos, dejando explícita la diferencia
en cada caso.

## 1. Plan de cuentas (`chart_of_accounts` + `account_types`)

Jerárquico auto-referenciado (`parent_account_id`), igual patrón que
`product_categories`/`warehouse_locations`. `account_types.code CHECK
IN ('asset', 'liability', 'equity', 'income', 'expense')` con
`normal_balance` (`debit`/`credit`) — la naturaleza de la cuenta, base
de todo cálculo de saldo correcto.

**`accepts_postings`** (columna real, no estaba explicada en flujo):
distingue cuentas **de resumen** (`accepts_postings = false` — nodos
intermedios de la jerarquía, solo agrupan) de cuentas **de detalle**
(`accepts_postings = true` — las únicas que pueden recibir líneas de
asiento). Un intento de imputar `journal_entry_lines.account_id` a una
cuenta de resumen debe rechazarse en la capa de aplicación (el schema
no tiene forma de expresar esta regla como `CHECK`, porque depende de
si la cuenta tiene hijos, un dato calculado) — es lo que impide que el
Mayor (§4) mezcle saldos de un nivel de detalle con los de su propio
resumen.

## 2. Diario (`accounting.journal_entries`)

**Es la tabla base**, no una vista — el registro cronológico de todo
asiento, particionado **anualmente y alineado al ejercicio fiscal**
(no al año calendario, consistente con
[14-modulo-core §8](./14-modulo-core.md#8-fiscal-years-accountingfiscal_years--fiscal_periods-dueño-real-accounting)).
`source_module`/`source_entity_id` polimórfico conecta cada asiento
con el hecho de negocio que lo originó (`sales.invoices`,
`purchases.purchase_invoices`, `payroll.payroll_runs`...) — cuando
existe, el asiento es trazable hacia atrás hasta el documento
original; cuando es `NULL`, es un asiento manual. `status_id CHECK IN
('draft', 'posted', 'reversed')` — solo `posted` participa del Mayor
(§4).

## 3. Asientos — manuales, automáticos y reversión

**Automáticos** (`accounting_rules` + `accounting_rule_lines`): mapeo
de un `event_code` (`'sales.invoice_confirmed'`, por ejemplo) a una
plantilla de líneas débito/crédito con `amount_formula` — es el
mecanismo concreto detrás de "contabilidad como consumidor puro de
eventos" ya fijado en
[04-catalogo-modulos-negocio](./04-catalogo-modulos-negocio.md#contabilidad-como-consumidor-no-como-orquestador):
`accounting` se suscribe a eventos de `sales`/`purchases`/`cash`/
`banks`/`payroll`/`assets`, nunca al revés. `amount_formula` se
evalúa en la capa de aplicación (no en SQL) contra el payload del
evento — el schema solo guarda la fórmula como texto.

**Recurrentes** (`recurring_journal_entry_templates` +
`_generations`): para asientos que no vienen de un evento de otro
módulo (amortizaciones, previsiones) — se generan por calendario
(`frequency`), cada generación queda trazada.

**Invariante verificado por trigger** (confirmado en el comentario
real del schema, no en 26_triggers.sql en sí, pero declarado ahí): la
suma de `debit_amount` debe igualar la suma de `credit_amount` por
`journal_entry_id` — un asiento desbalanceado no puede confirmarse,
reforzado a nivel de motor, no solo de validación de aplicación.

**Reversión** (`status = 'reversed'`) — **gap de diseño identificado,
no bloqueante**: no existe una columna que enlace un asiento con el
que lo revierte (no hay `reversed_by_journal_entry_id`). La práctica
contable correcta —nunca editar ni borrar un asiento ya `posted`, sino
crear uno nuevo con los montos invertidos— es perfectamente posible
hoy reutilizando `source_module='accounting'`,
`source_entity_id=<id del asiento original>` en el asiento reversor,
pero es una convención de la capa de aplicación, no una relación
declarada en el schema. Se deja señalado como candidato a una columna
explícita si la trazabilidad de reversiones se vuelve una necesidad
frecuente de reporte.

## 4. Mayor (`accounting.v_general_ledger`) — vista, no tabla

Verificado: saldo corrido por cuenta (`SUM(debit - credit) OVER
(PARTITION BY account_id ORDER BY posting_date, local_id)`),
**filtrado a `status = 'posted'`** — un asiento en `draft` no aparece
en el Mayor aunque ya exista en el Diario. Esta es la diferencia
operativa real entre Diario y Mayor, más allá de "uno es cronológico y
el otro por cuenta": el Diario muestra todo lo que se creó, el Mayor
solo lo que ya es contablemente firme.

## 5. Balance — dos objetos, verificados por separado

**Balance de Comprobación** (`v_trial_balance`, vista real,
verificada: agrega `v_general_ledger` por cuenta —
`SUM(debit)`, `SUM(credit)`, `net_balance`): es el chequeo de
consistencia antes de confiar en cualquier estado financiero — la
suma de `net_balance` de **todas** las cuentas de un balance de
comprobación correcto debe dar cero (todo débito tiene su crédito en
alguna otra cuenta). Se consulta, no se congela — cambia con cada
asiento nuevo.

**Balance General** (`balance_sheet_snapshots`, tabla, `snapshot_data
JSONB`): congelado **a un cierre de período**, con el mismo criterio
de valor legal ya visto en
[16-modulo-customers §5](./16-modulo-customers.md#5-estados-de-cuenta-customer_statements)
para `customer_statements` — un balance que se reclama o se presenta
ante un tercero debe verse igual siempre, aunque después se agregue
un asiento de ajuste al período.

**Flujo que conecta ambos con el cierre de período** (extiende el
ciclo de vida ya diseñado en
[14-modulo-core §8](./14-modulo-core.md#8-fiscal-years-accountingfiscal_years--fiscal_periods-dueño-real-accounting)):
antes de cerrar un `fiscal_period`, se valida `v_trial_balance` (suma
cero) — si no cuadra, el cierre se bloquea, no se genera un
`balance_sheet_snapshot` con un balance que no balancea. Recién con el
período cerrado y el trial balance validado se congela el snapshot.

## 6. Estado de Resultados (`income_statement_snapshots`)

Mismo patrón de snapshot que el Balance General. Se compone de las
cuentas con `account_types.code IN ('income', 'expense')` del período
— a diferencia del Balance General (que es una fotografía a un
instante, saldos acumulados desde el origen de la cuenta), el Estado
de Resultados es del **período** específico (ingresos y gastos
_durante_ el ejercicio/mes, no acumulados históricos) — esta distinción
de naturaleza contable (cuentas de balance vs. cuentas de resultado)
es la misma que ya fija `account_types.normal_balance`, aplicada acá a
qué snapshot corresponde a cada tipo de cuenta.

## 7. Flujo de Caja — dos objetos con propósitos opuestos

**`v_treasury_position`** (vista real, verificada: suma movimientos de
`cash.cash_movements` + `banks.bank_transfers` por dirección
`in`/`out`, agrupado por empresa/sucursal): posición **operativa en
tiempo real** — "cuánto efectivo/banco tengo ahora mismo", consumida
por la capa de Tesorería (sin schema propio, ver
[04-catalogo-modulos-negocio](./04-catalogo-modulos-negocio.md#tesoreria-vs-caja--bancos-por-qué-son-módulos-distintos)).
**No es** el Estado de Flujo de Efectivo contable — es más simple, más
rápido, y vive fuera del ciclo de cierre contable.

**`cash_flow_snapshots`** (tabla, congelada al cierre): el estado
financiero formal (NIIF/normativa local exige uno de los tres métodos
—operativo, de inversión, de financiamiento— clasificados). **Gap de
diseño identificado**: el schema no fija si se arma por método directo
o indirecto — es una decisión de negocio/contable pendiente, análoga a
otros gaps ya señalados en este proyecto (ver
[00-arquitectura-general §10](./00-arquitectura-general.md#10-gaps-identificados-candidatos-a-adr-no-decisiones-tomadas)),
candidata a ADR cuando el equipo contable lo defina — el
`snapshot_data JSONB` es suficientemente flexible para soportar
cualquiera de los dos métodos sin cambio de schema, así que no bloquea
la implementación, solo posterga la decisión de formato.

## 8. NIIF (`ifrs_adjustments`)

**Patrón de doble libro, sin duplicar asientos** (no estaba explicado
como diseño): `ifrs_adjustments` no reemplaza ni edita el asiento
local (`journal_entry_id NOT NULL` — siempre referencia un asiento ya
existente en libros locales) — agrega una **capa de ajuste**
(`ifrs_standard_reference`, p. ej. "NIIF 16 — Arrendamientos") sobre
un asiento que ya se registró según el régimen fiscal local
(`configuration.fiscal_regimes`, ver
[14-modulo-core §4-7](./14-modulo-core.md#4-7-countries-currencies-languages-timezones--dueño-real-configuration)).
Esto permite producir **dos** juegos de estados financieros desde el
mismo Diario: el local (solo asientos base) y el NIIF (asientos base +
ajustes), sin mantener dos contabilidades paralelas ni arriesgar que
diverjan — el ajuste siempre es trazable al asiento que ajusta, nunca
un asiento NIIF "suelto" sin origen local.

## 9. Trazabilidad

| Punto solicitado     | Documento(s) de detalle normativo                                                                                                                             | Novedad de este documento                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plan de cuentas      | [sql/11_accounting.sql](../database/sql/11_accounting.sql)                                                                                                    | Rol de `accepts_postings` en la integridad del Mayor (§1)                                        |
| Diario               | Ídem                                                                                                                                                          | Relación con el ciclo de ejercicio fiscal de 14-modulo-core (§2)                                 |
| Asientos             | Ídem                                                                                                                                                          | Mecanismo de asientos automáticos vía `accounting_rules` + gap de trazabilidad de reversión (§3) |
| Mayor                | [sql/24_views.sql](../database/sql/24_views.sql) (`v_general_ledger`)                                                                                         | Confirmación de que es vista, filtrada a `posted` (§4)                                           |
| Balance              | Ídem (`v_trial_balance`) + [sql/11_accounting.sql](../database/sql/11_accounting.sql) (`balance_sheet_snapshots`)                                             | Los dos objetos distintos + flujo de validación antes de cerrar período (§5)                     |
| Estado de Resultados | [sql/11_accounting.sql](../database/sql/11_accounting.sql)                                                                                                    | Distinción período vs. acumulado frente al Balance General (§6)                                  |
| Flujo de Caja        | [sql/24_views.sql](../database/sql/24_views.sql) (`v_treasury_position`) + [sql/11_accounting.sql](../database/sql/11_accounting.sql) (`cash_flow_snapshots`) | Los dos objetos distintos + gap de método directo/indirecto no decidido (§7)                     |
| NIIF                 | [sql/11_accounting.sql](../database/sql/11_accounting.sql)                                                                                                    | Patrón de doble libro sin duplicar asientos (§8)                                                 |
