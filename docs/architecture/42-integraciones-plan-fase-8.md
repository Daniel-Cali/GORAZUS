# 42 — Integraciones: mapeo y gobernanza (Fase 8)

> Versión 1.0 — 2026-07-13. A diferencia de las 7 fases anteriores,
> acá **casi todo el pedido cae fuera de lo que se puede diseñar sin
> confirmación de negocio** — no es un problema de documentación
> faltante, es que ninguno de los 13 puntos pedidos tiene ni una
> mención en todo el proyecto, salvo dos ya resueltos. Este documento
> deja mapeada la infraestructura genérica ya lista para recibir
> cualquiera de estas integraciones el día que se confirme cuál hace
> falta — no diseña ninguna integración específica. Sin código.

## 1. Mapeo: los 13 puntos pedidos → estado real

| #   | Pedido                 | Estado                                                    | Nota                                                                                                                                                                                                                  |
| --- | ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | DGII (RD)              | ❌ Cero mención en todo el proyecto                       | Ver §3                                                                                                                                                                                                                |
| 2   | SUNAT (Perú)           | ❌ Cero mención                                           | Ver §3                                                                                                                                                                                                                |
| 3   | SAT (México/Guatemala) | ❌ Cero mención                                           | Ver §3                                                                                                                                                                                                                |
| 4   | Stripe                 | ❌ Cero mención                                           | Ver §3                                                                                                                                                                                                                |
| 5   | PayPal                 | ❌ Cero mención                                           | Ver §3                                                                                                                                                                                                                |
| 6   | WhatsApp               | ✅ Ya resuelto (Fase 5)                                   | Canal de Notification Center + `crm.whatsapp_logs`, [32-core-platform/06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5) |
| 7   | Telegram               | ❌ Cero mención                                           | Ver §3                                                                                                                                                                                                                |
| 8   | Microsoft 365          | ❌ Cero mención (ni siquiera como SSO)                    | Ver §3                                                                                                                                                                                                                |
| 9   | Google Workspace       | ❌ Cero mención (ni siquiera como SSO)                    | Ver §3                                                                                                                                                                                                                |
| 10  | Power BI               | ✅ Ya resuelto — explícitamente fuera de alcance (Fase 7) | [41-modulo-bi.md §3](./41-modulo-bi.md#3-power-bi-no-se-diseña-especulativamente)                                                                                                                                     |
| 11  | OCR                    | ❌ Prácticamente cero — 1 mención condicional sin diseño  | Ver §3                                                                                                                                                                                                                |
| 12  | OpenAI                 | ❌ Cero mención — mismo criterio que Fase 27 (IA)         | Ver §4                                                                                                                                                                                                                |
| 13  | Claude                 | ❌ Cero mención — mismo criterio que Fase 27 (IA)         | Ver §4                                                                                                                                                                                                                |

**2 de 13 ya están resueltos. 11 no tienen ni un antecedente en el
proyecto** — no es que falte documento de arquitectura (como
Producción/Servicios/Proyectos, que sí tenían modelo de datos
esperando), es que no hay ninguna decisión de negocio detrás de
ninguno de los 11.

## 2. Lo que sí existe: infraestructura genérica, agnóstica de proveedor

`core.integrations` + `core.integration_credentials` +
`core.webhook_subscriptions` + `core.webhook_delivery_logs` +
`core.edi_transactions` ya están completas y listas para recibir
**cualquier** integración externa que se confirme, sin cambio de
schema:

- `core.integrations.integration_type` ya tiene un `CHECK` con las
  categorías genéricas relevantes: `'electronic_invoicing'`
  (cubriría DGII/SUNAT/SAT), `'payment_gateway'` (Stripe/PayPal),
  `'ecommerce'`, `'edi'`, `'other'`.
- `integration_credentials` ya cifra credenciales por integración
  (`pgp_sym_encrypt`, [06-estrategia-seguridad.md §3](../database/06-estrategia-seguridad.md#3-cifrado)) —
  el mismo mecanismo que se diseñó para SMTP/SMS/WhatsApp en la Fase 5
  ([32-core-platform/06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5)).
- `webhook_subscriptions`/`webhook_delivery_logs` ya soportan que un
  sistema externo (o GORAZUS hacia afuera) reciba eventos de dominio
  con reintento y bitácora.
- `edi_transactions` ya soporta intercambio de documentos
  estructurados (formato EDIFACT/X12) con `source_module`/
  `source_entity_id` polimórfico hacia cualquier módulo de negocio.

**El módulo `administracion`** (dueño de esta infraestructura, per
[04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md))
ya tiene menú diseñado
([docs/menus/24-administracion.md](../menus/24-administracion.md):
registrar integración, guardar credenciales, probar conexión,
activar/desactivar, ver errores) — consistente con
`01-estructura-monorepo.md` ("orquestación sobre
`core.integrations`/`scheduled_jobs`, **sin schema propio**", decisión
ya tomada, no un gap). Los nombres de tabla en español del menú
(`administracion.integracion`, `administracion.credencial`) son alias
informales de `core.integrations`/`core.integration_credentials` —
mismo patrón de nomenclatura ya aclarado para otros módulos
(`servicios.orden`→`services.service_orders`, etc.), no una tabla
faltante.

**Conclusión:** cuando se confirme una integración específica
(cualquiera de las 11 no resueltas), el trabajo de diseño es acotado
— una fila nueva de `integration_type` si no encaja en las 5
categorías ya existentes, el mapeo de credenciales concretas que esa
integración requiere, y el flujo específico (API REST, webhook
entrante, XML fiscal, etc.) de esa integración puntual. No hace falta
tocar el modelo de datos base.

## 3. Por qué no se diseña ninguna de las 11 restantes ahora

Mismo criterio de gobernanza ya aplicado, con la misma consistencia,
en cada fase de esta sesión:
[LDAP/Active Directory](./33-iam-plan-de-implementacion-fase-3.md#2-ldap-y-active-directory-no-se-diseñan-especulativamente)
(Fase 3), [Taxes](./34-configuration-plan-de-implementacion-fase-4.md#2-taxes-no-se-absorbe-acá--es-la-fase-16-ya-conocida)
(Fase 4), [Routing/Centro de Trabajo/MRP/Control de Calidad](./38-modulo-production.md#7-explícitamente-no-diseñado--requiere-confirmar-necesidad-de-negocio)
(Producción), [Power BI/Forecast](./41-modulo-bi.md#3-power-bi-no-se-diseña-especulativamente)
(Fase 7):
[11-gobernanza-y-adrs.md §1](./11-gobernanza-y-adrs.md#1-cómo-se-agrega-un-módulo-nuevo)
— no se diseña sin necesidad de negocio confirmada.

Acá el caso es más fuerte que en los ejemplos anteriores, porque
**ninguno de los 11 tiene ni un antecedente** (a diferencia de, por
ejemplo, Producción, donde el menú al menos describía un flujo aunque
no tuviera tabla). Tres categorías, cada una con su propio motivo para
no avanzar sin confirmación explícita:

- **Facturación electrónica (DGII, SUNAT, SAT):** son 3 autoridades
  fiscales de 3 países distintos (República Dominicana, Perú, y
  México o Guatemala según cuál "SAT" se pida). Diseñar la integración
  correcta depende por completo de **qué país(es)** va a operar el
  tenant real — cada autoridad tiene su propio formato (e-CF, CPE,
  CFDI/DTE), su propio protocolo de certificación, sus propios
  requisitos de firma digital. `configuration.fiscal_document_types`
  ([14-modulo-core.md §14](./14-modulo-core.md#14-fiscal-document-types-configurationfiscal_document_types--dueño-real-configuration))
  ya modela genéricamente "qué formato de comprobante exige cada
  país" — pero el **motor de impuestos real** (tasas, retenciones,
  declaraciones) es la Fase 16 (Impuestos), todavía sin documento
  propio, y la integración con la autoridad fiscal específica es una
  capa encima de esa fase, no independiente de ella.
- **Pasarelas de pago (Stripe, PayPal):** cero hook en
  `ventas`/`compras`/`caja`/`bancos` para "este pago se procesó vía un
  gateway externo" — ni siquiera un campo de referencia externa.
  Confirmar cuál(es) pasarela(s) usa el negocio real, y si el modelo
  de cobro es checkout embebido, redirect, o solo conciliación
  posterior, cambia sustancialmente el diseño.
- **Mensajería/productividad (Telegram, Microsoft 365, Google
  Workspace) y OCR:** cero antecedente. Telegram sería, si se
  confirma, un canal más de `Notification Center` (mismo patrón que
  WhatsApp/SMS) — pero no se agrega el canal sin saber si hay uso real
  planeado. Microsoft 365/Google Workspace como integración de
  calendario/correo (no como SSO — eso ya está descartado
  explícitamente en
  [13-modulo-auth.md §3](./13-modulo-auth.md#3-oauth)) no tiene ningún
  caso de uso descrito en ningún documento. OCR aparece una sola vez,
  como una frase condicional entre paréntesis en un bullet de
  búsqueda de documentos — no alcanza a ser ni siquiera una intención
  de diseño.

## 4. OpenAI y Claude — mismo criterio que la Fase 27 (IA), no independiente de ella

`00-roadmap-fases.md` ya tiene la Fase 27 "Inteligencia Artificial"
marcada "❌ Pendiente de definir alcance" con una nota explícita de
esta misma sesión: _"no hay necesidad de negocio concreta todavía
(¿forecasting sobre `bi.forecasts`? ¿asistente? ¿otra cosa?) — no se
diseña especulativamente."_ Pedir específicamente "OpenAI" y "Claude"
en esta Fase 8 es, en efecto, la misma pregunta de alcance que la Fase
27 ya tiene abierta — **qué haría GORAZUS con un proveedor de IA**
(¿un asistente conversacional dentro del ERP? ¿generación automática
de reportes en lenguaje natural? ¿clasificación de documentos?
¿forecasting real sobre `bi.forecasts`?) — no una integración técnica
aislada. No se resuelve acá; cuando la Fase 27 tenga alcance
confirmado, la elección de proveedor (OpenAI, Claude, u otro, incluso
ambos con capa de abstracción) es una decisión de implementación
posterior a esa definición de alcance, no antes.

## 5. Trazabilidad

| Punto solicitado                | Estado               | Acción                                                                                   |
| ------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| DGII, SUNAT, SAT                | Sin antecedente      | No diseñado — depende de qué país(es) opera el negocio real (§3)                         |
| Stripe, PayPal                  | Sin antecedente      | No diseñado — depende de qué pasarela(s) usa el negocio real (§3)                        |
| WhatsApp                        | ✅ Resuelto          | Sin cambios (Fase 5)                                                                     |
| Telegram                        | Sin antecedente      | No diseñado — mismo mecanismo de canal que WhatsApp si se confirma (§3)                  |
| Microsoft 365, Google Workspace | Sin antecedente      | No diseñado — sin caso de uso descrito en ningún documento (§3)                          |
| Power BI                        | ✅ Resuelto          | Sin cambios (Fase 7)                                                                     |
| OCR                             | Sin antecedente real | No diseñado — 1 mención condicional, no una intención de diseño (§3)                     |
| OpenAI, Claude                  | Sin antecedente      | No diseñado — es la misma pregunta de alcance que la Fase 27 (IA), no independiente (§4) |
