import { BaseRepository } from '@gorazus/core-database';
import type { CashPrisma, CashPrismaClient, cash_register_openings } from '@gorazus/core-database';

/** Adaptador sobre `cash.cash_register_openings` (`POS_ARCHITECTURE.md §3`). */
export abstract class AperturaCajaRepository extends BaseRepository<
  CashPrisma.cash_register_openingsWhereUniqueInput,
  CashPrisma.cash_register_openingsWhereInput,
  CashPrisma.cash_register_openingsUncheckedCreateInput,
  CashPrisma.cash_register_openingsUncheckedUpdateInput,
  cash_register_openings,
  CashPrismaClient
> {}
