# Accounting Report — Contabilidad Enterprise, Parte 1

> Sesión del 2026-07-27, versión **0.23.0**. Primer código real sobre el schema `accounting` (17 de
> 28 tablas, ya certificadas desde antes). Ver `ACCOUNTING_ARCHITECTURE.md` para el detalle
> arquitectónico completo, `ACCOUNTING_API_REPORT.md` para el contrato de cada endpoint,
> `ACCOUNTING_TEST_REPORT.md` para testing, `ACCOUNTING_HEALTH_REPORT.md` para riesgos y deuda
> técnica, `ACCOUNTING_ROADMAP.md` para lo que sigue.

## 1. Origen del pedido y alcance acordado

Pedido: "PROMPT MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE PARA GORAZUS ERP" — 20 secciones
(plan de cuentas, motor contable automático, asientos, libros, estados financieros, CxC/CxP,
bancos, conciliación, activos fijos, depreciación, impuestos, centros de costo, presupuestos,
cierre, auditoría, reportes), un alcance real de varias semanas. Antes de escribir código se
confirmó con el usuario el orden de partes — se eligió **Núcleo Contable + Estados Financieros**
como Parte 1, la base de la que dependen todas las demás secciones.

## 2. Reality-check

`modules/contabilidad/backend` estaba completamente vacío (mismo patrón que otros módulos antes de
su primera parte real), pero el schema `accounting` ya tenía 28 tablas reales desde la
certificación original de base de datos. Esta parte construyó código de aplicación sobre 17 de
ellas — sin agregar tablas nuevas.

## 3. Qué se construyó

- **Plan de cuentas** jerárquico (`chart_of_accounts`, `parent_account_id` auto-referenciado),
  código único por empresa, tipos reales (`account_types`, 5 valores por CHECK de base de datos).
- **Motor de reglas contables** (`accounting_rules`/`accounting_rule_lines`) — traduce un evento de
  negocio ya confirmado en un asiento balanceado. `amount_formula` es el nombre de un campo, nunca
  una expresión evaluada (decisión de seguridad deliberada, ver `ACCOUNTING_ARCHITECTURE.md §6`).
- **Asientos contables** con ciclo de vida completo: borrador → contabilizado → anulado/revertido.
  Invariante de partida doble (`Asiento`, entidad de dominio) — al menos 2 líneas, cada línea
  afecta un solo lado, balanceado dentro de tolerancia de redondeo.
- **Libro Diario** y **Libro Mayor** (saldo inicial + movimientos + saldo final por cuenta).
- **Balance General**, **Estado de Resultados** y **Flujo de Efectivo** (aproximado, ver
  limitaciones), generados en vivo desde `journal_entry_lines`, no snapshots.
- **Integración real y no bloqueante con `ventas`**: `confirmarFactura()` dispara el motor.
- Permisos `contabilidad.gestionar_plan_cuentas`/`gestionar_asientos`/`ver_reportes` sembrados.
- Seed opcional (`seed-contabilidad.ts`): plan de cuentas mínimo + año fiscal + regla de ejemplo.

## 4. Explícitamente fuera de alcance

CxC/CxP avanzadas, Bancos, Conciliación Bancaria, Activos Fijos, Depreciaciones, Impuestos (motor
completo), Presupuestos (ejecución), Cierre Contable, Auditoría dedicada, Reportes exportables a
PDF/Excel/CSV — ver el desglose completo de las 20 secciones en `ACCOUNTING_ROADMAP.md`.

## 5. Hallazgo real encontrado y corregido en el camino

Durante la verificación manual end-to-end (crear factura → confirmar → asiento automático →
revertir → recalcular Balance General) se encontró que un asiento revertido (`status='reversed'`)
quedaba excluido de todas las agregaciones de reportes, pero su asiento de reversión (`posted`) sí
contaba — rompiendo la ecuación contable (el Balance General mostraba `-$100` en vez de `$0` tras
crear y revertir una transacción). Corregido en las 3 consultas SQL afectadas. Ver
`ACCOUNTING_HEALTH_REPORT.md §2` para el análisis completo de causa raíz. Este hallazgo NO lo
detectó ningún test unitario con mocks — solo la verificación contra Postgres real lo reveló,
reafirmando la disciplina de este proyecto de siempre verificar en vivo antes de dar por cerrada
una fase.

Segundo hallazgo, de diseño (no un bug): el CHECK real `account_types_code_check` solo permite 5
valores, no los 8 que el pedido original distingue — resuelto con listas explícitas de cuentas para
la subclasificación fina (Costos/Otros Ingresos/Otros Gastos), documentado en
`ACCOUNTING_TEST_REPORT.md §4`.

## 6. Verificación realizada

- Build/lint limpios en `contabilidad-backend`, sin regresión en `ventas-backend` (30/30) ni
  `pos-backend` (9/9).
- 31/31 tests de `contabilidad-backend` (2 entidades + 2 servicios + 1 e2e real).
- Arranque real de la API, 26 rutas de `/contabilidad/*` mapeadas, OpenAPI regenerado.
- Verificación manual completa con `curl` contra Postgres real: ecuación contable confirmada
  (Activos = Pasivos + Patrimonio + Utilidad) con datos reales, no solo en tests.

## 7. Commits y control de versión

Commits locales pequeños, Conventional Commits — sin push ni cambio de rama, mismo criterio de
esta sesión (152+ archivos de fases anteriores sin commitear, nunca subidos, pendientes de
confirmación explícita del usuario). `v0.22.0 → v0.23.0` (`VERSION.md`), `CHANGELOG.md` y
`ROADMAP.md` actualizados.

## 8. Próximo paso sugerido

Sujeto a confirmación del usuario: Contabilidad Parte 2 (CxC/CxP avanzadas, o Bancos/Conciliación),
o continuar con Facturación Parte 2 (PDF/vista previa), o Roles Enterprise Subfases 4.2-4.8
(pausadas).
