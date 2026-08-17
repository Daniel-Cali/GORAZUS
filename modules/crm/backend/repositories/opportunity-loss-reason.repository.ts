import type { UserContext } from '@gorazus/contracts';

/** Catálogo `crm.opportunity_loss_reasons` — sembrado por SQL, solo lectura desde la aplicación. */
export abstract class OpportunityLossReasonRepository {
  abstract existe(context: UserContext, lossReasonId: string): Promise<boolean>;
}
