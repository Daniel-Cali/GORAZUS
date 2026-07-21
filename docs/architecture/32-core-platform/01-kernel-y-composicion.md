# 32.01 — Kernel y composición

> Componentes: Application Kernel, Service Container, Dependency
> Injection, Configuration Manager, Environment Manager, Feature
> Flags, License Manager.

## 1. Application Kernel

**Trazabilidad:** 🔗 Extiende diseño existente — `apps/api/src/main.ts`
y `app.module.ts` ya están descritos como composition root delgado
([01-estructura-monorepo.md §3](../01-estructura-monorepo.md#3-por-qué-modules-está-separado-de-apps),
[12-backend-enterprise.md §1.2](../12-backend-enterprise.md)), pero
nunca se formalizó como una capa de arranque con fases propias.

- **Objetivo:** proveer el punto único de arranque del backend, con
  fases de inicialización deterministas y ordenadas, para que ningún
  módulo de negocio dependa de un orden implícito de carga.
- **Responsabilidad:** ejecutar, en orden fijo: (1) carga y validación
  de configuración (`Configuration Manager`), (2) conexión a
  infraestructura crítica (Postgres, Redis, RabbitMQ — falla rápido si
  no están disponibles, ver `08-infraestructura-y-despliegue.md §2`),
  (3) registro del `Service Container` con todos los módulos de
  `modules/*/backend`, (4) montaje de middlewares/filtros globales de
  `core/http`, (5) exposición del `Health Check` de liveness, (6)
  arranque del listener HTTP. El Kernel no contiene lógica de negocio
  ni conoce el contenido de ningún módulo — solo orquesta su registro.
- **Dependencias:** `Configuration Manager`, `Service Container`,
  `core/database`, `core/cache`, `core/messaging` (para el chequeo de
  disponibilidad inicial), `Health Checks`.
- **Interfaces:** expone `bootstrap(): Promise<INestApplication>` como
  único punto de entrada, consumido solo por `apps/api/src/main.ts` y
  por el harness de tests e2e (`apps/api-e2e`), que reutiliza el mismo
  bootstrap para evitar drift entre el entorno de test y el real.
- **Eventos:** publica (internamente, no en el Event Bus de dominio —
  ver la distinción en
  [06-eventos-y-mensajeria.md](./06-eventos-y-mensajeria.md#1-domain-events))
  `kernel.phase.started` / `kernel.phase.completed` por cada fase,
  consumidos únicamente por el `Logging Framework` para trazar tiempos
  de arranque en el log de startup.
- **Flujo interno:** cada fase corre secuencialmente y aborta el
  proceso con código de salida distinto de 0 si falla — no hay
  degradación parcial en el arranque (un backend que arrancó a medias
  es peor que uno que no arrancó). Las fases 2 en adelante corren en
  paralelo entre sí cuando no tienen dependencia mutua (p. ej. Redis y
  RabbitMQ se verifican concurrentemente).
- **Comunicación con otros componentes:** es el único componente que
  el resto del Core Platform no puede invocar en tiempo de ejecución
  normal — el Kernel los crea a ellos, no al revés. Los `Health Checks`
  sí pueden leer su estado (`bootstrapped: boolean`) después del
  arranque.
- **Estrategias de seguridad:** el Kernel rechaza el arranque si
  `Configuration Manager` detecta variables de entorno sensibles
  ausentes o con el valor placeholder de desarrollo en un entorno
  `production` (ver
  [08-infraestructura-y-despliegue.md §6](../08-infraestructura-y-despliegue.md#6-variables-de-entorno)).
- **Estrategias de rendimiento:** las fases de conexión a
  infraestructura tienen timeout individual (5s) para que un servicio
  caído produzca un fallo de arranque legible en menos de 10s, no un
  cuelgue indefinido.
- **Estrategias de escalabilidad:** el bootstrap es idéntico sin
  importar cuántas réplicas del pod corran (ver
  [31-infraestructura-completa.md §2](../31-infraestructura-completa.md#2-kubernetes--adoptado-decisión-revisada))
  — no hay estado de arranque compartido entre instancias, cada una
  ejecuta las 6 fases de forma independiente.

## 2. Service Container

**Trazabilidad:** 🔗 Extiende diseño existente — el contenedor de DI de
NestJS se usa implícitamente en todo el backend
([02-arquitectura-modulos-backend.md §5](../02-arquitectura-modulos-backend.md)),
pero no había una sección que documentara su comportamiento como
componente de plataforma.

- **Objetivo:** resolver instancias de servicios, repositorios y
  providers por contrato (interfaz), no por implementación concreta,
  para que un módulo pueda testear con un doble de prueba sin tocar el
  código de producción.
- **Responsabilidad:** mantener el grafo de dependencias de toda la
  aplicación, instanciar providers en el orden correcto (resolviendo
  dependencias transitivas), y aplicar el scope correcto a cada uno
  (`singleton` por defecto; `request`-scoped únicamente para lo que
  necesita `Security Context` per-request, ver
  [09-base-transaccional-y-modelado-ddd.md §1](./09-base-transaccional-y-modelado-ddd.md#1-security-context)).
- **Dependencias:** `Application Kernel` (lo instancia), `Dependency
Injection` (el mecanismo que usa internamente).
- **Interfaces:** el contrato público es el decorador `@Injectable()` y
  el token de inyección (clase o `Symbol` para interfaces, ver DI más
  abajo) — ningún módulo interactúa con el Service Container
  directamente, solo declara sus dependencias en el constructor.
- **Eventos:** ninguno de dominio. Emite advertencias internas (vía
  `Logging Framework`) cuando detecta un provider `request`-scoped
  inyectado dentro de uno `singleton` (fuga de scope, error común de
  NestJS).
- **Flujo interno:** en el registro de cada módulo (fase 3 del
  Application Kernel), el contenedor construye el grafo de
  dependencias de ese módulo, valida que no haya dependencias
  circulares entre módulos (violación de fronteras que el lint de Nx
  ya debería haber bloqueado en build time —
  [01-estructura-monorepo.md §5](../01-estructura-monorepo.md#5-reglas-de-import-enforcement)
  — el Service Container es la segunda línea de defensa en runtime) y
  cachea las instancias `singleton`.
- **Comunicación con otros componentes:** todo componente de este
  documento que sea inyectable (todos, salvo utilidades estáticas
  puras del grupo 10) es resuelto por el Service Container.
- **Estrategias de seguridad:** ningún provider puede resolverse fuera
  del árbol de módulos declarado — no existe un "service locator"
  global que permita a un módulo pedir una instancia de otro módulo no
  declarado como dependencia explícita en su `README.md` (regla ya
  fijada en
  [01-estructura-monorepo.md §5](../01-estructura-monorepo.md#5-reglas-de-import-enforcement)).
- **Estrategias de rendimiento:** resolución de dependencias eager en
  el arranque (no lazy) para que el costo de construir el grafo se
  pague una sola vez al iniciar el proceso, no en el primer request de
  cada tipo.
- **Estrategias de escalabilidad:** al no haber estado compartido entre
  instancias del pod, escalar horizontalmente el backend no requiere
  ningún cambio en el Service Container — cada réplica construye su
  propio grafo de forma independiente.

## 3. Dependency Injection

**Trazabilidad:** 🔗 Extiende diseño existente — mismo estado que
Service Container: usado implícitamente, no formalizado como
componente de plataforma.

- **Objetivo:** desacoplar la construcción de un objeto de su uso, de
  forma que las capas de dominio y aplicación dependan de interfaces
  (puertos), no de implementaciones concretas de infraestructura —
  requisito directo de Clean Architecture
  ([00-arquitectura-general.md §3](../00-arquitectura-general.md),
  regla "las dependencias siempre apuntan hacia adentro").
- **Responsabilidad:** proveer los mecanismos de inyección por
  constructor (estándar del proyecto) y, para los puertos de
  repositorio, la inyección por token (`Symbol`) que permite que
  `services/` dependa de `IVentaRepository` y no de
  `PrismaVentaRepository`.
- **Dependencias:** ninguna dentro del Core Platform — es un mecanismo
  de bajo nivel provisto por el framework (NestJS sobre
  `reflect-metadata`).
- **Interfaces:** `@Injectable()`, `@Inject(TOKEN)`,
  proveedores registrados vía `{ provide: TOKEN, useClass: Impl }` en
  cada `*.module.ts`.
- **Eventos:** ninguno.
- **Flujo interno:** en tiempo de compilación, `reflect-metadata`
  captura los tipos de los parámetros del constructor; en tiempo de
  registro de módulo, el `Service Container` usa esos metadatos para
  resolver qué instancia inyectar.
- **Comunicación con otros componentes:** es el mecanismo que todos los
  demás componentes usan para declarar sus propias dependencias — no
  tiene "comunicación" en el sentido de negocio, es infraestructura
  pura de composición.
- **Estrategias de seguridad:** no aplica directamente — la seguridad
  relevante es la del `Service Container` (no permitir resolución fuera
  del árbol de dependencias declarado).
- **Estrategias de rendimiento:** inyección por constructor (no por
  propiedad) para que las dependencias sean explícitas y resolvibles
  en el momento de construcción del objeto, evitando resoluciones
  diferidas costosas.
- **Estrategias de escalabilidad:** no aplica — es un mecanismo por
  proceso, no distribuido.

## 4. Configuration Manager

**Trazabilidad:** 📎 Referencia — diseño completo y sustancial ya
existente: cadena origen → validación Zod → namespaces tipados →
módulo global en
[12-backend-enterprise.md §7](../12-backend-enterprise.md#7-configuración)
y tabla de variables de entorno en
[08-infraestructura-y-despliegue.md §6](../08-infraestructura-y-despliegue.md#6-variables-de-entorno).
No se rediseña aquí.

- **Objetivo:** ser la única fuente de verdad de configuración técnica
  del proceso (no confundir con `Company Manager` / `Settings`, que es
  configuración de negocio editable en runtime — ver
  [14-modulo-core.md §1](../14-modulo-core.md)). Ver diseño completo en
  la referencia de arriba.
- **Responsabilidad:** cargar variables de entorno, validarlas contra
  esquemas Zod por namespace (`database`, `redis`, `rabbitmq`, `jwt`,
  ...) y exponerlas tipadas — sin `process.env` disperso en el código
  de ningún módulo.
- **Dependencias:** ninguna — es de las primeras piezas en arrancar
  (fase 1 del `Application Kernel`).
- **Interfaces:** `ConfigService.get<T>(namespace)` inyectable en
  cualquier provider.
- **Eventos:** ninguno de dominio.
- **Flujo interno:** ver `12-backend-enterprise.md §7`.
- **Comunicación con otros componentes:** todo componente de este
  documento que requiera un valor configurable (timeouts, límites de
  reintentos, flags de comportamiento) lo obtiene del Configuration
  Manager, nunca de una constante hardcodeada ni de `process.env`
  directo.
- **Estrategias de seguridad:** ver `08-infraestructura-y-despliegue.md
§6` — secretos nunca en el repositorio, inyectados como Kubernetes
  Secrets en producción.
- **Estrategias de rendimiento:** validado y congelado una sola vez en
  el arranque (fase 1), lectura posterior es acceso a objeto en
  memoria, sin I/O.
- **Estrategias de escalabilidad:** no aplica — configuración por
  proceso, idéntica en todas las réplicas de un mismo despliegue por
  diseño (principio "same shape per environment",
  [31-infraestructura-completa.md §2.1](../31-infraestructura-completa.md)).

## 5. Environment Manager

**Trazabilidad:** 🔗 Extiende diseño existente — la tabla de variables
por entorno y el principio de forma idéntica entre entornos ya están
fijados
([08-infraestructura-y-despliegue.md §6](../08-infraestructura-y-despliegue.md#6-variables-de-entorno),
[31-infraestructura-completa.md §2.1](../31-infraestructura-completa.md)),
pero no existía una abstracción explícita de "en qué entorno estoy
corriendo y qué me permite hacer".

- **Objetivo:** exponer de forma centralizada en qué entorno corre el
  proceso (`development`, `staging`, `production`) y las políticas
  derivadas de esa pertenencia (p. ej. "en `development` los secretos
  faltantes generan warning, en `production` abortan el arranque").
- **Responsabilidad:** resolver el entorno activo a partir de una única
  variable (`NODE_ENV` / `GORAZUS_ENV`) y exponer helpers de consulta
  (`isProduction()`, `isDevelopment()`) para evitar comparaciones de
  string dispersas en el código.
- **Dependencias:** `Configuration Manager` (el entorno es en sí una
  variable de configuración, la primera que se resuelve).
- **Interfaces:** `EnvironmentService.current()`,
  `EnvironmentService.isProduction()`.
- **Eventos:** ninguno.
- **Flujo interno:** resuelto en la fase 1 del `Application Kernel`,
  junto con el `Configuration Manager` — no es un componente separado
  en tiempo de ejecución sino una vista especializada sobre la misma
  carga de configuración.
- **Comunicación con otros componentes:** el `Application Kernel` lo
  consulta para decidir si abortar el arranque; `Feature Flags` lo usa
  como uno de los criterios de evaluación de reglas (activar un flag
  solo en `staging`, por ejemplo); `Logging Framework` lo usa para
  decidir el nivel de log por defecto (`debug` en desarrollo, `info`
  en producción).
- **Estrategias de seguridad:** ningún flag ni configuración de
  `development` puede filtrarse a `production` — la validación de
  `Configuration Manager` en fase 1 lo impide.
- **Estrategias de rendimiento:** resolución única en arranque, sin
  costo en runtime.
- **Estrategias de escalabilidad:** no aplica — valor fijo por proceso.

## 6. Feature Flags

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
`core.feature_flags`, `rollout_percentage`, principio de evaluación en
el borde (edge) en
[14-modulo-core.md §3](../14-modulo-core.md). No se rediseña aquí.

- **Objetivo:** activar/desactivar capacidades por tenant o por
  porcentaje de rollout sin requerir despliegue — ver diseño completo
  en la referencia.
- **Responsabilidad:** evaluar flags en el punto de entrada de cada
  request (edge), no dispersar el `if (flag)` en capas profundas del
  dominio.
- **Dependencias:** `Tenant Manager` (evaluación por tenant),
  `Environment Manager` (evaluación por entorno), `Cache Framework`
  (los flags se cachean para no consultar la tabla en cada request).
- **Interfaces:** `FeatureFlagsService.isEnabled(flagKey, context)`.
- **Eventos:** publica `feature-flag.toggled` (interno de plataforma,
  no de dominio) cuando un administrador cambia un flag, consumido por
  el `Cache Framework` para invalidar la entrada cacheada.
- **Flujo interno:** ver `14-modulo-core.md §3`.
- **Comunicación con otros componentes:** cualquier componente de
  negocio o de plataforma puede consultarlo; el `Cache Framework`
  actúa como capa intermedia obligatoria para no golpear Postgres en
  cada evaluación.
- **Estrategias de seguridad:** un flag nunca controla autorización
  (eso es responsabilidad exclusiva de `Security Context` / RBAC-ABAC
  en `15-modulo-security.md`) — mezclar feature-flagging con control de
  acceso es un antipatrón explícitamente evitado.
- **Estrategias de rendimiento:** evaluación desde cache (TTL corto,
  invalidación activa vía evento), no desde base de datos en el
  camino crítico de cada request.
- **Estrategias de escalabilidad:** el cache de flags es compartido
  (Redis), no local por instancia, para que todas las réplicas vean el
  mismo estado de un flag sin esperar propagación.

## 7. License Manager

**Trazabilidad:** 🆕 Diseño nuevo. Existe únicamente el dato adyacente
`core.tenant_subscriptions` / `tenant_subscription_features`
(`database/logico/01-core.md`) sin ningún servicio ni flujo diseñado.

- **Objetivo:** determinar en tiempo de ejecución qué módulos,
  límites cuantitativos (usuarios, sucursales, almacenes) y
  capacidades premium tiene habilitados un tenant según su plan
  contratado, y bloquear de forma consistente el acceso a lo no
  licenciado.
- **Responsabilidad:** resolver, para cada request autenticado, el
  plan activo del tenant (`tenant_subscriptions`) y sus features
  (`tenant_subscription_features`); exponer un guard reusable
  (`@RequiresLicense('inventory.multi-warehouse')`) que los módulos
  de negocio aplican a sus propios endpoints; calcular límites
  cuantitativos (p. ej. "plan Starter permite hasta 3 sucursales") y
  rechazar la operación de alta que los excedería, con un mensaje de
  negocio claro (no un 403 genérico).
- **Dependencias:** `Tenant Manager` (identidad del tenant activo),
  `Cache Framework` (el estado de licencia se cachea por tenant, TTL
  corto), `Notification Center` (para avisar próximos vencimientos).
- **Interfaces:** `LicenseService.hasFeature(tenantId, featureKey)`,
  `LicenseService.checkLimit(tenantId, limitKey, currentCount)`,
  guard HTTP `@RequiresLicense(featureKey)`.
- **Eventos:** publica `license.expired`, `license.limit-exceeded`,
  `license.renewed` — consumidos por `Notification Center` (alertas al
  administrador del tenant) y por `Audit Framework` (todo intento
  bloqueado por licencia se audita, es evidencia relevante en
  disputas comerciales).
- **Flujo interno:** en el guard HTTP, antes de que el controller de
  cualquier módulo de negocio ejecute, se resuelve el plan desde cache
  (o Postgres en cache-miss), se verifica el feature/límite solicitado
  y se continúa o se rechaza con `402`-equivalente de negocio (código
  de aplicación específico, no HTTP 402 literal, ver convención de
  errores en
  [07-convenciones-y-estandares.md §4](../07-convenciones-y-estandares.md)).
  Una licencia vencida no borra datos ni bloquea lectura — solo
  bloquea altas/modificaciones nuevas, para no dejar al tenant sin
  acceso a su propia información histórica.
- **Comunicación con otros componentes:** todos los módulos de negocio
  que ofrecen capacidades diferenciadas por plan (multi-almacén,
  BI avanzado, número de usuarios) dependen de este guard; no hay
  comunicación inversa (el License Manager no conoce el contenido de
  ningún módulo, solo claves de feature declaradas centralmente en un
  catálogo — ver
  [12-arbol-de-carpetas.md](./12-arbol-de-carpetas.md)).
- **Estrategias de seguridad:** el guard de licencia se evalúa
  **después** de autenticación/autorización (RBAC/ABAC), nunca la
  reemplaza — un usuario sin permiso es rechazado por seguridad antes
  de siquiera consultarse la licencia.
- **Estrategias de rendimiento:** estado de licencia cacheado por
  tenant (Redis, TTL 5 min) — el camino crítico de cada request no
  paga una consulta a `tenant_subscriptions` en cada llamada.
- **Estrategias de escalabilidad:** el cache es compartido entre
  réplicas; la invalidación al renovar/cambiar de plan se propaga por
  evento (`license.renewed`) para que ninguna réplica sirva un estado
  de licencia obsoleto por más que el TTL natural.
