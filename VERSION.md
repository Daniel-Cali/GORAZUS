# Versión — GORAZUS ERP

Versionado [SemVer](https://semver.org/lang/es/), pre-1.0: `MINOR` marca una fase de trabajo
completa y estable (no un release público), `PATCH` una corrección puntual. `0.0.0` no se usa —
el proyecto arrancó en `0.1.0` (bootstrap del monorepo + FASE 01-05). Sin releases públicos
todavía, así que no hay compromiso de compatibilidad entre versiones `0.x`.

> **Nota (2026-07-24)** — Database Refactor, Fase 01 (diseño del estándar de nomenclatura en
> español, sin ejecutar ningún renombrado) no incrementó la versión — es una fase de diseño puro,
> mismo criterio que FASE 05 Parte 01 y FASE 03 Parte 01 más abajo. Ver
> `DATABASE_SPANISH_STANDARD.md`/`DATABASE_DICTIONARY.md`/`DATABASE_MIGRATION_REPORT.md` para el
> resultado completo de esa fase de diseño — sigue siendo `0.11.1` hasta que se apruebe y ejecute.

## Versión actual: **0.23.0** (2026-07-27)

Contabilidad Enterprise, Parte 1 (Núcleo Contable + Estados Financieros). Origen: pedido "PROMPT
MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE" con 20 secciones (plan de cuentas, motor contable
automático, asientos, libros, estados financieros, CxC/CxP, bancos, conciliación, activos fijos,
depreciación, impuestos, centros de costo, presupuestos, cierre, auditoría, reportes) — alcance
real de varias semanas. Se acordó con el usuario (`AskUserQuestion`) el orden de partes antes de
escribir código: esta Parte 1 cubre el núcleo del que dependen las demás.

Reality-check previo: `modules/contabilidad/backend` estaba vacío, pero el schema `accounting` ya
tenía 28 tablas reales desde la certificación original de base de datos — se construyó código de
aplicación sobre 17 de ellas, sin agregar tablas nuevas.

Lo construido: plan de cuentas jerárquico (`chart_of_accounts`, código único por empresa), motor de
reglas contables (`accounting_rules`/`accounting_rule_lines` — `amount_formula` es el nombre de un
campo del "hecho contable" del módulo de origen, nunca una expresión evaluada, decisión de
seguridad deliberada contra ejecución de código arbitrario), asientos con ciclo de vida completo
(`draft`/`pending` → `posted` → `cancelled`/`reversed`, entidad `Asiento` valida partida doble
balanceada), Libro Diario, Libro Mayor, Balance General, Estado de Resultados y Flujo de Efectivo
(aproximado — ver limitaciones). Integración real y no bloqueante con `ventas`:
`VentasService.confirmarFactura()` dispara el motor; sin ninguna regla configurada para la empresa
(caso real de la mayoría hoy), no pasa nada — cumple "nunca romper compatibilidad con módulos
existentes".

**Hallazgo real corregido durante la verificación manual end-to-end** (no un test, un bug real):
`journal_entries` particionada por `posting_date` (mismo patrón que `sales.invoices`) — las
agregaciones de reportes (`$queryRaw` con `JOIN` manual, `journal_entry_lines` no tiene relación
real de Prisma hacia `journal_entries`) filtraban solo `status='posted'`. Al revertir un asiento,
el original pasa a `status='reversed'` y **desaparecía por completo** de los reportes mientras su
reversión (sí `posted`) seguía contando — el Balance General mostraba `-$100` en vez de `$0` tras
crear y revertir una transacción de `$100`. Corregido: el filtro pasa a
`status IN ('posted', 'reversed')` en las 3 consultas afectadas — un asiento revertido sigue siendo
historia real del libro, la reversión es un asiento nuevo que lo cancela, no un borrado del
original. Verificado de nuevo contra Postgres real tras el fix: Balance General vuelve a `$0`/`$0`.

**Gap real de diseño encontrado al sembrar datos reales** (no un bug, una restricción de schema):
`account_types.code` tiene un CHECK real que solo permite 5 valores (`asset`/`liability`/`equity`/
`income`/`expense`), no los 8 que el pedido original distingue (incluye Costos/Otros
Ingresos/Otros Gastos) — resuelto con listas explícitas de cuentas
(`costAccountIds`/`otherIncomeAccountIds`/`otherExpenseAccountIds`) para la subclasificación fina
del Estado de Resultados, en vez de inventar códigos de tipo que el CHECK real rechazaría.

`MINOR`: 31 tests nuevos (7 entidad `Asiento` + 5 entidad `CuentaContable` + 5 servicio
`MotorContableService` + 10 servicio `AsientosService` + 4 e2e real), 31/31 ✅. Sin regresión en
`ventas-backend` (30/30) ni `pos-backend` (9/9). Build/lint limpios, arranque real de la API
verificado (26 rutas de `/contabilidad/*` mapeadas), OpenAPI regenerado y confirmado. Verificación
manual completa contra Postgres real: crear factura → confirmar → asiento automático → Balance
General cuadra (Activos = Pasivos + Patrimonio + Utilidad) → revertir → Balance General vuelve a
cero. Permisos `contabilidad.gestionar_plan_cuentas`/`gestionar_asientos`/`ver_reportes` sembrados.
Sin migración de base de datos — las 17 tablas usadas ya existían completas.

CxC/CxP avanzadas, Bancos, Conciliación Bancaria, Activos Fijos, Depreciaciones, Impuestos (motor
completo), Presupuestos (ejecución), Cierre Contable, Auditoría dedicada, Reportes exportables —
explícitamente fuera de esta parte, ver `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md`.

## 0.22.0 (2026-07-26)

FASE 04 — Módulo Facturación Enterprise, Parte 1 (Motor de Facturación). Origen: pedido con
arquitectura CQRS/DDD/Value Objects/Factories y stack PHP/PHPUnit/PHPStan — no aplica a este
proyecto (NestJS/TypeScript/Prisma). Análisis previo (reality-check obligatorio antes de escribir
código, mismo protocolo que Roles Enterprise): `modules/ventas/backend` ya tenía un motor de
facturación real y funcionando desde `v0.11.0` (crear/confirmar/obtener/listar/registrar recibo,
impuesto real por línea) — se extendió ese módulo, no se construyó uno paralelo en PHP.

Lo genuinamente nuevo: editar borrador (`PUT`, recalcula impuestos, rechaza con `409` si ya no es
`draft`), eliminar borrador (`DELETE`, baja lógica, mismo rechazo), anular (`POST .../anular`,
`draft`/`issued` → `cancelled`, estado final, rechaza anular dos veces), duplicar (`POST
.../duplicar`, nuevo borrador con las mismas líneas, impuestos recalculados a la tasa vigente),
descuento general por factura (`general_discount_percentage`, migración `40_facturacion_descuento_
general.sql`, aditiva — se aplica sobre el subtotal ya neto de descuentos de línea, sin afectar la
base del impuesto) y filtros/orden avanzados en `listar()` (cliente/estado/rango de fechas,
orden por fecha/total/número). Eventos de dominio preparados (`FacturaCreadaEvent`/
`FacturaConfirmadaEvent`/`FacturaAnuladaEvent`), mismo patrón "preparado, sin publicar todavía" que
`auth`/`seguridad`.

**Ruptura de compatibilidad real, detectada y corregida en el mismo turno** (regla obligatoria del
pedido: "nunca romper compatibilidad con módulos existentes"): el nuevo campo con `.default(0)` en
Zod volvía `generalDiscountPercentage` obligatorio en el tipo `CrearFacturaInput` (`z.infer`
resuelve al tipo de SALIDA de Zod, donde todo default es no-opcional) y `listar()` cambió de firma
posicional a un objeto de filtros — ambos rompían la compilación de `pos-backend`
(`pos-checkout.service.ts`). Corregido: los tipos exportados pasan a `z.input` (el tipo de ENTRADA,
donde los campos con default sí son opcionales) y `pos-checkout.service.ts` se actualizó a la nueva
firma de `listar()`. Confirmado con `pos-backend:build`/`test` (9/9) y `ventas-backend:build`/
`lint`/`test` (30/30) limpios tras el fix.

`MINOR`: `facturacion-domain-events.spec.ts` nuevo (3), `facturas.controller.e2e-spec.ts` nuevo (5),
`ventas.service.spec.ts` extendido a 17. 30 tests totales de Ventas (30/30 ✅, incluidos los 5 ya
existentes de `factura.entity.spec.ts`). Migración aditiva
única (Database v1.2.1, ver abajo). Build/lint/test limpios en `ventas-backend` y `pos-backend`,
arranque real de la API verificado (9 rutas de `/ventas/facturas` mapeadas, `401` confirmado con
`curl` en 7 de ellas), OpenAPI regenerado y confirmado (`docs/api/openapi.json`).
Permiso `ventas.ver` agregado a `seed-rbac.ts` (mismo gap sistémico que `clientes.ver`/`crm.ver` en
fases anteriores — el ítem existía en la lógica pero nunca se había sembrado). Documentos
nuevos: `modules/ventas/README.md`, `docs/reports/ventas/INVOICE_ARCHITECTURE.md`,
`INVOICE_API_REPORT.md`, `INVOICE_TEST_REPORT.md`, `INVOICE_HEALTH_REPORT.md`, `INVOICE_REPORT.md`.

PDF/vista previa/impresión/envío por correo de la factura — mencionados en el pedido bajo
"Documentos" — se dejan explícitamente fuera de esta parte: no existe ninguna librería de
generación de PDF en el proyecto todavía, y el pedido ya excluye "Facturación Electrónica" del
alcance; agregar una dependencia nueva de este tipo sin un caso de uso que la consuma habría sido
alcance no pedido. Documentado como Parte 2 pendiente.

## 0.21.0 (2026-07-26)

GORAZUS ERP Enterprise Phase 03 Part 04, Subfase 4.1 (Roles Module Infrastructure) — única
subfase autorizada este turno (el pedido pide gate explícito: revisión y aprobación antes de
continuar con 4.2-4.8). Análisis previo: casi toda la infraestructura pedida (module structure,
entity, repositorios, DTOs, exceptions, auditoría, tests, docs técnicos) ya existía de las 3 fases
anteriores (`v0.18.0`-`v0.20.0`). Lo único nuevo: `RolCreadoEvent`/`RolActualizadoEvent`/
`RolEliminadoEvent` (`modules/seguridad/backend/events/`), mismo patrón "preparado, sin publicar
todavía" que `modules/auth/backend/events/*.event.ts`. "Mappers" (pedido explícitamente) no es un
patrón que este proyecto use en ningún módulo — omitido a propósito, documentado el porqué.

Subfases 4.2 (CRUD completo), 4.3 (scoping empresa/sucursal), y buena parte de 4.5 (API REST) ya
están completas desde `v0.18.0` — no se re-implementan. "Warehouse Roles" (subfase 4.3) y
Role Hierarchy (subfase 4.4, jerarquía Super Admin → Operator) son trabajo genuinamente nuevo,
pendiente de las subfases correspondientes.

`MINOR`: +3 tests (`roles-domain-events.spec.ts`), build/lint limpios. Sin migración, sin cambios
de contrato público, sin romper compatibilidad — tal como pedían las reglas obligatorias del
pedido.

## 0.20.0 (2026-07-26)

Roles Enterprise — Domain Value Objects, descartados a propósito. Origen: pedido
"Roles Enterprise - Domain Value Objects" (.NET/C#, `RoleId`/`RoleName`/`RoleCode`
como clases con igualdad de valor propia). Ningún otro entity del proyecto usa ese patrón (`Cliente`, `Lead`, `Opportunity`, el
propio `Rol` de `v0.18.0`/`v0.19.0` validan primitivos directo en el constructor) — construirlos
solo para Roles habría sido inconsistente y habría requerido reescribir repositorio/servicio/
controlador/validadores para hablar en VOs en vez de `string`.

Las invariantes pedidas (largo máximo, normalización, caracteres válidos) se incorporaron a la
entidad `Rol` ya existente: `name` se guarda recortado (trim, máx. 100), `code` se guarda recortado
y en mayúsculas (máx. 50, solo letras/números/guion bajo). `RolesService.crear()`/`actualizar()`
ahora leen `.name`/`.code` de vuelta de la entidad ya normalizada para persistir el valor
normalizado, no el crudo — un bug real que se hubiera introducido si la entidad normalizaba pero el
servicio seguía usando las variables originales. `crearRolSchema`/`actualizarRolSchema` (Zod)
reflejan las mismas invariantes (con `.trim()` antes del `.regex()`, para no rechazar un código con
espacios que la entidad iba a aceptar después de normalizar) — sin esto, un código inválido hubiera
llegado al `Error` de dominio sin traducir y roto en un 500, mismo tipo de hallazgo que
`RolDeFabricaException` (`v0.18.0`).

`MINOR`: +18 tests (7 entidad, 4 servicio, 7 e2e — 46 tests totales de Roles), build/lint limpios,
verificación en vivo de la API. Sin migración — solo invariantes de aplicación, sin columnas nuevas.

## 0.19.0 (2026-07-26)

Roles Enterprise — Domain Entities: `code`/`description`/`roleType` reales sobre `core.roles`
(migración `39_roles_enterprise_fields.sql`). Origen: pedido "Roles Enterprise - Domain Entities"
(.NET/C#, `Domain/Entities/Role.cs`+`RoleContext.cs`+`Enums/RoleType.cs`, con `RoleType` en
`Organization`/`Department`/`Project`) — mismo criterio que `v0.18.0`: se tradujo a TypeScript sobre
`modules/seguridad/backend`, y se ajustó `RoleType` a valores reales del proyecto
(`system`/`tenant`/`company`/`branch`/`custom`) sin la entidad `RoleContext` (el scoping real ya
está resuelto por `company_id`/`branch_id`, `v0.18.0` — construir `RoleContext` habría duplicado
ese mecanismo con conceptos que no existen en GORAZUS).

Migración 39 (aplicada y verificada): `ALTER TABLE core.roles ADD COLUMN code, description,
role_type` + CHECK (`role_type` limitado a los 5 valores reales) + backfill de los roles de fábrica
existentes a `role_type = 'system'`. Regenerados los 21 clientes Prisma (pipeline `db:pull` →
`db:split` → `db:generate`, necesario por ser una columna real nueva en `core`, a diferencia de la
vista de solo lectura de Cuentas por Cobrar en `v0.17.0`).

`Rol` (entidad) gana invariantes nuevos: `roleType` debe ser uno de los 5 valores reales,
`isSystemRole=true` exige `roleType='system'` — la API rechaza `roleType: 'system'` con `400`
(solo el script de seed crea roles de fábrica). `MINOR`: +4 tests (`rol.entity.spec.ts`,
`roles.service.spec.ts`, `roles.controller.e2e-spec.ts`, 28 tests totales de Roles), build/lint
limpios, arranque completo de la API verificado tras la regeneración de Prisma (incluidas rutas de
`clientes`/`crm`, sin roturas cruzadas).

## 0.18.0 (2026-07-26)

Roles Enterprise — CRUD completo + scoping real sobre `modules/seguridad/backend` (no un módulo
nuevo). Origen: pedido "ROLES ENTERPRISE - FASE 4.1" con estructura `.NET/C#` (Commands/Queries/
DTOs/ValueObjects, Entity Framework, `.cs`) que no aplica a este proyecto (NestJS/TypeScript/
Prisma) y que además duplicaba un Roles ya implementado — el usuario confirmó reforzar el Roles
real existente en vez de construir la estructura ajena.

`RolesService` ganó `obtener(id)` (rol + códigos de permiso asignados, no existía forma de verlo
sin consultar la base a mano), `actualizar()` (renombrar) y `eliminar()` (baja lógica) — ambos
usando el invariante `verificarPuedeEliminarse/Renombrarse` de la entidad `Rol`, que existía desde
antes pero nunca se llamaba desde ningún lado (código muerto). Nueva `RolDeFabricaException` (409)
traduce ese invariante a un status HTTP limpio en vez de un 500 sin traducir.

Scoping real cerrado: `core.roles.company_id`/`branch_id` ya eran nullable en el schema (rol de
tenant completo, de una empresa, o de una sucursal) pero la API nunca lo exponía — `crear()`
fijaba siempre la empresa activa de la sesión y `listar()` no filtraba nada (la RLS de `core.roles`
solo aísla por tenant). `POST /seguridad/roles` acepta `companyId`/`branchId` opcionales
(`companyId: null` explícito = rol de todo el tenant), `GET /seguridad/roles` acepta `?companyId=`.

También cerrado: `DELETE /seguridad/roles/:id/permisos/:code` — el método `revocarPermiso` del
service existía desde antes sin ningún endpoint que lo expusiera.

`MINOR`: 15 tests unitarios nuevos (`roles.service.spec.ts`, no existía) + e2e extendido (9 tests,
24 totales), build/lint limpios, arranque real de la API con las 4 rutas nuevas verificadas
(`401` sin token), OpenAPI regenerado y confirmado. Hallazgo real corregido en el camino: un bug en
el propio test e2e nuevo asumía que el admin de prueba tenía `company_id` real — es un admin de
todo el tenant (`company_id` null), reveló que pasar ese valor sin validar como filtro de UUID
rompía en un error de Postgres sin traducir (mismo tipo de hallazgo que el CHECK de `address_type`
en Clientes — documentado como patrón sistémico en `docs/manuals/TECNICO.md §5`, no corregido en
los demás endpoints con filtro `companyId` del proyecto por estar fuera de alcance de esta fase).

## 0.17.0 (2026-07-26)

CRM/Clientes — preparación para producción. Integración real nueva: Cuentas por Cobrar
(`GET /clientes/:id/cuentas-por-cobrar`, sobre `customers.v_accounts_receivable_aging`, `$queryRaw`
parametrizado — la vista no es un modelo de Prisma, `previewFeatures` del pipeline no incluye
`"views"`). Sales/Inventory ya estaban integrados (Parte 03); Cash documentado sin punto de
integración real (sin caso de uso); Quotations/Orders/Purchasing/Accounting documentados como
integraciones futuras (los módulos no existen todavía — `CRM_ARCHITECTURE.md §14`).

Auditoría de producción con 2 hallazgos reales corregidos: (1) 6 permisos de `clientes` estaban en
`seed-rbac.ts` pero nunca se habían sembrado de verdad en la base (el script se había editado, no
re-ejecutado) — cualquier usuario, incluido un administrador, habría recibido `403` en producción;
(2) el CHECK `address_type` de `customer_addresses` (`billing`/`shipping`/`other`) no estaba
reflejado en la validación de Zod ni en la entidad de dominio — un valor fuera de rango rompía en
un 500 de Postgres sin traducir en vez de un 400 limpio, corregido en backend y frontend.

`MINOR`: +2 suites de tests de integración/API reales (`clientes.controller.e2e-spec.ts`,
`leads.controller.e2e-spec.ts`, 8 tests contra Postgres/Redis/RabbitMQ reales, incluida la
verificación cruzada Lead→Cliente), 85 tests totales entre ambos módulos (36 de `clientes` + 49 de
`crm`), build/lint limpios, OpenAPI regenerado y verificado. Documentación: `modules/crm/README.md`
reescrito (desactualizado desde Parte 02), `modules/clientes/README.md` nuevo, `USUARIO.md` con
sección real de Clientes, `CRM_PRODUCTION_READINESS_REPORT.md` nuevo.

## 0.16.0 (2026-07-25)

Clientes — Parte 02, frontend real (React 19 + Vite + TypeScript, `@gorazus/ui-kit`).
`modules/clientes/frontend` nuevo: `ClientesListadoPage` (`/clientes` — búsqueda con debounce,
paginación server-side, orden client-side de la página cargada, alta de cliente) y
`ClienteDetallePage` (`/clientes/:id` — edición, pestañas Contactos/Direcciones con CRUD completo
incluida baja lógica). Barrel frontend dedicado (`modules/clientes/frontend/index.ts`,
`@gorazus/modules/clientes-frontend`) separado del barrel backend existente — evita arrastrar
react-router-dom a `crm-backend`/`pos-backend` (consumidores reales del barrel backend) o los
clientes Prisma al bundle del navegador, mismo criterio ya documentado en `modules/pos/index.ts`.
Ruta `/clientes` reemplaza su `ComingSoonPage` en `apps/web/router.tsx`. Permiso `clientes.ver`
agregado a `seed-rbac.ts` (gap real: el ítem de sidebar ya apuntaba a este permiso desde antes, sin
que existiera — mismo hallazgo que `crm.ver` en Parte 02 backend). `MINOR`: build de `apps/web`
verificado (type-check completo vía Vite/Rollup), lint de `clientes-frontend` limpio.

Origen: pedido "Develop the complete CRM frontend" (React 19 + TypeScript + Vite + **Bootstrap 5**,
15 pantallas). Dos hallazgos antes de implementar: (1) el stack real del proyecto es React 19 + Vite

- **Tailwind + shadcn/ui + Radix** (`ui-kit/`, `docs/frontend/UI_GUIDELINES.md`), no Bootstrap —
  traer Bootstrap habría creado un segundo sistema de diseño en paralelo, exactamente lo que "reutilizar
  componentes existentes, no duplicar" pide evitar; se usó el stack real. (2) De las 15 pantallas
  pedidas, solo 4 tienen backend real hoy (Listado, Detalle, Contactos, Direcciones — v0.15.0); las 11
  restantes (Dashboard, Timeline, Activities, Notes, Documents, Credit Management, Tags, Categories,
  Statistics, Search avanzado, Filtros avanzados) dependen de partes de backend que todavía no existen
  (`CRM_ROADMAP.md`, anexo Clientes Parte 02.2-02.5) — construir esas pantallas ahora habría sido UI
  sin datos reales detrás. Se implementaron las 4 pantallas con backend real; el resto queda
  documentado como trabajo de frontend pendiente, alineado 1:1 con cada parte de backend pendiente.

## 0.15.0 (2026-07-25)

Clientes — Parte 02, primera entrega (Customer 360, código real: Contactos + Direcciones).
`modules/clientes/backend` suma dos sub-recursos hijos de `customers.customers`, ambas tablas ya
existían en el schema desde Database Parte 02 pero seguían sin código: `ContactosService`
(`customers.customer_contacts` — crear/listar/obtener/actualizar/eliminar, invariante "un solo
contacto principal por cliente") con `ContactosController` (5 endpoints en
`/clientes/:customerId/contactos`), y `DireccionesService` (`customers.customer_addresses`, misma
forma — invariante "una sola dirección predeterminada por cliente") con `DireccionesController` (5
endpoints en `/clientes/:customerId/direcciones`). `company_id`/`branch_id` de cada registro hijo se
heredan del cliente padre (nunca del usuario actor) para multi-company real. Permisos
`clientes.ver_contactos`/`clientes.gestionar_contactos`/`clientes.ver_direcciones`/
`clientes.gestionar_direcciones` sembrados en `seed-rbac.ts`. `MINOR`: 12 tests nuevos (28 totales
del módulo), build/lint limpios, arranque real de la API verificado, 4 endpoints nuevos confirmados
con `401` sin JWT. **Sin cambios de base de datos** — ambas tablas, sus columnas y sus FK a
`customers.customers` ya existían.

Origen: pedido "Implement the complete CRM backend... Customers, Contacts, Addresses, Customer
Groups, Categories, Tags, Activities, Timeline, Notes, Documents, Credit Profiles, Price Lists,
Payment Terms, Customer Dashboard" (14 "módulos"). Análisis previo (ver
`docs/reports/crm/CRM_ARCHITECTURE.md` para el detalle): esto es en realidad Customer 360 sobre el
schema `customers` (no el módulo `crm` de Leads/Oportunidades/Campañas/Agenda, que ya está
completo). De las 14 piezas pedidas, 12 ya tenían tabla real desde Database Parte 02 sin ningún
código de aplicación; 2 (Tags, Documents) no tienen tabla todavía; "Customer Dashboard" es una
agregación de lectura, no una entidad. Alcance total demasiado grande para una sola entrega — se
divide en partes, mismo criterio que CRM Partes 02-04. Ver `docs/reports/crm/CRM_ROADMAP.md` para
las partes restantes (Categorías/Clasificaciones, Notas + Timeline, Perfil de Crédito + Listas de
Precio, y una parte final para Tags/Documents que requiere migración nueva + Dashboard).

## 0.14.0 (2026-07-25)

CRM — Parte 04 (código real: Campañas + Agenda). `modules/crm/backend` suma dos sub-dominios más:
`CampanasService` (crear, listar, obtener, agregarMiembro — solo admite leads, `crm.campaign_members`
no tiene columna `customer_id`) con `CampanasController` (4 endpoints en `/crm/campanas`), y
`AgendaService` (crear, listar, obtener, agregarAsistente — interno xor externo) con
`AgendaController` (4 endpoints en `/crm/agenda`). Entidades `Campaign`/`CalendarEvent`/
`CalendarEventAttendee` con invariantes. Permisos `crm.ver_campanas`/`crm.gestionar_campanas`/
`crm.ver_agenda`/`crm.gestionar_agenda` sembrados en `seed-rbac.ts`. `MINOR`: 19 tests nuevos (45
totales del módulo), build/lint limpios, arranque real de la API verificado de nuevo. **Sin cambios
de base de datos** — a diferencia de Partes 02/03, ningún catálogo nuevo que sembrar.

## 0.13.0 (2026-07-25)

CRM — Parte 03 (código real: Oportunidades). `modules/crm/backend` suma el sub-dominio de
Oportunidades: entidad `Opportunity` (invariantes: debe originarse en un lead o cliente existente,
etapa de embudo obligatoria, líneas con cantidad > 0), `OpportunityRepository` (crea encabezado +
líneas en una transacción), `OpportunityLossReasonRepository`/`SalesFunnelRepository` (catálogos,
solo lectura) + `ProductoLookupRepository` propio de `crm`, `OportunidadesService` (crear,
moverDeEtapa, ganar — registra el pedido/factura resultante de `ventas` sin invocarlo directamente,
tal como ya estaba decidido en `CRM_ARCHITECTURE.md §7`, perder — exige motivo), 6 endpoints en
`/crm/oportunidades`. Catálogo de permisos (`crm.ver_oportunidades`, `crm.gestionar_oportunidades`)
sembrado en `seed-rbac.ts`. `MINOR`: 14 tests nuevos (26 totales del módulo), build/lint limpios,
arranque real de la API verificado de nuevo. Único cambio de schema: seed de
`sales_funnels`/`sales_funnel_stages` (un embudo "Estándar" de 4 etapas por cada una de las 17
empresas reales — se descubrió que `sales_funnels.company_id` tiene FK real, a diferencia de
`crm.lead_status`) y `opportunity_loss_reasons` (`docs/database/sql/38_crm_opportunities_seed.sql`)
— no es una migración estructural.

## 0.12.0 (2026-07-25)

CRM — Parte 02 (código real: Leads). Primer código de negocio del módulo CRM —
`modules/crm/backend`: entidad `Lead` con invariantes, `LeadRepository`/`LeadStatusRepository`/
`LeadSourceRepository`/`ClienteLookupRepository` (puerto + adaptador Prisma), `LeadsService`
(crear, listar, obtener, cambiarEstado con bitácora en `lead_status_history`, convertir —
idempotente, invoca `ClientesService.crear()` sin escribir nunca directo en
`customers.customers`), `LeadsController` (`/crm/leads`, 5 endpoints), catálogo de permisos
(`crm.ver`, `crm.ver_leads`, `crm.gestionar_leads`) sembrado en
`modules/seguridad/backend/scripts/seed-rbac.ts`. Arquitectura ya diseñada en
`docs/reports/crm/CRM_ARCHITECTURE.md` (Parte 01) — esta parte la implementa tal cual, sin cambios
de diseño. `MINOR`, no `PATCH`: agrega una fase de negocio nueva y estable (12 tests unitarios
pasando, build/lint limpios, arranque real de la API contra Postgres/Redis/RabbitMQ reales
verificado — `Nest application successfully started`, rutas `/api/v1/crm/leads/*` mapeadas,
`401 Unauthorized` confirmado sin token). Único cambio de schema de esta parte: seed del catálogo
`crm.lead_status` (`docs/database/sql/37_crm_leads_seed.sql`, estaba vacío) — no es una migración
estructural, no incrementa la versión de Database Enterprise.

## 0.11.1 (2026-07-24)

Frontend Redesign, Fase 01 — Auditoría Visual y Mejora de UI. `PATCH`, no `MINOR`: no agrega
ninguna fase nueva de negocio ni módulo — corrige defectos reales de UI ya existente (5 bugs
encontrados y arreglados, verificados con Playwright real y medición de contraste WCAG, no a ojo):
usuario que desaparecía del Topbar/Dashboard tras recargar la página (`RequireAuth` nunca repoblaba
el store, solo el token), clases de Tailwind purgadas en silencio para todo `modules/*/frontend`
(el `content` del config no las escaneaba — la card "Abrir caja" del POS ignoraba `max-w-md` por
completo), contraste insuficiente del color destructivo (3.61:1/3.78:1, por debajo del mínimo AA de
4.5:1 — afectaba todo mensaje de error de formulario), `DataTable` sin encabezado fijo/columnas
ocultables/control de tamaño de página/skeleton loader, y tipografía por debajo de 14px en texto
real de notificaciones. Cero cambios de API, base de datos o reglas de negocio — regla explícita de
esta fase. Ver `FRONTEND_VISUAL_AUDIT.md`, `UI_IMPROVEMENTS.md`, `DESIGN_FIXES.md`,
`ACCESSIBILITY_REPORT.md`, `RESPONSIVE_REPORT.md`, `COMPONENT_AUDIT.md` y
`LAYOUT_RECOMMENDATIONS.md` para el detalle completo.

## 0.11.0 (2026-07-24)

FASE 06, Parte 01 — Punto de Venta (POS) Enterprise. `MINOR`: primer código real de venta —
módulos nuevos `clientes` (`customers.customers` + resolución de "Consumidor Final"), `caja`
(`cash_registers`/`cash_register_openings`/`cash_register_closings`/`cash_movement_types`/
`cash_movements`), `ventas` (`invoice_status`/`invoices`/`invoice_lines`/`receipts`/
`receipt_allocations`) y `pos` (orquestador de checkout, sin tablas propias, primer caso real de
composición backend-a-backend entre módulos de negocio vía el barrel `modules/<x>/index.ts`).
**Se saltó el orden previsto** (`ROADMAP.md`/`INVENTORY_NEXT_PHASE.md` tenían Inventario Parte
05-08 antes de Clientes/Ventas/Caja/POS) porque el pedido explícito de esta sesión fue construir el
POS directamente — documentado como desviación honesta, no un cambio de plan silencioso. Durante la
verificación end-to-end contra Postgres real (Docker arriba por primera vez en 9 sesiones) se
encontraron y corrigieron dos bugs preexistentes de Fase 05: doble aplicación de movimientos de
stock (el trigger de base de datos y la aplicación escribían el mismo delta) y un error de tipo en
el bloqueo de filas (`uuid = text`). Ver `POS_ARCHITECTURE.md`, `POS_DATABASE.md`, `POS_API.md`,
`POS_TEST_REPORT.md`, `POS_HEALTH_REPORT.md`, `POS_RELEASE_NOTES.md` para el detalle completo.

## 0.10.0 (2026-07-24)

FASE 05, Parte 04 — Ajustes y Conteos Físicos. `MINOR`: primer código real sobre
`stock_adjustment_reasons`/`stock_adjustments`/`stock_adjustment_lines`/`physical_counts`/
`physical_count_lines`/`cycle_count_schedules` (6 tablas más de `inventory`, 15 de 34 en total) —
ajustes que resuelven `previousQuantity` del stock real y generan movimientos vía
`registrarLote`, conteos físicos con captura ciega y generación automática de ajuste ante
discrepancias, programación de conteos cíclicos por zona. Cierra el riesgo de concurrencia
documentado desde `0.8.0`: bloqueo real de filas (`SELECT ... FOR UPDATE`) en el motor de
movimientos y en reservas. Ver `INVENTORY_ADJUSTMENTS_REPORT.md`, `INVENTORY_PHYSICAL_COUNTS.md` y
`INVENTORY_CYCLE_COUNT.md` para el detalle completo, `INVENTORY_TEST_REPORT.md` para testing,
`INVENTORY_API.md` para referencia de endpoints.

## 0.9.0 (2026-07-23)

FASE 05, Parte 03 — Reservas y Transferencias. `MINOR`: primer código real sobre
`stock_reservations`/`stock_transfers`/`stock_transfer_lines` (3 tablas más de `inventory`, 9 de 34
en total) — reservas que protegen stock físico (`quantity_reserved`) sin descontarlo, transferencias
entre almacenes con flujo de estados (`draft → in_transit → received`) que generan movimientos
atómicos por línea vía `MovimientoStockRepository.registrarLote` (nuevo). Corrige el chequeo de
stock suficiente para comparar contra disponible real (`on_hand - reserved`), no solo contra `on_hand`
(TODO dejado en `0.8.0`). Ver `INVENTORY_RESERVAS_TRANSFERENCIAS_REPORT.md` para el detalle
completo, `INVENTORY_RESERVAS_TRANSFERENCIAS_TEST_REPORT.md` para testing,
`INVENTORY_RESERVAS_TRANSFERENCIAS_API.md` para referencia de endpoints.

## 0.8.0 (2026-07-23)

FASE 05, Parte 02 — Motor de Stock y Movimientos. `MINOR`: primer código real sobre `stock`/
`stock_movement_types`/`stock_movements` (3 de las 34 tablas de `inventory`, sumadas a las 3 de
Almacenes en `0.6.0`) — motor único de movimientos con actualización atómica de stock, consultas
de disponible y kardex real (`inventory.v_kardex`). Ver `INVENTORY_STOCK_REPORT.md` para el detalle
completo, `INVENTORY_STOCK_TEST_REPORT.md` para testing, `INVENTORY_STOCK_API.md` para referencia
de endpoints.

> **Nota** — FASE 05, Parte 01 fue una fase de diseño puro (arquitectura del módulo de Inventario
> Enterprise, sin código de negocio), así que no incrementó la versión — siguió siendo `0.7.0`
> hasta esta parte. Ver `INVENTORY_ARCHITECTURE.md`/`INVENTORY_STATUS.md` para el resultado de esa
> fase de diseño.

## 0.7.0 (2026-07-23)

FASE 04 — Productos. `MINOR`: primer código real de `modules/productos/backend` — CRUD de las 5
tablas núcleo del catálogo (Unidades de Medida, Categorías, Marcas, Modelos, Productos), sobre las
35 tablas totales del schema `products`. Ver `PRODUCTOS_REPORT.md` para el detalle completo,
`PRODUCTOS_TEST_REPORT.md` para testing, `PRODUCTOS_API.md` para referencia de endpoints.

## 0.6.0 (2026-07-23)

FASE 03, continuidad — Almacenes. `MINOR`: primer código real de `modules/inventario/backend`
(vacío desde su creación, confirmado en 3 auditorías previas) — CRUD de Almacén → Zona → Ubicación
(`inventory.warehouses`/`warehouse_zones`/`warehouse_locations`), cierra el único ítem real
pendiente de la lista de prioridad "primero" de FASE 03. Ver `ALMACENES_REPORT.md` para el detalle
completo, `ALMACENES_TEST_REPORT.md` para testing, `ALMACENES_API.md` para referencia de endpoints.

## 0.5.0 (2026-07-22)

FASE 03, Parte 03 — Gestión de Usuarios Enterprise. `MINOR`: CRUD administrativo completo
(editar/eliminar/restaurar/estado agregado/reseteo de contraseña), multiempresa (`core.user_companies`,
wireada sin consumidor desde Enterprise v1.0.0) y preferencias/avatar (`core.user_profiles`, ídem) —
más una corrección de seguridad real (fuga de `password_hash` en 5 endpoints preexistentes). Ver
`USERS_REPORT.md` para el detalle completo, `USERS_SECURITY_REPORT.md` para el hallazgo de
seguridad, `USERS_TEST_REPORT.md` para testing, `USERS_API.md` para referencia de endpoints.

## 0.4.0 (2026-07-22)

FASE 03, Parte 02 — Autenticación Enterprise. `MINOR`, no `PATCH`: a diferencia de Parte 2.1
(aditivo/preparatorio), esta parte agrega funcionalidad real y cambia comportamiento de endpoints
existentes — "recordar sesión", protección de session-hijacking, verificación de empresa/sucursal
activa, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, adopción de la config/JWT
Provider preparados en `0.3.1`. Ver `AUTH_REPORT.md` para el detalle completo,
`AUTH_TEST_REPORT.md` para testing, `JWT_CONFIGURATION.md`/`OPENAPI_AUTH.md` para referencia.

## 0.3.1 (2026-07-22)

FASE 2, Parte 2.1 — Infraestructura del módulo `auth`, preparación sin tocar login. `PATCH`, no
`MINOR`: pedido explícito de esta parte era "no desarrollar aún el login" — todo lo agregado fue
aditivo (Value Object, Domain Events preparados, JWT Provider, `GuestGuard`, config de TTLs), sin
cambiar el comportamiento real de ningún endpoint en su momento (`0.4.0` después adoptó la config
y el JWT Provider). Ver `CHANGELOG.md` para el detalle completo.

> **Nota (2026-07-23)** — FASE 03, Parte 01 fue una auditoría completa del
> proyecto (backend, base de datos, API, deuda técnica) sin ningún cambio
> de código de negocio, así que no incrementó la versión — siguió siendo
> `0.3.1` hasta `0.4.0` (Parte 02, arriba). Ver
> `PROJECT_STATUS.md`/`TECHNICAL_DEBT.md`/`BACKEND_HEALTH_REPORT.md`
> (actualizados esa fecha) para el resultado de esa auditoría.

## 0.3.0 (2026-07-22)

FASE 2 — Backend Core (endurecimiento de `auth` + capacidades nuevas de infraestructura). Ver
`CHANGELOG.md` para el detalle completo. Resumen:

- **Auth — 4 gaps de seguridad reales cerrados**: bloqueo de cuenta tras 5 intentos fallidos en 15
  min (`security.login_attempts`, sin escritor hasta ahora), rate limit propio en `/auth/login`
  (5/60s), revocación de access token al hacer logout (antes seguía válido hasta expirar solo),
  protección CSRF explícita en `/auth/refresh` (único endpoint autenticado solo por cookie).
- **Auth — 2FA exigido en el login**: `LoginUseCase` integraba 2FA como "preparado, no exigido"
  desde 0.2.0 — ahora un usuario con TOTP confirmado no entra solo con contraseña, completa un
  segundo paso (`POST /auth/login/2fa`) con un `challengeToken` de un solo uso.
- **`core/storage` con consumidor real**: `StorageController` (`POST`/`GET`/`DELETE /files`),
  bucket por tenant, URLs firmadas de corta duración — antes existía el wrapper de MinIO sin que
  nada lo llamara.
- **Email real de reset de contraseña**: `EmailPasswordResetNotifier` (SMTP/MailHog) reemplaza al
  notifier que solo dejaba el token en el log — `SMTP_HOST`/`SMTP_PORT` estaban validados desde
  0.1.0 sin consumidor.
- 0 regresiones — toda la suite de `auth`/`seguridad`/`configuracion` re-verificada contra
  Postgres/Redis/MinIO/MailHog reales tras cada cambio.

## Historial

| Versión | Fecha      | Resumen                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.11.1  | 2026-07-24 | Frontend Redesign Fase 01 — Auditoría Visual: 5 bugs reales de UI corregidos (sesión que perdía el nombre de usuario, Tailwind purgando clases de `modules/*/frontend`, contraste WCAG del color destructivo, `DataTable` sin encabezado fijo/columnas/tamaño de página, tipografía bajo 14px), verificados con Playwright y medición de contraste, sin tocar API/BD/reglas de negocio. |
| 0.11.0  | 2026-07-24 | FASE 06, Parte 01 — Punto de Venta (POS) Enterprise: módulos `clientes`/`caja`/`ventas`/`pos` reales, checkout completo (buscar→carrito→cobrar mixto→factura→stock→caja), 2 bugs preexistentes de Fase 05 corregidos (doble aplicación de stock, cast `uuid`). Se saltó el orden previsto (Inventario Parte 05-08) por pedido explícito.                                                |
| 0.10.0  | 2026-07-24 | FASE 05, Parte 04 — Ajustes y Conteos Físicos: primer código real de `stock_adjustments`/`physical_counts`/`cycle_count_schedules` y catálogos asociados, bloqueo real de filas (`SELECT ... FOR UPDATE`) en el motor de movimientos.                                                                                                                                                   |
| 0.9.0   | 2026-07-23 | FASE 05, Parte 03 — Reservas y Transferencias: primer código real de `stock_reservations`/`stock_transfers`/`stock_transfer_lines`, `registrarLote` atómico multi-línea, chequeo de stock suficiente corregido contra disponible real.                                                                                                                                                  |
| 0.8.0   | 2026-07-23 | FASE 05, Parte 02 — Motor de Stock y Movimientos: primer código real de `stock`/`stock_movement_types`/`stock_movements` (3 de 34 tablas de `inventory`), motor único de movimientos con actualización atómica de stock, disponible y kardex real.                                                                                                                                      |
| 0.7.0   | 2026-07-23 | FASE 04 — Productos: primer código real de `modules/productos/backend` (Unidades de Medida, Categorías, Marcas, Modelos, Productos), 5 de 35 tablas del schema `products`.                                                                                                                                                                                                              |
| 0.6.0   | 2026-07-23 | FASE 03, continuidad — Almacenes: primer código real de `modules/inventario/backend` (Almacén→Zona→Ubicación), cierra la lista de prioridad "primero" de FASE 03.                                                                                                                                                                                                                       |
| 0.5.0   | 2026-07-22 | FASE 03, Parte 03 — Gestión de Usuarios Enterprise: CRUD admin completo (editar/eliminar/restaurar/estado agregado/reseteo de contraseña), multiempresa (`user_companies`), preferencias/avatar (`user_profiles`), corrección de fuga de `password_hash`.                                                                                                                               |
| 0.4.0   | 2026-07-22 | FASE 03, Parte 02 — Autenticación Enterprise: "recordar sesión", protección de session-hijacking (IP/UA), verificación de empresa/sucursal activa, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, adopción de config/JWT Provider preparados en 0.3.1.                                                                                                                       |
| 0.3.1   | 2026-07-22 | FASE 2, Parte 2.1 — Infraestructura de `auth` preparada sin tocar login: Value Object `Email`, Domain Events preparados (sin publicar), JWT Provider, `GuestGuard`, config de TTLs/umbrales (sin consumidor todavía).                                                                                                                                                                   |
| 0.3.0   | 2026-07-22 | FASE 2 Backend Core — 4 gaps de seguridad de `auth` cerrados (bloqueo por intentos, rate limit propio, revocación de token, CSRF), 2FA exigido en login, `core/storage` con consumidor real, email real de reset de contraseña.                                                                                                                                                         |
| 0.2.0   | 2026-07-21 | FASE 02 — Backend Core (Empresas/Sucursales/Config/Monedas/Impuestos) + extensión de Seguridad (Auditoría/Sesiones/Reset de contraseña/2FA) + Usuarios (perfil/self-service/historial).                                                                                                                                                                                                 |
| 0.1.0   | 2026-07-20 | Bootstrap del monorepo + FASE 01-05: Foundation Platform (`core/*`), persistencia (21 clientes Prisma, RLS forzado), primeros módulos de negocio reales (`auth`, `seguridad`), frontend (`apps/web`, `ui-kit`), Notification Center (WhatsApp), Ollama, Kubernetes/monitoreo/HTTPS/backup, testing (Playwright, k6, CodeQL).                                                            |

## Próxima versión prevista

`0.24.0` — alcance a confirmar: Contabilidad Enterprise Parte 2 (CxC/CxP avanzadas, o Bancos/
Conciliación), Facturación Enterprise Parte 2 (vista previa/PDF/impresión/envío por correo, requiere
elegir una librería de generación de PDF), Roles Enterprise Subfases 4.2-4.8 (pausadas, esperando
aprobación explícita), o Clientes/CRM Parte 02.2+ (Categorías, Notas/Timeline, Crédito, Tags,
Documentos, Dashboard). Sin fecha comprometida.

## Versionado del modelo de datos (track independiente)

El **modelo de datos** de GORAZUS tiene su propio track de versión,
independiente del código de aplicación de arriba — un cambio de schema
no necesariamente implica una nueva versión de código, y viceversa.

### Database actual: **Enterprise v1.2.1** (2026-07-26)

Facturación Enterprise, Parte 1. Migración aditiva mínima
(`docs/database/sql/40_facturacion_descuento_general.sql`): columna
`sales.invoices.general_discount_percentage` (`NUMERIC(5,2)`, default `0`)

- CHECK `invoices_general_discount_percentage_check` (0-100). `sales.invoices`
  está particionada por `issued_at` — confirmado que `ALTER TABLE` sobre la
  tabla padre se propaga sola a todas las particiones hijas, sin script por
  partición. Decisión de negocio documentada en el propio SQL: el descuento
  general se aplica sobre el subtotal ya neto de descuentos de línea, sin
  recalcular la base del impuesto (`taxAmount` se calcula antes de aplicar
  este descuento). +1 columna, +1 CHECK — 100% aditivo, 0 tablas nuevas.

### Database v1.2.0 (2026-07-25)

CRM — Parte 02 (Base de Datos). Migración aditiva
(`docs/database/sql/36_crm_customer_completion.sql`) tras auditar los 19
requisitos pedidos de "base de datos CRM completa" contra el schema real:
16 de 19 ya existían (`customers`, 20 tablas — maestro de clientes; más
`core.entity_tags`/`core.documents` para tags/adjuntos genéricos;
`sales.salespeople` para vendedores) y no se duplicaron. 3 gaps reales
cerrados: tabla `customers.customer_notes`, tabla `customers.customer_ratings`,
columna `crm.follow_up_activities.customer_id`, más la vista
`customers.v_customer_timeline` (agrega datos ya existentes, no duplica).
503→**505 tablas** (+2), +1 columna, +1 vista, +4 índices. 100% aditivo, 0
tablas/columnas eliminadas. Ver
`docs/reports/crm/CRM_DATABASE_COMPLETION_REPORT.md` para el detalle
completo, incluyendo la tabla de los 19 requisitos uno por uno.

### Database v1.1.0 (2026-07-25)

Database Finalization — primera migración versionada real desde el congelamiento de v1.0.0
(`docs/database/sql/35_functional_completion.sql`, append-only, no edita ningún script previo).
Cierra los 2 gaps funcionales de mayor peso ya documentados y especificados desde la certificación
original (`docs/database/FUNCTIONAL_GAPS.md` #3 Costo Específico y #4 Contratos de Proveedor) más
3 gaps de `INVENTORY_ARCHITECTURE.md §5.2` (QR/RFID, atributos físicos del producto,
obsolescencia) y el gap #1/#2 de `FUNCTIONAL_GAPS.md` (hazmat, país/idioma/timezone). 501→**503
tablas**, +10 columnas, +2 `CHECK` extendidos, +16 índices, +5 FK — 100% aditivo, 0 tablas/columnas
eliminadas, 0 datos perdidos. Ver `DATABASE_COMPLETION_REPORT.md`/`DATABASE_FINAL_STATUS.md` para
el detalle completo. Sigue congelada en su estructura fundamental — el siguiente cambio
estructural también requiere una migración versionada nueva.

### Database v1.0.0 (2026-07-21)

Certificación formal tras 8 partes de auditoría exhaustiva (rama
`release/database-v1`) — 501 tablas, 5.164 relaciones, 22 schemas, 94/100
de calificación general. Ver
[docs/database/DATABASE_CERTIFICATION.md](docs/database/DATABASE_CERTIFICATION.md)
para la certificación completa y
[docs/database/DATABASE_CHANGELOG.md](docs/database/DATABASE_CHANGELOG.md)
para el historial de las 8 partes.
