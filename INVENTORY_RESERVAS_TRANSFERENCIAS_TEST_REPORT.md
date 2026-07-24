# Test Report — Fase 05, Inventario Enterprise, Parte 03

## 1. Qué se agregó

- 2 specs de entidad nuevas: `reserva-stock.entity.spec.ts` (5 tests), `transferencia.entity.spec.ts`
  (5 tests, incluye el invariante nuevo "origen y destino no pueden ser el mismo almacén").
- 2 specs de servicio nuevas: `reservas.service.spec.ts` (8 tests, incluye la traducción de
  `CapacidadReservaInsuficienteError`/`ReservaYaLiberadaError`/`ReservaNoEncontradaError`),
  `transferencias.service.spec.ts` (13 tests — el más importante: cubre las 4 transiciones de
  estado válidas/inválidas, la resolución de tipos de movimiento por código, y que `iniciar`/
  `recibir` arman el lote correcto por línea con el almacén origen/destino correcto).
- `movimientos.service.spec.ts` ampliado con 3 tests nuevos para `registrarLote` (valida cada item,
  delega en un solo llamado al repositorio, traduce `StockInsuficienteError`).
- 1 e2e nuevo: `reservas-transferencias.controller.e2e-spec.ts` — flujo completo de reservas
  (reservar → verificar disponible → exceder capacidad → verificar que una salida no puede pisar lo
  reservado → liberar → verificar idempotencia) y de transferencias (crear → iniciar → verificar
  stock en origen → recibir → verificar stock en destino → intentar cancelar ya recibida → 409).

## 2. Corrida real de esta sesión

```
Test Suites: 3 failed, 16 passed, 19 total
Tests:       13 failed, 101 passed, 114 total
```

Los 3 `FAIL` son los 3 e2e del paquete (`almacenes.controller.e2e-spec.ts`,
`stock-movimientos.controller.e2e-spec.ts`, ambos preexistentes, y
`reservas-transferencias.controller.e2e-spec.ts`, nuevo) — **los 3 fallan exclusivamente** con
`PrismaClientInitializationError: Can't reach database server at localhost:5432` (Docker Desktop
caído). `grep -c "error TS"` sobre la salida completa: **0**. Los 101 tests unitarios (16 suites)
pasan, incluyendo los 34 nuevos de esta parte.

## 3. Cobertura de la lógica nueva — por caso

- **`ReservasService.crear`**: cantidad cero (defensa en profundidad de la entidad), producto/
  almacén inexistentes, capacidad insuficiente traducida a excepción de dominio, caso feliz
  verificando `companyId`/`branchId` resueltos del almacén.
- **`ReservasService.liberar`**: reserva inexistente, reserva ya liberada, caso feliz.
- **`TransferenciasService`**: origen=destino (defensa en profundidad de la entidad), almacenes
  inexistentes (origen y destino por separado), producto de línea inexistente, transición inválida
  en cada uno de los 3 métodos de transición (`iniciar` desde no-`draft`, `recibir` desde no-
  `in_transit`, `cancelar` desde no-`draft`), tipo de movimiento no configurado, y los 2 casos
  felices verificando que el lote de movimientos se arma con el almacén correcto (origen para
  `transfer_out`, destino para `transfer_in`) y el `sourceModule`/`sourceEntityId` apuntando a la
  transferencia.
- **`MovimientosService.registrarLote`**: cubre exactamente el mismo tipo de validación que
  `registrar` pero para el camino multi-línea, más la propagación de errores.
- **e2e**: el caso más valioso es la verificación numérica real contra la base de datos — 50 en
  existencia, reservar 30, verificar `quantityAvailable=20`, que una salida de 40 se rechace (409)
  porque dejaría `on_hand` por debajo de lo reservado, liberar, verificar que vuelve a 50
  disponibles. Para transferencias: 100 en origen, transferir 25, verificar 75 en origen tras
  `iniciar` y 25 en destino tras `recibir` — números reales, no solo códigos de estado.

## 4. Pendiente de re-confirmar cuando Docker esté arriba

Lo mismo que Parte 02, más: la atomicidad real de `registrarLote` bajo Postgres real (que un fallo a
mitad del lote efectivamente revierta todo, no solo en la lógica de fakes), y que la corrección del
chequeo de stock suficiente (`quantity_available` en vez de `quantity_on_hand`) se comporte igual
bajo RLS real que en los fakes de unit test.
