# Testing — Motor de Facturación

## 1. Resumen

| Suite                                         | Tests | Tipo                                                                                                                                                                                  |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities/factura.entity.spec.ts`             | 5     | Unitario — invariantes de la entidad                                                                                                                                                  |
| `events/facturacion-domain-events.spec.ts`    | 3     | Unitario — `toPayload()`/`routingKey` de los 3 eventos nuevos                                                                                                                         |
| `services/ventas.service.spec.ts`             | 17    | Unitario — mocks de repositorios (crearFactura x6, actualizarBorrador x2, eliminarBorrador x2, anularFactura x3, duplicarFactura x1, confirmarFactura/obtener/registrarRecibo x1 c/u) |
| `controllers/facturas.controller.e2e-spec.ts` | 5     | Integración real (Postgres/Redis/RabbitMQ)                                                                                                                                            |

**30 tests totales del módulo `ventas`, 30/30 ✅.**

## 2. Qué cubre el e2e (`facturas.controller.e2e-spec.ts`)

Dos flujos completos contra infraestructura real, más 2 casos de validación negativa:

1. **Flujo confirmar/anular**: `POST` crear (con `generalDiscountPercentage: 10`, verifica
   `subtotal_amount` = `"90"` = 100 - 10%) → `GET` detalle (verifica líneas) → `PUT` editar (nuevas
   líneas, verifica `subtotal_amount` = `"120"`) → `GET` listar con `customerId`+`sortBy`+`sortDir`
   (verifica que la factura aparece) → `POST` confirmar (`201`) → `PUT`/`DELETE` sobre la ya
   confirmada (ambos `409`, ya no es `draft`) → `POST` anular (`201`) → `POST` anular de nuevo
   (`409`, ya estaba anulada).
2. **Flujo borrador**: `POST` crear → `POST` duplicar (`201`, `id` distinto, mismo `customer_id`) →
   `DELETE` eliminar (`200`, `deleted_at` poblado).
3. `POST` crear con `generalDiscountPercentage: 150` (fuera de rango 0-100) → `400` (rechazado por
   Zod antes de tocar la base).
4. `GET /ventas/facturas/:id` con id inexistente → `404`.
5. `GET /ventas/facturas` sin token → `401`.

Setup real (`beforeAll`): tenant/usuario/empresa/sucursal/cliente/producto resueltos con consultas
directas a Postgres (nunca hardcodeados ni creados vía HTTP cruzando módulos), JWT firmado
directamente con `jsonwebtoken` (sin pasar por login real), `TestingModule` con
`ConfigModule`/`LoggingModule`/`HttpModule`/`CacheModule`/`StorageModule`/`DatabaseModule`/
`SeguridadModule` (requerido por `AvatarUsuarioService` interno, `@Global()` pero necesita import
explícito en test) + `VentasModule`.

## 3. Hallazgos corregidos durante la escritura de tests

- **`Decimal` serializa distinto de lo esperado**: un valor entero de un campo `Decimal(N,4)`
  serializa a JSON como `"90"`, no `"90.0000"` — 2 aserciones del e2e se ajustaron a la
  serialización real de Prisma, no a lo que parecía intuitivo.
- **Mock de `actualizar()` en `ventas.service.spec.ts`** inicialmente esparcía los `params`
  camelCase directo sobre un objeto `factura` con claves snake_case — producía una aserción falsa
  (`100` en vez de `120`). Corregido mapeando explícitamente cada campo
  (`params.subtotalAmount` → `subtotal_amount`, etc.) en el mock.
- **Casts de tipo en los mocks** (`as unknown as Partial<FacturaConLineas>`,
  `as unknown as FacturaConLineas`) necesarios porque los objetos de prueba no replican el tipo
  `Decimal` real de Prisma — no son un indicio de un problema de tipos en el código de producción,
  solo de los fixtures de test.

## 4. No cubierto en esta parte

- `POST /ventas/facturas/:id/recibos` no tiene un caso e2e dedicado en este archivo (sí lo tenía en
  la suite original de POS, `pos-checkout.service.spec.ts`, indirectamente vía
  `confirmarVenta`) — riesgo bajo, mismo guard de permisos que el resto del controlador.
- Sin pruebas de carga/concurrencia sobre el motor de facturación (mismo criterio que `POS_HEALTH_
REPORT.md §2` — fuera de alcance de esta parte).
- Sin prueba automatizada de la propagación del `ALTER TABLE` a las particiones hijas de
  `sales.invoices` más allá de la verificación manual por SQL al aplicar la migración 40.

## 5. Cómo correr

```bash
nx run ventas-backend:build
nx run ventas-backend:lint
nx run ventas-backend:test
nx run pos-backend:build
nx run pos-backend:test
```

Requiere Postgres/Redis/RabbitMQ reales arriba (Docker) para el e2e-spec — no usa mocks de
infraestructura.
