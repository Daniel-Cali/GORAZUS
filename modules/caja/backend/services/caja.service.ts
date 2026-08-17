import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type {
  cash_registers,
  cash_register_openings,
  cash_register_closings,
  cash_movements,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CajaRegistroRepository } from '../repositories/caja-registro.repository';
import { AperturaCajaRepository } from '../repositories/apertura-caja.repository';
import { CierreCajaRepository } from '../repositories/cierre-caja.repository';
import { TipoMovimientoCajaRepository } from '../repositories/tipo-movimiento-caja.repository';
import { MovimientoCajaRepository } from '../repositories/movimiento-caja.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { CajaRegistro } from '../entities/caja-registro.entity';
import type {
  CrearCajaInput,
  AbrirCajaInput,
  CerrarCajaInput,
  RegistrarMovimientoManualInput,
} from '../validators/caja.schema';

export class CajaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('CAJA_NO_ENCONTRADA', `No existe la caja "${id}".`, 404);
  }
}

export class EmpresaInvalidaException extends DomainException {
  constructor(companyId: string) {
    super('EMPRESA_INVALIDA', `No existe la empresa "${companyId}".`, 400);
  }
}

export class SucursalInvalidaException extends DomainException {
  constructor(branchId: string, companyId: string) {
    super(
      'SUCURSAL_INVALIDA',
      `No existe la sucursal "${branchId}", o no pertenece a la empresa "${companyId}".`,
      400,
    );
  }
}

export class CajaYaAbiertaException extends DomainException {
  constructor(registerId: string) {
    super('CAJA_YA_ABIERTA', `La caja "${registerId}" ya tiene una apertura activa.`, 409);
  }
}

export class CajaNoAbiertaException extends DomainException {
  constructor(registerId: string) {
    super(
      'CAJA_NO_ABIERTA',
      `La caja "${registerId}" no tiene una apertura activa — abrila antes de vender.`,
      409,
    );
  }
}

export class AperturaNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('APERTURA_NO_ENCONTRADA', `No existe la apertura de caja "${id}".`, 404);
  }
}

/**
 * P0-3 (auditoría POS) — `registerId` llega desde el body de un request
 * (ej. `POST /pos/ventas`), nunca validado hasta ahora contra el
 * `branchId`/`companyId` que llega en el mismo body. RLS por sí solo no
 * alcanza acá: una caja de otra sucursal de la MISMA empresa/tenant sigue
 * siendo visible bajo `withTenantScope`, así que sin este chequeo
 * explícito un usuario autorizado en su propio tenant podría cobrar
 * contra la caja de una sucursal ajena con solo conocer su id.
 */
export class RegistroNoPerteneceASucursalException extends DomainException {
  constructor(registerId: string, branchId: string, companyId: string) {
    super(
      'REGISTRO_NO_PERTENECE_A_SUCURSAL',
      `La caja "${registerId}" no pertenece a la sucursal "${branchId}" de la empresa "${companyId}".`,
      409,
    );
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/**
 * Caja mínima (`POS_ARCHITECTURE.md §3`): registros, apertura/cierre de
 * turno (una apertura activa por caja, `uq_cash_openings_one_active`),
 * movimientos. Sin arqueo por denominación (`cash_counts`), sin
 * transferencias entre cajas ni caja chica.
 */
@Injectable()
export class CajaService {
  constructor(
    private readonly cajaRegistroRepository: CajaRegistroRepository,
    private readonly aperturaCajaRepository: AperturaCajaRepository,
    private readonly cierreCajaRepository: CierreCajaRepository,
    private readonly tipoMovimientoCajaRepository: TipoMovimientoCajaRepository,
    private readonly movimientoCajaRepository: MovimientoCajaRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
  ) {}

  async crearRegistro(context: UserContext, input: CrearCajaInput): Promise<cash_registers> {
    new CajaRegistro('pendiente', input.companyId, input.branchId, input.name, input.registerType); // valida invariantes

    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      input.companyId,
    );
    if (!empresaValida) throw new EmpresaInvalidaException(input.companyId);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      input.branchId,
      input.companyId,
    );
    if (!sucursalValida) throw new SucursalInvalidaException(input.branchId, input.companyId);

    return this.cajaRegistroRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      branch_id: input.branchId,
      name: input.name,
      register_type: input.registerType,
    });
  }

  async listarRegistros(
    context: UserContext,
    branchId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cash_registers>> {
    return this.cajaRegistroRepository.findMany(
      context,
      branchId ? { branch_id: branchId } : {},
      pagination,
    );
  }

  async obtenerRegistro(context: UserContext, id: string): Promise<cash_registers> {
    const caja = await this.cajaRegistroRepository.findById(context, { id });
    if (!caja) throw new CajaNoEncontradaException(id);
    return caja;
  }

  /**
   * P0-3 — valida que `registerId` pertenezca realmente a `branchId`/
   * `companyId` antes de operar contra esa caja (ej. checkout de POS).
   * Reutiliza `obtenerRegistro` (RLS ya filtra por tenant ahí) en vez de
   * duplicar el lookup — esto solo agrega la comparación de pertenencia
   * que faltaba.
   */
  async obtenerRegistroDeSucursal(
    context: UserContext,
    registerId: string,
    branchId: string,
    companyId: string,
  ): Promise<cash_registers> {
    const caja = await this.obtenerRegistro(context, registerId);
    if (caja.branch_id !== branchId || caja.company_id !== companyId) {
      throw new RegistroNoPerteneceASucursalException(registerId, branchId, companyId);
    }
    return caja;
  }

  async obtenerAperturaActiva(
    context: UserContext,
    registerId: string,
  ): Promise<cash_register_openings | null> {
    const resultado = await this.aperturaCajaRepository.findMany(
      context,
      { register_id: registerId, is_open: true },
      { page: 1, pageSize: 1 },
    );
    return resultado.data[0] ?? null;
  }

  async abrir(context: UserContext, input: AbrirCajaInput): Promise<cash_register_openings> {
    const caja = await this.obtenerRegistro(context, input.registerId);

    try {
      return await this.aperturaCajaRepository.create(context, {
        tenant_id: context.tenantId,
        company_id: caja.company_id,
        branch_id: caja.branch_id,
        register_id: input.registerId,
        opened_by_user_id: context.userId,
        opening_amount: input.openingAmount,
        is_open: true,
      });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw new CajaYaAbiertaException(input.registerId);
      throw error;
    }
  }

  async cerrar(
    context: UserContext,
    input: CerrarCajaInput,
  ): Promise<{ apertura: cash_register_openings; cierre: cash_register_closings }> {
    const apertura = await this.aperturaCajaRepository.findById(context, { id: input.openingId });
    if (!apertura) throw new AperturaNoEncontradaException(input.openingId);

    const movimientos = await this.movimientoCajaRepository.listar(
      context,
      { opening_id: input.openingId },
      { page: 1, pageSize: 10000 },
    );
    const totalMovimientos = movimientos.data.reduce((acc, m) => acc + Number(m.amount), 0);
    const expectedAmount = Number(apertura.opening_amount) + totalMovimientos;

    const cierre = await this.cierreCajaRepository.create(context, {
      tenant_id: context.tenantId,
      company_id: apertura.company_id,
      branch_id: apertura.branch_id,
      opening_id: input.openingId,
      closed_by_user_id: context.userId,
      expected_amount: expectedAmount,
      counted_amount: input.countedAmount,
    });
    const aperturaCerrada = await this.aperturaCajaRepository.update(
      context,
      { id: input.openingId },
      { is_open: false },
    );
    return { apertura: aperturaCerrada, cierre };
  }

  /** Get-or-create idempotente del tipo de movimiento por código — mismo patrón que `ClientesService.obtenerOCrearConsumidorFinal`. */
  async resolverTipoPorCodigo(
    context: UserContext,
    code: string,
    direction: 'in' | 'out',
  ): Promise<string> {
    const existente = await this.tipoMovimientoCajaRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;

    try {
      const creado = await this.tipoMovimientoCajaRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        direction,
      });
      return creado.id;
    } catch (error) {
      if (!esViolacionDeUnicidad(error)) throw error;
      const reintento = await this.tipoMovimientoCajaRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  async registrarMovimiento(
    context: UserContext,
    params: {
      registerId: string;
      movementTypeCode: string;
      direction: 'in' | 'out';
      amount: number;
      sourceModule?: string;
      sourceEntityId?: string;
      observations?: string;
    },
  ): Promise<cash_movements> {
    const apertura = await this.obtenerAperturaActiva(context, params.registerId);
    if (!apertura) throw new CajaNoAbiertaException(params.registerId);

    const movementTypeId = await this.resolverTipoPorCodigo(
      context,
      params.movementTypeCode,
      params.direction,
    );

    return this.movimientoCajaRepository.registrar(context, {
      companyId: apertura.company_id,
      branchId: apertura.branch_id,
      registerId: params.registerId,
      openingId: apertura.id,
      movementTypeId,
      amount: params.direction === 'out' ? -Math.abs(params.amount) : Math.abs(params.amount),
      sourceModule: params.sourceModule ?? null,
      sourceEntityId: params.sourceEntityId ?? null,
      observations: params.observations ?? null,
    });
  }

  /** Movimientos de una apertura o caja — usado por la UI de Caja para la tabla de movimientos (antes solo se consultaba internamente al cerrar). */
  async listarMovimientos(
    context: UserContext,
    filtros: { openingId?: string; registerId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cash_movements>> {
    return this.movimientoCajaRepository.listar(
      context,
      {
        ...(filtros.openingId ? { opening_id: filtros.openingId } : {}),
        ...(filtros.registerId ? { register_id: filtros.registerId } : {}),
      },
      pagination,
    );
  }

  /** Catálogo de tipos de movimiento (`cash.cash_movement_types`) — de solo lectura desde la app, mismo criterio que `VentasService.listarEstados`. */
  async listarTiposMovimiento(context: UserContext) {
    return this.tipoMovimientoCajaRepository.findMany(context, {}, { page: 1, pageSize: 50 });
  }

  /**
   * Ingreso/egreso manual de efectivo (depósito, retiro, corrección) desde
   * la UI de Caja — reutiliza `registrarMovimiento` (mismo mecanismo que ya
   * usa POS para cobros), solo agrega los códigos de tipo `ingreso_manual`/
   * `egreso_manual`. No duplica la validación de apertura activa, ya la
   * hace `registrarMovimiento`.
   */
  async registrarMovimientoManual(
    context: UserContext,
    input: RegistrarMovimientoManualInput,
  ): Promise<cash_movements> {
    return this.registrarMovimiento(context, {
      registerId: input.registerId,
      movementTypeCode: input.direction === 'in' ? 'ingreso_manual' : 'egreso_manual',
      direction: input.direction,
      amount: input.amount,
      sourceModule: 'caja_manual',
      observations: input.observations,
    });
  }
}
