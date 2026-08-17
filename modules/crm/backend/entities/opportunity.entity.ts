/**
 * Entidad de dominio pura — mismo criterio que `Lead`/`Factura`.
 * `crm.opportunities` acepta dos orígenes válidos (`leadId`/`customerId`,
 * ambos nullable en schema) — la entidad exige al menos uno, ver
 * `docs/architecture/27-modulo-crm.md §2`.
 */
export class Opportunity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly funnelStageId: string,
    public readonly leadId: string | null,
    public readonly customerId: string | null,
    public readonly lines: OpportunityLineInput[],
    public readonly status: 'open' | 'won' | 'lost' = 'open',
  ) {
    if (!leadId && !customerId) {
      throw new Error('La oportunidad debe originarse en un lead o en un cliente existente');
    }
    if (funnelStageId.trim().length === 0) {
      throw new Error('La oportunidad debe tener una etapa de embudo asignada');
    }
    for (const line of lines) {
      if (line.estimatedQuantity <= 0) {
        throw new Error('La cantidad estimada de cada línea debe ser mayor a cero');
      }
    }
  }
}

export interface OpportunityLineInput {
  productId: string;
  estimatedQuantity: number;
}
