# 27 — Módulo CRM (diseño completo)

> Versión 1.0 — 2026-07-13. Mismo criterio que los documentos de
> módulo anteriores. Sin tablas nuevas — verificado completo contra
> [sql/15_crm.sql](../database/sql/15_crm.sql) (17 tablas). Sin
> código.

## 0. Alcance — Prospectos no es tabla, Agenda ya consolida dos conceptos

| Elemento pedido            | Tabla real                                                            | Nota                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Leads** y **Prospectos** | `crm.leads` — **la misma tabla para ambos**                           | Confirmado en el comentario real: _"consolida Lead/Prospecto/Cliente Potencial"_ — un valor de `lead_status`, no una tabla distinta. Ver §1 |
| Oportunidades              | `crm.opportunities` + `sales_funnels`/`sales_funnel_stages`           | ✅                                                                                                                                          |
| Campañas                   | `crm.campaigns` + `campaign_members`                                  | ✅ — con un límite real de alcance, ver §3                                                                                                  |
| **Agenda**                 | `crm.calendar_events`                                                 | Ya consolida "Agenda y Calendario" (confirmado en el comentario real) — no hay una tabla `agenda` separada de `calendar_events`             |
| **Seguimientos**           | `follow_up_activities` **y** `call_logs`/`email_logs`/`whatsapp_logs` | Dos cosas distintas bajo el mismo nombre coloquial — ver §5                                                                                 |

## 1. Leads y Prospectos — un solo concepto, distintas etapas

`crm.leads` cubre **todo** el espectro desde el primer contacto hasta
justo antes de ser cliente formal — `lead_status` (`nuevo`,
`contactado`, `calificado`...) es lo que un sistema menos disciplinado
modelaría como tres tablas (`leads`, `prospects`,
`potential_customers`) con los mismos campos repetidos. `source_id`
(de dónde vino: referido, web, feria) es independiente del estado de
calificación — un lead puede venir de cualquier fuente y estar en
cualquier etapa, son dos dimensiones ortogonales.

**Conversión a cliente formal** (`leads.converted_customer_id`,
columna real verificada): el lead **no se borra ni se transforma** al
convertirse — la fila sigue existiendo, con `converted_customer_id`
apuntando al nuevo registro en `customers.customers`. Esto preserva
todo el historial de seguimiento (§5) y campañas (§3) del lead incluso
después de ser cliente. La conversión en sí **nunca es un INSERT
directo** en `customers.customers` — pasa por el comando público de
`customers` (`ClientesCommandService.crear()`), regla ya fijada en
[06-comunicacion-entre-modulos §4](./06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño-para-entidades-compartidas)
y confirmada en la nota de cabecera de
[logico/13-crm.md](../database/logico/13-crm.md) — `crm` nunca escribe
directamente el maestro de clientes, ni siquiera cuando es quien
originó el dato.

## 2. Oportunidades (`opportunities` + `sales_funnels`/`sales_funnel_stages`)

`funnel_stage_id NOT NULL` — toda oportunidad vive dentro de un embudo
y una etapa, con `win_probability_percentage` propia de la etapa (no
de la oportunidad individual, salvo ajuste manual vía
`estimated_amount`). **Dos orígenes válidos, ambos en el schema**
(`lead_id` y `customer_id` son ambos nullable): una oportunidad puede
nacer de un lead en proceso de calificación, o directamente de un
cliente ya existente (upsell/cross-sell) — no todo negocio nuevo pasa
por la fase de lead.

**Cierre — ganada o perdida, con trazabilidad completa**:
`status CHECK IN ('open', 'won', 'lost')`. Si se pierde,
`loss_reason_id` (obligatorio en la práctica, aunque nullable en
schema — el caso de uso debería exigirlo al marcar `lost`). Si se
gana, `resulting_sales_order_id` (columna real verificada) conecta
directamente con el pedido de venta generado — esta es la
materialización exacta del evento `OportunidadGanada` ya catalogado en
[12-backend-enterprise §6.3](./12-backend-enterprise.md#63-catálogo-representativo-de-eventos-por-módulo-nuevo)
("`crm` → `OportunidadGanada` → `ventas` (vía comando síncrono, no
evento)"): la oportunidad no se cierra "ganada" en abstracto, queda
enlazada al pedido real que la materializó.

## 3. Campañas (`campaigns` + `campaign_members`) — límite de alcance real

`campaign_members` vincula una campaña con **leads únicamente**
(`lead_id NOT NULL`, sin columna `customer_id`) — verificado, no hay
forma de agregar un cliente ya existente como miembro de una campaña
de CRM. Esto no es un descuido: es la misma frontera que separa a
`crm` (adquisición/nutrición de prospectos) de `sales`
(incentivos comerciales a clientes ya existentes —
`promotions`/`coupons`, ya diseñados en
[20-modulo-sales §9](./20-modulo-sales.md#9-promociones--cinco-mecanismos-distintos-comparados-no-existía)).
Una campaña de marketing dirigida a la base de clientes existente
(no a leads) usaría los mecanismos de `sales`, no `campaign_members` —
son audiencias y objetivos de negocio distintos, aunque ambos se
sientan como "campaña" en el lenguaje cotidiano.

## 4. Agenda (`calendar_events` + `calendar_event_attendees`)

Ya consolidado por diseño (comentario real: _"consolida Agenda y
Calendario"_) — no hay una tabla `agenda` esperando a diseñarse
aparte. `lead_id`/`opportunity_id` son ambos opcionales y no
mutuamente excluyentes forzados por `CHECK` — un evento de calendario
puede no estar ligado a ningún lead/oportunidad (una reunión interna),
o estar ligado a uno de los dos, o —aunque el schema no lo impida—
técnicamente a ambos, caso que el caso de uso debería evitar si no
tiene sentido de negocio (un evento normalmente sigue a un lead _o_ a
una oportunidad ya calificada, no a los dos a la vez).
`calendar_event_attendees` distingue asistente interno (`user_id`) de
externo (`external_email`, sin cuenta en el sistema) — un lead o
cliente invitado a una reunión no necesita ser usuario de GORAZUS.

## 5. Seguimientos — dos mecanismos distintos bajo el mismo nombre coloquial

**Tareas de seguimiento** (`follow_up_activities`): un pendiente
programado (`due_at`, `completed_at` cuando se resuelve),
`assigned_to_user_id` obligatorio — "hay que llamar a este lead antes
del viernes". Es una **intención futura**.

**Bitácora de interacción** (`call_logs`/`email_logs`/`whatsapp_logs`,
las tres particionadas mensualmente — alto volumen esperado): el
registro de una comunicación **ya ocurrida** — "se llamó a este lead,
duró 4 minutos, resultado: interesado". Es un **hecho pasado**.

**Gap de trazabilidad identificado, no bloqueante** (mismo patrón de
hallazgo que en otros módulos, p. ej.
[26-modulo-payroll §3](./26-modulo-payroll.md#3-deducciones--gap-real-de-conexión-verificado)):
no existe una FK entre `follow_up_activities` y el log que
eventualmente la resuelve. Completar la tarea "llamar al lead" y
registrar la llamada en `call_logs` son, hoy, dos acciones sin enlace
declarado — nada impide marcar `completed_at` en la actividad sin que
exista un `call_logs` correspondiente, ni viceversa. En la práctica el
caso de uso puede resolverlo (al completar la actividad, pedir o
generar el log correspondiente), pero el schema no lo garantiza
estructuralmente. Candidato razonable: una FK opcional en
`follow_up_activities` hacia el log que la cerró (polimórfica, dado
que puede ser cualquiera de los tres tipos), si la necesidad de
reportar "tasa de cumplimiento con evidencia" se vuelve real.

## 6. Trazabilidad

| Punto solicitado   | Documento(s) de detalle normativo            | Novedad de este documento                                                                              |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Leads / Prospectos | [sql/15_crm.sql](../database/sql/15_crm.sql) | Flujo de conversión completo vía `converted_customer_id` + comando de `customers` (§1)                 |
| Oportunidades      | Ídem                                         | Los dos orígenes válidos (lead vs. cliente existente) + trazabilidad a `resulting_sales_order_id` (§2) |
| Campañas           | Ídem                                         | Límite real de alcance (solo leads) frente a las promociones de `sales` (§3)                           |
| Agenda             | Ídem                                         | Confirmación de consolidación ya hecha, sin trabajo pendiente (§4)                                     |
| Seguimientos       | Ídem                                         | Distinción tarea vs. bitácora + **gap real encontrado**: sin FK entre ambas (§5)                       |

## 7. Addendum — arquitectura de código (2026-07-25)

Este documento cubre **solo diseño de datos** ("sin código", como se
declara en la cabecera). La arquitectura de código del módulo (entidades de
dominio, repositorios, servicios, controladores, recursos API, permisos,
eventos, notificaciones, estrategia de auditoría) se diseñó por separado en
[`CRM_ARCHITECTURE.md`](../reports/crm/CRM_ARCHITECTURE.md) — no se
reescribe nada de §0-§6 acá, ese documento nuevo **extiende** este sin
contradecirlo (en particular, respeta que `OportunidadGanada` es un comando
síncrono hacia `ventas`, no un evento, tal como ya fija §2 de este
documento). Plan de implementación restante en
[`CRM_ROADMAP.md`](../reports/crm/CRM_ROADMAP.md).
