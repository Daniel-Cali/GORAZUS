import { BaseRepository } from '@gorazus/core-database';
import type { TaxesPrisma, TaxesPrismaClient, tax_jurisdictions } from '@gorazus/core-database';

/**
 * Adaptador sobre `taxes.tax_jurisdictions` — solo lectura desde este
 * módulo (usado por `ImpuestosService` para validar `jurisdictionId` antes
 * de crear un impuesto). El catálogo de países/jurisdicciones fiscales es
 * prerequisito de datos, no un caso de uso de este módulo — se siembra vía
 * `scripts/seed-tax-jurisdictions.ts` (mismo patrón que `seed-rbac.ts`),
 * no hay controlador que lo exponga (alcance mínimo, docs/architecture/14-modulo-core.md).
 */
export abstract class JurisdiccionRepository extends BaseRepository<
  TaxesPrisma.tax_jurisdictionsWhereUniqueInput,
  TaxesPrisma.tax_jurisdictionsWhereInput,
  TaxesPrisma.tax_jurisdictionsUncheckedCreateInput,
  TaxesPrisma.tax_jurisdictionsUncheckedUpdateInput,
  tax_jurisdictions,
  TaxesPrismaClient
> {}
