---
id: governance-innovation-report-2026-07-28
title: 'Innovation Report — 2026-07-28'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: innovation
created: 2026-07-28
updated: 2026-07-28
tags: [governance, innovation, technology-radar, second-brain]
related:
  - '[[Enterprise Governance Report — 2026-07-28]]'
  - '[[Architecture Principles]]'
  - '[[Shared Services]]'
  - '[[Domain Events]]'
---

# Purpose

Reporte de Innovación (Second Brain Protocol, Level 6 — INNOVATE). Antes del contenido, una
aclaración necesaria sobre el método: este nivel pide "monitoreo tecnológico continuo" y "análisis
de mercado de ERPs" — cosas que, dentro de esta conversación, no puedo hacer como investigación en
vivo (sin acceso a fuentes externas verificables en este turno). Presentar eso como si fuera
investigación fresca violaría la disciplina de honestidad que gobernó los cinco niveles anteriores.
Lo que sí puedo ofrecer con integridad: conocimiento general ya establecido sobre patrones de
arquitectura de ERPs (no features específicas de una versión que no puedo verificar hoy), evaluado
contra el estado **real** de GORAZUS ya documentado en el AKB — y aplicar el mismo criterio de
gobernanza que el propio proyecto ya declara como el más importante:
_"no diseñar especulativamente sin necesidad de negocio confirmada"_ ([[Architecture Principles]]).
Ese criterio es la vara con la que se mide cada tecnología de este reporte — no el entusiasmo por la
novedad.

# 1. Executive Summary

De las ~20 tecnologías emergentes que este nivel pide evaluar, la mayoría se descarta explícitamente
por falta de una necesidad de negocio real y verificable en GORAZUS hoy — no por desconocimiento de
la tecnología, sino porque adoptarla sin esa necesidad sería exactamente el anti-patrón de diseño
especulativo que el proyecto ya rechaza. Las dos únicas áreas con conexión real a datos y dominios ya
construidos (pronóstico de demanda y flujo de caja, ambos apoyados en tablas append-only ya reales y
de gran volumen) se clasifican como **Monitor**, no **Prototype** — construir un prototipo real
requiere código, y ningún nivel anterior de esta secuencia introdujo código, manteniendo la
disciplina de "solo arquitectura" de toda la sesión salvo donde se pidió SQL explícitamente.

# 2. Technology Evaluation (Step 1, Step 3)

| Categoría                                              | Conexión real con GORAZUS hoy                                                                                                                                                                                                                                                                                                                                                                                    | Decisión                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| IA — Pronóstico de demanda / recomendaciones de compra | ✅ Real: `inventory.stock_movements` (particionado, alto volumen) + `product_suppliers.lead_time_days`/`last_purchase_cost` ya existen — los datos de entrenamiento ya se generan                                                                                                                                                                                                                                | **Monitor**                                         |
| IA — Predicción de flujo de caja                       | ✅ Real: `accounting.journal_entries` (particionado anual) ya es la fuente de verdad contable                                                                                                                                                                                                                                                                                                                    | **Monitor**                                         |
| IA — Asistente de documentos / extracción de atributos | 🟡 Conexión conceptual: [[Dynamic Attribute Engine]] (EAV) es el destino natural de una extracción automática de especificaciones desde una ficha técnica o imagen                                                                                                                                                                                                                                               | **Monitor**                                         |
| Agentic AI / LLMs / MCP / RAG                          | 🔴 Sin ningún dato vectorial, sin búsqueda semántica, sin caso de uso de negocio confirmado en ningún ADR ni nota del AKB                                                                                                                                                                                                                                                                                        | **Discard** (por ahora — no "nunca", ver §9)        |
| Vector Databases                                       | 🔴 Consecuencia directa de lo anterior — sin RAG/búsqueda semántica, sin necesidad de almacenamiento vectorial                                                                                                                                                                                                                                                                                                   | **Discard**                                         |
| Apache Kafka / NATS                                    | 🔴 GORAZUS ya tiene un bus de eventos real y deliberadamente elegido (RabbitMQ, `gorazus.eventos`, [[Shared Services]]) — migrar sin un problema real de throughput que RabbitMQ no resuelva sería reemplazar una decisión ya tomada sin evidencia de que esté fallando                                                                                                                                          | **Discard**                                         |
| Temporal / Workflow Engines                            | 🟡 Conexión parcial: `Approval Engine (P8)`, ya referenciado como Domain Policy real en [[Business Rules Matrix — Inventory]] (BR-09), es conceptualmente un motor de flujo de trabajo — pero **0 de 3 clases de evento de dominio ya diseñadas se publican todavía** ([[Domain Events]]); resolver esa brecha con la infraestructura ya real (RabbitMQ) es la prioridad antes de evaluar un motor externo nuevo | **Discard** (resolver lo ya construido primero)     |
| Serverless                                             | 🔴 GORAZUS es un monolito modular con estado (Postgres primario único, Redis, RabbitMQ) — sin componente sin estado candidato identificado más allá de `api` (ya escalable horizontalmente sin Serverless, [[Infrastructure]])                                                                                                                                                                                   | **Discard**                                         |
| Edge Computing / IoT / Digital Twins                   | 🔴 Cero mención en cualquier ADR, nota del AKB o documento de arquitectura leído en toda esta sesión — sin necesidad de negocio ni remotamente insinuada                                                                                                                                                                                                                                                         | **Discard**                                         |
| Offline Synchronization / Mobile                       | 🔴 Sin evidencia de un cliente móvil ni de un requisito de operación desconectada en ningún documento revisado                                                                                                                                                                                                                                                                                                   | **Discard**                                         |
| Distributed SQL                                        | 🔴 [[Infrastructure]] ya identificó la vía de escalado real (separar un schema caliente a instancia propia) sin necesidad de cambiar de motor — Postgres ya es la decisión certificada, con particionamiento production-proven                                                                                                                                                                                   | **Discard**                                         |
| Knowledge Graphs (más allá del AKB en Obsidian)        | 🟡 El AKB **ya es**, en la práctica, un grafo de conocimiento (wikilinks, `related:` en cada nota) — no hay necesidad de una tecnología de grafo adicional para lo que ya se resuelve con Obsidian + Markdown                                                                                                                                                                                                    | **Discard** (ya resuelto con la herramienta actual) |

# 3. ERP Benchmark (Step 2) — patrones generales, no investigación en vivo

Sin afirmar conocer el estado exacto de ninguna versión específica de 2026 de ningún producto (no
verificable en este turno), tres patrones arquitectónicos **generales y ya establecidos** en la
industria de ERPs enterprise son relevantes para contrastar con decisiones ya tomadas en GORAZUS:

- **Extensibilidad sin migración de schema** (patrón común a SAP Material Master, Odoo
  `ir.model.fields`, Dynamics 365 custom fields): GORAZUS ya tiene el equivalente real — el modelo
  EAV de `product_attributes` ([[Dynamic Attribute Engine]]), ya validado en `ADR-INV-001 §3.1` como
  paralelo directo al "Tipo de Material" de SAP.
- **Motor de aprobaciones configurable** (patrón común a la mayoría de ERPs enterprise para compras/
  ajustes de alto impacto): GORAZUS ya lo anticipa como Domain Policy (`P8`, referenciada en BR-09)
  sin tenerlo implementado — brecha real ya conocida, no una idea nueva de este reporte.
- **Aislamiento multiempresa por fila (RLS) vs. por base de datos/schema separado**: GORAZUS eligió
  RLS (`ADR-DB-001 §1`) — un patrón que productos cloud-native (no todos los de la lista) también
  favorecen sobre aprovisionar una base de datos completa por cliente, por el mismo motivo ya
  documentado: miles de tenants pequeños no justifican miles de bases de datos.

**Ningún hallazgo de esta sección recomienda copiar la implementación de otro producto** — cada
paralelo confirma que una decisión de GORAZUS ya tomada está alineada con un patrón maduro de la
industria, o identifica una brecha ya conocida (Approval Engine) sin necesidad de mirar afuera para
saber que existe.

# 4. Prototype Results (Step 4-5)

**Ningún prototipo se construyó en este ciclo.** Construir y medir un prototipo real requiere código
— fuera del alcance de "solo arquitectura" que gobernó toda esta secuencia salvo donde se pidió SQL
explícitamente (`ADR-DB-001 §14`). Si en el futuro se autoriza un prototipo real, el candidato más
justificado por evidencia (no por novedad) sería un modelo simple de pronóstico de demanda sobre
`inventory.stock_movements` ya existente — con hipótesis, métricas de éxito y criterio de fallo
definidos _antes_ de escribir código, siguiendo el Step 4 del protocolo, no una demo especulativa.

# 5. Risks

Ninguna tecnología de este reporte se recomienda con riesgo asociado porque ninguna se recomienda
**adoptar** todavía (§8). El riesgo real es el opuesto al que este nivel usualmente previene: el
riesgo de innovar sin necesidad confirmada, ya identificado como el error de gobernanza más costoso
del proyecto (`ADR-DB-001`/`ADR-INV-001 §9`, ambos citan este mismo criterio para descartar
alternativas).

# 6. Business Impact

Ninguno medible todavía — correcto, dado que ninguna innovación pasó de "Monitor" a "Prototype" real
en este ciclo. El impacto de negocio de las dos áreas en **Monitor** (pronóstico de demanda, flujo de
caja) es potencialmente alto _si_ se confirma la necesidad — pero afirmarlo como ya cuantificado
sería fabricar una cifra sin base.

# 7. Engineering Impact

Ninguno — sin cambio de infraestructura, sin dependencia nueva agregada, sin superficie de código
nueva introducida por este reporte.

# 8. Knowledge Created

Este reporte es, en sí mismo, la Nota de Innovación / Reseña Tecnológica de Step 7 — no se
fragmenta en notas adicionales por categoría dado el volumen real de contenido (mayoría **Discard**
con una línea de razón cada una, no un análisis profundo por tecnología que justifique una nota
propia) — mismo criterio de "no fragmentar sin necesidad" ya aplicado en el reporte de Level 4.

# 9. ADR Recommendations

Ninguno nuevo. Nada en este reporte alcanzó el nivel de madurez (`Idea → Investigación → Prototipo →
Revisión Técnica → Revisión de Arquitectura → Propuesta de ADR`, Step 8) que justifique una propuesta
de ADR — las dos áreas en **Monitor** requieren primero una necesidad de negocio confirmada
explícitamente por el negocio, no por este reporte.

# 10. Innovation Roadmap (Step 9)

- **Horizonte 1 (release actual)**: ninguna innovación de este reporte — la prioridad real ya
  identificada en [[Enterprise Governance Report — 2026-07-28]] §8 es cerrar deuda técnica existente,
  no agregar superficie nueva.
- **Horizonte 2 (1-2 años)**: revisar si la brecha de eventos de dominio sin publicar (0 de 3 clases
  reales publicándose) se resuelve con la infraestructura ya real (RabbitMQ) antes de que sea
  relevante evaluar cualquier motor de workflow externo.
- **Horizonte 3 (3-5 años)**: pronóstico de demanda / flujo de caja, **solo si** el negocio confirma
  la necesidad — los datos ya existen y ya crecen (`stock_movements`, `journal_entries`), la
  arquitectura no sería el cuello de botella si esta necesidad se confirmara.
- **Horizonte 4 (más de 5 años)**: sin ítem — no hay evidencia hoy que justifique proyectar IA
  agéntica, edge computing o gemelos digitales para GORAZUS; se dejan como preguntas abiertas sin
  compromiso, no como aspiración de roadmap.

# 11. Final Recommendation

**Decisión: Monitor (2 áreas) / Discard (el resto).** Ninguna tecnología de este reporte alcanza el
nivel de evidencia que este proyecto ya exige para pasar a **Prototype**. Esto no es una limitación
del reporte — es el resultado correcto de aplicarle a la innovación el mismo estándar de honestidad
que ya gobierna cada ADR de GORAZUS: ninguna capacidad se presenta como necesaria sin evidencia de
que lo sea.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INV-001]] · [[ADR-INV-000]]

# References

[[Enterprise Governance Report — 2026-07-28]] · [[Architecture Principles]] · [[Shared Services]] ·
[[Domain Events]] · [[Dynamic Attribute Engine]] · [[Infrastructure]]
