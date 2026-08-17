import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_orders, purchase_order_status_history } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import {
  OrdenCompraRepository,
  type LineaOrdenCompraParams,
  type OrdenCompraConLineas,
} from '../repositories/orden-compra.repository';
import { EstadoOrdenCompraRepository } from '../repositories/estado-orden-compra.repository';
import { HistorialEstadoOrdenRepository } from '../repositories/historial-estado-orden.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ProveedorLookupRepository } from '../repositories/proveedor-lookup.repository';
import { SolicitudCompraRepository } from '../repositories/solicitud-compra.repository';
import { OrdenCompra } from '../entities/orden-compra.entity';
import type {
  CrearOrdenCompraInput,
  ActualizarOrdenCompraInput,
} from '../validators/ordenes-compra.schema';

export class OrdenCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('ORDEN_COMPRA_NO_ENCONTRADA', `No existe la orden de compra "${id}".`, 404);
  }
}

export class OrdenCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('ORDEN_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class ProveedorBloqueadoException extends DomainException {
  constructor(supplierId: string) {
    super(
      'PROVEEDOR_BLOQUEADO',
      `El proveedor "${supplierId}" está bloqueado — no se le pueden emitir órdenes de compra.`,
      409,
    );
  }
}

export class OrdenCompraNoEsBorradorException extends DomainException {
  constructor(id: string, estadoActual: string) {
    super(
      'ORDEN_COMPRA_NO_ES_BORRADOR',
      `La orden de compra "${id}" ya no es un borrador (estado actual: "${estadoActual}") — no puede editarse ni eliminarse.`,
      409,
    );
  }
}

export class OrdenCompraTransicionInvalidaException extends DomainException {
  constructor(id: string, estadoActual: string, accion: string) {
    super(
      'ORDEN_COMPRA_TRANSICION_INVALIDA',
      `La orden de compra "${id}" no puede "${accion}" desde su estado actual ("${estadoActual}").`,
      409,
    );
  }
}

function construirOrden(
  id: string,
  companyId: string,
  branchId: string,
  supplierId: string,
  lines: Array<{ productId: string; quantity: number; unitPrice: number }>,
): void {
  try {
    new OrdenCompra(id, companyId, branchId, supplierId, lines);
  } catch (error) {
    throw new OrdenCompraInvalidaException(error instanceof Error ? error.message : String(error));
  }
}

function calcularTotal(lines: Array<{ quantity: number; unitPrice: number }>): number {
  const total = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  return Number(total.toFixed(4));
}

function generarNumeroDocumento(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OC-${timestamp}-${azar}`;
}

/**
 * Órdenes de Compra (`purchases.purchase_orders`/`purchase_order_lines`)
 * — Compras FASE 4. Sin definición previa de flujo de estados en el AKB
 * — flujo candidato propuesto e implementado en esta fase (documentado
 * en el reporte de cierre): `draft` → `approved`; `cancelled`
 * alcanzable desde `draft` o `approved`. `partially_received`/
 * `received`/`closed` quedan deliberadamente fuera — dependen de Goods
 * Receipt (Fase 5), explícitamente fuera de alcance de esta fase; el
 * catálogo de estados admite agregarlos después sin migración (mismo
 * patrón de resolución en caliente que `SolicitudesCompraService`).
 *
 * Integraciones permitidas en esta fase: Suppliers (existencia + no
 * bloqueado) y Purchase Requisition (existencia, relación opcional). No
 * hay integración con Goods Receipt, Costeo, Contabilidad ni eventos
 * hacia Inventario.
 */
@Injectable()
export class OrdenesCompraService {
  constructor(
    private readonly ordenCompraRepository: OrdenCompraRepository,
    private readonly estadoOrdenCompraRepository: EstadoOrdenCompraRepository,
    private readonly historialEstadoOrdenRepository: HistorialEstadoOrdenRepository,
    private readonly empresaSucursalLookupRepository: EmpresaSucursalLookupRepository,
    private readonly productoLookupRepository: ProductoLookupRepository,
    private readonly proveedorLookupRepository: ProveedorLookupRepository,
    private readonly solicitudCompraRepository: SolicitudCompraRepository,
  ) {}

  private async resolverEstadoPorCodigo(context: UserContext, code: string): Promise<string> {
    const existente = await this.estadoOrdenCompraRepository.findMany(
      context,
      { code },
      { page: 1, pageSize: 1 },
    );
    if (existente.data[0]) return existente.data[0].id;
    try {
      const creado = await this.estadoOrdenCompraRepository.create(context, {
        tenant_id: context.tenantId,
        code,
        is_final: code === 'cancelled',
      });
      return creado.id;
    } catch (error) {
      const esViolacionDeUnicidad =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
      if (!esViolacionDeUnicidad) throw error;
      const reintento = await this.estadoOrdenCompraRepository.findMany(
        context,
        { code },
        { page: 1, pageSize: 1 },
      );
      if (!reintento.data[0]) throw error;
      return reintento.data[0].id;
    }
  }

  private async obtenerCodigoEstado(context: UserContext, statusId: string): Promise<string> {
    const estado = await this.estadoOrdenCompraRepository.findById(context, { id: statusId });
    return estado?.code ?? '';
  }

  private async transicionar(
    context: UserContext,
    actual: purchase_orders,
    nuevoCodigo: string,
  ): Promise<purchase_orders> {
    const statusId = await this.resolverEstadoPorCodigo(context, nuevoCodigo);
    const actualizada = await this.ordenCompraRepository.actualizarEstado(
      context,
      actual.id,
      statusId,
    );
    await this.historialEstadoOrdenRepository.registrar(context, {
      purchaseOrderId: actual.id,
      companyId: actual.company_id,
      branchId: actual.branch_id,
      statusId,
    });
    return actualizada;
  }

  private async validarReferencias(
    context: UserContext,
    companyId: string,
    branchId: string,
    supplierId: string,
    requisitionId: string | null | undefined,
    lines: Array<{ productId: string }>,
  ): Promise<void> {
    const empresaValida = await this.empresaSucursalLookupRepository.existeEmpresa(
      context,
      companyId,
    );
    if (!empresaValida)
      throw new OrdenCompraInvalidaException(`No existe la empresa "${companyId}".`);

    const sucursalValida = await this.empresaSucursalLookupRepository.existeSucursalDeEmpresa(
      context,
      branchId,
      companyId,
    );
    if (!sucursalValida) {
      throw new OrdenCompraInvalidaException(`No existe la sucursal "${branchId}" en esa empresa.`);
    }

    const proveedor = await this.proveedorLookupRepository.obtenerProveedor(context, supplierId);
    if (!proveedor)
      throw new OrdenCompraInvalidaException(`No existe el proveedor "${supplierId}".`);
    if (proveedor.isBlocked) throw new ProveedorBloqueadoException(supplierId);

    if (requisitionId) {
      const solicitud = await this.solicitudCompraRepository.obtener(context, requisitionId);
      if (!solicitud) {
        throw new OrdenCompraInvalidaException(
          `No existe la solicitud de compra "${requisitionId}".`,
        );
      }
    }

    for (const linea of lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new OrdenCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }
  }

  async crear(context: UserContext, input: CrearOrdenCompraInput): Promise<OrdenCompraConLineas> {
    construirOrden('pendiente', input.companyId, input.branchId, input.supplierId, input.lines);
    await this.validarReferencias(
      context,
      input.companyId,
      input.branchId,
      input.supplierId,
      input.requisitionId,
      input.lines,
    );

    const statusId = await this.resolverEstadoPorCodigo(context, 'draft');
    const lines: LineaOrdenCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }));
    const totalAmount = calcularTotal(lines);

    const creada = await this.ordenCompraRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId,
      supplierId: input.supplierId,
      requisitionId: input.requisitionId ?? null,
      statusId,
      currencyCode: input.currencyCode,
      documentNumber: generarNumeroDocumento(),
      totalAmount,
      lines,
    });
    await this.historialEstadoOrdenRepository.registrar(context, {
      purchaseOrderId: creada.id,
      companyId: creada.company_id,
      branchId: creada.branch_id,
      statusId,
    });
    return creada;
  }

  async obtener(context: UserContext, id: string): Promise<OrdenCompraConLineas> {
    const orden = await this.ordenCompraRepository.obtener(context, id);
    if (!orden) throw new OrdenCompraNoEncontradaException(id);
    return orden;
  }

  async listar(
    context: UserContext,
    filtros: { companyId: string; branchId?: string; supplierId?: string; statusId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_orders>> {
    return this.ordenCompraRepository.listar(
      context,
      {
        company_id: filtros.companyId,
        ...(filtros.branchId ? { branch_id: filtros.branchId } : {}),
        ...(filtros.supplierId ? { supplier_id: filtros.supplierId } : {}),
        ...(filtros.statusId ? { status_id: filtros.statusId } : {}),
      },
      pagination,
    );
  }

  async historial(context: UserContext, id: string): Promise<purchase_order_status_history[]> {
    await this.obtener(context, id);
    return this.historialEstadoOrdenRepository.listar(context, id);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarOrdenCompraInput,
  ): Promise<OrdenCompraConLineas> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new OrdenCompraNoEsBorradorException(id, estadoActual);

    construirOrden(actual.id, actual.company_id, actual.branch_id, actual.supplier_id, input.lines);
    for (const linea of input.lines) {
      const productoValido = await this.productoLookupRepository.existeProducto(
        context,
        linea.productId,
      );
      if (!productoValido) {
        throw new OrdenCompraInvalidaException(`No existe el producto "${linea.productId}".`);
      }
    }

    const lines: LineaOrdenCompraParams[] = input.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }));
    return this.ordenCompraRepository.actualizar(context, id, {
      totalAmount: calcularTotal(lines),
      lines,
    });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_orders> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') throw new OrdenCompraNoEsBorradorException(id, estadoActual);
    return this.ordenCompraRepository.eliminar(context, id);
  }

  async aprobar(context: UserContext, id: string): Promise<purchase_orders> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft') {
      throw new OrdenCompraTransicionInvalidaException(id, estadoActual, 'aprobar');
    }
    return this.transicionar(context, actual, 'approved');
  }

  async cancelar(context: UserContext, id: string): Promise<purchase_orders> {
    const actual = await this.obtener(context, id);
    const estadoActual = await this.obtenerCodigoEstado(context, actual.status_id);
    if (estadoActual !== 'draft' && estadoActual !== 'approved') {
      throw new OrdenCompraTransicionInvalidaException(id, estadoActual, 'cancelar');
    }
    return this.transicionar(context, actual, 'cancelled');
  }
}
