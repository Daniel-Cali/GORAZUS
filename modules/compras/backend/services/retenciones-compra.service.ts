import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { purchase_withholdings } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { RetencionCompraRepository } from '../repositories/retencion-compra.repository';
import { FacturaCompraRepository } from '../repositories/factura-compra.repository';
import { EstadoFacturaCompraRepository } from '../repositories/estado-factura-compra.repository';
import { RetencionCompra } from '../entities/retencion-compra.entity';
import type {
  CrearRetencionCompraInput,
  ActualizarRetencionCompraInput,
} from '../validators/retenciones-compra.schema';

export class RetencionCompraNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('RETENCION_COMPRA_NO_ENCONTRADA', `No existe la retención de compra "${id}".`, 404);
  }
}

export class RetencionCompraInvalidaException extends DomainException {
  constructor(mensaje: string) {
    super('RETENCION_COMPRA_INVALIDA', mensaje, 400);
  }
}

export class FacturaNoValidaParaRetencionException extends DomainException {
  constructor(purchaseInvoiceId: string) {
    super(
      'FACTURA_NO_VALIDA_PARA_RETENCION',
      `La factura de compra "${purchaseInvoiceId}" está cancelada — no admite retenciones.`,
      409,
    );
  }
}

export class MontoExcedeFacturaException extends DomainException {
  constructor(
    purchaseInvoiceId: string,
    totalFactura: number,
    yaRetenido: number,
    intentado: number,
  ) {
    super(
      'MONTO_EXCEDE_FACTURA',
      `La retención excede el total de la factura "${purchaseInvoiceId}": total ${totalFactura}, ya retenido ${yaRetenido}, se intenta retener ${intentado}.`,
      409,
    );
  }
}

function construirRetencion(
  id: string,
  purchaseInvoiceId: string,
  withholdingRuleId: string | null,
  amount: number,
): void {
  try {
    new RetencionCompra(id, purchaseInvoiceId, withholdingRuleId, amount);
  } catch (error) {
    throw new RetencionCompraInvalidaException(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Retenciones de Compra (`purchases.purchase_withholdings`) — Compras
 * FASE 10. Sin líneas propias — registro a nivel de cabecera de
 * factura, sin flujo de estados en el schema real (mismo criterio que
 * `DevolucionCompra`/`NotaCreditoCompra`). Reutiliza
 * `FacturaCompraRepository`/`EstadoFacturaCompraRepository` ya
 * existentes; `withholdingRuleId` no se valida contra
 * `taxes.withholding_rules` — integración fiscal completa fuera de
 * alcance (mismo criterio que `taxId` en Purchase Invoice).
 */
@Injectable()
export class RetencionesCompraService {
  constructor(
    private readonly retencionCompraRepository: RetencionCompraRepository,
    private readonly facturaCompraRepository: FacturaCompraRepository,
    private readonly estadoFacturaCompraRepository: EstadoFacturaCompraRepository,
  ) {}

  private async validarFactura(
    context: UserContext,
    purchaseInvoiceId: string,
    amount: number,
    excludingWithholdingId?: string,
  ) {
    const factura = await this.facturaCompraRepository.obtener(context, purchaseInvoiceId);
    if (!factura) {
      throw new RetencionCompraInvalidaException(
        `No existe la factura de compra "${purchaseInvoiceId}".`,
      );
    }

    const estado = await this.estadoFacturaCompraRepository.findById(context, {
      id: factura.status_id,
    });
    if (estado?.code === 'cancelled') {
      throw new FacturaNoValidaParaRetencionException(purchaseInvoiceId);
    }

    const yaRetenido = await this.retencionCompraRepository.sumarMontoRetenido(
      context,
      purchaseInvoiceId,
      excludingWithholdingId,
    );
    const totalFactura = Number(factura.total_amount);
    if (yaRetenido + amount > totalFactura) {
      throw new MontoExcedeFacturaException(purchaseInvoiceId, totalFactura, yaRetenido, amount);
    }

    return factura;
  }

  async crear(
    context: UserContext,
    input: CrearRetencionCompraInput,
  ): Promise<purchase_withholdings> {
    construirRetencion(
      'pendiente',
      input.purchaseInvoiceId,
      input.withholdingRuleId ?? null,
      input.amount,
    );
    const factura = await this.validarFactura(context, input.purchaseInvoiceId, input.amount);

    return this.retencionCompraRepository.crear(context, {
      companyId: factura.company_id,
      branchId: factura.branch_id,
      purchaseInvoiceId: input.purchaseInvoiceId,
      withholdingRuleId: input.withholdingRuleId ?? null,
      amount: input.amount,
    });
  }

  async obtener(context: UserContext, id: string): Promise<purchase_withholdings> {
    const retencion = await this.retencionCompraRepository.obtener(context, id);
    if (!retencion) throw new RetencionCompraNoEncontradaException(id);
    return retencion;
  }

  async listar(
    context: UserContext,
    filtros: { purchaseInvoiceId?: string },
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_withholdings>> {
    return this.retencionCompraRepository.listar(
      context,
      { ...(filtros.purchaseInvoiceId ? { purchase_invoice_id: filtros.purchaseInvoiceId } : {}) },
      pagination,
    );
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarRetencionCompraInput,
  ): Promise<purchase_withholdings> {
    const actual = await this.obtener(context, id);
    construirRetencion(
      actual.id,
      actual.purchase_invoice_id,
      input.withholdingRuleId ?? null,
      input.amount,
    );
    await this.validarFactura(context, actual.purchase_invoice_id, input.amount, id);

    return this.retencionCompraRepository.actualizar(context, id, {
      withholdingRuleId: input.withholdingRuleId ?? null,
      amount: input.amount,
    });
  }

  async anular(context: UserContext, id: string): Promise<purchase_withholdings> {
    await this.obtener(context, id);
    return this.retencionCompraRepository.anular(context, id);
  }
}
