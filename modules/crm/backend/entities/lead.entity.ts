/**
 * Entidad de dominio pura (docs/architecture/02 §3) — mismo criterio que
 * `Cliente`/`Factura`. `crm.leads` consolida Lead/Prospecto/Cliente
 * Potencial en una sola tabla (`docs/architecture/27-modulo-crm.md §1`);
 * `statusId` es la etapa actual, no un concepto separado.
 */
export class Lead {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly fullName: string,
    public readonly statusId: string,
    public readonly email: string | null = null,
    public readonly phone: string | null = null,
    public readonly sourceId: string | null = null,
    public readonly convertedCustomerId: string | null = null,
  ) {
    if (fullName.trim().length === 0) {
      throw new Error('El nombre del lead no puede estar vacío');
    }
    if (statusId.trim().length === 0) {
      throw new Error('El lead debe tener un estado asignado');
    }
    if (!email && !phone) {
      throw new Error('El lead debe tener al menos un email o un teléfono de contacto');
    }
  }
}

/**
 * Códigos de catálogo esperados en `crm.lead_status` (sembrados por SQL,
 * nunca creados por la aplicación — ver `CRM_ARCHITECTURE.md §3`).
 */
export const LEAD_STATUS_CODES = {
  NUEVO: 'nuevo',
  CONTACTADO: 'contactado',
  CALIFICADO: 'calificado',
  CONVERTIDO: 'convertido',
  DESCARTADO: 'descartado',
} as const;
