import { BaseRepository } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_invoice_status,
} from '@gorazus/core-database';

/** Adaptador sobre `purchases.purchase_invoice_status` (Compras FASE 6). */
export abstract class EstadoFacturaCompraRepository extends BaseRepository<
  PurchasesPrisma.purchase_invoice_statusWhereUniqueInput,
  PurchasesPrisma.purchase_invoice_statusWhereInput,
  PurchasesPrisma.purchase_invoice_statusUncheckedCreateInput,
  PurchasesPrisma.purchase_invoice_statusUncheckedUpdateInput,
  purchase_invoice_status,
  PurchasesPrismaClient
> {}
