# Módulo Clientes

> Parte 01 (Cliente mínimo, requisito del checkout de POS) + Parte 02
> (Customer 360: Contactos, Direcciones, Cuentas por Cobrar). Diseño
> completo en `docs/reports/crm/CRM_ARCHITECTURE.md §13`, roadmap de las
> partes restantes en `docs/reports/crm/CRM_ROADMAP.md` (anexo).

## Responsabilidad

CRUD de clientes (`customers.customers`) + resolución del cliente
sentinela "Consumidor Final" (requisito del checkout de POS) + Customer
360: contactos, direcciones y cuentas por cobrar de cada cliente.

## Entidades que este módulo posee

- `customers.customers` (vía `ClienteRepository`).
- `customers.customer_contacts` (vía `ContactoClienteRepository`) — a lo
  sumo un contacto `isPrimary` por cliente.
- `customers.customer_addresses` (vía `DireccionClienteRepository`) — a
  lo sumo una dirección `isDefault` por cliente. `address_type` limitado
  por CHECK de base a `billing`/`shipping`/`other`.
- `customers.v_accounts_receivable_aging` (vista de solo lectura, vía
  `CuentaPorCobrarRepository`, `$queryRaw` parametrizado — no es un
  modelo de Prisma, ver cabecera de `cuenta-por-cobrar.repository.prisma.ts`).

## Con qué módulos colabora (síncrono)

- **`crm`** — `LeadsService.convertir()` invoca `ClientesService.crear()`.
- **`pos`** — checkout resuelve el cliente sentinela "Consumidor Final"
  vía `ClientesService.obtenerOCrearConsumidorFinal()`.
- **`sales`** (integración de solo lectura) — `v_accounts_receivable_aging`
  lee facturas emitidas por `sales` para calcular el saldo abierto por
  antigüedad; `clientes` nunca escribe en tablas de `sales`.

## Permisos

`clientes.ver`, `clientes.gestionar_clientes`,
`clientes.ver_contactos`/`clientes.gestionar_contactos`,
`clientes.ver_direcciones`/`clientes.gestionar_direcciones`,
`clientes.ver_cuentas_por_cobrar` — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Frontend

`modules/clientes/frontend` (`@gorazus/modules/clientes-frontend`, barrel
separado del backend — ver cabecera de `modules/clientes/index.ts`):
listado, detalle, pestañas Contactos/Direcciones. Rutas restantes
(Categorías, Notas/Timeline, Crédito, Tags, Documentos, Dashboard)
pendientes de su backend correspondiente, ver `CRM_ROADMAP.md`.

## Tests

36 tests (entidades + servicios + integración real end-to-end contra
Postgres/Redis/RabbitMQ, `controllers/clientes.controller.e2e-spec.ts`).
`nx run clientes-backend:test`.
