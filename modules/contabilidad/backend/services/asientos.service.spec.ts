import type { UserContext } from '@gorazus/contracts';
import type { journal_entry_status } from '@gorazus/core-database';
import { AsientoRepository, type AsientoConLineas } from '../repositories/asiento.repository';
import { EstadoAsientoRepository } from '../repositories/estado-asiento.repository';
import { CuentaContableRepository } from '../repositories/cuenta-contable.repository';
import { PeriodosFiscalesService } from './periodos-fiscales.service';
import {
  AsientosService,
  AsientoNoContabilizableException,
  AsientoNoAnulableException,
  AsientoNoRevertibleException,
  AsientoInvalidoException,
} from './asientos.service';
import type { CrearAsientoInput } from '../validators/asientos.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildAsiento(overrides: Partial<AsientoConLineas> = {}): AsientoConLineas {
  return {
    id: 'ast-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    status_id: 'st-draft',
    document_number: 'AST-1',
    journal_entry_lines: [
      {
        id: 'l-1',
        account_id: 'cta-1',
        cost_center_id: null,
        profit_center_id: null,
        debit_amount: 100,
        credit_amount: 0,
      },
      {
        id: 'l-2',
        account_id: 'cta-2',
        cost_center_id: null,
        profit_center_id: null,
        debit_amount: 0,
        credit_amount: 100,
      },
    ],
    ...overrides,
  } as unknown as AsientoConLineas;
}

describe('AsientosService', () => {
  let asiento: AsientoConLineas;
  let estadosExistentes: journal_entry_status[];
  let asientoRepository: AsientoRepository;
  let estadoAsientoRepository: EstadoAsientoRepository;
  let cuentaContableRepository: CuentaContableRepository;
  let periodosFiscalesService: PeriodosFiscalesService;

  beforeEach(() => {
    asiento = buildAsiento();
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as journal_entry_status,
      { id: 'st-posted', code: 'posted' } as journal_entry_status,
      { id: 'st-cancelled', code: 'cancelled' } as journal_entry_status,
      { id: 'st-reversed', code: 'reversed' } as journal_entry_status,
    ];

    asientoRepository = {
      crear: jest.fn(async () => asiento),
      obtener: jest.fn(async () => asiento),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        asiento = { ...asiento, status_id: statusId };
        return asiento;
      }),
      listarLineasPorCuenta: jest.fn(async () => []),
    } as unknown as AsientoRepository;

    estadoAsientoRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, ...data } as journal_entry_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoAsientoRepository;

    cuentaContableRepository = {
      findById: jest.fn(async () => ({ id: 'cta-1' })),
    } as unknown as CuentaContableRepository;

    periodosFiscalesService = {
      resolverPeriodoPorFecha: jest.fn(async () => ({ id: 'periodo-1' })),
    } as unknown as PeriodosFiscalesService;
  });

  function buildService(): AsientosService {
    return new AsientosService(
      asientoRepository,
      estadoAsientoRepository,
      cuentaContableRepository,
      periodosFiscalesService,
    );
  }

  function baseInput(overrides: Partial<CrearAsientoInput> = {}): CrearAsientoInput {
    return {
      companyId: 'company-1',
      branchId: 'branch-1',
      lines: [
        { accountId: 'cta-1', debitAmount: 100, creditAmount: 0 },
        { accountId: 'cta-2', debitAmount: 0, creditAmount: 100 },
      ],
      ...overrides,
    };
  }

  it('crear: arranca en draft', async () => {
    const service = buildService();
    await service.crear(CONTEXT, baseInput());
    expect(asientoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ statusId: 'st-draft' }),
    );
  });

  it('crear: rechaza un asiento desbalanceado antes de tocar la base', async () => {
    const service = buildService();
    await expect(
      service.crear(
        CONTEXT,
        baseInput({
          lines: [
            { accountId: 'cta-1', debitAmount: 100, creditAmount: 0 },
            { accountId: 'cta-2', debitAmount: 0, creditAmount: 50 },
          ],
        }),
      ),
    ).rejects.toThrow(AsientoInvalidoException);
    expect(asientoRepository.crear).not.toHaveBeenCalled();
  });

  it('crear: rechaza una cuenta inexistente', async () => {
    cuentaContableRepository.findById = jest.fn(async () => null);
    const service = buildService();
    await expect(service.crear(CONTEXT, baseInput())).rejects.toThrow(AsientoInvalidoException);
  });

  it('contabilizar: draft pasa a posted', async () => {
    const service = buildService();
    const resultado = await service.contabilizar(CONTEXT, 'ast-1');
    expect(resultado.status_id).toBe('st-posted');
  });

  it('contabilizar: rechaza un asiento ya contabilizado', async () => {
    asiento = buildAsiento({ status_id: 'st-posted' });
    const service = buildService();
    await expect(service.contabilizar(CONTEXT, 'ast-1')).rejects.toThrow(
      AsientoNoContabilizableException,
    );
  });

  it('anular: pasa a cancelled desde draft', async () => {
    const service = buildService();
    const resultado = await service.anular(CONTEXT, 'ast-1');
    expect(resultado.status_id).toBe('st-cancelled');
  });

  it('anular: rechaza anular dos veces', async () => {
    asiento = buildAsiento({ status_id: 'st-cancelled' });
    const service = buildService();
    await expect(service.anular(CONTEXT, 'ast-1')).rejects.toThrow(AsientoNoAnulableException);
  });

  it('revertir: rechaza un asiento que no está contabilizado', async () => {
    const service = buildService();
    await expect(service.revertir(CONTEXT, 'ast-1')).rejects.toThrow(AsientoNoRevertibleException);
  });

  it('revertir: genera un asiento nuevo con las líneas invertidas y marca el original como reversed', async () => {
    asiento = buildAsiento({ status_id: 'st-posted' });
    const service = buildService();
    const reversion = await service.revertir(CONTEXT, 'ast-1');

    expect(asientoRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        sourceModule: 'contabilidad',
        sourceEntityId: 'ast-1',
        lines: [
          {
            accountId: 'cta-1',
            costCenterId: null,
            profitCenterId: null,
            debitAmount: 0,
            creditAmount: 100,
          },
          {
            accountId: 'cta-2',
            costCenterId: null,
            profitCenterId: null,
            debitAmount: 100,
            creditAmount: 0,
          },
        ],
      }),
    );
    expect(asientoRepository.actualizarEstado).toHaveBeenCalledWith(
      CONTEXT,
      'ast-1',
      'st-reversed',
    );
    expect(reversion).toBeDefined();
  });

  it('libroMayor: calcula saldo inicial, movimientos y saldo final', async () => {
    asientoRepository.listarLineasPorCuenta = jest.fn(async () => [
      {
        id: 'l-1',
        posting_date: new Date('2026-01-15'),
        document_number: 'AST-A',
        debit_amount: 50,
        credit_amount: 0,
      },
      {
        id: 'l-2',
        posting_date: new Date('2026-02-15'),
        document_number: 'AST-B',
        debit_amount: 30,
        credit_amount: 0,
      },
      {
        id: 'l-3',
        posting_date: new Date('2026-02-20'),
        document_number: 'AST-C',
        debit_amount: 0,
        credit_amount: 10,
      },
    ]) as unknown as AsientoRepository['listarLineasPorCuenta'];
    const service = buildService();
    const resultado = await service.libroMayor(CONTEXT, {
      accountId: 'cta-1',
      companyId: 'company-1',
      desde: new Date('2026-02-01'),
      hasta: new Date('2026-02-28'),
    });
    expect(resultado.saldoInicial).toBe(50);
    expect(resultado.movimientos).toHaveLength(2);
    expect(resultado.saldoFinal).toBe(70);
  });
});
