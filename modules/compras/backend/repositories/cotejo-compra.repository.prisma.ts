import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_invoice_matching,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { CotejoCompraRepository, type CrearCotejoCompraParams } from './cotejo-compra.repository';

export class CotejoCompraNoEncontradoParaActualizarError extends Error {}

@Injectable()
export class CotejoCompraRepositoryPrisma extends CotejoCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearCotejoCompraParams,
  ): Promise<purchase_invoice_matching> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_invoice_matching.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_order_id: params.purchaseOrderId,
          receipt_note_id: params.receiptNoteId,
          purchase_invoice_id: params.purchaseInvoiceId,
          discrepancy_amount: params.discrepancyAmount,
          is_within_tolerance: params.isWithinTolerance,
        },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<purchase_invoice_matching | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_invoice_matching.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_invoice_matchingWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_invoice_matching>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_invoice_matching.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_invoice_matching.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async anular(context: UserContext, id: string): Promise<purchase_invoice_matching> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_invoice_matching.findFirst({
        where: { id, deleted_at: null },
      });
      if (!actual) throw new CotejoCompraNoEncontradoParaActualizarError(id);
      return tx.purchase_invoice_matching.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
