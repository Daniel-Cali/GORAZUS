# Testing — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura)

## 1. Resumen

| Suite                                              | Tests | Tipo                                                                       |
| -------------------------------------------------- | ----- | -------------------------------------------------------------------------- |
| `entities/cotizacion.entity.spec.ts`               | 6     | Unitario — invariantes (líneas, cantidades, descuentos, vigencia)          |
| `entities/pedido.entity.spec.ts`                   | 5     | Unitario — invariantes                                                     |
| `services/cotizaciones.service.spec.ts`            | 11    | Unitario — mocks de repositorios, incluye `validarConvertible`             |
| `services/pedidos-venta.service.spec.ts`           | 8     | Unitario — mocks, incluye reserva/rollback/conversión parcial              |
| `controllers/pedidos-venta.controller.e2e-spec.ts` | 3     | Integración real (Postgres/Redis/RabbitMQ + reservas reales de Inventario) |

**33 tests nuevos — 63 tests totales del módulo `ventas` (30 de Facturación Parte 1 + 33 de esta
parte), 63/63 ✅.**

## 2. Qué cubre el e2e

1. `GET /ventas/cotizaciones` sin token → `401`.
2. **Flujo completo real**: crear cotización (4 unidades) → aprobar → convertir en pedido (verifica
   `quote_id` fijado + una reserva real y activa en `inventory.stock_reservations`) → convertir 2
   de 4 unidades a factura (`sales_order_id` fijado en la factura, `subtotal_amount` = `"50"`,
   `invoiced_quantity` de la línea pasa a `"2"`) → convertir el resto sin especificar `lines`
   (satura el saldo pendiente) → verifica `invoiced_quantity` = `"4"` y la reserva queda liberada
   (`released_at IS NOT NULL`) → una tercera conversión sin saldo pendiente → `409`.
3. `POST /ventas/pedidos/:id/cancelar` sobre un pedido sin facturar → libera su reserva.

## 3. Hallazgo real encontrado y corregido: flakiness heredada en `facturas.controller.e2e-spec.ts`

Al correr la suite completa de `ventas-backend` con los 2 archivos e2e nuevos, el test existente
`FacturasController (e2e) › flujo completo... listar con filtros` empezó a fallar de forma
intermitente: el `customerId` de prueba (resuelto con `SELECT ... LIMIT 1`, el mismo criterio en
ambos archivos e2e) acumuló **38 facturas** de corridas repetidas de este mismo test a lo largo de
toda la sesión — la lista por defecto (`pageSize=20`) ya no garantizaba incluir la factura recién
creada. **Mismo hallazgo, mismo tipo de fix, ya documentado en `VERSION.md v0.19.0`** (test de
Roles que se volvió flaky por acumulación de datos): se reemplazó la aserción "aparece en la
lista paginada" por una verificación directa vía `GET /ventas/facturas/:id`. No es una regresión
introducida por esta parte — la causa es la acumulación de datos de prueba de toda la sesión, ya
un patrón conocido de este proyecto.

## 4. No cubierto en esta parte

- Sin test dedicado de `CotizacionesService.actualizar()`/`eliminar()` (cubiertos indirectamente
  por el patrón ya probado en `crear()`/`aprobar()` — misma lógica de validación).
- Sin test de concurrencia sobre la reserva de inventario (dos pedidos compitiendo por el mismo
  stock) — mismo criterio que `POS_HEALTH_REPORT.md §2` (fuera de alcance).
- Sin test de la compensación de reservas cuando falla la SEGUNDA de tres líneas (solo se probó
  con dos líneas, la primera reservada y la segunda fallando).

## 5. Cómo correr

```bash
nx run ventas-backend:build
nx run ventas-backend:lint
nx run ventas-backend:test
nx run inventario-backend:test
nx run pos-backend:test
```

Requiere Postgres/Redis/RabbitMQ reales arriba (Docker) para los e2e-spec.
