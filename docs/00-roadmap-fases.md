# 00 — Roadmap de fases del proyecto GORAZUS

> Versión 1.0 — 2026-07-13. Complementa a
> [00-indice-maestro.md](./00-indice-maestro.md), no lo duplica: el
> índice maestro responde _"¿qué documentación existe?"_; este
> documento responde _"¿en qué orden se construye, y en qué estado
> está cada fase?"_. Las 32 fases y su numeración fueron propuestas
> por el usuario; el estado de cada una se completó verificando contra
> los documentos y el código real ya existentes.

## Estado de implementación (código, distinto de la tabla de documentación de abajo)

Esta tabla mide **documentación de arquitectura**, no código. Desactualizada desde FASE 01-05
(2026-07-20) — para el estado real de código más actual, ver `CHANGELOG.md` (secciones "Añadido"/
"Pendiente conocido", la fuente que más se actualiza) y `docs/manuals/TECNICO.md §3`/
`docs/manuals/CHECKLIST_PRODUCCION.md`. Resumen honesto al 2026-07-20:

| Pieza                                                                                                                          | Estado                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                                                  | ✅                                                                                                                      |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki, backup automático) | ✅ — verificado de punta a punta, HTTPS incluido                                                                        |
| Kubernetes (staging/production)                                                                                                | 🟡 manifiestos construidos y validados sintácticamente, sin cluster real para probar — ver `infra/kubernetes/README.md` |
| Foundation Platform (`core/*`, 14 paquetes incl. `notifications`/`ollama`)                                                     | ✅ — validado con servidor real corriendo, endpoints probados                                                           |
| Persistencia (`core/database`)                                                                                                 | ✅ — 21 clientes Prisma, RLS genuinely enforced (corregido FASE 05)                                                     |
| Módulos de negocio (`modules/*`)                                                                                               | 🟡 2 de 27 con backend+frontend real (`auth`, `seguridad`) — el resto sigue escafoldado sin implementar                 |
| Frontend (`apps/web`, `ui-kit`)                                                                                                | 🟡 Design system completo, 2/27 módulos con pantallas reales, resto con placeholder honesto                             |
| Testing (unitario/integración/e2e/carga/seguridad)                                                                             | ✅ — 36 tests backend + 6 Playwright reales + k6 + CodeQL/`pnpm audit`, todos corriendo contra infraestructura real     |

## Estado por fase (documentación de arquitectura)

| Fase | Nombre                                  | Estado                                      | Documento(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | --------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | Arquitectura Enterprise                 | ✅ Completo                                 | [architecture/00-arquitectura-general.md](./architecture/00-arquitectura-general.md) + 01-11                                                                                                                                                                                                                                                                                                                                                                    |
| 02   | Base de Datos                           | ✅ Completo                                 | [database/00-modelo-general.md](./database/00-modelo-general.md) + 01-11 + `sql/` (498 tablas)                                                                                                                                                                                                                                                                                                                                                                  |
| 03   | Servidor Backend                        | ✅ Completo                                 | [architecture/12-backend-enterprise.md](./architecture/12-backend-enterprise.md) (incluye API: [architecture/30-api-completa.md](./architecture/30-api-completa.md))                                                                                                                                                                                                                                                                                            |
| 04   | Sistema IAM (Usuarios, Roles, Permisos) | ✅ Completo                                 | [architecture/13-modulo-auth.md](./architecture/13-modulo-auth.md) + [architecture/15-modulo-security.md](./architecture/15-modulo-security.md)                                                                                                                                                                                                                                                                                                                 |
| 05   | Core                                    | ✅ Completo                                 | [architecture/14-modulo-core.md](./architecture/14-modulo-core.md)                                                                                                                                                                                                                                                                                                                                                                                              |
| 06   | Clientes                                | ✅ Completo                                 | [architecture/16-modulo-customers.md](./architecture/16-modulo-customers.md)                                                                                                                                                                                                                                                                                                                                                                                    |
| 07   | Proveedores                             | ✅ Completo                                 | [architecture/17-modulo-suppliers.md](./architecture/17-modulo-suppliers.md)                                                                                                                                                                                                                                                                                                                                                                                    |
| 08   | Productos                               | ✅ Completo                                 | [architecture/18-modulo-products.md](./architecture/18-modulo-products.md)                                                                                                                                                                                                                                                                                                                                                                                      |
| 09   | Inventario                              | ✅ Completo                                 | [architecture/19-modulo-inventory.md](./architecture/19-modulo-inventory.md)                                                                                                                                                                                                                                                                                                                                                                                    |
| 10   | Ventas                                  | ✅ Completo                                 | [architecture/20-modulo-sales.md](./architecture/20-modulo-sales.md)                                                                                                                                                                                                                                                                                                                                                                                            |
| 11   | POS                                     | ✅ Completo (2026-07-13)                    | Dato: [20-modulo-sales.md §4](./architecture/20-modulo-sales.md#4-facturas-pos--no-es-tabla-propia-confirmado-en-el-schema-real). UI/hardware/offline: [architecture/45-modulo-pos-frontend.md](./architecture/45-modulo-pos-frontend.md) — cierra los 3 puntos que faltaban (impresora fiscal, lector de código de barras, tolerancia a desconexión)                                                                                                           |
| 12   | Compras                                 | ✅ Completo                                 | [architecture/21-modulo-purchases.md](./architecture/21-modulo-purchases.md)                                                                                                                                                                                                                                                                                                                                                                                    |
| 13   | Caja                                    | ✅ Completo                                 | [architecture/23-modulo-cash.md](./architecture/23-modulo-cash.md)                                                                                                                                                                                                                                                                                                                                                                                              |
| 14   | Bancos                                  | ✅ Completo                                 | [architecture/24-modulo-banking.md](./architecture/24-modulo-banking.md)                                                                                                                                                                                                                                                                                                                                                                                        |
| 15   | Contabilidad                            | ✅ Completo                                 | [architecture/22-modulo-accounting.md](./architecture/22-modulo-accounting.md)                                                                                                                                                                                                                                                                                                                                                                                  |
| 16   | Impuestos                               | ✅ Completo (2026-07-13)                    | [architecture/46-modulo-taxes.md](./architecture/46-modulo-taxes.md) — último módulo de negocio pendiente con modelo de datos completo, era el más urgente por referencias cruzadas                                                                                                                                                                                                                                                                             |
| 17   | CRM                                     | ✅ Completo                                 | [architecture/27-modulo-crm.md](./architecture/27-modulo-crm.md)                                                                                                                                                                                                                                                                                                                                                                                                |
| 18   | RRHH                                    | ✅ Completo                                 | [architecture/25-modulo-hr.md](./architecture/25-modulo-hr.md)                                                                                                                                                                                                                                                                                                                                                                                                  |
| 19   | Nómina                                  | ✅ Completo                                 | [architecture/26-modulo-payroll.md](./architecture/26-modulo-payroll.md)                                                                                                                                                                                                                                                                                                                                                                                        |
| 20   | Producción                              | ✅ Completo                                 | [architecture/38-modulo-production.md](./architecture/38-modulo-production.md) (base) + **Routing/Centro de Trabajo/MRP/MRP II/APS, antes explícitamente fuera de alcance, diseñados en [architecture/48-erp-enterprise-readiness.md §6](./architecture/48-erp-enterprise-readiness.md#6-mrp-mrp-ii-aps) (2026-07-21, Fase 5 del usuario — confirmación de necesidad de negocio que faltaba)**                                                                  |
| 21   | Servicios                               | ✅ Completo                                 | [architecture/39-modulo-services.md](./architecture/39-modulo-services.md) — cierra el gap "equipos bajo servicio" señalado desde Activos Fijos (37)                                                                                                                                                                                                                                                                                                            |
| 22   | Activos Fijos                           | ✅ Completo                                 | [architecture/37-modulo-assets.md](./architecture/37-modulo-assets.md)                                                                                                                                                                                                                                                                                                                                                                                          |
| 23   | Proyectos                               | ✅ Completo                                 | [architecture/40-modulo-projects.md](./architecture/40-modulo-projects.md) — último de los 4 módulos pendientes de la Fase 6, ninguno de los ya completados le prometía nada (dependencia de una sola dirección)                                                                                                                                                                                                                                                |
| 24   | Reportes                                | ✅ Completo                                 | [architecture/28-modulo-reports-bi.md](./architecture/28-modulo-reports-bi.md)                                                                                                                                                                                                                                                                                                                                                                                  |
| 25   | Business Intelligence                   | ✅ Completo                                 | Mismo documento que Fase 24 — diseñados juntos por su relación directa, con la distinción entre ambos ya justificada                                                                                                                                                                                                                                                                                                                                            |
| 26   | Integraciones                           | ❌ Pendiente                                | Modelo de datos existe en `core` (`integrations`, `webhooks`, `edi_transactions`); mapea al módulo `administracion` del catálogo, no a un módulo `integraciones` separado — ver corrección en [architecture/04-catalogo-modulos-negocio.md](./architecture/04-catalogo-modulos-negocio.md)                                                                                                                                                                      |
| 27   | Inteligencia Artificial                 | ✅ Completo (2026-07-21)                    | **Actualizado** — la necesidad de negocio que faltaba quedó confirmada explícitamente (usuario, "Fase 4" de su propia secuencia): [architecture/47-modulo-ia.md](./architecture/47-modulo-ia.md). Diseño completo, sin código todavía — Prediction/Recommendation/Forecast Engine, ML Platform Core, RAG (`pgvector`), LLM Integration (Ollama/OpenAI/Claude/DeepSeek), AI Agents (nunca escritura directa, siempre vía Approval/Workflow Engine ya existentes) |
| 28   | Frontend Web                            | ✅ Completo                                 | [architecture/29-frontend-enterprise.md](./architecture/29-frontend-enterprise.md) (arquitectura) + [frontend/README.md](./frontend/README.md) (2026-07-16, EPIC 03 — 10 documentos de detalle de implementación: State Management, Routing, Folder Structure, Features, UI Guidelines, Performance, Error Handling, API Layer, Testing)                                                                                                                        |
| 29   | Aplicación Móvil                        | ❌ Pendiente de definir alcance             | Confirmado explícitamente en esta conversación: falta decidir enfoque (nativa / React Native / PWA sobre `apps/web`) antes de poder diseñarla                                                                                                                                                                                                                                                                                                                   |
| 30   | Pruebas                                 | 🟡 Parcial (menos parcial desde 2026-07-16) | Pirámide de testing por capa ya fijada en [07-convenciones-y-estandares §5](./architecture/07-convenciones-y-estandares.md#5-testing); [standards/TESTING_GUIDELINES.md](./standards/TESTING_GUIDELINES.md) (EPIC 04) cierra el procedimiento de escritura de test por capa y el criterio de cobertura — sigue faltando regresión entre módulos a escala y performance testing de backend (ver ese documento §6, transparente sobre lo que no cierra)           |
| 31   | DevOps                                  | ✅ Completo                                 | [architecture/31-infraestructura-completa.md](./architecture/31-infraestructura-completa.md)                                                                                                                                                                                                                                                                                                                                                                    |
| 32   | Despliegue                              | ✅ Completo                                 | [architecture/08-infraestructura-y-despliegue.md](./architecture/08-infraestructura-y-despliegue.md) + [31 §7-8](./architecture/31-infraestructura-completa.md#7-cicd--gap-cerrado-identificado-en-00-arquitectura-general-10)                                                                                                                                                                                                                                  |

## Resumen numérico

| Estado       | Cantidad | Fases                                       |
| ------------ | -------- | ------------------------------------------- |
| ✅ Completo  | 29       | 01-23, 24-25, 27, 28, 31-32                 |
| 🟡 Parcial   | 1        | 30 (Pruebas — falta estrategia QA dedicada) |
| ❌ Pendiente | 2        | 26, 29                                      |

**Actualización 2026-07-13:** Activos Fijos (fase 22), Producción
(fase 20), Servicios (fase 21) y Proyectos (fase 23) pasaron a ✅
Completo —
[architecture/37-modulo-assets.md](./architecture/37-modulo-assets.md),
[architecture/38-modulo-production.md](./architecture/38-modulo-production.md),
[architecture/39-modulo-services.md](./architecture/39-modulo-services.md)
y [architecture/40-modulo-projects.md](./architecture/40-modulo-projects.md) —
los 4 módulos de negocio pendientes que la Fase 6 de implementación
decidió diseñar quedaron completos (ver
[architecture/36-modulos-de-negocio-plan-de-implementacion-fase-6.md §3](./architecture/36-modulos-de-negocio-plan-de-implementacion-fase-6.md#3-los-4-módulos-genuinamente-pendientes--necesitan-decisión-de-alcance-no-se-diseñan-en-este-documento)).
De paso se corrigieron: una referencia cruzada stale que este mismo
documento citaba (ver nota en
[architecture/37-modulo-assets.md](./architecture/37-modulo-assets.md)
y en [architecture/25-modulo-hr.md §1](./architecture/25-modulo-hr.md#1-empleados-hremployees)),
se señaló explícitamente (sin diseñarlo) que Routing/Centro de
Trabajo/MRP/Control de Calidad —prometidos en el menú de Producción—
no tienen tabla real (ver
[architecture/38-modulo-production.md §7](./architecture/38-modulo-production.md#7-explícitamente-no-diseñado--requiere-confirmar-necesidad-de-negocio)),
se cerró el gap "equipos bajo servicio" entre Activos Fijos y
Servicios — resultó no necesitar FK nueva, eran dos conceptos de
negocio distintos (ver
[architecture/39-modulo-services.md §4](./architecture/39-modulo-services.md#4-equipos-bajo-servicio--dos-conceptos-que-no-se-conectan-a-propósito)),
y se corrigieron 3 anotaciones "(ID suelto)" incorrectas en el modelo
lógico de Proyectos (eran FKs reales, ver
[architecture/40-modulo-projects.md](./architecture/40-modulo-projects.md)).
El total de tablas del sistema pasó de 497 a **498** (se agregó
`projects.project_role_rates`, la única tabla nueva de los 4 módulos —
el resto de los gaps se cerraron con columnas, no tablas).

**Actualización 2026-07-13 (2):** Impuestos (fase 16) pasó a ✅
Completo —
[architecture/46-modulo-taxes.md](./architecture/46-modulo-taxes.md),
el último módulo de negocio pendiente con modelo de datos completo y
el más urgente por cantidad de referencias cruzadas ya existentes
desde `sales`, `purchases`, `payroll` y `configuration`. De paso: se
reconcilió `configuration.fiscal_regimes` (antes desconectado del
schema `taxes`) vía `tax_rules.fiscal_regime_id`; se confirmó que las
retenciones de ISR de `payroll` son un mecanismo deliberadamente
independiente de `taxes.withholding_rules` (tramos progresivos vs.
tasa plana, no se unifican); se corrigió el nodo faltante de
`Impuestos` en el grafo de dependencias de
[04-catalogo-modulos-negocio.md](./architecture/04-catalogo-modulos-negocio.md)
(y de paso una arista obsoleta `Servicios --> ActivosFijos` que
contradecía la corrección ya hecha en la Fase 6); y se particionó
`taxes.withholding_certificates` (gap real).

De las 3 pendientes restantes, **Integraciones** es el único módulo de
negocio con modelo de datos completo sin documento de arquitectura
propio — pero su infraestructura genérica (`core.integrations` y
familia) ya quedó completamente mapeada en la Fase 8
([architecture/42-integraciones-plan-fase-8.md](./architecture/42-integraciones-plan-fase-8.md)),
que concluyó que no corresponde diseñar ninguna integración específica
sin confirmación de negocio — no queda trabajo de arquitectura
pendiente ahí, solo la implementación puntual el día que se confirme
un proveedor real. Las **2 restantes** (IA, Móvil) están pendientes de
definición de alcance, no de diseño — no hay necesidad de negocio
confirmada todavía, así que no se planifican en detalle hasta que la
haya.

## Trabajo fuera de las 32 fases originales

Cuatro EPICs/fases completados que no tienen número propio en la lista de 32 fases (mismo
criterio que `docs/00-indice-maestro.md` aplica a `docs/menus/`: enriquecen fases ya
existentes en vez de ser fases nuevas):

- **EPIC 03 — Arquitectura de Frontend** (completado 2026-07-16): `docs/frontend/`,
  10 documentos + README. Detalla a nivel de implementación la Fase 28 (Frontend Web,
  ya ✅ Completo desde antes) — ver fila actualizada arriba.
- **EPIC 04 — Implementation Standards** (completado 2026-07-16): `docs/standards/`,
  13 documentos + README (`PROJECT_STRUCTURE`, `FILE_STRUCTURE`, `NAMING_CONVENTIONS`,
  `CODING_STANDARDS`, `ARCHITECTURE_RULES`, `MODULE_GUIDELINES`, `COMPONENT_GUIDELINES`,
  `API_GUIDELINES`, `DATABASE_GUIDELINES`, `SECURITY_GUIDELINES`, `TESTING_GUIDELINES`,
  `DOCUMENTATION_GUIDELINES`, `CODE_REVIEW`). Convierte en procedimientos accionables y
  checklists verificables las decisiones ya fijadas en `docs/architecture/`,
  `docs/database/` y `docs/frontend/` — cierra parcialmente la Fase 30 (ver fila
  actualizada arriba) y el punto 29 (Documentación) de `docs/00-indice-maestro.md`
  (documentación de API/OpenAPI, ver `standards/DOCUMENTATION_GUIDELINES.md §5`). Cierra
  además un gap real nunca documentado antes: el mapeo entre nombre de módulo (español,
  `modules/<x>/`) y nombre de schema de Postgres (inglés) —
  `standards/NAMING_CONVENTIONS.md §5`. Ver `CHANGELOG.md` en la raíz del repositorio
  para el detalle de este cambio.
- **EPIC — Database Visualization Environment** (completado 2026-07-16): entorno
  profesional de visualización de la base de datos, 100% gratuito/open source,
  instalado íntegramente en `D:\` (nunca `C:\`). `tools/database/dbeaver/` (DBeaver
  Community Edition portable, con conexión `GORAZUS_DEV` preconfigurada) +
  `tools/database/schemaspy/` + `tools/database/graphviz/` (generación automática de
  diagramas ERD — DBeaver CE no tiene exportación de diagramas por línea de comandos,
  decisión de complementarlo con SchemaSpy confirmada explícitamente con el usuario).
  `docs/database/erd/` (diagrama maestro a nivel de schema + 21 diagramas por schema
  real, PNG/SVG/PDF), `docs/database/DATABASE_STRUCTURE.md`,
  `DATABASE_DEPENDENCIES.md`, `DATABASE_VISUALIZATION.md`, `DATABASE_DICTIONARY.md` +
  `dictionary/` (21 archivos, diccionario técnico completo por columna),
  `DATABASE_HEALTH_REPORT.md`. La verificación contra la base real (antes no
  ejecutada nunca completa) encontró y documentó 3 gaps reales sin modificarlos: 0
  particiones creadas en las 27 tablas particionadas (🔴 crítico — bloquea cualquier
  INSERT en esas tablas), una vista (`accounting.v_treasury_position`) que nunca se
  creó por columna ambigua en `24_views.sql`, y un seed de
  `products.product_attributes` que falla por `company_id NOT NULL`. Todas las demás
  validaciones (FK inválidas, tablas huérfanas, índices duplicados, secuencias sin
  uso) dieron limpio.
- **PHASE 01 — Database Enterprise** (completado 2026-07-18): optimización real
  aplicada (autorización explícita del usuario) sobre los 3 gaps que la fase
  anterior solo documentó — los 3 resueltos, ninguno de los 30 archivos SQL
  originales editado (append-only: `sql/31_missing_fk_indexes.sql`,
  `32_bugfixes.sql`, `33_partition_provisioning_completion.sql`). La causa raíz del
  particionamiento resultó más profunda de lo que se sabía: `postgres:17-alpine` no
  incluye `pg_partman` (imagen propia creada, `infra/docker/postgres/Dockerfile`,
  `docker-compose.yml` actualizado), la extensión se instalaba sin `SCHEMA partman`
  explícito, y 6 de las 27 tablas particionadas nunca tenían su llamada
  `partman.create_parent()` — las 3 causas resueltas, 0 de 27 tablas sin
  particiones (antes: 27 de 27). Optimización real: 575 índices en columnas FK de
  negocio sin índice de soporte. **Hallazgo nuevo no visto en la fase anterior:**
  185 FK reales cruzan schemas de módulos de negocio distintos, contradiciendo la
  regla de arquitectura ya documentada — no corregido (cambio de alto riesgo,
  requiere ADR), corrige además una afirmación propia incorrecta de la fase
  anterior que daba esto por "0, verificado" sin haberlo verificado realmente.
  8 documentos nuevos (`DATABASE_ARCHITECTURE`, `TABLE_CATALOG`, `INDEX_CATALOG`,
  `FOREIGN_KEYS`, `MODULE_RELATIONSHIPS`, `DATA_FLOW`, `PERFORMANCE`, `SECURITY`,
  `BACKUP`) + actualización de `DATABASE_STRUCTURE.md`/`DATABASE_HEALTH_REPORT.md`/
  `DATABASE_DEPENDENCIES.md`/`dictionary/05-products.md`. Ver `CHANGELOG.md` para el
  detalle completo.

- **FASE 6 (usuario) — Domain-Driven Design** (completado 2026-07-21):
  `docs/ddd/`, 20 documentos + README. Arquitectura de dominio completa
  sobre los 29 módulos de negocio y el Core Platform ya diseñados:
  Bounded Contexts clasificados Core/Supporting/Generic Subdomain,
  Context Map con patrones DDD estándar (_Customer/Supplier_,
  _Partnership_, _ACL_), lenguaje ubicuo, y el modelado táctico
  completo (~33 Aggregate Roots sobre las 501 tablas reales, 7
  patrones de entidad hija, Value Objects, catálogo completo de
  Domain Events con trazabilidad ✅/🆕, Domain Services, Repositories,
  2 patrones genuinamente nuevos sin antecedente previo — Factories y
  Specifications —, Application Services, reconciliación Domain Event
  ↔ `event_code` contable, Anti-Corruption Layer para las 5 fronteras
  externas pedidas, 12 Domain Policies y 21 Invariants nombrados,
  mapa de Business Capabilities, grafo de dependencias de 6 niveles).
  Hallazgo clave que evitó duplicación mayor: `32-core-platform/
09-base-transaccional-y-modelado-ddd.md` ya diseñaba Security
  Context/Transaction Manager/Repository Base/Base Entity/Aggregate
  Root/Value Objects/Shared Kernel — referenciado y aplicado, no
  rediseñado. Cero SQL, cero código, cero tabla nueva, cero cambio a
  documentación previa.

- **"Database Enterprise v1.0" (usuario) — auditoría orientada a
  ferretería/distribución** (completado 2026-07-21, rama
  `feature/database-audit`, local sin push): segunda pasada de
  auditoría de base de datos, esta vez con dos ángulos que la Fase 1 de
  esta sesión no cubría todavía — verificación explícita de formas
  normales (1NF/2NF/3NF/BCNF, sin violaciones reales) y análisis
  funcional específico para ferretería/distribuidores (medidas
  fraccionarias, conversiones de unidad, códigos de barra múltiples,
  series, lotes, garantías, sustitutos — todos ya soportados; 2 gaps
  reales encontrados: sin campos de materiales peligrosos/hoja de
  seguridad, sin columnas de primera clase para peso/dimensiones,
  mitigado parcialmente por el sistema de atributos genérico ya
  existente). Vistas/materialized views/triggers/funciones/
  procedimientos/secuencias re-verificados en vivo: sin drift respecto
  a la pasada del 2026-07-20. Alcance confirmado con el usuario antes
  de empezar: solo documentación, sin DDL real sobre el entorno dev
  (que tiene un contenedor de API corriendo contra la misma base de
  datos) — las 2 mejoras identificadas quedan como recomendación para
  una fase posterior. Ver
  [database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md](./database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md).

## Orden sugerido para las fases pendientes (histórico — ya no quedan módulos de negocio con modelo de datos completo por diseñar)

1. ~~**Impuestos**~~ — ✅ completado 2026-07-13, ver arriba.
2. ~~**Producción**~~ — ✅ completado 2026-07-13, ver arriba.
3. ~~**Activos Fijos**~~ — ✅ completado 2026-07-13, ver arriba.
4. ~~**Servicios**~~ — ✅ completado 2026-07-13, ver arriba.
5. ~~**Proyectos**~~ — ✅ completado 2026-07-13, ver arriba. Los 4 módulos de la Fase 6 de implementación más Impuestos quedaron completos.
6. **Integraciones** (`administracion`) — depende conceptualmente de que el resto de los módulos ya estén estables, para saber bien qué eventos/datos expone hacia afuera.
