import { BaseRepository } from '@gorazus/core-database';
import type { CashPrisma, CashPrismaClient, cash_movement_types } from '@gorazus/core-database';

/** Adaptador sobre `cash.cash_movement_types` (`POS_ARCHITECTURE.md §3`). */
export abstract class TipoMovimientoCajaRepository extends BaseRepository<
  CashPrisma.cash_movement_typesWhereUniqueInput,
  CashPrisma.cash_movement_typesWhereInput,
  CashPrisma.cash_movement_typesUncheckedCreateInput,
  CashPrisma.cash_movement_typesUncheckedUpdateInput,
  cash_movement_types,
  CashPrismaClient
> {}
