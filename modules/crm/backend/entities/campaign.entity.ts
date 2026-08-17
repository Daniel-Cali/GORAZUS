/**
 * Entidad de dominio pura — mismo criterio que `Lead`/`Opportunity`.
 * `crm.campaign_members` vincula una campaña con **leads únicamente**
 * (`lead_id NOT NULL`, sin columna `customer_id`) — límite de alcance
 * real, no un descuido, ver `docs/architecture/27-modulo-crm.md §3`.
 */
export class Campaign {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly name: string,
    public readonly startsOn: Date | null = null,
    public readonly endsOn: Date | null = null,
    public readonly budgetAmount: number | null = null,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre de la campaña no puede estar vacío');
    }
    if (budgetAmount !== null && budgetAmount < 0) {
      throw new Error('El presupuesto de la campaña no puede ser negativo');
    }
    if (startsOn && endsOn && endsOn < startsOn) {
      throw new Error('La fecha de fin de la campaña no puede ser anterior a la de inicio');
    }
  }
}
