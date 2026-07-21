# 32.06 — Eventos y mensajería

> Componentes: Domain Events, Event Bus, Message Broker, Notification
> Center.

## 1. Domain Events

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
convención de estructura + catálogo en
[06-comunicacion-entre-modulos.md](../06-comunicacion-entre-modulos.md)
y [12-backend-enterprise.md §6](../12-backend-enterprise.md#6-catálogo-de-eventos).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — hecho de negocio ya ocurrido e inmutable
  (`VentaConfirmada`), publicado para que otros módulos reaccionen sin
  acoplamiento directo (glosario ya fijado en
  [architecture/README.md §4](../README.md#4-glosario-mínimo)).
- **Dependencias:** `Event Bus` (mecanismo de publicación),
  `Base Entity` / `Aggregate Root`
  ([09-base-transaccional-y-modelado-ddd.md](./09-base-transaccional-y-modelado-ddd.md))
  como origen de los eventos.
- **Interfaces:** `domain-event.base.ts` (clase base con
  `eventId`, `occurredAt`, `aggregateId`, `tenantId` — estructura ya
  fijada).
- **Eventos:** es el concepto en sí mismo, no aplica sub-catálogo aquí.
- **Comunicación con otros componentes:** prácticamente todo componente
  de motor (`Workflow Engine`, `State Machine`, `Approval Engine`) y
  todo módulo de negocio publica y/o consume domain events.
- **Estrategias de seguridad:** un evento de dominio nunca transporta
  datos sensibles sin cifrar ni credenciales — transporta identificadores
  y los campos mínimos necesarios para que el consumidor decida si
  necesita consultar más detalle (principio ya fijado en
  `06-comunicacion-entre-modulos.md`).
- **Estrategias de rendimiento:** publicación asíncrona (no bloquea la
  transacción que originó el evento — ver `Event Bus` §2).
- **Estrategias de escalabilidad:** el volumen de eventos crece
  linealmente con la actividad transaccional, ya contemplado en el
  dimensionamiento de `Message Broker` (§3).

## 2. Event Bus

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
`core/messaging/event-bus.service.ts` en
[12-backend-enterprise.md §1.3, §6](../12-backend-enterprise.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — abstracción de aplicación sobre `Message Broker`
  para que los módulos de negocio publiquen/consuman eventos sin
  conocer detalles de RabbitMQ (exchanges, routing keys) directamente.
- **Dependencias:** `Message Broker`.
- **Interfaces:** `EventBusService.publish(event)`,
  `@EventHandler(EventClass)` (decorador de suscripción).
- **Eventos:** transporta todos los `Domain Events` del sistema — es
  el mecanismo, no el contenido.
- **Comunicación con otros componentes:** es la única forma permitida
  de comunicación asíncrona entre módulos (regla ya fijada en
  `06-comunicacion-entre-modulos.md`) — ningún módulo publica
  directamente a RabbitMQ sin pasar por esta capa.
- **Estrategias de seguridad:** el Event Bus valida que el publisher
  sea el módulo dueño declarado del tipo de evento (un módulo no puede
  publicar eventos que semánticamente pertenecen a otro).
- **Estrategias de rendimiento:** publicación fire-and-forget desde la
  perspectiva del publisher (no espera confirmación de todos los
  consumidores) — la garantía de entrega la da `Message Broker`.
- **Estrategias de escalabilidad:** desacopla productor y consumidores
  en el tiempo — un consumidor caído no bloquea al publisher ni a
  otros consumidores.

## 3. Message Broker

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
convención de exchange/routing/queue + alta disponibilidad en
[08-infraestructura-y-despliegue.md §4](../08-infraestructura-y-despliegue.md#4-rabbitmq)
y [31-infraestructura-completa.md §5, §11](../31-infraestructura-completa.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — RabbitMQ como implementación concreta detrás del
  `Event Bus`, con colas cuórum para alta disponibilidad.
- **Dependencias:** infraestructura RabbitMQ (Kubernetes,
  [31-infraestructura-completa.md §2](../31-infraestructura-completa.md)).
- **Interfaces:** ninguna directa hacia módulos de negocio — solo el
  `Event Bus` lo consume.
- **Eventos:** transporte físico de todos los `Domain Events`.
- **Comunicación con otros componentes:** `Background Jobs`
  ([08-frameworks-de-infraestructura.md §6](./08-frameworks-de-infraestructura.md#6-background-jobs))
  también puede usar colas de este broker para trabajos asíncronos que
  no son domain events (distinción explícita: eventos de dominio
  describen hechos de negocio ya ocurridos; jobs describen trabajo
  pendiente de ejecutar — semánticamente distintos aunque compartan
  transporte).
- **Estrategias de seguridad:** ver `08 §4` — credenciales por
  vhost/usuario de aplicación, sin acceso directo de ningún cliente
  externo.
- **Estrategias de rendimiento / escalabilidad:** ver
  `31-infraestructura-completa.md §5, §11` — colas cuórum, particionado
  por routing key, dimensionamiento ya cubierto.

## 4. Notification Center

**Trazabilidad:** 🔗 Extiende diseño existente — tablas
`core.notifications` / `notification_templates` /
`notification_channels` / `notification_delivery_logs` /
`notification_preferences` ya diseñadas
([database/logico/01-core.md](../../database/logico/01-core.md)), sin
documento end-to-end que las conecte en un flujo, a diferencia de
otros componentes de `core` que sí tienen su propio módulo
(`13-modulo-auth.md`, `14-modulo-core.md`, `15-modulo-security.md`).

- **Objetivo:** centralizar el envío de notificaciones a usuarios
  (in-app, email, SMS, WhatsApp, push) desde cualquier módulo,
  respetando preferencias de canal y evitando que cada módulo
  implemente su propio mecanismo de envío.
- **Responsabilidad:** recibir solicitudes de notificación
  (`templateKey` + destinatario + variables), resolver el/los canales
  habilitados según `notification_preferences` del destinatario,
  renderizar el contenido vía `Template Engine`
  ([08-frameworks-de-infraestructura.md §4](./08-frameworks-de-infraestructura.md#4-template-engine))
  en el idioma resuelto por `Language Manager`
  ([03-localizacion-y-globalizacion.md §5](./03-localizacion-y-globalizacion.md#5-language-manager)),
  entregar por el canal correspondiente y registrar el resultado en
  `notification_delivery_logs` (éxito, fallo, motivo).
- **Dependencias:** `Template Engine`, `Language Manager`,
  `Background Jobs` (el envío real —especialmente email— es asíncrono,
  nunca bloquea el request que lo originó), `File Manager` (adjuntos,
  p. ej. PDF de factura adjunto a la notificación de "factura
  emitida"), `core.integrations`/`integration_credentials`
  ([database/logico/01-core.md](../../database/logico/01-core.md) —
  hogar natural de las credenciales del proveedor SMTP/SMS/WhatsApp de
  cada canal, mismo mecanismo genérico que cualquier otra integración
  externa, sin tabla nueva — ver §4.1).
- **Interfaces:** `NotificationCenterService.send(templateKey,
recipientId, variables)` — único punto de entrada para cualquier
  módulo; nadie envía email/notificación in-app por fuera de esta
  interfaz.
- **Eventos:** consume prácticamente todos los eventos de dominio del
  sistema que tienen una notificación asociada (mapeo
  evento→plantilla configurable, no hardcodeado); publica
  `notification.delivered` / `notification.failed` para que el módulo
  originador pueda reaccionar si necesita saber si su notificación
  llegó (poco común, pero soportado — p. ej. reintentar por otro canal).
- **Flujo interno:** solicitud de envío → encolada en
  `Background Jobs` (nunca síncrona) → resolución de canal/idioma/
  plantilla → renderizado → entrega vía el proveedor del canal (SMTP
  para email, pasarela SMS, API de WhatsApp Business, WebSocket vía
  `core/realtime` para in-app — detalle de cada uno en §4.1) →
  registro en `notification_delivery_logs` → reintento con backoff si
  el canal falla transitoriamente (máximo 3 intentos, luego se marca
  fallida y se notifica al remitente original si aplicable).
- **Comunicación con otros componentes:** consumidor de eventos de
  prácticamente todos los módulos (`Approval Engine`, `Workflow
Engine`, `License Manager`, y directamente de módulos de negocio
  como `ventas` para "factura emitida" o `rrhh` para "solicitud de
  vacaciones aprobada").
- **Estrategias de seguridad:** las plantillas nunca interpolan datos
  sin sanitizar en contenido HTML (previene inyección en el cuerpo del
  correo); los `notification_delivery_logs` no almacenan el contenido
  completo del mensaje si incluyó datos sensibles, solo metadatos de
  entrega.
- **Estrategias de rendimiento:** envío 100% asíncrono vía
  `Background Jobs`; agrupación de notificaciones de baja prioridad en
  lotes (digest) quedaría como extensión futura, no en el alcance
  actual.
- **Estrategias de escalabilidad:** los workers de `Background Jobs`
  que procesan la cola de notificaciones escalan horizontalmente de
  forma independiente al resto del backend (ver
  [31-infraestructura-completa.md §2](../31-infraestructura-completa.md)).

### 4.1 Integración de proveedores por canal (SMS, WhatsApp, Email) — detalle agregado por Fase 5

**Trazabilidad:** 🆕 Diseño nuevo. `core.notification_channels.channel_type`
ya incluye `'sms'`/`'whatsapp'` en su `CHECK` y la tabla ya tiene
`provider_name`/`metadata` genéricos, pero ningún documento nombraba
el mecanismo de integración real de estos dos canales — a diferencia
de email (SMTP, ya nombrado en el Flujo interno de arriba) e in-app
(WebSocket vía `core/realtime`, también ya nombrado). Esta subsección
cierra ese gap sin agregar tablas nuevas — todo vive dentro del
Notification Center ya diseñado arriba.

- **Email (SMTP):** ya resuelto (ver Flujo interno). Las credenciales
  del relay SMTP (host, puerto, usuario, contraseña/API key si el
  proveedor es transaccional tipo SendGrid/SES) se guardan como una
  fila de `core.integrations` +
  `integration_credentials` cifradas
  ([32-core-platform/10 §7 Encryption Utilities](./10-utilidades-comunes.md#7-encryption-utilities)),
  no en `notification_channels.metadata` directamente — mismo
  mecanismo genérico que cualquier integración externa del sistema, no
  uno especial para email.
- **SMS:** el Notification Center invoca un adaptador por
  `provider_name` (p. ej. `'twilio'`, `'aws-sns'` — el catálogo de
  proveedores soportados es una decisión de implementación, no de
  arquitectura) detrás de una interfaz única
  `SmsGatewayAdapter.send(to, body)`, para que agregar un proveedor
  nuevo no toque el resto del Notification Center. Las credenciales
  del proveedor usan el mismo mecanismo de `core.integrations` que
  email. A diferencia de SMTP (que confirma entrega con un código de
  respuesta síncrono simple), la mayoría de pasarelas SMS entregan el
  estado final de forma asíncrona (webhook de delivery receipt) — el
  Notification Center expone un endpoint de callback que actualiza el
  `status` de la fila correspondiente en `notification_delivery_logs`
  después del registro inicial (`queued`/`sent`), no asume éxito
  inmediato como si fuera síncrono.
- **WhatsApp (WhatsApp Business API):** mismo patrón de adaptador que
  SMS (`WhatsAppGatewayAdapter.send(to, templateOrBody)`), con una
  diferencia real de la API de WhatsApp Business que hay que respetar:
  fuera de una ventana de 24 horas desde el último mensaje del
  destinatario, solo se pueden enviar **plantillas pre-aprobadas por
  Meta** (no texto libre) — esto significa que `Template Engine`
  ([08 §4](./08-frameworks-de-infraestructura.md#4-template-engine))
  necesita, para plantillas de tipo WhatsApp, un campo adicional de
  "nombre de plantilla aprobada" distinto del HTML libre que usa para
  email/PDF — detalle de implementación a resolver en el momento de
  construir este canal, no antes.
- **Decisión de diseño — relación con `crm.whatsapp_logs`/`crm.email_logs`
  (no estaba decidida en ningún documento):** cuando el destinatario de
  una notificación por email o WhatsApp es identificable como un
  `lead_id`/`customer_id` de CRM (es decir, la notificación se originó
  desde un evento de un módulo de negocio ligado a un cliente/prospecto,
  no una notificación puramente de sistema como "tu contraseña va a
  expirar"), el Notification Center **también** escribe una fila en
  `crm.whatsapp_logs`/`crm.email_logs` con `direction='outbound'`,
  además de su propio registro en `notification_delivery_logs`. Se
  decide así (y no dejarlos desconectados, que era el estado previo)
  porque un vendedor consultando el historial de interacción de un
  cliente en CRM necesita ver **todas** las comunicaciones reales que
  recibió, incluidas las disparadas automáticamente por otros módulos
  (p. ej. "factura emitida" enviada por WhatsApp) — no solo las que un
  vendedor escribió manualmente. `crm.whatsapp_logs`/`email_logs` y
  `notification_delivery_logs` siguen siendo tablas independientes con
  propósitos distintos (bitácora de relación vs. auditoría técnica de
  entrega) — esto no las fusiona, solo hace que el Notification Center
  escriba en ambas cuando el contexto lo amerita.
