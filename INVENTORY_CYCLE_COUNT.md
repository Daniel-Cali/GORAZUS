# Programación de Conteos Cíclicos — Fase 05, Inventario Enterprise, Parte 04

## 1. Qué se construyó

`ProgramacionConteosController`/`ProgramacionConteosService`/`ProgramaConteoCiclicoRepository`
sobre `inventory.cycle_count_schedules` — calendario recurrente por zona (`zone_id`,
`frequency_days`, `next_run_date`).

- **CRUD**: crear/obtener/listar/actualizar una programación, validando que la zona exista.
- **`POST /:id/generar`**: acción real, no simulada — resuelve el almacén dueño de la zona, crea un
  `physical_count` de verdad (vía `ConteosService.crear` con `zoneId`, mismas líneas autogeneradas y
  filtradas por zona que un conteo manual "por zona"), y avanza `next_run_date` sumando
  `frequency_days` a la fecha base (la ya programada, o hoy si era la primera vez).

## 2. `frequency_days` — un entero, no un enum de períodos

El schema certificado (`docs/database/sql/06_inventory.sql`) modela la frecuencia como
`frequency_days INTEGER`, no como un enum Diario/Semanal/Mensual/etc. Cualquiera de los períodos
pedidos se expresa como cantidad de días — no hace falta una columna nueva:

| Período pedido | `frequencyDays` |
| -------------- | --------------- |
| Diario         | 1               |
| Semanal        | 7               |
| Quincenal      | 15              |
| Mensual        | 30              |
| Trimestral     | 90              |
| Semestral      | 180             |
| Anual          | 365             |

## 3. Selección automática de productos — qué es real y qué no

El pedido original quería selección automática por ABC, rotación, ubicación, categoría y proveedor.
El schema de `cycle_count_schedules` solo tiene `zone_id` — ninguna columna de clasificación ABC,
rotación histórica, categoría o proveedor.

- **Por ubicación/zona**: **real** — `generar()` filtra las líneas del conteo generado por la zona
  de la programación, vía la relación `stock.warehouse_locations.zone_id` (mismo mecanismo que
  `INVENTORY_PHYSICAL_COUNTS.md §1` para conteos manuales "por zona").
- **Por ABC / rotación**: **gap real** — no hay ninguna tabla en el modelo certificado que calcule o
  almacene una clasificación ABC ni una métrica de rotación por producto. Implementarlo requeriría
  una tabla de análisis nueva (ej. `inventory.product_abc_classification`) alimentada por un cálculo
  periódico sobre `stock_movements` — no construido, es una migración + un job de cálculo que el
  pedido no detalló lo suficiente como para diseñarlo sin asumir de más.
- **Por categoría / proveedor**: mismo mecanismo de composición que en Conteos manuales — filtrar
  `productId`s desde el módulo Productos (`GET /productos/productos?categoryId=...`) y crear el
  conteo con `productIds` explícito en vez de usar `generar()` desde una programación por zona.

## 4. Sin ejecución automática en background

`generar()` es una acción que hay que llamar — no hay ningún cron/scheduler corriendo dentro de
GORAZUS que dispare esto solo en `next_run_date`. `core/scheduler` existe como infraestructura desde
antes de esta fase pero **sin un solo consumidor real** en todo el backend
(`TECHNICAL_DEBT.md §2`) — conectar `cycle_count_schedules` a un scheduler real es trabajo aparte,
no incluido en esta parte porque hubiera significado ser el primer y único consumidor de esa pieza
de infraestructura sin que el pedido lo mencionara explícitamente.
