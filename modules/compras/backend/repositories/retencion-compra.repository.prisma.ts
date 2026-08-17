import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_withholdings,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  RetencionCompraRepository,
  type CrearRetencionCompraParams,
  type ActualizarRetencionCompraParams,
} from './retencion-compra.repository';

export class RetencionCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class RetencionCompraRepositoryPrisma extends RetencionCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearRetencionCompraParams,
  ): Promise<purchase_withholdings> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_withholdings.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_invoice_id: params.purchaseInvoiceId,
          withholding_rule_id: params.withholdingRuleId,
          amount: params.amount,
        },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<purchase_withholdings | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_withholdings.findFirst({ where: { id, deleted_at: null } }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_withholdingsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_withholdings>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_withholdings.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_withholdings.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarRetencionCompraParams,
  ): Promise<purchase_withholdings> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_withholdings.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new RetencionCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_withholdings.update({
        where: { id },
        data: { withholding_rule_id: params.withholdingRuleId, amount: params.amount },
      });
    });
  }

  async anular(context: UserContext, id: string): Promise<purchase_withholdings> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_withholdings.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new RetencionCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_withholdings.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }

  async sumarMontoRetenido(
    context: UserContext,
    purchaseInvoiceId: string,
    excludingWithholdingId?: string,
  ): Promise<number> {
    return withTenantScope(this.client, context, async (tx) => {
      const retenciones = await tx.purchase_withholdings.findMany({
        where: {
          purchase_invoice_id: purchaseInvoiceId,
          deleted_at: null,
          ...(excludingWithholdingId ? { id: { not: excludingWithholdingId } } : {}),
        },
        select: { amount: true },
      });
      return retenciones.reduce((acc, r) => acc + Number(r.amount), 0);
    });
  }
}
