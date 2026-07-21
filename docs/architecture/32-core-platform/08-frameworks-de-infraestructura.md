# 32.08 — Frameworks de infraestructura

> Componentes: Cache Framework, Storage Framework, File Manager,
> Template Engine, Scheduler, Background Jobs.

## 1. Cache Framework

**Trazabilidad:** 📎 Referencia — diseño completo ya existente: 3 usos
(cache de datos, adaptador WebSocket, locks distribuidos) con claves
namespaced en
[08-infraestructura-y-despliegue.md §3](../08-infraestructura-y-despliegue.md#3-redis)
y [12-backend-enterprise.md §1.3](../12-backend-enterprise.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** infraestructura Redis
  ([31-infraestructura-completa.md §2](../31-infraestructura-completa.md)).
- **Interfaces:** `CacheService.get/set/del(key)`,
  `.lock(key, ttl)` (para locks distribuidos).
- **Eventos:** ninguno de dominio.
- **Comunicación con otros componentes:** consumido por prácticamente
  todo componente de este documento que necesita evitar I/O repetido
  (`Feature Flags`, `License Manager`, `Policy Engine`,
  `Currency Manager`, `Reference Data`) — cada uno con su propio
  namespace de clave para evitar colisiones.
- **Estrategias de seguridad:** claves siempre prefijadas por
  `tenantId` cuando el dato cacheado es tenant-scoped, mismo principio
  de aislamiento que `Tenant Manager`.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §11` — Redis Sentinel para alta
  disponibilidad, ya dimensionado.

## 2. Storage Framework

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
buckets por módulo, URLs firmadas, alta disponibilidad en
[08-infraestructura-y-despliegue.md §5](../08-infraestructura-y-despliegue.md#5-minio)
y [31-infraestructura-completa.md §6, §10](../31-infraestructura-completa.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** infraestructura MinIO.
- **Interfaces:** `StorageService.upload/download/getSignedUrl(bucket,
key)`.
- **Eventos:** ninguno de dominio propio — `File Manager` (§3)
  construye sobre esta capa y sí publica eventos de dominio.
- **Comunicación con otros componentes:** `File Manager` es el
  consumidor principal; ningún módulo de negocio habla con MinIO
  directamente, siempre a través de `File Manager`.
- **Estrategias de seguridad:** URLs firmadas con expiración corta,
  nunca URLs públicas permanentes — ver referencia para el detalle.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §6, §10` — erasure coding, ya
  dimensionado.

## 3. File Manager

**Trazabilidad:** 🔗 Extiende diseño existente — tablas `core.files` /
`documents` / `document_versions` / `signatures` ya diseñadas
([database/logico/01-core.md](../../database/logico/01-core.md)),
mencionado como repositorio transversal en
[04-catalogo-modulos-negocio.md](../04-catalogo-modulos-negocio.md)
(módulo `documentos`), sin flujo de subida/versionado documentado.

- **Objetivo:** dar a cualquier módulo de negocio una forma
  consistente de adjuntar, versionar y firmar archivos (comprobantes,
  contratos, imágenes de producto, PDFs de factura) sin que cada
  módulo reimplemente su propia lógica de subida.
- **Responsabilidad:** recibir un archivo, calcular su hash de
  integridad, subirlo a `Storage Framework` en el bucket correcto
  (namespaced por módulo, ver `08 §5`), registrar la fila en
  `core.files` con metadata (tipo MIME, tamaño, entidad relacionada) y,
  si ya existe una versión previa para la misma entidad+propósito,
  crear una nueva fila en `document_versions` en vez de sobrescribir
  (versionado inmutable, nunca se pierde una versión anterior).
- **Dependencias:** `Storage Framework`, `Domain Events`.
- **Interfaces:** `FileManagerService.upload(entityType, entityId,
file, purpose)`, `.getVersions(entityType, entityId, purpose)`,
  `.sign(fileId, actor)` (registra una firma en `signatures`, no
  modifica el archivo).
- **Eventos:** `file.uploaded`, `file.version-created`,
  `file.signed` — consumidos por `Notification Center` (avisar a
  interesados) y `Audit Framework`.
- **Flujo interno:** validación de tipo MIME y tamaño máximo permitido
  (configurable por `purpose`, p. ej. "foto de producto" permite
  imágenes hasta 5MB, "comprobante de pago" permite PDF/imagen hasta
  10MB) → cálculo de hash → subida a `Storage Framework` → registro
  transaccional en `core.files`/`document_versions` — si la subida
  física falla, no se crea el registro (consistencia entre metadata y
  objeto físico).
- **Comunicación con otros componentes:** `Notification Center` adjunta
  archivos gestionados por este componente (p. ej. PDF de factura);
  `Template Engine` (§4) genera el archivo que luego este componente
  almacena y versiona.
- **Estrategias de seguridad:** todo acceso de descarga pasa por
  `Policy Engine` (¿tiene el actor permiso sobre la entidad
  relacionada?) antes de emitir la URL firmada de `Storage Framework`
  — el archivo nunca es públicamente accesible por su sola ubicación
  en el bucket.
- **Estrategias de rendimiento:** el hash de integridad permite
  detectar y evitar subir contenido duplicado byte-a-byte (dedupe a
  nivel de bucket, extensión posible, no requerida en el alcance
  base).
- **Estrategias de escalabilidad:** heredadas de `Storage Framework` —
  sin estado en la capa de aplicación, la subida es un stream directo
  al bucket.

## 4. Template Engine

**Trazabilidad:** 🔗 Extiende diseño existente — tablas
`core.templates` / `template_translations` ya diseñadas
([database/logico/01-core.md](../../database/logico/01-core.md)), sin
motor de renderizado documentado.

- **Objetivo:** generar documentos de salida (facturas en PDF,
  correos de notificación, reportes exportables) a partir de una
  plantilla versionada y datos de negocio, con soporte multi-idioma
  (vía `template_translations`) sin que cada módulo implemente su
  propio renderizador.
- **Responsabilidad:** resolver la plantilla activa para
  `(templateKey, idioma, company)` — una company puede personalizar el
  membrete/pie de página de su factura sin tocar la plantilla base del
  sistema —, interpolar los datos provistos usando `Localization`
  (§1 de `03-localizacion-y-globalizacion.md`) para formato de
  fecha/moneda, y producir la salida en el formato solicitado (HTML
  para correo, PDF para documentos fiscales).
- **Dependencias:** `Localization`, `Language Manager`, `File Manager`
  (el resultado renderizado en PDF se almacena y versiona como
  cualquier otro archivo).
- **Interfaces:** `TemplateEngineService.render(templateKey, data,
options: { locale, format })`.
- **Eventos:** ninguno propio.
- **Flujo interno:** resolución de plantilla (con fallback: plantilla
  de company → plantilla de tenant → plantilla base del sistema, en
  ese orden) → interpolación segura (auto-escape de HTML, mismo
  principio que `Notification Center` para prevenir inyección) →
  conversión a PDF cuando aplica (librería de renderizado headless,
  detalle de implementación fuera de alcance de este documento de
  arquitectura) → entrega del binario resultante a quien lo solicitó
  (`File Manager` para persistir, `Notification Center` para adjuntar).
- **Comunicación con otros componentes:** `Notification Center`,
  `File Manager`, y los módulos fiscales/contables que emiten
  documentos con validez legal (facturas, comprobantes) — este último
  caso requiere que la plantilla fiscal esté aprobada y no editable
  libremente por el usuario final (regla de negocio, aplicada vía
  `Policy Engine` sobre quién puede editar `core.templates` de tipo
  fiscal). **Decisión de diseño agregada por Fase 5** (cerraba un
  hueco real entre este componente y `reports.report_templates`,
  [28-modulo-reports-bi.md §1](../28-modulo-reports-bi.md), que
  describía "layout con traducción por idioma" sin decir si reusaba
  este motor o tenía uno propio no documentado): `report_templates`
  **no** tiene su propio mecanismo de renderizado — almacena la
  configuración de layout específica de un reporte (columnas,
  agrupamiento, encabezado/pie) y delega el renderizado final a
  `TemplateEngineService.render()`, pasando ese layout como cuerpo de
  plantilla igual que cualquier otro `templateKey`. `reports` no
  duplica el motor de Template Engine — lo consume, mismo patrón
  módulo-dueño que el resto del sistema.
- **Estrategias de seguridad:** interpolación con auto-escape
  obligatorio; plantillas fiscales protegidas contra edición no
  autorizada.
- **Estrategias de rendimiento:** plantillas compiladas y cacheadas
  (`Cache Framework`) tras la primera resolución, invalidadas al
  editar una plantilla.
- **Estrategias de escalabilidad:** renderizado de PDF es
  CPU-intensivo — candidato a delegarse a `Background Jobs` (§6)
  cuando el volumen lo justifique, en vez de bloquear el hilo de
  request; la interfaz ya está diseñada de forma que ese cambio sea
  transparente para el llamador.

## 5. Scheduler

**Trazabilidad:** 🔗 Extiende diseño existente — tablas
`core.scheduled_jobs` / `scheduled_job_runs` ya diseñadas
([database/logico/01-core.md](../../database/logico/01-core.md)),
mencionadas desde el módulo `administracion`
([04-catalogo-modulos-negocio.md](../04-catalogo-modulos-negocio.md)),
sin diseño de ejecución cron.

- **Objetivo:** ejecutar tareas recurrentes (cierre de día, generación
  de reportes programados, verificación de licencias próximas a
  vencer, prueba mensual de restauración —
  [11-resiliencia-y-continuidad.md §2](./11-resiliencia-y-continuidad.md#2-restore-manager))
  con garantía de que se ejecutan una sola vez incluso con múltiples
  réplicas del backend corriendo en paralelo.
- **Responsabilidad:** resolver expresiones cron por job programado,
  determinar qué réplica ejecuta cada corrida (mediante lock
  distribuido en `Cache Framework`, evitando ejecución duplicada),
  invocar el handler registrado por el módulo dueño del job, y
  registrar el resultado en `scheduled_job_runs` (éxito, fallo,
  duración).
- **Dependencias:** `Cache Framework` (lock distribuido de ejecución
  única), `Timezone Manager` (algunos jobs corren "a medianoche local
  de cada company", no en UTC absoluto), `Background Jobs` (§6 — el
  Scheduler dispara, `Background Jobs` ejecuta el trabajo real de
  forma asíncrona y con reintentos).
- **Interfaces:** `SchedulerService.register(jobKey, cronExpression,
handler)` — los módulos registran sus propios jobs en su fase de
  inicialización, el Scheduler no conoce contenido de negocio.
- **Eventos:** `scheduled-job.started`, `scheduled-job.completed`,
  `scheduled-job.failed` — consumidos por `Notification Center` (alerta
  si un job crítico falla) y `Audit Framework`.
- **Flujo interno:** un tick periódico (cada minuto) evalúa qué jobs
  programados deben dispararse según su expresión cron y la zona
  horaria aplicable; para cada uno, intenta adquirir el lock
  distribuido `scheduler:job:<jobKey>`; si lo obtiene, encola el
  trabajo real en `Background Jobs`; si no lo obtiene, asume que otra
  réplica ya lo está ejecutando y no hace nada.
- **Comunicación con otros componentes:** todo módulo con una tarea
  recurrente de negocio (cierre de caja diario en `caja`, cálculo de
  nómina periódico en `nomina`) registra su job aquí en vez de correr
  su propio `setInterval` ad-hoc.
- **Estrategias de seguridad:** los jobs programados corren con un
  `Security Context` de sistema explícito y auditable (no con
  privilegios de ningún usuario real), para que quede claro en
  `Audit Framework` que la acción la disparó el Scheduler, no una
  persona.
- **Estrategias de rendimiento:** el tick de evaluación es liviano
  (consulta indexada de jobs próximos a disparar), el trabajo pesado
  siempre se delega a `Background Jobs`.
- **Estrategias de escalabilidad:** el lock distribuido es
  precisamente lo que permite correr N réplicas del backend sin
  duplicar ejecuciones — a más réplicas, más candidatas a ganar el
  lock, cero cambio de comportamiento funcional.

## 6. Background Jobs

**Trazabilidad:** 🆕 Diseño nuevo. No existe motor genérico de cola de
trabajos asíncronos — `Message Broker` está diseñado para eventos de
dominio, no para procesamiento de trabajos con reintentos/backoff.

- **Objetivo:** ejecutar trabajo asíncrono de cualquier módulo
  (envío de notificación, renderizado de PDF pesado, importación
  masiva de datos, ejecución de un job programado por `Scheduler`) sin
  bloquear el request HTTP que lo originó, con reintentos automáticos
  ante fallo transitorio.
- **Responsabilidad:** encolar trabajos con prioridad y namespace por
  módulo; ejecutar workers dedicados que consumen la cola (procesos
  separados del backend HTTP, escalables de forma independiente);
  aplicar política de reintento con backoff exponencial y límite
  máximo de intentos, tras el cual el trabajo se marca como fallido
  definitivo y se notifica; garantizar procesamiento at-least-once
  (un trabajo puede ejecutarse más de una vez ante fallo justo después
  de completar — cada handler de trabajo debe ser idempotente, regla
  de diseño para todo módulo que registre un job).
- **Dependencias:** `Message Broker` (transporte físico de la cola de
  trabajos, colas separadas de las de domain events aunque compartan
  el mismo clúster RabbitMQ), `Logging Framework`, `Notification
Center` (para alertar fallos definitivos).
- **Interfaces:** `BackgroundJobsService.enqueue(jobKey, payload,
options: { priority, maxRetries })`,
  `@JobHandler(jobKey)` (decorador de registro de handler, análogo a
  `@WorkflowStepHandler`).
- **Eventos:** `background-job.completed`, `background-job.failed`
  (agotados los reintentos) — consumidos por `Audit Framework` y
  `Notification Center`.
- **Flujo interno:** encolado → worker disponible toma el trabajo →
  ejecuta el handler registrado → si éxito, ack a la cola (elimina el
  trabajo); si falla con error transitorio (timeout, dependencia
  caída), nack con reencolado y backoff exponencial; si falla con
  error de negocio (payload inválido, no tiene sentido reintentar), se
  marca fallido inmediatamente sin consumir reintentos.
- **Comunicación con otros componentes:** `Notification Center`,
  `Template Engine` (renderizado pesado), `Scheduler`, y cualquier
  módulo de negocio con procesamiento pesado (importación de catálogo,
  recálculo masivo de inventario) — todos delegan aquí en vez de
  ejecutar trabajo largo dentro de un request HTTP.
- **Estrategias de seguridad:** el payload de un trabajo nunca incluye
  credenciales ni tokens de sesión — si el handler necesita actuar
  como un usuario, recibe su `userId`/`tenantId` y reconstruye un
  `Security Context` de sistema con el alcance mínimo necesario, nunca
  reutiliza el token JWT original (que puede haber expirado para
  cuando el trabajo se ejecuta).
- **Estrategias de rendimiento:** colas separadas por prioridad
  (crítico: notificaciones de aprobación; normal: reportes; batch:
  importaciones masivas) para que un trabajo pesado en `batch` nunca
  retrase uno crítico.
- **Estrategias de escalabilidad:** los workers son un deployment de
  Kubernetes independiente del backend HTTP
  ([31-infraestructura-completa.md §2](../31-infraestructura-completa.md)),
  escalado por profundidad de cola (HPA sobre métrica de cola
  pendiente, no sobre CPU), permitiendo absorber picos de trabajo
  batch sin afectar la capacidad de respuesta HTTP.
