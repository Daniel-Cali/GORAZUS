import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES, withTenantScope } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, sales_orders } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  PedidoRepository,
  type CrearPedidoParams,
  type PedidoConLineas,
  type OrdenPedido,
} from './pedido.repository';

export class PedidoNoEncontradoParaActualizarError extends Error {}

@Injectable()
export class PedidoRepositoryPrisma extends PedidoRepository {
  constructor(@Inject(PRISMA_SALES) private readonly client: SalesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearPedidoParams): Promise<PedidoConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.sales_orders.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          customer_id: params.customerId,
          quote_id: params.quoteId ?? null,
          salesperson_id: params.salespersonId ?? null,
          status_id: params.statusId,
          sales_channel: params.salesChannel,
          currency_code: params.currencyCode,
          document_number: params.documentNumber,
          total_amount: params.totalAmount,
          sales_order_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
              unit_price: line.unitPrice,
              discount_percentage: line.discountPercentage,
            })),
          },
        },
        include: { sales_order_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<PedidoConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.sales_orders.findFirst({
        where: { id, deleted_at: null },
        include: { sales_order_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: SalesPrisma.sales_ordersWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenPedido; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<sales_orders>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.sales_orders.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: orden ? { [orden.campo]: orden.direccion } : { created_at: 'desc' },
        }),
        tx.sales_orders.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<sales_orders> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.sales_orders.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new PedidoNoEncontradoParaActualizarError(id);
      return tx.sales_orders.update({ where: { id }, data: { status_id: statusId } });
    });
  }

  async registrarFacturacionDeLineas(
    context: UserContext,
    incrementos: Array<{ salesOrderLineId: string; cantidad: number }>,
  ): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      Promise.all(
        incrementos.map((inc) =>
          tx.sales_order_lines.update({
            where: { id: inc.salesOrderLineId },
            data: { invoiced_quantity: { increment: inc.cantidad } },
          }),
        ),
      ),
    );
  }
}
