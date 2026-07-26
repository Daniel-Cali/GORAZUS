import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES, withTenantScope } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, invoices } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  FacturaRepository,
  type CrearFacturaParams,
  type ActualizarFacturaParams,
  type FacturaConLineas,
  type OrdenFactura,
} from './factura.repository';

export class FacturaNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class FacturaRepositoryPrisma extends FacturaRepository {
  constructor(@Inject(PRISMA_SALES) private readonly client: SalesPrismaClient) {
    super();
  }

  /**
   * `invoices` está particionada por `issued_at`
   * (`docs/database/sql/07_sales.sql`) — Postgres no permite una FK
   * normal de `invoice_lines.invoice_id` hacia una tabla particionada
   * sin incluir la columna de partición, así que el SQL certificado deja
   * esa referencia como un UUID suelto, sin `REFERENCES`. Prisma
   * entonces no genera relación entre ambos modelos: encabezado y
   * líneas se crean como dos escrituras separadas dentro de la MISMA
   * transacción (a diferencia de `AjusteStockRepository`, que sí puede
   * usar `create: { lines: { create: [...] } }` porque esa tabla no está
   * particionada).
   */
  async crear(context: UserContext, params: CrearFacturaParams): Promise<FacturaConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const factura = await tx.invoices.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          customer_id: params.customerId,
          status_id: params.statusId,
          sales_channel: params.salesChannel,
          currency_code: params.currencyCode,
          document_number: params.documentNumber,
          subtotal_amount: params.subtotalAmount,
          tax_amount: params.taxAmount,
          total_amount: params.totalAmount,
          general_discount_percentage: params.generalDiscountPercentage,
        },
      });
      await tx.invoice_lines.createMany({
        data: params.lines.map((line) => ({
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          invoice_id: factura.id,
          product_id: line.productId,
          tax_id: line.taxId,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          discount_percentage: line.discountPercentage,
          line_total: line.lineTotal,
        })),
      });
      const invoice_lines = await tx.invoice_lines.findMany({
        where: { invoice_id: factura.id, deleted_at: null },
      });
      return { ...factura, invoice_lines };
    });
  }

  async obtener(context: UserContext, id: string): Promise<FacturaConLineas | null> {
    return withTenantScope(this.client, context, async (tx) => {
      const factura = await tx.invoices.findFirst({ where: { id, deleted_at: null } });
      if (!factura) return null;
      const invoice_lines = await tx.invoice_lines.findMany({
        where: { invoice_id: id, deleted_at: null },
      });
      return { ...factura, invoice_lines };
    });
  }

  async listar(
    context: UserContext,
    filter: SalesPrisma.invoicesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenFactura; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<invoices>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.invoices.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: orden ? { [orden.campo]: orden.direccion } : { issued_at: 'desc' },
        }),
        tx.invoices.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(context: UserContext, id: string, statusId: string): Promise<invoices> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaNoEncontradaParaActualizarError(id);
      return tx.invoices.update({
        where: { id_issued_at: { id, issued_at: actual.issued_at } },
        data: { status_id: statusId },
      });
    });
  }

  /** Reemplaza las líneas (delete + insert, misma transacción) — mismo motivo de encabezado+líneas por separado que `crear()` (tabla particionada, sin relación real entre `invoices`/`invoice_lines`). */
  async actualizar(
    context: UserContext,
    id: string,
    params: ActualizarFacturaParams,
  ): Promise<FacturaConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaNoEncontradaParaActualizarError(id);

      const factura = await tx.invoices.update({
        where: { id_issued_at: { id, issued_at: actual.issued_at } },
        data: {
          subtotal_amount: params.subtotalAmount,
          tax_amount: params.taxAmount,
          total_amount: params.totalAmount,
          general_discount_percentage: params.generalDiscountPercentage,
        },
      });

      await tx.invoice_lines.updateMany({
        where: { invoice_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      await tx.invoice_lines.createMany({
        data: params.lines.map((line) => ({
          tenant_id: context.tenantId,
          company_id: factura.company_id,
          branch_id: factura.branch_id,
          invoice_id: id,
          product_id: line.productId,
          tax_id: line.taxId,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          discount_percentage: line.discountPercentage,
          line_total: line.lineTotal,
        })),
      });
      const invoice_lines = await tx.invoice_lines.findMany({
        where: { invoice_id: id, deleted_at: null },
      });
      return { ...factura, invoice_lines };
    });
  }

  async eliminar(context: UserContext, id: string): Promise<invoices> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.invoices.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new FacturaNoEncontradaParaActualizarError(id);
      return tx.invoices.update({
        where: { id_issued_at: { id, issued_at: actual.issued_at } },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
