# Módulo Ventas

> Parte 01 (`v0.11.0`, POS Parte 01: la venta de mostrador es una factura
> directa) + FASE 04 Parte 1 (`v0.22.0`, Motor de Facturación Enterprise:
> ciclo de vida completo de la factura). Diseño completo en
> `docs/reports/ventas/INVOICE_ARCHITECTURE.md`.

## Responsabilidad

Motor de facturación: crear/editar/eliminar borrador, confirmar
(`draft → issued`), anular (`→ cancelled`, estado final), duplicar,
listar con filtros/orden, y registrar recibos de cobro contra una
factura. Calcula impuestos reales por línea (tasa vigente) y un
descuento general por factura, además del descuento por línea.

## Entidades que este módulo posee

- `sales.invoices` + `sales.invoice_lines` (vía `FacturaRepository`) —
  `invoices` está particionada por `issued_at`; el repositorio no
  extiende `BaseRepository` porque el cliente Prisma generado solo
  expone la clave compuesta `(id, issued_at)`, nunca `id` suelto (mismo
  motivo que `MovimientoStockRepository` en `inventario`).
- `sales.invoice_status` (vía `EstadoFacturaRepository`, catálogo de
  solo lectura, sí extiende `BaseRepository`).
- `sales.receipts` + `sales.receipt_allocations` (recibos de cobro,
  vía `VentasService.registrarRecibo`).

## Estados de una factura

`draft → issued` (confirmar) o `draft`/`issued` → `cancelled` (anular,
estado final — no se puede anular dos veces). Editar/eliminar un
borrador exige `draft`; ambos responden `409` si la factura ya avanzó
de estado.

## Con qué módulos colabora (síncrono)

- **`pos`** — `PosCheckoutService` invoca `crearFactura`/
  `registrarRecibo`/`confirmarFactura`/`listar`/`obtener` como parte del
  checkout completo y de suspender/recuperar venta.
- **`clientes`**/**`productos`**/**`configuracion`** (impuestos) — vía
  repositorios de lookup (`ClienteLookupRepository`,
  `ProductoLookupRepository`, `EmpresaSucursalLookupRepository`),
  siempre de solo lectura.
- **`crm`** (integración de solo lectura) — `OportunidadesService.ganar()`
  registra la referencia al pedido/factura resultante sin invocar a
  `ventas` directamente (`CRM_ARCHITECTURE.md §7`).

## Permisos

`ventas.ver`, `ventas.gestionar_ventas` — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Eventos de dominio

`FacturaCreadaEvent`/`FacturaConfirmadaEvent`/`FacturaAnuladaEvent`
(`events/`) — "preparados, sin publicar todavía", mismo patrón que
`auth`/`seguridad`. `EventBusService` (`core/messaging`) existe pero
ningún módulo del proyecto publica en él todavía.

## Fuera de alcance (Parte 1)

Cotizaciones, Pedidos, Compras, Facturación Electrónica, Contabilidad y
Cuentas por Cobrar avanzadas — explícitamente excluidas del pedido de
esta parte. Vista previa/PDF/impresión/envío por correo de la factura
— sin librería de PDF en el proyecto todavía, documentado como Parte 2.

## Tests

40 tests (entidad + servicio + eventos de dominio + integración real
end-to-end contra Postgres/Redis/RabbitMQ,
`controllers/facturas.controller.e2e-spec.ts`). `nx run ventas-backend:test`.
