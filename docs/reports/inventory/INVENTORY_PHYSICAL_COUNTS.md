# Conteos Físicos — Fase 05, Inventario Enterprise, Parte 04

## 1. Qué se construyó

`ConteosController`/`ConteosService`/`ConteoFisicoRepository` sobre `inventory.physical_counts` +
`physical_count_lines`. Flujo real de 3 estados (el schema tiene `CHECK (status IN ('planned',
'in_progress', 'completed'))`, no más):

```
planned → in_progress → completed
```

- **`POST /inventario/conteos`** (crea en `planned`): las líneas se arman de dos formas —
  1. `productIds` explícito (Conteo Parcial): valida cada producto y resuelve su `system_quantity`
     real al momento de crear.
  2. Sin `productIds` (Conteo General/por Almacén/por Zona): autogenera las líneas desde
     `inventory.stock` con `quantity_on_hand > 0` en el almacén — si se indica `zoneId`, filtra
     además por esa zona (join real vía la relación `stock.warehouse_locations.zone_id`, no una
     aproximación).
- **`POST /:id/iniciar`** (`planned → in_progress`): habilita la captura.
- **`POST /:id/lineas/:lineaId/capturar`**: guarda `counted_quantity`. **Conteo ciego real**: la
  respuesta de este endpoint nunca incluye `system_quantity` — quien captura no ve la cantidad
  esperada, ver `ConteosService.capturarLinea()`.
- **`POST /:id/completar`** (`in_progress → completed`): exige que **todas** las líneas tengan
  `counted_quantity` capturado (`409 CONTEO_INCOMPLETO` si no). Para las líneas con discrepancia
  (`counted_quantity !== system_quantity`), genera automáticamente un `AjusteStock` en **borrador**
  (motivo "Diferencia de Conteo", reutilizando `AjustesService.crear()` completo — cero lógica
  duplicada) y devuelve `ajusteGeneradoId`. **El ajuste generado no se confirma solo** — la revisión
  humana antes de tocar `stock` de verdad es el punto: alguien tiene que llamar
  `POST /inventario/ajustes/:id/confirmar` aparte.

## 2. Mapeo del pedido original → schema real

| Pedido                                                         | Cómo se resuelve                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conteo General                                                 | Sin `productIds` ni `zoneId` — todo el stock del almacén.                                                                                                                                                                                                                                                                                                                                       |
| Conteo por Almacén                                             | Igual que General (el schema no distingue "general" de "por almacén" — ambos son el mismo alcance).                                                                                                                                                                                                                                                                                             |
| Conteo por Zona                                                | Sin `productIds`, con `zoneId` — real, vía join a `warehouse_locations`.                                                                                                                                                                                                                                                                                                                        |
| Conteo Parcial                                                 | Con `productIds` explícito.                                                                                                                                                                                                                                                                                                                                                                     |
| Conteo por Categoría / por Marca / por Familia / por Proveedor | **No implementado en el backend** — el schema de `physical_counts`/`physical_count_lines` no tiene columnas de categoría/marca/familia/proveedor. Se resuelve componiendo: filtrar productos con `GET /productos/productos?categoryId=...` (ya existe, FASE 04) y pasar los `productId` resultantes como `productIds` acá. No es un gap oculto — es una composición de dos endpoints ya reales. |
| Conteo Ciego                                                   | Real — `capturarLinea` nunca expone `system_quantity`.                                                                                                                                                                                                                                                                                                                                          |
| Conteo Doble                                                   | **Gap real** — el schema solo tiene una columna `counted_quantity` por línea, no dos capturas independientes. Requeriría una tabla nueva (`physical_count_captures`) o una segunda columna — decisión de migración, no tomada acá.                                                                                                                                                              |
| Reconteo                                                       | No es un estado especial — es crear un `physical_count` nuevo para el mismo almacén/zona después de que el primero se completó con diferencias. Ya soportado sin cambios.                                                                                                                                                                                                                       |

## 3. Por qué el ajuste generado no se confirma automáticamente

Confirmar un ajuste genera movimientos reales contra `stock` — hacerlo sin revisión humana
convertiría cualquier error de captura (un dedo torcido tipeando la cantidad contada) en una
corrección de inventario real e inmediata. El flujo pedido (`... → Aprobado → Generar Ajustes →
Registrar Kardex → Auditoría`) ya tiene ese punto de aprobación implícito: "generar ajustes" y
"aprobado" son el mismo paso en la implementación real (`completar()` genera el ajuste en
`draft`), y la aprobación real es la llamada explícita a `confirmar()` sobre ese ajuste — un paso
que awuí queda en manos de quien revisa, no automatizado.

## 4. Validaciones aplicadas

Estado (transiciones `planned→in_progress→completed`, cualquier otra rechazada con `409`), almacén
existe, producto existe (por línea), zona existe y pertenece al almacén indicado (`400` si no). **No
implementado**: validación de "productos inactivos" (el módulo Productos no tiene un campo de
inactivación separado del soft-delete estándar) ni de lotes/series (Parte 07, sin código todavía —
un conteo de un producto que rastrea lote/serie cuenta la cantidad total igual que cualquier otro,
sin desglose por lote).
