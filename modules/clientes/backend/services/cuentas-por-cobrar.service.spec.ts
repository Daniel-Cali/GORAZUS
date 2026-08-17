import type { UserContext } from '@gorazus/contracts';
import type { customers } from '@gorazus/core-database';
import {
  CuentaPorCobrarRepository,
  type CuentaPorCobrar,
} from '../repositories/cuenta-por-cobrar.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import {
  CuentasPorCobrarService,
  ClienteNoEncontradoParaCuentasPorCobrarException,
} from './cuentas-por-cobrar.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildFila(overrides: Partial<CuentaPorCobrar> = {}): CuentaPorCobrar {
  return {
    customerId: 'c-1',
    legalName: 'Juan Pérez',
    invoiceId: 'inv-1',
    documentNumber: 'FAC-0001',
    totalAmount: '1000.0000',
    openBalance: '400.0000',
    daysOutstanding: 45,
    agingBucket: '31-60',
    ...overrides,
  };
}

describe('CuentasPorCobrarService', () => {
  let clienteExiste: boolean;
  let filas: CuentaPorCobrar[];
  let cuentaPorCobrarRepository: CuentaPorCobrarRepository;
  let clienteRepository: ClienteRepository;

  beforeEach(() => {
    clienteExiste = true;
    filas = [buildFila()];

    cuentaPorCobrarRepository = {
      listarPorCliente: jest.fn(async () => filas),
    } as unknown as CuentaPorCobrarRepository;

    clienteRepository = {
      findById: jest.fn(async () => (clienteExiste ? ({ id: 'c-1' } as customers) : null)),
    } as unknown as ClienteRepository;
  });

  function buildService(): CuentasPorCobrarService {
    return new CuentasPorCobrarService(cuentaPorCobrarRepository, clienteRepository);
  }

  it('rechaza un cliente inexistente', async () => {
    clienteExiste = false;
    await expect(buildService().listarPorCliente(CONTEXT, 'c-x')).rejects.toThrow(
      ClienteNoEncontradoParaCuentasPorCobrarException,
    );
  });

  it('caso feliz: devuelve las cuentas por cobrar del cliente', async () => {
    const resultado = await buildService().listarPorCliente(CONTEXT, 'c-1');
    expect(resultado).toEqual(filas);
    expect(cuentaPorCobrarRepository.listarPorCliente).toHaveBeenCalledWith(CONTEXT, 'c-1');
  });

  it('caso feliz: cliente sin facturas abiertas devuelve lista vacía', async () => {
    filas = [];
    const resultado = await buildService().listarPorCliente(CONTEXT, 'c-1');
    expect(resultado).toEqual([]);
  });
});
