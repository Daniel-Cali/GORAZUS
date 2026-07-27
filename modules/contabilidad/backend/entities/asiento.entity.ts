export interface LineaAsientoInput {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
}

/** Tolerancia de redondeo — los montos se persisten `Decimal(18,4)`. */
const TOLERANCIA_BALANCE = 0.0001;

/**
 * Entidad de dominio pura sobre `accounting.journal_entries`/
 * `journal_entry_lines` — invariantes reales de partida doble: al
 * menos 2 líneas, cada línea afecta un solo lado (débito XOR crédito),
 * y el asiento debe estar balanceado (Σdébitos = Σcréditos). Ningún
 * asiento se persiste sin pasar por este constructor primero, sea
 * manual (`AsientosService.crear`) o generado por el motor de reglas
 * (`MotorContableService`).
 */
export class Asiento {
  constructor(public readonly lines: LineaAsientoInput[]) {
    if (lines.length < 2) {
      throw new Error('Un asiento contable debe tener al menos 2 líneas (partida doble)');
    }
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      const debit = line.debitAmount;
      const credit = line.creditAmount;
      if (debit < 0 || credit < 0) {
        throw new Error('Los montos de débito y crédito no pueden ser negativos');
      }
      const ladosConMonto = Number(debit > 0) + Number(credit > 0);
      if (ladosConMonto !== 1) {
        throw new Error(
          'Cada línea debe afectar exactamente un lado (débito o crédito), nunca ambos ni ninguno',
        );
      }
      totalDebit += debit;
      totalCredit += credit;
    }
    if (Math.abs(totalDebit - totalCredit) > TOLERANCIA_BALANCE) {
      throw new Error(
        `El asiento no está balanceado: débitos ${totalDebit.toFixed(4)} ≠ créditos ${totalCredit.toFixed(4)}`,
      );
    }
  }
}
