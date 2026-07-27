import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { journal_entries } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  AsientoRepository,
  type CrearAsientoParams,
  type LineaAsientoParams,
  type AsientoConLineas,
  type OrdenAsiento,
} from '../repositories/asiento.repository';
import { EstadoAsientoRepository } from '../repositories/estado-asiento.repository';
import { CuentaContableRepository } from '../repositories/cuenta-contable.repository';
import { PeriodosFiscalesService } from './periodos-fiscales.service';
import { Asiento } from '../entities/asiento.entity';
import type { CrearAsientoInput } from '../validators/asientos.schema';

export class AsientoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('ASIENTO_NO_ENCONTRADO', `No existe el asiento "${id}".`, 404);
  }
}

export class AsientoInvalidoException extends DomainException {
  constructor(mensaje: string) {
    super('ASIENTO_INVALIDO', mensaje, 400);
  }
}

export class AsientoNoContabilizableException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'ASIENTO_NO_CONTABILIZABLE',
      `El asiento "${id}" está en estado "${estadoActual}" — solo un borrador o pendiente puede contabilizarse.`,
      409,
    );
  }
}

export class AsientoNoAnulableException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'ASIENTO_NO_ANULABLE',
      `El asiento "${id}" ya está en estado "${estadoActual}" — no puede anularse de nuevo.`,
      409,
    );
  }
}

export class AsientoNoRevertibleException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'ASIENTO_NO_REVERTIBLE',
      `El asiento "${id}" está en estado "${estadoActual}" — solo un asiento contabilizado puede revertirse.`,
      409,
    );
  }
}

const CODIGO_CUENTA_INVALIDA_MENSAJE = (accountId: string): string =>
  `La cuenta "${accountId}" no existe o no pertenece a esta empresa.`;

/** El constructor de `Asiento` lanza `Error` plano (invariantes de partida doble) — sin este wrapper, el filtro global lo convierte en un 500 sin traducir en vez de un 400 limpio. */
function construirAsiento(
  lines: Array<{ accountId: string; debitAmount: number; creditAmount: number }>,
): void {
  try {
    new Asiento(lines);
  } catch (error) {
    throw new AsientoInvalidoException(error instanceof Error ? error.message : String(error));
  }
}

function generarNumeroDocumento(prefijo: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefijo}-${timestamp}-${azar}`;
}

export interface MovimientoLibroMayor {
  journalEntryLineId: string;
  postingDate: Date;
  documentNumber: string;
  debitAmount: string;
  creditAmount: string;
}

export interface LibroMayorResultado {
  saldoInicial: number;
  movimientos: MovimientoLibroMayor[];
  saldoFinal: number;
}

/**
 * Asientos contables (`accounting.journal_entries`/`journal_entry_lines`)
 * — ciclo de vida `draft`/`pending` → `posted` → `cancelled`|`reversed`.
 * `generarDesdeMotor()` es el único punto de entrada que crea un
 * asiento ya `posted` directamente (sin pasar por borrador) — lo usa
 * `MotorContableService`, nunca un endpoint del controlador.
 */
@Injectable()
export class AsientosService {
  constructor(
    private readonly asientoRepository: AsientoRepository,
    private readonly estadoAsientoRepository: EstadoAsientoRepository,
    private readonly cuentaContableRepository: CuentaContableRepository,
    private readonly periodosFiscalesService: PeriodosFiscalesService,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoAsientoRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoAsientoRepository.create(context, {
        tenant_id: context.tenantId,
        code,
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoAsientoRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoAsientoRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  private async validarCuentasExisten(
    context: UserContext,
    lines: LineaAsientoParams[],
  ): Promise<void> {
    for (const line of lines) {
      const cuenta = await this.cuentaContableRepository.findById(context, { id: line.accountId });
      if (!cuenta)
        throw new AsientoInvalidoException(CODIGO_CUENTA_INVALIDA_MENSAJE(line.accountId));
    }
  }

  /** Crea un asiento manual — siempre arranca en `draft`, requiere `contabilizar()` para tomar efecto en los reportes. */
  async crear(context: UserContext, input: CrearAsientoInput): Promise<AsientoConLineas> {
    // `debitAmount`/`creditAmount` tienen `.default(0)` en Zod — el tipo
    // exportado usa `z.input` (opcionales), así que se normalizan acá
    // antes de construir la entidad, mismo motivo que
    // `input.generalDiscountPercentage ?? 0` en Facturación.
    const lines: LineaAsientoParams[] = input.lines.map((l) => ({
      accountId: l.accountId,
      costCenterId: l.costCenterId,
      profitCenterId: l.profitCenterId,
      debitAmount: l.debitAmount ?? 0,
      creditAmount: l.creditAmount ?? 0,
    }));
    construirAsiento(lines);
    await this.validarCuentasExisten(context, lines);
    const postingDate = input.postingDate ?? new Date();
    const periodo = await this.periodosFiscalesService.resolverPeriodoPorFecha(
      context,
      input.companyId,
      postingDate,
    );
    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    return this.crearConEstado(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      fiscalPeriodId: periodo.id,
      statusId,
      postingDate,
      description: input.description,
      sourceModule: null,
      sourceEntityId: null,
      lines,
    });
  }

  /**
   * Usado exclusivamente por `MotorContableService` — genera el asiento
   * ya `posted` directamente, sin pasar por borrador (el documento de
   * origen, ej. una factura confirmada, ya está confirmado).
   */
  async generarDesdeMotor(
    context: UserContext,
    params: {
      companyId: string;
      branchId?: string | null;
      sourceModule: string;
      sourceEntityId: string;
      postingDate?: Date;
      description?: string | null;
      lines: LineaAsientoParams[];
    },
  ): Promise<AsientoConLineas> {
    construirAsiento(params.lines);
    const postingDate = params.postingDate ?? new Date();
    const periodo = await this.periodosFiscalesService.resolverPeriodoPorFecha(
      context,
      params.companyId,
      postingDate,
    );
    const statusId = await this.resolverEstadoPorCodigo(context, 'posted');
    return this.crearConEstado(context, {
      companyId: params.companyId,
      branchId: params.branchId,
      fiscalPeriodId: periodo.id,
      statusId,
      postingDate,
      description: params.description,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      lines: params.lines,
    });
  }

  private async crearConEstado(
    context: UserContext,
    params: Omit<CrearAsientoParams, 'documentNumber'>,
  ): Promise<AsientoConLineas> {
    return this.asientoRepository.crear(context, {
      ...params,
      documentNumber: generarNumeroDocumento('AST'),
    });
  }

  async obtener(context: UserContext, id: string): Promise<AsientoConLineas> {
    const asiento = await this.asientoRepository.obtener(context, id);
    if (!asiento) throw new AsientoNoEncontradoException(id);
    return asiento;
  }

  /** Base del Libro Diario — listado cronológico de asientos con sus filtros. */
  async listar(
    context: UserContext,
    filtros: {
      companyId: string;
      branchId?: string;
      statusId?: string;
      desde?: Date;
      hasta?: Date;
    },
    pagination: PaginationParams,
    orden?: { campo: OrdenAsiento; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<journal_entries>> {
    return this.asientoRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.branchId ? { branch_id: filtros.branchId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
        ...(filtros.desde || filtros.hasta
          ? {
              posting_date: {
                ...(filtros.desde ? { gte: filtros.desde } : {}),
                ...(filtros.hasta ? { lte: filtros.hasta } : {}),
              },
            }
          : {}),
      },
      pagination,
      orden,
    );
  }

  async contabilizar(context: UserContext, id: string): Promise<journal_entries> {
    const asiento = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, asiento.status_id);
    if (estadoActual !== 'draft' && estadoActual !== 'pending') {
      throw new AsientoNoContabilizableException(id, estadoActual);
    }
    construirAsiento(
      asiento.journal_entry_lines.map((l) => ({
        accountId: l.account_id,
        debitAmount: Number(l.debit_amount),
        creditAmount: Number(l.credit_amount),
      })),
    );
    const statusId = await this.resolverEstadoPorCodigo(context, 'posted');
    return this.asientoRepository.actualizarEstado(context, id, statusId);
  }

  async anular(context: UserContext, id: string): Promise<journal_entries> {
    const asiento = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, asiento.status_id);
    if (estadoActual === 'cancelled' || estadoActual === 'reversed') {
      throw new AsientoNoAnulableException(id, estadoActual);
    }
    const statusId = await this.resolverEstadoPorCodigo(context, 'cancelled');
    return this.asientoRepository.actualizarEstado(context, id, statusId);
  }

  /** Genera un asiento nuevo con las líneas invertidas (débito↔crédito) — nunca modifica las líneas originales, mismo criterio contable real de "nunca editar un asiento ya contabilizado". */
  async revertir(context: UserContext, id: string): Promise<AsientoConLineas> {
    const asiento = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, asiento.status_id);
    if (estadoActual !== 'posted') throw new AsientoNoRevertibleException(id, estadoActual);

    const lineasInvertidas: LineaAsientoParams[] = asiento.journal_entry_lines.map((l) => ({
      accountId: l.account_id,
      costCenterId: l.cost_center_id,
      profitCenterId: l.profit_center_id,
      debitAmount: Number(l.credit_amount),
      creditAmount: Number(l.debit_amount),
    }));

    const reversion = await this.generarDesdeMotor(context, {
      companyId: asiento.company_id,
      branchId: asiento.branch_id,
      sourceModule: 'contabilidad',
      sourceEntityId: asiento.id,
      description: `Reversión del asiento ${asiento.document_number}`,
      lines: lineasInvertidas,
    });

    const statusRevertido = await this.resolverEstadoPorCodigo(context, 'reversed');
    await this.asientoRepository.actualizarEstado(context, id, statusRevertido);

    return reversion;
  }

  /**
   * Libro Mayor de una cuenta: saldo inicial (movimientos antes de
   * `desde`) + movimientos del rango + saldo final. Los saldos se
   * expresan como "neto débito" (Σdébitos − Σcréditos) de forma
   * consistente para cualquier cuenta — una cuenta de naturaleza
   * acreedora (`normal_balance='credit'`) simplemente da un neto
   * negativo cuando está en su posición normal; interpretar el signo
   * según `account_types.normal_balance` es responsabilidad de quien
   * presenta el reporte, no de este cálculo.
   */
  async libroMayor(
    context: UserContext,
    params: { accountId: string; companyId: string; branchId?: string; desde: Date; hasta: Date },
  ): Promise<LibroMayorResultado> {
    const cuenta = await this.cuentaContableRepository.findById(context, { id: params.accountId });
    if (!cuenta)
      throw new AsientoInvalidoException(CODIGO_CUENTA_INVALIDA_MENSAJE(params.accountId));

    const todasLasLineas = await this.asientoRepository.listarLineasPorCuenta(context, {
      accountId: params.accountId,
      companyId: params.companyId,
      branchId: params.branchId,
      hasta: params.hasta,
      soloContabilizados: true,
    });

    let saldoInicial = 0;
    const movimientos: MovimientoLibroMayor[] = [];
    for (const linea of todasLasLineas) {
      const neto = Number(linea.debit_amount) - Number(linea.credit_amount);
      if (linea.posting_date < params.desde) {
        saldoInicial += neto;
      } else {
        movimientos.push({
          journalEntryLineId: linea.id,
          postingDate: linea.posting_date,
          documentNumber: linea.document_number,
          debitAmount: linea.debit_amount.toString(),
          creditAmount: linea.credit_amount.toString(),
        });
      }
    }
    const netoRango = movimientos.reduce(
      (acc, m) => acc + Number(m.debitAmount) - Number(m.creditAmount),
      0,
    );
    return {
      saldoInicial: Number(saldoInicial.toFixed(4)),
      movimientos,
      saldoFinal: Number((saldoInicial + netoRango).toFixed(4)),
    };
  }
}
