# 32.03 — Localización y globalización

> Componentes: Localization, Internationalization, Timezone Manager,
> Currency Manager, Language Manager, Multi Currency, Multi Language,
> Multi Country.

## 1. Localization

**Trazabilidad:** 🔗 Extiende diseño existente — el patrón
`_translations` está nombrado pero no detallado como framework
([14-modulo-core.md §4-7](../14-modulo-core.md)).

- **Objetivo:** adaptar formato de fecha, número, moneda y dirección al
  locale del usuario/company, sin tocar el dato subyacente (que se
  almacena siempre en formato canónico: ISO 8601, `NUMERIC` de
  Postgres, código ISO 4217).
- **Responsabilidad:** proveer formateadores puros (sin estado) que
  reciben un valor canónico + un locale y devuelven una representación
  de presentación; nunca al revés (el dato nunca se persiste ya
  formateado).
- **Dependencias:** `Language Manager` (resuelve el locale activo),
  `Date Utilities`, `Money Utilities`, `Number Utilities`
  ([10-utilidades-comunes.md](./10-utilidades-comunes.md)).
- **Interfaces:** `LocalizationService.formatDate(value, locale)`,
  `.formatMoney(value, currency, locale)`, `.formatNumber(value,
locale)` — capa fina sobre `Intl` del runtime de Node/navegador,
  sin reinventar tablas de formato por país.
- **Eventos:** ninguno.
- **Flujo interno:** en frontend, el locale activo se resuelve una vez
  por sesión (preferencia de usuario o de company) y se inyecta a
  nivel de contexto de React; en backend, el formateo de presentación
  prácticamente no ocurre — el backend devuelve valores canónicos y es
  el frontend quien formatea (regla explícita para no duplicar lógica
  de formato en dos lenguajes).
- **Comunicación con otros componentes:** `Template Engine`
  ([08-frameworks-de-infraestructura.md §4](./08-frameworks-de-infraestructura.md#4-template-engine))
  lo usa para renderizar documentos (facturas, reportes) en el locale
  del destinatario.
- **Estrategias de seguridad:** no aplica.
- **Estrategias de rendimiento:** los `Intl.NumberFormat` /
  `Intl.DateTimeFormat` del runtime se instancian una vez por locale y
  se reutilizan (son costosos de construir, baratos de invocar).
- **Estrategias de escalabilidad:** sin estado compartido — cada
  instancia de frontend/backend formatea de forma independiente.

## 2. Internationalization

**Trazabilidad:** 🔗 Extiende diseño existente — mismo estado que
Localization: el patrón `_translations` cubre el dato, falta el
framework de resolución de textos de interfaz.

- **Objetivo:** que todo texto de interfaz (labels, mensajes de error
  de negocio, nombres de estado) exista en más de un idioma sin
  requerir despliegue para agregar una traducción.
- **Responsabilidad:** dos capas distintas y deliberadamente separadas:
  (1) i18n de **datos** — el patrón `_translations` ya fijado en
  `14-modulo-core.md §4-7`, para nombres de entidades de catálogo
  (países, monedas, categorías); (2) i18n de **interfaz** — diccionario
  de claves de UI (`ui.button.save`, `errors.validation.required`)
  servido desde `ui-kit/` en frontend, sin tocar base de datos.
- **Dependencias:** `Language Manager`.
- **Interfaces:** hook `useTranslation()` en frontend (capa sobre
  `ui-kit/hooks`); en backend, los mensajes de error de negocio se
  devuelven como **código**, nunca como texto ya traducido — el
  frontend resuelve el texto final, para no acoplar el backend a un
  idioma.
- **Eventos:** ninguno.
- **Flujo interno:** el backend nunca decide el idioma de un mensaje;
  expone códigos estables (`ERR_CREDIT_LIMIT_EXCEEDED`) que el
  diccionario de frontend traduce. Esto evita el antipatrón de tener
  que re-desplegar el backend para corregir la redacción de un mensaje.
- **Comunicación con otros componentes:** `Exception Framework`
  ([07-observabilidad-y-gobernanza.md §3](./07-observabilidad-y-gobernanza.md#3-exception-framework))
  es quien produce esos códigos de error estables que este componente
  traduce en la capa de presentación.
- **Estrategias de seguridad:** los mensajes de error nunca incluyen
  detalles internos (stack trace, nombre de tabla) — el código
  traducible es siempre de negocio, el detalle técnico va solo al
  `Logging Framework`.
- **Estrategias de rendimiento:** diccionarios de UI cargados una vez
  por sesión de frontend (code-split por idioma, ver
  [29-frontend-enterprise.md](../29-frontend-enterprise.md)).
- **Estrategias de escalabilidad:** sin estado de servidor — cada
  cliente resuelve su propio idioma.

## 3. Timezone Manager

**Trazabilidad:** 🔗 Extiende diseño existente — tabla
`configuration.timezones` y distinción usuario-vs-company ya fijadas
([14-modulo-core.md §4-7](../14-modulo-core.md)); no existía un
servicio formal.

- **Objetivo:** garantizar que toda fecha/hora se almacene en UTC y se
  presente en la zona horaria correcta según el contexto (usuario,
  company o, para reportes fiscales, la zona horaria legal de la
  company — que puede diferir de la del usuario que consulta).
- **Responsabilidad:** exponer la conversión UTC ↔ zona horaria local y
  resolver cuál zona horaria aplica a cada operación (regla: eventos
  de auditoría y documentos fiscales usan la zona horaria de la
  **company**, nunca la del navegador del usuario, para que dos
  usuarios en distintas zonas vean la misma fecha de emisión de una
  factura).
- **Dependencias:** `Date Utilities`, `Company Manager`.
- **Interfaces:** `TimezoneService.toUtc(value, tz)`,
  `.toLocal(value, tz)`, `.resolveContextTimezone(context)`.
- **Eventos:** ninguno.
- **Flujo interno:** todo `timestamp` se persiste en UTC (columna
  `timestamptz` de Postgres) sin excepción; la conversión a hora local
  ocurre exclusivamente en la capa de presentación (backend al servir
  DTOs pre-formateados para reportes fiscales, o frontend para el
  resto de la UI).
- **Comunicación con otros componentes:** `Audit Framework` y
  `Document Numbering` dependen de la resolución de zona horaria de
  company para fechas legales; `Scheduler`
  ([08-frameworks-de-infraestructura.md §5](./08-frameworks-de-infraestructura.md#5-scheduler))
  la usa para ejecutar jobs "a la medianoche local de cada company"
  cuando aplica (p. ej. cierre de día).
- **Estrategias de seguridad:** no aplica.
- **Estrategias de rendimiento:** conversión de zona horaria es cálculo
  en memoria (librería `Intl`/`date-fns-tz`), sin I/O.
- **Estrategias de escalabilidad:** no aplica — sin estado compartido.

## 4. Currency Manager

**Trazabilidad:** 🔗 Extiende diseño existente — reglas de dato
(inmutabilidad de `functional_currency_code`, `exchange_rates`
histórico por fecha) ya fijadas en
[14-modulo-core.md §1, §4-7](../14-modulo-core.md); falta la capa de
servicio de conversión/redondeo.

- **Objetivo:** realizar conversiones de moneda consistentes y
  auditable entre la moneda funcional de una company y cualquier
  moneda transaccional, con la tasa de cambio correcta para la fecha
  de la operación (nunca la tasa "actual" al momento de consultar un
  histórico).
- **Responsabilidad:** resolver la tasa vigente para
  `(from_currency, to_currency, fecha)` contra `exchange_rates`;
  aplicar la estrategia de redondeo fijada por moneda (no todas usan 2
  decimales — hay monedas con 0 o 3); rechazar operaciones que
  requieran una tasa inexistente para la fecha solicitada en vez de
  usar silenciosamente la más cercana.
- **Dependencias:** `Money Utilities`
  ([10-utilidades-comunes.md §3](./10-utilidades-comunes.md#3-money-utilities)),
  `Company Manager` (moneda funcional), tabla `exchange_rates`
  (`14-modulo-core.md`).
- **Interfaces:** `CurrencyService.convert(amount, from, to, date)`,
  `.getRate(from, to, date)`.
- **Eventos:** `exchange-rate.missing` (interno de plataforma) cuando
  se solicita una conversión sin tasa registrada para la fecha —
  consumido por `Notification Center` para alertar al área contable.
- **Flujo interno:** toda conversión pasa por `Money Utilities` para
  el manejo de precisión (nunca aritmética de punto flotante sobre
  dinero, ver
  [10-utilidades-comunes.md §3](./10-utilidades-comunes.md#3-money-utilities));
  el resultado de una conversión histórica queda inmutable una vez
  registrado en el documento origen — no se recalcula si la tasa se
  corrige después (se corrige mediante un ajuste contable explícito,
  no un update silencioso).
- **Comunicación con otros componentes:** `contabilidad`, `ventas`,
  `compras` y `bancos` son los consumidores principales (todos con
  documento propio ya diseñado que referencia este mecanismo).
- **Estrategias de seguridad:** cambios a `exchange_rates` requieren
  el mismo nivel de permiso que cambios contables (rol financiero, no
  operativo).
- **Estrategias de rendimiento:** tasas del día cacheadas
  (`Cache Framework`), invalidadas al registrar una tasa nueva.
- **Estrategias de escalabilidad:** sin estado compartido más allá del
  cache — la tabla de tasas crece linealmente y ya está cubierta por
  la estrategia de índices del modelo de datos.

## 5. Language Manager

**Trazabilidad:** 🔗 Extiende diseño existente — tabla
`configuration.languages` y patrón `_translations` ya fijados
([14-modulo-core.md §4-7](../14-modulo-core.md)).

- **Objetivo:** resolver el idioma activo de cada usuario/sesión y
  servir como fuente de verdad de qué idiomas están habilitados por
  tenant (un tenant puede limitar su instalación a un solo idioma).
- **Responsabilidad:** resolver `Accept-Language` del request /
  preferencia guardada del usuario contra la lista de idiomas
  habilitados del tenant; exponer el idioma resuelto al
  `Security Context` para que `Internationalization` y `Localization`
  lo consuman sin volver a resolverlo.
- **Dependencias:** `configuration.languages`, `Tenant Manager`.
- **Interfaces:** `LanguageService.resolve(request)`.
- **Eventos:** ninguno.
- **Flujo interno:** resolución en el middleware de entrada de cada
  request HTTP, una sola vez, cacheada en el `Security Context` de esa
  request.
- **Comunicación con otros componentes:** `Internationalization`,
  `Localization`, `Notification Center` (las notificaciones se generan
  en el idioma del destinatario, no del actor que dispara el evento).
- **Estrategias de seguridad:** no aplica.
- **Estrategias de rendimiento:** resuelto una vez por request, sin
  I/O adicional más allá de la lista de idiomas del tenant (cacheada).
- **Estrategias de escalabilidad:** no aplica.

## 6. Multi Currency

**Trazabilidad:** 🔗 Extiende diseño existente — ver Currency Manager
arriba; esta entrada documenta específicamente la dimensión "multi".

- **Objetivo:** que una company opere transacciones en monedas
  distintas a su moneda funcional sin perder trazabilidad contable.
- **Responsabilidad:** todo documento transaccional (factura, pago)
  registra tanto el monto en moneda transaccional como su equivalente
  en moneda funcional al momento de la operación (doble columna, ya
  fijado en los módulos de `ventas`/`compras`/`bancos`) — el Core
  Platform no agrega columnas nuevas, provee el servicio de conversión
  que las llena.
- **Dependencias:** `Currency Manager`.
- **Interfaces:** las mismas de `Currency Manager` — Multi Currency no
  es un servicio separado, es la propiedad emergente de aplicarlo
  consistentemente en todos los módulos transaccionales.
- **Eventos:** ninguno propio.
- **Flujo interno:** no aplica más allá de lo ya descrito.
- **Comunicación con otros componentes:** `contabilidad` (NIIF,
  patrón de doble libro, ver `22-modulo-accounting.md`) es el
  consumidor más exigente de esta capacidad.
- **Estrategias de seguridad / rendimiento / escalabilidad:** heredadas
  de `Currency Manager`.

## 7. Multi Language

**Trazabilidad:** 🔗 Extiende diseño existente — el patrón es
transversal (usado por 21 tablas según `14-modulo-core.md §4-7`) pero
nunca documentado como framework propio — ver Internationalization y
Localization arriba, que cubren la capacidad completa.

- **Objetivo / Responsabilidad:** propiedad emergente de aplicar
  `Language Manager` + `Internationalization` + el patrón
  `_translations` de forma consistente en todo el catálogo — no es un
  componente adicional.
- **Dependencias / Interfaces / Eventos / Flujo interno / Comunicación
  / Seguridad / Rendimiento / Escalabilidad:** idénticos a
  `Internationalization` §2 y `Language Manager` §5 — se referencian
  para evitar duplicar contenido; esta entrada existe solo para
  satisfacer la lista de 72 componentes solicitada explícitamente por
  el usuario, dejando constancia de que **no es una pieza de código
  adicional**.

## 8. Multi Country

**Trazabilidad:** 📎 Referencia — diseño completo y sustancial ya
existente: countries → states → municipalities + los tres subárboles
fiscales (`fiscal_regimes`, `fiscal_document_types`,
`exchange_rate_types`) en
[14-modulo-core.md §4-7](../14-modulo-core.md) y
[database/logico/21-configuration.md](../../database/logico/21-configuration.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — no se repite aquí.
- **Dependencias:** `Company Manager` (país de constitución fiscal),
  `Currency Manager` (moneda por país).
- **Interfaces:** consumido vía `configuration.countries` y las tablas
  fiscales asociadas — sin servicio de plataforma adicional, es
  catálogo puro (ver `Reference Data`,
  [04-identidad-de-datos.md §3](./04-identidad-de-datos.md#3-reference-data)).
- **Eventos:** ninguno propio.
- **Comunicación con otros componentes:** `impuestos` (Fase 16,
  pendiente de documento de arquitectura per
  [00-roadmap-fases.md](../../00-roadmap-fases.md)) es el consumidor
  natural de los subárboles fiscales por país — cuando esa fase se
  diseñe, debe referenciar esta base, no reinventarla.
- **Estrategias de seguridad / rendimiento / escalabilidad:** ver
  `14-modulo-core.md §4-7` — catálogo de bajo volumen y baja
  frecuencia de cambio, cacheable de forma agresiva.
