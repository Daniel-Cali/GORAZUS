import type { SalesPrisma, sales_orders, sales_order_lines } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaPedidoParams {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
}

export interface CrearPedidoParams {
  companyId: string;
  branchId: string;
  customerId: string;
  quoteId?: string | null;
  salespersonId?: string | null;
  statusId: string;
  salesChannel: string;
  currencyCode: string;
  documentNumber: string;
  totalAmount: number;
  lines: LineaPedidoParams[];
}

export type PedidoConLineas = sales_orders & { sales_order_lines: sales_order_lines[] };

export type OrdenPedido = 'created_at' | 'total_amount' | 'document_number';

/**
 * `sales.sales_orders`/`sales_order_lines` — no está particionada y
 * `sales_order_lines` sí tiene relación real de Prisma hacia
 * `sales_orders`, mismo criterio que `CotizacionRepository`.
 */
export abstract class PedidoRepository {
  abstract crear(context: UserContext, params: CrearPedidoParams): Promise<PedidoConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<PedidoConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: SalesPrisma.sales_ordersWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenPedido; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<sales_orders>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<sales_orders>;

  /** Suma `cantidad` a `invoiced_quantity` de cada línea — usado al convertir (total o parcialmente) un pedido en factura. */
  abstract registrarFacturacionDeLineas(
    context: UserContext,
    incrementos: Array<{ salesOrderLineId: string; cantidad: number }>,
  ): Promise<void>;
}
