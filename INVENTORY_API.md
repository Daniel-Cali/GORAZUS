# API — Ajustes, Conteos Físicos y Programación Cíclica (Fase 05, Parte 04)

Complementa a `INVENTORY_STOCK_API.md` (Parte 02) y `INVENTORY_RESERVAS_TRANSFERENCIAS_API.md`
(Parte 03), sin duplicarlas. Todos los endpoints requieren `Authorization: Bearer <token>` y el
permiso `inventario.gestionar_stock` (mismo permiso que el resto del módulo desde Parte 02).

## Motivos de ajuste — `/inventario/motivos-ajuste`

| Método | Ruta                             | Descripción                      |
| ------ | -------------------------------- | -------------------------------- |
| POST   | `/inventario/motivos-ajuste`     | Crear. Body: `{ name: string }`. |
| GET    | `/inventario/motivos-ajuste`     | Listar.                          |
| GET    | `/inventario/motivos-ajuste/:id` | Obtener por id.                  |
| PATCH  | `/inventario/motivos-ajuste/:id` | Renombrar.                       |

## Ajustes — `/inventario/ajustes`

| Método | Ruta                                | Descripción                                              |
| ------ | ----------------------------------- | -------------------------------------------------------- |
| POST   | `/inventario/ajustes`               | Crear (borrador). Ver body abajo.                        |
| GET    | `/inventario/ajustes/:id`           | Obtener con líneas.                                      |
| GET    | `/inventario/ajustes`               | Listar. Filtrable por `warehouseId`/`status`.            |
| POST   | `/inventario/ajustes/:id/confirmar` | `draft → confirmed`. Genera movimientos reales, atómico. |

**Body de `POST /inventario/ajustes`:**

```json
{
  "warehouseId": "uuid",
  "reasonId": "uuid",
  "lines": [{ "productId": "uuid", "newQuantity": 40 }]
}
```

`previousQuantity` no se pide — se resuelve del stock real al momento de crear.

## Conteos físicos — `/inventario/conteos`

| Método | Ruta                                               | Descripción                                                                                                                                               |
| ------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/inventario/conteos`                              | Crear (`planned`). Ver body abajo.                                                                                                                        |
| GET    | `/inventario/conteos/:id`                          | Obtener con líneas.                                                                                                                                       |
| GET    | `/inventario/conteos`                              | Listar. Filtrable por `warehouseId`/`status`.                                                                                                             |
| POST   | `/inventario/conteos/:id/iniciar`                  | `planned → in_progress`.                                                                                                                                  |
| POST   | `/inventario/conteos/:id/lineas/:lineaId/capturar` | Captura ciega. Body: `{ countedQuantity: number }`. Respuesta nunca incluye `systemQuantity`.                                                             |
| POST   | `/inventario/conteos/:id/completar`                | `in_progress → completed`. Exige todas las líneas capturadas. Genera un ajuste en borrador si hay discrepancias — devuelve `ajusteGeneradoId` (o `null`). |

**Body de `POST /inventario/conteos`:**

```json
{
  "warehouseId": "uuid",
  "scheduledDate": "2026-08-01",
  "zoneId": "uuid (opcional — filtra el autogenerado por zona)",
  "productIds": ["uuid", "..."]
}
```

Si se omite `productIds`, las líneas se autogeneran desde el stock con existencia > 0 del almacén
(filtrado a `zoneId` si se indica).

## Programación de conteos cíclicos — `/inventario/programacion-conteos`

| Método | Ruta                                           | Descripción                                                                 |
| ------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/inventario/programacion-conteos`             | Crear. Body: `{ zoneId, frequencyDays, nextRunDate? }`.                     |
| GET    | `/inventario/programacion-conteos/:id`         | Obtener.                                                                    |
| GET    | `/inventario/programacion-conteos`             | Listar.                                                                     |
| PATCH  | `/inventario/programacion-conteos/:id`         | Actualizar `frequencyDays`/`nextRunDate`.                                   |
| POST   | `/inventario/programacion-conteos/:id/generar` | Genera un `physical_count` real filtrado a la zona; avanza `next_run_date`. |

## Errores de dominio (nuevos esta parte)

| Código                                    | HTTP | Cuándo                                                                           |
| ----------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| `MOTIVO_AJUSTE_NO_ENCONTRADO`             | 404  | `GET`/`PATCH` de un motivo inexistente.                                          |
| `AJUSTE_NO_ENCONTRADO`                    | 404  | `GET`/`confirmar` de un ajuste inexistente.                                      |
| `MOTIVO_AJUSTE_INVALIDO`                  | 400  | `reasonId` no existe al crear un ajuste.                                         |
| `AJUSTE_YA_CONFIRMADO`                    | 409  | `confirmar` de un ajuste que no está en `draft`.                                 |
| `TIPO_MOVIMIENTO_AJUSTE_NO_CONFIGURADO`   | 409  | Falta `adjustment_increase`/`adjustment_decrease` en el catálogo del tenant.     |
| `CONTEO_NO_ENCONTRADO`                    | 404  | `GET`/transición de un conteo inexistente.                                       |
| `TRANSICION_CONTEO_INVALIDA`              | 409  | Transición de estado no permitida.                                               |
| `LINEA_CONTEO_NO_ENCONTRADA`              | 404  | `capturar` sobre una línea inexistente.                                          |
| `CONTEO_SIN_STOCK`                        | 400  | Autogenerar líneas sin stock disponible en el almacén/zona.                      |
| `CONTEO_INCOMPLETO`                       | 409  | `completar` con líneas sin `counted_quantity`.                                   |
| `ZONA_INVALIDA`                           | 400  | `zoneId` no existe o no pertenece al almacén indicado.                           |
| `MOTIVO_DIFERENCIA_CONTEO_NO_CONFIGURADO` | 409  | Falta el motivo "Diferencia de Conteo" al completar un conteo con discrepancias. |
| `PROGRAMA_CONTEO_NO_ENCONTRADO`           | 404  | `GET`/`PATCH`/`generar` de una programación inexistente.                         |

## Prerrequisito operativo

`/ajustes/:id/confirmar` necesita `adjustment_increase`/`adjustment_decrease` en el catálogo de
tipos de movimiento del tenant — ya sembrados por `scripts/seed-stock-movement-types.ts` (Parte 02).
`/conteos/:id/completar` (cuando genera un ajuste) necesita el motivo "Diferencia de Conteo" — nuevo
en `scripts/seed-stock-adjustment-reasons.ts` (esta parte).

## No incluido en esta parte

Recepciones/salidas documentales, reglas de almacén, costeo, series/lotes, producción — ver
`INVENTORY_NEXT_PHASE.md` (Parte 05 en adelante).
