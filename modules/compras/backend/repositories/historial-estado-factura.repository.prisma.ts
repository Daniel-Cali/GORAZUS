import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrismaClient,
  purchase_invoice_status_history,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  HistorialEstadoFacturaRepository,
  type RegistrarTransicionFacturaParams,
} from './historial-estado-factura.repository';

@Injectable()
export class HistorialEstadoFacturaRepositoryPrisma extends HistorialEstadoFacturaRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async registrar(
    context: UserContext,
    params: RegistrarTransicionFacturaParams,
  ): Promise<purchase_invoice_status_history> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_invoice_status_history.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_invoice_id: params.purchaseInvoiceId,
          status_id: params.statusId,
        },
      }),
    );
  }

  async listar(
    context: UserContext,
    purchaseInvoiceId: string,
  ): Promise<purchase_invoice_status_history[]> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_invoice_status_history.findMany({
        where: { purchase_invoice_id: purchaseInvoiceId, deleted_at: null },
        orderBy: { created_at: 'asc' },
      }),
    );
  }
}
