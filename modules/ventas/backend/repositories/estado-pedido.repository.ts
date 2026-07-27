import { BaseRepository } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, sales_order_status } from '@gorazus/core-database';

/** Adaptador sobre `sales.sales_order_status` (Módulo de Ventas Enterprise, Parte 1). */
export abstract class EstadoPedidoRepository extends BaseRepository<
  SalesPrisma.sales_order_statusWhereUniqueInput,
  SalesPrisma.sales_order_statusWhereInput,
  SalesPrisma.sales_order_statusUncheckedCreateInput,
  SalesPrisma.sales_order_statusUncheckedUpdateInput,
  sales_order_status,
  SalesPrismaClient
> {}
