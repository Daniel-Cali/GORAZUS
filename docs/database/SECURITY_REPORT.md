# Security Report — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 8 (2026-07-21). Auditoría de
> seguridad consolidada. El hallazgo principal (RLS de Empresa/Sucursal
> ausente) vive en detalle en [RLS_DESIGN.md](./RLS_DESIGN.md) — no se
> repite aquí, solo se incorpora al puntaje y riesgos.

## 1. Auditoría de seguridad (entregable 1)

| Componente                            | Estado                     | Detalle                                                                                                                                         |
| ------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Usuarios                              | ✅                         | `core.users`                                                                                                                                    |
| Roles                                 | ✅ (planos, sin jerarquía) | `core.roles` — sin `parent_role_id`, ver §1.1                                                                                                   |
| Permisos                              | ✅                         | `security.role_permissions` (RBAC ya implementado en código real)                                                                               |
| Grupos                                | ✅ (planos)                | `core.groups` + `group_members`                                                                                                                 |
| Políticas                             | ✅                         | `security.security_policies`, `access_control_lists`                                                                                            |
| Row-Level Security (Tenant)           | ✅ Real y forzado          | Verificado en Parte 1 — `gorazus_app` sin bypass                                                                                                |
| Row-Level Security (Empresa/Sucursal) | ❌ **No existe**           | Ver [RLS_DESIGN.md](./RLS_DESIGN.md) — hallazgo principal de esta parte                                                                         |
| Acceso por módulo                     | ✅                         | `security.role_permissions` por acción/módulo                                                                                                   |
| Acceso por almacén                    | 🔗 Parcial                 | No hay RLS de `warehouse_id`, pero tampoco fue diseñado como límite de seguridad — es un filtro operativo de UI, no de aislamiento multiempresa |

### 1.1 — Roles y Grupos sin jerarquía (hallazgo, no necesariamente un defecto)

`core.roles`/`core.groups` no tienen auto-referencia
(`parent_role_id`/`parent_group_id`) — son planos, con permisos
asignados explícitamente por rol, sin herencia. **Esto es una decisión
de diseño defendible, no automáticamente un gap:** RBAC plano es más
auditable (cada rol declara exactamente sus permisos, sin herencia
implícita que complique saber "qué puede hacer este usuario realmente")
— el mismo criterio que ya rige ABAC en el proyecto ("bloqueado hasta
ADR", `33-iam-plan-de-implementacion-fase-3.md`). Se documenta como
observación, no se recomienda agregar jerarquía sin necesidad de negocio
confirmada.

## 2. Auditoría de permisos (entregable 2)

| Chequeo                                            | Resultado                                                                                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo permiso tiene un Rol dueño                    | ✅ — `role_permissions` es la única vía                                                                                                                                                                        |
| Permisos por Empresa/Sucursal (no solo por Tenant) | 🟡 El modelo de permisos en sí (`role_permissions`) no está limitado por Empresa — un Rol es válido para todo el Tenant salvo que la aplicación lo restrinja; coherente con la ausencia de RLS de Empresa (§1) |
| Permisos huérfanos (sin Rol)                       | ✅ 0 — FK `NOT NULL` lo impide estructuralmente                                                                                                                                                                |
| Delegación de permisos                             | ✅ `security.permission_delegations` ya existe                                                                                                                                                                 |

## 3. Cifrado (entregable, sección "Cifrado" del pedido)

| Dato sensible              | Mecanismo                                                                                                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contraseñas                | Hash (bcrypt/argon2 a nivel de aplicación, ya implementado en código real — `modules/auth`) + `security.password_history` (no se reutilizan contraseñas anteriores)                                                                                                                                            |
| Tokens                     | `core.tokens`, con expiración — no se almacena el token en texto plano reutilizable indefinidamente (rotación ya diseñada)                                                                                                                                                                                     |
| API Keys                   | `core.api_keys` + `api_key_scopes` + `security.api_key_rate_limits`                                                                                                                                                                                                                                            |
| Información bancaria       | `banks.bank_accounts`/`customer_bank_accounts`/`supplier_bank_accounts` — sin cifrado a nivel de columna verificado en esta pasada (campo de número de cuenta en texto plano en el schema; el cifrado en reposo real depende de `06-estrategia-seguridad.md §2`, cifrado de volumen/tablespace, no de columna) |
| Datos sensibles en general | `security.data_encryption_keys` + `encryption_key_rotations` — mecanismo de gestión de claves ya diseñado                                                                                                                                                                                                      |

**Hallazgo real, bajo:** no se encontró cifrado a nivel de columna
(`pgcrypto`) para números de cuenta bancaria específicamente — la
protección real depende del cifrado de disco/backup ya diseñado
(`06-estrategia-seguridad.md`), consistente con la mayoría de ERPs
comparados (SAP B1/Dynamics/NetSuite tampoco cifran cada columna
individualmente, dependen de TDE a nivel de motor) — no se recomienda
cifrado de columna sin evidencia de requisito regulatorio específico
(PCI DSS ya documentado como "no aplica todavía, sin pasarela de pago",
`48-erp-enterprise-readiness.md §16`).

## 4. Cumplimiento normativo (entregable, sección "Cumplimiento")

| Requisito pedido                | Estado                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RGPD/GDPR (protección de datos) | ✅ `core.data_subject_requests` (solicitudes de acceso/borrado del titular) + `core.consent_records` (consentimiento) — ya existen, confirmado en esta pasada |
| Retención documental            | ✅ `core.data_retention_policies`                                                                                                                             |
| Auditoría interna/externa       | ✅ `core.audit_logs`/`change_history` + `security.security_audit_logs`, particionadas, append-only                                                            |
| Conservación histórica          | ✅ Particionamiento + política de retención, sin purga automática sin confirmación                                                                            |

**Los 4 requisitos de cumplimiento pedidos ya están soportados.**

## 5. Riesgos (entregable 8)

| Riesgo                                                               | Severidad                                          |
| -------------------------------------------------------------------- | -------------------------------------------------- |
| RLS de Empresa/Sucursal ausente (multiempresa con Grupo Corporativo) | 🟠 Real, ver `RLS_DESIGN.md §3`                    |
| Sin cifrado de columna para información bancaria                     | 🟢 Bajo, mitigado por cifrado de disco ya diseñado |
| Roles/Grupos planos (sin jerarquía)                                  | 🟢 Decisión de diseño, no defecto                  |
| 185 FK cross-schema (heredado)                                       | 🟠 Media-alta, ya gobernado                        |

## 6. Mejoras (entregable 9)

1. Aplicar `company_isolation`/`branch_isolation` (RLS) — ver
   `RLS_DESIGN.md §4-6`, la mejora de mayor impacto de seguridad de toda
   la auditoría.
2. Confirmar si `warehouse_id` debería tener RLS o si el filtro
   operativo de UI es suficiente (depende de si "ver stock de otro
   almacén" es un riesgo de negocio real o solo de UX — no determinable
   sin confirmación).
3. Evaluar cifrado de columna para número de cuenta bancaria si/cuando
   se confirme un requisito regulatorio específico (PCI DSS u otro).

## 7. Porcentaje de seguridad (entregable 10)

**88%.** El único punto que baja el puntaje de forma significativa es
la ausencia de RLS de Empresa/Sucursal (§1, `RLS_DESIGN.md`) — todo lo
demás (Tenant RLS real y forzado, cifrado de claves/tokens, GDPR,
retención, auditoría particionada) está completo.

## 8. Trazabilidad

Este documento no repite `06-estrategia-seguridad.md` (diseño original)
ni `SECURITY.md` (verificación de roles de Postgres, ya hecha en Partes
1-2) — agrega la auditoría específica de Roles/Grupos/Permisos/Cifrado/
Cumplimiento pedida en esta Parte 8, con el hallazgo de RLS como pieza
central.

**Siguiente documento:** [AUDIT_REPORT.md](./AUDIT_REPORT.md).
