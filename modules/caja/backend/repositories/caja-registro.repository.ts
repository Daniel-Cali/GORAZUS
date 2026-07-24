import { BaseRepository } from '@gorazus/core-database';
import type { CashPrisma, CashPrismaClient, cash_registers } from '@gorazus/core-database';

/** Adaptador sobre `cash.cash_registers` (`POS_ARCHITECTURE.md §3`). */
export abstract class CajaRegistroRepository extends BaseRepository<
  CashPrisma.cash_registersWhereUniqueInput,
  CashPrisma.cash_registersWhereInput,
  CashPrisma.cash_registersUncheckedCreateInput,
  CashPrisma.cash_registersUncheckedUpdateInput,
  cash_registers,
  CashPrismaClient
> {}
