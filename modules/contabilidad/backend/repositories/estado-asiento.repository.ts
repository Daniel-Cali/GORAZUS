import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  journal_entry_status,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.journal_entry_status` — catálogo (borrador/pendiente/contabilizado/anulado/revertido). */
export abstract class EstadoAsientoRepository extends BaseRepository<
  AccountingPrisma.journal_entry_statusWhereUniqueInput,
  AccountingPrisma.journal_entry_statusWhereInput,
  AccountingPrisma.journal_entry_statusUncheckedCreateInput,
  AccountingPrisma.journal_entry_statusUncheckedUpdateInput,
  journal_entry_status,
  AccountingPrismaClient
> {}
