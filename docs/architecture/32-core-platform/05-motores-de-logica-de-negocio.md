# 32.05 — Motores de lógica de negocio

> Componentes: Business Rules Engine, Validation Engine, Policy
> Engine, Workflow Engine, Approval Engine, State Machine.

## 1. Business Rules Engine

**Trazabilidad:** 🆕 Diseño nuevo a nivel de plataforma. Solo existía
una instancia module-específica (`accounting_rules` para asientos
automáticos, ver `22-modulo-accounting.md`) sin motor genérico
reusable por otros módulos.

- **Objetivo:** permitir que un módulo de negocio declare reglas
  condicionales de la forma `SI <condición sobre datos del dominio>
ENTONCES <acción>` de forma configurable (no hardcodeada en código),
  auditable y testeable de forma aislada — sin construir un DSL propio
  cada vez que un módulo lo necesita (contabilidad ya lo necesitó,
  impuestos y CRM lo van a necesitar).
- **Responsabilidad:** evaluar un conjunto de reglas activas contra un
  contexto de datos inmutable (nunca muta el contexto de entrada,
  produce un resultado de evaluación); resolver conflictos entre
  reglas mediante prioridad explícita (no orden de declaración
  implícito); registrar qué reglas se evaluaron y cuál disparó, para
  que una acción automática (p. ej. un asiento contable generado
  solo) sea explicable después.
- **Dependencias:** `Validation Engine` (las condiciones de una regla
  se expresan con el mismo lenguaje de predicados), `Audit Framework`
  (toda evaluación con efecto se audita), `Domain Events` (una regla
  disparada puede publicar un evento en vez de ejecutar una acción
  directa, para no acoplar el motor a las escrituras de cada módulo).
- **Interfaces:** `RulesEngineService.evaluate(ruleSetKey, context):
RuleEvaluationResult[]`; cada módulo registra su propio conjunto de
  reglas (`ruleSetKey` namespaced por módulo, p. ej.
  `accounting.auto-journal-entries`) — el motor es agnóstico del
  contenido, cada módulo dueño de sus reglas.
- **Eventos:** `business-rule.triggered` (interno de plataforma, con
  el ID de la regla y el contexto evaluado) — consumido por
  `Audit Framework`; el módulo dueño de la regla decide si además
  publica su propio evento de dominio como consecuencia.
- **Flujo interno:** carga del conjunto de reglas activas para el
  `ruleSetKey` solicitado (cacheadas, invalidadas al editar una
  regla) → evaluación en orden de prioridad → corte en la primera
  regla que matchea si el conjunto es de tipo "primera coincidencia
  gana" (p. ej. selección de plantilla de asiento) o evaluación
  completa si es de tipo "todas las que apliquen" (p. ej. validaciones
  acumulativas) — el tipo se declara por `ruleSetKey`, no es ambiguo
  en runtime.
- **Comunicación con otros componentes:** `contabilidad`
  (`accounting_rules`, ya migrado conceptualmente a este motor sin
  cambiar su modelo de datos), y candidato natural para `impuestos`
  (Fase 16, pendiente) cuando se diseñe.
- **Estrategias de seguridad:** la edición de reglas activas requiere
  el mismo nivel de permiso que la operación que automatizan (reglas
  contables requieren rol financiero) — nunca un rol operativo puede
  alterar el comportamiento automático del sistema.
- **Estrategias de rendimiento:** conjuntos de reglas cacheados por
  `ruleSetKey`; la evaluación en sí es cómputo en memoria sobre el
  contexto ya cargado, sin I/O adicional por regla.
- **Estrategias de escalabilidad:** sin estado compartido entre
  instancias — el cache de reglas se invalida por evento, igual que
  `Feature Flags`.

## 2. Validation Engine

**Trazabilidad:** 📎 Referencia — Zod como fuente única de verdad
FE↔BE ya fijado en
[07-convenciones-y-estandares.md §7](../07-convenciones-y-estandares.md#7-validación)
y [02-arquitectura-modulos-backend.md §3](../02-arquitectura-modulos-backend.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — cada módulo declara sus schemas Zod en
  `shared/`, compartidos entre `backend/dto` y `frontend/forms` sin
  duplicar reglas de validación en dos lenguajes.
- **Dependencias:** ninguna dentro del Core Platform más allá de
  `packages/contracts` (donde viven los schemas de Shared Kernel,
  p. ej. `Money`).
- **Interfaces:** los propios schemas Zod, consumidos vía pipe de
  NestJS (`ZodValidationPipe`) en backend y `react-hook-form` +
  resolver Zod en frontend.
- **Eventos:** ninguno.
- **Comunicación con otros componentes:** `Business Rules Engine` (§1)
  reutiliza el mismo lenguaje de predicados para condiciones simples de
  campo; `Metadata Manager`
  ([04-identidad-de-datos.md §3](./04-identidad-de-datos.md#3-metadata-manager))
  lo usa para validar el shape de `metadata JSONB`.
- **Estrategias de seguridad:** la validación de backend nunca es
  opcional ni se omite confiando en la validación de frontend — el
  frontend valida por UX, el backend por integridad, siempre ambas
  capas activas.
- **Estrategias de rendimiento:** los schemas se compilan una vez
  (import estático), sin costo de parseo de schema en cada request.
- **Estrategias de escalabilidad:** no aplica — sin estado.

## 3. Policy Engine

**Trazabilidad:** 🔗 Extiende diseño existente, con una advertencia
explícita: `security.security_policies` ya existe y el ABAC basado en
atributos está señalado como **candidato pendiente de ADR**, con la
tabla `attribute_policies` explícitamente **no construida todavía**
([15-modulo-security.md §6](../15-modulo-security.md#6-abac)). Este
documento **no** resuelve esa decisión ni diseña ABAC — sería
exactamente el antipatrón que la gobernanza del proyecto prohíbe
(decisiones de este calibre pasan por ADR,
[11-gobernanza-y-adrs.md](../11-gobernanza-y-adrs.md)).

- **Objetivo:** proveer el punto de extensión de plataforma donde,
  cuando el ADR de ABAC se apruebe, se conecte el motor de evaluación
  de políticas — sin bloquear hoy el resto del Core Platform a la
  espera de esa decisión.
- **Responsabilidad actual (alcance limitado a lo ya aprobado):**
  evaluar las políticas RBAC ya diseñadas
  (`security.security_policies`, roles y permisos de
  `15-modulo-security.md`) a través de una interfaz estable, de forma
  que el día que se apruebe ABAC, los módulos consumidores no cambien
  su forma de invocar el Policy Engine — solo cambia la implementación
  interna.
- **Dependencias:** `Security Context`, `15-modulo-security.md` (RBAC).
- **Interfaces:** `PolicyEngineService.can(actor, action, resource):
boolean` — el contrato ya está diseñado para aceptar `resource` con
  atributos (preparado para ABAC futuro) aunque hoy la implementación
  solo evalúe rol/permiso.
- **Eventos:** `policy.denied` — consumido por `Audit Framework`
  (todo rechazo de autorización es evidencia de seguridad).
- **Flujo interno:** hoy delega 100% en la resolución RBAC ya
  documentada; el punto de extensión para reglas por atributo queda
  explícitamente marcado en el código con referencia al ADR pendiente,
  para que no se implemente por la puerta de atrás sin pasar por
  gobernanza.
- **Comunicación con otros componentes:** todo guard de autorización
  de cualquier módulo pasa por aquí, nunca implementa su propia
  verificación de rol ad-hoc.
- **Estrategias de seguridad:** es, junto con `Security Context`, el
  componente de mayor sensibilidad de todo el Core Platform — cualquier
  cambio a su lógica de evaluación requiere revisión de seguridad
  dedicada, no solo code review estándar.
- **Estrategias de rendimiento:** resultado de evaluación cacheado por
  `(actor, action, resource-type)` con invalidación al cambiar
  asignación de rol/permiso.
- **Estrategias de escalabilidad:** cache compartido (Redis), igual
  criterio que `Feature Flags` y `License Manager`.

## 4. Workflow Engine

**Trazabilidad:** 🔗 Extiende diseño existente — tablas
`core.workflows` / `workflow_steps` / `workflow_instances` /
`workflow_instance_steps` ya diseñadas
([database/logico/01-core.md](../../database/logico/01-core.md)), sin
flujo de ejecución documentado en ningún lugar.

- **Objetivo:** ejecutar procesos de negocio multi-paso configurables
  (no solo aprobaciones — ver `Approval Engine` §5 para ese caso
  especializado) como onboarding de cliente, ciclo de vida de una
  orden de servicio, o cualquier secuencia de estados con transiciones
  condicionales y efectos secundarios por paso.
- **Responsabilidad:** instanciar un workflow a partir de su
  definición (`workflow_steps`), avanzar una instancia de un paso al
  siguiente evaluando las condiciones de transición (vía
  `Business Rules Engine`), ejecutar los efectos de cada paso
  (llamado a un handler registrado por el módulo dueño del proceso) y
  persistir el estado de avance de forma que sea recuperable ante un
  reinicio del proceso (no vive solo en memoria).
- **Dependencias:** `Business Rules Engine` (condiciones de
  transición), `State Machine` (§6 — cada paso de workflow es
  internamente una máquina de estados), `Domain Events`,
  `Background Jobs` (pasos asíncronos de larga duración).
- **Interfaces:** `WorkflowEngineService.start(workflowKey, context)`,
  `.advance(instanceId, stepResult)`; los módulos registran handlers
  de paso vía `@WorkflowStepHandler(workflowKey, stepKey)`.
- **Eventos:** `workflow.instance.started`,
  `workflow.instance.step-completed`, `workflow.instance.completed`,
  `workflow.instance.failed` — consumidos por `Notification Center`
  (avisar al responsable del siguiente paso) y `Audit Framework`.
- **Flujo interno:** cada avance de paso corre dentro de una
  transacción (`Unit Of Work`,
  [09-base-transaccional-y-modelado-ddd.md §3](./09-base-transaccional-y-modelado-ddd.md#3-unit-of-work))
  que persiste el nuevo estado de la instancia antes de disparar
  efectos externos (notificaciones, eventos) — si el handler de un
  paso falla, la instancia queda en el paso anterior, no en un estado
  intermedio inconsistente.
- **Comunicación con otros componentes:** módulo dueño de cada proceso
  de negocio (p. ej. `crm` para onboarding de prospecto a cliente,
  `servicios` — Fase 20, pendiente — para ciclo de vida de orden de
  servicio) registra sus propios `workflow_steps` y handlers; el
  Workflow Engine no conoce semántica de negocio de ningún módulo.
- **Estrategias de seguridad:** cada handler de paso se ejecuta con el
  `Security Context` del actor que originó el avance, nunca con
  privilegios elevados implícitos del motor.
- **Estrategias de rendimiento:** pasos síncronos rápidos ejecutan
  inline; pasos de larga duración (esperar respuesta externa, envío de
  documento a firma) se delegan a `Background Jobs` para no bloquear
  el request HTTP que disparó el avance.
- **Estrategias de escalabilidad:** el estado de instancia vive en
  Postgres (no en memoria de proceso), por lo que cualquier réplica
  puede continuar el avance de una instancia — no hay afinidad de
  instancia a un pod específico.

## 5. Approval Engine

**Trazabilidad:** 🔗 Extiende diseño existente — tablas
`core.approvals` / `approval_steps` / `approval_matrices` ya
referenciadas desde `15-modulo-security.md §6` (ejemplo de ABAC) y
`21-modulo-purchases.md` (aprobación de solicitudes de compra), sin
flujo dedicado documentado.

- **Objetivo:** resolver, para cualquier documento de negocio que lo
  requiera (solicitud de compra, ajuste de inventario, nota de
  crédito por encima de un umbral), la cadena de aprobadores
  aplicable y el estado de avance de esa cadena.
- **Responsabilidad:** resolver la matriz de aprobación aplicable
  (`approval_matrices`) según el tipo de documento, monto y alcance
  organizacional (company/branch) del solicitante; crear la instancia
  de aprobación con sus pasos; notificar al aprobador de turno;
  registrar cada decisión (aprobar/rechazar/delegar) de forma
  inmutable.
- **Dependencias:** `Workflow Engine` (una aprobación es un caso
  particular y especializado de workflow — reutiliza el mismo motor de
  avance de pasos, no lo reimplementa), `Policy Engine` (verificar que
  el aprobador tiene realmente el permiso para aprobar ese tipo/monto
  de documento), `Notification Center`.
- **Interfaces:** `ApprovalEngineService.request(documentType,
documentId, context)`, `.decide(approvalId, stepId, decision,
actor)`.
- **Eventos:** `approval.requested`, `approval.step-decided`,
  `approval.approved`, `approval.rejected` — el módulo dueño del
  documento (p. ej. `compras`) se suscribe a `approval.approved` /
  `approval.rejected` para continuar su propio flujo (crear la orden
  de compra desde la solicitud aprobada, por ejemplo).
- **Flujo interno:** al solicitarse aprobación, se resuelve la matriz
  aplicable y se crea una instancia de `Workflow Engine` especializada
  (workflow de tipo "aprobación secuencial" o "aprobación paralela",
  según la matriz); cada decisión de un aprobador avanza el workflow
  subyacente; si un aprobador rechaza, la instancia se marca fallida
  y se detiene sin avanzar a los siguientes pasos.
- **Comunicación con otros componentes:** el documento de negocio
  (venta, compra, ajuste) nunca cambia su propio estado directamente
  a partir de una decisión de aprobación — reacciona al evento
  `approval.approved`/`approval.rejected`, manteniendo el patrón
  módulo-dueño intacto (el Approval Engine no escribe en tablas de
  otros módulos).
- **Estrategias de seguridad:** un aprobador solo puede decidir si
  `Policy Engine` confirma que su rol/alcance lo autoriza para ese
  monto y tipo de documento específico — la sola existencia de una
  notificación de aprobación pendiente no es autorización suficiente.
- **Estrategias de rendimiento:** resolución de matriz de aprobación
  cacheada por `(documentType, company)`, invalidada al editar una
  matriz.
- **Estrategias de escalabilidad:** heredadas de `Workflow Engine` —
  estado persistido, sin afinidad de instancia.

## 6. State Machine

**Trazabilidad:** 🔗 Extiende diseño existente — el patrón
`<entidad>_status_history` está nombrado en
[database/05-estrategia-auditoria.md §1](../../database/05-estrategia-auditoria.md#1-status-history)
pero nunca documentado como motor genérico.

- **Objetivo:** dar a cada entidad de negocio con ciclo de vida (una
  factura que pasa de borrador a emitida a pagada, una orden que pasa
  de pendiente a confirmada a despachada) transiciones de estado
  explícitas, validadas y auditable — prohibiendo transiciones no
  declaradas (p. ej. de "pagada" directamente a "borrador").
- **Responsabilidad:** cada módulo dueño declara, para cada entidad
  con ciclo de vida, su propia definición de estados y transiciones
  permitidas (no es una máquina de estados global — cada entidad tiene
  la suya, el motor es el mecanismo compartido de evaluación); validar
  que una transición solicitada esté permitida desde el estado actual;
  registrar la transición en `<entidad>_status_history`.
- **Dependencias:** `Audit Framework` (toda transición es, por
  definición, un evento auditable), `Domain Events`.
- **Interfaces:** `StateMachineService.transition(entityType,
entityId, fromState, toState, context)` — valida contra la
  definición registrada por el módulo dueño y lanza excepción de
  negocio (`ERR_INVALID_STATE_TRANSITION`) si no está permitida.
- **Eventos:** publica un evento de dominio genérico por transición
  (`<Entidad>StatusChanged`) además de cualquier evento específico que
  el módulo dueño decida publicar adicionalmente (p. ej.
  `VentaConfirmada` es más rico semánticamente que el genérico
  `VentaStatusChanged`, y ambos pueden coexistir).
- **Flujo interno:** la transición ocurre dentro de la misma
  transacción (`Unit Of Work`) que la operación de negocio que la
  origina — nunca como paso separado que pueda desincronizarse del
  cambio real de estado en la tabla principal.
- **Comunicación con otros componentes:** `Workflow Engine` usa esto
  internamente para el estado de cada paso; cualquier módulo con
  entidades de ciclo de vida (prácticamente todos los módulos
  transaccionales) lo consume directamente.
- **Estrategias de seguridad:** las transiciones sensibles (p. ej.
  anular una factura ya emitida) pueden requerir permiso adicional
  específico por transición, no solo por entidad — declarado en la
  misma definición de estados del módulo dueño.
- **Estrategias de rendimiento:** la definición de estados/transiciones
  es estática (declarada en código, no en base de datos), por lo que
  la validación de "¿es válida esta transición?" es una consulta en
  memoria sin I/O.
- **Estrategias de escalabilidad:** no aplica — sin estado compartido
  más allá de la propia tabla de la entidad, ya cubierta por la
  estrategia general de particionamiento/índices.
