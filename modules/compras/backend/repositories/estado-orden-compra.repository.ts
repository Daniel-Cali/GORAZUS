import { BaseRepository } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_order_status,
} from '@gorazus/core-database';

/** Adaptador sobre `purchases.purchase_order_status` (Compras FASE 4). */
export abstract class EstadoOrdenCompraRepository extends BaseRepository<
  PurchasesPrisma.purchase_order_statusWhereUniqueInput,
  PurchasesPrisma.purchase_order_statusWhereInput,
  PurchasesPrisma.purchase_order_statusUncheckedCreateInput,
  PurchasesPrisma.purchase_order_statusUncheckedUpdateInput,
  purchase_order_status,
  PurchasesPrismaClient
> {}
