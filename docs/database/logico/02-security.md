# Modelo Lógico — Security (`security`)

Autorización fina y autenticación avanzada. Complementa a `core`
(identidad base, roles, permisos) — nunca redeclara `users`/`roles`.
Todas las tablas incluyen las 18 columnas universales.

## Control de acceso fino (ACL)

| Tabla                    | Propósito                                                                                                       | FKs no-universales                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `access_control_lists`   | Lista de control de acceso nombrada, aplicable a un tipo de recurso                                             | `company_id`                                                                                          |
| `acl_entries`            | Regla individual: sujeto (usuario/rol/grupo), recurso (`entity_type`/`entity_id` o patrón), permiso, allow/deny | `acl_id → access_control_lists`                                                                       |
| `permission_delegations` | Delegación temporal de un permiso de un usuario a otro (p. ej. cobertura de vacaciones)                         | `delegator_user_id → core.users`, `delegate_user_id → core.users`, `permission_id → core.permissions` |

## Políticas de seguridad

| Tabla                  | Propósito                                                                                           | FKs no-universales        |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| `security_policies`    | Política de seguridad aplicable a un tenant/empresa (referencia a las demás tablas de esta sección) | `tenant_id`, `company_id` |
| `password_policies`    | Reglas de complejidad/expiración de contraseña por empresa                                          | `company_id`              |
| `password_history`     | Historial de hashes de contraseña por usuario, para impedir reutilización                           | `user_id → core.users`    |
| `login_attempts`       | Registro de cada intento de login (éxito/fallo, IP, user agent)                                     | `user_id → core.users`    |
| `ip_allowlist_entries` | Rango de IP autorizado por empresa/usuario                                                          | `company_id`              |
| `ip_denylist_entries`  | Rango de IP bloqueado                                                                               | `company_id`              |

## OAuth y API

| Tabla                 | Propósito                                       | FKs no-universales                                     |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `oauth_clients`       | Aplicación cliente registrada para flujo OAuth2 | `company_id`                                           |
| `oauth_scopes`        | Catálogo de scopes disponibles                  | —                                                      |
| `oauth_client_scopes` | Scopes autorizados para un cliente (N:M)        | `client_id → oauth_clients`, `scope_id → oauth_scopes` |
| `oauth_tokens`        | Access/refresh tokens emitidos vía OAuth2       | `client_id → oauth_clients`, `user_id → core.users`    |
| `api_key_rate_limits` | Límite de tasa configurado por API key          | `api_key_id → core.api_keys`                           |

## Autenticación de dos factores

| Tabla                     | Propósito                                                         | FKs no-universales                                      |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `two_factor_credentials`  | Secreto TOTP/dispositivo registrado para 2FA de un usuario        | `user_id → core.users`                                  |
| `two_factor_backup_codes` | Códigos de un solo uso de respaldo                                | `user_id → core.users`                                  |
| `two_factor_challenges`   | Registro de cada verificación 2FA solicitada (éxito/fallo)        | `user_id → core.users`                                  |
| `trusted_devices`         | Dispositivo marcado como confiable para omitir 2FA por un período | `user_id → core.users`, `device_id → core.user_devices` |

## Cifrado y gestión de secretos

| Tabla                      | Propósito                                                                                             | FKs no-universales                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `data_encryption_keys`     | Metadato de claves de cifrado a nivel de columna (nunca la clave en sí — referencia a un KMS externo) | `company_id`                               |
| `encryption_key_rotations` | Historial de rotación de claves                                                                       | `encryption_key_id → data_encryption_keys` |

## Auditoría de seguridad e incidentes

| Tabla                      | Propósito                                                                                                                                            | FKs no-universales                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `security_audit_logs`      | Auditoría específica de eventos de seguridad (cambio de permiso, escalamiento, acceso denegado) — distinta de `core.audit_logs` (cambios de negocio) | `actor_user_id → core.users`       |
| `session_activity_logs`    | Actividad granular dentro de una sesión con foco en seguridad (accesos denegados, intentos fuera de política)                                        | `session_id → core.sessions`       |
| `security_incidents`       | Incidente de seguridad detectado/reportado                                                                                                           | `company_id`                       |
| `security_incident_events` | Línea de tiempo de un incidente                                                                                                                      | `incident_id → security_incidents` |

**Total: 24 tablas.**
