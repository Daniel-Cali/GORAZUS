# 32.07 — Observabilidad y gobernanza

> Componentes: Audit Framework, Logging Framework, Exception
> Framework, Health Checks, Metrics, Monitoring, Tracing.

## 1. Audit Framework

**Trazabilidad:** 📎 Referencia — diseño completo y sustancial ya
existente: modelo de 4 capas en
[database/05-estrategia-auditoria.md](../../database/05-estrategia-auditoria.md)
más ciclo de vida de incidentes de seguridad en
[15-modulo-security.md §7-8](../15-modulo-security.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — no se rediseña aquí, es el componente con mayor
  riesgo de duplicación real de todo el Core Platform.
- **Dependencias:** `Base Entity` (columnas de auditoría universales,
  [09-base-transaccional-y-modelado-ddd.md §5](./09-base-transaccional-y-modelado-ddd.md#5-base-entity)),
  `Security Context` (quién es el actor de cada cambio),
  `State Machine` (toda transición es evento auditable).
- **Interfaces:** `AuditFrameworkService.record(entry)` — consumido
  automáticamente por `Repository Base` en cada escritura, no requiere
  invocación manual desde código de módulo.
- **Eventos:** consume prácticamente todos los eventos de plataforma
  con implicación de seguridad o cumplimiento
  (`policy.denied`, `license.limit-exceeded`,
  `document-numbering.series-exhausted`, transiciones de
  `State Machine`).
- **Comunicación con otros componentes:** es el consumidor transversal
  de mayor alcance de todo el Core Platform — casi todo componente de
  este documento le reporta algo.
- **Estrategias de seguridad:** los registros de auditoría son
  append-only, sin operación de update/delete disponible ni siquiera
  para roles administrativos (ver `database/05-estrategia-auditoria.md`
  para el mecanismo de enforcement a nivel de base de datos).
- **Estrategias de rendimiento / escalabilidad:** ver
  `database/05-estrategia-auditoria.md` — particionamiento por fecha ya
  diseñado para el volumen esperado.

## 2. Logging Framework

**Trazabilidad:** 🔗 Extiende diseño existente — principio de JSON
estructurado + correlación ya fijado en
[07-convenciones-y-estandares.md §6](../07-convenciones-y-estandares.md#6-logging),
sin arquitectura de niveles/transports/rotación documentada.

- **Objetivo:** producir logs técnicos estructurados, correlacionables
  entre sí (mismo `requestId` reutilizado como trace ID, ver
  `Tracing` §7) y con el nivel correcto para el entorno activo — sin
  mezclar logs técnicos con `Audit Framework` (los logs son para
  diagnóstico operativo, se pueden truncar/rotar; la auditoría es
  registro legal/de negocio, nunca se trunca).
- **Responsabilidad:** exponer una interfaz de logging única
  (`LoggerService`) que todo componente y módulo usa en vez de
  `console.log`; aplicar el nivel correcto según `Environment Manager`
  (`debug` en desarrollo, `info` en producción, configurable por
  namespace para depuración puntual sin redeploy); enriquecer cada
  entrada automáticamente con `tenantId`, `requestId`, `userId` desde
  `Security Context`, sin que el código que loguea tenga que pasarlos
  explícitamente.
- **Dependencias:** `Environment Manager`, `Security Context`.
- **Interfaces:** `LoggerService.debug/info/warn/error(message,
context)`, inyectable en cualquier provider.
- **Eventos:** ninguno de dominio — es en sí mismo un sumidero de
  información, no un emisor.
- **Flujo interno:** cada entrada de log se serializa a JSON con
  campos fijos (`timestamp`, `level`, `message`, `tenantId`,
  `requestId`, `module`) más el contexto libre que el llamador agregue;
  el transport de salida es siempre `stdout` en contenedor — la
  aplicación nunca escribe a un archivo ni conoce el destino final. En
  `staging`/`production` ese stream lo recolecta Promtail y lo envía a
  **Loki** (destino agregado por Fase 9 —
  [31-infraestructura-completa.md §9](../31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10),
  antes sin nombrar), consultable desde el mismo Grafana ya usado para
  métricas.
- **Comunicación con otros componentes:** `Exception Framework` (§3)
  registra ahí toda excepción no controlada; `Tracing` (§7) reutiliza
  el mismo `requestId` para correlacionar logs con trazas
  distribuidas.
- **Estrategias de seguridad:** el Logging Framework nunca registra
  contraseñas, tokens ni PII sensible en texto plano — lista de campos
  redactados automáticamente aplicada antes de serializar (misma
  disciplina que ya aplica `Encryption Utilities` a nivel de
  persistencia).
- **Estrategias de rendimiento:** escritura asíncrona a stdout (no
  bloquea el hilo de request), sin I/O de archivo directo desde la
  aplicación (la recolección/rotación es responsabilidad de la capa de
  infraestructura, no del proceso Node).
- **Estrategias de escalabilidad:** sin estado — cada réplica escribe
  su propio stream, agregado centralmente por el stack de
  observabilidad (`31-infraestructura-completa.md §9`).

## 3. Exception Framework

**Trazabilidad:** 🔗 Extiende diseño existente —
`core/http/filters/exception.filter.ts` y contrato de error ya
fijados en
[05-flujo-de-datos.md §3](../05-flujo-de-datos.md#3-manejo-de-errores),
[07-convenciones-y-estandares.md §4](../07-convenciones-y-estandares.md#4-manejo-de-errores);
falta la jerarquía de clases de excepción.

- **Objetivo:** distinguir de forma explícita y tipada entre errores
  de negocio esperables (`ERR_CREDIT_LIMIT_EXCEEDED`), errores de
  validación (`ERR_VALIDATION_FAILED`) y errores técnicos inesperados
  (fallo de conexión, bug) — cada categoría con tratamiento distinto
  en el filtro global.
- **Responsabilidad:** proveer la jerarquía base
  (`DomainException` → excepciones de negocio específicas,
  `ValidationException`, y dejar pasar sin envolver los errores no
  reconocidos como "técnicos inesperados"); el filtro global de
  `core/http` traduce cada categoría al contrato de error HTTP
  correcto (código de aplicación estable + código HTTP apropiado,
  nunca un stack trace expuesto al cliente).
- **Dependencias:** `Internationalization` (los códigos de error son
  traducibles, ver
  [03-localizacion-y-globalizacion.md §2](./03-localizacion-y-globalizacion.md#2-internationalization)),
  `Logging Framework` (todo error técnico inesperado se loguea con
  stack trace completo server-side, aunque el cliente reciba un
  mensaje genérico).
- **Interfaces:** clases `DomainException`, `ValidationException`
  (`packages/contracts` o `core/http`, a decidir en implementación —
  ambas opciones respetan las reglas de import ya fijadas), extendidas
  por cada módulo para sus propias excepciones de negocio
  (`CreditLimitExceededException extends DomainException`).
- **Eventos:** ninguno de dominio — un error técnico inesperado sí
  puede alimentar una alerta de `Monitoring` (§6) vía la integración ya
  existente entre logs y el stack de observabilidad.
- **Flujo interno:** cualquier excepción lanzada dentro de un
  request llega al filtro global; si es `DomainException` o
  `ValidationException`, se traduce a una respuesta 4xx con el código
  de aplicación; si no, se trata como error inesperado (500, logueado
  con stack completo, mensaje genérico al cliente).
- **Comunicación con otros componentes:** `State Machine` lanza
  `ERR_INVALID_STATE_TRANSITION` como `DomainException`;
  `License Manager` lanza sus rechazos de la misma forma — la
  convención es uniforme en todo el Core Platform.
- **Estrategias de seguridad:** ningún detalle interno (nombre de
  tabla, query, ruta de archivo) llega nunca al cliente — solo al log
  server-side.
- **Estrategias de rendimiento:** el manejo de excepciones no agrega
  overhead relevante — es el mecanismo estándar del lenguaje, sin capa
  adicional costosa.
- **Estrategias de escalabilidad:** no aplica — por proceso, sin
  estado.

## 4. Health Checks

**Trazabilidad:** 🆕 Diseño nuevo. Solo existía la mención de que el
archivo existe (`12-backend-enterprise.md §1.2`), sin diseño de qué
verifica ni cómo se usa.

- **Objetivo:** exponer el estado real de salud del proceso backend
  para que Kubernetes decida si una réplica debe recibir tráfico
  (readiness) o si debe reiniciarse (liveness) — distinción crítica
  para no confundir "el proceso está vivo" con "el proceso puede
  atender requests correctamente".
- **Responsabilidad:** exponer dos endpoints distintos con semántica
  distinta: `/health/live` (liveness — el proceso Node responde,
  sin verificar dependencias externas; si falla, Kubernetes reinicia
  el pod) y `/health/ready` (readiness — verifica que Postgres, Redis
  y RabbitMQ estén alcanzables; si falla, Kubernetes deja de enrutar
  tráfico a esa réplica sin reiniciarla, dándole tiempo a recuperarse).
- **Dependencias:** `core/database`, `core/cache`, `core/messaging`
  (verificación activa de conectividad, no solo configuración
  presente).
- **Interfaces:** `HealthCheckService.checkLiveness()`,
  `.checkReadiness()` — expuestos como endpoints HTTP sin
  autenticación (son consultados por el orquestador, no por usuarios)
  pero solo accesibles dentro de la red del clúster, nunca expuestos
  públicamente (regla de `Ingress`,
  [31-infraestructura-completa.md §3](../31-infraestructura-completa.md)).
- **Eventos:** ninguno de dominio — publica métricas consumidas por
  `Monitoring` (§6) sobre el resultado de cada chequeo.
- **Flujo interno:** readiness ejecuta un ping ligero a cada
  dependencia externa con timeout corto (500ms) — no una query
  pesada; si cualquiera falla, el endpoint devuelve `503` de
  inmediato; liveness nunca consulta dependencias externas, solo
  confirma que el event loop de Node responde (evita que una caída de
  Postgres provoque un reinicio en cascada de todas las réplicas
  cuando lo correcto es solo dejar de enrutarles tráfico).
- **Comunicación con otros componentes:** consumido exclusivamente por
  el orquestador (Kubernetes) y por `Monitoring` para el dashboard de
  disponibilidad — ningún módulo de negocio lo invoca.
- **Estrategias de seguridad:** no expone información sensible —
  responde únicamente `ok`/`degraded`/`down` por dependencia, sin
  detalle de configuración ni credenciales.
- **Estrategias de rendimiento:** timeouts agresivos (500ms) para que
  un readiness check nunca se convierta en cuello de botella cuando
  una dependencia está lenta pero no caída.
- **Estrategias de escalabilidad:** cada réplica expone su propio
  estado de forma independiente — es, junto con `Application Kernel`,
  el componente que hace posible el escalado horizontal seguro
  (Kubernetes solo enruta a réplicas realmente listas).

## 5. Metrics

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
OpenTelemetry + Prometheus en
[31-infraestructura-completa.md §9](../31-infraestructura-completa.md#9-monitoreo--gap-cerrado).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `core/http` (interceptor de métricas por request).
- **Interfaces:** métricas estándar (latencia, tasa de error, tasa de
  requests) expuestas en formato Prometheus vía `/metrics`.
- **Eventos:** ninguno de dominio.
- **Comunicación con otros componentes:** `Health Checks` (§4)
  alimenta métricas de disponibilidad; `License Manager`,
  `Feature Flags` y demás componentes con cache pueden exponer
  métricas propias de hit-rate si se considera valioso (extensión, no
  requerido en el alcance base).
- **Estrategias de seguridad:** endpoint `/metrics` accesible solo
  dentro del clúster, igual criterio que `Health Checks`.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §9`.

## 6. Monitoring

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
Grafana + distinción alertas de infraestructura vs. negocio en
[31-infraestructura-completa.md §9](../31-infraestructura-completa.md#9-monitoreo--gap-cerrado).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `Metrics`, `Logging Framework`.
- **Interfaces:** dashboards de Grafana — no expone interfaz de
  programación a módulos de negocio.
- **Eventos:** las alertas de negocio (p. ej. "más de N facturas
  fallidas en 5 minutos") se configuran sobre métricas que el propio
  módulo de negocio expone, siguiendo la distinción ya fijada en la
  referencia.
- **Comunicación con otros componentes:** consumidor terminal de
  `Metrics`, `Logging Framework` y `Tracing`.
- **Estrategias de seguridad:** acceso a dashboards restringido a
  roles de operación/DevOps, no a usuarios de negocio.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §9`.

## 7. Tracing

**Trazabilidad:** 📎 Referencia — diseño completo ya existente: trace
ID = mismo `requestId` reutilizado, en
[31-infraestructura-completa.md §9](../31-infraestructura-completa.md#9-monitoreo--gap-cerrado).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — un mismo identificador atraviesa logs, métricas y
  trazas para que un incidente sea correlacionable de punta a punta
  sin sistemas de IDs distintos.
- **Dependencias:** `core/http` (propagación del `requestId` vía
  `AsyncLocalStorage`, mismo mecanismo que `Security Context`).
- **Interfaces:** el `requestId` en sí, accesible vía
  `TracingContext.current()`.
- **Eventos:** ninguno.
- **Backend de trazas (agregado por Fase 9 — antes solo estaba
  diseñado el mecanismo de propagación, sin destino):** el colector de
  OpenTelemetry ya instrumentado exporta directo vía OTLP a
  **Jaeger** ([31-infraestructura-completa.md §9](../31-infraestructura-completa.md#9-monitoreo--gap-cerrado-identificado-en-00-arquitectura-general-10)),
  usando el mismo `requestId`/trace ID como identificador — Jaeger no
  genera su propio ID, consume el que `core/http` ya produce.
- **Comunicación con otros componentes:** `Logging Framework` (todo
  log incluye el `requestId` activo), `Message Broker` (el
  `requestId` se propaga en los headers del mensaje para que un
  evento procesado asíncronamente conserve la trazabilidad a la
  request original que lo originó).
- **Estrategias de seguridad:** el `requestId` no es secreto —
  identificador opaco, sin información sensible codificada.
- **Estrategias de rendimiento:** propagación vía `AsyncLocalStorage`,
  sin costo relevante de I/O.
- **Estrategias de escalabilidad:** por diseño, funciona igual sin
  importar cuántas réplicas o cuántos saltos asíncronos atraviese una
  operación.
