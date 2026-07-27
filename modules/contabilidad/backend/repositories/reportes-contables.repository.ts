import type { UserContext } from '@gorazus/contracts';

export interface SaldoPorCuenta {
  accountId: string;
  code: string;
  name: string;
  accountTypeCode: string;
  normalBalance: string;
  totalDebit: string;
  totalCredit: string;
}

export interface MovimientoCuentaEfectivo {
  sourceModule: string | null;
  netChange: string;
}

/**
 * Agregaciones de solo lectura para Balance General/Estado de
 * Resultados/Flujo de Efectivo — `chart_of_accounts`/`journal_entries`/
 * `journal_entry_lines` no tienen relación real entre sí a nivel de
 * partición (ver `AsientoRepository`), así que el join se hace en SQL
 * crudo parametrizado, mismo patrón que `CuentaPorCobrarRepository`.
 */
export abstract class ReportesContablesRepository {
  /** Saldos por cuenta, solo asientos `posted`, con `posting_date <= fechaCorte` — insumo del Balance General. */
  abstract saldosPorTipo(
    context: UserContext,
    params: { companyId: string; branchId?: string; accountTypeCodes: string[]; fechaCorte: Date },
  ): Promise<SaldoPorCuenta[]>;

  /** Saldos por cuenta, solo asientos `posted`, con `posting_date` entre `desde` y `hasta` — insumo del Estado de Resultados. */
  abstract saldosPorTipoEnRango(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      accountTypeCodes: string[];
      desde: Date;
      hasta: Date;
    },
  ): Promise<SaldoPorCuenta[]>;

  /**
   * Cambio neto (débito − crédito) en un conjunto explícito de cuentas
   * de efectivo/bancos, agrupado por `source_module` del asiento —
   * insumo del Flujo de Efectivo. `cashAccountIds` es explícito porque
   * `chart_of_accounts` todavía no tiene un flag `is_cash_account`
   * (gap real del schema, documentado en `ACCOUNTING_HEALTH_REPORT.md`).
   */
  abstract movimientoNetoCuentasEfectivo(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      cashAccountIds: string[];
      desde: Date;
      hasta: Date;
    },
  ): Promise<MovimientoCuentaEfectivo[]>;
}
