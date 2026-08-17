import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { imports, import_status_history, import_expenses } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  ExpedienteImportacionRepository,
  type ExpedienteImportacionConGastos,
} from '../repositories/expediente-importacion.repository';
import { EstadoImportacionRepository } from '../repositories/estado-importacion.repository';
import { HistorialEstadoImportacionRepository } from '../repositories/historial-estado-importacion.repository';
import { GastoImportacionRepository } from '../repositories/gasto-importacion.repository';
import { OrdenCompraRepository } from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import { ExpedienteImportacion } from '../entities/expediente-importacion.entity';
import { GastoImportacion, type TipoGastoImportacion } from '../entities/gasto-importacion.entity';
import type {
  CrearExpedienteImportacionInput,
  AgregarGastoImportacionInput,
} from '../validators/importaciones.schema';

export class ExpedienteImportacionNoEncontradoException extends DomainException {
  constructor(id: string) {
    super(
      'EXPEDIENTE_IMPORTACION_NO_ENCONTRADO',
      `No existe el expediente de importación "${id}".`,
      404,
    );
  }
}

export class ExpedienteImportacionInvalidoException extends DomainException {
  constructor(mensaje: string) {
    super('EXPEDIENTE_IMPORTACION_INVALIDO', mensaje, 400);
  }
}

export class OrdenNoValidaParaImportacionException extends DomainException {
  constructor(purchaseOrderId: string, estadoActual: string) {
    super(
      'ORDEN_NO_VALIDA_PARA_IMPORTACION',
      `La orden de compra "${purchaseOrderId}" no admite un expediente de importación en su estado actual ("${estadoActual}") — debe estar "approved".`,
      409,
    );
  }
}

export class ImportacionTransicionInvalidaException extends DomainException {
  constructor(id: string, estadoActual: string, accion: string) {
    super(
      'IMPORTACION_TRANSICION_INVALIDA',
      `El expediente de importación "${id}" no puede "${accion}" desde su estado actual ("${estadoActual}").`,
      409,
    );
  }
}

export class GastoImportacionNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('GASTO_IMPORTACION_NO_ENCONTRADO', `No existe el gasto de importación "${id}".`, 404);
  }
}

function construirExpediente(id: string, companyId: string, purchaseOrderId: string): void {
  try {
    new ExpedienteImportacion(id, companyId, purchaseOrderId);
  } catch (error) {
    throw new ExpedienteImportacionInvalidoException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function construirGasto(
  id: string,
  importId: string,
  expenseType: TipoGastoImportacion,
  amount: number,
): void {
  try {
    new GastoImportacion(id, importId, expenseType, amount);
  } catch (error) {
    throw new ExpedienteImportacionInvalidoException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Expedientes de Importación (`purchases.imports`/`import_expenses`) —
 * Compras FASE 11, última del roadmap autorizado. Flujo de estados real
 * del schema (comentario original: "en tránsito, en aduana,
 * nacionalizado") — propuesto e implementado con códigos: `in_transit`
 * → `at_customs` → `cleared`; `cancelled` alcanzable desde `in_transit`
 * o `at_customs`, nunca desde `cleared`. `import_status` no tiene
 * `is_final` (verificado en `schema.prisma`) — se omite ese campo al
 * resolver estados en caliente.
 */
@Injectable()
export class ImportacionesService {
  constructor(
    private readonly expedienteImportacionRepository: ExpedienteImportacionRepository,
    private readonly estadoImportacionRepository: EstadoImportacionRepository,
    private readonly historialEstadoImportacionRepository: HistorialEstadoImportacionRepository,
    private readonly gastoImportacionRepository: GastoImportacionRepository,
    private readonly ordenCompraRepository: OrdenCompraRepository,
    private readonly estadoOrdenCompraRepository: EstadoOrdenCompraRepository,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoImportacionRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoImportacionRepository.create(context, {
        tenant_id: context.tenantId,
        code,
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoImportacionRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoImportacionRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  private async transicionar(
    context: UserContext,
    actual: imports,
    nuevoCodigo: string,
  ): Promise<imports> {
    const statusId = await this.resolverEstadoPorCodigo(context, nuevoCodigo);
    const actualizado = await this.expedienteImportacionRepository.actualizarEstado(
      context,
      actual.id,
      statusId,
    );
    await this.historialEstadoImportacionRepository.registrar(context, {
      importId: actual.id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      statusId,
    });
    return actualizado;
  }

  async crear(context: UserContext, input: CrearExpedienteImportacionInput): Promise<imports> {
    const orden = await this.ordenCompraRepository.obtener(context, input.purchaseOrderId);
    if (!orden) {
      throw new ExpedienteImportacionInvalidoException(
        `No existe la orden de compra "${input.purchaseOrderId}".`,
      );
    }
    const estadoOrden = await this.estadoOrdenCompraRepository.findById(context, {
      id: orden.status_id,
    });
    if (estadoOrden?.code !== 'approved') {
      throw new OrdenNoValidaParaImportacionException(
        input.purchaseOrderId,
        estadoOrden?.code ?? '',
      );
    }

    construirExpediente('pendiente', orden.company_id, input.purchaseOrderId);
    const statusId = await this.resolverEstadoPorCodigo(context, 'in_transit');

    const creado = await this.expedienteImportacionRepository.crear(context, {
      companyId: orden.company_id,
      branchId: orden.branch_id,
      purchaseOrderId: input.purchaseOrderId,
      statusId,
    });
    await this.historialEstadoImportacionRepository.registrar(context, {
      importId: creado.id,
      companyId: creado.company_id,
      branchId: creado.branch_id,
      statusId,
    });
    return creado;
  }

  async obtener(context: UserContext, id: string): Promise<ExpedienteImportacionConGastos> {
    const expediente = await this.expedienteImportacionRepository.obtener(context, id);
    if (!expediente) throw new ExpedienteImportacionNoEncontradoException(id);
    return expediente;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; purchaseOrderId?: string; statusId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<imports>> {
    return this.expedienteImportacionRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.purchaseOrderId ? { purchase_order_id: filtros.purchaseOrderId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
      },
      pagination,
    );
  }

  async historial(context: UserContext, id: string): Promise<import_status_history[]> {
    await this.obtener(context, id);
    return this.historialEstadoImportacionRepository.listar(context, id);
  }

  async avanzarAAduana(context: UserContext, id: string): Promise<imports> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'in_transit') {
      throw new ImportacionTransicionInvalidaException(id, estadoActual, 'avanzar a aduana');
    }
    return this.transicionar(context, actual, 'at_customs');
  }

  async nacionalizar(context: UserContext, id: string): Promise<imports> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'at_customs') {
      throw new ImportacionTransicionInvalidaException(id, estadoActual, 'nacionalizar');
    }
    return this.transicionar(context, actual, 'cleared');
  }

  async cancelar(context: UserContext, id: string): Promise<imports> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'in_transit' && estadoActual !== 'at_customs') {
      throw new ImportacionTransicionInvalidaException(id, estadoActual, 'cancelar');
    }
    return this.transicionar(context, actual, 'cancelled');
  }

  async agregarGasto(
    context: UserContext,
    id: string,
    input: AgregarGastoImportacionInput,
  ): Promise<import_expenses> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual === 'cancelled') {
      throw new ImportacionTransicionInvalidaException(id, estadoActual, 'agregar un gasto');
    }

    construirGasto('pendiente', id, input.expenseType, input.amount);

    return this.gastoImportacionRepository.crear(context, {
      companyId: actual.company_id,
      branchId: actual.branch_id,
      importId: id,
      expenseType: input.expenseType,
      amount: input.amount,
    });
  }

  async anularGasto(
    context: UserContext,
    importId: string,
    expenseId: string,
  ): Promise<import_expenses> {
    await this.obtener(context, importId);
    const gasto = await this.gastoImportacionRepository.obtener(context, expenseId);
    if (!gasto || gasto.import_id !== importId) {
      throw new GastoImportacionNoEncontradoException(expenseId);
    }
    return this.gastoImportacionRepository.anular(context, expenseId);
  }

  async anular(context: UserContext, id: string): Promise<imports> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual === 'cleared') {
      throw new ImportacionTransicionInvalidaException(id, estadoActual, 'anular');
    }
    return this.expedienteImportacionRepository.anular(context, id);
  }
}
