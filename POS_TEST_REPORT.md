# Informe de Pruebas — Punto de Venta (POS)

## 1. Tests unitarios

| Suite                                           | Tests  | Estado       |
| ----------------------------------------------- | ------ | ------------ |
| `modules/clientes/backend` (entidad + servicio) | 10     | ✅ 10/10     |
| `modules/caja/backend` (entidad + servicio)     | 10     | ✅ 10/10     |
| `modules/ventas/backend` (entidad + servicio)   | 13     | ✅ 13/13     |
| `modules/pos/backend` (orquestador de checkout) | 9      | ✅ 9/9       |
| **Total nuevo**                                 | **42** | **✅ 42/42** |

Cubren: validaciones de invariantes de entidad, rechazo de empresa/sucursal/cliente/producto
inválido, cálculo real de impuestos por línea (con y sin tasa vigente), resolución de "Consumidor
Final", pago insuficiente, caja sin apertura, stock insuficiente, cálculo de cambio (exacto y con
vuelto), suspender venta sin tocar stock ni caja.

### Regresión sobre Inventario (código ya existente, no tocado en su lógica de negocio salvo el fix del §3)

`inventario-backend` completo: **24/24 suites, 153/153 tests** — sin regresiones tras el fix de
doble aplicación de stock (`movimiento-stock.repository.prisma.ts`) ni tras el nuevo método
aditivo `TiposMovimientoService.resolverPorCodigo`.

## 2. Verificación end-to-end contra infraestructura real

A diferencia de fases anteriores (Docker caído la mayor parte de la sesión), esta vez Docker
Desktop estuvo arriba desde el principio — se pudo probar el flujo completo contra Postgres/Redis/
RabbitMQ/MinIO reales, no solo unitarios con mocks.

Secuencia real ejecutada por `curl` contra la API corriendo:

1. Login (`admin@demo.local` / tenant `demo`) → JWT real.
2. Crear unidad de medida, producto (`TORNILLO-1P`, luego `MARTILLO-2P`), almacén.
3. Registrar movimiento de entrada de stock (100 unidades) → **detectó y forzó la corrección de
   dos bugs reales preexistentes** (§3).
4. Crear caja POS, abrir turno.
5. `GET /pos/productos?query=MARTILLO` → resultado correcto (sku, precio, unidad).
6. `POST /pos/ventas` (3 unidades a $25 = factura $75, luego 5 unidades a $40 = factura $200) →
   factura creada, stock descontado, recibo + movimiento de caja registrados, factura confirmada.
7. Verificación numérica directa contra la base: `quantity_on_hand` = 50 tras la entrada, 45 tras
   vender 5 — **exacto**, no el doble ni la mitad.
8. `cash.cash_movements` con los montos correctos (`75.0000`, `200.0000`) y `source_module='pos'`.

## 3. Bugs reales encontrados y corregidos durante esta verificación

Ninguno de los dos bugs siguientes se había detectado antes porque Docker llevaba caído desde
antes de que se escribiera el código afectado (Fase 05 Parte 02/04) — esta es la primera vez que
ese camino corre contra Postgres real.

1. **`stock-lock.util.ts` — `operator does not exist: uuid = text`.** `$queryRawUnsafe` con
   placeholders posicionales sin cast explícito — Postgres no puede inferir el tipo dentro de
   `IS NOT DISTINCT FROM` y cae a `text`. Fix: `::uuid` explícito en los 3 parámetros.
2. **Doble aplicación de movimientos de stock.** `inventory.fn_apply_stock_movement` (trigger
   `AFTER INSERT ON stock_movements`, `docs/database/sql/26_triggers.sql`) ya aplica el delta a
   `inventory.stock` — la aplicación (`aplicarMovimiento`) también lo escribía a mano. Cada
   movimiento se aplicaba dos veces (100 de entrada quedaba en 200; una salida de 3 sobre eso
   quedaba en 194 en vez de 97). Fix: la aplicación ya no escribe `inventory.stock`, delega
   enteramente en el trigger y relee para devolver el saldo real. Afectaba potencialmente a todo
   movimiento registrado desde Fase 05 Parte 02 (Movimientos, Transferencias, Ajustes) en
   cualquier entorno con el trigger activo — este proyecto nunca tuvo uno hasta ahora.

Ver `POS_DATABASE.md §5` y el commit `fix(inventario): eliminar doble aplicacion de movimientos de
stock` para el detalle completo.

## 4. Frontend — verificado con navegador real (Playwright, no solo lint/tsc)

Flujo completo ejecutado en Chromium headless contra la app real:

1. Login vía formulario real → sesión.
2. `/pos` → `CashRegisterGate` (sin apertura activa) → seleccionar empresa → sucursal → caja
   existente ("Caja 1", ya abierta de la verificación de API) → pantalla principal del POS.
3. Escribir "MARTILLO" en el buscador + Enter → un solo resultado → se agrega automáticamente al
   carrito con precio real ($40.00).
4. "Cobrar (F5)" → modal de pago con el total prellenado, botón "Agregar otro pago (mixto)".
5. "Confirmar venta" → toast "Venta confirmada — Comprobante POS-... — cambio $0.00", carrito
   vacío, header actualizado con el último comprobante.

**Cero errores de consola en cualquiera de los pasos.** Capturas de cada paso disponibles (no
versionadas, generadas durante la sesión de verificación).

### Bug de frontend encontrado y corregido durante esta verificación

`modules/pos/index.ts` reexportaba `PosModule` (backend, NestJS) junto con `posRoutes` (frontend)
desde el mismo archivo. Al importarlo desde `apps/web/src/app/router.tsx` (Vite, sin tree-shaking
real en modo desarrollo), arrastraba toda la cadena de clientes Prisma al bundle del navegador —
`Cannot find export 'PrismaClient'` en `accounting/generated/index-browser.js`, rompiendo la
página completa. Fix: el barrel de `pos` solo expone `posRoutes` — igual que `modules/auth/index.ts`
ya hacía, un patrón que hasta ahora nadie había roto por accidente.

## 5. Fuera de alcance (documentado, no fingido)

- **Pruebas de hardware de lector de código de barras real** — se probó el camino de software
  (`BarcodeScannerInput` recibe texto + Enter, indistinguible de tipeo rápido); no hay forma de
  probar un lector físico en este entorno.
- **Pruebas de carga/concurrencia a escala (k6)** — no se ejecutaron; el checkout reutiliza el
  bloqueo de filas real de Inventario (verificado en Fase 05 Parte 04) pero no se sometió a carga
  concurrente sostenida en esta fase.
- **e2e automatizado (Jest + Testing Module)** — no se escribió un e2e-spec de NestJS para POS en
  esta fase (la verificación real fue manual vía `curl` + Playwright, documentada arriba); queda
  como trabajo pendiente formalizarlo en un `*.e2e-spec.ts` para que corra en CI.
