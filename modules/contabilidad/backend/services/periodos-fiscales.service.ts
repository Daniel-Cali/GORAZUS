import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { fiscal_years, fiscal_periods } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { AnioFiscalRepository } from '../repositories/anio-fiscal.repository';
import { PeriodoFiscalRepository } from '../repositories/periodo-fiscal.repository';
import type { CrearAnioFiscalInput } from '../validators/periodos-fiscales.schema';

export class AnioFiscalNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('ANIO_FISCAL_NO_ENCONTRADO', `No existe el año fiscal "${id}".`, 404);
  }
}

export class PeriodoFiscalNoEncontradoException extends DomainException {
  constructor(fecha: string) {
    super(
      'PERIODO_FISCAL_NO_ENCONTRADO',
      `No hay un período fiscal abierto que cubra la fecha "${fecha}" — crear el año fiscal correspondiente primero.`,
      409,
    );
  }
}

function sumarMeses(fecha: Date, meses: number): Date {
  const resultado = new Date(fecha);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  return resultado;
}

/**
 * Años y períodos fiscales (`accounting.fiscal_years`/`fiscal_periods`)
 * — un año fiscal se crea con sus 12 períodos mensuales de una vez
 * (mismo criterio "generarlo automáticamente" que el resto del motor).
 * Cierre/reapertura de período (`fiscal_periods.status`) queda fuera
 * de esta parte — no fue parte del alcance elegido ("Núcleo + Estados
 * Financieros", sin "Cierre contable"), ver `ACCOUNTING_ROADMAP.md`.
 */
@Injectable()
export class PeriodosFiscalesService {
  constructor(
    private readonly anioFiscalRepository: AnioFiscalRepository,
    private readonly periodoFiscalRepository: PeriodoFiscalRepository,
  ) {}

  async crearAnioFiscal(
    context: UserContext,
    input: CrearAnioFiscalInput,
  ): Promise<fiscal_years & { fiscal_periods: fiscal_periods[] }> {
    const anio = await this.anioFiscalRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId ?? null,
      year_label: input.yearLabel,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
    });

    const periodos: fiscal_periods[] = [];
    let inicioPeriodo = input.startsOn;
    for (let numero = 1; numero <= 12; numero += 1) {
      const finPeriodo =
        numero === 12 ? input.endsOn : new Date(sumarMeses(inicioPeriodo, 1).getTime() - 86400000);
      const periodo = await this.periodoFiscalRepository.create(context, {
        tenant_id: context.tenantId,
        company_id: input.companyId,
        branch_id: input.branchId ?? null,
        fiscal_year_id: anio.id,
        period_number: numero,
        starts_on: inicioPeriodo,
        ends_on: finPeriodo,
      });
      periodos.push(periodo);
      inicioPeriodo = sumarMeses(inicioPeriodo, 1);
    }

    return { ...anio, fiscal_periods: periodos };
  }

  async obtenerAnio(context: UserContext, id: string): Promise<fiscal_years> {
    const anio = await this.anioFiscalRepository.findById(context, { id });
    if (!anio) throw new AnioFiscalNoEncontradoException(id);
    return anio;
  }

  async listarPeriodos(context: UserContext, fiscalYearId: string): Promise<fiscal_periods[]> {
    const resultado = await this.periodoFiscalRepository.findMany(
      context,
      { fiscal_year_id: fiscalYearId },
      { page: 1, pageSize: 12 },
    );
    return resultado.data;
  }

  /** Resuelve el período fiscal que cubre una fecha — usado por `AsientosService`/`MotorContableService` al contabilizar. */
  async resolverPeriodoPorFecha(
    context: UserContext,
    companyId: string,
    fecha: Date,
  ): Promise<fiscal_periods> {
    const resultado = await this.periodoFiscalRepository.findMany(
      context,
      { company_id: companyId, starts_on: { lte: fecha }, ends_on: { gte: fecha } },
      { page: 1, pageSize: 1 },
    );
    const periodo = resultado.data[0];
    if (!periodo) throw new PeriodoFiscalNoEncontradoException(fecha.toISOString().slice(0, 10));
    return periodo;
  }
}
