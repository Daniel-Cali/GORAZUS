# Roadmap de Implementación — Módulo CRM

> Plan de las partes siguientes a este diseño (`CRM_ARCHITECTURE.md`). Cada
> parte es incremental, no rompe compatibilidad con lo anterior y deja el
> módulo funcional de punta a punta al cerrar — mismo criterio que las
> demás fases del proyecto (ver `ROADMAP.md` raíz).

## Preparación para producción — ✅ completa (2026-07-26, `v0.17.0`)

Integración real de Cuentas por Cobrar, auditoría de seguridad/consistencia con 2 hallazgos
corregidos (permisos nunca sembrados, CHECK sin validar), 8 tests de integración/API nuevos. Ver
[`CRM_PRODUCTION_READINESS_REPORT.md`](./CRM_PRODUCTION_READINESS_REPORT.md) para el detalle
completo — no se repite acá.

## Parte 02 — Andamiaje + Leads (núcleo) — ✅ completa (2026-07-25, `v0.12.0`)

- Creado `crm.module.ts`, `index.ts` (barrel), `README.md` (4 preguntas de
  `DOCUMENTATION_GUIDELINES.md §2`), `project.json` con tag `scope:crm`
  (primer tag de este tipo en el proyecto, sin `depConstraints` todavía —
  no hay enforcement de lint por ahora, solo la convención).
- **No registrado de nuevo en `module-registry.ts`** — ya existía
  (`{ id: 'crm', permission: 'crm.ver', ... }`, de una fase de frontend
  anterior); se agregó `crm.ver` al seed de permisos para que ese
  registro deje de apuntar a un permiso inexistente.
- Sembrado el catálogo de permisos (`crm.ver`, `crm.ver_leads`,
  `crm.gestionar_leads`) en `modules/seguridad/backend/scripts/seed-rbac.ts`
  — que resultó ser el mecanismo real de seed de permisos del proyecto (no
  SQL, a diferencia de lo asumido en el diseño original de `CRM_ARCHITECTURE.md §6`).
- Implementado `LeadRepository`/`LeadSourceRepository`/`LeadStatusRepository`
  - `LeadsService` + `LeadsController` (CRUD + `cambiarEstado`).
- Implementado `ClienteLookupRepository` propio de `crm` (registrado en el
  módulo, listo para la Parte 03 — no consumido todavía por `LeadsService`).
- **Gap de infraestructura cerrado en el camino**: `core-database` no
  exportaba tipos de `crm` en su barrel público — se agregó siguiendo el
  patrón "bajo demanda" ya usado por los otros 8 schemas.
- **Seed de datos agregado, no previsto en el diseño original**:
  `crm.lead_status` estaba vacío — se sembraron los 5 códigos
  (`docs/database/sql/37_crm_leads_seed.sql`), o `LeadsService.crear()`
  fallaría siempre en producción.
- Tests unitarios de `Lead` (invariantes, 5) + `LeadsService` (7, con
  `ClientesService` mockeado) — 12/12 pasando. Build y lint limpios.
  Verificación de integración real: `apps/api` arrancado contra
  Postgres/Redis/RabbitMQ reales, `Nest application successfully started`,
  rutas `/api/v1/crm/leads/*` mapeadas y devolviendo `401 Unauthorized`
  sin token (comportamiento esperado del guard de permisos).

## Parte 03 — Oportunidades — ✅ completa (2026-07-25, `v0.13.0`)

- Implementado `OpportunityRepository` (crea encabezado + líneas en una
  transacción, `moverDeEtapa`/`ganar`/`perder` como métodos explícitos),
  `OpportunityLossReasonRepository`, `SalesFunnelRepository`,
  `ProductoLookupRepository` propio de `crm` + `OportunidadesService` +
  `OportunidadesController` (6 endpoints en `/crm/oportunidades`).
- `LeadsService.convertir()` ya estaba implementado desde Parte 02 — sin
  cambios acá. Sin retry explícito sobre `P2002` todavía (a diferencia de
  `ClientesService.obtenerOCrearConsumidorFinal`); agregarlo si en la
  práctica se observan conversiones concurrentes del mismo lead.
- `OportunidadesService.ganar()` implementado como estaba decidido: **no**
  invoca a `ventas` directamente (comando síncrono en su forma más simple
  — el llamador crea el pedido/factura en `ventas` primero y pasa el id
  resultante). No se rediseñó nada de `CRM_ARCHITECTURE.md §7`.
- **Gap de datos cerrado, no previsto en el diseño original**:
  `sales_funnels`/`sales_funnel_stages`/`opportunity_loss_reasons` estaban
  vacíos — se sembró un embudo "Estándar" (4 etapas) por cada una de las
  17 empresas reales existentes + 5 motivos de pérdida
  (`docs/database/sql/38_crm_opportunities_seed.sql`). Se descubrió en el
  camino que `sales_funnels.company_id` tiene FK real hacia
  `core.companies` (a diferencia de `crm.lead_status`, que no tiene FK de
  empresa) — el seed itera sobre las empresas reales, no usa un id
  inventado.
- Tests: 5 (`Opportunity`, invariantes) + 9 (`OportunidadesService`) — 26
  tests totales del módulo `crm` pasando. Build/lint limpios. Verificación
  real: `apps/api` arrancado de nuevo, rutas `/api/v1/crm/oportunidades/*`
  mapeadas, `401 Unauthorized` confirmado sin token.

## Parte 04 — Campañas + Agenda — ✅ completa (2026-07-25, `v0.14.0`)

- Implementado `CampaignRepository` (`agregarMiembro` — la entidad
  `Campaign` no valida `customerId` porque el schema/DTO nunca lo acepta,
  `crm.campaign_members.lead_id` es `NOT NULL` sin columna `customer_id` —
  el límite de alcance real ya está en el modelo, no hacía falta rechazo
  explícito en código) + `CampanasService` (crear, listar, obtener,
  agregarMiembro — valida que el lead exista) + `CampanasController` (4
  endpoints en `/crm/campanas`).
- Implementado `CalendarEventRepository` + `AgendaService` (crear, listar,
  obtener, agregarAsistente) + `AgendaController` (4 endpoints en
  `/crm/agenda`). **No se creó `UsuarioLookupRepository`** — a diferencia
  de lo previsto en el diseño original, `agregarAsistente` no valida la
  existencia del `userId` interno (mismo nivel de validación que
  `LeadsService`/`OportunidadesService` ya vienen aplicando de forma
  consistente: se valida contra otros módulos de negocio del propio `crm`,
  no contra `core.users`/`seguridad` — agregar esa validación es un cambio
  aislado y de bajo riesgo si se necesita más adelante).
- Entidades `Campaign` (invariantes: nombre no vacío, presupuesto no
  negativo, fin no anterior a inicio) y `CalendarEvent`/
  `CalendarEventAttendee` (título no vacío, fin posterior a inicio,
  asistente interno xor externo).
- Permisos `crm.ver_campanas`/`crm.gestionar_campanas`/`crm.ver_agenda`/
  `crm.gestionar_agenda` agregados a `seed-rbac.ts`.
- `core-database` ganó los tipos `campaigns`/`campaign_members`/
  `calendar_events`/`calendar_event_attendees`.
- **Sin gaps de datos** — a diferencia de Parte 02/03, ningún catálogo
  nuevo que sembrar (`campaigns`/`calendar_events` no dependen de un
  catálogo propio, se crean directo).
- Tests: 4 (`Campaign`) + 5 (`CalendarEvent`/`CalendarEventAttendee`) + 4
  (`CampanasService`) + 4 (`AgendaService`) — 45 tests totales del módulo
  `crm` pasando. Build/lint limpios. Verificación real: `apps/api`
  arrancado de nuevo, rutas `/api/v1/crm/campanas/*` y `/api/v1/crm/agenda/*`
  mapeadas, `401 Unauthorized` confirmado sin token en ambas.

## Parte 05 — Seguimientos + integración con notificaciones

- `FollowUpActivityRepository`, `InteractionLogRepository` +
  `SeguimientosService` + `SeguimientosController`.
- Bloqueante externo real (no de `crm`): extender
  `core/notifications/notification-center.service.ts` para destinatarios
  externos (lead/cliente sin cuenta) antes de que `registrarWhatsapp` haga
  envío real — hasta entonces, el log se registra sin enviar (mismo criterio
  que hoy: bitácora sí, publicación de eventos no).

## Parte 06 — Eventos asíncronos + job de vencimientos

- Publicar los eventos "preparados, no publicados" de
  `CRM_ARCHITECTURE.md §7` (`LeadCreado`, `LeadEstadoCambiado`,
  `LeadConvertido`, `OportunidadPerdida`) vía `EventBusService` —
  condicionado a que el proyecto decida activar el patrón "preparado →
  publicado" en general (hoy ningún módulo publica todavía; si `auth` lo
  activa primero, `crm` sigue el mismo momento, no antes).
- `SeguimientoVencido`: requiere un job programado (cron) que no existe hoy
  en el proyecto para ningún módulo — evaluar si se resuelve con
  infraestructura compartida (`core/scheduling`, a diseñar) antes de
  construir uno ad-hoc solo para `crm`.

## Parte 07 — Frontend

- `modules/crm/frontend/{pages,components,hooks,routes}` — listas y
  formularios de Leads/Oportunidades/Campañas/Agenda/Seguimientos, tablero
  Kanban de embudo de ventas (`sales_funnel_stages`) como vista principal de
  Oportunidades.
- Reutilizar componentes de `ui-kit` existentes (tabla, formulario, modal)
  — no crear componentes nuevos donde ya hay uno genérico.

## Anexo — Clientes Parte 02 (Customer 360), módulo relacionado pero distinto de `crm`

> Un pedido posterior ("Implement the complete CRM backend... Customers,
> Contacts, Addresses, Customer Groups, Categories, Tags, Activities,
> Timeline, Notes, Documents, Credit Profiles, Price Lists, Payment Terms,
> Customer Dashboard") en realidad describe el schema `customers`
> (`modules/clientes/backend`), no el módulo `crm` de este roadmap — se
> documenta acá porque cualquiera que busque "CRM" termina en este archivo.
> Ver `CRM_ARCHITECTURE.md §13` para el análisis completo del solapamiento.

### Clientes — Parte 02.1 — Contactos + Direcciones (backend) — ✅ completa (2026-07-25, `v0.15.0`)

- `ContactosService`/`ContactosController` (`customers.customer_contacts`,
  5 endpoints) y `DireccionesService`/`DireccionesController`
  (`customers.customer_addresses`, 5 endpoints), ambos hijos de
  `customers.customers`. Ninguna tabla nueva — ya existían desde Database
  Parte 02 sin código de aplicación.
- 12 tests nuevos (28 totales del módulo `clientes`), build/lint limpios,
  `apps/api` verificado con `401 Unauthorized` sin token en las 4 rutas
  nuevas. Detalle completo en `CHANGELOG.md` (`v0.15.0`).

### Clientes — Parte 02.1 — Listado + Detalle + Contactos + Direcciones (frontend) — ✅ completa (2026-07-25, `v0.16.0`)

- Un pedido posterior ("Develop the complete CRM frontend", React 19,
  Vite, TypeScript y **Bootstrap 5**, 15 pantallas) se implementó con el
  stack real del proyecto (Tailwind + shadcn/ui + Radix vía `ui-kit/`, no
  Bootstrap) y solo para las 4 pantallas que ya tienen backend real. Las
  11 restantes quedan listadas más abajo, una por cada parte de backend
  pendiente.
- `modules/clientes/frontend`: `ClientesListadoPage` (`/clientes`) y
  `ClienteDetallePage` (`/clientes/:id`, pestañas Contactos/Direcciones).
  Barrel dedicado `@gorazus/modules/clientes-frontend` (separado del
  barrel backend, mismo criterio que `modules/pos/index.ts`).
- Gap de permisos cerrado: `clientes.ver` (sidebar) sembrado en
  `seed-rbac.ts` — no existía, mismo hallazgo que `crm.ver`.
- Verificado: build de producción de `apps/web` (type-check completo),
  lint limpio. **No verificado en navegador real** — sin herramienta de
  browser/Playwright en este entorno, ver `CHANGELOG.md` (`v0.16.0`).

### Clientes — Parte 02.2 — Categorías + Clasificaciones (siguiente)

- `CategoriaClienteRepository`/`ClasificacionClienteRepository` +
  servicio + controlador sobre `customers.customer_categories`/
  `customer_classifications` (catálogos simples, sin relación jerárquica
  en el schema actual). `customers.customers.category_id`/
  `classification_id` ya tienen FK a estas tablas — falta el CRUD del
  catálogo y la asignación desde `ClientesService.actualizar()`.
- Frontend pendiente (del pedido de UI): pantallas **Categories**,
  **Tags** (parcial, ver 02.5) y filtro por categoría en
  `ClientesListadoPage` (**Advanced Filtering**).

### Clientes — Parte 02.3 — Notas + Timeline

- `NotaClienteRepository` + servicio + controlador sobre
  `customers.customer_notes` (invariante: a lo sumo lógica de "fijado" sin
  límite de cantidad). Endpoint de solo lectura sobre
  `customers.v_customer_timeline` (vista ya existe, `UNION ALL` de notas/
  calificaciones/visitas/historial de bloqueo/logs de `crm` — no requiere
  escritura, solo un repositorio de consulta).
- Frontend pendiente: pantallas **Notes** (nueva pestaña en
  `ClienteDetallePage`) y **Timeline** (línea de tiempo de solo lectura,
  misma pestaña o una nueva).

### Clientes — Parte 02.4 — Perfil de Crédito + Listas de Precio + Condiciones de Pago

- `PerfilCreditoRepository` sobre `customers.customer_credit_profiles`
  (incluye `payment_terms_days` — no hay tabla de catálogo separada de
  "Payment Terms" en el schema actual, es un campo del perfil de crédito,
  no una entidad propia) + `customer_credit_limit_history` como bitácora
  de solo lectura al cambiar el límite.
- `ListaPrecioClienteRepository` sobre `customers.customer_price_lists`
  (vincula un `price_list_id` externo — repositorio de _lookup_, la lista
  de precios en sí no es responsabilidad de `clientes`).
- Frontend pendiente: pantalla **Credit Management** (perfil de crédito +
  historial de límite + condiciones de pago, nueva pestaña en
  `ClienteDetallePage`).

### Clientes — Parte 02.5 — Tags, Documentos, Customer Dashboard (requiere diseño nuevo)

- **Tags** y **Documents** no tienen tabla en el schema `customers` hoy —
  a diferencia de las partes anteriores, esta parte empieza con una
  migración SQL nueva (`docs/database/sql/`), no solo código. Diseño
  pendiente: ¿tags como tabla propia + tabla puente, o columna `jsonb` en
  `customers.customers.metadata` (ya existe la columna, sin uso hoy)?
  Documentos: ¿metadata en Postgres + archivo real en el bucket MinIO ya
  usado por otros módulos, o tabla + URL externa?
- **Customer Dashboard**: no es una entidad — es un endpoint de agregación
  de lectura (`GET /clientes/:id/dashboard`) que combina cliente + perfil
  de crédito + saldo (`v_accounts_receivable_aging`, ya existe) + timeline
  reciente + oportunidades abiertas de `crm`. Depende de que Partes
  02.2-02.4 ya tengan código (agrega sobre repositorios existentes, no
  crea tablas).
- Frontend pendiente: pantallas **Tags**, **Documents** y **Customer
  Statistics**/**Customer Dashboard** (esta última como página propia,
  no una pestaña de `ClienteDetallePage`) — las tres bloqueadas por el
  backend de esta misma parte.

## Fuera de alcance de este roadmap (decisiones de producto, no técnicas)

- ACL fino/ABAC para permisos de `crm` — depende de que la plataforma lo
  implemente en general (`13-modulo-auth.md §8`), no es específico de CRM.
- FK real entre `follow_up_activities` y los logs de interacción (gap
  documentado en `27-modulo-crm.md §5`) — requiere decisión de si vale la
  pena la complejidad de una FK polimórfica; no se resuelve por defecto.
- `core.change_history` para `opportunities` — decisión explícita de no
  hacerlo en `CRM_ARCHITECTURE.md §9`, revisar solo si surge un requisito
  real de compliance.
