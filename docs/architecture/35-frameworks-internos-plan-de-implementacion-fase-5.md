# 35 — Frameworks internos: Plan de implementación (Fase 5)

> Plan técnico de construcción — versión 1.0, 2026-07-13. Mismo
> criterio que las Fases 2-4. Hallazgo principal de esta fase, a
> diferencia de las anteriores: **8 de los 14 puntos pedidos ya son
> componentes del Core Platform (Fase 2) y ya tienen hito asignado
> ahí** — no se re-planifican acá, solo se referencian. El trabajo real
> de esta fase fue: cerrar 3 gaps genuinos (Excel, SMS, WhatsApp) como
> ampliaciones de componentes ya existentes, y aclarar que "Reportes"
> no es un framework de Core Platform sino un módulo de negocio
> completo ya diseñado aparte.

## 1. Mapeo: los 14 puntos pedidos → estado real

| #   | Pedido         | Estado                                                                       | Documento                                                                                                                                                                                                                                                       |
| --- | -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Logger         | ✅ Ya es Core Platform — Logging Framework                                   | [32-core-platform/07 §2](./32-core-platform/07-observabilidad-y-gobernanza.md#2-logging-framework), hito [Fase 2 H3](./32-core-platform/13-plan-de-implementacion-fase-2.md#hito-3--observabilidad-paralelizable-entre-sí-requiere-h1-h2)                       |
| 2   | Auditoría      | ✅ Ya es Core Platform — Audit Framework                                     | [32-core-platform/07 §1](./32-core-platform/07-observabilidad-y-gobernanza.md#1-audit-framework), hito Fase 2 H3                                                                                                                                                |
| 3   | Validaciones   | ✅ Ya es Core Platform — Validation Engine                                   | [32-core-platform/05 §2](./32-core-platform/05-motores-de-logica-de-negocio.md#2-validation-engine), sin hito propio (usa Shared Kernel, Fase 2 H2)                                                                                                             |
| 4   | Excepciones    | ✅ Ya es Core Platform — Exception Framework                                 | [32-core-platform/07 §3](./32-core-platform/07-observabilidad-y-gobernanza.md#3-exception-framework), hito Fase 2 H3                                                                                                                                            |
| 5   | Cache          | ✅ Ya es Core Platform — Cache Framework                                     | [32-core-platform/08 §1](./32-core-platform/08-frameworks-de-infraestructura.md#1-cache-framework), hito [Fase 2 H1](./32-core-platform/13-plan-de-implementacion-fase-2.md#hito-1--cimientos-sin-dependencia-interna-paralelizable)                            |
| 6   | Eventos        | ✅ Ya es Core Platform — Domain Events + Event Bus                           | [32-core-platform/06 §1-2](./32-core-platform/06-eventos-y-mensajeria.md), hito [Fase 2 H4](./32-core-platform/13-plan-de-implementacion-fase-2.md#hito-4--mensajería-y-trabajos-requiere-h1-h3)                                                                |
| 7   | Colas          | ✅ Ya es Core Platform — Background Jobs (llamado "Queue Manager" en Fase 2) | [32-core-platform/08 §6](./32-core-platform/08-frameworks-de-infraestructura.md#6-background-jobs), hito Fase 2 H4                                                                                                                                              |
| 8   | Notificaciones | ✅ Ya es Core Platform — Notification Center                                 | [32-core-platform/06 §4](./32-core-platform/06-eventos-y-mensajeria.md#4-notification-center), hito Fase 2 H4                                                                                                                                                   |
| 9   | Reportes       | ✅ Ya diseñado, pero **no es Core Platform**                                 | Ver §2 — es el módulo de negocio `reports`/`bi`, [28-modulo-reports-bi.md](./28-modulo-reports-bi.md)                                                                                                                                                           |
| 10  | PDFs           | ✅ Ya es Core Platform — Template Engine, + costura cerrada                  | [32-core-platform/08 §4](./32-core-platform/08-frameworks-de-infraestructura.md#4-template-engine) — ver §3 (conexión con `report_templates` que faltaba)                                                                                                       |
| 11  | Excel          | 🆕 Gap cerrado ahora                                                         | [32-core-platform/10 §9](./32-core-platform/10-utilidades-comunes.md#9-serialization-utilities) — `.toXlsx` agregado a Serialization Utilities                                                                                                                  |
| 12  | Correos        | ✅ Ya es Core Platform — canal de Notification Center                        | [32-core-platform/06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5) — SMTP ya nombrado, se agregó dónde viven las credenciales                                    |
| 13  | SMS            | 🆕 Gap cerrado ahora                                                         | [32-core-platform/06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5) — adaptador de pasarela + manejo de delivery receipt asíncrono                                |
| 14  | WhatsApp       | 🆕 Gap cerrado ahora, + decisión de diseño nueva                             | [32-core-platform/06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5) — API Business + regla de ventana de 24h + vínculo con `crm.whatsapp_logs` (antes indefinido) |

## 2. Reportes: ya diseñado, pero no es un "framework interno"

`28-modulo-reports-bi.md` ya define un motor de reportes genérico y
reusable (`report_definitions`→`report_templates`→`report_parameters`
→`report_executions`→`report_exports`, cualquier módulo puede declarar
su propio reporte apuntando a su propia query — exactamente la
capacidad que "Reportes" como framework pediría). La diferencia real
con los otros 13 puntos de esta fase: no vive en `core/`, vive como
schema/módulo de negocio propio (`reports` + `bi`, dueño de sus
propias tablas, con su propia fase en el roadmap de documentación —
`00-roadmap-fases.md` fila 23/25, ya "✅ Completo"). Construirlo en
código es del tamaño de un módulo de negocio completo (como
`Ventas`/`Inventario`), no de un componente de `core/` — por eso no se
le asigna un hito dentro de esta Fase 5 ni dentro de la Fase 2. Cuando
se planifique la construcción de módulos de negocio, `reports`/`bi`
entra en esa secuencia con su propio plan, análogo a como se hizo acá
para Core Platform/IAM/Configuration.

## 3. Los 3 gaps genuinos que se cerraron

Investigué contra toda la documentación existente antes de escribir
una palabra (regla del proyecto de no repetir/no rediseñar sin
verificar primero) y until este pedido, estos 3 componentes tenían el
dato modelado en SQL pero **ningún componente asignado** para
producirlos:

- **Excel**: `reports.report_exports.export_format` ya incluía
  `'xlsx'` en su `CHECK` desde antes — nadie había asignado quién
  genera ese binario. Se asignó a `Serialization Utilities`
  ([10 §9](./32-core-platform/10-utilidades-comunes.md#9-serialization-utilities)),
  mismo componente que ya hacía CSV, no uno nuevo. Deliberadamente
  **no** se diseñó importación de Excel (`.fromXlsx`) — no hay caso de
  uso confirmado hoy, todos los flujos de importación masiva ya
  identificados usan CSV.
- **SMS**: `core.notification_channels.channel_type` ya incluía
  `'sms'` — se agregó el mecanismo de adaptador de pasarela + el
  manejo de confirmación de entrega asíncrona (a diferencia de SMTP,
  que confirma síncronamente) en
  [06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5).
- **WhatsApp**: mismo caso que SMS, más una decisión de diseño que no
  existía en ningún lado: cuándo un envío por WhatsApp/email disparado
  por el Notification Center también debe quedar registrado en
  `crm.whatsapp_logs`/`crm.email_logs` (bitácora de relación con el
  cliente) — se decidió que sí, cuando el destinatario es identificable
  como lead/cliente de CRM, para que el historial de interacción no
  quede incompleto. Ver el razonamiento completo en
  [06 §4.1](./32-core-platform/06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5).

Ninguno de los 3 requirió tabla SQL nueva — las credenciales de los
proveedores (SMTP/SMS/WhatsApp) usan `core.integrations` +
`integration_credentials`, ya existentes desde antes de esta fase.

## 4. Orden de construcción

**No hay hitos nuevos que agregar.** Los 8 puntos ya-Core-Platform
siguen exactamente el orden ya fijado en
[Fase 2 §4](./32-core-platform/13-plan-de-implementacion-fase-2.md#4-orden-de-construcción-hitos)
(H1 Cache, H3 Logging/Auditoría/Excepciones, H4 Eventos/Colas/
Notificaciones). Las 3 ampliaciones de esta fase (Excel, SMS,
WhatsApp) se construyen **dentro** de esos mismos hitos, no después:

- `.toXlsx` se construye junto con el resto de `Shared Utilities` en
  **Fase 2 — H1**.
- Los adaptadores de SMS/WhatsApp se construyen junto con
  `Notification Center` en **Fase 2 — H4**, como parte del mismo
  trabajo, no como una fase posterior — agregar un canal más al
  Notification Center ya diseñado no es una unidad de trabajo
  separable de construirlo.

Único punto que sí queda fuera del calendario de Core Platform:
**Reportes**, que se planifica en su momento como fase de módulo de
negocio (§2).

## 5. Resumen visual

```
Fase 2 (Core Platform) — sin cambios de hitos, 8/14 puntos de esta
fase ya viven ahí:
  H1 → + .toXlsx (Excel)
  H3 → Logger · Auditoría · Excepciones (sin cambio)
  H4 → Eventos · Colas · Notificaciones + adaptadores SMS/WhatsApp

Validaciones → Fase 2 H2 (Shared Kernel / Validation Engine)
PDFs → Fase 2 H4 (Template Engine), costura con report_templates cerrada

Fuera de esta fase: Reportes — es módulo de negocio, no framework de
Core Platform (§2).
```
