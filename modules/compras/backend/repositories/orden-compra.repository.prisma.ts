import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_orders,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  OrdenCompraRepository,
  type CrearOrdenCompraParams,
  type ActualizarOrdenCompraParams,
  type OrdenCompraConLineas,
} from './orden-compra.repository';

export class OrdenCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class OrdenCompraRepositoryPrisma extends OrdenCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearOrdenCompraParams): Promise<OrdenCompraConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_orders.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          supplier_id: params.supplierId,
          requisition_id: params.requisitionId,
          status_id: params.statusId,
          currency_code: params.currencyCode,
          document_number: params.documentNumber,
          total_amount: params.totalAmount,
          purchase_order_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
              unit_price: line.unitPrice,
            })),
          },
        },
        include: { purchase_order_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<OrdenCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_orders.findFirst({
        where: { id, deleted_at: null },
        include: { purchase_order_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_ordersWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_orders>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_orders.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_orders.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_orders> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_orders.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new OrdenCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_orders.update({ where: { id }, data: { status_id: statusId } });
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarOrdenCompraParams,
  ): Promise<OrdenCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_orders.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new OrdenCompraNoEncontradaParaActualizarError(id);

      await tx.purchase_order_lines.updateMany({
        where: { purchase_order_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.purchase_orders.update({
        where: { id },
        data: {
          total_amount: params.totalAmount,
          purchase_order_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: actual.company_id,
              branch_id: actual.branch_id,
              product_id: line.productId,
              quantity: line.quantity,
              unit_price: line.unitPrice,
            })),
          },
        },
        include: { purchase_order_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_orders> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_orders.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new OrdenCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_orders.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
