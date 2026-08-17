import { BaseRepository } from '@gorazus/core-database';
import type {
  PurchasesPrisma,
  PurchasesPrismaClient,
  purchase_requisition_status,
} from '@gorazus/core-database';

/** Adaptador sobre `purchases.purchase_requisition_status` (Compras FASE 3). */
export abstract class EstadoSolicitudCompraRepository extends BaseRepository<
  PurchasesPrisma.purchase_requisition_statusWhereUniqueInput,
  PurchasesPrisma.purchase_requisition_statusWhereInput,
  PurchasesPrisma.purchase_requisition_statusUncheckedCreateInput,
  PurchasesPrisma.purchase_requisition_statusUncheckedUpdateInput,
  purchase_requisition_status,
  PurchasesPrismaClient
> {}
