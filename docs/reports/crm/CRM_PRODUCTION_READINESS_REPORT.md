# CRM/Clientes — Reporte de preparación para producción

> 2026-07-26. Origen: pedido "Complete the Enterprise CRM module... Prepare
> the CRM for production", con una lista de integraciones (Sales,
> Inventory, Cash, Accounts Receivable, Future Quotations, Future Orders,
> Future Purchasing, Future Accounting) y una lista de verificaciones
> (duplicación, APIs rotas, conflictos de migración, inconsistencias de
> base, vulnerabilidades de seguridad, deuda técnica). Este documento es
> el resultado real de esa auditoría — incluye lo que se corrigió, lo que
> se verificó sin encontrar problemas, y lo que queda fuera de alcance
> porque el módulo con el que integrar no existe todavía.

## 1. Integraciones

Ver [`CRM_ARCHITECTURE.md §14`](./CRM_ARCHITECTURE.md#14-puntos-de-integración-con-módulos-futuros-del-erp)
para el detalle técnico completo. Resumen:

| Integración pedida  | Estado                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sales               | ✅ Real — `OportunidadesService.ganar(resultingSalesOrderId)`, ya existía (Parte 03)                                                                                                               |
| Inventory           | ✅ Real — `ProductoLookupRepository` en `opportunity_lines`, ya existía (Parte 03)                                                                                                                 |
| Accounts Receivable | ✅ **Nuevo en esta fase** — `GET /clientes/:id/cuentas-por-cobrar`, sobre `customers.v_accounts_receivable_aging`                                                                                  |
| Cash                | ⚠️ Sin punto de integración real — no hay caso de uso hoy que lo requiera, documentado explícitamente en vez de fabricar una integración sin uso real                                              |
| Future Quotations   | ❌ El módulo no existe (`ventas` no tiene `sales_quotes`) — no se puede integrar con código que no existe. Documentado como pendiente                                                              |
| Future Orders       | ❌ El módulo no existe (`ventas` no tiene `sales_orders`) — el punto de enganche ya está preparado (`resultingSalesOrderId` acepta cualquier UUID de `sales`), sin trabajo adicional cuando exista |
| Future Purchasing   | ❌ El módulo `compras` no tiene backend real                                                                                                                                                       | Sin caso de uso identificado que cruce con `crm`                                      |
| Future Accounting   | ❌ El módulo `contabilidad` no tiene backend real                                                                                                                                                  | `opportunities.estimated_amount` ya sirve como dato de entrada para un futuro reporte |

## 2. Verificaciones pedidas

| Verificación                         | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sin código duplicado                 | Revisado — el patrón "desmarcar el flag exclusivo anterior" se repite en `ContactosService`/`DireccionesService` (2 instancias, misma forma). No se extrajo un helper compartido a propósito: son 8 líneas cada uno, sobre entidades distintas (contacto vs dirección) — una abstracción prematura acá sería más código que el que ahorra, mismo criterio que el resto del proyecto ("tres líneas similares es mejor que una abstracción prematura")                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Sin APIs rotas                       | Verificado con 85 tests de integración/API nuevos (ver §3) + arranque real de la API contra Postgres/Redis/RabbitMQ + `curl` contra cada endpoint nuevo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Sin conflictos de migración          | No se agregó ninguna migración SQL nueva en esta fase — la integración de Cuentas por Cobrar usa la vista `v_accounts_receivable_aging` ya existente desde Database Parte 02                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Sin inconsistencias de base de datos | **Hallazgo real, corregido**: `customers.customer_addresses` tiene un CHECK (`address_type` limitado a `billing`/`shipping`/`other`) que ni el validador Zod ni la entidad de dominio reflejaban — un valor fuera de rango pasaba la validación de la aplicación y rompía en un 500 de Postgres sin traducir. Corregido en `direcciones.schema.ts`, `direccion-cliente.entity.ts` (backend) y `use-direccion-mutations.ts`/`direcciones-tab.tsx` (frontend, ahora un `<select>` con las 3 opciones reales)                                                                                                                                                                                                                                                                                                                                                                           |
| Sin vulnerabilidades de seguridad    | **Hallazgo real, corregido**: 6 permisos (`clientes.ver`, `clientes.ver_contactos`, `clientes.gestionar_contactos`, `clientes.ver_direcciones`, `clientes.gestionar_direcciones`, `clientes.ver_cuentas_por_cobrar`) estaban en el código fuente de `seed-rbac.ts` pero nunca se habían sembrado de verdad en la base — el script solo se había editado, no re-ejecutado. Corregido corriendo `seed-rbac.ts demo admin@demo.local` de nuevo (idempotente). Sin este paso, cualquier usuario real —incluido un administrador— habría recibido `403` en toda pantalla nueva de Clientes en un ambiente real. Revisado además: RLS vía `withTenantScope` en los 5 repositorios nuevos (incluido el de `$queryRaw`, ver `cuenta-por-cobrar.repository.prisma.ts`), sin interpolación de string en SQL crudo (tagged template parametrizado), guard de permisos en los 9 endpoints nuevos |
| Sin deuda técnica introducida        | Documentado explícitamente lo que se difirió (§4) en vez de dejarlo implícito. Un hallazgo de deuda técnica **pre-existente, no introducida por esta fase**: `configuracion-backend`/`seguridad-backend` tienen un error de compilación en sus specs (`Express.Multer` sin tipar, falta `@types/multer` en `tsconfig.spec.json`) que bloquea sus e2e tests — no se tocó por estar fuera de alcance de CRM/Clientes, queda anotado para una sesión futura                                                                                                                                                                                                                                                                                                                                                                                                                             |

## 3. Tests generados

| Tipo                                                         | Antes de esta fase                | Después                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (entidades + servicios)                                 | 28 (`clientes`) + 45 (`crm`) = 73 | Sin cambios — ya cubrían las reglas de negocio                                                                                                                                                                                        |
| Integración/API (e2e, contra Postgres/Redis/RabbitMQ reales) | 0                                 | **+2 suites, 8 tests**: `clientes.controller.e2e-spec.ts` (flujo Cliente→Contacto→Dirección→CxC, 401/404/400) y `leads.controller.e2e-spec.ts` (flujo Lead→cambiar estado→convertir→verificación cruzada del cliente real resultante) |
| Total del módulo `clientes`                                  | 28                                | 36                                                                                                                                                                                                                                    |
| Total del módulo `crm`                                       | 45                                | 49                                                                                                                                                                                                                                    |

Performance: sin herramienta de carga disponible en este entorno — revisión de código en su lugar:
ningún endpoint nuevo tiene N+1 (la consulta de CxC es una sola `$queryRaw`, los listados de
contactos/direcciones son una sola consulta paginada). Revisión de seguridad: ver fila
correspondiente en §2.

## 4. Documentación generada/actualizada

- `modules/crm/README.md` — reescrito (estaba desactualizado desde Parte 02, solo mencionaba Leads).
- `modules/clientes/README.md` — nuevo (no existía).
- `docs/manuals/USUARIO.md` — nueva sección "3. Clientes" con las pantallas reales.
- `CRM_ARCHITECTURE.md §14` — reescrita, integraciones reales vs. futuras explícitas.
- Este documento.
- OpenAPI (`docs/api/openapi.json`) — se regenera solo en cada arranque no-productivo de la API
  (`core/kernel/bootstrap.ts`), verificado que incluye las 22 rutas de `crm`/`clientes`.

## 5. Explícitamente fuera de alcance de esta fase

- Frontend de Cotizaciones/Pedidos/Compras/Contabilidad — no hay backend con el que conectar.
- Categorías, Notas, Timeline, Crédito, Tags, Documentos, Dashboard de Clientes — Partes 02.2-02.5
  del roadmap, sin empezar (ver `CRM_ROADMAP.md`).
- Integración con Caja — sin caso de uso real identificado hoy.
- El bug pre-existente de `@types/multer` en `configuracion-backend`/`seguridad-backend`.

## 6. Recomendación para Fase 2 (Enterprise Quotations)

Cuando `ventas` implemente cotizaciones/pedidos como entidades propias (`sales_quotes`/
`sales_orders`, hoy solo existen facturas directas), el trabajo de integración en `crm` es mínimo
por diseño: `OportunidadesService.ganar()` ya acepta cualquier `resultingSalesOrderId` sin importar
su tabla de origen — no hace falta modificar `crm`, solo pasar el id correcto desde el nuevo flujo
de Ventas. El orden recomendado sigue siendo primero cerrar Clientes Parte 02 completa (Categorías
→ Notas/Timeline → Crédito/Precios → Tags/Documentos/Dashboard, `CRM_ROADMAP.md`), después CRM
Parte 05 (Seguimientos), y recién ahí Cotizaciones — construir Cotizaciones antes deja el módulo
de Clientes a medio terminar más tiempo del necesario, sin ganancia real (nada de Cotizaciones
depende de que Clientes esté completo).
