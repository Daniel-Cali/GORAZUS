import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_invoices,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  FacturaCompraRepository,
  type CrearFacturaCompraParams,
  type ActualizarFacturaCompraParams,
  type FacturaCompraConLineas,
} from './factura-compra.repository';

export class FacturaCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class FacturaCompraRepositoryPrisma extends FacturaCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  private async conLineas(
    tx: PurchasesPrismaClient,
    factura: purchase_invoices,
  ): Promise<FacturaCompraConLineas> {
    const lineas = await tx.purchase_invoice_lines.findMany({
      where: { purchase_invoice_id: factura.id, deleted_at: null },
    });
    return { ...factura, purchase_invoice_lines: lineas };
  }

  async crear(
    context: UserContext,
    params: CrearFacturaCompraParams,
  ): Promise<FacturaCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const factura = await tx.purchase_invoices.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          supplier_id: params.supplierId,
          supplier_document_number: params.supplierDocumentNumber,
          purchase_order_id: params.purchaseOrderId,
          status_id: params.statusId,
          currency_code: params.currencyCode,
          subtotal_amount: params.subtotalAmount,
          tax_amount: params.taxAmount,
          total_amount: params.totalAmount,
        },
      });
      await tx.purchase_invoice_lines.createMany({
        data: params.lines.map((line) => ({
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_invoice_id: factura.id,
          product_id: line.productId,
          tax_id: line.taxId,
          quantity: line.quantity,
          unit_cost: line.unitCost,
        })),
      });
      return this.conLineas(tx, factura);
    });
  }

  async obtener(context: UserContext, id: string): Promise<FacturaCompraConLineas | null> {
    return withTenantScope(this.client, context, async (tx) => {
      const factura = await tx.purchase_invoices.findFirst({ where: { id, deleted_at: null } });
      if (!factura) return null;
      return this.conLineas(tx, factura);
    });
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_invoicesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoices>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_invoices.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_invoices.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_invoices> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaCompraNoEncontradaParaActualizarError(id);
      await tx.purchase_invoices.updateMany({ where: { id }, data: { status_id: statusId } });
      return { ...actual, status_id: statusId };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarFacturaCompraParams,
  ): Promise<FacturaCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaCompraNoEncontradaParaActualizarError(id);

      await tx.purchase_invoice_lines.updateMany({
        where: { purchase_invoice_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      await tx.purchase_invoice_lines.createMany({
        data: params.lines.map((line) => ({
          tenant_id: context.tenantId,
          company_id: actual.company_id,
          branch_id: actual.branch_id,
          purchase_invoice_id: id,
          product_id: line.productId,
          tax_id: line.taxId,
          quantity: line.quantity,
          unit_cost: line.unitCost,
        })),
      });
      await tx.purchase_invoices.updateMany({
        where: { id },
        data: {
          subtotal_amount: params.subtotalAmount,
          tax_amount: params.taxAmount,
          total_amount: params.totalAmount,
        },
      });
      // Re-consultar en vez de fusionar a mano — `subtotal_amount`/`tax_amount`/
      // `total_amount` son `Decimal` en el tipo generado, no `number`.
      const actualizada = await tx.purchase_invoices.findFirst({ where: { id } });
      if (!actualizada) throw new FacturaCompraNoEncontradaParaActualizarError(id);
      return this.conLineas(tx, actualizada);
    });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_invoices> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaCompraNoEncontradaParaActualizarError(id);
      const deletedAt = new Date();
      await tx.purchase_invoices.updateMany({
        where: { id },
        data: { deleted_at: deletedAt, deleted_by: context.userId },
      });
      return { ...actual, deleted_at: deletedAt, deleted_by: context.userId };
    });
  }

  async existeConReferencia(
    context: UserContext,
    supplierId: string,
    supplierDocumentNumber: string,
    excludingId?: string,
  ): Promise<boolean> {
    return withTenantScope(this.client, context, async (tx) => {
      const factura = await tx.purchase_invoices.findFirst({
        where: {
          supplier_id: supplierId,
          supplier_document_number: supplierDocumentNumber,
          deleted_at: null,
          ...(excludingId ? { id: { not: excludingId } } : {}),
        },
        select: { id: true },
      });
      return factura !== null;
    });
  }
}
