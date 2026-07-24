import { BaseRepository } from '@gorazus/core-database';
import type { CashPrisma, CashPrismaClient, cash_register_closings } from '@gorazus/core-database';

/** Adaptador sobre `cash.cash_register_closings` (`POS_ARCHITECTURE.md §3`). */
export abstract class CierreCajaRepository extends BaseRepository<
  CashPrisma.cash_register_closingsWhereUniqueInput,
  CashPrisma.cash_register_closingsWhereInput,
  CashPrisma.cash_register_closingsUncheckedCreateInput,
  CashPrisma.cash_register_closingsUncheckedUpdateInput,
  cash_register_closings,
  CashPrismaClient
> {}
