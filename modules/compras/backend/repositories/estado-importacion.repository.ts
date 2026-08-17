import { BaseRepository } from '@gorazus/core-database';
import type { PurchasesPrisma, PurchasesPrismaClient, import_status } from '@gorazus/core-database';

/**
 * Adaptador sobre `purchases.import_status` (Compras FASE 11). A
 * diferencia de `EstadoSolicitudCompraRepository`/
 * `EstadoOrdenCompraRepository`/`EstadoFacturaCompraRepository`, este
 * catálogo **no tiene columna `is_final`** — verificado en
 * `schema.prisma`, no asumido por simetría con los demás.
 */
export abstract class EstadoImportacionRepository extends BaseRepository<
  PurchasesPrisma.import_statusWhereUniqueInput,
  PurchasesPrisma.import_statusWhereInput,
  PurchasesPrisma.import_statusUncheckedCreateInput,
  PurchasesPrisma.import_statusUncheckedUpdateInput,
  import_status,
  PurchasesPrismaClient
> {}
