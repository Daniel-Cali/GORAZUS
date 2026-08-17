import type { UserContext } from '@gorazus/contracts';

/** Catálogo `crm.lead_sources` — sembrado por SQL, solo lectura desde la aplicación. */
export abstract class LeadSourceRepository {
  abstract existe(context: UserContext, sourceId: string): Promise<boolean>;
}
