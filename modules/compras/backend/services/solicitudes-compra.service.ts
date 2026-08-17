import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type {
  purchase_requisitions,
  purchase_requisition_status_history,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  SolicitudCompraRepository,
  type LineaSolicitudCompraParams,
  type SolicitudCompraConLineas,
} from '../repositories/solicitud-compra.repository';
import { EstadoSolicitudCompraRepository } from '../repositories/estado-solicitud-compra.repository';
import { HistorialEstadoSolicitudRepository } from '../repositories/historial-estado-solicitud.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { SolicitudCompra } from '../entities/solicitud-compra.entity';
import type {
  CrearSolicitudCompraInput,
  ActualizarSolicitudCompraInput,
} from '../validators/solicitudes-compra.schema';

export class SolicitudCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('SOLICITUD_COMPRA_NO_ENCONTRADA', `No existe la solicitud de compra "${id}".`, 404);
  }
}

export class SolicitudCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('SOLICITUD_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class SolicitudCompraNoEsBorradorException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'SOLICITUD_COMPRA_NO_ES_BORRADOR',
      `La solicitud de compra "${id}" ya no es un borrador (estado actual: "${estadoActual}") — no puede editarse ni eliminarse.`,
      409,
    );
  }
}

export class SolicitudCompraTransicionInvalidaException extends DomainException {
  constructor(id: string, estadoActual: string, accion: string) {
    super(
      'SOLICITUD_COMPRA_TRANSICION_INVALIDA',
      `La solicitud de compra "${id}" no puede "${accion}" desde su estado actual ("${estadoActual}").`,
      409,
    );
  }
}

function construirSolicitud(
  id: string,
  companyId: string,
  branchId: string | null,
  lines: Array<{ productId: string; quantity: number }>,
): void {
  try {
    new SolicitudCompra(id, companyId, branchId, lines);
  } catch (error) {
    throw new SolicitudCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function generarNumeroDocumento(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REQ-${timestamp}-${azar}`;
}

/**
 * Solicitudes de Compra (`purchases.purchase_requisitions`/
 * `purchase_requisition_lines`) — Compras FASE 3. Sin definición previa
 * de flujo de estados en el AKB — flujo candidato propuesto e
 * implementado en esta fase (documentado en el reporte de cierre):
 * `draft` → `submitted` → `approved`|`rejected`; `cancelled` alcanzable
 * desde `draft` o `submitted`. Cada transición queda registrada en
 * `purchase_requisition_status_history`. No lleva precio — eso aparece
 * recién en la Orden de Compra (Fase 4).
 */
@Injectable()
export class SolicitudesCompraService {
  constructor(
    private readonly solicitudCompraRepository: SolicitudCompraRepository,
    private readonly estadoSolicitudCompraRepository: EstadoSolicitudCompraRepository,
    private readonly historialEstadoSolicitudRepository: HistorialEstadoSolicitudRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoSolicitudCompraRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoSolicitudCompraRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        is_final: code === 'approved' || code === 'rejected' || code === 'cancelled',
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoSolicitudCompraRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoSolicitudCompraRepository.findById(context, {
      id: statusId,
    });
    return estado?.code ?? '';
  }

  private async transicionar(
    context: UserContext,
    actual: purchase_requisitions,
    nuevoCodigo: string,
  ): Promise<purchase_requisitions> {
    const statusId = await this.resolverEstadoPorCodigo(context, nuevoCodigo);
    const actualizada = await this.solicitudCompraRepository.actualizarEstado(
      context,
      actual.id,
      statusId,
    );
    await this.historialEstadoSolicitudRepository.registrar(context, {
      requisitionId: actual.id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      statusId,
    });
    return actualizada;
  }

  private async validarReferencias(
    context: UserContext,
    companyId: string,
    branchId: string | null,
    lines: Array<{ productId: string }>,
  ): Promise<void> {
    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      companyId,
    );
    if (!empresaValida)
      throw new SolicitudCompraInvalidaException(`No existe la empresa "${companyId}".`);

    if (branchId) {
      const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
        context,
        branchId,
        companyId,
      );
      if (!sucursalValida) {
        throw new SolicitudCompraInvalidaException(
          `No existe la sucursal "${branchId}" en esa empresa.`,
        );
      }
    }

    for (const linea of lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new SolicitudCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }
  }

  async crear(
    context: UserContext,
    input: CrearSolicitudCompraInput,
  ): Promise<SolicitudCompraConLineas> {
    const branchId = input.branchId ?? null;
    construirSolicitud('pendiente', input.companyId, branchId, input.lines);
    await this.validarReferencias(context, input.companyId, branchId, input.lines);

    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    const lines: LineaSolicitudCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    const creada = await this.solicitudCompraRepository.crear(context, {
      companyId: input.companyId,
      branchId,
      requestedByUserId: context.userId,
      statusId,
      documentNumber: generarNumeroDocumento(),
      lines,
    });
    await this.historialEstadoSolicitudRepository.registrar(context, {
      requisitionId: creada.id,
      companyId: creada.company_id,
      branchId: creada.branch_id,
      statusId,
    });
    return creada;
  }

  async obtener(context: UserContext, id: string): Promise<SolicitudCompraConLineas> {
    const solicitud = await this.solicitudCompraRepository.obtener(context, id);
    if (!solicitud) throw new SolicitudCompraNoEncontradaException(id);
    return solicitud;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; branchId?: string; statusId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_requisitions>> {
    return this.solicitudCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.branchId ? { branch_id: filtros.branchId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
      },
      pagination,
    );
  }

  async historial(
    context: UserContext,
    id: string,
  ): Promise<purchase_requisition_status_history[]> {
    await this.obtener(context, id);
    return this.historialEstadoSolicitudRepository.listar(context, id);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarSolicitudCompraInput,
  ): Promise<SolicitudCompraConLineas> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new SolicitudCompraNoEsBorradorException(id, estadoActual);

    construirSolicitud(actual.id, actual.company_id, actual.branch_id, input.lines);
    await this.validarReferencias(context, actual.company_id, actual.branch_id, input.lines);

    const lines: LineaSolicitudCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
    return this.solicitudCompraRepository.actualizar(context, id, { lines });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_requisitions> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new SolicitudCompraNoEsBorradorException(id, estadoActual);
    return this.solicitudCompraRepository.eliminar(context, id);
  }

  async enviar(context: UserContext, id: string): Promise<purchase_requisitions> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') {
      throw new SolicitudCompraTransicionInvalidaException(id, estadoActual, 'enviar');
    }
    return this.transicionar(context, actual, 'submitted');
  }

  async aprobar(context: UserContext, id: string): Promise<purchase_requisitions> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'submitted') {
      throw new SolicitudCompraTransicionInvalidaException(id, estadoActual, 'aprobar');
    }
    return this.transicionar(context, actual, 'approved');
  }

  async rechazar(context: UserContext, id: string): Promise<purchase_requisitions> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'submitted') {
      throw new SolicitudCompraTransicionInvalidaException(id, estadoActual, 'rechazar');
    }
    return this.transicionar(context, actual, 'rejected');
  }

  async cancelar(context: UserContext, id: string): Promise<purchase_requisitions> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft' && estadoActual !== 'submitted') {
      throw new SolicitudCompraTransicionInvalidaException(id, estadoActual, 'cancelar');
    }
    return this.transicionar(context, actual, 'cancelled');
  }
}
