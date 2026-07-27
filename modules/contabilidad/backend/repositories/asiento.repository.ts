import type {
  AccountingPrisma,
  journal_entries,
  journal_entry_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface LineaAsientoParams {
  accountId: string;
  costCenterId?: string | null;
  profitCenterId?: string | null;
  debitAmount: number;
  creditAmount: number;
}

export interface CrearAsientoParams {
  companyId: string;
  branchId?: string | null;
  fiscalPeriodId: string;
  statusId: string;
  documentNumber: string;
  sourceModule?: string | null;
  sourceEntityId?: string | null;
  postingDate?: Date;
  description?: string | null;
  lines: LineaAsientoParams[];
}

export type AsientoConLineas = journal_entries & { journal_entry_lines: journal_entry_lines[] };

export type OrdenAsiento = 'posting_date' | 'document_number';

/**
 * `accounting.journal_entries` — particionada por `posting_date`
 * (mismo motivo que `sales.invoices`/`issued_at`): el cliente Prisma
 * generado solo expone la clave única compuesta `(id, posting_date)`,
 * nunca `id` a secas. Encabezado + líneas se crean en la misma
 * transacción, dos escrituras separadas (`journal_entry_lines` no
 * tiene relación real de Prisma hacia `journal_entries`, mismo motivo
 * que `invoice_lines`/`invoices`).
 */
export abstract class AsientoRepository {
  abstract crear(context: UserContext, params: CrearAsientoParams): Promise<AsientoConLineas>;

  abstract obtener(context: UserContext, id: string): Promise<AsientoConLineas | null>;

  abstract listar(
    context: UserContext,
    filter: AccountingPrisma.journal_entriesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenAsiento; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<journal_entries>>;

  abstract actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<journal_entries>;

  /**
   * Líneas de una cuenta en un rango de fechas (Libro Mayor) — join
   * manual en dos pasos, mismo motivo que `listar()`.
   * `soloContabilizados` incluye `posted` Y `reversed` (nunca solo
   * `posted`) — un asiento revertido sigue siendo historia real del
   * libro, la reversión es un asiento nuevo que lo cancela, no un
   * borrado del original.
   */
  abstract listarLineasPorCuenta(
    context: UserContext,
    params: {
      accountId: string;
      companyId: string;
      branchId?: string;
      desde?: Date;
      hasta?: Date;
      soloContabilizados: boolean;
    },
  ): Promise<Array<journal_entry_lines & { posting_date: Date; document_number: string }>>;
}
