# Modelo Lógico — CRM (`crm`)

Decisión de consolidación: **Lead / Prospecto / Cliente potencial** son
el mismo concepto en distintas etapas de calificación — una sola tabla
`leads` con `lead_status` (Nuevo, Contactado, Calificado...), no tres
tablas paralelas. **Agenda / Calendario** se consolidan en
`calendar_events`. Al ganar una oportunidad, se llama al comando
público de `sales` para crear el `SalesOrder` — no hay FK real hacia
`sales` (ver
[06-comunicacion-entre-modulos.md](../../architecture/06-comunicacion-entre-modulos.md)).

| Tabla                      | Propósito                                                            | FKs no-universales                                                                                                 |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `leads`                    | Contacto comercial en cualquier etapa previa a ser cliente formal    | `source_id → lead_sources`, `assigned_salesperson_id → sales.salespeople` (ID suelto)                              |
| `lead_sources`             | Origen del lead (referido, web, feria, campaña)                      | `company_id`                                                                                                       |
| `lead_status`              | Catálogo de estados de calificación                                  | `company_id`                                                                                                       |
| `lead_status_history`      | Historial de transición                                              | `lead_id → leads`, `status_id → lead_status`                                                                       |
| `sales_funnels`            | Embudo de ventas (puede haber más de uno, p. ej. Enterprise vs. SMB) | `company_id`                                                                                                       |
| `sales_funnel_stages`      | Etapa dentro de un embudo, con probabilidad de cierre esperada       | `funnel_id → sales_funnels`                                                                                        |
| `opportunities`            | Oportunidad de venta: lead/cliente, valor estimado, etapa actual     | `lead_id → leads`, `customer_id → customers.customers` (si ya es cliente), `funnel_stage_id → sales_funnel_stages` |
| `opportunity_lines`        | Producto/servicio incluido en la oportunidad                         | `opportunity_id → opportunities`, `product_id → products.products`                                                 |
| `opportunity_loss_reasons` | Catálogo de motivos de pérdida                                       | `company_id`                                                                                                       |
| `campaigns`                | Campaña de marketing con presupuesto                                 | `company_id`                                                                                                       |
| `campaign_members`         | Leads/oportunidades asociados a una campaña (N:M)                    | `campaign_id → campaigns`, `lead_id → leads`                                                                       |
| `follow_up_activities`     | Tarea/pendiente de seguimiento                                       | `lead_id → leads`, `opportunity_id → opportunities`, `assigned_to_user_id → core.users`                            |
| `call_logs`                | Registro de llamada                                                  | `lead_id → leads`, `customer_id → customers.customers`                                                             |
| `email_logs`               | Registro de correo enviado/recibido                                  | `lead_id → leads`, `customer_id → customers.customers`                                                             |
| `whatsapp_logs`            | Registro de mensaje de WhatsApp                                      | `lead_id → leads`, `customer_id → customers.customers`                                                             |
| `calendar_events`          | Evento de agenda/calendario (reunión, recordatorio)                  | `owner_user_id → core.users`                                                                                       |
| `calendar_event_attendees` | Asistentes al evento (N:M, internos y externos)                      | `event_id → calendar_events`, `user_id → core.users`                                                               |

**Total: 17 tablas.**
