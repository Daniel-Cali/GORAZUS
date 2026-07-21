-- =============================================================================
-- GORAZUS ERP — 25_functions.sql
-- Funciones de negocio reutilizables. No incluye funciones trigger (ver
-- 26_triggers.sql) ni procedimientos transaccionales largos (ver
-- 27_procedures.sql) — la distinción es: función = cómputo/consulta sin
-- efectos secundarios de negocio; procedimiento = orquesta una operación
-- completa con múltiples pasos y control transaccional explícito.
-- Depende de: 01_core.sql .. 24_views.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Numeración de documentos: obtención atómica del siguiente correlativo
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION configuration.fn_get_next_correlative(p_series_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_next BIGINT;
BEGIN
    -- SELECT ... FOR UPDATE: bloquea la fila hasta el commit, evitando que
    -- dos transacciones concurrentes obtengan el mismo número (POS con
    -- miles de usuarios simultáneos emitiendo facturas en paralelo).
    SELECT next_number INTO v_next
    FROM configuration.correlatives
    WHERE series_id = p_series_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe correlativo para la serie %', p_series_id;
    END IF;

    UPDATE configuration.correlatives
    SET next_number = next_number + 1, row_version = row_version + 1, updated_at = now()
    WHERE series_id = p_series_id;

    RETURN v_next;
END;
$$;
COMMENT ON FUNCTION configuration.fn_get_next_correlative IS 'Obtiene y avanza atómicamente el siguiente número de una serie. FOR UPDATE previene duplicados bajo concurrencia alta (POS, facturación masiva).';

CREATE OR REPLACE FUNCTION configuration.fn_generate_document_number(p_series_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_format RECORD;
    v_number BIGINT;
BEGIN
    SELECT prefix, number_length, suffix INTO v_format
    FROM configuration.document_number_formats
    WHERE series_id = p_series_id AND deleted_at IS NULL
    LIMIT 1;

    v_number := configuration.fn_get_next_correlative(p_series_id);

    RETURN COALESCE(v_format.prefix, '') || lpad(v_number::TEXT, COALESCE(v_format.number_length, 8), '0') || COALESCE(v_format.suffix, '');
END;
$$;
COMMENT ON FUNCTION configuration.fn_generate_document_number IS 'Genera el número de documento formateado (prefijo + correlativo con ceros a la izquierda + sufijo).';

-- -----------------------------------------------------------------------------
-- 2. Crédito disponible de un cliente
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION customers.fn_get_available_credit(p_customer_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT ccp.credit_limit - COALESCE(SUM(ara.open_balance), 0)
    FROM customers.customer_credit_profiles ccp
    LEFT JOIN customers.v_accounts_receivable_aging ara ON ara.customer_id = ccp.customer_id
    WHERE ccp.customer_id = p_customer_id AND ccp.deleted_at IS NULL
    GROUP BY ccp.credit_limit;
$$;
COMMENT ON FUNCTION customers.fn_get_available_credit IS 'Crédito disponible = límite de crédito - saldo por cobrar abierto. Consultado por sales antes de confirmar una venta a crédito.';

-- -----------------------------------------------------------------------------
-- 3. Conversión de moneda a la cotización vigente
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION configuration.fn_convert_currency(
    p_amount NUMERIC, p_from_currency_id UUID, p_to_currency_id UUID, p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN p_from_currency_id = p_to_currency_id THEN p_amount
        ELSE p_amount * (
            SELECT rate FROM configuration.exchange_rates
            WHERE from_currency_id = p_from_currency_id AND to_currency_id = p_to_currency_id
              AND rate_date <= p_as_of_date AND deleted_at IS NULL
            ORDER BY rate_date DESC LIMIT 1
        )
    END;
$$;
COMMENT ON FUNCTION configuration.fn_convert_currency IS 'Convierte un monto usando la cotización más reciente disponible a la fecha indicada (o anterior).';

-- -----------------------------------------------------------------------------
-- 4. Días hábiles entre dos fechas (excluye feriados de configuration.holidays)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION configuration.fn_business_days_between(p_start DATE, p_end DATE, p_country_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM generate_series(p_start, p_end, '1 day'::interval) AS d
    WHERE EXTRACT(ISODOW FROM d) < 6  -- excluye sábado/domingo
      AND NOT EXISTS (
          SELECT 1 FROM configuration.holidays h
          WHERE h.country_id = p_country_id AND h.holiday_date = d::date AND h.deleted_at IS NULL
      );
$$;
COMMENT ON FUNCTION configuration.fn_business_days_between IS 'Cuenta días hábiles (excluye fines de semana y feriados) — usado por services.sla_definitions para calcular vencimientos de SLA.';

-- -----------------------------------------------------------------------------
-- 5. Anonimización de datos para entornos no productivos
-- Ver docs/database/06-estrategia-seguridad.md §5. Sustituye PII por datos
-- sintéticos preservando forma/distribución, nunca se ejecuta en producción.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_anonymize_non_production_data()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE EXCEPTION 'fn_anonymize_non_production_data no puede ejecutarse en producción (app.environment=production)';
    END IF;

    UPDATE customers.customers SET
        legal_name = 'Cliente Sintético ' || local_id,
        tax_id = lpad((local_id * 7919 % 999999999)::TEXT, 9, '0');

    UPDATE customers.customer_contacts SET
        full_name = 'Contacto ' || local_id,
        email = 'contacto' || local_id || '@ejemplo-anonimizado.test',
        phone = NULL;

    UPDATE hr.employees SET
        full_name = 'Empleado Sintético ' || local_id,
        national_id_encrypted = NULL;

    UPDATE suppliers.suppliers SET
        legal_name = 'Proveedor Sintético ' || local_id,
        tax_id = lpad((local_id * 6151 % 999999999)::TEXT, 9, '0');

    -- Montos: ruido aleatorio ±15% preservando escala relativa para pruebas de performance
    UPDATE sales.invoices SET total_amount = total_amount * (0.85 + random() * 0.30);
    UPDATE purchases.purchase_invoices SET total_amount = total_amount * (0.85 + random() * 0.30);

    RAISE NOTICE 'Anonimización completada.';
END;
$$;
COMMENT ON FUNCTION core.fn_anonymize_non_production_data IS 'Anonimiza PII y ofusca montos para entornos staging/local. Bloqueada explícitamente en producción vía app.environment.';

-- -----------------------------------------------------------------------------
-- 6. Validación de partida doble (usada también por trigger, ver 26_triggers.sql)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accounting.fn_is_journal_entry_balanced(p_journal_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(debit_amount), 0) = COALESCE(SUM(credit_amount), 0)
    FROM accounting.journal_entry_lines
    WHERE journal_entry_id = p_journal_entry_id AND deleted_at IS NULL;
$$;
COMMENT ON FUNCTION accounting.fn_is_journal_entry_balanced IS 'Verifica que un asiento cuadre (suma débitos = suma créditos) antes de permitir su mayorización.';

-- =============================================================================
-- FIN 25_functions.sql
-- Nota: la exportación de datos por tenant (pg_dump con RLS activo, ver
-- 08-estrategia-respaldo.md §3) se implementa como script externo, no como
-- función SQL — pg_dump no es invocable desde dentro de una función
-- PL/pgSQL; la función SQL correspondiente solo setea
-- app.current_tenant_id para que el pg_dump externo lo herede vía RLS.
-- =============================================================================
