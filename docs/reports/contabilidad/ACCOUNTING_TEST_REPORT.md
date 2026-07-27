# Testing — Contabilidad Enterprise, Parte 1

## 1. Resumen

| Suite                                             | Tests | Tipo                                                                                                    |
| ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| `entities/asiento.entity.spec.ts`                 | 7     | Unitario — partida doble (balance, un solo lado por línea, montos no negativos, tolerancia de redondeo) |
| `entities/cuenta-contable.entity.spec.ts`         | 5     | Unitario — invariantes de forma (código/nombre)                                                         |
| `services/motor-contable.service.spec.ts`         | 5     | Unitario — mocks de repositorios                                                                        |
| `services/asientos.service.spec.ts`               | 10    | Unitario — mocks de repositorios, incluye Libro Mayor                                                   |
| `controllers/contabilidad.controller.e2e-spec.ts` | 4     | Integración real (Postgres/Redis/RabbitMQ)                                                              |

**31 tests totales del módulo `contabilidad`, 31/31 ✅.**

## 2. Qué cubre el e2e

1. `GET /contabilidad/cuentas` sin token → `401`.
2. **Flujo completo real**: crear 2 cuentas (activo + ingreso) → crear año fiscal → crear asiento
   manual balanceado (`$50`/`$50`) → `201` con 2 líneas → contabilizar → `201` → contabilizar de
   nuevo → `409` (ya no está en `draft`/`pending`) → `GET` Balance General → la cuenta de activo
   aparece con `balance: 50`.
3. `POST /contabilidad/asientos` con un asiento desbalanceado (`100` débito vs `40` crédito) →
   `400`, rechazado por Zod/la entidad antes de tocar la base.

## 3. Verificación manual end-to-end (más allá de los tests automatizados)

Además de los tests, se verificó manualmente con `curl` real contra Postgres el flujo íntegro
Ventas → Contabilidad: crear factura → confirmar → asiento automático generado por
`MotorContableService` → Balance General cuadra (`Activos = Pasivos + Patrimonio + Utilidad`) →
Libro Mayor de la cuenta → revertir el asiento → Balance General vuelve a `0`/`0`. Ver
`ACCOUNTING_HEALTH_REPORT.md §2` para el hallazgo real que este ejercicio encontró y corrigió.

## 4. Hallazgos corregidos durante la escritura de tests

- **`account_types.code` — CHECK real de base de datos**: el diseño inicial asumía 8 códigos de
  tipo de cuenta (`asset`/`liability`/`equity`/`income`/`cost`/`expense`/`other_income`/
  `other_expense`) para mapear 1:1 el pedido (Activos/Pasivos/Patrimonio/Ingresos/Costos/
  Gastos/Otros Ingresos/Otros Gastos). El CHECK real de `accounting.account_types_code_check`
  solo permite 5 (`asset`/`liability`/`equity`/`income`/`expense`) — descubierto al correr el seed
  contra Postgres real, no en tests con mocks. Corregido: Costos/Otros Ingresos/Otros Gastos se
  resuelven con listas explícitas de cuentas (`costAccountIds`/`otherIncomeAccountIds`/
  `otherExpenseAccountIds`), no con códigos de tipo inventados. Ver `EstadosFinancierosService`.
- **Reglas contables con línea en `$0`**: un producto exento de impuesto genera `tax_amount: 0` en
  el hecho contable — sin el filtro de líneas en cero, el motor intentaba crear una línea de
  asiento en `$0`, que el invariante de partida doble de `Asiento` rechaza correctamente (ninguna
  línea puede tener ambos lados en cero), rompiendo la confirmación de la factura. Corregido
  filtrando las líneas en `$0` antes de construir el asiento.
- **`reversed` excluido de los reportes** (bug real, no de test — ver `ACCOUNTING_HEALTH_REPORT.md
§2`): encontrado en la verificación manual, no en un test automatizado — ninguno de los tests
  unitarios ejercitaba el ciclo completo crear→revertir→recalcular Balance General contra datos
  reales agregados por SQL. Queda como aprendizaje: las agregaciones SQL crudas (`$queryRaw`)
  necesitan verificación end-to-end real, los mocks no las hubieran detectado.

## 5. No cubierto en esta parte

- Sin test dedicado de `PlanCuentasService`/`CentrosCostoService`/`PeriodosFiscalesService`/
  `ReglasContablesService` (cubiertos indirectamente por el e2e) — riesgo bajo, son servicios CRUD
  simples sobre `BaseRepository`.
- Sin test de `EstadosFinancierosService.estadoResultados()`/`flujoEfectivo()` con datos reales
  variados (múltiples cuentas, múltiples asientos) — el e2e solo verifica Balance General con un
  único asiento.
- Sin pruebas de carga/concurrencia sobre el motor contable.

## 6. Cómo correr

```bash
nx run contabilidad-backend:build
nx run contabilidad-backend:lint
nx run contabilidad-backend:test
nx run ventas-backend:test
nx run pos-backend:test
```

Requiere Postgres/Redis/RabbitMQ reales arriba (Docker) para el e2e-spec.
