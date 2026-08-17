# Base de Datos CRM — Informe de Completado (Parte 02)

> Responde al pedido "Design and implement the complete CRM database". La
> auditoría contra `information_schema` (antes de escribir una sola línea
> de SQL) encontró que la enorme mayoría de lo pedido **ya existía**,
> certificado como parte de Database Enterprise v1.1.0 — este informe deja
> explícito qué se reutilizó tal cual y qué se cerró como brecha real, para
> que quede claro que no se reconstruyó nada desde cero.

## 1. Los 19 requisitos pedidos, uno por uno

| #   | Requisito pedido      | Estado antes de esta fase                                                         | Acción tomada                                                                                                                                               |
| --- | --------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customers             | `customers.customers` (ya existía, 1 de 20 tablas con código de aplicación real)  | Ninguna — reutilizado                                                                                                                                       |
| 2   | Customer contacts     | `customers.customer_contacts`                                                     | Ninguna — reutilizado                                                                                                                                       |
| 3   | Multiple addresses    | `customers.customer_addresses` (`address_type`, `is_default`)                     | Ninguna — reutilizado                                                                                                                                       |
| 4   | Customer categories   | `customers.customer_categories`                                                   | Ninguna — reutilizado                                                                                                                                       |
| 5   | Customer tags         | `core.entity_tags` + `core.tags` (mecanismo polimórfico genérico)                 | Ninguna — reutilizado, sin tabla nueva                                                                                                                      |
| 6   | Customer groups       | `customer_categories` + `customer_classifications` (dos taxonomías ya existentes) | Ninguna — considerado suficiente, ver §3                                                                                                                    |
| 7   | Sales representatives | `sales.salespeople` (schema `sales`, referenciado como ID suelto)                 | Ninguna — reutilizado                                                                                                                                       |
| 8   | Credit limits         | `customers.customer_credit_profiles` + `customer_credit_limit_history`            | Ninguna — reutilizado                                                                                                                                       |
| 9   | Payment terms         | `customer_credit_profiles.payment_terms_days`                                     | Ninguna — reutilizado                                                                                                                                       |
| 10  | Price lists           | `customers.customer_price_lists` (vínculo a `configuration`)                      | Ninguna — reutilizado                                                                                                                                       |
| 11  | Customer documents    | `core.documents` + `core.files` (mecanismo genérico, `source_module='customers'`) | Ninguna — reutilizado, sin tabla nueva                                                                                                                      |
| 12  | Customer activities   | `crm.call_logs`/`email_logs`/`whatsapp_logs` — **ya tenían `customer_id`**        | Ninguna — reutilizado                                                                                                                                       |
| 13  | Customer notes        | No existía (`observations` es un único campo, no una lista fechada)               | **Tabla nueva**: `customers.customer_notes`                                                                                                                 |
| 14  | Customer reminders    | `crm.follow_up_activities` existía pero solo con `lead_id`/`opportunity_id`       | **Columna nueva**: `follow_up_activities.customer_id`                                                                                                       |
| 15  | Customer timeline     | No existía como estructura consolidada                                            | **Vista nueva**: `customers.v_customer_timeline` (agrega lo ya existente, no duplica datos)                                                                 |
| 16  | Customer history      | `customer_credit_limit_history`, `customer_block_history`, `customer_statements`  | Ninguna — reutilizado (3 tablas de historial ya cubrían distintos aspectos)                                                                                 |
| 17  | Customer attachments  | `core.documents` + `core.files` (mismo mecanismo que "documents")                 | Ninguna — reutilizado                                                                                                                                       |
| 18  | Customer status       | `customers.is_blocked`/`block_reason` + `customer_block_history`                  | Ninguna — reutilizado                                                                                                                                       |
| 19  | Customer ratings      | No existía (sí el análogo de proveedores, `supplier_evaluation_scores`)           | **Tabla nueva**: `customers.customer_ratings` (versión simplificada, sin el andamiaje de criterios que sí tiene el de proveedores — no pedido, no agregado) |

**Resultado: 16 de 19 requisitos ya estaban completamente resueltos. 3
brechas reales, cerradas con una migración aditiva de 4 cambios de
schema.**

## 2. Requisitos técnicos transversales — verificados, no repetidos

| Requisito              | Cumplimiento                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normalización adecuada | Heredado — el modelo de `customers`/`crm` ya está certificado 94/100 en `DATABASE_CERTIFICATION.md`; las 3 adiciones siguen la misma 3FN (sin repetir columnas, un concepto por tabla)                                                                                                                                                 |
| Foreign keys           | `customer_notes.customer_id`/`customer_ratings.customer_id` → FK real dentro del mismo schema (`customers.customers.id`). `follow_up_activities.customer_id` → ID suelto (cross-schema `crm`→`customers`), mismo patrón ya usado por `call_logs`/`email_logs`/`whatsapp_logs` del mismo schema — consistencia, no inconsistencia nueva |
| Índices                | `idx_customers_customer_notes_customer`, `idx_customers_customer_notes_pinned` (parcial), `idx_customers_customer_ratings_customer`, `idx_crm_follow_up_activities_customer` (parcial, solo filas con `customer_id` no nulo)                                                                                                           |
| Constraints            | `customer_ratings.score CHECK (0-10)`, `customer_ratings.rating_type CHECK IN (...)`                                                                                                                                                                                                                                                   |
| Campos de auditoría    | Las 18 columnas universales del proyecto (`tenant_id`…`metadata`) en las 2 tablas nuevas — sin excepción, mismo patrón que las 501 tablas preexistentes                                                                                                                                                                                |
| Soporte UUID           | `gen_random_uuid()` como PK en ambas tablas nuevas — igual que el resto del proyecto                                                                                                                                                                                                                                                   |
| Soft delete            | `deleted_at`/`deleted_by`/`is_deleted` en ambas tablas nuevas                                                                                                                                                                                                                                                                          |
| Multi-empresa          | `company_id NOT NULL` en ambas                                                                                                                                                                                                                                                                                                         |
| Multi-sucursal         | `branch_id` (nullable, igual que el resto de `customers`) en ambas                                                                                                                                                                                                                                                                     |

## 3. Decisión explícita: "Customer groups" no es una tabla nueva

El pedido lista "Customer categories" y "Customer groups" como dos ítems
separados. El schema `customers` ya tiene **dos** dimensiones de
clasificación (`customer_categories`, `customer_classifications`) más
`core.entity_tags` para etiquetado libre — tres mecanismos de agrupación ya
disponibles. Agregar una cuarta tabla `customer_groups` sin una diferencia
estructural real frente a las que ya existen sería la complejidad
redundante que el criterio general del proyecto pide evitar. Si en el
futuro "grupo" necesita significar algo estructuralmente distinto (p. ej.
membresía muchos-a-muchos con reglas de pertenencia dinámica, a diferencia
de una clasificación de valor único), es un caso de uso nuevo a especificar,
no algo que se pueda inferir de la lista del pedido.

## 4. Migración ejecutada

`docs/database/sql/36_crm_customer_completion.sql` — ejecutada y verificada
contra PostgreSQL 17.10 real (`docker-postgres-1`, base `gorazus`):

1. `ALTER TABLE crm.follow_up_activities ADD COLUMN customer_id UUID` + índice parcial.
2. `CREATE TABLE customers.customer_notes` (BaseEntity completo + 4 columnas propias).
3. `CREATE TABLE customers.customer_ratings` (BaseEntity completo + 5 columnas propias).
4. `CREATE VIEW customers.v_customer_timeline` (agrega 8 fuentes ya existentes, sin duplicar datos).
5. RLS (`ENABLE`/`FORCE ROW LEVEL SECURITY` + policy `tenant_isolation`) y triggers de auditoría (`trg_set_audit_fields`/`trg_audit_log`) aplicados explícitamente a las 2 tablas nuevas.
6. `GRANT` a `gorazus_app`/`gorazus_readonly`/`gorazus_migrator` sobre los 3 objetos nuevos.
7. Bloque de verificación (`RAISE EXCEPTION` si falta algo) — terminó con `NOTICE: 36_crm_customer_completion: OK`.

**Bug sistémico encontrado y corregido durante la ejecución** (no de la
migración en sí, de todo el proyecto): ninguna tabla creada después de
`sql/30_backup_restore.sql` hereda el `GRANT` masivo por schema — no hay
`ALTER DEFAULT PRIVILEGES` configurado en ningún schema. Sin `GRANT`
explícito, Prisma no puede introspectar la tabla y el modelo desaparece de
`schema.prisma` (una funcionalidad ya commiteada que se pierde en
silencio). Se corrigió con `GRANT` explícito en **4 tablas** (§6 de la
migración): las 2 nuevas de esta fase, más **2 preexistentes de la
migración 35** que tenían el mismo bug sin detectar hasta ahora
(`suppliers.supplier_contracts`, `products.product_physical_attributes`).
`core.restore_test_logs` tiene el mismo síntoma pero no se tocó — ya
documentado como exclusión intencional (tabla operativa de simulacros de
restauración/DR). Ver `TECHNICAL_DEBT.md §0.5`.

## 5. Entity models (Prisma) — regenerados y verificados

`pnpm db:pull` → `db:split` → `db:generate` (pipeline establecido del
proyecto, ver `core/database/scripts/`) ejecutado de punta a punta sin
errores:

- `customers`: 18 → **20 modelos** (+ `customer_notes`, `customer_ratings`).
- `crm`: 17 modelos, sin cambio de cantidad (`follow_up_activities` gana 1 campo).
- Cliente Prisma generado y verificado en
  `core/database/prisma/schemas/customers/generated/` y
  `core/database/prisma/schemas/crm/generated/`.
- **Nota de proceso**: en el primer `db:pull`, ambas tablas nuevas
  aparecieron comentadas en `schema.prisma` ("could not retrieve columns...
  missing rights") — exactamente el síntoma del bug de `GRANT` de §4;
  se resolvió aplicando los `GRANT` faltantes y repitiendo el pull, no
  cambiando nada del modelo de datos en sí.

## 6. Relaciones y diagrama ER

Ver [`CRM_DATABASE_ER_DIAGRAM.md`](./CRM_DATABASE_ER_DIAGRAM.md) —
diagrama Mermaid completo de `customers` (20 tablas + 1 vista) y `crm` (17
tablas), con las relaciones reales (FK dentro de schema, ID suelto entre
schemas) y una tabla explícita de qué NO se modeló como tabla nueva y por
qué.

## 7. Documentación actualizada

- `docs/database/dictionary/03-customers.md` — 2 tablas + 1 vista nuevas agregadas.
- `docs/database/dictionary/13-crm.md` — 1 columna nueva agregada.
- `docs/reports/crm/CRM_ARCHITECTURE.md` — sin cambios de fondo (la arquitectura de código diseñada en Parte 01 ya prevía estos repositorios/servicios sobre el schema real; ahora el schema los respalda por completo).
- `VERSION.md` — nueva entrada Database Enterprise v1.2.0.
- `CHANGELOG.md`, `TECHNICAL_DEBT.md` — entradas de esta fase.

## 8. Recomendación

**Lista para la Parte 02 del roadmap de código** (`CRM_ROADMAP.md`) —
ningún gap de schema bloquea ya el desarrollo de `LeadsService`/
`OportunidadesService` ni de un futuro `ClientesService` extendido con
notas/calificaciones/timeline. El único pendiente externo real (extensión
de `core/notifications` para destinatarios externos) sigue sin relación con
esta fase de base de datos.
