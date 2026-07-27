import { BaseRepository } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  account_types,
} from '@gorazus/core-database';

/** Adaptador sobre `accounting.account_types` — catálogo (Activos/Pasivos/Patrimonio/Ingresos/Costos/Gastos/OtrosIngresos/OtrosGastos), `normal_balance` = `debit`|`credit`. */
export abstract class TipoCuentaRepository extends BaseRepository<
  AccountingPrisma.account_typesWhereUniqueInput,
  AccountingPrisma.account_typesWhereInput,
  AccountingPrisma.account_typesUncheckedCreateInput,
  AccountingPrisma.account_typesUncheckedUpdateInput,
  account_types,
  AccountingPrismaClient
> {}
