# Test Report — Fase 05, Inventario Enterprise, Parte 04

## 1. Qué se agregó

- 4 specs de entidad nuevas: `motivo-ajuste.entity.spec.ts` (2 tests), `ajuste-stock.entity.spec.ts`
  (4 tests), `conteo-fisico.entity.spec.ts` (3 tests), `programa-conteo-ciclico.entity.spec.ts`
  (3 tests).
- 4 specs de servicio nuevas: `motivos-ajuste.service.spec.ts` (4 tests),
  `ajustes.service.spec.ts` (11 tests — cubre las 3 validaciones de existencia, la resolución
  automática de `previousQuantity`, ambas direcciones de ajuste, y el chequeo de tipo de movimiento
  no configurado), `conteos.service.spec.ts` (17 tests — el más extenso: cubre las 2 formas de
  crear líneas, validación de zona ajena al almacén, las 3 transiciones de estado, la captura ciega
  verificada explícitamente sin `systemQuantity` en la respuesta, conteo incompleto, y ambos casos
  de `completar` con y sin discrepancias), `programacion-conteos.service.spec.ts` (7 tests — incluye
  el cálculo real de `next_run_date` en dos escenarios, con y sin fecha previa).
- 1 e2e nuevo: `ajustes-conteos.controller.e2e-spec.ts` — flujo completo de ajuste (crear→confirmar→
  verificar stock real), flujo completo de conteo (crear→iniciar→capturar ciego→completar→ajuste
  generado→confirmar→verificar stock), conteo incompleto rechazado, zona ajena rechazada, y
  programación cíclica completa (crear→generar, verificando que el conteo generado incluye
  exactamente los productos de esa zona y ninguno fuera de ella).

## 2. Corrida real de esta sesión

```
Test Suites: 24 passed, 24 total
Tests:       153 passed, 153 total
```

Corrida solo de la suite unitaria (`--testPathIgnorePatterns=e2e-spec`) — **153/153 pasando**,
incluye los 51 tests nuevos de esta parte más los 101 ya existentes de Parte 01-03, sin
regresiones. Los 3 e2e del paquete (`almacenes`, `stock-movimientos`, `reservas-transferencias`,
`ajustes-conteos`) no se corrieron contra Postgres real esta sesión — Docker Desktop sigue caído
(8ª sesión consecutiva) — pero **sí compilan limpio**: `nx build`/`nx lint` sobre el proyecto
completo (que sí procesa los `.e2e-spec.ts`) terminó sin un solo `error TS` ni warning de lint.

## 3. Incidente de esta sesión: memoria del sistema agotada por procesos huérfanos

Durante la verificación se detectó que 55 procesos `jest-worker` quedaron huérfanos de corridas de
test anteriores interrumpidas por reinicios de sesión — dejaron el sistema con ~1.2 MB de RAM libre
de 33 GB, haciendo que cualquier comando nuevo se colgara sin poder arrancar. No es un bug de este
código — se diagnosticó con `Get-CimInstance Win32_Process`, se confirmó que los procesos ya se
habían liberado solos para cuando se intentó terminarlos manualmente, y la corrida siguiente
completó normal con ~19 GB libres. Se documenta acá porque interrumpió la verificación de esta
parte más que en partes anteriores — no es deuda de código, es higiene de entorno de sesiones largas
con múltiples reinicios.

## 4. Cobertura de la lógica nueva — por caso

- **`AjustesService`**: almacén/motivo/producto inexistentes, resolución de `previousQuantity` real,
  confirmar ya confirmado, sin diferencia no genera movimiento, incremento y decremento generan el
  tipo de movimiento correcto, tipo de movimiento no configurado.
- **`ConteosService`**: almacén inexistente, zona ajena al almacén, producto de `productIds`
  inexistente, resolución real de `systemQuantity` (con `productIds` y autogenerado), sin stock para
  autogenerar, transiciones de estado completas (las 3, válidas e inválidas), captura verificada
  explícitamente sin exponer `systemQuantity`, línea de captura inexistente, completar con líneas
  sin capturar, completar sin discrepancias (sin ajuste) y con discrepancias (genera ajuste real vía
  `AjustesService`, motivo no configurado).
- **`ProgramacionConteosService`**: frecuencia inválida, zona inexistente, `generar()` resuelve
  correctamente `warehouseId`/`zoneId` desde la zona, y el cálculo de `next_run_date` en los dos
  escenarios reales (primera vez vs. ya programado).
- **e2e**: el caso más valioso es la verificación numérica real end-to-end — 50 en existencia,
  ajuste a 40 (verificando `previousQuantity: "50"` devuelto por la API), confirmar, verificar
  `quantityOnHand: 40`; después un conteo sobre esos 40 que captura 35, completa, genera y confirma
  el ajuste automático, y verifica `quantityOnHand: 35` final. Para la programación cíclica: producto
  cargado en una ubicación de una zona específica, `generar()` desde la programación de esa zona, y
  verificación de que el conteo resultante incluye ese producto y **no** incluye el producto cargado
  fuera de la zona.

## 5. Sobre el pedido de "cobertura superior al 90%"

No se corrió `--coverage` con umbral real esta sesión — el `coverageThreshold` del proyecto sigue en
el piso de seguridad (5%, documentado desde antes en `TECHNICAL_DEBT.md`), no es una medida
representativa todavía. Lo que sí es verificable y honesto: **cada rama de validación de cada
servicio nuevo tiene al menos un test dedicado** (confirmado línea por línea en §4) — es la métrica
real que se puede sostener sin inventar un número de cobertura no medido.

## 6. Pendiente de re-confirmar cuando Docker esté arriba

Lo mismo que partes anteriores, más: que la nueva captura ciega y la generación automática de
ajustes desde un conteo se comporten igual bajo Postgres/RLS real que en los fakes de unit test, y
que el bloqueo de filas (`SELECT ... FOR UPDATE`) efectivamente serialice dos movimientos
concurrentes en vez de solo compilar — eso requiere una prueba de concurrencia real contra Postgres,
no simulable con fakes de Jest.
