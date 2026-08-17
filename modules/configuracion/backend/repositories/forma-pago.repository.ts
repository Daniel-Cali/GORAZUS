import { BaseRepository } from '@gorazus/core-database';
import type {
  ConfigurationPrisma,
  ConfigurationPrismaClient,
  payment_forms,
} from '@gorazus/core-database';

/** Adaptador sobre `configuration.payment_forms` — ya sembrado (`22_seed_data.sql`: cash/check/transfer/card/credit), nunca antes consumido por ningún módulo (Prompt 3C, auditoría real). */
export abstract class FormaPagoRepository extends BaseRepository<
  ConfigurationPrisma.payment_formsWhereUniqueInput,
  ConfigurationPrisma.payment_formsWhereInput,
  ConfigurationPrisma.payment_formsUncheckedCreateInput,
  ConfigurationPrisma.payment_formsUncheckedUpdateInput,
  payment_forms,
  ConfigurationPrismaClient
> {}
