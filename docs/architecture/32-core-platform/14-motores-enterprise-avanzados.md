# 32.14 — Motores Enterprise avanzados

> Componentes: BPM Engine, Document Management System, Digital
> Signature, Task Engine, Integration Engine. Escrito 2026-07-21, en
> respuesta a un pedido explícito del usuario ("Fase 2" de su propia
> secuencia de trabajo — ver la nota de desambiguación en
> [FASE2_MOTORES_ENTERPRISE.md §0](../FASE2_MOTORES_ENTERPRISE.md#0-nota-de-desambiguación-dos-cosas-distintas-se-llaman-fase-2)
> para no confundirla con la numeración de
> [13-plan-de-implementacion-fase-2.md](./13-plan-de-implementacion-fase-2.md)).
> Mismas 11 dimensiones que pidió el usuario para cada motor: Objetivo,
> Arquitectura, Tablas, Relaciones, Eventos, Flujo interno,
> Dependencias, Permisos, Auditoría, Seguridad, Escalabilidad — un
> superset ligeramente distinto de las 10 dimensiones que usa el resto
> de `32-core-platform/` (ver
> [README.md §4](./README.md#4-convención-de-trazabilidad-usada-en-cada-componente)),
> se respeta la nomenclatura exacta pedida en vez de forzarla al
> formato de los documentos 01-13.
>
> Los otros 6 motores que el usuario pidió en el mismo mensaje
> (Workflow Engine, BPM... ver aclaración abajo, Business Rules Engine,
> Approval Engine, Notification Engine, Event Engine, Scheduler,
> Task Engine — ver la lista completa de mapeo) **ya tienen diseño
> completo** en `05-motores-de-logica-de-negocio.md`,
> `06-eventos-y-mensajeria.md` y `08-frameworks-de-infraestructura.md` —
> no se repiten acá. Este documento contiene únicamente los 5 que
> genuinamente no existían como pieza de diseño unificada.

## 0. Por qué estos 5 y no los 11

Verificado contra los 13 documentos ya existentes de `32-core-platform/`
antes de escribir una sola línea nueva (mismo método que
`13-plan-de-implementacion-fase-2.md §1` ya usó para el pedido anterior
de 23 componentes):

| Motor pedido                   | Estado                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Workflow Engine                | ✅ Ya diseñado — [05 §4](./05-motores-de-logica-de-negocio.md#4-workflow-engine)                                          |
| Business Rules Engine          | ✅ Ya diseñado — [05 §1](./05-motores-de-logica-de-negocio.md#1-business-rules-engine)                                    |
| Approval Engine                | ✅ Ya diseñado — [05 §5](./05-motores-de-logica-de-negocio.md#5-approval-engine)                                          |
| Notification Engine            | ✅ Ya diseñado como "Notification Center" — [06 §4](./06-eventos-y-mensajeria.md#4-notification-center)                   |
| Event Engine                   | ✅ Ya diseñado como "Domain Events + Event Bus + Message Broker" — [06 §1-3](./06-eventos-y-mensajeria.md)                |
| Scheduler                      | ✅ Ya diseñado — [08 §5](./08-frameworks-de-infraestructura.md#5-scheduler)                                               |
| **BPM Engine**                 | 🆕 No existía — §1 de este documento                                                                                      |
| **Document Management System** | 🔗 Solo la mitad (`File Manager`, §3 de `08`, cubre subida/versionado; falta ciclo de vida/categorización/retención) — §2 |
| **Digital Signature**          | 🔗 Solo las tablas (`signatures`/`signature_requests`) y un método stub; sin flujo — §3                                   |
| **Task Engine**                | 🆕 No existía — §4 de este documento                                                                                      |
| **Integration Engine**         | 🔗 Solo las tablas (`integrations`/`integration_credentials`/`edi_transactions`/`webhook_*`); sin motor genérico — §5     |

## 1. BPM Engine

**Trazabilidad:** 🔗 Extiende diseño existente — `Workflow Engine`
([05 §4](./05-motores-de-logica-de-negocio.md#4-workflow-engine)) ya
resuelve la ejecución de un proceso multi-paso con transiciones
condicionales. BPM Engine **no lo reimplementa** — agrega la capa que
`Workflow Engine` explícitamente no cubre: procesos con más de un
posible camino (gateways paralelos/exclusivos), versionado de
definición de proceso, y SLA/escalamiento a nivel de proceso completo
(no solo por paso).

- **Objetivo:** permitir que un módulo de negocio defina procesos con
  ramificación real (no solo secuencia lineal) — p. ej. "onboarding de
  cliente" que se bifurca en paralelo entre KYC y aprobación de línea
  de crédito, uniéndose recién cuando ambas ramas terminan — con
  control de SLA por proceso completo ("este proceso no debería tardar
  más de 48h") y capacidad de versionar la definición sin afectar
  instancias ya en curso.
- **Arquitectura:** capa de orquestación que se sienta **sobre**
  `Workflow Engine`, no al lado — un proceso BPM se compila a una
  definición de `workflow_steps` con metadata adicional de tipo de
  compuerta (`gateway_type: 'exclusive' | 'parallel' | 'inclusive'`,
  almacenada en la columna `metadata JSONB` universal que
  `workflow_steps` ya tiene — **cero tabla nueva**, reutiliza el
  patrón universal ya fijado en `01-modelo-conceptual.md §1.1`). El
  Workflow Engine sigue siendo el único que persiste y avanza estado de
  instancia; BPM Engine solo interpreta la metadata de compuerta al
  decidir cuál(es) paso(s) siguiente(s) activar.
- **Tablas:** reutiliza `core.workflows` / `workflow_steps` /
  `workflow_instances` / `workflow_instance_steps` (ya existentes, ver
  `05 §4`). **Gap real identificado, no resuelto acá:** estas tablas no
  tienen columna de versión de definición — hoy editar un
  `workflow_step` afecta instancias en curso, lo que BPM Engine
  necesita evitar (definiciones inmutables una vez publicadas, ver
  Seguridad). Candidato de Fase 3: una columna `definition_version` en
  `workflows`, o una tabla `workflow_definition_versions` — **no se
  propone el diseño de esa tabla acá** (fuera de alcance "no
  escribas SQL"), se documenta como prerrequisito real antes de
  implementar versionado.
- **Relaciones:** `workflow_instance_steps` de tipo gateway paralelo
  crea múltiples filas activas simultáneas para la misma instancia (una
  por rama) — el Workflow Engine ya soporta esto estructuralmente (una
  instancia puede tener N pasos activos), BPM Engine solo decide cuándo
  crear más de uno a la vez y cuándo "unir" ramas (el paso de unión no
  avanza hasta que todas las ramas que confluyen en él completaron).
- **Eventos:** `bpm.process.started`, `bpm.process.branch-forked`,
  `bpm.process.branch-joined`, `bpm.process.completed`,
  `bpm.process.sla-breached` — los primeros 4 son especializaciones de
  los eventos genéricos de `workflow.instance.*` (`05 §4`); el último es
  nuevo, disparado por `Scheduler` cuando una instancia supera el SLA
  configurado para su definición.
- **Flujo interno:** definición de proceso (con sus compuertas
  declaradas) → publicación (inmutable desde ese momento) → instancia
  creada vía `Workflow Engine` → en cada paso, BPM Engine consulta la
  metadata de compuerta: paso normal avanza como siempre; compuerta
  exclusiva evalúa una condición (`Business Rules Engine`) para elegir
  una sola rama; compuerta paralela activa todas sus ramas a la vez;
  paso de unión espera a que todas sus ramas de origen completen antes
  de avanzar → si se configuró SLA, `Scheduler` registra un job de
  verificación que dispara `bpm.process.sla-breached` si la instancia
  sigue activa pasado el plazo.
- **Dependencias:** `Workflow Engine`, `Business Rules Engine`,
  `State Machine`, `Scheduler` (SLA), `Task Engine` (§4 — escalamiento
  humano cuando se rompe un SLA), `Notification Center`.
- **Permisos:** publicar o versionar una definición de proceso requiere
  permiso administrativo del módulo dueño del proceso (mismo criterio
  que `Business Rules Engine`: nunca un rol operativo puede alterar el
  comportamiento automático); iniciar una instancia hereda el permiso
  que el módulo dueño ya exige para la acción de negocio que la
  origina (BPM Engine no agrega una capa de permiso propia sobre eso).
- **Auditoría:** cada bifurcación, unión y ruptura de SLA es un evento
  de dominio, consumido por `Audit Framework` — reconstruible después:
  "¿por qué este proceso tardó 3 días?" tiene respuesta exacta (qué
  rama se demoró, si hubo SLA roto).
- **Seguridad:** definiciones publicadas son inmutables — "editar" un
  proceso con instancias en curso siempre crea una versión nueva, nunca
  muta la definición que esas instancias ya están ejecutando (mismo
  principio que evita el problema real que `02a-restricciones-e-indices.md`
  ya resolvió para tablas de negocio: nunca romper lo que ya está en
  vuelo).
- **Escalabilidad:** sin estado propio más allá de lo que `Workflow
Engine` ya persiste en Postgres — la evaluación de compuertas es
  cómputo en memoria sobre metadata ya cargada, sin I/O adicional por
  decisión de bifurcación.

## 2. Document Management System

**Trazabilidad:** 🔗 Extiende diseño existente — `File Manager`
([08 §3](./08-frameworks-de-infraestructura.md#3-file-manager)) ya
resuelve subida/versionado/hash de integridad sobre `core.files` /
`document_versions`. Este motor agrega la capa de **gestión documental
de negocio** que `File Manager` explícitamente no cubre: categorización
(`core.document_types`, ya existe con `retention_period_months` — nunca
consumida por ningún flujo documentado hasta ahora), ciclo de vida, y
vínculo formal a la entidad de negocio que originó el documento
(`core.documents.source_module`/`source_entity_id`, ya existen,
también sin flujo documentado).

- **Objetivo:** dar a cualquier documento de negocio (contrato,
  comprobante, política interna, factura en PDF) un ciclo de vida
  completo — clasificado por tipo, vinculado a la entidad que lo
  originó, con retención y disposición automática cuando corresponde —
  en vez de ser solo un archivo suelto en un bucket.
- **Arquitectura:** capa de negocio sobre `File Manager` +
  `Storage Framework`. `core.files` sigue siendo el registro físico
  (hash, tamaño, ubicación); `core.documents` es el registro de negocio
  que le da significado (tipo, título, entidad relacionada); ambos ya
  modelados, sin motor que los conecte hasta ahora.
- **Tablas:** `core.documents` (`file_id`, `document_type_id`,
  `source_module`, `source_entity_id`, `title` — ya existen),
  `core.document_types` (`name`, `retention_period_months` — ya
  existe), `core.document_versions`, `core.files` — las 4 ya modeladas,
  cero tabla nueva. **Gap real:** no existe columna de "retención
  legal" (`legal_hold`) que impida la disposición automática de un
  documento bajo litigio/auditoría activa — se documenta como
  necesidad real, no se diseña la columna acá.
- **Relaciones:** `documents.file_id → files` (FK real, mismo schema
  `core`); `documents.document_type_id → document_types` (FK real);
  `documents.source_module`/`source_entity_id` → **ID suelto sin FK**
  hacia la entidad de negocio real (p. ej. `sales.invoices.id`) — mismo
  patrón ya fijado para toda referencia inter-módulo
  ([11-estrategia-integridad.md §4.1](../../database/11-estrategia-integridad.md#41-las-tres-formas-válidas-de-referencia-ya-fijadas-resumen)),
  consistente, no una excepción nueva.
- **Eventos:** `document.classified`, `document.linked`,
  `document.published`, `document.archived`,
  `document.retention-expiring` (aviso previo, vía `Scheduler`),
  `document.disposed` (borrado lógico tras vencer retención, nunca
  físico — ver Seguridad).
- **Flujo interno:** subida real delegada 100% a `File Manager` (sin
  cambios ahí) → clasificación por `document_type_id` (elegido por el
  módulo que sube el documento, o inferido por convención — decisión de
  implementación) → vínculo a la entidad de origen
  (`source_module`+`source_entity_id`) → `Scheduler` calcula la fecha
  de expiración de retención (`created_at` + `document_types.retention_period_months`)
  y programa un job de aviso previo + uno de disposición → al vencer,
  si no hay `legal_hold` activo (gap de §2, ver arriba), el documento
  se marca `deleted_at` (soft-delete universal, nunca purga física
  automática).
- **Dependencias:** `File Manager`, `Storage Framework`,
  `State Machine` (ciclo de vida borrador→publicado→archivado),
  `Scheduler` (retención), `Policy Engine` (visibilidad por tipo de
  documento), `Digital Signature` (§3 — un documento puede requerir
  firma antes de pasar a "publicado").
- **Permisos:** la visibilidad de un documento se resuelve por
  `document_type_id` vía `Policy Engine` (p. ej. "contrato legal" solo
  visible para roles legal/administración), no fila por fila — evita
  necesitar una ACL por documento a escala de millones de filas.
- **Auditoría:** todo evento de §2 fluye a `Audit Framework`;
  `document_versions` es en sí mismo un rastro de auditoría de
  contenido (qué versión existía en qué momento).
- **Seguridad:** descarga siempre vía URL firmada de corta duración
  (heredado de `Storage Framework`/`File Manager`, sin cambios);
  disposición por vencimiento de retención es **siempre** borrado
  lógico, nunca físico — coherente con que ninguna tabla del sistema
  hace `DELETE` real fuera de una purga administrativa explícita y
  auditada (`docs/database/05-estrategia-auditoria.md`).
- **Escalabilidad:** contenido binario nunca en Postgres (heredado de
  `Storage Framework`); búsqueda por metadata (tipo, entidad de origen,
  título) usa los mismos índices ya cubiertos por la estrategia general
  — sin necesidad de un motor de búsqueda de texto completo dedicado en
  el alcance actual (candidato de Fase 3 si el volumen de documentos y
  la necesidad de buscar por contenido, no solo metadata, lo justifica).

## 3. Digital Signature

**Trazabilidad:** 🔗 Extiende diseño existente — `File Manager` ya
declara un método `.sign(fileId, actor)` y las tablas `core.signatures`
/ `signature_requests` ya existen (`document_id`, `signer_user_id`
_o_ `signer_external_name`, `signed_at`, `signature_image_file_id` en
`signatures`; `document_id`, `status`, `due_at` en `signature_requests`)
— sin flujo de solicitud→firma→verificación documentado en ningún
lugar hasta ahora.

- **Objetivo:** permitir que cualquier documento de negocio (gestionado
  por `Document Management System`, §2) sea firmado por uno o varios
  firmantes — usuarios internos del sistema o terceros externos sin
  cuenta — con un registro defendible de quién firmó, cuándo, y con
  qué consentimiento.
- **Arquitectura:** motor de solicitud/captura de firma, no un
  proveedor criptográfico — importante ser explícito con el nivel de
  madurez real: hoy el modelo de datos existente (`signer_external_name`
  como texto libre, `signature_image_file_id` como imagen) corresponde
  a **Firma Electrónica Simple (SES)** — equivalente a "aceptar
  haciendo clic" o firma manuscrita capturada como imagen —, **no**
  Firma Avanzada ni Cualificada (que exigirían certificado digital,
  hash del documento en el momento exacto de la firma, y no repudio
  criptográfico — ninguna columna para eso existe hoy). Se documenta
  así para que nadie asuma valor legal que el modelo actual no soporta
  todavía.
- **Tablas:** `core.signature_requests` (`document_id`, `status`
  default `'pending'`, `due_at`), `core.signatures` (`document_id`,
  `signer_user_id` nullable, `signer_external_name` nullable,
  `signed_at`, `signature_image_file_id` nullable) — ambas ya
  existentes, cero tabla nueva. **Gap real para subir de madurez a
  Firma Avanzada** (no diseñado acá, solo documentado como
  prerrequisito real): columnas para hash del documento al momento de
  firmar, identificador de certificado/clave del firmante, e
  IP/dispositivo — ninguna existe hoy.
- **Relaciones:** `signature_requests.document_id → documents` (FK
  real); `signatures.document_id → documents` (FK real);
  `signatures.signer_user_id → users` (FK real, nullable — nulo cuando
  el firmante es externo); `signatures.signature_image_file_id → files`
  (FK real, nullable — nulo cuando la firma es solo un clic de
  consentimiento sin imagen capturada).
- **Eventos:** `signature.requested`, `signature.signed`,
  `signature.declined`, `signature.request-expired` (vía `Scheduler`
  contra `due_at`).
- **Flujo interno:** `Document Management System` u otro módulo de
  negocio solicita firma sobre un documento ya existente → se crea
  `signature_requests` (`status='pending'`, `due_at` opcional) → si el
  firmante es un usuario interno, `Notification Center` lo notifica
  directamente; si es externo, se genera un enlace de acceso acotado
  (mismo mecanismo de URL firmada de corta duración que
  `Storage Framework`, reutilizado, no reinventado) → el firmante
  provee su consentimiento (nombre + opcionalmente una imagen de firma
  subida vía `File Manager`) → se crea la fila `signatures`
  correspondiente → si el documento requiere múltiples firmantes en
  secuencia, se reutiliza el mecanismo de avance de `Workflow Engine`
  (una solicitud de firma multi-parte **es** un caso particular de
  workflow, mismo criterio que ya aplica `Approval Engine` sobre sí
  mismo) → al completarse todas las firmas requeridas,
  `signature_requests.status` pasa a `'completed'` y
  `Document Management System` transiciona el documento a su estado
  final vía `State Machine`.
- **Dependencias:** `File Manager`, `Document Management System`,
  `Workflow Engine` (firma multi-parte secuencial), `Notification
Center`, `State Machine`.
- **Permisos:** solo un actor con permiso sobre la entidad de negocio
  de origen del documento (p. ej. el vendedor dueño de un contrato de
  venta) puede iniciar una solicitud de firma; un firmante solo puede
  actuar sobre su propia `signature_requests` asignada, nunca sobre la
  de otro (validado por `Policy Engine`, no por saber la URL).
- **Auditoría:** cada evento de §3 es inmutable y fluye a
  `Audit Framework` — `signed_at` + identidad del firmante ya
  constituyen el registro mínimo defendible al nivel SES declarado
  arriba.
- **Seguridad:** el nivel de madurez (SES) se documenta explícitamente
  en cualquier superficie legal/UI que lo muestre — nunca se presenta
  como firma cualificada sin serlo. Subir a Firma Avanzada/Cualificada
  requiere su propio ADR (proveedor de certificados, integración con
  una PKI o un servicio externo tipo DocuSign/Adobe Sign) — **no se
  decide en este documento**, mismo criterio de gobernanza que
  `Policy Engine` ya aplicó para no diseñar ABAC sin ADR.
- **Escalabilidad:** volumen bajo respecto a las tablas transaccionales
  centrales — sin necesidad de particionamiento a la escala actual;
  reevaluar si el volumen de documentos firmados crece al ritmo de,
  por ejemplo, facturas (que sí están particionadas).

## 4. Task Engine

**Trazabilidad:** 🆕 Diseño nuevo — no existe ningún concepto de
"bandeja de tareas" unificada en ningún documento previo. Distinto,
deliberadamente, de `Background Jobs`
([08 §6](./08-frameworks-de-infraestructura.md#6-background-jobs)):
`Background Jobs` ejecuta **cómputo asíncrono** sin intervención
humana (renderizar un PDF, enviar un email); `Task Engine` gestiona
**trabajo pendiente de una persona** (decidir una aprobación, firmar un
documento, completar un paso de workflow asignado a un usuario). Son
conceptos ortogonales que comparten la palabra "trabajo" mucho menos de
lo que el nombre sugiere — se documenta la distinción explícitamente
para que no se confundan ni se fusionen por conveniencia.

- **Objetivo:** darle a cada usuario una única bandeja de "lo que tengo
  pendiente de hacer" que agregue, sin duplicar estado, los pasos de
  workflow asignados a él, las aprobaciones pendientes de su decisión,
  y las solicitudes de firma que le corresponden — en vez de que cada
  motor tenga su propia notificación aislada y el usuario tenga que
  buscar en 3 lugares distintos.
- **Arquitectura:** **capa de agregación de solo lectura, nunca fuente
  de verdad.** Task Engine no persiste su propio estado de "pendiente"
  — lee el estado que `Workflow Engine`, `Approval Engine` y
  `Digital Signature` ya mantienen cada uno en su propia tabla, y lo
  presenta unificado. Esta decisión es deliberada: duplicar el estado
  en una tabla propia crearía una segunda fuente de verdad que podría
  desincronizarse (¿qué pasa si alguien completa un paso de workflow
  directamente y la copia en la bandeja de tareas no se actualiza?) —
  el mismo tipo de riesgo que
  [11-estrategia-integridad.md §4.3](../../database/11-estrategia-integridad.md#43-comportamiento-ante-borrado--ya-fijado-sin-cambios)
  ya identificó para el soft-delete con hijos activos, aplicado acá
  preventivamente.
- **Tablas:** **ninguna tabla propia.** Consulta directamente
  `core.workflow_instance_steps` (filtrado por asignación pendiente),
  `core.approval_steps` (pendientes de decisión), y
  `core.signature_requests` (`status='pending'`) — las 3 ya existentes.
  **Candidato real de Fase 3, no diseñado acá:** si el `JOIN`/`UNION`
  de las 3 fuentes se vuelve un cuello de botella a escala de millones
  de tareas activas, una tabla de proyección materializada (poblada por
  los mismos domain events que cada motor ya publica, nunca escrita
  directamente por el usuario) resolvería el rendimiento sin introducir
  una segunda fuente de verdad — se documenta la opción, no se diseña
  su schema.
- **Relaciones:** de solo lectura hacia las 3 tablas de §Tablas — Task
  Engine no declara ninguna FK propia, no es dueño de ninguna fila.
- **Eventos:** consume (nunca produce el estado de negocio)
  `workflow.instance.step-completed`, `approval.step-decided`,
  `signature.signed` para saber cuándo un ítem debe desaparecer de la
  bandeja de alguien. Sí produce eventos propios de **interacción con
  la bandeja**: `task.claimed` (cuando un ítem asignado a una cola/rol
  es tomado por una persona específica), `task.delegated`.
- **Flujo interno:** un usuario abre su bandeja → Task Engine consulta,
  scoped a su identidad (asignación directa) y a los roles/colas a los
  que pertenece (asignación por cola — p. ej. "cualquier analista de
  cuentas por pagar"), las 3 fuentes de §Tablas → si un ítem está
  asignado a una cola, el primer usuario que lo reclama genera
  `task.claimed` (visible para el resto de la cola, evita que dos
  personas trabajen el mismo ítem sin saberlo) → la acción real
  (aprobar, firmar, completar paso) la ejecuta el motor dueño del ítem,
  nunca Task Engine directamente — Task Engine solo enruta al usuario
  hacia la acción correcta.
- **Dependencias:** `Workflow Engine`, `Approval Engine`,
  `Digital Signature`, `Notification Center` (recordatorios de SLA),
  `Scheduler` (barrido de tareas vencidas), `Policy Engine` (resolución
  de qué colas/roles pertenecen a un usuario).
- **Permisos:** un usuario solo ve tareas asignadas directamente a él o
  a una cola/rol al que pertenece — nunca la bandeja personal de otro
  usuario, validado por `Policy Engine` en cada consulta de
  agregación, no por confiar en un filtro de frontend.
- **Auditoría:** `task.claimed`/`task.delegated` son eventos auditables
  propios de este motor (quién tomó qué ítem de una cola compartida,
  relevante para disputas de "¿quién debía hacer esto?"); la decisión
  de negocio en sí (aprobar/firmar/completar) la audita el motor dueño,
  sin duplicación.
- **Seguridad:** reclamar un ítem de una cola compartida es en sí mismo
  un evento auditado — evita reasignación silenciosa sin rastro.
- **Escalabilidad:** consulta de agregación sin estado propio,
  cacheable por usuario con TTL corto (`Cache Framework`); si el
  `JOIN`/`UNION` fan-out se vuelve costoso a escala, el candidato de
  proyección materializada de §Tablas resuelve el rendimiento sin
  cambiar la interfaz pública (`TaskEngineService.getInbox(userId)`
  seguiría devolviendo lo mismo).

## 5. Integration Engine

**Trazabilidad:** 🔗 Extiende diseño existente — las 5 tablas que este
motor necesita ya están completamente modeladas: `core.integrations`
(`name`, `integration_type`, `is_enabled`), `core.integration_credentials`
(`integration_id`, `credential_key`, `encrypted_value` — mismo mecanismo
AES-256-GCM que `Notification Center` ya usa), `core.edi_transactions`
(`integration_id`, `direction`, `document_type`, `source_module`,
`source_entity_id`, `raw_payload`, `status`), `core.webhook_subscriptions`
(`integration_id`, `event_code`, `target_url`, `secret_hash`),
`core.webhook_delivery_logs` (`subscription_id`, `http_status`,
`attempt_number`, `succeeded`). Lo que falta, y este documento agrega,
es el motor genérico que las conecta — hoy cada integración externa
(el único ejemplo real construido, WhatsApp Business vía
`WhatsAppGatewayAdapter`,
[06 §4.1](./06-eventos-y-mensajeria.md#41-integración-de-proveedores-por-canal-sms-whatsapp-email--detalle-agregado-por-fase-5))
se construyó ad-hoc sin un patrón formalizado que otro módulo pueda
reutilizar directamente.

- **Objetivo:** dar a cualquier módulo de negocio un mecanismo único
  para conectarse con un sistema externo (autoridad fiscal —
  DGII/SUNAT/SAT, pasarela de pago, socio comercial EDI, ERP de
  terceros) — tanto entrada (recibir datos) como salida (enviar
  datos/notificar vía webhook) — sin que cada integración reinvente su
  propio cliente HTTP, manejo de reintentos, o almacenamiento de
  credenciales.
- **Arquitectura:** registro de integraciones (`integrations` +
  `integration_credentials`, cifradas) + dos flujos de datos
  formalizados por separado porque tienen semántica distinta:
  intercambio de documentos estructurados con un socio externo
  (`edi_transactions`, típicamente órdenes de compra/facturas en un
  formato acordado) y notificación push hacia sistemas suscriptores
  (`webhook_subscriptions`/`webhook_delivery_logs`, típicamente "avisame
  cuando pase X en tu sistema"). El patrón de adaptador por proveedor ya
  usado en `Notification Center` (§4.1 de `06`) se generaliza acá como
  el patrón formal para cualquier integración, no solo canales de
  notificación.
- **Tablas:** `core.integrations`, `core.integration_credentials`,
  `core.edi_transactions`, `core.webhook_subscriptions`,
  `core.webhook_delivery_logs` — las 5 ya existentes, **cero tabla
  nueva**.
- **Relaciones:** `integration_credentials.integration_id → integrations`
  (FK real); `edi_transactions.integration_id → integrations` (FK
  real), `.source_module`/`.source_entity_id` → ID suelto hacia el
  módulo de negocio dueño del documento resultante (mismo patrón que
  `Document Management System §2`); `webhook_subscriptions.integration_id
→ integrations` (FK real); `webhook_delivery_logs.subscription_id →
webhook_subscriptions` (FK real).
- **Eventos:** `integration.inbound-received`,
  `integration.outbound-sent`, `integration.failed`,
  `webhook.delivered`, `webhook.delivery-failed` — consumidos por
  `Notification Center` (alerta ante fallo repetido de una integración
  crítica) y `Audit Framework`.
- **Flujo interno — saliente (webhook):** un módulo de negocio publica
  un evento de dominio (mecanismo ya existente, `Domain Events`) →
  Integration Engine, suscripto vía `Event Bus`, resuelve qué
  `webhook_subscriptions` activas coinciden con ese `event_code` →
  entrega vía POST HTTP firmado con `secret_hash` (HMAC, el suscriptor
  externo verifica autenticidad) → registra el intento en
  `webhook_delivery_logs` → reintento con backoff delegado a
  `Background Jobs` (mismo mecanismo que `Notification Center` ya usa
  para sus propios reintentos, sin inventar uno nuevo).
- **Flujo interno — entrante (EDI):** sistema externo envía un
  documento a un endpoint propio de la integración → el `raw_payload`
  se persiste primero, tal cual, en `edi_transactions`
  (`status='received'`) — nunca se procesa antes de persistir, para no
  perder datos si el parseo falla → un job asíncrono (`Background
Jobs`) valida el payload contra el schema esperado para ese
  `document_type` → si es válido, publica un evento de dominio que el
  módulo de negocio dueño consume para crear su propia entidad (p. ej.
  una orden de compra a partir de un documento EDI 850) y
  `edi_transactions.status` pasa a `'processed'`; si no es válido,
  pasa a `'failed'` con el motivo registrado en `observations`
  (columna universal ya existente, sin campo nuevo).
- **Dependencias:** `Event Bus`, `Background Jobs`, `Notification
Center` (alertas de fallo), `Encryption Utilities`
  ([10-utilidades-comunes.md §7](./10-utilidades-comunes.md#7-encryption-utilities)),
  `Policy Engine`.
- **Permisos:** registrar una integración nueva o ver (aunque sea en
  forma cifrada) sus credenciales requiere permiso administrativo de
  `administracion`/`configuracion` — nunca un rol operativo, mismo
  nivel de gobernanza que editar `Business Rules Engine`.
- **Auditoría:** `edi_transactions`/`webhook_delivery_logs` son en sí
  mismos un log de auditoría append-only de toda transacción
  entrante/saliente. **Gap real identificado:** no existe un evento
  distinto para "credencial de integración fue desencriptada/leída" —
  hoy esa lectura es invisible para `Audit Framework`, a diferencia de
  cualquier otra operación sensible del sistema. Se recomienda agregar
  un evento `integration.credential-accessed` (usando el mecanismo de
  `Domain Events` ya existente, sin tabla nueva) — no implementado en
  este documento, queda como recomendación explícita para Fase 3.
- **Seguridad:** credenciales siempre cifradas en reposo (mismo
  mecanismo AES-256-GCM, una clave por tipo de integración vía
  `keyId`, igual que `Notification Center`); entregas de webhook
  firmadas (HMAC) para que el suscriptor pueda verificar autenticidad;
  todo `raw_payload` entrante es **dato no confiable** hasta pasar
  validación de schema — ningún módulo de negocio consume
  `edi_transactions.raw_payload` directamente, siempre a través del
  evento de dominio ya validado.
- **Escalabilidad:** procesamiento entrante/saliente siempre asíncrono
  vía `Background Jobs` (nunca bloquea el request que lo originó,
  mismo patrón que `Notification Center`); reintentos de webhook usan
  la misma política de backoff ya diseñada para `Background Jobs`, sin
  mecanismo nuevo.

## 6. Trazabilidad

| Punto pedido                                                                            | Cerrado en                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diseño completo de los 5 motores genuinamente faltantes, con las 11 dimensiones pedidas | §1-5                                                                                                                                                                                               |
| No repetir los 6 motores ya diseñados                                                   | §0 — mapeados, no reproducidos                                                                                                                                                                     |
| No cambiar la arquitectura existente                                                    | 0 tablas nuevas propuestas — los 5 motores reutilizan 100% de tablas ya modeladas, con gaps documentados explícitamente en vez de resueltos por SQL no pedido                                      |
| Preparado para integrarse sin romper compatibilidad                                     | Cada motor declara sus dependencias hacia componentes ya construidos (Workflow Engine, File Manager, Notification Center, Event Bus, Background Jobs) sin modificar la interfaz pública de ninguno |
