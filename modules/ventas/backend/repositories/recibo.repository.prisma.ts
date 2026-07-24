import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES, withTenantScope } from '@gorazus/core-database';
import type { SalesPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ReciboRepository,
  type CrearReciboParams,
  type ReciboConAllocations,
} from './recibo.repository';

@Injectable()
export class ReciboRepositoryPrisma extends ReciboRepository {
  constructor(@Inject(PRISMA_SALES) private readonly client: SalesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearReciboParams): Promise<ReciboConAllocations> {
    return withTenantScope(this.client, context, (tx) =>
      tx.receipts.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          customer_id: params.customerId,
          document_number: params.documentNumber,
          total_amount: params.totalAmount,
          payment_method_id: params.paymentFormId,
          receipt_allocations: {
            create: [
              {
                tenant_id: context.tenantId,
                company_id: params.companyId,
                branch_id: params.branchId,
                invoice_id: params.invoiceId,
                amount_applied: params.totalAmount,
              },
            ],
          },
        },
        include: { receipt_allocations: true },
      }),
    );
  }

  async listarPorFactura(context: UserContext, invoiceId: string): Promise<ReciboConAllocations[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.receipts.findMany({
        where: {
          deleted_at: null,
          receipt_allocations: { some: { invoice_id: invoiceId, deleted_at: null } },
        },
        include: { receipt_allocations: true },
      }),
    );
  }
}
