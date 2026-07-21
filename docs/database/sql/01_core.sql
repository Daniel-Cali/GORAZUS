-- =============================================================================
-- GORAZUS ERP — 01_core.sql
-- Módulo: Core (fundacional)
-- Schema: core
-- Depende de: (ninguno — primer archivo a ejecutar, en este orden)
-- Documentación funcional: docs/database/logico/01-core.md
-- Motor: PostgreSQL 17. Notas de portabilidad al final del archivo.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS core;

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- cifrado de columna (pgp_sym_encrypt), usado desde 02_security.sql en adelante
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- búsqueda de texto libre (GIN + trigram)

-- -----------------------------------------------------------------------------
-- PATRÓN UNIVERSAL — ver docs/database/01-modelo-conceptual.md §1.
-- Toda tabla de los 21 schemas de negocio declara este bloque de 18 columnas
-- de forma idéntica (Postgres no soporta "mixins" de columnas fuera de
-- herencia de tabla, descartada deliberadamente — ver motivo en el documento
-- de arquitectura referenciado). Se documenta una única vez acá; el resto de
-- los archivos SQL solo comentan desvíos puntuales, no repiten la explicación.
--
--   id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   local_id      BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL
--   tenant_id     UUID NOT NULL REFERENCES core.tenants(id)
--   company_id    UUID REFERENCES core.companies(id)
--   branch_id     UUID REFERENCES core.branches(id)
--   created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
--   updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
--   deleted_at    TIMESTAMPTZ
--   created_by    UUID REFERENCES core.users(id)   -- NULLABLE: resuelve el bootstrap circular tenant↔user↔company, ver §BOOTSTRAP abajo
--   updated_by    UUID REFERENCES core.users(id)
--   deleted_by    UUID REFERENCES core.users(id)
--   version       INTEGER NOT NULL DEFAULT 1        -- versión de negocio (optimistic locking semántico, controlado por la aplicación)
--   row_version   BIGINT NOT NULL DEFAULT 0          -- versión técnica (incrementada por trigger en cada UPDATE físico, ver 26_triggers.sql)
--   is_active     BOOLEAN NOT NULL DEFAULT true
--   is_deleted    BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED
--   observations  TEXT
--   metadata      JSONB NOT NULL DEFAULT '{}'::jsonb
--
-- Sentinela de tenant global (catálogos del sistema, compartidos por todos
-- los tenants): '00000000-0000-0000-0000-000000000000'. Sembrado en
-- 22_seed_data.sql como la primera fila de core.tenants.
--
-- §BOOTSTRAP: core.tenants, core.users y core.companies tienen una
-- dependencia circular de auditoría (toda fila necesita created_by → users,
-- pero la primera fila de users no puede referenciar una fila de users
-- previa). Se resuelve dejando created_by/updated_by NULLABLE — la fila
-- semilla del tenant/usuario SYSTEM se inserta con created_by = NULL y las
-- filas siguientes ya referencian al usuario SYSTEM normalmente. No se
-- requiere DEFERRABLE ni ALTER TABLE posterior: el orden de creación de
-- tablas de este archivo (tenants → users → companies → branches → resto)
-- ya es suficiente porque el FK problemático (created_by) es nullable.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- SECCIÓN 1: Organización y multiempresa
-- =============================================================================

CREATE TABLE core.tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL,  -- un tenant es su propio tenant_id (autorreferencia lógica, ver CHECK abajo)
    company_id      UUID,
    branch_id       UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID,
    version         INTEGER NOT NULL DEFAULT 1,
    row_version     BIGINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_deleted      BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    observations    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- columnas propias
    legal_name      TEXT NOT NULL,
    trade_name      TEXT,
    slug            TEXT NOT NULL,
    contact_email   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
    CONSTRAINT ck_tenants_self_reference CHECK (tenant_id = id OR tenant_id IS NOT NULL)
);
COMMENT ON TABLE core.tenants IS 'Cliente SaaS que aloja una instancia lógica de GORAZUS. Raíz de la jerarquía de aislamiento tenant→company→branch (ver docs/database/01-modelo-conceptual.md §2).';
COMMENT ON COLUMN core.tenants.slug IS 'Identificador corto usado en subdominios/URLs del tenant.';
CREATE UNIQUE INDEX uq_core_tenants_slug ON core.tenants (slug) WHERE deleted_at IS NULL;

CREATE TABLE core.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID,  -- FK agregada tras crear core.companies (ver ALTER al final de esta sección)
    branch_id       UUID,
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
    email               TEXT NOT NULL,
    password_hash       TEXT,  -- argon2id; NULL si el usuario solo autentica vía OAuth externo
    full_name           TEXT NOT NULL,
    is_system_account   BOOLEAN NOT NULL DEFAULT false,  -- true únicamente para el usuario SYSTEM sembrado en 22_seed_data.sql
    last_login_at        TIMESTAMPTZ
);
COMMENT ON TABLE core.users IS 'Cuenta de usuario del sistema. Credenciales avanzadas (2FA, OAuth) delegadas a security.*.';
CREATE UNIQUE INDEX uq_core_users_tenant_email ON core.users (tenant_id, lower(email)) WHERE deleted_at IS NULL;

CREATE TABLE core.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID,
    branch_id       UUID,
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
    legal_name          TEXT NOT NULL,
    trade_name          TEXT,
    tax_id              TEXT NOT NULL,
    tax_regime          TEXT,
    functional_currency_code CHAR(3) NOT NULL,  -- FK real agregada en 21_configuration.sql (configuration.currencies ya existe para entonces)
    fiscal_year_start_month  SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12)
);
COMMENT ON TABLE core.companies IS 'Empresa legal dentro de un tenant (multiempresa). Cada una con su propio ejercicio fiscal y plan de cuentas.';
CREATE UNIQUE INDEX uq_core_companies_tenant_taxid ON core.companies (tenant_id, tax_id) WHERE deleted_at IS NULL;

ALTER TABLE core.users ADD CONSTRAINT fk_core_users_company FOREIGN KEY (company_id) REFERENCES core.companies(id);

CREATE TABLE core.branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
    branch_id       UUID,
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
    code            TEXT NOT NULL,
    is_main_branch  BOOLEAN NOT NULL DEFAULT false,
    address_line    TEXT,
    phone           TEXT
);
COMMENT ON TABLE core.branches IS 'Sucursal dentro de una empresa (multisucursal). Base de aislamiento para almacenes, cajas y series de numeración.';
CREATE UNIQUE INDEX uq_core_branches_company_code ON core.branches (company_id, code) WHERE deleted_at IS NULL;

ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_self CHECK (true); -- placeholder de legibilidad; ver ck_tenants_self_reference arriba
ALTER TABLE core.users ADD CONSTRAINT fk_core_users_branch FOREIGN KEY (branch_id) REFERENCES core.branches(id);
ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_company FOREIGN KEY (company_id) REFERENCES core.companies(id);
ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_branch FOREIGN KEY (branch_id) REFERENCES core.branches(id);
ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_created_by FOREIGN KEY (created_by) REFERENCES core.users(id);
ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_updated_by FOREIGN KEY (updated_by) REFERENCES core.users(id);
ALTER TABLE core.tenants ADD CONSTRAINT fk_core_tenants_deleted_by FOREIGN KEY (deleted_by) REFERENCES core.users(id);
ALTER TABLE core.companies ADD CONSTRAINT fk_core_companies_branch FOREIGN KEY (branch_id) REFERENCES core.branches(id);

CREATE TABLE core.departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
    company_id      UUID NOT NULL REFERENCES core.companies(id),
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
    name                TEXT NOT NULL,
    code                TEXT NOT NULL,
    parent_department_id UUID REFERENCES core.departments(id)
);
COMMENT ON TABLE core.departments IS 'Departamento organizacional jerárquico (auto-referenciado, N niveles). Reutilizado por hr — nunca redeclarado en otro módulo.';
CREATE UNIQUE INDEX uq_core_departments_company_code ON core.departments (company_id, code) WHERE deleted_at IS NULL;

CREATE TABLE core.user_companies (
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
    target_company_id UUID NOT NULL REFERENCES core.companies(id),
    is_default      BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE core.user_companies IS 'Acceso N:M de un usuario a empresas del mismo tenant (soporta contadores/gerentes que operan varias empresas).';
CREATE UNIQUE INDEX uq_core_user_companies ON core.user_companies (user_id, target_company_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 2: Suscripción SaaS del tenant
-- =============================================================================

CREATE TABLE core.tenant_subscriptions (
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
    plan_code           TEXT NOT NULL,
    max_users           INTEGER,
    max_companies        INTEGER,
    max_branches          INTEGER,
    max_warehouses          INTEGER,
    billing_cycle             TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    starts_at                  DATE NOT NULL,
    ends_at                     DATE
);
COMMENT ON TABLE core.tenant_subscriptions IS 'Plan SaaS contratado por el tenant: módulos habilitados, límites de usuarios/empresas/sucursales/almacenes. max_branches y max_warehouses agregados por docs/architecture/32-core-platform/01-kernel-y-composicion.md §7 (License Manager) — NULL significa sin límite en ese eje.';

CREATE TABLE core.tenant_subscription_features (
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
    subscription_id  UUID NOT NULL REFERENCES core.tenant_subscriptions(id),
    module_code       TEXT NOT NULL  -- p. ej. 'sales', 'payroll', 'bi' — corresponde a los 21 schemas de negocio
);
COMMENT ON TABLE core.tenant_subscription_features IS 'Módulo/feature incluido en una suscripción (N:M lógico vía module_code).';
CREATE UNIQUE INDEX uq_core_tsf_subscription_module ON core.tenant_subscription_features (subscription_id, module_code) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 3: Identidad y control de acceso base
-- =============================================================================

CREATE TABLE core.user_profiles (
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
    user_id             UUID NOT NULL REFERENCES core.users(id),
    avatar_file_id      UUID,  -- FK real agregada tras crear core.files
    preferred_language  TEXT NOT NULL DEFAULT 'es',
    preferred_timezone  TEXT NOT NULL DEFAULT 'UTC'
);
COMMENT ON TABLE core.user_profiles IS 'Datos extendidos de perfil de usuario (1:1 con core.users).';
CREATE UNIQUE INDEX uq_core_user_profiles_user ON core.user_profiles (user_id) WHERE deleted_at IS NULL;

CREATE TABLE core.user_devices (
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
    user_id           UUID NOT NULL REFERENCES core.users(id),
    device_type        TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    push_token          TEXT,
    last_seen_at         TIMESTAMPTZ
);
COMMENT ON TABLE core.user_devices IS 'Dispositivo registrado de un usuario (push notifications; base para trusted_devices en security).';

CREATE TABLE core.roles (
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
    is_system_role  BOOLEAN NOT NULL DEFAULT false  -- roles de fábrica (Administrador, Vendedor...) no eliminables
);
COMMENT ON TABLE core.roles IS 'Rol base por empresa. Ver security.access_control_lists para autorización fina a nivel de registro.';
CREATE UNIQUE INDEX uq_core_roles_company_name ON core.roles (company_id, name) WHERE deleted_at IS NULL;

CREATE TABLE core.permissions (
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
    code            TEXT NOT NULL,  -- '<modulo>.<accion>', ver docs/architecture/09-seguridad-y-multiempresa.md §2
    module_code     TEXT NOT NULL,
    action_code     TEXT NOT NULL,
    description     TEXT
);
COMMENT ON TABLE core.permissions IS 'Catálogo de permisos del sistema en formato <modulo>.<accion>.';
CREATE UNIQUE INDEX uq_core_permissions_code ON core.permissions (code) WHERE deleted_at IS NULL;

CREATE TABLE core.role_permissions (
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
    role_id         UUID NOT NULL REFERENCES core.roles(id),
    permission_id   UUID NOT NULL REFERENCES core.permissions(id)
);
COMMENT ON TABLE core.role_permissions IS 'Asignación N:M de permisos a un rol. Lleva auditoría completa: quién otorgó qué permiso y cuándo es dato de negocio real en un ERP auditable.';
CREATE UNIQUE INDEX uq_core_role_permissions ON core.role_permissions (role_id, permission_id) WHERE deleted_at IS NULL;

CREATE TABLE core.user_roles (
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
    role_id         UUID NOT NULL REFERENCES core.roles(id)
);
COMMENT ON TABLE core.user_roles IS 'Asignación N:M de roles a un usuario.';
CREATE UNIQUE INDEX uq_core_user_roles ON core.user_roles (user_id, role_id) WHERE deleted_at IS NULL;

CREATE TABLE core.groups (
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
    name            TEXT NOT NULL
);
COMMENT ON TABLE core.groups IS 'Agrupación libre de usuarios (distinta de rol — para distribución de notificaciones, no autorización).';

CREATE TABLE core.group_members (
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
    group_id        UUID NOT NULL REFERENCES core.groups(id),
    user_id         UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE core.group_members IS 'Miembros N:M de un grupo.';
CREATE UNIQUE INDEX uq_core_group_members ON core.group_members (group_id, user_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 4: Parametrización y feature flags
-- =============================================================================

CREATE TABLE core.system_parameters (
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
    key             TEXT NOT NULL,
    data_type       TEXT NOT NULL CHECK (data_type IN ('string', 'integer', 'decimal', 'boolean', 'json', 'date')),
    default_value   TEXT
);
COMMENT ON TABLE core.system_parameters IS 'Catálogo de parámetros disponibles con su tipo de dato y valor por defecto (metadata de system_settings).';
CREATE UNIQUE INDEX uq_core_system_parameters_key ON core.system_parameters (key) WHERE deleted_at IS NULL;

CREATE TABLE core.system_settings (
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
    parameter_id    UUID NOT NULL REFERENCES core.system_parameters(id),
    value           TEXT NOT NULL
);
COMMENT ON TABLE core.system_settings IS 'Valor configurado de un parámetro a nivel tenant/empresa.';
CREATE UNIQUE INDEX uq_core_system_settings_scope ON core.system_settings (tenant_id, company_id, parameter_id) WHERE deleted_at IS NULL;

CREATE TABLE core.feature_flags (
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
    flag_key        TEXT NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage SMALLINT CHECK (rollout_percentage BETWEEN 0 AND 100)
);
COMMENT ON TABLE core.feature_flags IS 'Activación progresiva de funcionalidades nuevas por tenant.';
CREATE UNIQUE INDEX uq_core_feature_flags ON core.feature_flags (tenant_id, flag_key) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 5: Notificaciones
-- =============================================================================

CREATE TABLE core.notification_channels (
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
    channel_type    TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'push', 'whatsapp', 'in_app')),
    provider_name   TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE core.notification_channels IS 'Canal configurado (email/SMS/push/WhatsApp/in-app) con sus credenciales de envío en metadata (cifradas a nivel de aplicación).';

CREATE TABLE core.notification_templates (
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
    event_code      TEXT NOT NULL,  -- p. ej. 'sales.invoice_confirmed'
    default_channel_id UUID REFERENCES core.notification_channels(id)
);
COMMENT ON TABLE core.notification_templates IS 'Plantilla de notificación disparada por un evento de dominio.';

CREATE TABLE core.notification_template_translations (
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
    template_id     UUID NOT NULL REFERENCES core.notification_templates(id),
    language_code   TEXT NOT NULL,
    subject         TEXT,
    body            TEXT NOT NULL
);
COMMENT ON TABLE core.notification_template_translations IS 'Traducción de una plantilla de notificación por idioma (patrón _translations, ver docs/database/02-modelo-logico.md §1.2).';
CREATE UNIQUE INDEX uq_core_ntt ON core.notification_template_translations (template_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE core.notifications (
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
    recipient_user_id  UUID NOT NULL REFERENCES core.users(id),
    template_id          UUID REFERENCES core.notification_templates(id),
    subject               TEXT,
    body                   TEXT NOT NULL,
    read_at                 TIMESTAMPTZ
);
COMMENT ON TABLE core.notifications IS 'Notificación generada para un usuario.';
CREATE INDEX idx_core_notifications_recipient_unread ON core.notifications (recipient_user_id) WHERE read_at IS NULL AND deleted_at IS NULL;

CREATE TABLE core.notification_recipients (
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
    notification_id UUID NOT NULL REFERENCES core.notifications(id),
    user_id         UUID NOT NULL REFERENCES core.users(id)
);
COMMENT ON TABLE core.notification_recipients IS 'Destinatarios adicionales de una notificación (más allá del principal).';

CREATE TABLE core.notification_delivery_logs (
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
    notification_id UUID NOT NULL REFERENCES core.notifications(id),
    channel_id      UUID NOT NULL REFERENCES core.notification_channels(id),
    status          TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    provider_response TEXT,
    -- PK/UNIQUE deben incluir la columna de partición (created_at) — regla de Postgres
    -- para tablas particionadas, ver 29_partitioning.sql cabecera y runbook de conversión
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE core.notification_delivery_logs IS 'Registro de cada intento de envío por canal. Tabla particionada mensualmente, ver 29_partitioning.sql.';

CREATE TABLE core.notification_preferences (
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
    channel_id      UUID NOT NULL REFERENCES core.notification_channels(id),
    event_code      TEXT NOT NULL,
    is_opted_in     BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE core.notification_preferences IS 'Preferencia de opt-in/opt-out de un usuario por canal y tipo de evento.';
CREATE UNIQUE INDEX uq_core_notification_preferences ON core.notification_preferences (user_id, channel_id, event_code) WHERE deleted_at IS NULL;

-- =============================================================================
-- SECCIÓN 6: Auditoría y bitácoras técnicas
-- =============================================================================

CREATE TABLE core.audit_logs (
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
    -- columnas propias — ver docs/database/05-estrategia-auditoria.md §2
    table_schema    TEXT NOT NULL,
    table_name      TEXT NOT NULL,
    row_id          UUID NOT NULL,
    operation       TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values      JSONB,
    new_values      JSONB,
    changed_columns TEXT[],
    actor_user_id   UUID REFERENCES core.users(id),
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- PK/UNIQUE deben incluir la columna de partición (occurred_at)
    PRIMARY KEY (id, occurred_at),
    UNIQUE (local_id, occurred_at)
) PARTITION BY RANGE (occurred_at);
COMMENT ON TABLE core.audit_logs IS 'Captura genérica de cambios vía trigger (26_triggers.sql). INMUTABLE: solo gorazus_audit_writer tiene INSERT, nadie tiene UPDATE/DELETE (ver 06-estrategia-seguridad.md). Particionada mensualmente por occurred_at.';

CREATE TABLE core.system_logs (
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
    level           TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
    message         TEXT NOT NULL,
    context         JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE core.system_logs IS 'Logs técnicos de la aplicación (no de negocio). Particionada mensualmente.';

CREATE TABLE core.activity_logs (
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
    user_id         UUID NOT NULL REFERENCES core.users(id),
    action_code     TEXT NOT NULL,
    entity_type     TEXT,
    entity_id       UUID,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE core.activity_logs IS 'Bitácora de actividad de usuario (navegación, acciones) para analítica de uso. Particionada mensualmente.';

CREATE TABLE core.change_history (
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
    table_schema    TEXT NOT NULL,
    table_name      TEXT NOT NULL,
    row_id          UUID NOT NULL,
    snapshot        JSONB NOT NULL,  -- fila completa serializada
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE core.change_history IS 'Snapshot completo selectivo (no todas las tablas) para reconstrucción histórica — ver 05-estrategia-auditoria.md §3.';

-- =============================================================================
-- SECCIÓN 7: Autenticación técnica (complementa a security)
-- =============================================================================

CREATE TABLE core.tokens (
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
    token_hash      TEXT NOT NULL,
    purpose         TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset', 'invitation')),
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ
);
COMMENT ON TABLE core.tokens IS 'Tokens de propósito general (verificación de correo, restablecimiento de contraseña).';

CREATE TABLE core.api_keys (
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
    key_hash        TEXT NOT NULL,
    key_prefix      TEXT NOT NULL,  -- primeros caracteres visibles para identificación humana
    expires_at      TIMESTAMPTZ
);
COMMENT ON TABLE core.api_keys IS 'Claves de API emitidas para integraciones. Solo se guarda el hash — el valor en texto plano se muestra una única vez al crearla.';
CREATE UNIQUE INDEX uq_core_api_keys_hash ON core.api_keys (key_hash);

CREATE TABLE core.api_key_scopes (
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
    permission_id   UUID NOT NULL REFERENCES core.permissions(id)
);
COMMENT ON TABLE core.api_key_scopes IS 'Alcance de permisos de una API key (N:M con permissions).';
CREATE UNIQUE INDEX uq_core_api_key_scopes ON core.api_key_scopes (api_key_id, permission_id) WHERE deleted_at IS NULL;

CREATE TABLE core.sessions (
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
    user_id             UUID NOT NULL REFERENCES core.users(id),
    refresh_token_hash    TEXT NOT NULL,
    ip_address              INET,
    user_agent               TEXT,
    revoked_at                TIMESTAMPTZ,
    expires_at                 TIMESTAMPTZ NOT NULL
);
COMMENT ON TABLE core.sessions IS 'Sesión activa de usuario — respaldo de estado de refresh token, ver docs/architecture/09-seguridad-y-multiempresa.md §1.';

-- =============================================================================
-- SECCIÓN 8: Archivos y documentos (repositorio transversal)
-- =============================================================================

CREATE TABLE core.files (
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
    storage_bucket  TEXT NOT NULL,
    storage_key     TEXT NOT NULL,
    original_name   TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    checksum_sha256 TEXT NOT NULL
);
COMMENT ON TABLE core.files IS 'Metadato físico del archivo (ruta en MinIO, tamaño, checksum).';

ALTER TABLE core.user_profiles ADD CONSTRAINT fk_core_user_profiles_avatar FOREIGN KEY (avatar_file_id) REFERENCES core.files(id);

CREATE TABLE core.document_types (
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
    name                    TEXT NOT NULL,
    retention_period_months INTEGER
);
COMMENT ON TABLE core.document_types IS 'Catálogo de tipos de documento (contrato, comprobante, certificado) con reglas de retención.';

CREATE TABLE core.documents (
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
    file_id             UUID NOT NULL REFERENCES core.files(id),
    document_type_id    UUID NOT NULL REFERENCES core.document_types(id),
    source_module         TEXT NOT NULL,  -- polimórfico: p. ej. 'sales', 'hr'
    source_entity_id       UUID NOT NULL,
    title                    TEXT NOT NULL
);
COMMENT ON TABLE core.documents IS 'Documento de negocio adjunto a un registro de cualquier módulo, vía (source_module, source_entity_id) polimórfico — reemplaza cualquier tabla "_documents" por módulo.';
CREATE INDEX idx_core_documents_source ON core.documents (source_module, source_entity_id) WHERE deleted_at IS NULL;

CREATE TABLE core.document_versions (
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
    document_id     UUID NOT NULL REFERENCES core.documents(id),
    file_id         UUID NOT NULL REFERENCES core.files(id),
    version_number  INTEGER NOT NULL
);
COMMENT ON TABLE core.document_versions IS 'Historial de versiones de un documento.';

CREATE TABLE core.signatures (
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
    document_id     UUID NOT NULL REFERENCES core.documents(id),
    signer_user_id  UUID REFERENCES core.users(id),
    signer_external_name TEXT,  -- firmante que no es usuario del sistema
    signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    signature_image_file_id UUID REFERENCES core.files(id)
);
COMMENT ON TABLE core.signatures IS 'Firma electrónica capturada sobre un documento.';

CREATE TABLE core.signature_requests (
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
    document_id     UUID NOT NULL REFERENCES core.documents(id),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_signed', 'completed', 'cancelled')),
    due_at          TIMESTAMPTZ
);
COMMENT ON TABLE core.signature_requests IS 'Solicitud de firma pendiente (workflow de firma con múltiples firmantes).';

-- =============================================================================
-- SECCIÓN 9: Plantillas y flujos de trabajo reutilizables
-- =============================================================================

CREATE TABLE core.templates (
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
    document_kind   TEXT NOT NULL,  -- p. ej. 'invoice', 'receipt'
    layout_html     TEXT NOT NULL
);
COMMENT ON TABLE core.templates IS 'Plantilla genérica de documento imprimible (el layout, no el contenido).';

CREATE TABLE core.template_translations (
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
    template_id     UUID NOT NULL REFERENCES core.templates(id),
    language_code   TEXT NOT NULL,
    layout_html     TEXT NOT NULL
);
COMMENT ON TABLE core.template_translations IS 'Traducción de plantilla por idioma.';
CREATE UNIQUE INDEX uq_core_template_translations ON core.template_translations (template_id, language_code) WHERE deleted_at IS NULL;

CREATE TABLE core.workflows (
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
    trigger_entity_type TEXT NOT NULL,  -- qué tipo de entidad dispara este workflow
    execution_mode        TEXT NOT NULL DEFAULT 'sequential' CHECK (execution_mode IN ('sequential', 'parallel'))
);
COMMENT ON TABLE core.workflows IS 'Definición de un flujo de aprobación reutilizable. execution_mode agregado por docs/architecture/32-core-platform/05-motores-de-logica-de-negocio.md §5 (Approval Engine: aprobación secuencial vs. paralela).';

CREATE TABLE core.workflow_steps (
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
    workflow_id     UUID NOT NULL REFERENCES core.workflows(id),
    step_order      INTEGER NOT NULL,
    approver_role_id UUID REFERENCES core.roles(id),
    approver_user_id  UUID REFERENCES core.users(id),
    transition_rule_set_key TEXT  -- referencia lógica (no FK — ver event_code en otras tablas) a
                                   -- core.business_rules.rule_set_key; NULL = avanza sin condición
);
COMMENT ON TABLE core.workflow_steps IS 'Paso de un workflow (orden, aprobador requerido — rol o usuario). transition_rule_set_key agregado por docs/architecture/32-core-platform/05-motores-de-logica-de-negocio.md §4 (Workflow Engine: condición de avance evaluada por el Business Rules Engine, ver SECCIÓN 13 más abajo).';

CREATE TABLE core.workflow_instances (
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
    workflow_id     UUID NOT NULL REFERENCES core.workflows(id),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'approved', 'rejected', 'cancelled'))
);
COMMENT ON TABLE core.workflow_instances IS 'Ejecución concreta de un workflow sobre un registro de negocio.';
CREATE INDEX idx_core_workflow_instances_entity ON core.workflow_instances (entity_type, entity_id) WHERE deleted_at IS NULL;

CREATE TABLE core.workflow_instance_steps (
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
    workflow_instance_id UUID NOT NULL REFERENCES core.workflow_instances(id),
    workflow_step_id       UUID NOT NULL REFERENCES core.workflow_steps(id),
    status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    decided_by_user_id        UUID REFERENCES core.users(id),
    decided_at                  TIMESTAMPTZ
);
COMMENT ON TABLE core.workflow_instance_steps IS 'Estado de cada paso dentro de una instancia de workflow.';

CREATE TABLE core.approvals (
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
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    requested_by_user_id UUID NOT NULL REFERENCES core.users(id),
    status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);
COMMENT ON TABLE core.approvals IS 'Solicitud de aprobación individual (puede o no venir de un workflow formal).';
CREATE INDEX idx_core_approvals_entity ON core.approvals (entity_type, entity_id) WHERE deleted_at IS NULL;

CREATE TABLE core.approval_steps (
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
    approval_id     UUID NOT NULL REFERENCES core.approvals(id),
    approver_user_id UUID NOT NULL REFERENCES core.users(id),
    decision           TEXT CHECK (decision IN ('approved', 'rejected')),
    decided_at            TIMESTAMPTZ
);
COMMENT ON TABLE core.approval_steps IS 'Paso/decisión dentro de una aprobación.';

CREATE TABLE core.approval_matrices (
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
    entity_type     TEXT NOT NULL,
    min_amount      NUMERIC(18,4),
    max_amount      NUMERIC(18,4),
    required_role_id UUID NOT NULL REFERENCES core.roles(id)
);
COMMENT ON TABLE core.approval_matrices IS 'Regla de "quién aprueba qué según monto/tipo" — enruta aprobaciones automáticamente.';

-- =============================================================================
-- SECCIÓN 10: Integraciones e importación/exportación masiva
-- =============================================================================

CREATE TABLE core.integrations (
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
    integration_type TEXT NOT NULL CHECK (integration_type IN ('electronic_invoicing', 'payment_gateway', 'ecommerce', 'edi', 'other')),
    is_enabled      BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE core.integrations IS 'Configuración de una integración externa (facturación electrónica, pasarela de pago, e-commerce).';

CREATE TABLE core.integration_credentials (
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
    integration_id  UUID NOT NULL REFERENCES core.integrations(id),
    credential_key  TEXT NOT NULL,
    encrypted_value TEXT NOT NULL  -- pgp_sym_encrypt, ver 06-estrategia-seguridad.md §3
);
COMMENT ON TABLE core.integration_credentials IS 'Credenciales cifradas de una integración.';

CREATE TABLE core.import_batches (
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
    target_module   TEXT NOT NULL,
    source_file_id  UUID REFERENCES core.files(id),
    executed_by_user_id UUID NOT NULL REFERENCES core.users(id),
    total_rows          INTEGER,
    success_rows          INTEGER,
    status                  TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed'))
);
COMMENT ON TABLE core.import_batches IS 'Ejecución de una importación masiva (módulo destino, archivo origen, resultado).';

CREATE TABLE core.import_batch_errors (
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
    import_batch_id UUID NOT NULL REFERENCES core.import_batches(id),
    row_number      INTEGER NOT NULL,
    error_message   TEXT NOT NULL,
    raw_row_data    JSONB
);
COMMENT ON TABLE core.import_batch_errors IS 'Fila de un batch que falló, con motivo.';

CREATE TABLE core.export_batches (
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
    source_module   TEXT NOT NULL,
    output_file_id  UUID REFERENCES core.files(id),
    executed_by_user_id UUID NOT NULL REFERENCES core.users(id),
    status               TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed'))
);
COMMENT ON TABLE core.export_batches IS 'Ejecución de una exportación masiva.';

CREATE TABLE core.scheduled_jobs (
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
    job_code        TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT true
);
COMMENT ON TABLE core.scheduled_jobs IS 'Definición de una tarea programada (respaldo, reporte recurrente, facturación recurrente, creación de particiones).';

CREATE TABLE core.scheduled_job_runs (
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
    scheduled_job_id UUID NOT NULL REFERENCES core.scheduled_jobs(id),
    started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at           TIMESTAMPTZ,
    status                  TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed'))
);
COMMENT ON TABLE core.scheduled_job_runs IS 'Historial de ejecuciones de una tarea programada.';

-- =============================================================================
-- SECCIÓN 11: Capacidades transversales genéricas
-- =============================================================================

CREATE TABLE core.tags (
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
    color_hex       TEXT
);
COMMENT ON TABLE core.tags IS 'Etiqueta libre reutilizable en cualquier módulo.';

CREATE TABLE core.entity_tags (
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
    tag_id          UUID NOT NULL REFERENCES core.tags(id),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL
);
COMMENT ON TABLE core.entity_tags IS 'Asignación polimórfica de una etiqueta a un registro de cualquier tabla.';
CREATE INDEX idx_core_entity_tags_entity ON core.entity_tags (entity_type, entity_id) WHERE deleted_at IS NULL;

CREATE TABLE core.comments (
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
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    author_user_id  UUID NOT NULL REFERENCES core.users(id),
    body            TEXT NOT NULL
);
COMMENT ON TABLE core.comments IS 'Comentario/nota polimórfico adjuntable a cualquier registro.';
CREATE INDEX idx_core_comments_entity ON core.comments (entity_type, entity_id) WHERE deleted_at IS NULL;

CREATE TABLE core.data_retention_policies (
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
    entity_type          TEXT NOT NULL,
    retention_period_months INTEGER NOT NULL,
    action_on_expiry          TEXT NOT NULL CHECK (action_on_expiry IN ('archive', 'purge'))
);
COMMENT ON TABLE core.data_retention_policies IS 'Política de retención por tipo de entidad, usada por los jobs de purga.';

-- =============================================================================
-- SECCIÓN 12: Cumplimiento e integraciones externas
-- =============================================================================

CREATE TABLE core.consent_records (
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
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    consent_type    TEXT NOT NULL CHECK (consent_type IN ('marketing', 'data_processing', 'third_party_sharing')),
    granted_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ
);
COMMENT ON TABLE core.consent_records IS 'Consentimiento de tratamiento de datos/marketing otorgado por una persona (cliente, empleado, prospecto).';

CREATE TABLE core.data_subject_requests (
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
    requested_by_entity_type TEXT NOT NULL,
    requested_by_entity_id     UUID NOT NULL,
    request_type                 TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability')),
    status                         TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'completed', 'rejected')),
    resolved_at                     TIMESTAMPTZ
);
COMMENT ON TABLE core.data_subject_requests IS 'Solicitud de acceso/rectificación/borrado de datos personales (cumplimiento de protección de datos).';

CREATE TABLE core.webhook_subscriptions (
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
    integration_id  UUID NOT NULL REFERENCES core.integrations(id),
    event_code      TEXT NOT NULL,
    target_url      TEXT NOT NULL,
    secret_hash     TEXT NOT NULL
);
COMMENT ON TABLE core.webhook_subscriptions IS 'Suscripción de un sistema externo a eventos de dominio de GORAZUS.';

CREATE TABLE core.webhook_delivery_logs (
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
    subscription_id UUID NOT NULL REFERENCES core.webhook_subscriptions(id),
    http_status     INTEGER,
    attempt_number  INTEGER NOT NULL DEFAULT 1,
    succeeded       BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE core.webhook_delivery_logs IS 'Registro de cada entrega de webhook (éxito/reintento/fallo).';

CREATE TABLE core.edi_transactions (
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
    integration_id  UUID NOT NULL REFERENCES core.integrations(id),
    direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    document_type   TEXT NOT NULL,  -- p. ej. 'ORDERS', 'INVOIC', 'DESADV' (subconjunto EDIFACT/X12 relevante)
    source_module   TEXT,
    source_entity_id UUID,
    raw_payload     TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed'))
);
COMMENT ON TABLE core.edi_transactions IS 'Documento EDI intercambiado con socios comerciales (relevante para cadenas/distribuidoras).';

-- =============================================================================
-- SECCIÓN 13: Motor de reglas de negocio y trabajos en segundo plano
-- Agregado por docs/architecture/32-core-platform/ (gap real identificado:
-- ningún schema tenía un motor de reglas genérico cross-módulo — solo reglas
-- específicas por módulo como accounting.accounting_rules — ni una cola de
-- trabajos asíncronos distinta de core.scheduled_jobs, que es exclusivamente
-- para tareas recurrentes tipo CRON).
-- =============================================================================

CREATE TABLE core.business_rules (
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
    rule_set_key    TEXT NOT NULL,  -- namespaced por módulo dueño, p. ej. 'accounting.auto-journal-entries'
    name            TEXT NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 0,  -- menor número = evalúa primero
    evaluation_mode TEXT NOT NULL DEFAULT 'first_match' CHECK (evaluation_mode IN ('first_match', 'all_matches')),
    condition_expression JSONB NOT NULL,  -- árbol de predicados sobre el contexto evaluado
    action_type     TEXT NOT NULL CHECK (action_type IN ('domain_event', 'direct_action')),
    action_payload  JSONB NOT NULL DEFAULT '{}'::jsonb
);
COMMENT ON TABLE core.business_rules IS 'Regla condicional genérica, reusable por cualquier módulo (Business Rules Engine — docs/architecture/32-core-platform/05-motores-de-logica-de-negocio.md §1). Cada módulo dueño registra su propio rule_set_key; el motor es agnóstico del contenido de la condición/acción.';
CREATE INDEX idx_core_business_rules_set ON core.business_rules (rule_set_key, priority) WHERE deleted_at IS NULL AND is_active;

CREATE TABLE core.business_rule_evaluations (
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
    rule_id         UUID NOT NULL REFERENCES core.business_rules(id),
    rule_set_key    TEXT NOT NULL,  -- denormalizado del padre, mismo criterio que table_schema/table_name en audit_logs
    context_snapshot JSONB NOT NULL,
    matched         BOOLEAN NOT NULL,
    action_executed BOOLEAN NOT NULL DEFAULT false,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE core.business_rule_evaluations IS 'Historial de qué reglas se evaluaron y cuál disparó, para que una acción automática sea explicable después (docs/architecture/32-core-platform/05-motores-de-logica-de-negocio.md §1). Particionada mensualmente, ver 29_partitioning.sql.';
CREATE INDEX idx_core_business_rule_evaluations_rule ON core.business_rule_evaluations (rule_id, created_at);

CREATE TABLE core.background_jobs (
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
    job_key         TEXT NOT NULL,  -- p. ej. 'notifications.send', 'templates.render-pdf'
    queue_name      TEXT NOT NULL DEFAULT 'normal' CHECK (queue_name IN ('critical', 'normal', 'batch')),
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority        SMALLINT NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 3,
    available_at    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- backoff: no se toma antes de esta hora
    locked_by       TEXT,  -- identificador del worker que lo tomó
    locked_at       TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    last_error      TEXT,
    -- PK/UNIQUE deben incluir la columna de partición (created_at)
    PRIMARY KEY (id, created_at),
    UNIQUE (local_id, created_at)
) PARTITION BY RANGE (created_at);
COMMENT ON TABLE core.background_jobs IS 'Cola y bitácora de trabajo asíncrono on-demand (Background Jobs — docs/architecture/32-core-platform/08-frameworks-de-infraestructura.md §6). Distinta de core.scheduled_jobs (exclusivamente CRON/recurrente): cada fila aquí es una unidad de trabajo puntual con reintento y backoff. Particionada mensualmente, ver 29_partitioning.sql.';
CREATE INDEX idx_core_background_jobs_polling ON core.background_jobs (queue_name, status, available_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_core_background_jobs_key ON core.background_jobs (job_key, created_at);

-- =============================================================================
-- FIN 01_core.sql — 68 tablas.
--
-- NOTAS DE PORTABILIDAD:
-- - `gen_random_uuid()` es nativo desde Postgres 13; en MySQL 8 se reemplaza
--   por `UUID()` (formato de texto, no tipo binario nativo salvo cast manual);
--   en SQL Server por `NEWID()` (tipo UNIQUEIDENTIFIER).
-- - `GENERATED ALWAYS AS IDENTITY` tiene equivalente directo en SQL Server
--   (`IDENTITY`) y MySQL/MariaDB (`AUTO_INCREMENT`), sintaxis distinta.
-- - `GENERATED ALWAYS AS (...) STORED` (columna computada) existe en los 4
--   motores con sintaxis distinta (`GENERATED ALWAYS AS ... STORED` en MySQL
--   8.0.13+, `COMPUTED` en SQL Server).
-- - `JSONB` no existe fuera de Postgres — MySQL/MariaDB usan `JSON` (sin el
--   almacenamiento binario optimizado ni GIN); SQL Server usa `NVARCHAR(MAX)`
--   con funciones `JSON_VALUE`/`JSON_QUERY`. El `DEFAULT '{}'::jsonb` se
--   adapta a `DEFAULT (JSON_OBJECT())` o equivalente por motor.
-- - Los `CHECK (... IN (...))` son estándar SQL, portan sin cambios.
-- =============================================================================
