import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_credit_notes,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  NotaCreditoCompraRepository,
  type CrearNotaCreditoCompraParams,
  type ActualizarNotaCreditoCompraParams,
  type NotaCreditoCompraConLineas,
} from './nota-credito-compra.repository';

export class NotaCreditoCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class NotaCreditoCompraRepositoryPrisma extends NotaCreditoCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearNotaCreditoCompraParams,
  ): Promise<NotaCreditoCompraConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_credit_notes.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_invoice_id: params.purchaseInvoiceId,
          total_amount: params.totalAmount,
          purchase_credit_note_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_credit_note_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<NotaCreditoCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_credit_notes.findFirst({
        where: { id, deleted_at: null },
        include: { purchase_credit_note_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_credit_notesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_credit_notes>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_credit_notes.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_credit_notes.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarNotaCreditoCompraParams,
  ): Promise<NotaCreditoCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_credit_notes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new NotaCreditoCompraNoEncontradaParaActualizarError(id);

      await tx.purchase_credit_note_lines.updateMany({
        where: { credit_note_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.purchase_credit_notes.update({
        where: { id },
        data: {
          total_amount: params.totalAmount,
          purchase_credit_note_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: actual.company_id,
              branch_id: actual.branch_id,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_credit_note_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async anular(context: UserContext, id: string): Promise<purchase_credit_notes> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_credit_notes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new NotaCreditoCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_credit_notes.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }

  async sumarCantidadAcreditada(
    context: UserContext,
    purchaseInvoiceId: string,
    productId: string,
    excludingCreditNoteId?: string,
  ): Promise<number> {
    return withTenantScope(this.client, context, async (tx) => {
      const lineas = await tx.purchase_credit_note_lines.findMany({
        where: {
          product_id: productId,
          deleted_at: null,
          ...(excludingCreditNoteId ? { credit_note_id: { not: excludingCreditNoteId } } : {}),
          purchase_credit_notes: { purchase_invoice_id: purchaseInvoiceId, deleted_at: null },
        },
        select: { quantity: true },
      });
      return lineas.reduce((acc, l) => acc + Number(l.quantity), 0);
    });
  }
}
