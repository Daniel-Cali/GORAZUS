# Arquitectura — Motor de Facturación (`modules/ventas/backend`)

## 1. Alcance de esta parte

FASE 04, Parte 1 — pedido original: construir el Motor de Facturación Enterprise con arquitectura
CQRS/DDD (Application/Domain/Infrastructure/Presentation), Value Objects, Factories, stack PHP/
PostgreSQL/Redis. **Ninguna de esas dos cosas aplica**: el stack real del monorepo es NestJS 10 +
TypeScript + Prisma (Nx), y ningún módulo de negocio de GORAZUS usa CQRS ni Value Objects — Clean
Architecture por módulo (entidad + repositorio + servicio + controlador + validadores Zod) es el
patrón real, confirmado y reforzado explícitamente en Roles Enterprise (`v0.18.0`-`v0.21.0`, mismo
tipo de pedido con la misma arquitectura ajena).

Segundo hallazgo, más importante: `modules/ventas/backend` **ya existía** desde `v0.11.0` (POS
Parte 01) con un motor de facturación real y funcionando — entidad `Factura`, `VentasService` con
`crearFactura`/`confirmarFactura`/`obtener`/`listar`/`registrarRecibo`, `FacturaRepository` sobre
`sales.invoices` (particionada), repositorios de lookup completos, `FacturasController` con
endpoints reales. Esta parte **extiende** ese módulo — no construye uno paralelo.

Explícitamente fuera de alcance (pedido por el propio prompt): Cotizaciones, Pedidos, Compras, POS
(ya integrado desde `v0.11.0`), Facturación Electrónica, Contabilidad, Cuentas por Cobrar
avanzadas.

## 2. Qué se agregó

| Pieza                         | Antes (`v0.11.0`)    | Ahora (`v0.22.0`)                                    |
| ----------------------------- | -------------------- | ---------------------------------------------------- |
| Crear borrador                | ✅                   | ✅ (+ descuento general)                             |
| Editar borrador               | ❌                   | ✅ `PUT /ventas/facturas/:id`                        |
| Eliminar borrador             | ❌                   | ✅ `DELETE /ventas/facturas/:id` (baja lógica)       |
| Confirmar (`draft → issued`)  | ✅                   | ✅ (sin cambios)                                     |
| Anular (`→ cancelled`)        | ❌                   | ✅ `POST /ventas/facturas/:id/anular`                |
| Duplicar                      | ❌                   | ✅ `POST /ventas/facturas/:id/duplicar`              |
| Listar                        | ✅ (solo `branchId`) | ✅ + `customerId`/`statusId`/rango de fechas + orden |
| Descuento general por factura | ❌                   | ✅ `generalDiscountPercentage`                       |
| Registrar recibo              | ✅                   | ✅ (sin cambios)                                     |
| Eventos de dominio            | ❌                   | ✅ preparados, sin publicar                          |

## 3. Estados y transiciones

```
draft --editar/eliminar (409 si no es draft)--> draft
draft --confirmar--> issued
draft --anular--> cancelled (final)
issued --anular--> cancelled (final)
cancelled --anular--> 409 (ya está anulada)
```

`cancelled` es un estado final — no existe transición de salida. `obtenerCodigoEstado()` resuelve
el código real desde `sales.invoice_status` (catálogo de solo lectura) para decidir cada
transición; nunca se compara contra un enum hardcodeado en la aplicación.

## 4. Cálculo de totales

`calcularLineas()` (privado, `VentasService`, extraído de `crearFactura` y reutilizado por
`actualizarBorrador`):

1. Por línea: `lineTotal = quantity * unitPrice * (1 - discountPercentage/100)`, impuesto real
   resuelto vía `TasaImpuestoLookupRepository` (tasa vigente a la fecha, `taxId` opcional —
   productos exentos no llevan `taxId`).
2. `subtotalBruto` = suma de `lineTotal` de todas las líneas.
3. `subtotalAmount = subtotalBruto * (1 - generalDiscountPercentage/100)` — el descuento general
   se aplica **sobre el subtotal ya neto de descuentos de línea**, nunca se combina en un solo
   porcentaje con el descuento de línea.
4. `taxAmount` se calcula **antes** de aplicar el descuento general — decisión de negocio explícita
   (documentada en `docs/database/sql/40_facturacion_descuento_general.sql`): el descuento general
   no reduce la base imponible. No hay un requisito de negocio real que indique lo contrario; si
   aparece uno, es un cambio de cálculo acotado a este método.
5. `totalAmount = subtotalAmount + taxAmount`.

## 5. Migración de base de datos

`docs/database/sql/40_facturacion_descuento_general.sql` (Database Enterprise v1.2.1, aditiva):

- `ALTER TABLE sales.invoices ADD COLUMN general_discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0`.
- CHECK `invoices_general_discount_percentage_check` (0-100).
- `sales.invoices` está particionada por `issued_at` — confirmado que `ALTER TABLE` sobre la tabla
  padre se propaga sola a todas las particiones hijas, sin necesidad de un script por partición.

## 6. Por qué no CQRS / Value Objects / Factories

- **CQRS (Commands/Queries separados)**: ningún módulo de GORAZUS lo usa — los servicios ya
  separan lectura/escritura por método (`crear`/`actualizar`/`eliminar` vs. `obtener`/`listar`) sin
  una capa de mensajería intermedia. Introducirlo solo en `ventas` habría creado dos patrones
  arquitectónicos conviviendo en el mismo monorepo sin ningún beneficio real medido.
- **Value Objects** (`InvoiceNumber`, `Money`, etc.): decisión ya tomada y documentada en Roles
  Enterprise `v0.20.0` — ningún entity del proyecto los usa, las invariantes se validan directo en
  el constructor de la entidad (`Factura`, ver `entities/factura.entity.ts`). Mismo criterio
  aplicado acá.
- **Factories**: `new Factura(...)` ya actúa como el punto único de validación de invariantes antes
  de tocar la base — una Factory explícita sería una capa de indirección sin invariante adicional
  que resolver.

## 7. Ruptura de compatibilidad detectada y corregida

Ver `INVOICE_HEALTH_REPORT.md §3` para el detalle completo del hallazgo `z.input` vs `z.infer` que
rompía `pos-backend` y su corrección.

## 8. Eventos de dominio

`FacturaCreadaEvent`/`FacturaConfirmadaEvent`/`FacturaAnuladaEvent` (`events/`) — mismo patrón
"preparado, sin publicar todavía" que `modules/auth/backend/events/*.event.ts`: `routingKey`
estático (`ventas.factura.creada`/`confirmada`/`anulada`), `toPayload()` con fechas en ISO string.
`EventBusService` (`core/messaging`) existe pero ningún módulo del proyecto publica en él
todavía — activarlo es una decisión de plataforma completa, fuera de alcance de este módulo.

## 9. Fuera de alcance, explícito

- Cotizaciones, Pedidos, Compras, Facturación Electrónica, Contabilidad, CxC avanzadas — excluidas
  por el propio pedido.
- Descuento de inventario al confirmar — no se toca stock desde `ventas`; el checkout de POS
  descuenta stock por su cuenta (`PosCheckoutService`), y crear/confirmar una factura fuera del
  flujo de POS no descuenta inventario todavía (mismo comportamiento que `v0.11.0`).
- Vista previa/PDF/impresión/envío por correo — sin librería de PDF en el proyecto, ver
  `INVOICE_HEALTH_REPORT.md §4`.
