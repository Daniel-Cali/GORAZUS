# Fase 2 — Motores Enterprise (Infraestructura funcional)

> 2026-07-21. Solicitada explícitamente por el usuario como "Arquitecto
> Principal de GORAZUS ERP", continuando exactamente donde terminó la
> [auditoría de Fase 1](./database/AUDIT_FASE1_ENTERPRISE.md) (modelo de
> datos). Este documento es el **índice y reporte** de la Fase 2 — el
> diseño técnico completo de cada motor vive en
> [32-core-platform/](./architecture/32-core-platform/README.md) (los
> ya existentes) y en el nuevo
> [32-core-platform/14-motores-enterprise-avanzados.md](./architecture/32-core-platform/14-motores-enterprise-avanzados.md)
> (los 5 genuinamente nuevos). No se repite ese contenido acá.

## 0. Nota de desambiguación: dos cosas distintas se llaman "Fase 2"

Ya existía, desde 2026-07-13, un documento llamado
`13-plan-de-implementacion-fase-2.md` dentro de `32-core-platform/` —
ese documento responde a una "Fase 2" **completamente distinta**: el
orden de construcción de los 72 componentes del Core Platform (una
secuencia de trabajo de una sesión anterior). El pedido actual del
usuario ("Fase 2: diseña completamente estos 11 motores") es una
**tercera numeración informal**, distinta tanto de esa como de la
numeración de fases de
[00-roadmap-fases.md](./00-roadmap-fases.md) (documentación de
arquitectura por módulo de negocio, 01-32) — el mismo problema de
ambigüedad que `13-plan-de-implementacion-fase-2.md §0` ya advirtió
para su propio caso. Este documento **no reemplaza ni modifica**
ninguno de los otros dos — es un tercer artefacto, con su propio
alcance acotado (los 11 motores pedidos hoy), coexistiendo con ambos.

## 1. Los 11 motores pedidos — qué ya existía, qué se diseñó hoy

Verificado contra los 13 documentos ya existentes de `32-core-platform/`
**antes** de escribir una sola línea nueva — mismo método que ya usó
`13-plan-de-implementacion-fase-2.md §1` para un pedido anterior de 23
componentes, y que la auditoría de Fase 1 usó contra el modelo de
datos real. Resultado: **6 de los 11 ya tenían diseño completo**, **5
genuinamente no existían**.

| #   | Motor pedido               | Estado antes de hoy                                                                                          | Documento                                                                                                                             |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Workflow Engine            | ✅ Ya diseñado (10 dimensiones completas)                                                                    | [32-core-platform/05 §4](./architecture/32-core-platform/05-motores-de-logica-de-negocio.md#4-workflow-engine)                        |
| 2   | BPM Engine                 | 🆕 No existía                                                                                                | **[32-core-platform/14 §1](./architecture/32-core-platform/14-motores-enterprise-avanzados.md#1-bpm-engine) — nuevo**                 |
| 3   | Business Rules Engine      | ✅ Ya diseñado                                                                                               | [32-core-platform/05 §1](./architecture/32-core-platform/05-motores-de-logica-de-negocio.md#1-business-rules-engine)                  |
| 4   | Approval Engine            | ✅ Ya diseñado                                                                                               | [32-core-platform/05 §5](./architecture/32-core-platform/05-motores-de-logica-de-negocio.md#5-approval-engine)                        |
| 5   | Notification Engine        | ✅ Ya diseñado como "Notification Center"                                                                    | [32-core-platform/06 §4](./architecture/32-core-platform/06-eventos-y-mensajeria.md#4-notification-center)                            |
| 6   | Document Management System | 🔗 Solo la mitad (`File Manager` cubre subida/versionado, no ciclo de vida/categorización/retención)         | **[32-core-platform/14 §2](./architecture/32-core-platform/14-motores-enterprise-avanzados.md#2-document-management-system) — nuevo** |
| 7   | Digital Signature          | 🔗 Solo tablas + método stub, sin flujo                                                                      | **[32-core-platform/14 §3](./architecture/32-core-platform/14-motores-enterprise-avanzados.md#3-digital-signature) — nuevo**          |
| 8   | Task Engine                | 🆕 No existía (distinto de "Background Jobs", ver §2)                                                        | **[32-core-platform/14 §4](./architecture/32-core-platform/14-motores-enterprise-avanzados.md#4-task-engine) — nuevo**                |
| 9   | Event Engine               | ✅ Ya diseñado como "Domain Events + Event Bus + Message Broker"                                             | [32-core-platform/06 §1-3](./architecture/32-core-platform/06-eventos-y-mensajeria.md)                                                |
| 10  | Scheduler                  | ✅ Ya diseñado                                                                                               | [32-core-platform/08 §5](./architecture/32-core-platform/08-frameworks-de-infraestructura.md#5-scheduler)                             |
| 11  | Integration Engine         | 🔗 Solo tablas (`integrations`/`integration_credentials`/`edi_transactions`/`webhook_*`), sin motor genérico | **[32-core-platform/14 §5](./architecture/32-core-platform/14-motores-enterprise-avanzados.md#5-integration-engine) — nuevo**         |

## 2. Por qué "Task Engine" no es "Background Jobs"

Ambigüedad real que valía la pena resolver explícitamente antes de
diseñar: el Core Platform ya tiene un componente llamado informalmente
"motor de tareas" — `Background Jobs`
([32-core-platform/08 §6](./architecture/32-core-platform/08-frameworks-de-infraestructura.md#6-background-jobs)) —
pero ese componente ejecuta **cómputo asíncrono sin intervención
humana** (enviar un email, renderizar un PDF). El "Task Engine" que
pidió el usuario, en el vocabulario Enterprise que él mismo invocó
(SAP Business Workflow + Universal Worklist, Dynamics Business Process
Flow task lists, Oracle NetSuite Task Manager), es la **bandeja de
tareas humanas** — lo que una persona tiene pendiente de decidir o
hacer, agregado desde Workflow Engine, Approval Engine y Digital
Signature. Se diseñó como ese segundo concepto (§4 de `14`), citando
explícitamente la distinción para que no se confunda ni se fusione con
`Background Jobs` en una implementación futura.

## 3. Qué NO se tocó (respeta "no modifiques módulos ya terminados")

- **Cero ediciones** a `05-motores-de-logica-de-negocio.md`,
  `06-eventos-y-mensajeria.md`, `08-frameworks-de-infraestructura.md` —
  los 6 motores ya diseñados se referencian, no se reabren.
- **Cero tablas nuevas propuestas.** Los 5 motores nuevos (§1, filas
  marcadas 🆕/🔗) reutilizan el 100% de las tablas que ya existen en
  `core.*` — verificado contra `schema.prisma` real antes de escribir
  cada sección "Tablas" de `14-motores-enterprise-avanzados.md`, no
  asumido. Donde el modelo actual es insuficiente (versionado de
  definición BPM, `legal_hold` en documentos, columnas de Firma
  Avanzada, evento de acceso a credencial), se documenta el gap
  explícitamente como candidato de una fase futura — nunca se propone
  ni se escribe el SQL para cerrarlo, tal como se pidió.
- **Cero código.** Todo el contenido de esta fase es Markdown —
  ningún archivo `.ts`/`.sql` fue creado, editado ni ejecutado.

## 4. Trazabilidad

| Punto pedido en la Fase 2                                                                                                                      | Cerrado en                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diseñar los 11 motores (objetivo/arquitectura/tablas/relaciones/eventos/flujo interno/dependencias/permisos/auditoría/seguridad/escalabilidad) | §1 — 6 mapeados a diseño ya existente, 5 diseñados de cero en `14-motores-enterprise-avanzados.md`                                                               |
| No modificar módulos ya terminados                                                                                                             | §3                                                                                                                                                               |
| No cambiar la arquitectura existente                                                                                                           | §3 — 0 tablas nuevas, 0 código                                                                                                                                   |
| Listo para integrarse sin romper compatibilidad                                                                                                | Cada motor nuevo declara sus dependencias hacia componentes ya construidos, sin modificar su interfaz pública — ver `14 §1-5`, bullet "Dependencias" de cada uno |
