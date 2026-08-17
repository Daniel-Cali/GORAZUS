import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_returns,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  DevolucionCompraRepository,
  type CrearDevolucionCompraParams,
  type ActualizarDevolucionCompraParams,
  type DevolucionCompraConLineas,
} from './devolucion-compra.repository';

export class DevolucionCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class DevolucionCompraRepositoryPrisma extends DevolucionCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearDevolucionCompraParams,
  ): Promise<DevolucionCompraConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_returns.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          purchase_invoice_id: params.purchaseInvoiceId,
          reason: params.reason,
          purchase_return_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_return_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<DevolucionCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_returns.findFirst({
        where: { id, deleted_at: null },
        include: { purchase_return_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_returnsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_returns>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_returns.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_returns.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarDevolucionCompraParams,
  ): Promise<DevolucionCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_returns.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new DevolucionCompraNoEncontradaParaActualizarError(id);

      await tx.purchase_return_lines.updateMany({
        where: { return_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.purchase_returns.update({
        where: { id },
        data: {
          purchase_return_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: actual.company_id,
              branch_id: actual.branch_id,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_return_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async anular(context: UserContext, id: string): Promise<purchase_returns> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_returns.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new DevolucionCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_returns.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }

  async sumarCantidadDevuelta(
    context: UserContext,
    purchaseInvoiceId: string,
    productId: string,
    excludingReturnId?: string,
  ): Promise<number> {
    return withTenantScope(this.client, context, async (tx) => {
      const lineas = await tx.purchase_return_lines.findMany({
        where: {
          product_id: productId,
          deleted_at: null,
          ...(excludingReturnId ? { return_id: { not: excludingReturnId } } : {}),
          purchase_returns: { purchase_invoice_id: purchaseInvoiceId, deleted_at: null },
        },
        select: { quantity: true },
      });
      return lineas.reduce((acc, l) => acc + Number(l.quantity), 0);
    });
  }
}
