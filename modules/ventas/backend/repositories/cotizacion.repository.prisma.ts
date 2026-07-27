import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES, withTenantScope } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, quotes } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  CotizacionRepository,
  type CrearCotizacionParams,
  type ActualizarCotizacionParams,
  type CotizacionConLineas,
  type OrdenCotizacion,
} from './cotizacion.repository';

export class CotizacionNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class CotizacionRepositoryPrisma extends CotizacionRepository {
  constructor(@Inject(PRISMA_SALES) private readonly client: SalesPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearCotizacionParams): Promise<CotizacionConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.quotes.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          customer_id: params.customerId,
          salesperson_id: params.salespersonId ?? null,
          status_id: params.statusId,
          currency_code: params.currencyCode,
          document_number: params.documentNumber,
          total_amount: params.totalAmount,
          valid_until: params.validUntil ?? null,
          quote_lines: {
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
        include: { quote_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<CotizacionConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.quotes.findFirst({
        where: { id, deleted_at: null },
        include: { quote_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: SalesPrisma.quotesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenCotizacion; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<quotes>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.quotes.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: orden ? { [orden.campo]: orden.direccion } : { created_at: 'desc' },
        }),
        tx.quotes.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(context: UserContext, id: string, statusId: string): Promise<quotes> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.quotes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new CotizacionNoEncontradaParaActualizarError(id);
      return tx.quotes.update({ where: { id }, data: { status_id: statusId } });
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarCotizacionParams,
  ): Promise<CotizacionConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.quotes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new CotizacionNoEncontradaParaActualizarError(id);

      await tx.quote_lines.updateMany({
        where: { quote_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.quotes.update({
        where: { id },
        data: {
          total_amount: params.totalAmount,
          valid_until: params.validUntil ?? null,
          quote_lines: {
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
        include: { quote_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async eliminar(context: UserContext, id: string): Promise<quotes> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.quotes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new CotizacionNoEncontradaParaActualizarError(id);
      return tx.quotes.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
