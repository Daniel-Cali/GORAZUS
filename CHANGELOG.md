# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Este proyecto está en desarrollo activo, pre-1.0 — no hay versiones publicadas todavía, se registra por fecha.

> El **modelo de datos** tiene su propio track de versión, documentado en
> [docs/database/DATABASE_CHANGELOG.md](docs/database/DATABASE_CHANGELOG.md) —
> no se mezcla con las entradas de código de abajo. Ver
> [VERSION.md](VERSION.md#versionado-del-modelo-de-datos-track-independiente).

## [database-v1.0.0] — 2026-07-21 — Database Enterprise v1.0.0 (certificación)

Cierre y congelación del modelo de datos tras 8 partes de auditoría
exhaustiva contra Postgres 17 real ("Database Enterprise v1.0", ramas
`feature/database-audit` → `release/database-v1`). 94/100 de
calificación general, 0 DDL aplicado — es documentación y verificación,
no una reescritura del schema. Detalle completo:
[docs/database/DATABASE_CERTIFICATION.md](docs/database/DATABASE_CERTIFICATION.md),
[docs/database/DATABASE_RELEASE_NOTES.md](docs/database/DATABASE_RELEASE_NOTES.md),
[docs/database/DATABASE_CHANGELOG.md](docs/database/DATABASE_CHANGELOG.md).

## [No liberado]

### Añadido — Base de Datos

- **CRM — Parte 02, Base de Datos — Database Enterprise v1.2.0 (2026-07-25).** Pedido: "Design and
  implement the complete CRM database". Auditoría previa contra `information_schema` (antes de
  escribir SQL) encontró que 16 de 19 requisitos pedidos ya existían — `customers` (20 tablas,
  maestro de clientes: contactos, direcciones, categorías, límite de crédito, condiciones de pago,
  listas de precio, historial), `core.entity_tags`/`core.documents` (tags/adjuntos genéricos),
  `sales.salespeople` (vendedores) — ninguno se duplicó.
  - **3 gaps reales cerrados** (`docs/database/sql/36_crm_customer_completion.sql`, aditiva): tabla
    `customers.customer_notes` (notas libres fechadas), tabla `customers.customer_ratings`
    (calificación interna del cliente), columna `crm.follow_up_activities.customer_id` (seguimiento
    directo sobre un cliente ya convertido, antes solo lead/oportunidad).
  - **Vista nueva** `customers.v_customer_timeline` — agrega 8 fuentes de datos ya existentes
    (notas, calificaciones, visitas, historial de bloqueo/crédito, bitácora CRM, seguimientos), no
    duplica ningún dato.
  - **Bug sistémico encontrado y corregido (4 tablas)**: ninguna tabla creada después de
    `sql/30_backup_restore.sql` hereda el `GRANT` masivo por schema (sin `ALTER DEFAULT PRIVILEGES`
    configurado) — sin `GRANT` explícito, Prisma no puede introspectarla y el modelo desaparece de
    `schema.prisma` en cada `db:pull`. Corregido con `GRANT` explícito en las 2 tablas nuevas de esta
    fase y en **2 preexistentes de la migración 35** que tenían el mismo bug sin detectar
    (`suppliers.supplier_contracts`, `products.product_physical_attributes`). `core.restore_test_logs`
    tiene el mismo síntoma pero no se tocó — exclusión ya documentada como intencional. Ver
    `TECHNICAL_DEBT.md §0.5`.
  - Prisma regenerado (`db:pull`→`db:split`→`db:generate`, 21 módulos, 0 errores) — `customers`
    18→20 modelos. 503→505 tablas.
  - Entregables: `docs/reports/crm/CRM_DATABASE_COMPLETION_REPORT.md` (los 19 requisitos uno por
    uno), `docs/reports/crm/CRM_DATABASE_ER_DIAGRAM.md` (diagrama Mermaid completo de `customers` +
    `crm`), diccionario de datos actualizado.

- **Database Finalization — Database Enterprise v1.1.0 (2026-07-25).** Primera migración
  versionada real desde el congelamiento de v1.0.0 —
  `docs/database/sql/35_functional_completion.sql`, append-only, ejecutada y validada contra
  PostgreSQL 17.10 real. Cierra 7 gaps funcionales ya documentados y especificados por auditorías
  previas del proyecto (`FUNCTIONAL_GAPS.md`, `INVENTORY_ARCHITECTURE.md §5.2`) — ninguno
  inventado en esta sesión:
  - Materiales peligrosos/hoja de seguridad (`products.products` +3 columnas).
  - País/idioma/timezone en Empresa y Sucursal (`core.companies`/`core.branches` +3 columnas c/u).
  - Costo Específico — identificación específica (`products.costing_method` 5º valor,
    `inventory.inventory_serials.unit_cost` nuevo).
  - Contratos de Proveedor — tabla nueva `suppliers.supplier_contracts`.
  - QR/RFID en código de barras (`products.product_barcodes.barcode_type` extendido).
  - Atributos físicos del producto — tabla nueva `products.product_physical_attributes` (peso,
    dimensiones, exigencia de fecha de fabricación).
  - Ciclo de vida del producto — `products.products.lifecycle_status`
    (`active`/`discontinued`/`obsolete`).
  - 501→**503 tablas**, +10 columnas, +16 índices, +5 FK — 100% aditivo, 0 datos perdidos,
    verificado con conteo de filas antes/después.
  - `schema.prisma` regenerado + los 21 clientes Prisma por módulo regenerados
    (`pnpm db:pull && pnpm db:split && pnpm db:generate`) — confirma de nuevo que el cliente
    monolítico cuelga por el límite de escala de Prisma 5.x ya documentado en el propio
    `split-schema-by-module.js` del proyecto.
  - Backend existente (`productos`, `configuracion`) verificado sin regresión. Durante la
    verificación se encontraron 5 bugs preexistentes no causados por esta migración —2
    corregidos (`StorageModule` faltante en el e2e-spec de `productos`, dependencia agregada), 3
    documentados sin corregir por estar fuera de alcance (aserción de test de `Decimal`, excepción
    genérica no mapeada a 400 en `Producto`, mismo gap de `StorageModule` probable en
    `almacenes.controller.e2e-spec.ts`)—.
  - 9 entregables: `DATABASE_FUNCTIONAL_COVERAGE.md`, `DATABASE_COMPLETION_REPORT.md`,
    `DATABASE_HEALTH_REPORT.md`, `DATABASE_PERFORMANCE_REPORT.md`, `DATABASE_AUDIT_REPORT.md`,
    `DATABASE_ENTERPRISE_CHECKLIST.md`, `DATABASE_FINAL_STATUS.md`, `DATABASE_DICTIONARY.md`
    (actualizado), `DATABASE_RELEASE_NOTES.md`. Diccionario de datos real
    (`docs/database/dictionary/01-core.md`/`04-suppliers.md`/`05-products.md`/`06-inventory.md`)
    actualizado con las columnas/tabla nuevas.
  - Explícitamente NO tocado (decisión, no omisión): RLS de Empresa/Sucursal, resolución de 185 FK
    cross-schema, `core.restore_test_logs` sin RLS — los 3 son hallazgos ya certificados que
    requieren una decisión de arquitectura/producto, no una construcción. Recomendación de
    production readiness: 9.4/10, ver `DATABASE_FINAL_STATUS.md`.

### Diseñado (sin ejecutar — fase de diseño puro, no incrementa versión)

- **CRM — Parte 01, Diseño de Arquitectura (2026-07-25).** Por pedido explícito ("solo completar la
  arquitectura, no programar lógica de negocio todavía"), se diseñó la arquitectura de código
  completa del módulo CRM — 0 archivos `.ts` escritos. El modelo de datos (17 tablas,
  `docs/database/sql/15_crm.sql`) y el diseño funcional (`docs/architecture/27-modulo-crm.md`) ya
  estaban cerrados desde antes, con Prisma ya generado (`core/database/prisma/schemas/crm/`); esta
  fase solo cerró la capa de código que faltaba, reutilizando el patrón ya construido en
  `modules/ventas`/`modules/clientes` (repositorio puerto+adaptador Prisma, servicio de casos de
  uso, controller con `@RequirePermission`+Zod, module-root-barrel).
  - **Entregables**: `docs/reports/crm/CRM_ARCHITECTURE.md` (entidades de 5 sub-dominios —
    Leads/Oportunidades/Campañas/Agenda/Seguimientos — con invariantes, repositorios incl. 3
    lookups nuevos hacia `clientes`/`productos`/usuarios, 5 servicios, 5 controllers con 5+13
    endpoints, 10 permisos, 6 eventos de dominio "preparados no publicados" igual que `auth`,
    diagrama de dependencias y de entidades en Mermaid), `docs/reports/crm/CRM_ROADMAP.md` (6
    partes de implementación restante), addendum en `docs/architecture/27-modulo-crm.md §7`.
  - **Decisión de diseño explícita**: 5 servicios enfocados (no 1 monolítico de 17 tablas) —
    dominios con ciclos de vida independientes, pero todos en un solo módulo Nx (no 5 módulos
    separados) para no fragmentar permisos/auditoría/`README.md` compartidos.
  - **Confirmado, no rediseñado**: `OportunidadGanada` sigue siendo comando síncrono hacia `ventas`
    (no evento RabbitMQ), regla ya fijada en `12-backend-enterprise.md §6.3` antes de esta fase.
  - **Dependencia externa real detectada**: `core/notifications` necesita extenderse para
    destinatarios externos (lead/cliente sin cuenta) antes de que la Parte 05 del roadmap pueda
    enviar WhatsApp real — no bloquea Partes 02-04. Ver `TECHNICAL_DEBT.md §0.4`.

- **Database Refactor, Fase 01 — Estandarización Completa al Español (2026-07-24).** Por pedido
  explícito, se generó el estándar completo de nomenclatura en español y el mapeo real (no una
  muestra) de los 501 tablas + 728 columnas distintas + 21 esquemas + 9 vistas + 4 vistas
  materializadas + 20 funciones/procedimientos propios + 5 triggers de la base PostgreSQL 17.10
  real — **sin ejecutar ningún renombrado todavía**. Decisión explícita del usuario (vía pregunta de
  alcance) dado que la base está certificada "Enterprise v1.0.0" y congelada
  (`VERSION.md`), y que renombrar ~19.500 objetos reales en una sola sesión sin poder correr una
  suite de tests 100% confiable es un riesgo real de romper la aplicación.
  - **7 entregables**: `DATABASE_SPANISH_STANDARD.md` (reglas), `DATABASE_DICTIONARY.md`
    (diccionario completo, no una muestra — 501 tablas + 728 columnas), `DATABASE_RENAME_REPORT.md`
    (conteos por categoría), `DATABASE_MIGRATION_REPORT.md` (plan de ejecución futura por fases,
    con reversión), `DATABASE_COMPATIBILITY_REPORT.md` (estrategia `@map`/`@@map` de Prisma +
    impacto real en 61 archivos backend con Prisma tipado vs 8 con SQL crudo),
    `DATABASE_VALIDATION_REPORT.md` (0 colisiones, 0 choques con palabras reservadas, 0 nombres de
    tabla/columna sobre 63 bytes), `DATABASE_HEALTH_REPORT.md` (línea base de la base real antes de
    cualquier cambio).
  - **Hallazgos reales durante el diseño**: (1) de las 87 funciones detectadas inicialmente, 67 son
    propias de las extensiones `pg_trgm`/`pgcrypto` y nunca se renombrarían — solo 20 son código de
    GORAZUS; (2) aplicar el patrón de índice ya usado por el proyecto (`idx_<schema>_<tabla>_<columna>`)
    mecánicamente en español produce 112 de ~2.948 nombres que superarían el límite de 63 bytes de
    PostgreSQL — mitigación diseñada, no aplicada; (3) bug real de traducción encontrado y
    corregido en el propio motor de traducción antes de cerrar el diccionario (`unit_id` se
    traducía mal como `id_unitario` en vez de `unidad_id`).
  - Ver `DATABASE_SPANISH_STANDARD.md` para el detalle completo. Cero cambios de schema, backend o
    API en esta fase — regla explícita del pedido.

### Corregido

- **Frontend Redesign, Fase 01 — Auditoría Visual y Mejora de UI (2026-07-24).** Sin cambios de
  API/base de datos/reglas de negocio (regla explícita de esta fase). 5 bugs reales encontrados y
  corregidos, todos verificados con Playwright real (no solo lectura de código) y, donde aplica,
  medición programática de contraste WCAG:
  - **Sesión que perdía el nombre de usuario tras recargar** (`apps/web/src/app/require-auth.tsx`)
    — `initSession()` restauraba el access token pero nunca repoblaba `useAppStore.user` (excluido
    a propósito de `localStorage`); la sesión seguía activa pero "Hola, {nombre}" y el nombre del
    Topbar quedaban en blanco. Fix: llama a `GET /auth/me` (ya existente) tras restaurar el token.
  - **Tailwind purgaba en silencio clases usadas solo en `modules/*/frontend`**
    (`apps/web/tailwind.config.ts`) — el `content` no escaneaba esa carpeta. Caso real: la card
    "Abrir caja" del POS ignoraba `max-w-md` por completo (`max-width: none` en cómputo),
    ocupando casi todo el viewport. Fix de raíz: se agregó el glob faltante.
  - **Contraste insuficiente del color destructivo** (`apps/web/src/styles/globals.css`) — 3.61:1
    (botón) / 3.78:1 (texto de error, uso activo real en todo `FormMessage`), ambos por debajo del
    mínimo WCAG AA de 4.5:1. Fix: `--destructive` de 60% a 45% de luminosidad, verificado 5.18:1 /
    5.42:1.
  - **`DataTable` sin encabezado fijo, columnas ocultables, control de tamaño de página ni
    skeleton loader** (`ui-kit/components/data/data-table.tsx`) — se agregaron los cuatro, más un
    nuevo prop `containerClassName` en `Table` (primitive) para que el `sticky` del encabezado no
    quedara anclado a un contenedor de scroll interno que nunca scrollea de verdad. Primer
    consumidor real: `modules/seguridad/frontend/pages/usuarios-listado.page.tsx`.
  - **Tipografía por debajo de 14px en texto real** (`ui-kit/components/layout/notification-center.tsx`)
    — descripción/hora de cada notificación subidas de `text-xs` a `text-sm`.
  - Nuevo primitive `Skeleton` (`ui-kit/components/primitives/skeleton.tsx`) — no existía ninguno.
  - Ver `FRONTEND_VISUAL_AUDIT.md`, `UI_IMPROVEMENTS.md`, `DESIGN_FIXES.md`,
    `ACCESSIBILITY_REPORT.md`, `RESPONSIVE_REPORT.md`, `COMPONENT_AUDIT.md` y
    `LAYOUT_RECOMMENDATIONS.md` para el detalle completo, incluyendo lo evaluado y
    deliberadamente diferido (ancho máximo de contenido en pantallas tipo dashboard, indicador de
    campo obligatorio, búsqueda global real en tablas — requiere un endpoint nuevo, fuera de
    alcance de esta fase).

### Añadido

- **Contabilidad Enterprise, Parte 1: Núcleo Contable + Estados Financieros (2026-07-27), `v0.23.0`.**
  - Origen: pedido "PROMPT MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE" con 20 secciones — alcance
    real de varias semanas. Se acordó con el usuario el orden de partes (`AskUserQuestion`) antes
    de escribir código; esta Parte 1 cubre plan de cuentas, motor de reglas, asientos, Libro
    Diario/Mayor, Balance General, Estado de Resultados y Flujo de Efectivo.
  - Reality-check previo: `modules/contabilidad/backend` estaba vacío, pero el schema `accounting`
    ya tenía 28 tablas reales certificadas — se construyó sobre 17, sin tablas nuevas.
  - **Nuevo**: `PlanCuentasService` (jerárquico, código único por empresa), `MotorContableService`
    (traduce un evento de negocio confirmado en un asiento balanceado — `amount_formula` es el
    nombre de un campo, nunca una expresión evaluada, decisión de seguridad deliberada),
    `AsientosService` (`draft`/`pending` → `posted` → `cancelled`/`reversed`, entidad `Asiento`
    valida partida doble), Libro Diario/Mayor, `EstadosFinancierosService` (Balance General/Estado
    de Resultados/Flujo de Efectivo, generados en vivo desde `journal_entry_lines`).
  - **Integración real y no bloqueante con `ventas`**: `confirmarFactura()` dispara el motor; sin
    regla configurada, `ventas` sigue igual que antes — cumple "nunca romper compatibilidad".
  - **Bug real encontrado y corregido en la verificación manual end-to-end** (no un test): un
    asiento revertido (`status='reversed'`) quedaba excluido de los reportes mientras su reversión
    (`posted`) sí contaba — el Balance General mostraba `-$100` en vez de `$0` tras crear y revertir
    una transacción. Corregido: filtro `status IN ('posted', 'reversed')` en las 3 consultas
    afectadas. Verificado de nuevo contra Postgres real: Balance General vuelve a `$0`/`$0`.
  - **Gap real de schema encontrado al sembrar datos**: `account_types.code` tiene un CHECK real
    que solo permite 5 valores (no los 8 del pedido) — resuelto con listas explícitas de cuentas
    (`costAccountIds`/etc.) para la subclasificación del Estado de Resultados.
  - Tests: 31 nuevos (7+5 entidades, 5+10 servicios, 4 e2e real), 31/31 ✅. Sin regresión en
    `ventas-backend` (30/30) ni `pos-backend` (9/9). Build/lint limpios, arranque real de la API
    (26 rutas de `/contabilidad/*`), OpenAPI regenerado. Permisos
    `contabilidad.gestionar_plan_cuentas`/`gestionar_asientos`/`ver_reportes` sembrados.
  - CxC/CxP avanzadas, Bancos, Conciliación, Activos Fijos, Depreciaciones, Impuestos, Presupuestos,
    Cierre Contable, Auditoría dedicada, Reportes exportables — fuera de esta parte, ver
    `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md`.
  - Documentos nuevos: `modules/contabilidad/README.md`,
    `docs/reports/contabilidad/ACCOUNTING_*.md` (ARCHITECTURE/API_REPORT/TEST_REPORT/
    HEALTH_REPORT/ROADMAP/REPORT).

- **FASE 04 — Módulo Facturación Enterprise, Parte 1: Motor de Facturación (2026-07-26), `v0.22.0`.**
  - Origen: pedido con arquitectura CQRS/DDD/Value Objects/Factories y stack PHP/PHPUnit/PHPStan —
    no aplica a este proyecto (NestJS/TypeScript/Prisma). Reality-check obligatorio (mismo
    protocolo que Roles Enterprise) encontró que `modules/ventas/backend` ya tenía un motor de
    facturación real y funcionando desde `v0.11.0` — se extendió ese módulo, no se construyó uno
    paralelo en PHP.
  - **Nuevo**: editar borrador (`PUT /ventas/facturas/:id`, recalcula impuestos, `409` si ya no es
    `draft`), eliminar borrador (`DELETE`, baja lógica, mismo rechazo), anular (`POST .../anular`,
    `draft`/`issued` → `cancelled`, estado final, `409` si ya estaba anulada), duplicar (`POST
.../duplicar`, nuevo borrador con las mismas líneas, impuestos recalculados a la tasa vigente),
    descuento general por factura (`generalDiscountPercentage`, aplicado sobre el subtotal ya neto
    de descuentos de línea, sin afectar la base del impuesto), filtros avanzados en `listar()`
    (`customerId`/`statusId`/`issuedFrom`/`issuedTo`) y orden (`sortBy`/`sortDir` sobre
    `issued_at`/`total_amount`/`document_number`).
  - **Migración `40_facturacion_descuento_general.sql`** (aditiva, aplicada y verificada):
    `sales.invoices.general_discount_percentage` (`NUMERIC(5,2)`, default `0`) + CHECK 0-100 —
    Database Enterprise v1.2.1. Confirmado que `ALTER TABLE` sobre la tabla particionada por
    `issued_at` se propaga sola a las particiones hijas.
  - Eventos de dominio preparados: `FacturaCreadaEvent`/`FacturaConfirmadaEvent`/
    `FacturaAnuladaEvent` (`modules/ventas/backend/events/`) — mismo patrón "preparado, sin
    publicar todavía" que `auth`/`seguridad`.
  - **Ruptura de compatibilidad real, detectada y corregida en el mismo turno** (regla obligatoria
    del pedido: "nunca romper compatibilidad con módulos existentes"): `generalDiscountPercentage`
    con `.default(0)` en Zod volvía el campo obligatorio en el tipo `CrearFacturaInput` exportado
    (`z.infer` resuelve al tipo de SALIDA de Zod, donde todo default deja de ser opcional) y
    `listar()` cambió de firma posicional a un objeto de filtros — ambos rompían la compilación de
    `pos-backend` (`pos-checkout.service.ts`). Corregido: los tipos exportados de
    `facturas.schema.ts` pasan a `z.input` (tipo de ENTRADA, donde un campo con default sigue
    siendo opcional) y `pos-checkout.service.ts` se actualizó a la nueva firma de `listar()`.
    Confirmado con `pos-backend:build`/`test` (9/9) y `ventas-backend:build`/`lint`/`test` (30/30)
    limpios tras el fix.
  - Permiso `ventas.ver` agregado a `seed-rbac.ts` (mismo gap sistémico que `clientes.ver`/`crm.ver`
    en fases anteriores).
  - Tests: `facturacion-domain-events.spec.ts` (nuevo, 3), `ventas.service.spec.ts` (extendido a
    17), `facturas.controller.e2e-spec.ts` (nuevo, 5 — flujo completo crear→editar→listar→
    confirmar→anular, y crear→duplicar→eliminar). 30 tests totales de Ventas (con los 5 ya
    existentes de `factura.entity.spec.ts`). Build/lint limpios,
    arranque real de la API verificado (9 rutas de `/ventas/facturas`, `401` confirmado con `curl`
    en 7 de ellas), OpenAPI regenerado y confirmado.
  - PDF/vista previa/impresión/envío por correo — mencionados en el pedido bajo "Documentos" —
    quedan fuera de esta parte: no existe librería de generación de PDF en el proyecto, y el pedido
    ya excluye "Facturación Electrónica" del alcance. Documentado como Parte 2 pendiente.
  - Documentos nuevos: `modules/ventas/README.md`, `docs/reports/ventas/INVOICE_ARCHITECTURE.md`,
    `INVOICE_API_REPORT.md`, `INVOICE_TEST_REPORT.md`, `INVOICE_HEALTH_REPORT.md`,
    `INVOICE_REPORT.md`.

- **GORAZUS ERP Enterprise Phase 03 Part 04, Subfase 4.1 — Roles Module Infrastructure (2026-07-26), `v0.21.0`.**
  - Origen: pedido con gate explícito por subfase ("wait for review and approval before proceeding")
    — solo se ejecuta la Subfase 4.1, se reporta y se espera aprobación antes de 4.2-4.8.
  - Análisis previo (pedido explícitamente en el prompt): casi toda la infraestructura de Roles
    pedida (module structure, entity, repositorios, DTOs, exceptions, integración de auditoría,
    tests, documentación técnica) ya existía de las 3 fases anteriores (`v0.18.0`-`v0.20.0`) — no
    se re-implementó nada ya construido, siguiendo la regla "DO NOT modify existing code unless
    absolutely necessary".
  - **Nuevo**: `RolCreadoEvent`/`RolActualizadoEvent`/`RolEliminadoEvent`
    (`modules/seguridad/backend/events/`) — mismo patrón "preparado, sin publicar todavía" que
    `modules/auth/backend/events/*.event.ts` (`EventBusService` existe, ningún módulo lo usa para
    publicar todavía). 3 tests nuevos (`roles-domain-events.spec.ts`).
  - **"Mappers" (pedido explícitamente en el prompt) no es un patrón que este proyecto use** — los
    servicios devuelven el tipo de Prisma directo al controlador en los 8+ módulos ya construidos
    esta sesión, sin capa de mapeo intermedia en ninguno. Omitido a propósito, no por descuido.
  - Confirmado para el reporte de estado: Subfases 4.2 (CRUD completo), 4.3 (scoping empresa/
    sucursal) y buena parte de 4.5 (API REST) ya están completas desde `v0.18.0` — el roadmap de
    subfases pendientes se ajusta a esto, no se re-cuentan como trabajo nuevo.
  - Verificado: build/lint limpios. Sin migración, sin cambios de contrato público, sin romper
    compatibilidad — cumple las "Mandatory Rules" del pedido.

- **Roles Enterprise — Domain Value Objects, descartados a propósito (2026-07-26), `v0.20.0`.**
  - Origen: pedido "Roles Enterprise - Domain Value Objects" (.NET/C#, `RoleId`/`RoleName`/
    `RoleCode` como clases con igualdad de valor propia, `sealed record`). Ningún otro entity del
    proyecto usa ese patrón (`Cliente`, `Lead`, `Opportunity`, el propio `Rol` de `v0.18.0`/
    `v0.19.0` validan primitivos directo en el constructor) — construirlos solo para Roles habría
    sido inconsistente y habría exigido reescribir repositorio/servicio/controlador/validadores
    para hablar en VOs en vez de `string` en toda la cadena.
  - Las invariantes pedidas se incorporaron a la entidad `Rol` existente en vez de crear clases
    nuevas: `name` se guarda recortado (trim, máx. `NOMBRE_ROL_MAX_LENGTH` = 100), `code` se guarda
    recortado y en mayúsculas (máx. `CODIGO_ROL_MAX_LENGTH` = 50, solo letras/números/guion bajo).
  - **Hallazgo real corregido en el camino**: `RolesService.crear()`/`actualizar()` construían
    `new Rol(...)` solo para validar, pero seguían usando las variables originales (sin normalizar)
    para persistir — la normalización nunca llegaba a la base. Corregido leyendo `.name`/`.code` de
    vuelta de la instancia ya normalizada.
  - **Hallazgo real corregido en el camino (#2)**: `crearRolSchema`/`actualizarRolSchema` (Zod) no
    reflejaban el largo máximo ni el patrón de `code` — un valor inválido pasaba el pipe y llegaba
    al `Error` de dominio sin traducir, rompiendo en un 500 (mismo tipo de hallazgo que
    `RolDeFabricaException`, `v0.18.0`). Corregido agregando `.max()`/`.regex()` a los schemas, con
    `.trim()` antes del `.regex()` — sin esto, un código con espacios que la entidad iba a aceptar
    después de normalizar se rechazaba antes de tiempo.
  - Tests: `rol.entity.spec.ts` (+6: trim de nombre, largo máximo de nombre/código, normalización y
    patrón de código, código nulo válido), `roles.service.spec.ts` (+2: normalización end-to-end en
    `crear()`/`actualizar()`), `roles.controller.e2e-spec.ts` (+3: normalización real vía API,
    código inválido → `400`). 46 tests totales de Roles. Build/lint limpios, verificación en vivo de
    la API. **Sin migración** — solo invariantes de aplicación, sin columnas nuevas.

- **Roles Enterprise — Domain Entities: code/description/roleType reales (2026-07-26), `v0.19.0`.**
  - Origen: pedido "Roles Enterprise - Domain Entities" (.NET/C#, `Domain/Entities/Role.cs` +
    `RoleContext.cs` + `Enums/RoleType.cs`, `RoleType` en `Organization`/`Department`/`Project`) —
    mismo criterio que `v0.18.0`: traducido a TypeScript sobre `modules/seguridad/backend`.
    `RoleType` se ajustó a valores reales del proyecto (`system`/`tenant`/`company`/`branch`/
    `custom`) sin la entidad `RoleContext` — el scoping real ya está resuelto por `company_id`/
    `branch_id` (`v0.18.0`); `RoleContext` habría duplicado ese mecanismo con conceptos
    (Organization/Department/Project) que no existen en el modelo de datos de GORAZUS.
  - **Migración `39_roles_enterprise_fields.sql`** (aplicada y verificada): `core.roles` gana
    `code` (identificador corto opcional, sin unicidad forzada), `description` (texto libre) y
    `role_type` (CHECK a los 5 valores reales, default `custom`) + backfill de los roles de fábrica
    existentes (`is_system_role = true`) a `role_type = 'system'`.
  - **Prisma regenerado** (los 21 clientes, pipeline `db:pull` → `db:split` → `db:generate`) —
    necesario por ser una columna real nueva en `core`, a diferencia de la vista de solo lectura de
    Cuentas por Cobrar (`v0.17.0`, resuelta con `$queryRaw` sin tocar el pipeline).
  - **`Rol` (entidad)**: invariantes nuevos — `roleType` debe ser uno de los 5 valores reales,
    `isSystemRole=true` exige `roleType='system'`. La API rechaza `roleType: 'system'` con `400`
    (solo el script de seed crea roles de fábrica, `crear()` siempre fija `is_system_role: false`).
  - Tests: `rol.entity.spec.ts` (+4 invariantes), `roles.service.spec.ts` (+2),
    `roles.controller.e2e-spec.ts` (+2, incluida la validación de `roleType: 'system'` rechazado).
    28 tests totales de Roles. Hallazgo real corregido en el camino: un test pre-existente
    ("crea un rol nuevo y aparece en el listado") se volvió flaky por acumulación de datos de
    prueba (40+ roles creados por corridas repetidas del e2e a lo largo de la sesión, sin orden
    explícito en `listar()`) — reemplazado por una verificación directa vía `GET /seguridad/roles/:id`
    en vez de depender de la paginación por defecto.
  - Verificado: build/lint limpios, arranque completo de la API tras la regeneración de Prisma
    (rutas de `clientes`/`crm`/`seguridad` confirmadas sin roturas cruzadas).

- **Roles Enterprise — CRUD completo + scoping real (2026-07-26), `v0.18.0`.**
  - Origen: pedido "ROLES ENTERPRISE - FASE 4.1" con estructura .NET/C# (Commands/Queries/DTOs/
    ValueObjects/DomainEvents, Entity Framework, archivos `.cs`) que no aplica a este proyecto
    (NestJS/TypeScript/Prisma) y que además duplicaba un módulo Roles ya implementado en
    `modules/seguridad/backend` — el usuario confirmó reforzar el Roles real existente en vez de
    construir la estructura ajena.
  - **`RolesService`**: `obtener(id)` (rol + códigos de permiso asignados — no existía forma de
    verlo sin consultar la base a mano), `actualizar()` (renombrar), `eliminar()` (baja lógica).
    Ambos usan `Rol.verificarPuedeEliminarse/Renombrarse`, invariante que existía desde antes en la
    entidad pero nunca se llamaba desde ningún lado (código muerto hasta esta fase).
  - **`RolDeFabricaException`** (409, nueva): traduce ese invariante de dominio (un `Error` plano,
    la entidad es pura sin conocer HTTP) a un status HTTP real — antes rechazar un rol de fábrica
    rompía en un 500 sin traducir.
  - **Scoping real**: `core.roles.company_id`/`branch_id` ya eran nullable en el schema desde
    antes (rol de todo el tenant, de una empresa, o de una sucursal) pero la API nunca lo exponía
    — `crear()` fijaba siempre la empresa activa de la sesión y `listar()` no filtraba nada (la RLS
    de `core.roles` solo aísla por tenant, no por empresa). `POST /seguridad/roles` acepta
    `companyId`/`branchId` opcionales (`companyId: null` explícito = rol de todo el tenant),
    `GET /seguridad/roles` acepta `?companyId=`.
  - **`DELETE /seguridad/roles/:id/permisos/:code`** (nuevo): el método `revocarPermiso` del
    service existía desde antes sin ningún endpoint que lo expusiera.
  - **`AsignacionRepository.listarPermisosDeRol()`** (nuevo): códigos de permiso asignados
    directamente a un rol.
  - Tests: `roles.service.spec.ts` nuevo (15 tests, no existía), `roles.controller.e2e-spec.ts`
    extendido (+9 tests, 24 totales). Hallazgo real corregido en el camino: el test nuevo asumía
    que el admin de prueba tenía `company_id` real — es un admin de todo el tenant (`company_id`
    null), lo que reveló que pasar ese valor sin validar como filtro de UUID rompía en un error de
    Postgres sin traducir (mismo tipo de hallazgo que el CHECK de `address_type` en Clientes,
    `v0.17.0`) — documentado como patrón sistémico en `docs/manuals/TECNICO.md §5`, no corregido en
    los demás endpoints con filtro `companyId` del proyecto por estar fuera de alcance de esta fase.
  - Verificado: build/lint limpios, arranque real de la API con las 4 rutas nuevas devolviendo
    `401` sin token, OpenAPI regenerado y confirmado (`/seguridad/roles`, `/seguridad/roles/{id}`,
    `/seguridad/roles/{id}/permisos`, `/seguridad/roles/{id}/permisos/{permissionCode}`).
  - Documentación: `modules/seguridad/README.md` nuevo (no existía), `docs/manuals/TECNICO.md §5`
    con 2 hallazgos nuevos de deuda técnica pre-existente (gap de `@types/multer` en
    `configuracion-backend`, gap de `StorageModule` en 3 e2e-spec de `seguridad-backend` sin
    corregir por estar fuera de alcance).

- **CRM/Clientes — preparación para producción (2026-07-26), `v0.17.0`.**
  - Origen: pedido "Complete the Enterprise CRM module... Prepare the CRM for production",
    integración con Sales/Inventory/Cash/Accounts Receivable/Future Quotations/Future
    Orders/Future Purchasing/Future Accounting + verificaciones (duplicación, APIs rotas,
    conflictos de migración, inconsistencias de base, seguridad, deuda técnica) + generación de
    tests/documentación/reporte final. Detalle completo en
    [`CRM_PRODUCTION_READINESS_REPORT.md`](docs/reports/crm/CRM_PRODUCTION_READINESS_REPORT.md).
  - **Integración real nueva — Cuentas por Cobrar**: `CuentaPorCobrarRepository`/
    `CuentasPorCobrarService`/`CuentasPorCobrarController` (`GET /clientes/:id/cuentas-por-cobrar`),
    sobre `customers.v_accounts_receivable_aging` vía `$queryRaw` parametrizado (la vista no es un
    modelo de Prisma — `previewFeatures` del pipeline `db:pull` no incluye `"views"`; regenerar los
    21 clientes solo para esta vista no se justificaba).
  - Sales/Inventory: ya integrados desde Parte 03, verificados de nuevo. Cash: documentado
    explícitamente sin punto de integración real (sin caso de uso). Quotations/Orders/
    Purchasing/Accounting: documentados como integraciones futuras — los módulos no existen
    todavía, no se puede integrar con código inexistente.
  - **Hallazgo real #1, corregido**: 6 permisos de `clientes` (incluido `clientes.ver`, el que
    habilita el ítem del sidebar) estaban en el código fuente de `seed-rbac.ts` desde turnos
    anteriores pero nunca se habían sembrado de verdad en la base — el script se había editado, no
    re-ejecutado. Sin este fix, cualquier usuario real habría recibido `403` en toda pantalla de
    Clientes en producción.
  - **Hallazgo real #2, corregido**: el CHECK `customer_addresses_address_type_check`
    (`billing`/`shipping`/`other`) no estaba reflejado en `direcciones.schema.ts` ni en
    `DireccionCliente` — un valor fuera de rango pasaba la validación y rompía en un 500 de
    Postgres sin traducir. Corregido con `z.enum` + invariante de entidad (backend) y un `<select>`
    real en vez de texto libre (frontend, `direcciones-tab.tsx`).
  - **Tests de integración/API nuevos** (no existían antes de esta fase): `clientes.controller.e2e-spec.ts`
    (flujo Cliente→Contacto→Dirección→Cuentas por Cobrar, contra Postgres/Redis/RabbitMQ reales) y
    `leads.controller.e2e-spec.ts` (flujo Lead→cambiar estado→convertir, con verificación cruzada de
    que el cliente resultante existe de verdad — integración real `crm`↔`clientes`). 8 tests nuevos,
    85 tests totales entre ambos módulos (36 `clientes` + 49 `crm`).
  - Documentación: `modules/crm/README.md` reescrito (desactualizado desde Parte 02, solo mencionaba
    Leads), `modules/clientes/README.md` nuevo (no existía), `docs/manuals/USUARIO.md` con sección
    real de Clientes, `CRM_ARCHITECTURE.md §14` reescrita (integraciones reales vs. futuras
    explícitas), `CRM_PRODUCTION_READINESS_REPORT.md` nuevo.
  - Verificado: build/lint limpios en `clientes-backend`/`crm-backend`/`clientes-frontend`/`apps/web`,
    `pos-backend` no roto por los cambios en `clientes.module.ts`, arranque real de la API con las 22
    rutas de `crm`/`clientes` mapeadas y `docs/api/openapi.json` regenerado y verificado.

- **Clientes — Parte 02, frontend real: Listado + Detalle + Contactos + Direcciones (2026-07-25), `v0.16.0`.**
  - Origen: pedido "Develop the complete CRM frontend" (React 19 + Vite + TypeScript + **Bootstrap
    5**, 15 pantallas: Dashboard, List, Details, Contacts, Addresses, Timeline, Activities, Notes,
    Documents, Credit Management, Search, Filters, Tags, Categories, Statistics). Dos hallazgos
    antes de implementar: (1) el stack real es Tailwind + shadcn/ui + Radix (`ui-kit/`), no
    Bootstrap — se usó el real para no crear un segundo sistema de diseño en paralelo. (2) Solo 4 de
    las 15 pantallas tienen backend real (v0.15.0); las otras 11 dependen de partes de backend que
    todavía no existen — quedan documentadas como pendientes, no se construyó UI sin datos reales
    detrás.
  - **`modules/clientes/frontend`** (nuevo): `ClientesListadoPage` (`/clientes` — búsqueda con
    debounce 300ms sobre el único filtro real del backend, paginación server-side, orden client-side
    de la página cargada ya que el backend no tiene parámetro de orden, alta de cliente con
    `companyId`/`branchId` tomados de la empresa activa de la sesión vía `useAppStore`) y
    `ClienteDetallePage` (`/clientes/:id` — edición inline, pestañas Contactos/Direcciones con CRUD
    completo incluida baja lógica con `ConfirmDialog`).
  - **Barrel frontend dedicado** (`modules/clientes/frontend/index.ts`, alias nuevo
    `@gorazus/modules/clientes-frontend` en `tsconfig.base.json`) — separado del barrel backend
    existente (`modules/clientes/index.ts`, consumido por `crm-backend`/`pos-backend`) para no
    arrastrar react-router-dom a esos dos módulos ni los clientes Prisma al bundle del navegador,
    mismo criterio que `modules/pos/index.ts` ya documenta para el caso simétrico.
  - Ruta `/clientes` reemplaza su `ComingSoonPage` en `apps/web/src/app/router.tsx`
    (`clientesRoutes` sumado a `realRoutes`).
  - **Gap de permisos cerrado, no previsto en el pedido**: el ítem "Clientes" del sidebar
    (`module-registry.ts`) ya apuntaba a `clientes.ver` desde antes, permiso que nunca se había
    sembrado — se agregó a `seed-rbac.ts` (mismo hallazgo que `crm.ver` en CRM Parte 02 backend).
  - Verificado: build de producción de `apps/web` exitoso (type-check completo del árbol vía
    Vite/Rollup, ambas páginas nuevas separadas en su propio chunk lazy-loaded), lint de
    `clientes-frontend` limpio. **No verificado en navegador real** — este entorno no tiene una
    herramienta de browser/Playwright disponible; la verificación se limitó a build + lint +
    revisión de código contra los endpoints reales (ya confirmados con `401` en v0.15.0).

- **Clientes — Parte 02, primera entrega: Customer 360, Contactos + Direcciones (2026-07-25), `v0.15.0`.**
  - Origen: pedido de "CRM backend completo" (Customers, Contacts, Addresses, Customer Groups,
    Categories, Tags, Activities, Timeline, Notes, Documents, Credit Profiles, Price Lists, Payment
    Terms, Customer Dashboard — 14 piezas). Análisis: 12 de las 14 ya tenían tabla real en el schema
    `customers` desde Database Parte 02, sin ningún código de aplicación; 2 (Tags, Documents) no
    tienen tabla; Customer Dashboard es una agregación de lectura. No es el módulo `crm` (ese ya
    está completo, Partes 02-04) — es una extensión del módulo `clientes` existente. Alcance
    dividido en partes, esta es la primera.
  - **`modules/clientes/backend`**: entidades `ContactoCliente` (nombre no vacío, email válido si
    se informa) y `DireccionCliente` (tipo y línea 1 no vacíos).
  - **`ContactosService`** (`customers.customer_contacts`): crear, listar, obtener, actualizar,
    eliminar (baja lógica) — invariante "un solo contacto principal por cliente" aplicada en
    servicio (sin constraint de DB). **`ContactosController`**: 5 endpoints en
    `/clientes/:customerId/contactos`.
  - **`DireccionesService`** (`customers.customer_addresses`): misma forma, invariante "una sola
    dirección predeterminada por cliente". **`DireccionesController`**: 5 endpoints en
    `/clientes/:customerId/direcciones`.
  - `company_id`/`branch_id` de cada contacto/dirección se heredan del cliente padre (no del
    usuario actor) — multi-company real, no asumido del token de sesión.
  - Permisos `clientes.ver_contactos`/`clientes.gestionar_contactos`/`clientes.ver_direcciones`/
    `clientes.gestionar_direcciones` agregados a `seed-rbac.ts`.
  - `core-database` ganó los tipos `customer_contacts`/`customer_addresses` (patrón "bajo demanda").
  - **Sin cambios de base de datos** — ambas tablas y sus FK a `customers.customers` ya existían.
  - Verificado: 12 tests nuevos (28 totales del módulo `clientes`), build/lint limpios, `apps/api`
    arrancado de nuevo, 4 rutas nuevas mapeadas y devolviendo `401 Unauthorized` sin token.
  - Partes restantes (documentadas en `docs/reports/crm/CRM_ROADMAP.md`): Categorías/
    Clasificaciones, Notas + Timeline, Perfil de Crédito + Listas de Precio, y una parte final para
    Tags/Documents (requiere migración nueva) + Customer Dashboard.

- **CRM — Parte 04, código real de Campañas + Agenda (2026-07-25), `v0.14.0`.**
  - **`modules/crm/backend`**: entidades `Campaign` (invariantes: nombre no vacío, presupuesto no
    negativo, fin no anterior a inicio) y `CalendarEvent`/`CalendarEventAttendee` (título no vacío,
    fin posterior a inicio, asistente interno xor externo).
  - **`CampanasService`**: crear, listar, obtener, `agregarMiembro` (valida que el lead exista —
    `crm.campaign_members` solo admite leads, sin columna `customer_id`, límite de alcance real ya
    fijado en el schema). **`CampanasController`**: 4 endpoints en `/crm/campanas`.
  - **`AgendaService`**: crear, listar, obtener, `agregarAsistente` (interno vía `userId` o externo
    vía `externalEmail`, nunca ambos). **`AgendaController`**: 4 endpoints en `/crm/agenda`.
  - Permisos `crm.ver_campanas`/`crm.gestionar_campanas`/`crm.ver_agenda`/`crm.gestionar_agenda`
    agregados a `seed-rbac.ts`.
  - `core-database` ganó los tipos `campaigns`/`campaign_members`/`calendar_events`/
    `calendar_event_attendees` (mismo patrón "bajo demanda" de las partes anteriores).
  - **Sin cambios de base de datos** — a diferencia de Partes 02/03, ningún catálogo nuevo que
    sembrar.
  - Verificado: 19 tests nuevos (45 totales del módulo `crm`), build/lint limpios, `apps/api`
    arrancado de nuevo, rutas `/api/v1/crm/campanas/*` y `/api/v1/crm/agenda/*` mapeadas y
    devolviendo `401 Unauthorized` sin token.
  - Ver `docs/reports/crm/CRM_ROADMAP.md` para las partes siguientes (Seguimientos, Frontend).

- **CRM — Parte 03, código real de Oportunidades (2026-07-25), `v0.13.0`.**
  - **`modules/crm/backend`**: entidad `Opportunity` (invariantes: origen en lead o cliente
    existente, etapa de embudo obligatoria, líneas con cantidad estimada > 0),
    `OpportunityRepository` (crea encabezado + líneas en una sola transacción — sin partición, a
    diferencia de `FacturaRepository` de `ventas`), `OpportunityLossReasonRepository`/
    `SalesFunnelRepository` (catálogos, solo lectura) + `ProductoLookupRepository` propio de `crm`.
  - **`OportunidadesService`**: `crear` (valida etapa/lead/cliente/productos), `moverDeEtapa`,
    `ganar` (registra `resultingSalesOrderId` — **no** invoca `ventas` directamente, comando
    síncrono en su forma más simple, tal como ya estaba decidido en `CRM_ARCHITECTURE.md §7`),
    `perder` (exige motivo válido).
  - **`OportunidadesController`**: 6 endpoints en `/crm/oportunidades` con `@RequirePermission` +
    validación Zod.
  - Permisos `crm.ver_oportunidades`/`crm.gestionar_oportunidades` agregados a `seed-rbac.ts`.
  - **Gap de datos cerrado en el camino, no previsto en el diseño original**:
    `sales_funnels`/`sales_funnel_stages`/`opportunity_loss_reasons` estaban vacíos — se sembró un
    embudo "Estándar" (4 etapas) por cada una de las 17 empresas reales + 5 motivos de pérdida
    (`docs/database/sql/38_crm_opportunities_seed.sql`). Se descubrió que
    `sales_funnels.company_id` tiene FK real hacia `core.companies` (a diferencia de
    `crm.lead_status`, sin FK de empresa) — el seed itera sobre las empresas reales existentes, no
    usa un id inventado.
  - `core-database` ganó los tipos `opportunities`/`opportunity_lines`/`opportunity_loss_reasons`/
    `sales_funnels`/`sales_funnel_stages` (mismo patrón "bajo demanda" de la Parte 02).
  - Verificado: 14 tests nuevos (`opportunity.entity.spec.ts`, `oportunidades.service.spec.ts` —
    26 tests totales del módulo `crm`), build/lint limpios, `apps/api` arrancado de nuevo contra
    Postgres/Redis/RabbitMQ reales, rutas `/api/v1/crm/oportunidades/*` mapeadas y devolviendo
    `401 Unauthorized` sin token.
  - Ver `docs/reports/crm/CRM_ROADMAP.md` para las partes siguientes (Campañas, Agenda,
    Seguimientos, Frontend).

- **CRM — Parte 02, código real de Leads (2026-07-25), `v0.12.0`.**
  - **`modules/crm/backend`** (nuevo): entidad `Lead` (invariantes: nombre no vacío, estado
    obligatorio, al menos email o teléfono), `LeadRepository`/`LeadStatusRepository`/
    `LeadSourceRepository` (catálogos `crm.lead_status`/`crm.lead_sources`, solo lectura desde la
    app) + `ClienteLookupRepository` propio de `crm` (copia local de solo lectura sobre
    `customers.customers`, mismo patrón que `modules/ventas/backend`).
  - **`LeadsService`**: `crear` (valida estado inicial "nuevo" y origen si se especifica),
    `cambiarEstado` (transacción única: actualiza `leads.status_id` + registra en
    `lead_status_history`), `convertir` (idempotente — invoca `ClientesService.crear()` del módulo
    `clientes`, nunca escribe directo en `customers.customers`, patrón "módulo dueño").
  - **`LeadsController`**: `GET/POST /crm/leads`, `GET /crm/leads/:id`,
    `PATCH /crm/leads/:id/estado`, `POST /crm/leads/:id/convertir` — todos con
    `@RequirePermission`, validación Zod.
  - Catálogo de permisos `crm.ver`/`crm.ver_leads`/`crm.gestionar_leads` agregado a
    `modules/seguridad/backend/scripts/seed-rbac.ts`.
  - **Gap de infraestructura cerrado en el camino**: `core-database` no exportaba ningún tipo de
    `crm` en su barrel público (`PRISMA_CRM` existía en la DI interna, pero no `CrmPrismaClient`/
    modelos) — se agregó siguiendo el mismo patrón "bajo demanda" que los otros 8 schemas ya
    expuestos.
  - **Único cambio de base de datos**: seed del catálogo `crm.lead_status` (estaba vacío desde su
    creación, `docs/database/sql/37_crm_leads_seed.sql`) — no es una migración estructural.
  - Verificado: 12 tests unitarios (`lead.entity.spec.ts`, `leads.service.spec.ts`), build y lint
    limpios, arranque real de `apps/api` contra Postgres/Redis/RabbitMQ reales sin errores de
    inyección de dependencias, rutas `/api/v1/crm/leads/*` mapeadas y devolviendo
    `401 Unauthorized` sin token (comportamiento esperado).
  - Ver `docs/reports/crm/CRM_ROADMAP.md` para las partes siguientes (Oportunidades, Campañas,
    Agenda, Seguimientos, Frontend).

- **FASE 06, Parte 01 — Punto de Venta (POS) Enterprise (2026-07-24).**
  - **`modules/clientes/backend`** (nuevo): CRUD mínimo sobre `customers.customers` +
    `obtenerOCrearConsumidorFinal` (get-or-create idempotente, `tax_id='CF'`) para ventas sin
    cliente registrado.
  - **`modules/caja/backend`** (nuevo): registros de caja, apertura (`uq_cash_openings_one_active`
    impide más de una apertura activa a nivel de base), cierre (`expected_amount` = apertura + suma
    de movimientos), catálogo de tipos de movimiento get-or-create, movimientos sobre
    `cash.cash_movements` (particionada mensualmente, repositorio custom, no `BaseRepository`).
  - **`modules/ventas/backend`** (nuevo): facturas (`sales.invoices`, particionada por
    `issued_at` — sin relación real hacia `invoice_lines`, Postgres no permite FK simple contra una
    tabla particionada, así que el repositorio escribe header y líneas en dos pasos dentro de la
    misma transacción) con impuesto real calculado por línea contra `taxes.tax_rates`, recibos con
    allocations, transición `draft → issued`.
  - **`modules/pos/backend`** (nuevo, orquestador): `PosCheckoutService` compone
    `InventarioModule`/`VentasModule`/`CajaModule`/`ClientesModule` vía el barrel de cada módulo
    (`modules/<x>/index.ts`) — primer caso real de composición backend-a-backend entre módulos de
    negocio en el proyecto, validando en la práctica el patrón ya documentado pero nunca usado en
    `docs/architecture/01-estructura-monorepo.md §5`. Checkout completo: valida stock disponible,
    valida caja abierta, resuelve cliente (o Consumidor Final), crea factura, valida pago
    suficiente (soporta pago mixto — N formas de pago), descuenta stock, registra recibo +
    movimiento de caja por cada pago, confirma la factura. También soporta suspender/recuperar una
    venta sin cobrar ni tocar stock.
  - **`modules/pos/frontend`** (nuevo): pantalla `/pos` de página completa (sin `AppShell`),
    selector de empresa/sucursal/caja con apertura de turno, buscador de productos con
    auto-agregado al carrito, diálogo de cobro con pago mixto y cálculo de cambio, atajos de
    teclado F1/F5/F6/F7/Escape.
  - **Dos bugs preexistentes de Fase 05 encontrados y corregidos** durante la verificación
    end-to-end contra Postgres real (Docker arriba por primera vez en 9 sesiones): (1) doble
    aplicación de movimientos de stock — el trigger `inventory.fn_apply_stock_movement` y
    `MovimientoStockRepositoryPrisma.aplicarMovimiento` escribían el mismo delta cada uno, desde
    Fase 05 Parte 02; (2) `operator does not exist: uuid = text` en `stock-lock.util.ts` por falta
    de casts explícitos en `$queryRawUnsafe`. Ver `POS_DATABASE.md §5` y `POS_TEST_REPORT.md §3`.
  - **Desviación de alcance documentada**: el orden previsto en `ROADMAP.md`/
    `INVENTORY_NEXT_PHASE.md` tenía Inventario Parte 05-08 (Recepciones/Costeo/Series/Producción)
    antes de Clientes/Ventas/Caja/POS — esta parte los saltó por pedido explícito del usuario, no
    por decisión unilateral. Documentado en `POS_ARCHITECTURE.md §1` y `NEXT_STEPS.md`.
  - **Explícitamente diferido** (`POS_ARCHITECTURE.md §3`): cotizaciones/pedidos/apartados,
    devoluciones/cambios/garantías, promociones/cupones/tarjetas de regalo/lealtad, crédito real de
    clientes, asiento contable automático, facturación electrónica fiscal, envío de comprobante por
    correo/WhatsApp, venta por lote/serie, arqueo por denominación.
  - 42 tests unitarios nuevos (42/42), 153 tests de Inventario re-verificados sin regresiones. Ver
    `POS_TEST_REPORT.md` para el detalle completo, `POS_API.md` para referencia de endpoints,
    `POS_HEALTH_REPORT.md` para riesgos y deuda técnica.

- **FASE 02 — Backend Core + Gestión de Versiones: Empresas/Sucursales/Configuración/Monedas/
  Impuestos, y extensión de Seguridad + Usuarios (2026-07-20/21).**
  - **`modules/configuracion/backend`** (nuevo paquete, Core): CRUD completo de Empresas
    (`core.companies`) y Sucursales (`core.branches`, ligadas a una empresa existente), catálogo de
    Parámetros del sistema (`core.system_parameters`) + valor efectivo por tenant con
    override-o-default (`core.system_settings`), catálogo de Monedas ISO 4217 (`configuration.currencies`
    — primer consumidor real de `PRISMA_CONFIGURATION`, cliente Prisma independiente que existía en
    `database.module.ts` desde Paso 3 pero nunca se había usado), e Impuestos de alcance mínimo
    (`taxes.taxes` + `taxes.tax_rates` — primer consumidor real de `PRISMA_TAXES` — perfil + tasas,
    deliberadamente sin motor de reglas/cálculo/percepciones/retenciones, eso es una fase fiscal
    futura sin documento propio). `taxes.jurisdiction_id` es una FK obligatoria sin catálogo de
    países/jurisdicciones construido todavía — en vez de expandir el alcance a ese catálogo completo
    (fuera de lo pedido), se agregó un script de seed mínimo e idempotente
    (`scripts/seed-tax-jurisdictions.ts`, mismo patrón que `seed-rbac.ts`) que solo desbloquea el
    caso de uso real. Cada submódulo sigue el patrón Clean Architecture ya establecido en `seguridad`
    (entidad con invariantes + spec, repositorio puerto/adaptador Prisma, validadores Zod, servicio
    con excepciones de dominio propias, controlador con Swagger, e2e real). Nuevos tipos exportados
    bajo demanda desde `@gorazus/core-database`: `companies`/`branches`/`system_parameters`/
    `system_settings`/`audit_logs`/`tokens` (schema `core`), `currencies`/`countries` +
    `ConfigurationPrismaClient` (schema `configuration`), `taxes`/`tax_rates`/`tax_jurisdictions` +
    `TaxesPrismaClient` (schema `taxes`), `two_factor_credentials` + `SecurityPrismaClient` (schema
    `security`) — cuatro clientes Prisma independientes en uso simultáneo por primera vez.
  - **`modules/seguridad/backend` — Auditoría** (nuevo): `GET /seguridad/auditoria` sobre
    `core.audit_logs`, filtrable por tabla/operación/actor. El repositorio NO extiende
    `BaseRepository`: `audit_logs` está particionada por `occurred_at`
    (`docs/database/sql/29_partitioning.sql`), así que Prisma solo expone claves únicas compuestas
    (`id_occurred_at`/`local_id_occurred_at`), nunca `id` a secas — y la tabla la escribe
    exclusivamente el trigger `fn_audit_log` (`docs/database/sql/26_triggers.sql`), nunca la
    aplicación. Verificado contra el trigger real: crear un rol vía el endpoint ya existente deja
    una fila `table_name='roles'` legible de inmediato.
  - **`modules/seguridad/backend` — Sesiones** (nuevo): `GET /seguridad/sesiones` (por usuario) +
    `POST /seguridad/sesiones/:id/revocar`, sobre `core.sessions` — deliberadamente separado del
    `SessionRepository` de `modules/auth/backend` (ese resuelve sesiones durante login/refresh; este
    las administra después, sin importar repositorios entre módulos de negocio).
  - **`modules/auth/backend` — Recuperación de contraseña** (nuevo): `POST /auth/forgot-password` +
    `POST /auth/reset-password` sobre `core.tokens` (`purpose='password_reset'`, columna ya modelada
    para exactamente este caso, sin cambio de schema). Ambos endpoints exigen `tenantSlug`
    explícito, igual que login, para que la búsqueda del token quede tenant-scoped por el camino RLS
    normal — evita agregar una política de bypass pre-auth nueva para `core.tokens`.
    `forgot-password` responde 200 siempre (exista o no el tenant/email, mismo criterio
    anti-enumeración que `LoginUseCase`); el token real solo se entrega vía el puerto nuevo
    `PasswordResetNotifier`, nunca en el body de la respuesta. Única implementación hoy:
    `LoggingPasswordResetNotifier` (lo deja en el log estructurado) — Notification Center todavía no
    tiene canal de email (solo WhatsApp, Fase 1), swap pendiente de una fase futura.
    `reset-password` es de un solo uso (marca `used_at`), rechaza token inválido/usado/expirado con
    un único mensaje genérico, y revoca todas las sesiones del usuario al cambiar la contraseña.
  - **`modules/seguridad/backend` — 2FA "preparado"** (nuevo, explícitamente no exigido en login
    todavía): `POST /seguridad/2fa/setup`, `POST /seguridad/2fa/confirmar`, `DELETE /seguridad/2fa`
    sobre `security.two_factor_credentials` (primer consumidor de `PRISMA_SECURITY`). TOTP (RFC 6238)
    implementado directo sobre `node:crypto` en `packages/tooling/utils/totp.ts` — sin agregar
    `otplib` ni ninguna librería nueva, el algoritmo (HMAC-SHA1 + truncamiento dinámico RFC 4226) ya
    está cubierto por un módulo nativo. Verificado contra los vectores de prueba oficiales de RFC
    4226 Apéndice D. El secreto se cifra en reposo con el mismo mecanismo AES-256-GCM que
    `WhatsAppCredentialsService` (`packages/tooling/utils/encryption.ts`), con una clave propia
    `SEGURIDAD_ENCRYPTION_KEY` (nueva variable de entorno, mismo criterio de "una clave por feature"
    que ya usa Notification Center) — agregada a `env.schema.ts`/`config.module.ts`/`.env.example`.
    Endpoints self-service (sin `@RequirePermission`: un usuario gestiona su propio 2FA, no el de
    otro).
  - **`modules/seguridad/backend` — Usuarios (autogestión)**: `GET`/`PATCH /seguridad/usuarios/me`
    (perfil propio, solo nombre — email/roles siguen siendo administrativos vía los endpoints ya
    existentes), `PATCH /seguridad/usuarios/me/password` (exige la contraseña actual, verificada con
    argon2 — distinto del alta administrativa con contraseña temporal), `POST
/seguridad/usuarios/:id/activar` (la acción simétrica que faltaba a `desactivar`, completa
    Activación/Bloqueo), `GET /seguridad/usuarios/:id/historial` (reusa Auditoría en vez de construir
    un mecanismo de historial paralelo — `AuditoriaService.historialDeFila`, nuevo método genérico,
    filtra `core.audit_logs` por `table_name`+`row_id`).
  - **Dos bugs reales encontrados por los tests nuevos, corregidos en el mismo pase:**
    1. `core/http/interceptors/serialization.interceptor.ts` destructuraba cualquier objeto (incluido
       un `Prisma.Decimal`, ej. `tax_rates.rate_percentage`) vía `Object.entries` para normalizar
       `bigint`, perdiendo el `toJSON` propio de `Decimal` (decimal.js) y serializando `{s,e,d}`
       crudo en vez de `"19.000"` — el cliente parseaba `NaN`. Ningún módulo había usado una columna
       `Decimal` hasta Impuestos esta fase, así que el bug era latente desde siempre. Corregido:
       cualquier objeto con `toJSON` propio se respeta tal cual (mismo criterio ya aplicado a `Date`).
    2. `packages/tooling/utils/totp.ts`: la ventana de tolerancia ±1 paso de `verifyTotpCode` podía
       computar un contador negativo cerca del epoch 0 (irrelevante en producción, pero real
       ejercitando los vectores de prueba de RFC 4226), que `Buffer.writeBigUInt64BE` rechaza con
       `RangeError`. Corregido salteando offsets que producirían un contador `< 0`.
  - **Hallazgo operativo, no de código:** `SesionRepository.findMany` heredado de `BaseRepository`
    no ordena — el usuario de prueba `admin@demo.local` acumuló 500+ filas de `core.sessions` a lo
    largo de esta sesión de trabajo (entorno de dev persistente, nunca reseteado), y una página sin
    `ORDER BY` confiablemente no incluía una fila recién creada. Corregido con
    `SesionRepository.listarPorUsuario`, una query dedicada con `ORDER BY created_at DESC` — no un
    parche de test, es la UX correcta para un administrador viendo sesiones de un usuario.
  - **111 tests nuevos/verificados en este pase** (`configuracion-backend` 35, `seguridad-backend`
    46, `auth-backend` 21, `core-http` 4, `core-config` 5), todos e2e reales contra Postgres +
    JWT construido con `jsonwebtoken` (mismo patrón ya establecido), salvo las specs de entidad y la
    de TOTP (unitarias, sin base de datos). Nuevos permisos RBAC sembrados vía `seed-rbac.ts`:
    `configuracion.gestionar_{empresas,sucursales,parametros,monedas,impuestos}`,
    `seguridad.{ver_auditoria,gestionar_sesiones}` (los endpoints self-service de perfil/2FA no
    requieren permiso — solo autenticación).

- **FASE 05 — Playwright real (`apps/web-e2e`) + testing de carga/estrés (`infra/k6`) + escaneo de
  seguridad en CI (2026-07-20).**
  - **`apps/web-e2e`** (nuevo, committeado — antes toda verificación en navegador era un script ad
    hoc descartable): `playwright.config.ts` + `login.spec.ts` (4 tests: redirect sin token, render
    del formulario, error de credenciales inválidas, login real → dashboard) + `usuarios.spec.ts`
    (2 tests: navegación por sidebar, alta de usuario real de punta a punta). **6/6 pasan contra el
    stack completo real** (`https://localhost`, HTTPS + nginx + api + Postgres con RLS forzado).
  - **`infra/k6`**: `smoke.js`/`load.js`/`stress.js` — ver "Corregido" abajo para los hallazgos
    reales de `load.js` (rate limiter) y el resultado de `stress.js` (200 VUs sin caídas). Detalle
    completo en `infra/k6/README.md`.
  - **`.github/workflows/security.yml`** (nuevo): `pnpm audit` (no bloqueante todavía, ver
    "Pendiente conocido") + CodeQL (SAST nativo de GitHub, sin servicio externo) en cada PR/push a
    `main` + corrida semanal.

- **FASE 05 — Kubernetes, monitoreo, HTTPS y backup automático (2026-07-20).**
  - **`infra/kubernetes/`** (nuevo): `base/` + `overlays/{staging,production}/` vía Kustomize (no
    Helm, ya decidido en `31-infraestructura-completa.md §2.3`) — `Deployment`/`Service`/`Ingress`/
    `ConfigMap`/`Secret`(plantilla)/`HorizontalPodAutoscaler` para `api`+`web`, TLS vía cert-manager,
    `/health/live`+`/ready` como probes reales. `stateful/` con los CRs de los operadores ya
    documentados (CloudNativePG para Postgres HA, Redis Operator/Spotahome para Sentinel, RabbitMQ
    Cluster Operator con quorum queues, MinIO Operator con erasure coding) — implementan la
    arquitectura objetivo ya fijada en `31-infraestructura-completa.md §11`, pero ese mismo
    documento pide un ADR formal antes de aplicarse a un cluster de producción real, todavía no
    escrito. **Verificado con `kubectl kustomize`** (renderiza sin error, namespace/imagen/replicas
    correctos por overlay) — no contra un cluster real (no hay uno disponible en este entorno), ver
    `infra/kubernetes/README.md` para el detalle honesto de qué está probado y qué no.
    `deploy-staging.yml`/`deploy-production.yml` actualizados con los pasos reales de
    `kubectl apply -k` (comentados hasta que exista el registry/cluster real).
  - **Stack de monitoreo real** (`infra/prometheus/`, `infra/grafana/`, `infra/loki/`,
    `infra/promtail/`, `infra/docker/docker-compose.monitoring.yml`, overlay opcional): Prometheus
    scrapeando `http_requests_total`/`http_request_duration_ms` (métricas ya emitidas por
    `core/observability/metrics.ts`, nada nuevo del lado de la app), 3 reglas de alerta reales
    (`ApiDown`, `ApiHighErrorRate`, `ApiHighLatencyP95`), Grafana con datasources Prometheus+Loki
    provisionados automáticamente + un dashboard real (`api-overview.json`: request rate, error
    rate, P50/P95/P99, logs), Promtail parseando el JSON estructurado que `core/logging` ya emite.
    **Verificado real**: los 4 contenedores arrancan, Prometheus carga y evalúa las 3 reglas
    (`"health":"ok"`), Grafana provisiona ambos datasources y el dashboard (confirmado vía su API).
    En Kubernetes, el mismo rol lo cumple `kube-prometheus-stack` + Loki (namespace `observability`,
    ya documentado en `31 §9`) — no este `docker-compose.monitoring.yml`.
  - **HTTPS/TLS real**: `infra/nginx/nginx.conf` reescrito — HTTP redirige a HTTPS (salvo
    `/nginx-health`), TLS 1.2/1.3 con certificado autofirmado de desarrollo
    (`infra/nginx/generate-dev-cert.sh`, nunca commiteado), 5 cabeceras de seguridad (HSTS,
    X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy). En Kubernetes,
    TLS lo termina cert-manager en el `Ingress` (ver arriba), no este archivo. Antes no existía
    ningún mecanismo de HTTPS, ni documentado ni implementado.
  - **Backup automático real** (`infra/postgres/backup/backup.sh`+`restore.sh`, servicio `backup`
    en `docker-compose.yml`): `pg_dump` programado (inmediato al arrancar + diario) con retención
    de 7 días, usando el rol `gorazus_backup` ya diseñado (`BYPASSRLS`+`pg_read_all_data`, ver
    `30_backup_restore.sql`). Fase 1 explícita — el mecanismo objetivo de producción real
    (`pgBackRest` + WAL archiving continuo + PITR, `docs/database/08-estrategia-respaldo.md §2`)
    es infraestructura mayor que no se improvisa sin esa instalación real, documentado como Fase 2.
    **Verificado real**: respaldo de 5.8MB generado contra la base real, `pg_restore --list`
    confirma un archivo válido con 13.452 entradas (los 21 schemas completos).

  **Dos bugs reales adicionales, encontrados recién al probar la cadena completa
  nginx→api→Postgres/Redis/RabbitMQ por primera vez de punta a punta esta sesión** (antes solo se
  había probado la imagen de `api` sola, nunca el `docker-compose.yml` completo):
  1. `apps/api` en el compose completo no podía conectar a Postgres/Redis/RabbitMQ
     (`ECONNREFUSED ::1:5672`/etc.) — el servicio `api` hereda `.env` entero vía `env_file:`, pero
     `.env` fija `DATABASE_URL`/`REDIS_URL`/`RABBITMQ_URL`/`MINIO_ENDPOINT` en `localhost` (pensado
     para `ts-node` corriendo en el host) — dentro del contenedor, `localhost` es el propio
     contenedor, no los otros servicios. `docker-api-1` llevaba **toda la sesión** con estado
     `Exited (1)`, nunca se había investigado por qué. Corregido con un bloque `environment:` en
     el servicio `api` de `docker-compose.yml` que sobreescribe esas 4 variables con los hostnames
     internos de Docker (`postgres`/`redis`/`rabbitmq`/`minio`/`ollama`) — `environment:` tiene
     precedencia sobre `env_file:`. Nueva variable `POSTGRES_APP_PASSWORD` en `.env`/`.env.example`.
  2. `infra/nginx/nginx.conf`: `proxy_pass http://api:3000/;` (con barra final) le recorta el
     prefijo `/api/` a cada request antes de reenviarlo — pero `apps/api` tiene
     `setGlobalPrefix('api')` y espera ese mismo prefijo de vuelta, así que todo pasaba a 404
     (`Cannot GET /v1/health/live`). Corregido quitando la barra final (`proxy_pass http://api:3000;`)
     — mismo fix aplicado en `infra/kubernetes/base/web-nginx-configmap.yaml`.
     **Verificado real de punta a punta después de ambos fixes**: `https://localhost/` sirve el
     frontend, `https://localhost/api/v1/health/live` → 200, y un login real
     (`POST /api/v1/auth/login`) a través de nginx+TLS+api+Postgres (con RLS genuinely enforced)
     devuelve 200 con un JWT real.

- **FASE 04 — Notification Center (núcleo mínimo) + canal WhatsApp** (`core/notifications`,
  nuevo paquete `core/*`): `NotificationCenterService.send()` como punto de entrada único
  (docs/architecture/32-core-platform/06-eventos-y-mensajeria.md §4), `WhatsAppGatewayAdapter`
  (WhatsApp Business Cloud API de Meta, real vía `fetch`, sin mockear) detrás de la interfaz
  genérica `NotificationChannelAdapter` (un adaptador por canal, §4.1), `WhatsAppCredentialsService`
  (credenciales por tenant en `core.integrations`/`integration_credentials`, cifradas con
  `packages/tooling/utils/encryption.ts` — AES-256-GCM ya construido, coincide con la interfaz
  `EncryptionUtils` de `10-utilidades-comunes.md §7`), aislamiento por tenant vía
  `withTenantScope` (mismo mecanismo que `BaseRepository`). Alcance deliberado de Fase 1
  (decisión del usuario, "núcleo mínimo ahora"): envío síncrono (sin `Background Jobs`),
  sin `Template Engine`/`Language Manager` (ninguno de los dos existe todavía en `core/` —
  `body` ya viene resuelto del llamador), sin reintento con backoff, solo destinatarios
  internos (`core.users`, el esquema físico no admite lead/cliente de CRM como
  `recipient_user_id`) — el teléfono destino se resuelve desde
  `notification_preferences.metadata.whatsappPhoneNumber` (JSONB genérico ya existente,
  ningún schema modela teléfono en `core.users`). Script operativo
  `core/notifications/scripts/seed-whatsapp-channel.ts` (da de alta el canal en
  `core.notification_channels`, no hay UI de administración todavía). Nueva variable de
  entorno `NOTIFICATIONS_ENCRYPTION_KEY` (AES-256-GCM, fail-fast si falta o no es hex de 32
  bytes) + `WHATSAPP_GRAPH_API_VERSION`. 5 tests unitarios (fake Prisma client, mismo patrón
  que `base.repository.spec.ts`). Los 11 puntos restantes de integraciones de FASE 04
  (DGII/SUNAT/SAT, Stripe/PayPal, Telegram, Microsoft 365/Google Workspace, OCR) y los
  asistentes de IA sobre Ollama quedan documentados como pendientes de confirmación de
  negocio, sin diseño especulativo — ver `docs/architecture/42-integraciones-plan-fase-8.md`.
- **FASE 04 — Ollama como infraestructura `core/*`** (`core/ollama`, nuevo paquete): `OllamaService`
  como wrapper delgado sobre el cliente oficial `ollama` (`generate`/`chat`/`embed`/`listModels`,
  sin streaming en Fase 1), mismo criterio que `core/storage`/`core/messaging` sobre MinIO/RabbitMQ
  — infraestructura técnica reutilizable, sin prompts ni lógica de ningún asistente específico
  (decisión de alcance confirmada: "Ollama de infraestructura ahora, resto después"). Servicio
  `ollama` agregado a `infra/docker/docker-compose.yml` (imagen oficial `ollama/ollama`, volumen
  para modelos descargados, sin `depends_on` desde `api` porque nadie lo consume todavía) +
  overlay `dev` (puerto 11434 expuesto) + overlay `prod` (`restart: unless-stopped`). Nuevas
  variables de entorno `OLLAMA_BASE_URL` (con default `http://localhost:11434`) y
  `OLLAMA_DEFAULT_MODEL` (sin default en código a propósito — qué modelo usar es decisión de cada
  futuro asistente). 5 tests unitarios (fake del cliente `Ollama`).
- **Bootstrap del monorepo**: Nx + pnpm workspaces, `tsconfig.base.json`, `eslint.config.mjs` (con `@nx/enforce-module-boundaries`), `.prettierrc`, `.editorconfig`, `.gitattributes`, CI/CD (4 workflows de GitHub Actions), `CODEOWNERS`.
- **Infraestructura Docker**: `docker-compose.yml` (Postgres, Redis, RabbitMQ, MinIO, nginx) + overlays `dev`/`prod`, pgAdmin y MailHog en dev, tuning de Redis/Postgres.
- **Foundation Platform** (`core/*`): `config` (Zod fail-fast), `logging` (JSON estructurado + correlación), `http` (exception filter, interceptors, middlewares, rate limit), `health` (liveness/readiness desacoplado), `kernel` (bootstrap de 6 fases), `observability` (OpenTelemetry tracing + Prometheus metrics), `cache` (Redis), `storage` (MinIO), `messaging` (Event Bus RabbitMQ), `scheduler` (cron).
- **Persistencia** (`core/database`): 21 clientes Prisma independientes (uno por schema de Postgres), scripts de split/generación (`split-schema-by-module.js`, `generate-all.js`, `copy-generated-to-dist.js`).
- **Utilidades comunes** (`packages/tooling/utils`): UUID, Clock, Hash (argon2id), Encryption (AES-256-GCM).
- `PROJECT_STRUCTURE.md`, `ARCHITECTURE_RULES.md`, README.md por carpeta principal.
- **Documentación de producto** (`docs/product/`, EPIC 02): 10 documentos — visión/
  principios, personas, journeys, workflows de negocio, arquitectura de información,
  navegación, catálogo de 336 pantallas organizado por 6 arquetipos reutilizables,
  flujos de usuario transversales, wireframes, atajos de teclado. Sin código.
- **Arquitectura de frontend** (`docs/frontend/`, EPIC 03): 10 documentos + README —
  formaliza Feature-First, expande `docs/architecture/03,29,44,45` a detalle de
  implementación (State Management, Routing, Folder Structure, Features, UI
  Guidelines, Performance, Error Handling, API Layer, Testing). Decisiones nuevas:
  `react-i18next`, error boundaries de 3 niveles + Sentry, MSW para tests, WCAG 2.1 AA.
- **Estándares de implementación** (`docs/standards/`, EPIC 04): 13 documentos +
  README — `PROJECT_STRUCTURE`, `FILE_STRUCTURE`, `NAMING_CONVENTIONS`,
  `CODING_STANDARDS`, `ARCHITECTURE_RULES`, `MODULE_GUIDELINES`,
  `COMPONENT_GUIDELINES`, `API_GUIDELINES`, `DATABASE_GUIDELINES`,
  `SECURITY_GUIDELINES`, `TESTING_GUIDELINES`, `DOCUMENTATION_GUIDELINES`,
  `CODE_REVIEW` (con checklist obligatorio de PR). Cierra un gap real nunca
  documentado: mapeo módulo español (`modules/ventas/`) ↔ schema Postgres inglés
  (`sales`), ver `NAMING_CONVENTIONS.md §5`.
- **Entorno de visualización de base de datos** (`tools/database/`, EPIC — Database
  Visualization Environment): DBeaver Community Edition portable (conexión
  `GORAZUS_DEV` preconfigurada) + SchemaSpy + Graphviz, 100% en `D:\`. Diagrama
  maestro (relaciones entre los 21 schemas) + 21 diagramas ERD por schema real
  (PNG/SVG/PDF, `docs/database/erd/`). `docs/database/DATABASE_STRUCTURE.md`,
  `DATABASE_DEPENDENCIES.md`, `DATABASE_VISUALIZATION.md`,
  `DATABASE_DICTIONARY.md` + `dictionary/` (21 archivos, diccionario técnico
  columna por columna generado desde `information_schema`), `DATABASE_HEALTH_REPORT.md`.
  Primera verificación completa de la base real desde su creación — ver "Pendiente
  conocido" abajo para los 3 gaps reales que encontró.
- **Optimización de la base de datos** (`docs/database/`, PHASE 01 — Database
  Enterprise, 2026-07-18): 8 documentos nuevos — `DATABASE_ARCHITECTURE.md`,
  `TABLE_CATALOG.md`, `INDEX_CATALOG.md`, `FOREIGN_KEYS.md`,
  `MODULE_RELATIONSHIPS.md`, `DATA_FLOW.md`, `PERFORMANCE.md`, `SECURITY.md`,
  `BACKUP.md` — más actualización de `DATABASE_STRUCTURE.md`,
  `DATABASE_HEALTH_REPORT.md`, `DATABASE_DEPENDENCIES.md` (corrige una afirmación
  propia incorrecta: "0 FK cross-schema, verificado" nunca se había verificado
  realmente) y `dictionary/05-products.md`. `infra/docker/postgres/Dockerfile`
  nuevo (Postgres 17 + `postgresql-17-partman`, ya que `postgres:17-alpine` no la
  incluía) — `docker-compose.yml` actualizado para construirla.

- **Frontend — composition root funcional** (`apps/web`, `ui-kit/`, `modules/auth`,
  `modules/dashboard`): primera app React arrancable de punta a punta, siguiendo
  `docs/frontend/` al pie de la letra. `ui-kit/` — primitives shadcn/ui (Button, Input,
  Label, Card, Dialog, Toast, Tooltip), `Form*` (wrapper de React Hook Form + Zod),
  `DataTable` genérico sobre TanStack Table, `AppShell`/`Sidebar`/`Topbar`/`Footer`/
  `Breadcrumb`/`ThemeToggle`, páginas terminales `NotFoundPage`/`ForbiddenPage`,
  `GlobalLoader` + `RouteLoadingFallback`, cliente HTTP (`fetch` nativo, refresh de
  token con deduplicación, `ApiClientError`), store Zustand único (`authSlice`+`uiSlice`,
  persistido selectivamente) y el puente de invalidación de TanStack Query
  (`query/invalidation-bridge.ts`) que le permite a `switchCompanyContext` invalidar
  cache sin que `ui-kit` dependa de la instancia concreta de `QueryClient` de `apps/web`
  — mismo patrón de indirección que `http/session.ts` (`onSessionExpired`). El store vive
  en `ui-kit/` y no en `apps/web` a propósito: es la única ubicación de las dos permitidas
  por `FOLDER_STRUCTURE.md §2.1` que también pueden importar `modules/*/frontend`, y
  `modules/auth/frontend` necesita escribir la sesión al loguearse. `apps/web/src/app/`
  ensambla `router.tsx` (React Router `createBrowserRouter`, `RequireAuth`, layout
  protegido, 404), `providers.tsx` (árbol `QueryClientProvider > ThemeProvider >
ErrorBoundary > RouterProvider`), y `app-shell/module-registry.ts` con las 25 features
  del sitemap (`docs/product/05_INFORMATION_ARCHITECTURE.md §3`) agrupadas para el
  sidebar. Primeros dos módulos de negocio con `frontend/` real: `auth` (`/login`,
  `useLogin`, formulario con React Hook Form + Zod) y `dashboard` (placeholder de
  composición, sin datos propios todavía). Verificado con `tsc --noEmit` limpio en
  `apps/web` y `ui-kit`, `vite build` de producción, y un smoke test real en Chromium
  headless (Playwright): `/` redirige a `/login`, el formulario renderiza, y un submit
  fallido (sin backend de `auth` corriendo) se muestra como error inline, sin crash.

- **Backend — primer módulo de negocio real: `auth` (Fase 1)** (`modules/auth/backend`): login
  (email + contraseña, sin 2FA todavía), refresh con rotación, logout — Clean Architecture completa
  (`entities/Usuario,Sesion` con invariantes propios y tests, `repositories/` puerto+adaptador Prisma
  sobre `core.users`/`core.sessions`/`core.tenants` vía `PRISMA_CORE`, `services/` casos de uso,
  `validators/` Zod compartido con el frontend, `controllers/AuthController`). Primer consumidor real
  de `BaseRepository`/`withTenantScope` (Paso 3) — ver bugs corregidos abajo, todos preexistentes,
  ninguno nunca antes ejercitado contra un cliente Prisma real. Resuelve el mismo gap de tenant que
  bloqueaba el login: `core.users.email` es único **por tenant** (`uq_core_users_tenant_email`), así
  que el login primero resuelve el tenant por `slug` — dos políticas RLS nuevas y puntuales
  (`tenant_lookup_by_slug`, `session_lookup_by_refresh_hash` en `docs/database/sql/30_backup_restore.sql`)
  permiten esos dos únicos lookups sin `app.current_tenant_id` conocido. Verificado real, no simulado:
  `POST /auth/login` con Postgres/Redis/RabbitMQ corriendo en Docker, contraseña con hash argon2id
  real, JWT firmado real, cookie `httpOnly` de refresh real, rotación de refresh real, rechazo 401
  con contraseña incorrecta.
- **Infraestructura de arranque** (`core/kernel`): `cookie-parser` (refresh token vía cookie httpOnly)
  y CORS con `credentials: true` + origen exacto (`CORS_ORIGIN`, nueva variable de entorno,
  `core/config/env.schema.ts`) — antes `enableCors()` sin opciones no soportaba cookies cross-origin.
- **Backend — `seguridad` (Fase 1)** (`modules/seguridad/backend`): RBAC real — roles, catálogo de
  permisos `<modulo>.<accion>`, asignación rol↔permiso y usuario↔rol, administración de usuarios
  (alta con contraseña temporal, baja lógica) — sin ACL fino/ABAC/2FA/OAuth2/bitácora de incidentes
  (Fase 2, ya diseñados en `docs/architecture/15-modulo-security.md §4,6-8`, sin tabla nueva
  creada para ellos). Implementa `PermissionsResolverService`, reemplazando a
  `NoopPermissionsResolver` (que denegaba todo por diseño) — primer endpoint con
  `@RequirePermission(...)` que efectivamente autoriza en vez de siempre rechazar. Incluye un script
  de bootstrap idempotente (`scripts/seed-rbac.ts`) que resuelve el problema de arranque "hace falta
  un permiso para administrar permisos, pero ninguno existe todavía": siembra el catálogo, un rol
  "Administrador" de fábrica con todos los permisos, y lo asigna a un usuario por email. Verificado
  end-to-end contra la base real: `GET/POST /seguridad/roles` devuelve 401 sin token, 200 con un
  token de un usuario con el permiso — el `PermissionsGuard` global ya autoriza de verdad.
- **FASE 03 Frontend Enterprise — Design System completo + primer módulo de negocio con UI real**:
  `ui-kit/components/primitives/` suma `Tabs`, `Drawer` (Radix Dialog reposicionado, patrón shadcn
  "Sheet"), `Popover`, `DropdownMenu`, `DatePicker` (`react-day-picker`), `MoneyInput`,
  `BarcodeScannerInput` (lectoras USB/Bluetooth "keyboard wedge" — sin cámara, documentado como
  fuera de alcance), `Wizard` (formulario multi-paso), `Badge`. `ui-kit/components/charts/` nuevo
  (Recharts, decisión ya cerrada en `docs/architecture/29 §8.1`): `LineChart`, `BarChart`,
  `PieChart`, `AreaChart`, `KpiNumber` — paleta categórica de 8 colores validada con el skill de
  dataviz (orden fijo, nunca ciclado) como variables CSS en `apps/web/src/styles/globals.css`.
  `ui-kit/utils/format/{date,number,money}.ts` (envuelven `Intl.*`, gap ya señalado en la auditoría
  de esta misma fecha). `NotificationCenter` (campana de notificaciones del Topbar, distinta del
  `Toaster` efímero). **Bug real encontrado y corregido durante la verificación en navegador**:
  `FormLabel`/`FormControl` (`ui-kit/components/form/form-field.tsx`) nunca conectaban `htmlFor`/
  `id`/`aria-describedby` — ningún lector de pantalla podía asociar una etiqueta con su input desde
  que se construyó este componente (sesión de `auth`). Corregido con `React.useId()` +
  `@radix-ui/react-slot` (mismo patrón shadcn de referencia), retroactivo a todo formulario
  existente (login incluido).
  Primer módulo de negocio con **frontend real de punta a punta** además de `auth`:
  `modules/seguridad/frontend` — listado de usuarios (datos reales), alta con contraseña temporal,
  baja lógica, wireados a `/seguridad/usuarios`. Los ~20 módulos sin backend (`ventas`, `pos`,
  `crm`, `compras`, `inventario`, `proveedores`, `clientes`, etc.) reciben un placeholder honesto
  generado automáticamente desde `MODULE_REGISTRY` (`ComingSoonPage`) — decisión explícita del
  usuario de no simular datos. Verificado real en navegador (Playwright): login → Usuarios con
  datos reales → alta de usuario real vía UI → placeholder de Ventas — 0 errores de consola.
- **FASE 02 Backend Enterprise — infraestructura de calidad, aplicada a `auth`/`seguridad`**:
  Swagger/OpenAPI real (`@ApiTags`/`@ApiOperation`/`@ApiResponse`/`@ApiBearerAuth` en los 3
  controllers existentes, DTOs de respuesta tipados para `auth`), export automático del spec
  OpenAPI a `docs/api/openapi.json` en cada arranque no-productivo (`core/kernel/bootstrap.ts`) —
  Postman lo importa directo, sin mantener una colección aparte a mano. Primeros tests de
  **integración reales** del proyecto (antes solo había unitarios): `auth.controller.e2e-spec.ts`
  (7 casos — login, refresh con rotación de cookie, 401/400 en cada rama de error) y
  `roles.controller.e2e-spec.ts` (5 casos, incluyendo que `PermissionsGuard` deniega con 403 a un
  usuario autenticado sin el permiso) arrancan la app real vía `@nestjs/testing` +`supertest` contra
  el Postgres/Redis/RabbitMQ de Docker — no contra una base de test aislada todavía (pendiente,
  ver "Pendiente conocido"). 30 tests totales pasando (17 `auth-backend` + 13 `seguridad-backend`).
- **Auditoría técnica completa** (`docs/00-auditoria-2026-07-20.md`) — 13 áreas, verificación en
  vivo (no solo lectura de documentos): confirma que el gap de RLS-vs-ownership es sistémico en las
  503 tablas (no solo `core.tenants`), que `nx build`/`nx serve` fallan por un error de `rootDir` de
  TypeScript entre paquetes (sin corregir — se corre vía `ts-node` mientras tanto), y que
  `core/realtime` es un paquete de Foundation Platform sin empezar (no rastreado antes). Corregido
  en el mismo pase: `.dockerignore` (raíz del monorepo) — no existía ninguno, causa confirmada de
  por qué el build de las imágenes `api`/`web` transfería 8+ GB de contexto.
- **FASE 2 Backend Core — 2FA exigido en login, Archivos genérico, email real (2026-07-22).**
  - **`modules/auth/backend` — 2FA integrado al login** (cerraba el propio comentario de cabecera de
    `DosFactoresService`: "no integrado a LoginUseCase todavía"). `POST /auth/login` ahora, tras
    validar la contraseña, chequea si el usuario tiene una credencial TOTP confirmada
    (`security.two_factor_credentials`) — de ser así, retiene los tokens y devuelve un
    `challengeToken` opaco de un solo uso (Redis, TTL 5 min) en vez de `accessToken`/cookie. Nuevo
    `POST /auth/login/2fa` completa el login con el código TOTP real. `auth` no puede importar
    `modules/seguridad` (`@nx/enforce-module-boundaries`), así que `auth` lee
    `security.two_factor_credentials` con su propio `TwoFactorCredentialRepository` (mismo patrón de
    Prisma client compartido entre módulos ya usado por `login_attempts`). Emisión de sesión/JWT
    extraída de `LoginUseCase` a `IssueLoginSessionService`, compartida por el login directo y el de
    2FA. Verificado end-to-end contra Postgres/Redis reales.
  - **`core/storage` — primer consumidor real** (`StorageService` envolvía MinIO desde Fase 01 sin
    que nada lo llamara). `StorageController` nuevo: `POST /files` (multipart), `GET /files/:key`
    (URL firmada de corta duración, nunca credenciales de MinIO al cliente), `DELETE /files/:key` —
    un bucket por tenant (`archivos-<tenantId>`), mismo aislamiento multi-tenant que el resto de la
    plataforma aplicado acá a nivel de bucket (MinIO no tiene RLS). Sin tabla de metadata nueva: la
    `key` devuelta se guarda en la columna `metadata JSONB` que ya tiene cada entidad, cuando un
    módulo de negocio real la necesite.
  - **`modules/auth/backend` — email real de reset de contraseña** (`SMTP_HOST`/`SMTP_PORT` estaban
    validados en `env.schema.ts` desde Fase 01 sin ningún consumidor). `EmailPasswordResetNotifier`
    (nodemailer) reemplaza a `LoggingPasswordResetNotifier` como implementación por defecto de
    `PasswordResetNotifier` — en dev entrega contra MailHog (`http://localhost:8025`), verificado
    leyendo el correo real capturado vía su API. Nuevo namespace de config `mail`
    (`core/config/namespaces/mail.config.ts`).
- **FASE 2, Parte 2.1 — Infraestructura del módulo `auth`, preparación sin tocar login (2026-07-22).**
  Pedido explícitamente como "no desarrollar aún el login" — todo lo de abajo es aditivo, ningún
  caso de uso de login/refresh/2FA (Parte 2 — Backend Core) se modificó:
  - **Value Object `Email`** (`modules/auth/backend/value-objects/email.vo.ts`) +
    `EmailInvalidoException` — preparado, `Usuario` sigue con su validación inline (adopción es
    Parte 2.2).
  - **Domain Events preparados** (`modules/auth/backend/events/`): `UsuarioAutenticadoEvent`,
    `LoginFallidoEvent`, `CuentaBloqueadaEvent`, `SesionRevocadaEvent` — routing keys siguiendo la
    convención `<modulo>.<entidad>.<evento>` ya documentada (`08-infraestructura-y-despliegue.md §4`).
    Ninguno se publica todavía — `EventBusService` (`core/messaging`) sigue sin productores reales.
  - **JWT Provider** (`modules/auth/backend/services/jwt-token.provider.ts`, `signAccessToken()`) —
    extraído de la firma inline ya duplicada en `IssueLoginSessionService`/`RefreshTokenUseCase`.
    Vive en el módulo `auth`, no en `packages/tooling/utils`: ese paquete resuelve dependencias
    desde la raíz del monorepo (sin `package.json` propio) y `jsonwebtoken` no es una dependencia
    de raíz (a diferencia de `argon2`, confirmado con un fallo real de resolución de tipos al
    intentar ponerlo ahí primero).
  - **`GuestGuard`** (`core/http/guards/guest.guard.ts`) — inverso de `JwtAuthGuard`, verifica el
    JWT por su cuenta (no depende de que Passport ya haya corrido, que no pasa en rutas
    `@Public()`). Preparado, ningún controller lo usa todavía.
  - **Config de TTLs/umbrales** (`core/config/namespaces/auth.config.ts` extendido):
    `JWT_ACCESS_TTL`/`JWT_REFRESH_TTL_DAYS`/`LOGIN_LOCKOUT_THRESHOLD`/
    `LOGIN_LOCKOUT_WINDOW_MINUTES`/`TWO_FACTOR_CHALLENGE_TTL_MINUTES` — todas opcionales, default
    idéntico al valor hardcodeado real en los use cases, validadas en `env.schema.ts` pero sin
    consumidor todavía (conectarlas es Parte 2.2, sin cambiar el comportamiento por default).
  - **Documentación**: `AUTH_ARCHITECTURE.md`/`AUTH_README.md`/`AUTH_FLOW.md` nuevos (raíz del
    repo) — flujos reales, mapeo de la convención de carpetas propia del proyecto a los conceptos
    Application/Domain/Infrastructure/Presentation del pedido (sin crear carpetas literales con
    esos nombres — ver `AUTH_ARCHITECTURE.md §1` para el porqué). `modules/auth/README.md`
    corregido (decía "backend/ todavía no implementado", falso desde Parte 2). Nota agregada a
    `docs/architecture/13-modulo-auth.md` señalando dónde el código real diverge del diseño
    original (nombres de clases de 2FA, 200 vs 202 en la rama de 2FA).
  - 18 tests nuevos, todos unitarios (Value Object, eventos, JWT provider, `GuestGuard`) — sin
    e2e nuevos esta parte porque no se tocó ningún endpoint real.
- **FASE 03 — Backend Core Enterprise, Parte 01: auditoría completa, sin desarrollo (2026-07-23).**
  Pedido explícito: "no comenzar el desarrollo hasta terminar esta auditoría" — cero cambios de
  código de negocio esta sesión, solo verificación + documentación. `git fetch`/`status` confirmó
  el repo sincronizado con `origin/gorazus2`, sin cambios remotos pendientes. Build/lint limpios en
  los 8 paquetes principales; `pnpm audit` refrescado (39 vulnerabilidades, sin drift desde la
  sesión anterior); `docs/api/openapi.json` confirmado vigente (38 rutas, sin cambios de código
  desde su última regeneración). **Discrepancia real encontrada**: el pedido de FASE 03 listaba
  como prioridad "primero" Infraestructura/Auth/Usuarios/Roles/Permisos/Multiempresa/Sucursales/
  Almacenes/Configuración/API REST/OpenAPI, dando a entender que el desarrollo recién empieza —
  de esa lista, **todo ya existe excepto Almacenes** (`modules/inventario` sigue vacío). Nuevo
  `TECHNICAL_DEBT.md` (deuda técnica consolidada, antes dispersa entre este archivo y los reportes
  de sesiones previas). `BACKEND_HEALTH_REPORT.md`/`API_REPORT.md`/`SECURITY_REPORT.md`/
  `TEST_REPORT.md`/`PROJECT_STATUS.md` reescritos como snapshots de estado ACTUAL completo (antes
  eran reportes de delta de una sesión puntual). `ROADMAP.md` corregido: decía "2FA no está
  integrado como paso obligatorio" y "`PasswordResetNotifier` solo tiene logging" — ambas
  afirmaciones falsas desde la sesión "Backend Core" (2FA sí está exigido, el email sí es real).
  **Limitación de esta sesión**: Docker Desktop no disponible en el host durante toda la sesión
  (mismo síntoma que al cierre de la sesión anterior, sin resolverse entre sesiones) — los tests
  que necesitan Postgres/Redis/MinIO/MailHog reales no se pudieron re-correr; los 31 tests
  unitarios puros de `auth-backend` sí, y pasan limpio. Ver `BACKEND_HEALTH_REPORT.md §4` y
  `TEST_REPORT.md §2` para el detalle honesto de qué se verificó y qué queda pendiente de
  reconfirmar.

- **FASE 03 — Backend Core Enterprise, Parte 02: Autenticación Enterprise (2026-07-22).**
  A diferencia de Parte 2.1 (aditiva/preparatoria), esta parte cambia comportamiento real de
  `auth`. Nuevo: `rememberMe` en `POST /auth/login` (refresh token de larga duración, TTL
  preservado a través de la rotación sin columna nueva — heurística de duración); captura de
  `ip_address`/`user_agent` en `core.sessions` (columnas que ya existían, sin consumidor);
  protección de session-hijacking en `POST /auth/refresh` (warning siempre, rechazo opcional vía
  `AUTH_STRICT_SESSION_VALIDATION`); verificación de empresa/sucursal activa (`OrganizationStatusRepository`,
  nuevo) en refresh y en `GET /auth/session` (nuevo); `GET /auth/me` (nuevo, identidad mínima);
  `POST /auth/revoke` (nuevo, revoca una sesión propia o todas — "cerrar sesión en todos los
  dispositivos"). Adoptado de Parte 2.1: `LoginUseCase`/`RefreshTokenUseCase`/
  `IssueLoginSessionService` ya leen los TTLs/umbrales desde `ConfigService` en vez de constantes
  hardcodeadas; `RefreshTokenUseCase` adoptó `signAccessToken()` (JWT Provider) en vez de su
  `jwt.sign(...)` inline duplicado. **Deliberadamente no implementado**: login por username —
  `core.users` no tiene esa columna y el modelo de datos está congelado, gap documentado en vez de
  rellenado apurado (`AUTH_REPORT.md §4`). **Gap detectado (no corregido, fuera de módulo)**:
  `POST /seguridad/sesiones/:id/revocar` (admin) no marca el `sessionId` en la blacklist de Redis
  a diferencia de su equivalente de autoservicio nuevo (`TECHNICAL_DEBT.md §1`). 4 casos de uso
  nuevos con specs unitarios propios (`get-current-user`/`validate-token`/`revoke-token`/
  `refresh-token`, 22 tests nuevos) — Docker no disponible durante toda la sesión, e2e reales
  pendientes de reconfirmar (`AUTH_TEST_REPORT.md`). Entregables nuevos: `AUTH_REPORT.md`,
  `AUTH_TEST_REPORT.md`, `JWT_CONFIGURATION.md`, `OPENAPI_AUTH.md`; `SECURITY_REPORT.md`
  actualizado. `0.3.1` → `0.4.0` (`MINOR`: funcionalidad real, no aditivo).

- **FASE 03 — Backend Core Enterprise, Parte 03: Gestión de Usuarios Enterprise (2026-07-22).**
  No existe un módulo `users` separado — extiende `UsuariosController`/`UsuariosAdminService`
  (`modules/seguridad/backend`, FASE 02). **Corrección de seguridad primero**: los 6 endpoints
  preexistentes devolvían la fila cruda de `core.users`, incluido `password_hash` (Argon2id) — 5 de
  ellos lo filtraban en la respuesta HTTP (`GET/PATCH /me`, `POST /` crear, `activar`/`desactivar`,
  `GET /` listar). Corregido con `toUsuarioPublico()`, aplicado a toda respuesta que incluya un
  usuario (`USERS_SECURITY_REPORT.md §1`). Nuevo: edición administrativa (`PUT /:id`, nombre y/o
  correo de cualquier usuario), cambio de correo self-service (`PATCH /me` ahora acepta `email`),
  soft delete + restore (`DELETE /:id`, `POST /:id/restore` — antes no existía ningún mecanismo de
  eliminación), estado agregado (`PATCH /:id/status`: active/inactive/suspended/blocked/
  pending_activation — `core.users` solo persiste `is_active`+`deleted_at`, los estados finos van a
  `metadata.status` SIEMPRE junto con `is_active=false`, nunca como única señal), reseteo de
  contraseña administrativo (`PATCH /:id/password`), revocar rol (`DELETE /:id/roles/:rolId` — el
  método de servicio ya existía sin ruta, código muerto desde FASE 02), multiempresa (`GET/POST/
DELETE /:id/empresas`, wirea `core.user_companies`, existente en el modelo certificado sin
  consumidor desde Enterprise v1.0.0), preferencias (`GET/PATCH /me/preferencias`, wirea
  `core.user_profiles`, ídem — idioma/zona horaria en columnas reales, tema/formatos/página
  inicial/registros por página/notificaciones en su `metadata` JSONB, sin migración), foto de perfil
  (`POST/DELETE /me/avatar`, reusa `StorageService`/`core-storage` con bucket propio
  `avatares-<tenantId>`, key guardada en `user_profiles.metadata.avatarKey` — no en la columna FK
  `avatar_file_id`, que ningún flujo de subida existente llena). **Gap real encontrado escribiendo
  tests**: `BaseRepository.findById()` no filtra `deleted_at` — sin un guard nuevo
  (`UsuarioEliminadoException`), editar/cambiar-estado/resetear-password seguían funcionando en
  silencio sobre un usuario ya eliminado; corregido. **Deliberadamente no implementado**: cambio de
  username (mismo gap que Parte 02, `core.users` no tiene esa columna), múltiples
  sucursales/almacenes por usuario (no existe `user_branches`/`user_warehouses`, y
  `modules/inventario` sigue vacío), firma digital (el pedido dice "preparada", no implementada —
  `metadata.signatureKey` reservado, sin endpoint). 38 tests unitarios nuevos (5 suites) + 11 e2e
  nuevos (extendiendo `usuarios.controller.e2e-spec.ts`, que además cubrió por primera vez
  `crear`/`listar`/`asignarRol`, ya existentes pero sin e2e) — Docker no disponible durante toda la
  sesión, e2e reales pendientes de reconfirmar (`USERS_TEST_REPORT.md`). Entregables nuevos:
  `USERS_REPORT.md`, `USERS_SECURITY_REPORT.md`, `USERS_API.md`, `USERS_API_REPORT.md`,
  `USERS_TEST_REPORT.md`, `USERS_README.md`. `0.4.0` → `0.5.0` (`MINOR`).

- **FASE 03 — Backend Core Enterprise, continuidad: Almacenes (2026-07-23).**
  Sesión de continuidad iniciada con un diagnóstico completo del repo (lint 23/23, build 19/19, 157/165
  tests unitarios — los 8 restantes atribuibles a Docker caído; hallazgo nuevo: `nx run web:test` no
  arranca por una discrepancia ESM/CJS al cargar `vite.config.ts`, sin corregir esta sesión) más 4
  entregables nuevos (`PROJECT_HEALTH_REPORT.md`, `NEXT_STEPS.md`, refresco de `PROJECT_STATUS.md`/
  `TECHNICAL_DEBT.md`). Primer código real de `modules/inventario/backend` — proyecto Nx nuevo
  (`inventario-backend`), vacío desde su creación, confirmado sin un solo archivo en tres auditorías
  consecutivas (Parte 01/02/03). Alcance acotado deliberadamente a la estructura física de
  `docs/architecture/19-modulo-inventory.md §1-2` (Almacén→Zona→Ubicación,
  `inventory.warehouses`/`warehouse_zones`/`warehouse_locations`), no las 29 tablas restantes de
  stock/movimientos/costeo/conteos/producción (fase "Inventario" siguiente, no esta). Nuevo:
  `AlmacenesController`/`ZonasAlmacenController`/`UbicacionesAlmacenController` (CRUD, sin eliminar a
  propósito — mismo alcance que `SucursalesController`), `EmpresaSucursalLookupRepository` (valida
  `companyId`/`branchId` reales antes de crear un almacén, mismo patrón que `OrganizationStatusRepository`
  de `auth` Parte 02 — cada módulo de negocio adapta las tablas compartidas que necesita, nunca importa
  el repositorio de otro), quinto cliente Prisma expuesto en `@gorazus/core-database`
  (`InventoryPrismaClient`/`PRISMA_INVENTORY`, ya wireado en `database.module.ts` desde el bootstrap del
  monorepo sin consumidor hasta ahora), permiso `inventario.gestionar_almacenes` (`seed-rbac.ts`).
  Validaciones reales: `zoneFunction` contra el `CHECK` real (`receiving`/`storage`/`picking`/
  `shipping`), jerarquía de ubicaciones (`parentLocationId`) exige pertenecer a la MISMA zona. 32 tests
  unitarios nuevos (6 suites) + 1 e2e nuevo (`almacenes.controller.e2e-spec.ts`, flujo completo
  almacén→zona→ubicación con jerarquía de 2 niveles) — Docker no disponible durante toda la sesión
  (5ª sesión consecutiva), e2e reales pendientes de reconfirmar (`ALMACENES_TEST_REPORT.md`).
  Entregables nuevos: `ALMACENES_REPORT.md`, `ALMACENES_API.md`, `ALMACENES_TEST_REPORT.md`.
  `0.5.0` → `0.6.0` (`MINOR`).

- **FASE 04 — Productos (2026-07-23).**
  Primer código real de `modules/productos/backend` — proyecto Nx nuevo (`productos-backend`).
  Alcance acotado deliberadamente a las 5 tablas núcleo del catálogo que
  `docs/architecture/18-modulo-products.md §1-4` documenta como base física del módulo
  (`products.units_of_measure`/`product_categories`/`brands`/`product_models`/`products`), no las 30
  tablas restantes de variantes/atributos/combos/kits/BOM/imágenes/códigos de barra/historial de
  precios/reseñas/proveedores/perfiles fiscales (fuera de alcance, documentado en
  `PRODUCTOS_REPORT.md §4`). Nuevo: `UnidadesMedidaController`/`CategoriasProductoController`
  (jerárquica vía `parentCategoryId`)/`MarcasController`/`ModelosProductoController`/
  `ProductosController`, todos bajo el permiso único `productos.gestionar_productos`.
  `EmpresaLookupRepository` (valida `companyId` real antes de crear cualquier fila — las 5 tablas de
  `products` tienen `company_id UUID NOT NULL`, a diferencia de un catálogo tenant-wide con
  `company_id` nullable, así que cada schema "crear" exige el campo explícito en vez de inferirlo del
  contexto), sexto cliente Prisma expuesto en `@gorazus/core-database` (`ProductsPrismaClient`/
  `PRISMA_PRODUCTS`, ya wireado en `database.module.ts` sin consumidor hasta ahora). Dos invariantes
  de dominio que el modelo de datos certificado señala como "no reforzadas por `CHECK` cruzado, a
  nivel de aplicación" (`docs/architecture/18-modulo-products.md §1/§12`), implementadas: (1) un
  producto de tipo `service` no puede tener `tracksSerial`/`tracksLot` en `true` — no tiene existencia
  física que rastrear, validado en la entidad `Producto`; (2) si un producto referencia `modelId` y
  `brandId` a la vez, el modelo debe pertenecer efectivamente a esa marca — validado en
  `ProductosService.validarModelo()`, tanto en `crear()` como en `actualizar()` (resolviendo la marca
  actual del producto cuando `actualizar()` cambia solo el modelo sin tocar la marca). Mismo problema
  de resolución de tipos de `multer` que Almacenes (`SeguridadModule` importado transitivamente por el
  e2e arrastra el tipo `Express.Multer.File` de `usuarios.controller.ts`, que no resuelve bajo el
  `tsconfig.spec.json` propio del paquete nuevo) — corregido de forma idéntica: `"multer"` en el
  arreglo `types` de `tsconfig.json`/`tsconfig.spec.json` + `@types/multer` como devDependency. 53
  tests unitarios nuevos (10 suites, incluyendo un `it.each` sobre los 5 `productType` en
  `producto.entity.spec.ts`) + 1 e2e nuevo (`productos.controller.e2e-spec.ts`, flujo completo unidad→
  categoría→subcategoría→marca→modelo→producto, más los dos casos negativos de las invariantes de
  dominio) — Docker no disponible durante toda la sesión (6ª sesión consecutiva), e2e reales
  pendientes de reconfirmar (`PRODUCTOS_TEST_REPORT.md`). Entregables nuevos: `PRODUCTOS_REPORT.md`,
  `PRODUCTOS_API.md`, `PRODUCTOS_TEST_REPORT.md`. `0.6.0` → `0.7.0` (`MINOR`).

- **FASE 05 — Inventario Enterprise, Parte 01: Diseño del módulo (2026-07-23), sin código.**
  Rama nueva `feature/inventory-core` (desde `gorazus2`). Auditoría completa del schema `inventory`
  (34 tablas, no 32 como asumía el pedido original — corregido contra la fuente real
  `docs/database/sql/06_inventory.sql`) y de `products` (35 tablas, dependencia de costeo/BOM) contra
  el SQL real, no contra documentación previa. Mapeo completo del pedido de "Inventario Enterprise"
  (Kardex, existencias por estado, ubicaciones de 9 niveles, series/lotes/vencimientos/garantías/
  peso/volumen/QR/RFID, todos los tipos de movimiento, trazabilidad IP/equipo/caja) contra las
  tablas reales — la mayoría del pedido **sí** tiene tabla real (una sola `stock` + vista
  `v_available_stock`, no una tabla por estado; jerarquía de ubicaciones auto-referenciada de
  profundidad arbitraria, no 9 tablas). 6 gaps reales sin columna ni tabla identificados y
  documentados (QR/RFID, fecha de fabricación, peso/volumen/dimensiones, obsolescencia, garantías,
  trazabilidad de caja) — ninguno se resolvió con una migración silenciosa; quedan como decisión de
  negocio pendiente, explícitamente fuera de esta parte. Decisión de diseño sin migración: usar
  `warehouse_locations.metadata.locationType` (columna `metadata JSONB` ya existente en el patrón
  universal) como convención de aplicación para distinguir pasillo/estante/nivel/posición dentro de
  la misma cadena `parent_location_id` ya construida en Almacenes (`v0.6.0`). Plan de implementación
  de 7 partes (Parte 02 Motor de stock/movimientos → 03 Reservas/transferencias → 04 Ajustes/conteos
  → 05 Recepciones/salidas/reglas de almacén → 06 Costeo → 07 Series/lotes → 08 Producción),
  ordenado por dependencia real, no por el orden en que se listaron en el pedido. Entregables nuevos:
  `INVENTORY_ARCHITECTURE.md`, `INVENTORY_HEALTH_REPORT.md`, `INVENTORY_STATUS.md`,
  `INVENTORY_NEXT_PHASE.md`; addendum agregado a `docs/architecture/19-modulo-inventory.md §13`.
  Sin bump de versión — mismo criterio que FASE 03 Parte 01 (auditoría/diseño puro, sin
  funcionalidad nueva): sigue en `0.7.0`.

- **FASE 05 — Inventario Enterprise, Parte 02: Motor de Stock y Movimientos (2026-07-23).**
  Primer código real sobre `inventory.stock`/`stock_movement_types`/`stock_movements` (3 de las 34
  tablas del schema, sumadas a las 3 de Almacenes en `0.6.0`), agregado al mismo
  `modules/inventario/backend` (`InventarioModule`) diseñado en Parte 01. Nuevo: catálogo de tipos
  de movimiento (`TiposMovimientoController`, `code` único por tenant, sin `eliminar`), motor único
  de movimientos (`POST /inventario/movimientos`) que actualiza `inventory.stock` y crea el
  movimiento en la misma transacción de base de datos (`withTenantScope` ya envuelve en
  `$transaction`) — valida producto (`ProductoLookupRepository` nuevo sobre `products.products`,
  mismo patrón que `EmpresaLookupRepository`/`EmpresaSucursalLookupRepository`), almacén (reusa
  `AlmacenRepository`), ubicación si se indica (reusa `UbicacionAlmacenRepository`), y resuelve
  `company_id`/`branch_id` desde el almacén destino en vez de pedirlos redundantes. `StockRepository`
  deliberadamente sin `create`/`update`: el saldo nunca se escribe fuera del motor de movimientos.
  Invariante nueva reforzada en la entidad `Stock` (no en la base, sin `CHECK` cruzado posible):
  reservado nunca puede superar lo disponible físicamente. `KardexRepository` — primer uso de una
  vista de Postgres (`inventory.v_kardex`) desde código de aplicación en todo el proyecto, vía
  `$queryRawUnsafe` parametrizado (mismo mecanismo de bind parameters que `tenant-scope.ts`), reusa
  el saldo corrido ya calculado por función de ventana en la base en vez de reimplementarlo.
  `StockInsuficienteException` (409) si una salida dejaría `quantity_on_hand` negativo — chequeo
  sin locking explícito, riesgo de condición de carrera bajo concurrencia real documentado, no
  oculto (`INVENTORY_STOCK_REPORT.md §5`). Nuevo permiso `inventario.gestionar_stock` (`seed-rbac.ts`,
  distinto de `gestionar_almacenes`) y script `seed-stock-movement-types.ts` (8 tipos idempotentes:
  receipt/issue/transfer_out/transfer_in/adjustment_increase/adjustment_decrease/production_output/
  production_consumption). 32 tests unitarios nuevos (6 suites: 3 entidades + 3 servicios) + 1 e2e
  nuevo (`stock-movimientos.controller.e2e-spec.ts`, primer e2e del proyecto que compone dos módulos
  de negocio reales — `InventarioModule` + `ProductosModule` — en el mismo `TestingModule` para
  crear un producto real vía su propia API) — Docker no disponible durante toda la sesión (7ª sesión
  consecutiva), e2e reales pendientes de reconfirmar (`INVENTORY_STOCK_TEST_REPORT.md`). Entregables
  nuevos: `INVENTORY_STOCK_REPORT.md`, `INVENTORY_STOCK_API.md`, `INVENTORY_STOCK_TEST_REPORT.md`.
  `0.7.0` → `0.8.0` (`MINOR`).

- **FASE 05 — Inventario Enterprise, Parte 03: Reservas y Transferencias (2026-07-23).**
  Primer código real sobre `inventory.stock_reservations`/`stock_transfers`/`stock_transfer_lines`
  (3 tablas más, 9 de 34 en total). Nuevo: reservas (`POST /inventario/reservas`) que incrementan
  `stock.quantity_reserved` atómicamente sin descontar `quantity_on_hand`, validando que no excedan
  lo disponible; liberar (`POST /inventario/reservas/:id/liberar`) decrementa `quantity_reserved` y
  marca `released_at`, rechaza liberar dos veces (409, idempotencia real). Transferencias
  (`POST /inventario/transferencias`) crean encabezado + líneas juntos en `draft`; `/iniciar`
  (`draft → in_transit`) genera un `transfer_out` por línea en el almacén origen; `/recibir`
  (`in_transit → received`) genera un `transfer_in` por línea en el destino; `/cancelar` solo
  permitido desde `draft` (cancelar `in_transit` requeriría un movimiento de reversión no
  especificado en el pedido, gap documentado, no construido). `MovimientoStockRepository.registrarLote`
  (nuevo) aplica N movimientos dentro de la MISMA transacción — necesario porque una transferencia
  de varias líneas se aplica completa o nada; se logró factorizando el cuerpo de `registrar` en un
  método privado compartido, sin duplicar la lógica atómica. Corrección real del `TODO` dejado en
  `0.8.0`: el chequeo de "stock suficiente" ahora compara contra disponible real
  (`quantity_on_hand - quantity_reserved`), no contra `quantity_on_hand` a secas — verificado en el
  e2e (reservar 30 de 50, una salida de 40 que dejaría `on_hand` por debajo de lo reservado se
  rechaza con `409`). Mismo permiso `inventario.gestionar_stock` (sin permiso nuevo, misma área
  funcional). 34 tests unitarios nuevos (6 suites: 2 entidades + 2 servicios + 3 tests agregados a
  `movimientos.service.spec.ts` para `registrarLote`) + 1 e2e nuevo
  (`reservas-transferencias.controller.e2e-spec.ts`, flujo completo de reservas con verificación
  numérica real de disponible y flujo completo de transferencia con verificación de stock en origen
  y destino) — Docker no disponible durante toda la sesión, e2e reales pendientes de reconfirmar
  (`INVENTORY_RESERVAS_TRANSFERENCIAS_TEST_REPORT.md`). Entregables nuevos:
  `INVENTORY_RESERVAS_TRANSFERENCIAS_REPORT.md`, `INVENTORY_RESERVAS_TRANSFERENCIAS_API.md`,
  `INVENTORY_RESERVAS_TRANSFERENCIAS_TEST_REPORT.md`. `0.8.0` → `0.9.0` (`MINOR`).

- **FASE 05 — Inventario Enterprise, Parte 04: Ajustes y Conteos Físicos (2026-07-24).**
  Primer código real sobre `inventory.stock_adjustment_reasons`/`stock_adjustments`/
  `stock_adjustment_lines`/`physical_counts`/`physical_count_lines`/`cycle_count_schedules` (6
  tablas más, 15 de 34 en total). Nuevo: catálogo de motivos de ajuste (`code`/`name`, sembrado con
  13 motivos: Daño, Pérdida, Robo, Error Humano, Diferencia de Conteo, Regularización, Producción,
  Consumo Interno, Donación, Vencimiento, Ajuste Administrativo, Inventario Inicial, Otro). Ajustes
  (`POST /inventario/ajustes`) resuelven `previousQuantity` del stock real al crear (no se le pide
  al llamador); `confirmar` calcula la diferencia real por línea y genera `adjustment_increase`/
  `adjustment_decrease` vía `MovimientosService.registrarLote`, reusando el motor multi-línea de
  Parte 03 sin duplicar lógica. Conteos físicos (`POST /inventario/conteos`) arman líneas
  explícitas o autogeneradas desde el stock real del almacén (filtrable por zona, join real vía
  `stock.warehouse_locations.zone_id`); flujo `planned → in_progress → completed`; captura
  deliberadamente ciega (`capturarLinea` nunca devuelve `system_quantity`); `completar` exige todas
  las líneas capturadas y genera automáticamente un ajuste en **borrador** ante discrepancias
  (motivo "Diferencia de Conteo", reusando `AjustesService.crear()` completo) — la confirmación de
  ese ajuste queda para revisión humana aparte, nunca automática. Programación de conteos cíclicos
  (`cycle_count_schedules`) con `frequency_days` genérico (cualquier período pedido se expresa en
  días) y `POST /:id/generar` que crea un conteo real filtrado a la zona y avanza `next_run_date`.
  **Concurrencia** (pedido explícito de esta parte): `lockStockRow()` (nuevo,
  `repositories/stock-lock.util.ts`) ejecuta `SELECT ... FOR UPDATE` real dentro de la transacción
  activa, aplicado al motor de movimientos (`aplicarMovimiento`, con reintento ante la carrera de
  inserción que detecta el índice único real `uq_inventory_stock`) y a reservas — cierra el riesgo
  de condición de carrera documentado sin resolver desde Parte 02. Mapeo explícito del pedido
  original contra el schema real: los 12 "tipos de ajuste" pedidos no son una columna, son
  aritmética (entrada/salida se derivan del signo de la diferencia) + el catálogo de motivos; los
  11 "tipos de conteo" pedidos se resuelven con `productIds` explícito/autogenerado/filtrado por
  zona — "por categoría/marca/proveedor" se compone con el módulo Productos ya existente, "doble" es
  un gap real de schema documentado, no construido. Mismo permiso `inventario.gestionar_stock` (sin
  permiso nuevo). 51 tests unitarios nuevos (8 suites: 4 entidades + 4 servicios) + 1 e2e nuevo
  (`ajustes-conteos.controller.e2e-spec.ts`, flujo completo de ajuste y de conteo con verificación
  numérica real de stock en cada paso, más programación cíclica con verificación de filtrado por
  zona) — Docker no disponible durante toda la sesión (8ª sesión consecutiva), e2e reales pendientes
  de reconfirmar (`INVENTORY_TEST_REPORT.md`, que también documenta un incidente de esta sesión:
  procesos `jest-worker` huérfanos de corridas interrumpidas agotaron la memoria del sistema,
  resuelto sin tocar código). Entregables nuevos: `INVENTORY_ADJUSTMENTS_REPORT.md`,
  `INVENTORY_PHYSICAL_COUNTS.md`, `INVENTORY_CYCLE_COUNT.md`, `INVENTORY_TEST_REPORT.md`,
  `INVENTORY_API.md`; `INVENTORY_HEALTH_REPORT.md` actualizado con addendum. `0.9.0` → `0.10.0`
  (`MINOR`).

### Corregido

- **FASE 2 Backend Core — 4 gaps reales de seguridad en el login, encontrados al auditar el módulo
  `auth` completo contra el checklist de la fase (2026-07-22).**
  1. **Sin bloqueo por intentos fallidos** — `security.login_attempts` existía en el schema desde la
     certificación de base de datos sin que nada escribiera en ella. `LoginUseCase` ahora registra
     cada intento (éxito y fallo) vía `LoginAttemptRepository` nuevo, y rechaza con
     `CuentaBloqueadaException` (429) tras 5 fallos en 15 minutos, contados por `(tenant, email)` —
     así el propio 429 no confirma si el email existe. Trade-off documentado: como no distingue
     email real de inventado, un atacante puede forzar el bloqueo de una cuenta ajena fallando
     a propósito; cerrar eso del todo pide límite por IP o CAPTCHA, fuera de esta fase.
  2. **`/auth/login` compartía el límite genérico de 100 req/60s** con el resto del API — ahora tiene
     su propio `@Throttle({ default: { limit: 5, ttl: 60_000 } })`.
  3. **El access token no se podía revocar antes de su expiración natural (~15 min)** — el propio
     `JwtStrategy` documentaba esto como gap conocido. `LogoutUseCase` ahora marca el `sessionId` como
     revocado en Redis (mismo TTL que el access token); `JwtStrategy.validate()` lo consulta antes de
     confiar en cualquier JWT, vía un contrato de nombre de clave compartido
     (`revokedSessionCacheKey()`, `core/http`) sin que `core/http` dependa de `modules/auth`.
  4. **`POST /auth/refresh` (el único endpoint autenticado solo por cookie) sin protección CSRF
     explícita** — cookie de refresh pasada de `sameSite: 'lax'` a `'strict'`, más un chequeo
     explícito de `Origin` contra `CORS_ORIGIN` en el propio handler como segunda capa.
  - Efecto colateral necesario: `JwtStrategy` (usado por CUALQUIER ruta protegida por
    `JwtAuthGuard`) ahora depende de `CacheService` — los 11 `*.e2e-spec.ts` que arman su propio
    `TestingModule` con `HttpModule` necesitaron sumar `CacheModule` a sus imports o la resolución de
    DI fallaba al arrancar. Se aprovechó la revisión para confirmar que dos hallazgos previos de un
    audit anterior eran falsos positivos: `sucursales` y `tasas-impuesto` sí tenían cobertura e2e
    real, solo que anidada dentro de los specs de `empresas`/`impuestos` en vez de en archivos propios.
  - `app.set('trust proxy', 1)` agregado a `core/kernel/bootstrap.ts` — nginx ya mandaba
    `X-Forwarded-For`/`X-Real-IP` (`infra/nginx/nginx.conf`) pero Express nunca los usaba, así que
    `req.ip` (consumido por el rate limiter y por el registro de intentos de login, ambos nuevos acá)
    siempre resolvía a la IP interna de nginx, no la del cliente real.
- **FASE 05 — healthcheck de nginx marcaba "unhealthy" pese a responder bien por HTTPS externo
  (2026-07-20).** `infra/nginx/nginx.conf` solo tenía `listen 80;`/`listen 443 ssl;` (IPv4) — el
  propio healthcheck de Docker (`wget http://localhost/...`, ejecutado DENTRO del contenedor)
  resuelve `localhost` a `::1` primero y la conexión se rechazaba (nginx no escuchaba en IPv6).
  Curl externo seguía funcionando porque el port-mapping de Docker sí resuelve bien — por eso
  nadie lo había notado hasta revisar `docker ps` explícitamente. Corregido agregando
  `listen [::]:80;`/`listen [::]:443 ssl;`. En un despliegue real de Kubernetes esto habría
  causado que el liveness probe reiniciara el pod en bucle indefinidamente.
- **FASE 05 — 4 bugs reales de frontend, encontrados recién al escribir el primer Playwright real
  contra el stack completo (2026-07-20)** — ninguno se había detectado antes porque la única
  verificación en navegador previa (FASE 03) usaba `pnpm nx serve web` con `apps/web/.env`
  apuntando directo a `localhost:3000`, nunca el flujo real detrás de nginx/HTTPS:
  1. **`apps/web/.env` fijaba `VITE_API_URL=http://localhost:3000/api/v1`** — ese valor queda
     horneado en el build de producción (Vite lo inlinea en build time) y hacía que el navegador
     intentara conectar directo a un puerto que ni siquiera está publicado en el compose base
     (solo en el overlay `dev`), en vez de la ruta relativa `/api/v1` que el código YA tenía como
     default correcto (`ui-kit/http/client.ts`, `configureApiClient` en `apps/web/src/main.tsx`).
     `apps/web/.env` (gitignored, archivo local) eliminado; agregado `server.proxy` en
     `apps/web/vite.config.ts` para que `pnpm nx serve web` suelto siga funcionando (mismo `/api`
     relativo, proxy target `localhost:3000` en dev en vez de nginx en Docker/K8s).
  2. **Un login con contraseña incorrecta mostraba "La sesión expiró" en vez del error real.**
     `ui-kit/http/client.ts`: el interceptor global de 401 (pensado para refrescar el token en un
     request YA autenticado que expiró) también capturaba el 401 de `POST /auth/login` en sí
     mismo, intentaba un refresh que nunca podía funcionar (no hay sesión previa) y pisaba el
     mensaje real del backend ("El usuario o la contraseña son incorrectos") con el genérico de
     sesión expirada. Corregido excluyendo también `/auth/login` de ese interceptor (mismo
     criterio que ya excluía `/auth/refresh`).
  3. **El refresh automático de token estaba silenciosamente roto.** La misma función leía
     `body.accessToken` de la respuesta de `POST /auth/refresh`, pero el endpoint real devuelve
     `{ data: { accessToken } }` (envuelto, ver `auth.controller.ts`) — `setAccessToken(undefined)`
     nunca lanzaba error, solo dejaba al usuario sin token válido en silencio. Nunca se había
     ejercitado este camino con un browser real antes de esta sesión. Corregido leyendo
     `body.data.accessToken`.
  4. **Cualquier recarga completa de página perdía la sesión, aunque la cookie httpOnly de refresh
     siguiera siendo válida.** El access token vive solo en memoria a propósito (nunca
     `localStorage`, por seguridad XSS — ver el comentario ya existente en `token-store.ts`, que
     literalmente documentaba la intención de un `initSession()` que "cada app consumidora llama
     al montar" — nunca se había escrito ni conectado). `RequireAuth`
     (`apps/web/src/app/require-auth.tsx`) decidía si redirigir a `/login` de forma síncrona, sin
     intentar restaurar la sesión primero — confirmado con Playwright real: navegar directo a una
     ruta protegida después de loguearse (`page.goto`, equivalente a un F5 o abrir un link
     guardado) volvía a `/login`. Corregido: nueva función `initSession()` en
     `ui-kit/http/client.ts` (intenta `/auth/refresh` una vez, sin disparar la notificación de
     "sesión expirada" — fallar acá es un estado normal para un visitante nuevo) + `RequireAuth`
     ahora la llama al montar y muestra un loader breve mientras se resuelve, antes de decidir si
     redirige.
     **Verificado real:** los 6 tests de `apps/web-e2e` (login inválido con el mensaje real, login
     válido → dashboard, navegación por sidebar, alta de usuario completa) pasan contra el stack
     completo (`https://localhost`).

- **FASE 05 — RLS: `gorazus_app` ya no es superusuario, RLS realmente enforced (2026-07-20).**
  Hallazgo crítico ya diagnosticado en `docs/database/SECURITY.md §2` (colisión entre el
  `POSTGRES_USER` de bootstrap de Docker y el rol de aplicación `gorazus_app`) — confirmado en
  runtime real que Postgres **rechaza** `ALTER ROLE gorazus_app NOSUPERUSER` in-place ("The
  bootstrap superuser must have the SUPERUSER attribute") — no hay forma de arreglarlo sin
  recrear el volumen. Ejecutado con confirmación explícita del usuario (acción destructiva sobre
  la base de datos de desarrollo):
  1. Renombrado el bootstrap de Docker a `gorazus_superuser` (`POSTGRES_USER` en `.env`/
     `.env.example`/`infra/docker/docker-compose.yml`) para que nunca vuelva a colisionar con
     `gorazus_app` en una instalación limpia futura.
  2. Volumen `postgres_data` recreado desde cero y los 34 scripts de `docs/database/sql/`
     reaplicados en orden — **primera vez que se hace un bootstrap realmente limpio de la base**,
     lo cual encontró 3 bugs reales adicionales, nunca detectados porque la base nunca se había
     reconstruido desde cero antes:
     - `29_partitioning.sql`: `CREATE EXTENSION pg_partman` sin `SCHEMA partman` cae en `public`
       — toda llamada `partman.create_parent(...)` fallaba con "schema partman does not exist".
       Corregido en el archivo (bug de sintaxis que nunca pudo haber funcionado, no drift de un
       entorno ya aplicado — no es reescribir historia).
     - `22_seed_data.sql`/`24_views.sql`/`28_materialized_views.sql`/`29_partitioning.sql` abortan
       a mitad de archivo (violación NOT NULL / columna ambigua / partición de `core.audit_logs`
       inexistente para el trigger de auditoría) — cada uno de estos ya tenía su corrección
       correcta escrita en `32_bugfixes.sql`/`33_partition_provisioning_completion.sql`
       (archivos append-only de sesiones anteriores), pero nunca se habían aplicado en un
       bootstrap real de punta a punta. Reejecutados en el orden correcto (colas de cada archivo
       completadas manualmente donde el abort cortó statements válidos posteriores).
  3. `docs/database/sql/34_rls_hardening.sql` (nuevo) aplicado con éxito esta vez:
     `ALTER ROLE gorazus_app NOSUPERUSER NOBYPASSRLS` + `FORCE ROW LEVEL SECURITY` en las ~500
     tablas reales. Verificado en runtime: `rolsuper=false, rolbypassrls=false` para `gorazus_app`;
     una consulta sin `set_config` a `core.users` ahora devuelve solo la fila del tenant
     sentinela (1 fila), no todas — antes, como superusuario, veía todo sin restricción.
  4. **Efecto colateral real, ya predicho por el propio diagnóstico:** con RLS genuinely enforced,
     dos scripts que consultaban `core.users` sin fijar contexto de tenant dejaron de encontrar
     filas de tenants reales (RLS filtra en silencio, no es un error de permisos) —
     `modules/seguridad/backend/scripts/seed-rbac.ts` (ahora requiere `<slug-tenant>` como primer
     argumento, resuelve el tenant vía la policy `tenant_lookup_by_slug` ya existente antes de
     `set_config`) y `modules/seguridad/backend/controllers/roles.controller.e2e-spec.ts` (mismo
     patrón). Verificado real: los 30 tests (`auth-backend` 17 + `seguridad-backend` 13) pasan de
     nuevo, incluido un login real de punta a punta contra la base con RLS genuinely forzado.

- **FASE 05 — Enterprise Release: `nx build`/imagen Docker de producción, completamente rotos,
  ahora reales y verificados de punta a punta (2026-07-20).** Cadena de 7 bugs reales, cada uno
  descubierto porque, por primera vez esta sesión, alguien realmente construyó y **corrió** la
  imagen Docker de producción en vez de solo tipar o correr vía `ts-node` local — el mismo patrón
  que ya se repitió varias veces antes (Paso 3, Auth, FormField): "recién se prueba de verdad, recién
  aparecen los bugs reales".
  1. **`nx build` (TS6059, rootDir) — root-caused de verdad.** El ejecutor `@nx/js:tsc` fuerza el
     `rootDir` de cada proyecto a su propia carpeta, ignorando cualquier `rootDir` explícito en su
     `tsconfig.json` — confirmado corriendo `tsc -p` en crudo (mismo tsconfig) con éxito mientras
     `nx build` fallaba. Cualquier importación cruzada de paquete (`@gorazus/contracts`,
     `@gorazus/core-*`) queda "fuera" de ese rootDir. Un intento con TS Project References
     (`composite`+`references`) tampoco funcionó bajo `@nx/js:tsc` (produce `TS6307` en vez de
     resolverlo — limitación conocida de este ejecutor, no compatible con project references).
     **Fix real:** `rootDir` apuntando a la raíz del repo en cada `tsconfig.json` con imports
     cruzados (`core/database`, `core/http`, `core/kernel`, `core/health`, `core/messaging`,
     `core/notifications`, `modules/auth/backend`, `modules/seguridad/backend`, `apps/api`) +
     cambiar sus targets `build` de `@nx/js:tsc` a `nx:run-commands` invocando `tsc -p` directo
     (bypass del ejecutor roto). `packages/contracts` no tenía `project.json` — no era un proyecto
     Nx real, nunca entraba al grafo de dependencias; se le agregó uno.
  2. **`nx build web` — `@nx/vite:build` nunca estuvo instalado** (`@nx/vite` faltaba en
     `devDependencies`) y, una vez instalado, su wrapper fallaba con `TS2688` (no encuentra
     `vite/client`) aunque `vite build` corrido directo compila perfecto. Cambiado el target
     `build` de `apps/web` a `nx:run-commands` invocando `vite build` directo.
  3. **La imagen Docker de producción no podía ejecutar el `dist/apps/api` compilado.** pnpm usa
     `node_modules` estricto por paquete (nunca hoisted a la raíz) — confirmado que
     `node_modules/@gorazus/*` NO existe en la raíz del repo, solo dentro de `apps/api/node_modules/`
     y análogos. El `dist/apps/api` compilado, al vivir en un árbol separado, nunca podía resolver
     esos paquetes bajo `node` plano (`MODULE_NOT_FOUND` real). Sumado a que cada paquete
     `@gorazus/*` apunta `"main"` a su `.ts` fuente (convención ya fijada para `ts-node` en
     desarrollo) — ni siquiera copiando `node_modules` a mano se resolvía. **Decisión:** la etapa
     `production` del Dockerfile corre con el mismo mecanismo ya probado en desarrollo
     (`ts-node --transpile-only apps/api/src/main.ts`) en vez de inventar una segunda forma de
     ejecutar la app — `nx build` queda como gate de tipos real dentro de la imagen (`tsc --noEmit`),
     no como el artefacto que se ejecuta. Costo aceptado: imagen más grande (no se usa `--prod` en
     el install final, ver punto 4).
  4. `NODE_ENV=production` antes de `pnpm install` salta `devDependencies` — pero `ts-node`/
     `typescript` (necesarios en runtime por la decisión del punto 3) vivían ahí. Movidos a
     `dependencies` reales.
  5. El script `prepare: "husky"` fallaba (`husky: not found`) apenas se saltean devDependencies —
     cualquier `pnpm install` en modo producción rompía. Cambiado a `"husky || true"`.
  6. **El cliente Prisma generado esta sesión (Windows) no tenía motor para Linux** — la imagen
     fallaba con `PrismaClientInitializationError: ... runtime "linux-musl"`. Se agregó
     `binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]` a los 21
     `schema.prisma` (+ al template maestro) y se regeneraron los 21 clientes.
  7. Con el motor Linux presente, Alpine (`node:20-alpine`) no tiene `libssl` instalada — Prisma
     detectaba mal la versión de OpenSSL y cargaba el binario equivocado. Agregado
     `RUN apk add --no-cache openssl` a la imagen base.
  8. **Bug adicional, encontrado recién al probar la imagen contra Postgres/Redis/RabbitMQ reales:**
     `/health/live` y `/health/ready` devolvían 401 — el `JwtAuthGuard` global
     (`core/http/http.module.ts`) cubría esas rutas por defecto, sin `@Public()`. El kubelet que
     hace el liveness/readiness probe no tiene (ni puede tener) un JWT — sin este fix, ningún pod
     de Kubernetes pasaría nunca el probe. Corregido en `core/health/health.controller.ts`.
     **Verificación real, no solo tipos:** imagen `gorazus/api:test` construida y corrida como
     contenedor real contra Postgres/Redis/RabbitMQ ya vivos (red `docker_gorazus`) — arrancó,
     inicializó los 20 módulos, mapeó todas las rutas, y `GET /api/v1/health/live` /
     `/health/ready` devolvieron `200 {"status":"ok"}`. Los 30 tests existentes (`auth-backend` +
     `seguridad-backend`) siguen pasando después de todos estos cambios. `nx build web` produce un
     `dist/apps/web` real (mismo warning de bundle >500kB ya conocido, sin cambios).

- **`core/database` — 4 bugs preexistentes, ninguno detectado hasta este primer repositorio
  concreto real (Paso 3):**
  1. `BaseRepository`/`base.repository.spec.ts` usaban `deletedAt` (camelCase) para el filtro de
     borrado lógico; todo cliente Prisma generado real usa `deleted_at` (snake_case, sin `@map` en
     ningún `schema.prisma`) — habría sido un error de compilación en cualquier repositorio real.
  2. El constraint genérico `TClient extends { $transaction: <R>(fn...) => Promise<R> }` de
     `BaseRepository`/`withTenantScope` no es asignable de forma confiable contra el `$transaction`
     real de un `PrismaClient` (sobrecargado: forma array-de-promesas + forma callback) — TypeScript
     no compara bien funciones sobrecargadas contra un constraint de firma única. Se relajó a
     `{ $transaction: unknown }` con cast interno.
  3. Ese mismo cast, en un primer intento, extrajo `$transaction` como referencia suelta
     (`const t = client.$transaction`), perdiendo el `this` interno del cliente al invocarlo — todas
     las operaciones fallaban en runtime (`Cannot read properties of undefined`). Corregido
     re-tipando el objeto completo en vez de extraer el método.
  4. `package.json` de `core-database` apuntaba `main`/`types` a `./src/index.js` (compilado) —
     único paquete del monorepo que no seguía la convención ya establecida en los otros 11 paquetes
     (`main`/`types` → `.ts` fuente directa, pensada para correr sin paso de build previo). Alineado
     al mismo patrón.
- **Testing Framework — gap sistémico en los 11 paquetes `core/*`:** todos apuntaban `ts-jest` a
  `tsconfig.json`, que excluye `**/*.spec.ts` y no incluye tipos de `jest` — ningún archivo de test
  que existiera podía ejecutarse realmente (`Cannot find name 'it'/'expect'`), incluyendo
  `base.repository.spec.ts`, que nunca corrió hasta ahora. Es el mecanismo concreto detrás de "Sin
  tests unitarios reales todavía" (ver "Pendiente conocido"). Corregido con un `tsconfig.spec.json`
  por paquete (`types: ["node","jest"]`, sin exclude) y su `jest.config.ts` apuntando ahí — los 11
  paquetes existentes más los 2 nuevos de `modules/auth/backend`.
- `core/http/guards/jwt-auth.guard.ts`: faltaba `override` en `canActivate` — `apps/api` nunca había
  compilado realmente contra `noImplicitOverride` hasta este `tsc` (primera vez que se compiló
  `apps/api` completo con sus módulos de negocio reales).

- 27 tablas particionadas del SQL oficial con PK/UNIQUE sin la columna de partición (violaba una restricción real de PostgreSQL) — corregido con autorización explícita, sin cambiar el modelo de datos, solo la forma de las constraints.
- 28 foreign keys que quedaron rotas como efecto de la corrección anterior — resueltas quitando el `REFERENCES` (mismo patrón "ID suelto" que el proyecto ya usa entre schemas de módulos distintos).
- Bloqueo de escala de `prisma generate` (cliente monolítico de 500 modelos colgaba indefinidamente) — resuelto con 21 clientes por schema.
- Regla de fronteras de Nx incompleta (`type:core` no se permitía depender de otro `type:core`).
- Varios desalineamientos de versión entre paquetes relacionados de una misma librería (OpenTelemetry `sdk-metrics`/`exporter-prometheus`, `@nestjs/schedule`/`cron`) — cada uno detectado corriendo el build real, no solo leyendo código.
- Dependencias declaradas sin uso (`@gorazus/core-config` en 4 paquetes que en realidad importan `ConfigService` directo de `@nestjs/config`).
- **(PHASE 01, 2026-07-18)** Los 3 gaps de abajo, resueltos sin editar ningún archivo SQL existente (`docs/database/sql/31_missing_fk_indexes.sql`, `32_bugfixes.sql`, `33_partition_provisioning_completion.sql`):
  - Particionamiento: causa raíz de 3 capas (imagen sin `pg_partman`, extensión instalada en schema equivocado, 6 de 27 tablas nunca incluidas en `29_partitioning.sql`) — las 3 corregidas, 0 de 27 tablas sin particiones reales (antes: 27 de 27).
  - Vista `accounting.v_treasury_position` — recreada con columnas calificadas.
  - Seed de `products.product_attributes` — `company_id` ahora nullable (alineado al patrón universal ya documentado) + seed completado.
- 575 índices B-tree agregados en columnas FK de negocio sin índice de soporte (`31_missing_fk_indexes.sql`) — ver `docs/database/INDEX_CATALOG.md §3`.

### Pendiente conocido

- `dist/*/package.json` de los paquetes `core/*` conserva `"main": "./index.ts"` en vez de `.js` — warning cosmético, Node lo resuelve igual por fallback, no bloqueante.
- ~~Puerto de métricas (9464) no expuesto en `docker-compose.dev.yml`~~ — **resuelto FASE 05**.
- Sin tests unitarios reales todavía (Fase 6 del plan de Foundation Platform, Testing Framework).
- 🟠 **(Nuevo, FASE 05, 2026-07-20)** `pnpm audit` (ahora corriendo de verdad en
  `.github/workflows/security.yml`, no bloqueante todavía — `|| true`) encuentra **34
  vulnerabilidades reales: 1 crítica, 15 altas, 18 moderadas**, todas en dependencias transitivas
  de tooling/observabilidad (no runtime de negocio directo): Vitest UI server (crítica, solo
  explotable si alguien expone `vitest --ui`, nada en el proyecto lo hace), ReDoS en
  minimatch/picomatch (glob interno de Nx/build tooling), Multer (usado por
  `@nestjs/platform-express`, sin endpoint de upload real todavía), `@opentelemetry/exporter-prometheus`
  (crash por HTTP malformado — **relevante**, es el mismo exporter que expone `/metrics` desde
  FASE 05), js-yaml (usado por `@nestjs/swagger`). No se parchearon acá — la mayoría requiere saltos
  de versión grandes (p. ej. `@opentelemetry/exporter-prometheus` 0.55.0 → 0.220.0, ~165 versiones)
  que arriesgan romper funcionalidad recién verificada esta sesión sin tiempo de regresión
  dedicado. Pendiente: pase de remediación dedicado, empezando por el exporter de Prometheus
  (mayor superficie real de exposición, corre en producción).
- 🟡 **(Nuevo, FASE 05, 2026-07-20)** Testing de carga (`infra/k6/load.js`) encontró que el rate
  limiter global (`core/http/http.module.ts`, 100 requests/60s **por IP**, sin diferenciar por
  usuario autenticado ni por endpoint) devuelve `429` masivamente ante tráfico sostenido desde un
  mismo origen — comportamiento correcto y esperado, pero cualquier grupo real de usuarios detrás
  de un NAT/proxy compartido lo alcanzaría igual. No corregido (cambiar la política de rate
  limiting es una decisión de producto/seguridad, no un ajuste unilateral). Ver `infra/k6/README.md`.
- 🟠 **(Nuevo, PHASE 01)** 185 Foreign Keys reales cruzan schemas de módulos de negocio distintos, contradiciendo la regla de arquitectura ya documentada ("solo IDs sueltos, nunca FK real entre módulos") — no corregido, requiere ADR y decisión de negocio sobre qué reemplaza la integridad referencial que hoy proveen. Ver `docs/database/FOREIGN_KEYS.md §3`.
- 🟡 **(Nuevo, PHASE 01)** `core.restore_test_logs` es la única de 501 tablas sin RLS habilitado — plausiblemente intencional (tabla de infraestructura de backup), no confirmado. Ver `docs/database/SECURITY.md §1`.
- 🟡 **(Actualizado)** `POST /auth/login`/`/auth/refresh` ya existen y están verificados (ver
  "Añadido" arriba, sesión 2026-07-20); `/auth/switch-context` (cambio de empresa/sucursal activa)
  sigue siendo un contrato asumido por el frontend (`ui-kit/store/app.store.ts`), sin endpoint real
  todavía.
- 🟡 **(Nuevo, FASE 2 Backend Core, 2026-07-22)** Sin patrón compartido de sort/filter/search para
  listados — cada controller (`auditoria`, `configuracion`, etc.) reinventa su propio filtro ad hoc
  vía query params; funciona hoy, pero se va a fragmentar más con cada uno de los 24 módulos de
  negocio que todavía no tienen backend. Un DTO/decorator reusable en `core/http` es trabajo de una
  sesión propia, no se improvisó acá para no imponerle una forma a controllers que ya funcionan.
- 🟡 **(Nuevo, FASE 2 Backend Core, 2026-07-22)** `modules/almacenes`/`inventario` sigue sin una sola
  línea de backend (carpetas vacías) — coincide con el orden de construcción ya confirmado
  (Productos → Inventario → Clientes → Ventas → Caja → POS, ver `ROADMAP.md` §5), no se adelantó acá
  para no salirse de ese orden ya decidido.
- 🟡 **(Nuevo, FASE 2 Backend Core, 2026-07-22)** `core/storage`/`core/messaging`/`core/scheduler`
  ahora tienen (storage) o siguen sin tener (messaging, scheduler) un consumidor real más allá de lo
  agregado esta sesión — ningún módulo de negocio asocia todavía un archivo subido a uno de sus
  propios registros (esperado: guardar la `key` en la columna `metadata JSONB` de ese registro), y
  `EventBusService`/`SchedulerService.addCronJob` siguen sin ningún productor/consumidor/job real
  registrado. Es trabajo de cada módulo de negocio cuando se construya, no de esta fase.
- 🟡 **(Nuevo, frontend)** `I18nProvider` (`react-i18next`) y `RequirePermission`/
  `usePermiso()` — ambos documentados en `docs/frontend/ROUTING.md §5.2,§6` — no están
  construidos: `react-i18next` no es dependencia de ningún `package.json` todavía, y la
  resolución de permisos depende de `modules/seguridad/backend` (vacío). El sidebar
  (`apps/web/src/app/app-shell/sidebar.tsx`) por ahora lista las 25 features sin ocultar
  ninguna por permiso.
- 🟡 **(Nuevo, frontend)** Selector de Empresa/Sucursal activa (topbar) no implementado —
  no hay endpoint de listado de empresas/sucursales todavía; `switchCompanyContext` del
  store existe pero nada lo invoca desde la UI.
- 🟡 **(Nuevo, frontend, 2026-07-20)** El bundle principal de `apps/web` supera los 500kB
  minificados (`vite build` lo advierte) — probablemente Recharts/`react-day-picker` no se están
  code-splitteando por no estar consumidos todavía por ninguna página lazy-loaded real (ver
  `docs/frontend/PERFORMANCE.md` para el mecanismo ya documentado de `React.lazy()` por página).
  No corregido — revisar cuando el primer módulo con gráficos reales exista.
- 🟡 **(Nuevo, testing, 2026-07-20)** Los nuevos tests de integración (`*.e2e-spec.ts`) corren
  contra el mismo Postgres de desarrollo (con el tenant/usuario de `seed-rbac.ts`), no contra una
  base de datos de test aislada/efímera — no ejecutar en CI todavía sin antes levantar esa
  infraestructura. `apps/api-e2e` (el proyecto Nx pensado para esto) sigue vacío; los tests viven
  colocados junto a cada controller por ahora. Además, cada suite deja un warning de Jest
  ("worker process failed to exit gracefully") — probablemente conexiones de Prisma/Redis/RabbitMQ
  no cerradas del todo en el ciclo de vida de `TestingModule`; los tests pasan igual, no bloqueante.
- ~~🟠 `nx build api` falla con `TS6059 rootDir`~~ — **resuelto FASE 05 (2026-07-20)**, ver
  "Corregido" arriba (rootDir a la raíz del repo + `nx:run-commands` en vez de `@nx/js:tsc`).
- ~~🟠 `gorazus_app` superusuario, RLS no aísla nada~~ — **resuelto FASE 05 (2026-07-20)**, ver
  "Corregido" arriba (volumen recreado con bootstrap renombrado + `34_rls_hardening.sql`).
- 🟡 **(Nuevo, FASE 04, 2026-07-20)** `core/notifications` (Notification Center) es
  deliberadamente Fase 1 — quedan pendientes, documentados en el propio código: `Template Engine`
  y `Language Manager` (ninguno existe en `core/` — `NotificationCenterService.send()` recibe texto
  ya resuelto, sin variables ni plantillas pre-aprobadas de Meta), envío vía `Background Jobs`
  (`core/scheduler` existe pero no está integrado — el envío hoy es síncrono), reintento con
  backoff, rotación de claves multi-`keyId` (el cifrado ya soporta `keyId`, pero solo hay una
  clave activa vía `NOTIFICATIONS_ENCRYPTION_KEY`), canales SMS/email/push/in-app (solo WhatsApp
  tiene adaptador), y el cruce con `crm.whatsapp_logs` que describe
  `32-core-platform/06-eventos-y-mensajeria.md §4.1` (depende de `modules/crm/backend`, sin
  construir). No hay UI de administración para cargar credenciales — usar
  `WhatsAppCredentialsService.saveCredentials()` directamente o un script operativo.
- 🟡 **(Nuevo, FASE 04, 2026-07-20)** `core/ollama` es solo el cliente genérico (ver "Añadido" arriba)
  — ningún asistente especializado (Ventas/Compras/Inventario/Contabilidad/CRM/Reportes),
  predicción, alerta o automatización tiene diseño ni código todavía. Tampoco hay ningún modelo
  descargado en el contenedor `ollama` (`ollama pull <modelo>` es un paso operativo manual, no
  automatizado) — `OllamaService` fallará en runtime hasta que exista al menos un modelo. Mismo
  criterio de gobernanza que el resto de FASE 04: no diseñar asistentes sin necesidad de negocio
  confirmada.
