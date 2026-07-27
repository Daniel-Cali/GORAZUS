import { BaseRepository } from '@gorazus/core-database';
import type { SalesPrisma, SalesPrismaClient, quote_status } from '@gorazus/core-database';

/** Adaptador sobre `sales.quote_status` (Módulo de Ventas Enterprise, Parte 1). */
export abstract class EstadoCotizacionRepository extends BaseRepository<
  SalesPrisma.quote_statusWhereUniqueInput,
  SalesPrisma.quote_statusWhereInput,
  SalesPrisma.quote_statusUncheckedCreateInput,
  SalesPrisma.quote_statusUncheckedUpdateInput,
  quote_status,
  SalesPrismaClient
> {}
