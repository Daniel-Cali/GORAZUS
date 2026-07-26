# Informe de Salud — Motor de Facturación

## 1. Resumen

Esta parte extendió un módulo (`modules/ventas/backend`) ya real y funcionando desde `v0.11.0`, no
construyó uno nuevo. Todo lo agregado se verificó contra infraestructura real (Postgres/Redis/
RabbitMQ), no solo con mocks — ver `INVOICE_TEST_REPORT.md`. Una ruptura de compatibilidad real,
introducida por esta misma fase, fue detectada y corregida en el mismo turno (§3).

**Estado general: sano, sin regresiones conocidas pendientes.**

## 2. Cobertura de pruebas

- 30/30 tests de `ventas-backend` (5 entidad + 3 eventos + 17 servicio + 5 e2e real).
- 9/9 tests de `pos-backend` (regresión, confirma que el fix de compatibilidad no rompió el
  checkout de POS).
- Verificación end-to-end real vía arranque en vivo de la API + `curl` — ver
  `INVOICE_API_REPORT.md §8`.
- **No cubierto**: `POST /ventas/facturas/:id/recibos` sin verificación `curl`/e2e dedicada en esta
  parte (ver `INVOICE_TEST_REPORT.md §4`); sin pruebas de carga/concurrencia.

## 3. Ruptura de compatibilidad — hallazgo real, corregido en el mismo turno

**Causa raíz**: `crearFacturaSchema` ganó `generalDiscountPercentage` con `.default(0)` (Zod). El
tipo exportado `CrearFacturaInput` estaba declarado como `z.infer<typeof crearFacturaSchema>` —
`z.infer` resuelve al tipo de **salida** de Zod, donde cualquier campo con `.default()` deja de ser
opcional. Resultado: `generalDiscountPercentage` (y, de paso, `salesChannel`, que también tiene
`.default('store')`) aparecían como **obligatorios** en el tipo TypeScript exportado, aunque en
runtime siguieran siendo opcionales (Zod rellena el default al validar).

**Impacto real**: `pos-checkout.service.ts` (2 sitios) construye el objeto de `crearFactura()`
directo en TypeScript, sin pasar por `ZodValidationPipe` (esa validación ocurre server-side, en el
borde HTTP) — el compilador exigía un campo que el propio esquema volvía opcional a propósito. Un
tercer sitio (`listarSuspendidas`) rompía por un motivo distinto: `listar()` cambió de firma
posicional (`context, branchId, pagination`) a un objeto de filtros (`context, {branchId, ...},
pagination, orden?`).

**Corrección aplicada**:

1. `CrearFacturaInput`/`ActualizarFacturaInput` (`validators/facturas.schema.ts`) pasan de
   `z.infer` a `z.input` — el tipo de **entrada**, donde un campo con `.default()` sigue siendo
   opcional. Runtime sin cambios: `ZodValidationPipe` sigue aplicando el default en el borde HTTP.
2. `VentasService.crearFactura()` (`services/ventas.service.ts`) gana un fallback explícito
   `input.salesChannel ?? 'store'` — necesario porque, con el tipo `z.input`, `salesChannel` ahora
   es `string | undefined` también dentro del propio servicio (antes del fix, TypeScript señalaba
   correctamente que no podía asignarse a un campo `string` sin ese fallback).
3. `pos-checkout.service.ts` — `listarSuspendidas()` actualizado a
   `this.ventasService.listar(context, { branchId }, { page: 1, pageSize: 50 })`.

**Verificación de la corrección**: `pos-backend:build` limpio (0 errores), `pos-backend:test` 9/9,
`ventas-backend:build`/`lint`/`test` limpios (30/30) — confirmado que el fix no introdujo ninguna
regresión nueva en ninguno de los dos módulos.

**Por qué esto no se detectó antes de escribir el código**: es un efecto secundario de una
diferencia real y no obvia entre `z.infer`/`z.input` en Zod — no un descuido de proceso. Queda
como aprendizaje para el resto del proyecto: **cualquier campo Zod con `.default()` cuyo tipo se
exporte para consumo directo en TypeScript (no solo vía `ZodValidationPipe`) debe usar `z.input`,
nunca `z.infer`**, si se espera que otros módulos construyan el objeto a mano.

## 4. Riesgos conocidos

| Riesgo                                                                           | Severidad                                                  | Detalle                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Descuento general no descontado de la base del impuesto                          | Media (funcional, decisión no confirmada por negocio real) | `taxAmount` se calcula antes de aplicar `generalDiscountPercentage` — es una decisión razonable y documentada, pero no viene de un requisito de negocio explícito verificado; si el negocio real espera lo contrario, es un cambio acotado a `calcularLineas()`. |
| Sin PDF/vista previa/impresión/envío por correo                                  | Alta (funcional, explícitamente fuera de alcance)          | No existe ninguna librería de generación de PDF en el proyecto. Documentado como Parte 2.                                                                                                                                                                        |
| `recibos` sin verificación en vivo dedicada                                      | Baja                                                       | Mismo guard de permisos que el resto del controlador; cubierto indirectamente por `pos-checkout.service.spec.ts` (que sí llama `registrarRecibo` a través del checkout).                                                                                         |
| Sin descuento de inventario al confirmar (fuera del flujo POS)                   | Media (funcional, ya documentado desde `v0.11.0`)          | Crear/confirmar una factura fuera del checkout de POS no descuenta stock — el pedido de esta parte pide explícitamente "no descontar inventario todavía".                                                                                                        |
| `z.input` vs `z.infer` — patrón sistémico, no corregido en el resto del proyecto | Baja                                                       | Otros schemas Zod del proyecto con campos `.default()` pueden tener el mismo tipo de gap si algún día un módulo los consume por TypeScript directo en vez de HTTP — no auditado exhaustivamente fuera de `ventas`.                                               |

## 5. Deuda técnica introducida (nueva en esta fase)

- Ninguna deuda estructural nueva — el fix de compatibilidad (§3) es una corrección, no una deuda
  que se deja pendiente.
- `recibos` sin test dedicado (§2) — debería cerrarse antes de que el endpoint cambie de forma.

## 6. Deuda técnica heredada, relevante para esta fase (no nueva)

- El checkout de POS (`PosCheckoutService.confirmarVenta`) sigue sin ser una transacción
  distribuida real entre `inventario`/`ventas`/`caja` (`POS_HEALTH_REPORT.md §3`) — sin cambios en
  esta fase, se documenta acá porque el motor de facturación es una de las piezas de esa cadena.

## 7. Seguridad y permisos

`ventas.gestionar_ventas` (preexistente) exige las 9 rutas del controlador sin excepción. Permiso
`ventas.ver` agregado a `seed-rbac.ts` — gap real encontrado (mismo patrón sistémico que
`clientes.ver`/`crm.ver` en fases anteriores: el ítem de sidebar/lógica ya lo esperaba, nunca se
había sembrado de verdad).

## 8. Recomendación

Antes de producción: confirmar con negocio real si el descuento general debe o no afectar la base
del impuesto (§4), y decidir la librería de PDF para la Parte 2 (vista previa/impresión/envío por
correo).
