# Reporte — Fase 05, Inventario Enterprise, Parte 04: Ajustes de Inventario

## 1. Punto de partida

Con Reservas y Transferencias completas (`v0.9.0`), esta parte construyó `inventory.stock_adjustments`

- `stock_adjustment_lines` + `stock_adjustment_reasons` — corrige `stock` a un valor conocido y deja
  registro de por qué, orquestando el motor de movimientos ya construido, nunca tocando `stock` directo.

## 2. Qué se construyó

- **Catálogo de motivos** (`MotivosAjusteController`/`MotivosAjusteService`/`MotivoAjusteRepository`)
  sobre `inventory.stock_adjustment_reasons` — mismo patrón que `TipoMovimientoStockRepository`
  (Parte 02): agregar un motivo nuevo es una fila, no una migración. Sembrado con los 13 motivos
  mínimos pedidos (`scripts/seed-stock-adjustment-reasons.ts`): Daño, Pérdida, Robo, Error Humano,
  Diferencia de Conteo, Regularización, Producción, Consumo Interno, Donación, Vencimiento, Ajuste
  Administrativo, Inventario Inicial, Otro.
- **Ajustes** (`AjustesController`/`AjustesService`/`AjusteStockRepository`): `POST
/inventario/ajustes` crea el encabezado + líneas en `draft` — `previousQuantity` se **resuelve del
  stock real** al momento de crear (no se le pide al llamador, evita que quede desincronizado entre
  que se arma el ajuste y se confirma). `POST /:id/confirmar` calcula la diferencia real por línea
  (`new_quantity - previous_quantity`) y genera un movimiento (`adjustment_increase` si sube,
  `adjustment_decrease` si baja, ninguno si no cambió) vía `MovimientosService.registrarLote` — el
  mismo motor atómico multi-línea que Transferencias (Parte 03), reutilizado tal cual.

## 3. Mapeo del pedido original → lo que el schema realmente soporta

El pedido original listaba 12 "tipos de ajuste" (Entrada, Salida, Merma, Rotura, Vencimiento,
Regularización, Corrección, Inventario Inicial, Consumo Interno, Producción, Donación,
Transferencia Correctiva) como si fueran una dimensión propia. El schema real
(`inventory.stock_adjustments`) no tiene una columna "tipo" — solo `reason_id` (el catálogo de
motivos de arriba) y `status` (`draft`/`confirmed`). La traducción real:

| "Tipo de ajuste" pedido                                                               | Cómo se resuelve realmente                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada / Salida                                                                      | Se derivan automáticamente del signo de `new_quantity - previous_quantity` al confirmar — no son un campo que el usuario elige, es aritmética.                                                     |
| Merma, Rotura, Vencimiento, Robo, Daño, Error Humano, Donación, Ajuste Administrativo | Son **motivos** (`reason_id`), ya cubiertos por el catálogo sembrado.                                                                                                                              |
| Regularización, Corrección, Diferencia de Conteo                                      | Motivos también — "Diferencia de Conteo" además tiene un rol especial: es el motivo que usa `ConteosService.completar()` al generar un ajuste automático (ver `INVENTORY_PHYSICAL_COUNTS.md §3`).  |
| Inventario Inicial                                                                    | Motivo del catálogo — un ajuste con `previousQuantity` resuelto en `0` (si nunca hubo stock) y `newQuantity` la carga inicial real.                                                                |
| Producción, Consumo Interno                                                           | Motivos del catálogo — la integración real con producción (BOM, consumo de componentes) es Fase 05 Parte 08, todavía sin código; acá solo se cubre el caso de un ajuste manual con ese motivo.     |
| Transferencia Correctiva                                                              | **No mapea a nada especial** — es un ajuste común con el motivo que corresponda; no hay vínculo estructural con `stock_transfers` (fuera de alcance, no fue pedido con más detalle que el nombre). |

Ninguna de estas traducciones agregó una tabla o columna nueva — todo el pedido se resolvió con el
schema certificado tal cual está.

## 4. Riesgos y decisiones de alcance

- **Concurrencia** (pedido explícito de esta parte): implementado bloqueo real de filas
  (`SELECT ... FOR UPDATE`, ver `stock-lock.util.ts`) en el motor de movimientos compartido — cierra
  el riesgo que Parte 02/03 habían dejado documentado, no solo para ajustes sino para movimientos,
  transferencias y reservas también (un solo fix en el punto compartido, no uno por parte). Detalle
  técnico completo en `INVENTORY_HEALTH_REPORT.md §5` (esta parte).
- **Sin atomicidad completa entre `confirmar()` y el cambio de `status`**: igual que Transferencias
  (`INVENTORY_RESERVAS_TRANSFERENCIAS_REPORT.md §4`) — el lote de movimientos se aplica en una
  transacción, el `status: 'confirmed'` es una escritura aparte inmediatamente después. Riesgo bajo,
  mismo criterio de aceptación que en Parte 03.

## 5. Versión

`0.9.0` → `0.10.0` (`MINOR`). Ver `VERSION.md`.
