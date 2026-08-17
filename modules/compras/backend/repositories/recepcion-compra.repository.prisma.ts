import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_PURCHASES, withTenantScope } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  goods_receipt_notes,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  RecepcionCompraRepository,
  type CrearRecepcionCompraParams,
  type ActualizarRecepcionCompraParams,
  type RecepcionCompraConLineas,
} from './recepcion-compra.repository';

export class RecepcionCompraNoEncontradaParaActualizarError extends Error {}

/** `true` si el error es una violación de unicidad de Prisma (P2002) — mismo chequeo ya duplicado en el resto de servicios de Compras (ISSUE-28/29), replicado aquí por consistencia con el patrón existente del módulo. */
function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

@Injectable()
export class RecepcionCompraRepositoryPrisma extends RecepcionCompraRepository {
  constructor(@Inject(PRISMA_PURCHASES) private readonly client: PurchasesPrismaClient) {
    super();
  }

  /**
   * ISSUE-07: si `params.idempotencyKey` está presente, el `INSERT` está
   * respaldado por `uq_purchases_goods_receipt_notes_idempotency_key`
   * (`44_idempotency_key_goods_receipt_notes.sql`, único parcial por
   * `(tenant_id, idempotency_key)`). Dos solicitudes concurrentes con la
   * misma clave: una gana el `INSERT`, la otra recibe `P2002` — en vez de
   * propagar el error, se relee y se devuelve la fila ganadora, nunca un
   * segundo registro. El caller (`RecepcionesCompraService`) ya intenta un
   * lookup previo por `obtenerPorIdempotencyKey` para el caso secuencial
   * (evitar correr validaciones de negocio dos veces); este catch cubre la
   * ventana de carrera real que ese lookup previo, por sí solo, no cierra.
   */
  async crear(
    context: UserContext,
    params: CrearRecepcionCompraParams,
  ): Promise<RecepcionCompraConLineas> {
    try {
      return await withTenantScope(this.client, context, (tx) =>
        tx.goods_receipt_notes.create({
          data: {
            tenant_id: context.tenantId,
            company_id: params.companyId,
            branch_id: params.branchId,
            purchase_order_id: params.purchaseOrderId,
            idempotency_key: params.idempotencyKey,
            goods_receipt_note_lines: {
              create: params.lines.map((line) => ({
                tenant_id: context.tenantId,
                company_id: params.companyId,
                branch_id: params.branchId,
                product_id: line.productId,
                quantity: line.quantity,
              })),
            },
          },
          include: { goods_receipt_note_lines: { where: { deleted_at: null } } },
        }),
      );
    } catch (error) {
      if (params.idempotencyKey && esViolacionDeUnicidad(error)) {
        const existente = await this.obtenerPorIdempotencyKey(context, params.idempotencyKey);
        if (existente) return existente;
      }
      throw error;
    }
  }

  async obtenerPorIdempotencyKey(
    context: UserContext,
    idempotencyKey: string,
  ): Promise<RecepcionCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_receipt_notes.findFirst({
        where: { idempotency_key: idempotencyKey, deleted_at: null },
        include: { goods_receipt_note_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<RecepcionCompraConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.goods_receipt_notes.findFirst({
        where: { id, deleted_at: null },
        include: { goods_receipt_note_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: PurchasesPrisma.goods_receipt_notesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<goods_receipt_notes>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.goods_receipt_notes.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.goods_receipt_notes.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarRecepcionCompraParams,
  ): Promise<RecepcionCompraConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.goods_receipt_notes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new RecepcionCompraNoEncontradaParaActualizarError(id);

      await tx.goods_receipt_note_lines.updateMany({
        where: { receipt_note_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.goods_receipt_notes.update({
        where: { id },
        data: {
          goods_receipt_note_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: actual.company_id,
              branch_id: actual.branch_id,
              product_id: line.productId,
              quantity: line.quantity,
            })),
          },
        },
        include: { goods_receipt_note_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async anular(context: UserContext, id: string): Promise<goods_receipt_notes> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.goods_receipt_notes.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new RecepcionCompraNoEncontradaParaActualizarError(id);
      return tx.goods_receipt_notes.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }

  async sumarCantidadRecibida(
    context: UserContext,
    purchaseOrderId: string,
    productId: string,
    excludingReceiptId?: string,
  ): Promise<number> {
    return withTenantScope(this.client, context, async (tx) => {
      const lineas = await tx.goods_receipt_note_lines.findMany({
        where: {
          product_id: productId,
          deleted_at: null,
          ...(excludingReceiptId ? { receipt_note_id: { not: excludingReceiptId } } : {}),
          goods_receipt_notes: { purchase_order_id: purchaseOrderId, deleted_at: null },
        },
        select: { quantity: true },
      });
      return lineas.reduce((acc, l) => acc + Number(l.quantity), 0);
    });
  }
}
