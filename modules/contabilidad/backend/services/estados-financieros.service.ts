import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import {
  ReportesContablesRepository,
  type SaldoPorCuenta,
} from '../repositories/reportes-contables.repository';

/**
 * Códigos reales de `account_types.code` — `accounting.account_types_code_check`
 * (CHECK de base de datos real, `docs/database/sql/`) solo permite
 * exactamente estos 5 valores. El pedido original distingue Ingresos/
 * Costos/Gastos/Otros Ingresos/Otros Gastos (5 categorías), pero el
 * schema certificado solo tiene 2 tipos para el estado de resultados
 * (`income`/`expense`) — la subclasificación Costos vs. Gastos y
 * Otros Ingresos/Gastos se resuelve con listas explícitas de cuentas
 * (`costAccountIds`/`otherIncomeAccountIds`/`otherExpenseAccountIds`),
 * mismo criterio que `cashAccountIds` en `flujoEfectivo()` — no se
 * inventan códigos de tipo que el CHECK real rechazaría.
 */
export const CODIGOS_TIPO_CUENTA = {
  ACTIVO: 'asset',
  PASIVO: 'liability',
  PATRIMONIO: 'equity',
  INGRESO: 'income',
  GASTO: 'expense',
} as const;

export interface LineaBalance {
  accountId: string;
  code: string;
  name: string;
  balance: number;
}

export interface BalanceGeneral {
  fechaCorte: Date;
  activos: LineaBalance[];
  totalActivos: number;
  pasivos: LineaBalance[];
  totalPasivos: number;
  patrimonio: LineaBalance[];
  totalPatrimonio: number;
  utilidadAcumulada: number;
  totalPasivoMasPatrimonio: number;
}

export interface EstadoResultados {
  desde: Date;
  hasta: Date;
  ingresos: LineaBalance[];
  totalIngresos: number;
  costos: LineaBalance[];
  totalCostos: number;
  utilidadBruta: number;
  gastos: LineaBalance[];
  totalGastos: number;
  utilidadOperativa: number;
  otrosIngresos: LineaBalance[];
  totalOtrosIngresos: number;
  otrosGastos: LineaBalance[];
  totalOtrosGastos: number;
  utilidadNeta: number;
}

export interface FlujoEfectivo {
  desde: Date;
  hasta: Date;
  porModuloOrigen: Array<{ sourceModule: string | null; netChange: number }>;
  totalNeto: number;
}

function aLineas(filas: SaldoPorCuenta[], signoAcreedor: boolean): LineaBalance[] {
  return filas.map((fila) => ({
    accountId: fila.accountId,
    code: fila.code,
    name: fila.name,
    balance: signoAcreedor
      ? Number(fila.totalCredit) - Number(fila.totalDebit)
      : Number(fila.totalDebit) - Number(fila.totalCredit),
  }));
}

function sumar(lineas: LineaBalance[]): number {
  return Number(lineas.reduce((acc, l) => acc + l.balance, 0).toFixed(4));
}

/**
 * Balance General, Estado de Resultados y Flujo de Efectivo —
 * generados en vivo desde `journal_entry_lines` (solo asientos
 * `posted`), no snapshots (`balance_sheet_snapshots`/etc. quedan como
 * histórico de "fotos" congeladas, sin código en esta parte — ver
 * `ACCOUNTING_ROADMAP.md`).
 *
 * **Sin cierre contable todavía** (fuera del alcance elegido para esta
 * parte): la "Utilidad Acumulada" del Balance General es la utilidad
 * neta histórica completa (desde el inicio de los datos hasta la fecha
 * de corte), no distingue ejercicios ya cerrados de años anteriores —
 * limitación real, documentada, no fabricada como si estuviera resuelta.
 */
@Injectable()
export class EstadosFinancierosService {
  constructor(private readonly reportesContablesRepository: ReportesContablesRepository) {}

  async balanceGeneral(
    context: UserContext,
    params: { companyId: string; branchId?: string; fechaCorte: Date },
  ): Promise<BalanceGeneral> {
    const [filasActivos, filasPasivos, filasPatrimonio, resultados] = await Promise.all([
      this.reportesContablesRepository.saldosPorTipo(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        accountTypeCodes: [CODIGOS_TIPO_CUENTA.ACTIVO],
        fechaCorte: params.fechaCorte,
      }),
      this.reportesContablesRepository.saldosPorTipo(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        accountTypeCodes: [CODIGOS_TIPO_CUENTA.PASIVO],
        fechaCorte: params.fechaCorte,
      }),
      this.reportesContablesRepository.saldosPorTipo(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        accountTypeCodes: [CODIGOS_TIPO_CUENTA.PATRIMONIO],
        fechaCorte: params.fechaCorte,
      }),
      this.estadoResultados(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        desde: new Date('2000-01-01T00:00:00.000Z'),
        hasta: params.fechaCorte,
      }),
    ]);

    const activos = aLineas(filasActivos, false);
    const pasivos = aLineas(filasPasivos, true);
    const patrimonio = aLineas(filasPatrimonio, true);
    const totalPasivos = sumar(pasivos);
    const totalPatrimonio = sumar(patrimonio);

    return {
      fechaCorte: params.fechaCorte,
      activos,
      totalActivos: sumar(activos),
      pasivos,
      totalPasivos,
      patrimonio,
      totalPatrimonio,
      utilidadAcumulada: resultados.utilidadNeta,
      totalPasivoMasPatrimonio: Number(
        (totalPasivos + totalPatrimonio + resultados.utilidadNeta).toFixed(4),
      ),
    };
  }

  /**
   * `costAccountIds`/`otherIncomeAccountIds`/`otherExpenseAccountIds`
   * (todos opcionales, default `[]`) reclasifican cuentas dentro de sus
   * tipos reales (`income`/`expense`) — ver el comentario de
   * `CODIGOS_TIPO_CUENTA`. Sin ninguna lista, el resultado es
   * Ingresos/Gastos simple (Utilidad Bruta = Utilidad Operativa =
   * Utilidad Neta, sin Costo de Ventas ni partidas "otras" separadas).
   */
  async estadoResultados(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      desde: Date;
      hasta: Date;
      costAccountIds?: string[];
      otherIncomeAccountIds?: string[];
      otherExpenseAccountIds?: string[];
    },
  ): Promise<EstadoResultados> {
    const costIds = new Set(params.costAccountIds ?? []);
    const otherIncomeIds = new Set(params.otherIncomeAccountIds ?? []);
    const otherExpenseIds = new Set(params.otherExpenseAccountIds ?? []);

    const [filasTipoIngreso, filasTipoGasto] = await Promise.all([
      this.reportesContablesRepository.saldosPorTipoEnRango(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        accountTypeCodes: [CODIGOS_TIPO_CUENTA.INGRESO],
        desde: params.desde,
        hasta: params.hasta,
      }),
      this.reportesContablesRepository.saldosPorTipoEnRango(context, {
        companyId: params.companyId,
        branchId: params.branchId,
        accountTypeCodes: [CODIGOS_TIPO_CUENTA.GASTO],
        desde: params.desde,
        hasta: params.hasta,
      }),
    ]);

    const ingresos = aLineas(
      filasTipoIngreso.filter((f) => !otherIncomeIds.has(f.accountId)),
      true,
    );
    const otrosIngresos = aLineas(
      filasTipoIngreso.filter((f) => otherIncomeIds.has(f.accountId)),
      true,
    );
    const costos = aLineas(
      filasTipoGasto.filter((f) => costIds.has(f.accountId)),
      false,
    );
    const otrosGastos = aLineas(
      filasTipoGasto.filter((f) => otherExpenseIds.has(f.accountId)),
      false,
    );
    const gastos = aLineas(
      filasTipoGasto.filter((f) => !costIds.has(f.accountId) && !otherExpenseIds.has(f.accountId)),
      false,
    );

    const totalIngresos = sumar(ingresos);
    const totalCostos = sumar(costos);
    const totalGastos = sumar(gastos);
    const totalOtrosIngresos = sumar(otrosIngresos);
    const totalOtrosGastos = sumar(otrosGastos);
    const utilidadBruta = Number((totalIngresos - totalCostos).toFixed(4));
    const utilidadOperativa = Number((utilidadBruta - totalGastos).toFixed(4));
    const utilidadNeta = Number(
      (utilidadOperativa + totalOtrosIngresos - totalOtrosGastos).toFixed(4),
    );

    return {
      desde: params.desde,
      hasta: params.hasta,
      ingresos,
      totalIngresos,
      costos,
      totalCostos,
      utilidadBruta,
      gastos,
      totalGastos,
      utilidadOperativa,
      otrosIngresos,
      totalOtrosIngresos,
      otrosGastos,
      totalOtrosGastos,
      utilidadNeta,
    };
  }

  /**
   * `cashAccountIds` es explícito (no autodetectado) — `chart_of_accounts`
   * no tiene todavía un flag `is_cash_account` (gap real del schema,
   * ver `ACCOUNTING_HEALTH_REPORT.md`). La clasificación Operación/
   * Inversión/Financiamiento pedida por el prompt tampoco es posible
   * sin una categorización por regla/cuenta que el schema no tiene —
   * se entrega un desglose aproximado por `source_module` del asiento
   * en su lugar, documentado como aproximación, no como la
   * clasificación formal de 3 categorías.
   */
  async flujoEfectivo(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string;
      cashAccountIds: string[];
      desde: Date;
      hasta: Date;
    },
  ): Promise<FlujoEfectivo> {
    const filas = await this.reportesContablesRepository.movimientoNetoCuentasEfectivo(context, {
      companyId: params.companyId,
      branchId: params.branchId,
      cashAccountIds: params.cashAccountIds,
      desde: params.desde,
      hasta: params.hasta,
    });
    const porModuloOrigen = filas.map((f) => ({
      sourceModule: f.sourceModule,
      netChange: Number(f.netChange),
    }));
    return {
      desde: params.desde,
      hasta: params.hasta,
      porModuloOrigen,
      totalNeto: Number(porModuloOrigen.reduce((acc, f) => acc + f.netChange, 0).toFixed(4)),
    };
  }
}
