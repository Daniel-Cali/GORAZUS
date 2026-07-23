# Test Report — Fase 05, Inventario Enterprise, Parte 02

## 1. Qué se agregó

- 3 specs de entidad nuevas: `tipo-movimiento-stock.entity.spec.ts` (4 tests), `stock.entity.spec.ts`
  (5 tests), `movimiento-stock.entity.spec.ts` (7 tests).
- 3 specs de servicio nuevas: `tipos-movimiento.service.spec.ts` (7 tests, incluye el caso "cambiar
  `direction` con movimientos ya registrados" y "mantener el mismo `code` no dispara duplicado"),
  `stock.service.spec.ts` (3 tests, incluye "sin fila de stock devuelve todo en cero"),
  `movimientos.service.spec.ts` (9 tests — el más importante: cubre las 4 validaciones de
  existencia en orden, la resolución de `direction` desde el tipo, y la traducción de
  `StockInsuficienteError` del repositorio a `StockInsuficienteException` de dominio).
- 1 e2e nuevo: `stock-movimientos.controller.e2e-spec.ts` — flujo completo tipo de movimiento →
  entrada → salida → stock → kardex → listado de movimientos → rechazo de cambio de `direction`
  con historial, más 2 casos negativos (producto/almacén inexistentes). Primer e2e del proyecto que
  compone dos módulos de negocio reales en el mismo `TestingModule` (`InventarioModule` +
  `ProductosModule`) para crear un producto real vía su propia API en vez de un insert crudo.

## 2. Corrida real de esta sesión

```
Test Suites: 2 failed, 12 passed, 14 total
Tests:       8 failed, 67 passed, 75 total
```

Los 2 `FAIL` son los 2 e2e del paquete (`almacenes.controller.e2e-spec.ts`, preexistente, y
`stock-movimientos.controller.e2e-spec.ts`, nuevo) — **ambos fallan exclusivamente** con
`PrismaClientInitializationError: Can't reach database server at localhost:5432` (Docker Desktop
caído, 7ª sesión consecutiva). `grep -c "error TS"` sobre la salida completa: **0** — confirma que
el e2e nuevo compila limpio, la falla es 100% de infraestructura, no de código. Los 67 tests
unitarios (12 suites) pasan, incluyendo los 32 nuevos de esta parte.

## 3. Cobertura de la lógica nueva — por caso

- **`MovimientosService.registrar`**: tipo de movimiento inexistente, cantidad cero (defensa en
  profundidad de la entidad — Zod ya la bloquea antes en el controller, el test verifica que el
  servicio también la rechaza si se lo llama directo), producto/almacén/ubicación inexistentes,
  caso feliz de entrada (verifica `direction: 'in'`, `companyId`/`branchId` resueltos del almacén),
  caso feliz de salida (verifica `direction: 'out'` resuelta del tipo), traducción de
  `StockInsuficienteError` a excepción de dominio.
- **`TiposMovimientoService`**: duplicado en `crear`, no encontrado en `obtener`, cambiar
  `direction` sin historial (permitido) vs. con historial (rechazado, `409`), cambiar `code` a uno
  duplicado (rechazado) vs. mantener el mismo `code` (no dispara la validación).
- **`StockService.obtenerDisponible`**: cálculo de disponible con fila real, y el caso sin fila
  (todo en cero, no un error — un producto sin movimientos todavía no tiene por qué fallar la
  consulta).
- **e2e**: el caso más valioso es el flujo completo verificando que el `quantity_on_hand` real en
  base de datos coincide con lo esperado después de 2 movimientos (100 entrada, 30 salida = 70), que
  una salida excesiva (409) **no** modifica el stock (se vuelve a consultar después del rechazo), y
  que el kardex real (`v_kardex`, vista de Postgres) devuelve el mismo saldo corrido.

## 4. Pendiente de re-confirmar cuando Docker esté arriba

Todo lo que la suite unitaria no puede probar con fakes: la transacción atómica real
(`withTenantScope` + `$transaction`) entre `stock` y `stock_movements`, el particionado mensual de
`stock_movements` funcionando con inserts reales, y la consulta `$queryRawUnsafe` contra
`inventory.v_kardex` bajo RLS real (confirmar que un tenant no ve el kardex de otro). El diseño de
estos tres puntos está razonado en `INVENTORY_STOCK_REPORT.md`, pero razonado no es lo mismo que
verificado contra Postgres real — pendiente explícito, no una afirmación de que ya está probado.
