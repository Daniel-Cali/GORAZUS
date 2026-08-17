# Módulo CRM

> Partes 02-04 del roadmap (`docs/reports/crm/CRM_ROADMAP.md`) — Leads,
> Oportunidades, Campañas y Agenda, todas con código real. Diseño completo
> de arquitectura en `docs/reports/crm/CRM_ARCHITECTURE.md`. Parte 05
> (Seguimientos) es la siguiente pendiente.

## Responsabilidad

Gestión del embudo de ventas B2B/B2C: Leads/Prospectos (`crm.leads`, alta,
cambio de estado con bitácora, conversión a cliente formal),
Oportunidades (`crm.opportunities`, embudo de etapas, líneas de producto,
ganar/perder), Campañas (`crm.campaigns`, miembros vía leads) y Agenda
(`crm.calendar_events`, asistentes internos o externos).

## Entidades que este módulo posee

- `crm.leads`, `crm.lead_status_history` (vía `LeadRepository`). Catálogo
  de solo lectura: `crm.lead_status`, `crm.lead_sources`.
- `crm.opportunities`, `crm.opportunity_lines` (vía `OpportunityRepository`,
  crea encabezado + líneas en una transacción). Catálogo de solo lectura:
  `crm.sales_funnels`, `crm.sales_funnel_stages`, `crm.opportunity_loss_reasons`.
- `crm.campaigns`, `crm.campaign_members` (vía `CampaignRepository`).
- `crm.calendar_events`, `crm.calendar_event_attendees` (vía `CalendarEventRepository`).

## Con qué módulos colabora (síncrono)

- **`clientes`** — `LeadsService.convertir()` invoca `ClientesService.crear()`
  (patrón módulo dueño, nunca escribe directo en `customers.customers`).
  Verificado con test de integración real
  (`controllers/leads.controller.e2e-spec.ts`).
- **`ventas`** — `OportunidadesService.ganar()` acepta un
  `resultingSalesOrderId` ya creado por el llamador (comando síncrono en
  su forma más simple, `ventas` no expone todavía pedidos/cotizaciones
  separados de la factura directa — ver `CRM_ARCHITECTURE.md §14`).
- **`productos`** — lookup de solo lectura (`ProductoLookupRepository`)
  para validar `product_id` en `opportunity_lines`.

## Eventos

Ninguno publicado todavía. `LeadCreado`/`LeadEstadoCambiado`/
`LeadConvertido`/`OportunidadPerdida` están catalogados en
`CRM_ARCHITECTURE.md §7` como "preparados, sin publicar" — mismo estado
que el resto del proyecto (ningún módulo publica a `EventBusService`
todavía).

## Permisos

`crm.ver`, `crm.ver_leads`/`crm.gestionar_leads`,
`crm.ver_oportunidades`/`crm.gestionar_oportunidades`,
`crm.ver_campanas`/`crm.gestionar_campanas`,
`crm.ver_agenda`/`crm.gestionar_agenda` — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Tests

49 tests (entidades + servicios + integración real end-to-end contra
Postgres/Redis/RabbitMQ, `controllers/leads.controller.e2e-spec.ts`).
`nx run crm-backend:test`.
