# Informe de Salud — Contabilidad Enterprise, Parte 1

## 1. Resumen

Núcleo contable (plan de cuentas, motor de reglas, asientos, Libro Diario/Mayor) y Estados
Financieros (Balance General, Estado de Resultados, Flujo de Efectivo) construidos sobre 17 de las
28 tablas ya certificadas del schema `accounting`. Integración real y no bloqueante con `ventas`.
Un bug real de agregación contable fue encontrado y corregido durante la verificación manual
end-to-end (§2) — la ecuación fundamental (Activos = Pasivos + Patrimonio) está verificada contra
datos reales, no solo contra mocks.

**Estado general: sano. El motor produce asientos balanceados y estados financieros consistentes,
con limitaciones documentadas y explícitas (§3), no ocultas.**

## 2. Hallazgo real corregido: `reversed` excluido de los reportes

**Causa raíz**: `AsientosService.revertir()` crea un asiento nuevo con las líneas invertidas
(`posted`) y cambia el estado del asiento ORIGINAL a `reversed`. Las consultas de agregación
(`ReportesContablesRepository.saldosPorTipo`/`saldosPorTipoEnRango`,
`AsientoRepository.listarLineasPorCuenta`) filtraban `jes.code = 'posted'` únicamente — al pasar a
`reversed`, el asiento original **desaparecía por completo** de los reportes, pero el asiento de
reversión (sí `posted`) seguía contando. Resultado: en vez de que ambos asientos se cancelaran a
cero, solo el efecto de la reversión quedaba visible — el Balance General mostraba `-$100` en vez
de `$0` después de crear y revertir una transacción de `$100`.

**Cómo se encontró**: verificación manual end-to-end con `curl` contra Postgres real (crear
factura → confirmar → revertir el asiento → recalcular Balance General) — ningún test unitario con
mocks lo hubiera detectado, porque el bug estaba en el filtro SQL de una agregación cruzada entre
dos tablas particionadas, no en la lógica de `AsientosService` en sí (que sí actualizaba el estado
correctamente).

**Corrección aplicada**: el filtro pasa a `jes.code IN ('posted', 'reversed')` en las 3 consultas
afectadas — un asiento revertido sigue siendo un hecho histórico real (sus líneas deben seguir
contando), la reversión es un asiento NUEVO que lo cancela, no un borrado del original.

**Verificación de la corrección**: repetido el mismo flujo real (crear → confirmar → Balance General
= `$100` ✓ → revertir → Balance General = `$0` ✓) contra Postgres real tras el fix.

## 3. Limitaciones reales del schema, documentadas (no fabricadas como resueltas)

| Limitación                                                      | Detalle                                                                                                                                                        | Mitigación en esta parte                                                                                                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin multi-moneda en asientos                                    | `journal_entries`/`journal_entry_lines` no tienen columna de moneda — el pedido exige "múltiples monedas" explícitamente.                                      | Fuera de alcance; requeriría una migración nueva (columna `currency_code` + tasa de cambio).                                                                                                                  |
| `account_types.code` solo admite 5 valores                      | CHECK real de base de datos (`asset`/`liability`/`equity`/`income`/`expense`) — el pedido distingue 8 categorías (incluye Costos/Otros Ingresos/Otros Gastos). | `EstadoResultados` acepta listas explícitas de cuentas (`costAccountIds`/etc.) para la subclasificación, ver `ACCOUNTING_ARCHITECTURE.md §6`.                                                                 |
| Sin flag "cuenta de efectivo"                                   | `chart_of_accounts` no tiene `is_cash_account` — Flujo de Efectivo no puede autodetectar qué cuentas son caja/bancos.                                          | `flujoEfectivo()` recibe `cashAccountIds` explícito del caller.                                                                                                                                               |
| Flujo de Efectivo sin Operación/Inversión/Financiamiento formal | El schema no tiene ninguna columna que clasifique un asiento/regla en esas 3 categorías.                                                                       | Se entrega un desglose aproximado por `source_module` del asiento (`ventas`, `contabilidad`, etc.), documentado como aproximación, no como la clasificación formal de 3 categorías que pide el prompt.        |
| Sin cierre contable                                             | `fiscal_periods.status` siempre queda `open` — no hay endpoint de cierre/reapertura.                                                                           | Explícitamente fuera del alcance elegido para esta parte ("Núcleo + Estados Financieros", sin "Cierre"). La "Utilidad Acumulada" del Balance General es histórica completa, no distingue ejercicios cerrados. |

## 4. Riesgos conocidos

| Riesgo                                                              | Severidad                             | Detalle                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reglas mal configuradas bloquean la confirmación de facturas        | Media (decisión de diseño deliberada) | Si una empresa configura una regla para `ventas.factura.confirmada` que referencia un campo inexistente, `confirmarFactura()` falla — decisión consciente (§`ACCOUNTING_ARCHITECTURE.md §8`), no un bug, pero requiere que el administrador entienda el mensaje de error. |
| Sin test dedicado de `EstadosFinancierosService` con datos variados | Baja                                  | Solo verificado con un asiento simple en el e2e; la lógica de partición Ingresos/Costos/Gastos vía IDs explícitos no tiene un test con múltiples cuentas reales.                                                                                                          |
| `PeriodosFiscalesService.crearAnioFiscal` no valida solapamiento    | Baja                                  | Se puede crear un segundo año fiscal que se solape en fechas con uno existente para la misma empresa — `resolverPeriodoPorFecha` toma el primero que encuentre, sin ambigüedad funcional real pero sin una validación explícita que lo impida.                            |
| Sin límite de profundidad en la jerarquía de `chart_of_accounts`    | Baja                                  | `parent_account_id` es auto-referenciado sin control de ciclos ni de profundidad máxima — un plan de cuentas mal armado a mano podría crear un ciclo (A es padre de B, B es padre de A).                                                                                  |

## 5. Deuda técnica introducida (nueva en esta fase)

- Ninguna deuda estructural nueva — el bug de `reversed` (§2) fue corregido, no dejado pendiente.
- Sin cierre contable, sin bitácora de auditoría propia de `contabilidad` (se apoya en el
  `audit_log` genérico) — ambos explícitamente fuera de alcance de esta parte.

## 6. Deuda técnica heredada, relevante para esta fase (no nueva)

- Ninguna — este es el primer código real sobre el schema `accounting`.

## 7. Seguridad y permisos

`contabilidad.gestionar_plan_cuentas`/`contabilidad.gestionar_asientos`/`contabilidad.ver_reportes`
sembrados y confirmados contra la base real, todos los controladores los exigen explícitamente. No
se detectaron endpoints sin guardia de permisos.

## 8. Recomendación

Antes de producción: decidir con negocio real la estrategia de multi-moneda (§3) si aplica, y
definir formalmente qué cuentas son "de efectivo" para automatizar el Flujo de Efectivo (hoy
requiere pasarlas explícitamente en cada consulta).
