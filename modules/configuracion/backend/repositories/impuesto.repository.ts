import { BaseRepository } from '@gorazus/core-database';
import type { TaxesPrisma, TaxesPrismaClient, taxes } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

/** Adaptador sobre `taxes.taxes` (perfil de impuesto) — docs/architecture/14-modulo-core.md. */
export abstract class ImpuestoRepository extends BaseRepository<
  TaxesPrisma.taxesWhereUniqueInput,
  TaxesPrisma.taxesWhereInput,
  TaxesPrisma.taxesUncheckedCreateInput,
  TaxesPrisma.taxesUncheckedUpdateInput,
  taxes,
  TaxesPrismaClient
> {
  abstract findByCode(
    context: Pick<UserContext, 'tenantId' | 'companyId'>,
    code: string,
  ): Promise<taxes | null>;
}
