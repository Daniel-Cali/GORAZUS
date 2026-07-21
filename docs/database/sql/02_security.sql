-- =============================================================================
-- GORAZUS ERP — 02_security.sql
-- Módulo: Security (autorización fina y autenticación avanzada)
-- Schema: security
-- Depende de: 01_core.sql (core.tenants, core.companies, core.branches, core.users, core.permissions)
-- Documentación funcional: docs/database/logico/02-security.md
-- Patrón universal de 18 columnas: ver 01_core.sql (encabezado). No se repite
-- la explicación acá, solo se declara igual en cada tabla.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS security;

-- =============================================================================
-- SECCIÓN 1: Control de acceso fino (ACL)
-- =============================================================================

CREATE TABLE security.access_control_lists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name            TEXT NOT NULL,
    resource_type   TEXT NOT NULL
);
COMMENT ON TABLE security.access_control_lists IS 'Lista de control de acceso nombrada, aplicable a un tipo de recurso. Complementa a core.roles/permissions para autorización a nivel de registro individual.';

CREATE TABLE security.acl_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    acl_id          UUID NOT NULL REFERENCES security.access_control_lists(id),
    subject_type    TEXT NOT NULL CHECK (subject_type IN ('user', 'role', 'group')),
    subject_id      UUID NOT NULL,
    resource_id     UUID,  -- NULL = aplica al patrón completo del resource_type de la ACL
    effect          TEXT NOT NULL CHECK (effect IN ('allow', 'deny'))
);
COMMENT ON TABLE security.acl_entries IS 'Regla individual de ACL: sujeto, recurso, efecto (permitir/denegar).';
CREATE INDEX idx_security_acl_entries_subject ON security.acl_entries (subject_type, subject_id) WHERE deleted_at IS NULL;

CREATE TABLE security.permission_delegations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    delegator_user_id UUID NOT NULL REFERENCES core.users(id),
    delegate_user_id    UUID NOT NULL REFERENCES core.users(id),
    permission_id          UUID NOT NULL REFERENCES core.permissions(id),
    starts_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at                    TIMESTAMPTZ NOT NULL
);
COMMENT ON TABLE security.permission_delegations IS 'Delegación temporal de un permiso de un usuario a otro (p. ej. cobertura de vacaciones).';

-- =============================================================================
-- SECCIÓN 2: Políticas de seguridad
-- =============================================================================

CREATE TABLE security.password_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    min_length          SMALLINT NOT NULL DEFAULT 12,
    requires_uppercase    BOOLEAN NOT NULL DEFAULT true,
    requires_number         BOOLEAN NOT NULL DEFAULT true,
    requires_symbol           BOOLEAN NOT NULL DEFAULT true,
    expires_after_days          INTEGER,
    history_count                 SMALLINT NOT NULL DEFAULT 5
);
COMMENT ON TABLE security.password_policies IS 'Reglas de complejidad/expiración de contraseña por empresa.';

CREATE TABLE security.security_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    password_policy_id     UUID REFERENCES security.password_policies(id),
    max_login_attempts       SMALLINT NOT NULL DEFAULT 5,
    lockout_duration_minutes   SMALLINT NOT NULL DEFAULT 15,
    requires_2fa                  BOOLEAN NOT NULL DEFAULT false,
    session_timeout_minutes         SMALLINT NOT NULL DEFAULT 30
);
COMMENT ON TABLE security.security_policies IS 'Política de seguridad aplicable a un tenant/empresa (referencia a password_policies y demás reglas).';

CREATE TABLE security.password_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID NOT NULL REFERENCES core.users(id),
    password_hash   TEXT NOT NULL
);
COMMENT ON TABLE security.password_history IS 'Historial de hashes de contraseña por usuario, para impedir reutilización.';

CREATE TABLE security.login_attempts (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID REFERENCES core.users(id),  -- NULL si el email ni siquiera existe
    email_attempted TEXT NOT NULL,
    ip_address      INET,
    succeeded       BOOLEAN NOT NULL,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE security.login_attempts IS 'Registro de cada intento de login. Tabla particionada mensualmente, ver 29_partitioning.sql.';

CREATE TABLE security.ip_allowlist_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    cidr_range      CIDR NOT NULL
);
COMMENT ON TABLE security.ip_allowlist_entries IS 'Rango de IP autorizado por empresa/usuario.';

CREATE TABLE security.ip_denylist_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    cidr_range      CIDR NOT NULL,
    reason          TEXT
);
COMMENT ON TABLE security.ip_denylist_entries IS 'Rango de IP bloqueado.';

-- =============================================================================
-- SECCIÓN 3: OAuth y API
-- =============================================================================

CREATE TABLE security.oauth_clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    name            TEXT NOT NULL,
    client_id       TEXT NOT NULL,
    client_secret_hash TEXT NOT NULL,
    redirect_uris       TEXT[] NOT NULL
);
COMMENT ON TABLE security.oauth_clients IS 'Aplicación cliente registrada para flujo OAuth2.';
CREATE UNIQUE INDEX uq_security_oauth_clients_client_id ON security.oauth_clients (client_id);

CREATE TABLE security.oauth_scopes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    code            TEXT NOT NULL,
    description     TEXT
);
COMMENT ON TABLE security.oauth_scopes IS 'Catálogo de scopes disponibles para clientes OAuth2.';
CREATE UNIQUE INDEX uq_security_oauth_scopes_code ON security.oauth_scopes (code);

CREATE TABLE security.oauth_client_scopes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    client_id       UUID NOT NULL REFERENCES security.oauth_clients(id),
    scope_id        UUID NOT NULL REFERENCES security.oauth_scopes(id)
);
COMMENT ON TABLE security.oauth_client_scopes IS 'Scopes autorizados para un cliente OAuth2 (N:M).';
CREATE UNIQUE INDEX uq_security_oauth_client_scopes ON security.oauth_client_scopes (client_id, scope_id) WHERE deleted_at IS NULL;

CREATE TABLE security.oauth_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    client_id       UUID NOT NULL REFERENCES security.oauth_clients(id),
    user_id         UUID REFERENCES core.users(id),
    access_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT,
    expires_at        TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ
);
COMMENT ON TABLE security.oauth_tokens IS 'Access/refresh tokens emitidos vía OAuth2.';

CREATE TABLE security.api_key_rate_limits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    api_key_id      UUID NOT NULL REFERENCES core.api_keys(id),
    requests_per_minute INTEGER NOT NULL DEFAULT 60
);
COMMENT ON TABLE security.api_key_rate_limits IS 'Límite de tasa configurado por API key.';
CREATE UNIQUE INDEX uq_security_api_key_rate_limits ON security.api_key_rate_limits (api_key_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 4: Autenticación de dos factores
-- =============================================================================

CREATE TABLE security.two_factor_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID NOT NULL REFERENCES core.users(id),
    method          TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email')),
    encrypted_secret TEXT NOT NULL,
    confirmed_at      TIMESTAMPTZ
);
COMMENT ON TABLE security.two_factor_credentials IS 'Secreto TOTP/dispositivo registrado para 2FA de un usuario.';

CREATE TABLE security.two_factor_backup_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID NOT NULL REFERENCES core.users(id),
    code_hash       TEXT NOT NULL,
    used_at         TIMESTAMPTZ
);
COMMENT ON TABLE security.two_factor_backup_codes IS 'Códigos de un solo uso de respaldo para 2FA.';

CREATE TABLE security.two_factor_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID NOT NULL REFERENCES core.users(id),
    succeeded       BOOLEAN NOT NULL,
    ip_address      INET
);
COMMENT ON TABLE security.two_factor_challenges IS 'Registro de cada verificación 2FA solicitada.';

CREATE TABLE security.trusted_devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    user_id         UUID NOT NULL REFERENCES core.users(id),
    device_id       UUID NOT NULL REFERENCES core.user_devices(id),
    trusted_until   TIMESTAMPTZ NOT NULL
);
COMMENT ON TABLE security.trusted_devices IS 'Dispositivo marcado como confiable para omitir 2FA por un período.';

-- =============================================================================
-- SECCIÓN 5: Cifrado y gestión de secretos
-- =============================================================================

CREATE TABLE security.data_encryption_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    kms_key_reference TEXT NOT NULL,  -- referencia al KMS externo; la clave real NUNCA vive acá
    purpose             TEXT NOT NULL,  -- p. ej. 'bank_accounts', 'tax_ids'
    is_current             BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE security.data_encryption_keys IS 'Metadato de referencia a claves de cifrado a nivel de columna. La clave real vive en un KMS externo (ver 06-estrategia-seguridad.md §3).';

CREATE TABLE security.encryption_key_rotations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    encryption_key_id UUID NOT NULL REFERENCES security.data_encryption_keys(id),
    rotated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_by_user_id     UUID REFERENCES core.users(id)
);
COMMENT ON TABLE security.encryption_key_rotations IS 'Historial de rotación de claves de cifrado.';

-- =============================================================================
-- SECCIÓN 6: Auditoría de seguridad e incidentes
-- =============================================================================

CREATE TABLE security.security_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    event_type      TEXT NOT NULL,  -- p. ej. 'permission_denied', 'privilege_escalation_attempt', 'key_rotated'
    actor_user_id   UUID REFERENCES core.users(id),
    ip_address      INET,
    details         JSONB NOT NULL DEFAULT '{}'::jsonb
);
COMMENT ON TABLE security.security_audit_logs IS 'Log de eventos de seguridad (distinto de core.audit_logs, que registra cambios de datos de negocio). Inmutable igual que core.audit_logs.';

CREATE TABLE security.session_activity_logs (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    session_id      UUID NOT NULL REFERENCES core.sessions(id),
    event_type      TEXT NOT NULL,  -- 'access_denied', 'out_of_policy_attempt'
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE security.session_activity_logs IS 'Actividad granular dentro de una sesión con foco en seguridad. Particionada mensualmente.';

CREATE TABLE security.security_incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    title           TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed'))
);
COMMENT ON TABLE security.security_incidents IS 'Incidente de seguridad detectado/reportado.';

CREATE TABLE security.security_incident_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID REFERENCES core.companies(id),
    branch_id       UUID REFERENCES core.branches(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES core.users(id),
    updated_by      UUID REFERENCES core.users(id),
    deleted_by      UUID REFERENCES core.users(id),
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    incident_id     UUID NOT NULL REFERENCES security.security_incidents(id),
    event_description TEXT NOT NULL,
    occurred_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE security.security_incident_events IS 'Línea de tiempo de un incidente de seguridad.';

-- =============================================================================
-- FIN 02_security.sql — 24 tablas.
-- Notas de portabilidad: iguales a las de 01_core.sql. CIDR/INET son tipos
-- nativos de Postgres sin equivalente exacto en los otros motores — se
-- reemplazan por VARCHAR con validación a nivel de aplicación al portar.
-- =============================================================================
