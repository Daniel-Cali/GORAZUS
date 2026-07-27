import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { DomainException } from '@gorazus/core-http';
import { ReglaContableRepository } from '../repositories/regla-contable.repository';
import type { LineaAsientoParams, AsientoConLineas } from '../repositories/asiento.repository';
import { AsientosService } from './asientos.service';

export class FormulaContableInvalidaException extends DomainException {
  constructor(eventCode: string, campo: string) {
    super(
      'FORMULA_CONTABLE_INVALIDA',
      `La regla contable de "${eventCode}" referencia el campo "${campo}", que no vino en el hecho contable del módulo de origen — revisar la configuración de la regla.`,
      500,
    );
  }
}

export class ReglaContableSinMovimientoException extends DomainException {
  constructor(eventCode: string) {
    super(
      'REGLA_CONTABLE_SIN_MOVIMIENTO',
      `La regla contable de "${eventCode}" no generó ninguna línea con monto — todos los campos referenciados vinieron en cero.`,
      500,
    );
  }
}

export interface HechoContable {
  eventCode: string;
  companyId: string;
  branchId?: string | null;
  sourceModule: string;
  sourceEntityId: string;
  postingDate?: Date;
  description?: string | null;
  /** Valores conocidos del documento de origen — `amount_formula` de cada línea de la regla es el NOMBRE de una clave acá, nunca una expresión evaluada. */
  hechos: Record<string, number>;
}

/**
 * Motor de reglas contables — traduce un "hecho contable" (evento de
 * negocio ya confirmado, ej. una factura) en un asiento balanceado,
 * según la `accounting_rules` activa para ese `event_code` y empresa.
 *
 * **Decisión de seguridad deliberada**: `amount_formula` (columna real
 * de `accounting_rule_lines`) se trata como el NOMBRE de un campo a
 * buscar en `hechos`, nunca como una expresión que se evalúa
 * (`eval`/`new Function`) — evaluar una fórmula arbitraria almacenada
 * en la base como código sería una vulnerabilidad de ejecución de
 * código real. Si el negocio necesita fórmulas compuestas (ej.
 * `subtotal_amount * 0.18`) a futuro, la vía segura es una whitelist de
 * operaciones conocidas, nunca un intérprete genérico.
 *
 * **No bloqueante por diseño**: si no hay una regla activa para el
 * `event_code` + empresa, `registrarEvento()` devuelve `null` sin
 * lanzar excepción — el módulo llamante (ej. `VentasService.confirmarFactura`)
 * sigue funcionando exactamente igual que antes de que existiera
 * `contabilidad`, cumple la regla obligatoria "nunca romper
 * compatibilidad con módulos existentes".
 */
@Injectable()
export class MotorContableService {
  constructor(
    private readonly reglaContableRepository: ReglaContableRepository,
    private readonly asientosService: AsientosService,
  ) {}

  async registrarEvento(
    context: UserContext,
    hecho: HechoContable,
  ): Promise<AsientoConLineas | null> {
    const regla = await this.reglaContableRepository.buscarPorEvento(
      context,
      hecho.eventCode,
      hecho.companyId,
    );
    if (!regla) return null;

    // Líneas con monto 0 se omiten (ej. impuesto en un producto exento) —
    // una línea de asiento en $0 no tiene sentido contable y el invariante
    // de partida doble (`Asiento`) las rechaza igual que a un lado vacío.
    const lines: LineaAsientoParams[] = regla.accounting_rule_lines
      .map((linea) => {
        const valor = hecho.hechos[linea.amount_formula];
        if (valor === undefined) {
          throw new FormulaContableInvalidaException(hecho.eventCode, linea.amount_formula);
        }
        return {
          accountId: linea.account_id,
          debitAmount: linea.entry_side === 'debit' ? valor : 0,
          creditAmount: linea.entry_side === 'credit' ? valor : 0,
        };
      })
      .filter((linea) => linea.debitAmount > 0 || linea.creditAmount > 0);

    if (lines.length < 2) throw new ReglaContableSinMovimientoException(hecho.eventCode);

    return this.asientosService.generarDesdeMotor(context, {
      companyId: hecho.companyId,
      branchId: hecho.branchId,
      sourceModule: hecho.sourceModule,
      sourceEntityId: hecho.sourceEntityId,
      postingDate: hecho.postingDate,
      description: hecho.description ?? `Generado automáticamente — ${hecho.eventCode}`,
      lines,
    });
  }
}
