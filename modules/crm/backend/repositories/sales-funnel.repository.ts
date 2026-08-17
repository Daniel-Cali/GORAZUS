import type { UserContext } from '@gorazus/contracts';

/** Catálogo `crm.sales_funnels`/`sales_funnel_stages` — sembrado por SQL, solo lectura desde la aplicación. */
export abstract class SalesFunnelRepository {
  abstract existeEtapa(context: UserContext, funnelStageId: string): Promise<boolean>;
}
