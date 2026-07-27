# API — Contabilidad Enterprise, Parte 1

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso indicado. Prefijo real:
`/api/v1/...` — se omite acá por brevedad, igual que en `INVOICE_API_REPORT.md`.

## `/contabilidad/cuentas` — `contabilidad.gestionar_plan_cuentas`

| Método | Ruta                                   | Descripción                                                       |
| ------ | -------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/contabilidad/cuentas`                | Listar — filtrable por `accountTypeId`/`parentAccountId`.         |
| GET    | `/contabilidad/cuentas/:id`            | Obtener por id.                                                   |
| POST   | `/contabilidad/cuentas`                | Crear.                                                            |
| PUT    | `/contabilidad/cuentas/:id`            | Editar código/nombre/acepta movimientos — nunca reasigna el tipo. |
| POST   | `/contabilidad/cuentas/:id/desactivar` | Desactivar (`is_active=false`) — nunca se elimina físicamente.    |

## `/contabilidad/centros-costo` — `contabilidad.gestionar_plan_cuentas`

| Método | Ruta                              | Descripción     |
| ------ | --------------------------------- | --------------- |
| GET    | `/contabilidad/centros-costo`     | Listar.         |
| GET    | `/contabilidad/centros-costo/:id` | Obtener por id. |
| POST   | `/contabilidad/centros-costo`     | Crear.          |

## `/contabilidad/anios-fiscales` — `contabilidad.gestionar_plan_cuentas`

| Método | Ruta                                        | Descripción                                                     |
| ------ | ------------------------------------------- | --------------------------------------------------------------- |
| POST   | `/contabilidad/anios-fiscales`              | Crear año fiscal — genera sus 12 períodos mensuales de una vez. |
| GET    | `/contabilidad/anios-fiscales/:id`          | Obtener por id.                                                 |
| GET    | `/contabilidad/anios-fiscales/:id/periodos` | Listar los 12 períodos del año.                                 |

## `/contabilidad/reglas` — `contabilidad.gestionar_plan_cuentas`

| Método | Ruta                       | Descripción                                                         |
| ------ | -------------------------- | ------------------------------------------------------------------- |
| GET    | `/contabilidad/reglas`     | Listar.                                                             |
| GET    | `/contabilidad/reglas/:id` | Obtener por id.                                                     |
| POST   | `/contabilidad/reglas`     | Crear — `amountFormula` es el nombre de un campo, no una expresión. |
| PUT    | `/contabilidad/reglas/:id` | Editar (reemplaza sus líneas).                                      |
| DELETE | `/contabilidad/reglas/:id` | Eliminar.                                                           |

## `/contabilidad/asientos`

| Método | Ruta                                      | Permiso              | Descripción                                                                      |
| ------ | ----------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| GET    | `/contabilidad/asientos`                  | `ver_reportes`       | Libro Diario — filtrable por `branchId`/`statusId`/rango de fechas, ordenable.   |
| GET    | `/contabilidad/asientos/libro-mayor`      | `ver_reportes`       | Libro Mayor de una cuenta (`accountId`+`desde`+`hasta` obligatorios).            |
| GET    | `/contabilidad/asientos/:id`              | `ver_reportes`       | Obtener con líneas.                                                              |
| POST   | `/contabilidad/asientos`                  | `gestionar_asientos` | Crear asiento manual (borrador) — debe estar balanceado.                         |
| POST   | `/contabilidad/asientos/:id/contabilizar` | `gestionar_asientos` | `draft`/`pending` → `posted`.                                                    |
| POST   | `/contabilidad/asientos/:id/anular`       | `gestionar_asientos` | → `cancelled`.                                                                   |
| POST   | `/contabilidad/asientos/:id/revertir`     | `gestionar_asientos` | Genera un asiento nuevo con las líneas invertidas; marca el original `reversed`. |

## `/contabilidad/reportes` — `contabilidad.ver_reportes`

| Método | Ruta                                       | Query obligatorios                              | Descripción                                                                                                  |
| ------ | ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GET    | `/contabilidad/reportes/balance-general`   | `companyId`, `fechaCorte`                       | Activos/Pasivos/Patrimonio + Utilidad Acumulada.                                                             |
| GET    | `/contabilidad/reportes/estado-resultados` | `companyId`, `desde`, `hasta`                   | Utilidad Bruta/Operativa/Neta. `costAccountIds`/`otherIncomeAccountIds`/`otherExpenseAccountIds` opcionales. |
| GET    | `/contabilidad/reportes/flujo-efectivo`    | `companyId`, `cashAccountIds`, `desde`, `hasta` | Neto por módulo de origen (aproximado, ver `ACCOUNTING_HEALTH_REPORT.md`).                                   |

**26 rutas en total, 6 controladores.**

## 1. `POST /contabilidad/asientos` — request/response real

```json
// Request
{
  "companyId": "uuid",
  "branchId": "uuid opcional",
  "description": "Asiento manual",
  "lines": [
    { "accountId": "uuid", "debitAmount": 100, "creditAmount": 0 },
    { "accountId": "uuid", "debitAmount": 0, "creditAmount": 100 }
  ]
}
```

`400` si no balancea (`Σdébitos ≠ Σcréditos`), si tiene menos de 2 líneas, o si una línea afecta
ambos lados o ninguno.

## 2. `GET /contabilidad/reportes/balance-general` — response real (verificado en vivo)

```json
{
  "data": {
    "fechaCorte": "2026-12-31T00:00:00.000Z",
    "activos": [
      { "accountId": "uuid", "code": "1200", "name": "Cuentas por Cobrar", "balance": 100 }
    ],
    "totalActivos": 100,
    "pasivos": [],
    "totalPasivos": 0,
    "patrimonio": [],
    "totalPatrimonio": 0,
    "utilidadAcumulada": 100,
    "totalPasivoMasPatrimonio": 100
  }
}
```

## 3. Verificación en vivo

Arranque real de la API confirmado, las 26 rutas de `/contabilidad/*` mapeadas. Flujo completo
verificado con `curl` real contra Postgres: crear factura → confirmar → asiento automático generado
→ Balance General cuadra → revertir → Balance General vuelve a cero (ver
`ACCOUNTING_HEALTH_REPORT.md §2` para el bug real encontrado y corregido en este mismo ejercicio).
OpenAPI regenerado y confirmado (`docs/api/openapi.json`, rutas `/api/v1/contabilidad/*`).
