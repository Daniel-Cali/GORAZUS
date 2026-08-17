import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_requisitions,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  SolicitudCompraRepository,
  type CrearSolicitudCompraParams,
  type ActualizarSolicitudCompraParams,
  type SolicitudCompraConLineas,
} from './solicitud-compra.repository';

export class SolicitudCompraNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class SolicitudCompraRepositoryPrisma extends SolicitudCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  async crear(
    context: UserContext,
    params: CrearSolicitudCompraParams,
  ): Promise<SolicitudCompraConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_requisitions.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          requested_by_user_id: params.requestedByUserId,
          status_id: params.statusId,
          document_number: params.documentNumber,
          purchase_requisition_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_requisition_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<SolicitudCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.purchase_requisitions.findFirst({
        where: { id, deleted_at: null },
        include: { purchase_requisition_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.purchase_requisitionsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<purchase_requisitions>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.purchase_requisitions.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.purchase_requisitions.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<purchase_requisitions> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_requisitions.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new SolicitudCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_requisitions.update({ where: { id }, data: { status_id: statusId } });
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarSolicitudCompraParams,
  ): Promise<SolicitudCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_requisitions.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new SolicitudCompraNoEncontradaParaActualizarError(id);

      await tx.purchase_requisition_lines.updateMany({
        where: { requisition_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.purchase_requisitions.update({
        where: { id },
        data: {
          purchase_requisition_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: actual.company_id,
              branch_id: actual.branch_id,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { purchase_requisition_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async eliminar(context: UserContext, id: string): Promise<purchase_requisitions> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.purchase_requisitions.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new SolicitudCompraNoEncontradaParaActualizarError(id);
      return tx.purchase_requisitions.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
