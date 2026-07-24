import { BaseRepository } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, invoice_status } from '@gorazus/core-database';

/** Adaptador sobre `sales.invoice_status` (`POS_ARCHITECTURE.md §3`). */
export abstract class EstadoFacturaRepository extends BaseRepository<
  SalesPrisma.invoice_statusWhereUniqueInput,
  SalesPrisma.invoice_statusWhereInput,
  SalesPrisma.invoice_statusUncheckedCreateInput,
  SalesPrisma.invoice_statusUncheckedUpdateInput,
  invoice_status,
  SalesPrismaClient
> {}
