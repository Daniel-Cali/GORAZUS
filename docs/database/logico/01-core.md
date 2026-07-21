# Modelo Lógico — Core (`core`)

Fundacional. Toda tabla del sistema, sin excepción, tiene FK real hacia
`core.tenants`, `core.companies`, `core.branches` y `core.users` (ver
[01-modelo-conceptual §1.5](../01-modelo-conceptual.md#15-excepción-a-no-fk-entre-schemas)).
Ninguna tabla de `core` referencia a otro módulo de negocio.

Todas las tablas listadas abajo incluyen las 18 columnas universales
(ver [01-modelo-conceptual §1.1](../01-modelo-conceptual.md#11-columnas-universales));
solo se listan columnas/FKs adicionales relevantes.

## Organización y multiempresa

| Tabla                          | Propósito                                                                                                                                                                                    | FKs no-universales                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `tenants`                      | Cliente SaaS que aloja una instancia lógica de GORAZUS                                                                                                                                       | — (raíz de la jerarquía)                                       |
| `tenant_subscriptions`         | Plan contratado por el tenant: módulos habilitados, límites de usuarios/empresas/sucursales/almacenes (`max_users`, `max_companies`, `max_branches`, `max_warehouses` — `NULL` = sin límite) | `tenant_id`                                                    |
| `tenant_subscription_features` | Detalle de features/módulos incluidos en una suscripción (N:M)                                                                                                                               | `subscription_id → tenant_subscriptions`, `module_code`        |
| `companies`                    | Empresa legal (multiempresa): razón social, identificación fiscal, régimen, moneda funcional                                                                                                 | `tenant_id`                                                    |
| `branches`                     | Sucursal (multisucursal) dentro de una empresa                                                                                                                                               | `company_id`                                                   |
| `user_companies`               | Acceso N:M de un usuario a empresas del mismo tenant                                                                                                                                         | `user_id → users`, `company_id → companies`                    |
| `departments`                  | Departamento organizacional, reutilizado por `hr` y por asignación de usuarios                                                                                                               | `company_id`, `parent_department_id → departments` (jerarquía) |

## Identidad y control de acceso base

| Tabla              | Propósito                                                                                                                                      | FKs no-universales                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `users`            | Cuenta de usuario del sistema (credenciales delegadas a `security`)                                                                            | `tenant_id`                                      |
| `user_profiles`    | Datos extendidos de perfil (avatar, idioma preferido, zona horaria, preferencias de UI)                                                        | `user_id → users` (1:1)                          |
| `user_devices`     | Dispositivos registrados de un usuario (para push notifications y confianza de 2FA)                                                            | `user_id → users`                                |
| `roles`            | Rol base (nombre, empresa a la que aplica)                                                                                                     | `company_id`                                     |
| `permissions`      | Catálogo de permisos `<modulo>.<accion>` del sistema (ver [09-seguridad-y-multiempresa.md](../../architecture/09-seguridad-y-multiempresa.md)) | —                                                |
| `role_permissions` | Asignación N:M de permisos a un rol                                                                                                            | `role_id → roles`, `permission_id → permissions` |
| `user_roles`       | Asignación N:M de roles a un usuario                                                                                                           | `user_id → users`, `role_id → roles`             |
| `groups`           | Agrupación libre de usuarios (distinta de rol — para distribución de notificaciones, no autorización)                                          | `company_id`                                     |
| `group_members`    | Miembros N:M de un grupo                                                                                                                       | `group_id → groups`, `user_id → users`           |

## Parametrización y feature flags

| Tabla               | Propósito                                                                                                  | FKs no-universales        |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------- |
| `system_settings`   | Configuración clave-valor a nivel tenant/empresa no cubierta por un módulo específico                      | `tenant_id`, `company_id` |
| `system_parameters` | Catálogo de parámetros disponibles con su tipo de dato y valor por defecto (metadata de `system_settings`) | —                         |
| `feature_flags`     | Activación progresiva de funcionalidades nuevas por tenant                                                 | `tenant_id`               |

## Notificaciones

| Tabla                                | Propósito                                                                       | FKs no-universales                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `notifications`                      | Notificación generada para un usuario                                           | `recipient_user_id → users`                                             |
| `notification_templates`             | Plantilla de notificación (evento que la dispara, canal)                        | `company_id`                                                            |
| `notification_template_translations` | Traducción de una plantilla por idioma (patrón `_translations`)                 | `template_id → notification_templates`, `language_code`                 |
| `notification_recipients`            | Destinatarios adicionales de una notificación (más allá del principal)          | `notification_id → notifications`, `user_id → users`                    |
| `notification_channels`              | Canal configurado (email/SMS/push/WhatsApp) con sus credenciales de envío       | `company_id`                                                            |
| `notification_delivery_logs`         | Registro de cada intento de envío por canal (éxito/fallo, proveedor, respuesta) | `notification_id → notifications`, `channel_id → notification_channels` |

## Auditoría y bitácoras técnicas

| Tabla            | Propósito                                                                                                                                   | FKs no-universales                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `audit_logs`     | Registro genérico de cambios de negocio (qué tabla, qué fila, qué cambió) — ver [05-estrategia-auditoria.md](../05-estrategia-auditoria.md) | `actor_user_id → users`                  |
| `system_logs`    | Logs técnicos de la aplicación (no de negocio) — nivel, mensaje, contexto                                                                   | —                                        |
| `activity_logs`  | Bitácora de actividad de usuario (navegación, acciones) para analítica de uso                                                               | `user_id → users`                        |
| `change_history` | Snapshot de estado anterior/nuevo de un registro para reconstrucción histórica completa                                                     | `entity_type`, `entity_id` (polimórfico) |

## Autenticación técnica (complementa a `security`)

| Tabla            | Propósito                                                                                                                                               | FKs no-universales                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `tokens`         | Tokens de propósito general (verificación de correo, restablecimiento de contraseña)                                                                    | `user_id → users`                                      |
| `api_keys`       | Claves de API emitidas para integraciones                                                                                                               | `company_id`, `created_by_user_id → users`             |
| `api_key_scopes` | Alcance de permisos de una API key (N:M con `permissions`)                                                                                              | `api_key_id → api_keys`, `permission_id → permissions` |
| `sessions`       | Sesión activa de usuario (respaldo de estado de refresh token, ver [09-seguridad-y-multiempresa.md](../../architecture/09-seguridad-y-multiempresa.md)) | `user_id → users`                                      |

## Archivos y documentos (repositorio transversal)

| Tabla                | Propósito                                                                                                        | FKs no-universales                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `files`              | Metadato físico del archivo (ruta en MinIO, tamaño, checksum, MIME type)                                         | —                                                      |
| `documents`          | Documento de negocio adjunto a un registro de cualquier módulo (`source_module`, `source_entity_id` polimórfico) | `file_id → files`, `document_type_id → document_types` |
| `document_types`     | Catálogo de tipos de documento (contrato, comprobante, certificado) con reglas de retención                      | `company_id`                                           |
| `document_versions`  | Historial de versiones de un documento                                                                           | `document_id → documents`, `file_id → files`           |
| `signatures`         | Firma electrónica capturada sobre un documento                                                                   | `document_id → documents`, `signer_user_id → users`    |
| `signature_requests` | Solicitud de firma pendiente (workflow de firma con múltiples firmantes)                                         | `document_id → documents`                              |

## Plantillas y flujos de trabajo reutilizables

| Tabla                     | Propósito                                                                                                                                         | FKs no-universales                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `templates`               | Plantilla genérica de documento imprimible (factura, recibo — el layout, no el contenido)                                                         | `company_id`                                                                     |
| `template_translations`   | Traducción de plantilla por idioma                                                                                                                | `template_id → templates`, `language_code`                                       |
| `workflows`               | Definición de un flujo de aprobación reutilizable (qué entidad dispara, pasos, secuencial o paralelo vía `execution_mode`)                        | `company_id`                                                                     |
| `workflow_steps`          | Paso de un workflow (orden, aprobador requerido — rol o usuario, condición de avance vía `transition_rule_set_key → business_rules.rule_set_key`) | `workflow_id → workflows`                                                        |
| `workflow_instances`      | Ejecución concreta de un workflow sobre un registro de negocio (`entity_type`, `entity_id`)                                                       | `workflow_id → workflows`                                                        |
| `workflow_instance_steps` | Estado de cada paso dentro de una instancia                                                                                                       | `workflow_instance_id → workflow_instances`, `workflow_step_id → workflow_steps` |
| `approvals`               | Solicitud de aprobación individual (puede o no venir de un workflow formal)                                                                       | `entity_type`, `entity_id`, `requested_by_user_id → users`                       |
| `approval_steps`          | Paso/decisión dentro de una aprobación                                                                                                            | `approval_id → approvals`, `approver_user_id → users`                            |
| `approval_matrices`       | Regla de "quién aprueba qué según monto/tipo", usada para enrutar aprobaciones automáticamente                                                    | `company_id`                                                                     |

## Integraciones e importación/exportación masiva

| Tabla                     | Propósito                                                                                                  | FKs no-universales                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `integrations`            | Configuración de una integración externa (facturación electrónica, pasarela de pago, e-commerce)           | `company_id`                                |
| `integration_credentials` | Credenciales cifradas de una integración (ver [06-estrategia-seguridad.md](../06-estrategia-seguridad.md)) | `integration_id → integrations`             |
| `import_batches`          | Ejecución de una importación masiva (módulo destino, archivo origen, resultado)                            | `company_id`, `executed_by_user_id → users` |
| `import_batch_errors`     | Fila de un batch que falló, con motivo                                                                     | `import_batch_id → import_batches`          |
| `export_batches`          | Ejecución de una exportación masiva                                                                        | `company_id`, `executed_by_user_id → users` |
| `scheduled_jobs`          | Definición de una tarea programada (backup, reporte recurrente, facturación recurrente)                    | `company_id`                                |
| `scheduled_job_runs`      | Historial de ejecuciones de una tarea programada                                                           | `scheduled_job_id → scheduled_jobs`         |

## Capacidades transversales genéricas

| Tabla                      | Propósito                                                                                                                                | FKs no-universales                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `tags`                     | Etiqueta libre reutilizable en cualquier módulo                                                                                          | `company_id`                                            |
| `entity_tags`              | Asignación polimórfica de una etiqueta a un registro de cualquier tabla (`entity_type`, `entity_id`)                                     | `tag_id → tags`                                         |
| `comments`                 | Comentario/nota polimórfico adjuntable a cualquier registro (`entity_type`, `entity_id`)                                                 | `author_user_id → users`                                |
| `data_retention_policies`  | Política de retención por tipo de entidad, usada por los jobs de purga (ver [05-estrategia-auditoria.md](../05-estrategia-auditoria.md)) | `company_id`                                            |
| `notification_preferences` | Preferencia de opt-in/opt-out de un usuario por canal y tipo de evento                                                                   | `user_id → users`, `channel_id → notification_channels` |

## Cumplimiento e integraciones externas

| Tabla                   | Propósito                                                                                                                   | FKs no-universales                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `consent_records`       | Consentimiento de tratamiento de datos/marketing otorgado por una persona (cliente, empleado, prospecto)                    | `entity_type`, `entity_id` (polimórfico)                                           |
| `data_subject_requests` | Solicitud de acceso/rectificación/borrado de datos personales (cumplimiento tipo GDPR/leyes locales de protección de datos) | `requested_by_entity_type`, `requested_by_entity_id` (polimórfico)                 |
| `webhook_subscriptions` | Suscripción de un sistema externo a eventos de dominio de GORAZUS                                                           | `integration_id → integrations`                                                    |
| `webhook_delivery_logs` | Registro de cada entrega de webhook (éxito/reintento/fallo)                                                                 | `subscription_id → webhook_subscriptions`                                          |
| `edi_transactions`      | Documento EDI intercambiado con socios comerciales (relevante para cadenas/distribuidoras)                                  | `integration_id → integrations`, `source_module`, `source_entity_id` (polimórfico) |

## Motor de reglas de negocio y trabajos en segundo plano

Agregado por el Core Platform
([32-core-platform/05](../../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#1-business-rules-engine)
y
[32-core-platform/08](../../architecture/32-core-platform/08-frameworks-de-infraestructura.md#6-background-jobs)) —
gap real identificado: ningún schema tenía un motor de reglas genérico
reusable entre módulos (solo reglas module-específicas como
`accounting.accounting_rules`), ni una cola de trabajo asíncrono
on-demand distinta de `scheduled_jobs` (exclusivamente CRON/recurrente).

| Tabla                       | Propósito                                                                                                                                                                                                   | FKs no-universales         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `business_rules`            | Regla condicional genérica `SI condición ENTONCES acción`, namespaced por `rule_set_key` y reusable por cualquier módulo dueño                                                                              | `company_id`               |
| `business_rule_evaluations` | Historial de qué regla se evaluó y cuál disparó, para que una acción automática sea explicable después. Particionada mensualmente                                                                           | `rule_id → business_rules` |
| `background_jobs`           | Cola y bitácora de trabajo asíncrono on-demand (envío de notificación, renderizado de PDF, importación) con reintento y backoff — distinta de `scheduled_jobs`, que es solo CRON. Particionada mensualmente | `company_id`               |

**Total: 68 tablas.**
