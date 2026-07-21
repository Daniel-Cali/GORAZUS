/** Tipos de impuesto soportados (`taxes.taxes.tax_kind`, CHECK de base de datos — docs/database/sql/12_taxes.sql). */
export const TIPOS_IMPUESTO = ['sales_tax', 'income_tax', 'other'] as const;
export type TipoImpuesto = (typeof TIPOS_IMPUESTO)[number];

/**
 * Entidad de dominio pura (docs/architecture/02 §3). Perfil de impuesto
 * (`taxes.taxes`) — alcance mínimo de Fase 02: catálogo + tasas
 * (`TasaImpuesto`), sin motor de reglas/cálculo (`tax_rules`,
 * `tax_perceptions`, retenciones — Fase 16, sin documento propio todavía).
 */
export class Impuesto {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly jurisdictionId: string,
    public readonly taxKind: string,
  ) {
    if (code.trim().length === 0) {
      throw new Error('El código del impuesto no puede estar vacío');
    }
    if (!TIPOS_IMPUESTO.includes(taxKind as TipoImpuesto)) {
      throw new Error(
        `El tipo de impuesto "${taxKind}" no es válido — debe ser uno de: ${TIPOS_IMPUESTO.join(', ')}`,
      );
    }
  }
}
