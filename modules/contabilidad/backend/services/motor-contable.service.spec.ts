import type { UserContext } from '@gorazus/contracts';
import {
  ReglaContableRepository,
  type ReglaConLineas,
} from '../repositories/regla-contable.repository';
import { AsientosService } from './asientos.service';
import {
  MotorContableService,
  FormulaContableInvalidaException,
  ReglaContableSinMovimientoException,
} from './motor-contable.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildRegla(): ReglaConLineas {
  return {
    id: 'regla-1',
    event_code: 'ventas.factura.confirmada',
    company_id: 'company-1',
    accounting_rule_lines: [
      {
        id: 'line-1',
        rule_id: 'regla-1',
        account_id: 'cuenta-cxc',
        entry_side: 'debit',
        amount_formula: 'total_amount',
      },
      {
        id: 'line-2',
        rule_id: 'regla-1',
        account_id: 'cuenta-ingresos',
        entry_side: 'credit',
        amount_formula: 'subtotal_amount',
      },
      {
        id: 'line-3',
        rule_id: 'regla-1',
        account_id: 'cuenta-itbis',
        entry_side: 'credit',
        amount_formula: 'tax_amount',
      },
    ],
  } as unknown as ReglaConLineas;
}

describe('MotorContableService', () => {
  let regla: ReglaConLineas | null;
  let reglaContableRepository: ReglaContableRepository;
  let asientosService: AsientosService;

  beforeEach(() => {
    regla = buildRegla();
    reglaContableRepository = {
      buscarPorEvento: jest.fn(async () => regla),
    } as unknown as ReglaContableRepository;
    asientosService = {
      generarDesdeMotor: jest.fn(async (_ctx: unknown, params: unknown) => ({
        id: 'asiento-1',
        journal_entry_lines: (params as { lines: unknown[] }).lines,
      })),
    } as unknown as AsientosService;
  });

  function buildMotor(): MotorContableService {
    return new MotorContableService(reglaContableRepository, asientosService);
  }

  it('devuelve null si no hay regla activa para el evento (no bloqueante)', async () => {
    regla = null;
    const motor = buildMotor();
    const resultado = await motor.registrarEvento(CONTEXT, {
      eventCode: 'ventas.factura.confirmada',
      companyId: 'company-1',
      sourceModule: 'ventas',
      sourceEntityId: 'f-1',
      hechos: { total_amount: 100 },
    });
    expect(resultado).toBeNull();
    expect(asientosService.generarDesdeMotor).not.toHaveBeenCalled();
  });

  it('genera el asiento balanceado a partir de los hechos', async () => {
    const motor = buildMotor();
    await motor.registrarEvento(CONTEXT, {
      eventCode: 'ventas.factura.confirmada',
      companyId: 'company-1',
      sourceModule: 'ventas',
      sourceEntityId: 'f-1',
      hechos: { total_amount: 118, subtotal_amount: 100, tax_amount: 18 },
    });
    expect(asientosService.generarDesdeMotor).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        lines: [
          { accountId: 'cuenta-cxc', debitAmount: 118, creditAmount: 0 },
          { accountId: 'cuenta-ingresos', debitAmount: 0, creditAmount: 100 },
          { accountId: 'cuenta-itbis', debitAmount: 0, creditAmount: 18 },
        ],
      }),
    );
  });

  it('omite líneas cuyo campo vino en cero (ej. producto exento de impuesto)', async () => {
    const motor = buildMotor();
    await motor.registrarEvento(CONTEXT, {
      eventCode: 'ventas.factura.confirmada',
      companyId: 'company-1',
      sourceModule: 'ventas',
      sourceEntityId: 'f-1',
      hechos: { total_amount: 100, subtotal_amount: 100, tax_amount: 0 },
    });
    const llamada = (asientosService.generarDesdeMotor as jest.Mock).mock.calls[0][1];
    expect(llamada.lines).toHaveLength(2);
    expect(
      llamada.lines.find((l: { accountId: string }) => l.accountId === 'cuenta-itbis'),
    ).toBeUndefined();
  });

  it('lanza FormulaContableInvalidaException si el hecho no trae el campo esperado', async () => {
    const motor = buildMotor();
    await expect(
      motor.registrarEvento(CONTEXT, {
        eventCode: 'ventas.factura.confirmada',
        companyId: 'company-1',
        sourceModule: 'ventas',
        sourceEntityId: 'f-1',
        hechos: { total_amount: 100 },
      }),
    ).rejects.toThrow(FormulaContableInvalidaException);
  });

  it('lanza ReglaContableSinMovimientoException si todas las líneas resultan en cero', async () => {
    regla = {
      id: 'regla-1',
      event_code: 'ventas.factura.confirmada',
      company_id: 'company-1',
      accounting_rule_lines: [
        {
          id: 'line-1',
          rule_id: 'regla-1',
          account_id: 'cuenta-cxc',
          entry_side: 'debit',
          amount_formula: 'total_amount',
        },
        {
          id: 'line-2',
          rule_id: 'regla-1',
          account_id: 'cuenta-ingresos',
          entry_side: 'credit',
          amount_formula: 'subtotal_amount',
        },
      ],
    } as unknown as ReglaConLineas;
    const motor = buildMotor();
    await expect(
      motor.registrarEvento(CONTEXT, {
        eventCode: 'ventas.factura.confirmada',
        companyId: 'company-1',
        sourceModule: 'ventas',
        sourceEntityId: 'f-1',
        hechos: { total_amount: 0, subtotal_amount: 0 },
      }),
    ).rejects.toThrow(ReglaContableSinMovimientoException);
  });
});
