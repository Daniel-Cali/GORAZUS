# Invoice Report — FASE 04, Módulo Facturación Enterprise, Parte 1

> Sesión del 2026-07-26, versión **0.22.0**. Extiende `modules/ventas/backend`, real desde
> `v0.11.0` (POS Parte 01) — no es un módulo nuevo. Ver `INVOICE_ARCHITECTURE.md` para el detalle
> arquitectónico completo, `INVOICE_API_REPORT.md` para el contrato de cada endpoint,
> `INVOICE_TEST_REPORT.md` para testing, `INVOICE_HEALTH_REPORT.md` para riesgos y deuda técnica.

## 1. Origen del pedido y desviaciones deliberadas

Pedido: "GORAZUS ERP ENTERPRISE / FASE 04 / MÓDULO FACTURACIÓN ENTERPRISE / PARTE 1 / MOTOR DE
FACTURACIÓN" — arquitectura CQRS/DDD (Application/Domain/Infrastructure/Presentation), Value
Objects, Factories, Domain Events publicados, stack PHP 8.3/Composer/PHPUnit/PHPStan/PHP-CS-Fixer.

Dos desviaciones deliberadas, mismas ya confirmadas en Roles Enterprise (`v0.18.0`-`v0.21.0`):

1. **Stack real**: NestJS 10 + TypeScript + Prisma (Nx monorepo) — PHP no existe en este proyecto.
   Todo el pedido se tradujo al stack real.
2. **Arquitectura real**: Clean Architecture por módulo (entidad + repositorio + servicio +
   controlador + validadores Zod), sin CQRS ni Value Objects — patrón usado por los 10+ módulos de
   negocio ya construidos esta sesión. Ver `INVOICE_ARCHITECTURE.md §6` para el detalle de por qué
   cada pieza pedida (CQRS/VO/Factories) no se construyó.

Tercer hallazgo, el más relevante para el alcance real de esta parte: **el motor de facturación ya
existía**, real y funcionando, desde `v0.11.0` — `Factura`, `VentasService`, `FacturaRepository`,
`FacturasController` con endpoints ya operativos (crear/confirmar/obtener/listar/registrar recibo).
Se extendió ese módulo con lo genuinamente pedido y faltante — editar/eliminar borrador, anular,
duplicar, descuento general, filtros/orden avanzados, eventos de dominio — en vez de construir una
estructura paralela en PHP que hubiera duplicado un motor ya real.

## 2. Qué se construyó

Ver la tabla comparativa completa en `INVOICE_ARCHITECTURE.md §2`. Resumen:

- **Editar borrador** (`PUT`), **eliminar borrador** (`DELETE`, baja lógica) — ambos exigen
  `draft`, `409` en caso contrario.
- **Anular** (`POST .../anular`) — `draft`/`issued` → `cancelled` (estado final, rechaza segunda
  anulación con `409`).
- **Duplicar** (`POST .../duplicar`) — nuevo borrador con las mismas líneas, impuestos recalculados
  a la tasa vigente de hoy.
- **Descuento general por factura** (`generalDiscountPercentage`) — migración aditiva
  `40_facturacion_descuento_general.sql`, aplicado sobre el subtotal ya neto de descuentos de
  línea, sin afectar la base del impuesto (decisión documentada, no un requisito de negocio
  verificado — ver `INVOICE_HEALTH_REPORT.md §4`).
- **Filtros y orden avanzados en `listar()`** — `customerId`/`statusId`/`issuedFrom`/`issuedTo`,
  orden por `issued_at`/`total_amount`/`document_number`.
- **Eventos de dominio preparados**: `FacturaCreadaEvent`/`FacturaConfirmadaEvent`/
  `FacturaAnuladaEvent`, mismo patrón "preparado, sin publicar todavía" que `auth`/`seguridad`.
- **Permiso `ventas.ver`** agregado a `seed-rbac.ts` (gap real, mismo patrón sistémico que
  `clientes.ver`/`crm.ver`).

## 3. Explícitamente fuera de alcance

Cotizaciones, Pedidos, Compras, Facturación Electrónica, Contabilidad, Cuentas por Cobrar
avanzadas — excluidas por el propio pedido. Vista previa/PDF/impresión/envío por correo —
mencionadas en el pedido bajo "Documentos", pero sin librería de PDF en el proyecto todavía;
documentado como Parte 2, no construido en esta parte para no traer una dependencia nueva sin un
caso de uso real que la consuma.

## 4. Ruptura de compatibilidad — regla obligatoria del pedido, honrada

El pedido exige explícitamente "nunca romper compatibilidad con módulos existentes". Dos cambios de
esta parte (`generalDiscountPercentage` obligatorio por un efecto de tipos de Zod,
`listar()` con nueva firma) rompían la compilación de `pos-backend`. Detectado corriendo
`pos-backend:build` inmediatamente después de que `ventas-backend` pasara limpio, y corregido en el
mismo turno — ver `INVOICE_HEALTH_REPORT.md §3` para el análisis completo de causa raíz y fix.
Confirmado sin regresión: `pos-backend:build`/`test` (9/9) y `ventas-backend:build`/`lint`/`test`
(30/30) limpios.

## 5. Migración de base de datos

`docs/database/sql/40_facturacion_descuento_general.sql` (Database Enterprise v1.2.1) — aditiva,
aplicada y verificada contra Postgres real: +1 columna (`general_discount_percentage`), +1 CHECK.
0 tablas nuevas, 0 datos perdidos. Ver `INVOICE_ARCHITECTURE.md §5`.

## 6. Verificación realizada

- Build/lint limpios en `ventas-backend` y `pos-backend`.
- 30/30 tests de `ventas-backend`, 9/9 de `pos-backend` (regresión).
- Arranque real de la API (`Nest application successfully started`), 9 rutas de
  `/ventas/facturas` mapeadas, `401` confirmado con `curl` en 7 de ellas.
- OpenAPI regenerado y confirmado (`docs/api/openapi.json`, rutas `/api/v1/ventas/facturas*`).
- Permiso `ventas.ver` sembrado y confirmado contra la base real.

## 7. Commits y control de versión

Commits locales pequeños, Conventional Commits, en la rama de trabajo actual — sin push al remoto
ni creación/cambio de rama, pendiente de confirmación explícita del usuario dado el estado previo
del repositorio (152 archivos sin commitear de fases anteriores no relacionadas, nunca subidos).
`v0.21.0 → v0.22.0` (`VERSION.md`), `CHANGELOG.md` y `ROADMAP.md` actualizados.

## 8. Próximo paso sugerido

Facturación Enterprise Parte 2 (vista previa/PDF/impresión/envío por correo — requiere elegir
librería de PDF), sujeta a confirmación del usuario sobre prioridad frente a Roles Enterprise
Subfases 4.2-4.8 (pausadas) y Clientes/CRM Parte 02.2+.
