-- =============================================================================
-- GORAZUS ERP — 39_roles_enterprise_fields.sql
-- Roles Enterprise — Domain Entities: agrega a `core.roles` los campos
-- reales que la entidad de dominio `Rol` necesita para modelar `code`,
-- `description` y `roleType` (clasificación del rol). El pedido original
-- ("Roles Enterprise - Domain Entities") pedía además una entidad
-- `RoleContext` con `RoleType` en {System, Enterprise, Organization,
-- Department, Project, Custom} — ninguno de esos conceptos existe en el
-- modelo de datos real de GORAZUS (no hay "Department"/"Project" como
-- nivel de scoping). El scoping real de un rol (tenant/empresa/sucursal)
-- ya está resuelto por `company_id`/`branch_id` (nullable desde el diseño
-- original de `core.roles`, expuesto en la API en la fase "Roles
-- Enterprise" anterior, ver CHANGELOG `v0.18.0`) — por eso `role_type`
-- acá usa una taxonomía adaptada a lo que existe de verdad
-- (system/tenant/company/branch/custom), sin `RoleContext` como entidad
-- separada.
-- Archivo nuevo — no edita ningún archivo ya existente, mantiene el
-- historial de migración append-only.
-- Depende de: 01_core.sql .. 38_crm_opportunities_seed.sql
-- =============================================================================

ALTER TABLE core.roles
    ADD COLUMN code TEXT,
    ADD COLUMN description TEXT,
    ADD COLUMN role_type TEXT NOT NULL DEFAULT 'custom'
        CONSTRAINT roles_role_type_check
        CHECK (role_type = ANY (ARRAY['system', 'tenant', 'company', 'branch', 'custom']));

COMMENT ON COLUMN core.roles.code IS 'Identificador corto opcional del rol (p. ej. "SALES_MANAGER"), distinto de `name` (la etiqueta visible) — sin unicidad forzada, uso libre.';
COMMENT ON COLUMN core.roles.description IS 'Descripción libre del alcance/propósito del rol — opcional.';
COMMENT ON COLUMN core.roles.role_type IS 'Clasificación del rol: system (roles de fábrica sembrados por la plataforma), tenant/company/branch (coinciden con el nivel de scoping real de company_id/branch_id), custom (el resto). Ver "Roles Enterprise - Domain Entities".';

-- Backfill: los roles de fábrica ya existentes (`is_system_role = true`,
-- p. ej. "Administrador") son de tipo `system` por definición — no deben
-- quedar en el default `custom`.
UPDATE core.roles SET role_type = 'system' WHERE is_system_role = true;

-- -----------------------------------------------------------------------------
-- Verificación — debe devolver 0 filas en cada chequeo.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_bad_role_type int;
    v_system_sin_backfill int;
BEGIN
    SELECT count(*) INTO v_bad_role_type
    FROM core.roles
    WHERE role_type NOT IN ('system', 'tenant', 'company', 'branch', 'custom');
    IF v_bad_role_type <> 0 THEN
        RAISE EXCEPTION '39_roles_enterprise_fields: % roles con role_type fuera de rango', v_bad_role_type;
    END IF;

    SELECT count(*) INTO v_system_sin_backfill
    FROM core.roles
    WHERE is_system_role = true AND role_type <> 'system';
    IF v_system_sin_backfill <> 0 THEN
        RAISE EXCEPTION '39_roles_enterprise_fields: % roles de fábrica sin backfill a role_type=system', v_system_sin_backfill;
    END IF;

    RAISE NOTICE '39_roles_enterprise_fields: OK';
END $$;
