# 00 — Índice maestro del proyecto GORAZUS

> Ver también [manuals/](./manuals/) — manuales operativos/de producto (Técnico, Usuario,
> Instalación, DevOps, Arquitectura Final, Checklist de Producción), FASE 05, 2026-07-20.

> Ver también [00-auditoria-2026-07-20.md](./00-auditoria-2026-07-20.md) — auditoría técnica
> completa del estado REAL de código (no de documentación) por módulo, con riesgos, deuda técnica
> y roadmap por fases. Este índice mapea qué está _documentado_; esa auditoría mapea qué está
> _construido y verificado_.

> Versión 1.0 — 2026-07-13. Mapea la estructura de 31 puntos (00-30)
> propuesta para todo el proyecto contra la documentación real ya
> existente en el repositorio. **No renombra ni reorganiza nada** —
> es un índice de navegación adicional, no reemplaza
> [docs/architecture/README.md](./architecture/README.md) ni
> [docs/database/README.md](./database/README.md), que siguen siendo
> la fuente de verdad de su propia carpeta con su propia numeración
> interna (0-31 en arquitectura, 0-11 en base de datos). Este
> documento existe para responder una sola pregunta rápido: _"el
> punto N de la lista maestra, ¿dónde está y está completo?"_

## Cómo leer la tabla

- **Estado ✅ Completo** — existe un documento de arquitectura
  dedicado que responde ese punto con diseño completo (flujos,
  decisiones, no solo el modelo de datos).
- **Estado 🟡 Parcial** — el tema está cubierto como sección dentro de
  otro documento, pero no tiene un documento propio dedicado.
- **Estado ❌ Pendiente** — no existe documento de arquitectura para
  ese punto. En varios casos el **modelo de datos ya existe**
  (schema SQL + documento lógico en `docs/database/`) pero falta el
  diseño de arquitectura/flujo equivalente a los ya hechos para
  Ventas, Compras, etc.

| #   | Punto pedido            | Estado                                      | Documento(s)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | Reglas del Proyecto     | ❌ Pendiente                                | No formalizado como documento — existe únicamente como instrucción de sesión (rol de Arquitecto Principal + reglas permanentes dadas al inicio de esta conversación). Candidato natural: `docs/00-reglas-del-proyecto.md`, nunca creado hasta ahora                                                                                                                                                                                            |
| 01  | Arquitectura Enterprise | ✅ Completo                                 | [architecture/00-arquitectura-general.md](./architecture/00-arquitectura-general.md) (vista consolidada) + [architecture/01-11](./architecture/README.md) (detalle normativo completo)                                                                                                                                                                                                                                                         |
| 02  | Base de Datos           | ✅ Completo                                 | [database/00-modelo-general.md](./database/00-modelo-general.md) (vista consolidada) + [database/01-11](./database/README.md) + [database/02a-restricciones-e-indices.md](./database/02a-restricciones-e-indices.md) + `logico/` (21 docs) + `sql/` (30 archivos, fuente de verdad del schema)                                                                                                                                                 |
| 03  | Backend                 | ✅ Completo                                 | [architecture/12-backend-enterprise.md](./architecture/12-backend-enterprise.md)                                                                                                                                                                                                                                                                                                                                                               |
| 04  | Seguridad               | ✅ Completo                                 | [architecture/15-modulo-security.md](./architecture/15-modulo-security.md) (Usuarios/Roles/Permisos/ACL/RBAC/ABAC/Bitácora/Auditoría) + [architecture/13-modulo-auth.md](./architecture/13-modulo-auth.md) (JWT/OAuth/2FA/Sesiones/API Keys) + [architecture/09-seguridad-y-multiempresa.md](./architecture/09-seguridad-y-multiempresa.md) (mecanismo base)                                                                                   |
| 05  | Core                    | ✅ Completo                                 | [architecture/14-modulo-core.md](./architecture/14-modulo-core.md)                                                                                                                                                                                                                                                                                                                                                                             |
| 06  | Clientes                | ✅ Completo                                 | [architecture/16-modulo-customers.md](./architecture/16-modulo-customers.md)                                                                                                                                                                                                                                                                                                                                                                   |
| 07  | Proveedores             | ✅ Completo                                 | [architecture/17-modulo-suppliers.md](./architecture/17-modulo-suppliers.md)                                                                                                                                                                                                                                                                                                                                                                   |
| 08  | Productos               | ✅ Completo                                 | [architecture/18-modulo-products.md](./architecture/18-modulo-products.md)                                                                                                                                                                                                                                                                                                                                                                     |
| 09  | Inventario              | ✅ Completo                                 | [architecture/19-modulo-inventory.md](./architecture/19-modulo-inventory.md)                                                                                                                                                                                                                                                                                                                                                                   |
| 10  | Ventas                  | ✅ Completo                                 | [architecture/20-modulo-sales.md](./architecture/20-modulo-sales.md)                                                                                                                                                                                                                                                                                                                                                                           |
| 11  | Compras                 | ✅ Completo                                 | [architecture/21-modulo-purchases.md](./architecture/21-modulo-purchases.md)                                                                                                                                                                                                                                                                                                                                                                   |
| 12  | Caja                    | ✅ Completo                                 | [architecture/23-modulo-cash.md](./architecture/23-modulo-cash.md)                                                                                                                                                                                                                                                                                                                                                                             |
| 13  | Bancos                  | ✅ Completo                                 | [architecture/24-modulo-banking.md](./architecture/24-modulo-banking.md)                                                                                                                                                                                                                                                                                                                                                                       |
| 14  | Contabilidad            | ✅ Completo                                 | [architecture/22-modulo-accounting.md](./architecture/22-modulo-accounting.md)                                                                                                                                                                                                                                                                                                                                                                 |
| 15  | Impuestos               | ✅ Completo (2026-07-13)                    | [architecture/46-modulo-taxes.md](./architecture/46-modulo-taxes.md) — diseño completo (jurisdicciones/régimen, impuestos/tasas, reglas de aplicabilidad, retenciones, exenciones, percepciones, declaraciones), reconciliado con `configuration.fiscal_regimes`                                                                                                                                                                               |
| 16  | CRM                     | ✅ Completo                                 | [architecture/27-modulo-crm.md](./architecture/27-modulo-crm.md)                                                                                                                                                                                                                                                                                                                                                                               |
| 17  | RRHH                    | ✅ Completo                                 | [architecture/25-modulo-hr.md](./architecture/25-modulo-hr.md)                                                                                                                                                                                                                                                                                                                                                                                 |
| 18  | Nómina                  | ✅ Completo                                 | [architecture/26-modulo-payroll.md](./architecture/26-modulo-payroll.md)                                                                                                                                                                                                                                                                                                                                                                       |
| 19  | Producción              | ✅ Completo (2026-07-13)                    | [architecture/38-modulo-production.md](./architecture/38-modulo-production.md) — diseño completo de BOM/Recetas, ciclo de vida de Orden de Producción, consumo real vs. planificado, costeo. Nota: Routing/Centro de Trabajo/MRP/Control de Calidad —prometidos en `docs/menus/13-produccion.md`— no tienen tabla real en el schema y quedan explícitamente fuera de alcance, pendientes de necesidad de negocio confirmada (ver documento §7) |
| 20  | Servicios               | ✅ Completo (2026-07-13)                    | [architecture/39-modulo-services.md](./architecture/39-modulo-services.md) — diseño completo (órdenes, técnicos, equipos, contratos/SLA, mantenimiento preventivo, ejecución en campo, repuestos). Cierra el gap "equipos bajo servicio" que la fila de Activos Fijos señalaba — resultó no necesitar FK, son 2 conceptos distintos                                                                                                            |
| 21  | Activos Fijos           | ✅ Completo (2026-07-13)                    | [architecture/37-modulo-assets.md](./architecture/37-modulo-assets.md) — diseño completo (categorías, depreciación, mantenimientos, transferencias/custodios, revaluaciones, bajas). Nota: la referencia a `hr.employee_asset_assignments` que esta fila citaba antes no existía realmente en `25-modulo-hr.md` — se corrigió en ambos documentos al escribir 37                                                                               |
| 22  | Proyectos               | ✅ Completo (2026-07-13)                    | [architecture/40-modulo-projects.md](./architecture/40-modulo-projects.md) — diseño completo (tareas/WBS, recursos y tarifas, presupuesto, partes de horas, costos, facturación por hitos, riesgos). Último de los 4 módulos de la Fase 6 de implementación; `sql/17_projects.sql` pasó a 17 tablas (se agregó `project_role_rates`)                                                                                                           |
| 23  | Reportes y BI           | ✅ Completo                                 | [architecture/28-modulo-reports-bi.md](./architecture/28-modulo-reports-bi.md)                                                                                                                                                                                                                                                                                                                                                                 |
| 24  | Frontend                | ✅ Completo                                 | [architecture/29-frontend-enterprise.md](./architecture/29-frontend-enterprise.md) (arquitectura) + [frontend/README.md](./frontend/README.md) (2026-07-16, EPIC 03 — detalle de implementación: State Management, Routing, Folder Structure, Features, UI Guidelines, Performance, Error Handling, API Layer, Testing)                                                                                                                        |
| 25  | API                     | ✅ Completo                                 | [architecture/30-api-completa.md](./architecture/30-api-completa.md)                                                                                                                                                                                                                                                                                                                                                                           |
| 26  | Integraciones           | ❌ Pendiente                                | Modelo de datos ya existe en `core`: `integrations`, `integration_credentials`, `webhook_subscriptions`, `webhook_delivery_logs`, `edi_transactions` ([logico/01-core.md](./database/logico/01-core.md)). Mencionado al pasar en [14-modulo-core.md](./architecture/14-modulo-core.md) pero sin documento propio que diseñe el flujo de alta de integración, autenticación de webhooks salientes, reintentos, etc.                             |
| 27  | DevOps                  | ✅ Completo                                 | [architecture/31-infraestructura-completa.md](./architecture/31-infraestructura-completa.md) (Docker, Kubernetes, NGINX, Redis/RabbitMQ/MinIO + HA, CI/CD, GitHub Actions, Monitoreo, Respaldos) + [architecture/08-infraestructura-y-despliegue.md](./architecture/08-infraestructura-y-despliegue.md)                                                                                                                                        |
| 28  | QA y Pruebas            | 🟡 Parcial (menos parcial desde 2026-07-16) | Pirámide ya fijada en [architecture/07-convenciones-y-estandares §5](./architecture/07-convenciones-y-estandares.md#5-testing). [standards/TESTING_GUIDELINES.md](./standards/TESTING_GUIDELINES.md) (EPIC 04) cierra procedimiento de escritura y criterio de cobertura por capa. Sigue faltando: testing de regresión entre módulos a escala y performance testing de backend (ver ese documento §6)                                         |
| 29  | Documentación           | 🟡 Parcial (menos parcial desde 2026-07-16) | Gobernanza ya fijada en [architecture/11-gobernanza-y-adrs.md](./architecture/11-gobernanza-y-adrs.md). [standards/DOCUMENTATION_GUIDELINES.md](./standards/DOCUMENTATION_GUIDELINES.md) (EPIC 04) cierra el meta-patrón de `docs/` y decide generación de OpenAPI. Sigue faltando: documentación de usuario final, versionado de `docs/menus/`                                                                                                |
| 30  | Despliegue              | ✅ Completo                                 | [architecture/08-infraestructura-y-despliegue.md](./architecture/08-infraestructura-y-despliegue.md) (topología, entornos) + [architecture/31-infraestructura-completa.md §7-8](./architecture/31-infraestructura-completa.md#7-cicd--gap-cerrado-identificado-en-00-arquitectura-general-10) (pipeline y workflows de despliegue)                                                                                                             |

## Resumen numérico

| Estado       | Cantidad | Puntos                      |
| ------------ | -------- | --------------------------- |
| ✅ Completo  | 22       | 01-14, 16-18, 23-25, 27, 30 |
| 🟡 Parcial   | 2        | 28, 29                      |
| ❌ Pendiente | 7        | 00, 15, 19, 20, 21, 22, 26  |

**Patrón en los 7 pendientes**: seis de los siete (15, 19, 20, 21, 22, 26) ya tienen su modelo de datos completo — schema SQL real,
verificado, y documento lógico en `docs/database/logico/` — exactamente
la misma situación de partida que tenían los 22 módulos ya
completados antes de diseñarse. El único genuinamente distinto es
**00 (Reglas del Proyecto)**, que no es un módulo de negocio sino la
gobernanza misma de esta conversación, nunca materializada como
archivo.

## Documentación fuera de esta lista de 31 puntos

- **`docs/frontend/`** (10 documentos + README, EPIC 03, 2026-07-16) — detalle de
  implementación de la Fase 24 (Frontend), no un punto nuevo de la lista de 31.
- **`docs/standards/`** (13 documentos + README, EPIC 04, 2026-07-16) — estándares de
  implementación accionables, cierra parcialmente los puntos 28 y 29 de arriba, no un
  punto nuevo en sí mismo.
- **`docs/menus/`** (26 documentos, incluida la convención en
  `00-convenciones.md`) — especificación de navegación/menú por
  módulo de negocio, preexistente al inicio de este trabajo,
  completa, no cubierta por ninguno de los 31 puntos pedidos.
- **`docs/ddd/`** (20 documentos + README, Fase 6, 2026-07-21) —
  arquitectura de dominio completa (Bounded Contexts, Context Map,
  lenguaje ubicuo, Aggregates/Entities/Value Objects/Domain
  Events/Domain Services/Repositories/Factories/Specifications/
  Application Services) sobre los 29 módulos de negocio y el Core
  Platform ya existentes — capa de vocabulario y modelado táctico DDD,
  no un punto nuevo de la lista de 31, cero tabla/columna nueva.
- **`docs/database/sql/`** (30 archivos) — la fuente de verdad
  ejecutable del schema completo (498 tablas + vistas, funciones,
  triggers, particionamiento, respaldo — 494 originales, 3 agregadas
  por el Core Platform (ver
  [architecture/32-core-platform/](./architecture/32-core-platform/README.md))
  y 1 agregada por los módulos de la Fase 6, ver
  [architecture/40-modulo-projects.md](./architecture/40-modulo-projects.md)),
  base real sobre la que se verificó cada documento de arquitectura de
  módulo ya creado.

## Trazabilidad de este documento

Este índice se genera a partir del estado real de los archivos en
`docs/` al 2026-07-13 (actualizado 2026-07-16: punto 24 referencia también
`docs/frontend/`, ver EPIC 03). Si se agrega un documento nuevo (p. ej. al
completar uno de los 7 pendientes), este archivo debe actualizarse en
el mismo commit — es, en sí mismo, el primer caso de aplicación de la
recomendación de "Documentación" (punto 29, todavía 🟡 Parcial): un
índice desactualizado es peor que no tener índice.
