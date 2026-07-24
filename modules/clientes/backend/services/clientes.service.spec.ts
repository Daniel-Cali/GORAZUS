import type { UserContext } from '@gorazus/contracts';
import type { customers } from '@gorazus/core-database';
import { ClienteRepository } from '../repositories/cliente.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import {
  ClientesService,
  ClienteNoEncontradoException,
  EmpresaInvalidaException,
  SucursalInvalidaException,
} from './clientes.service';
import type { CrearClienteInput } from '../validators/clientes.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildCliente(overrides: Partial<customers> = {}): customers {
  return {
    id: 'c-1',
    company_id: 'company-1',
    branch_id: null,
    legal_name: 'Juan Pérez',
    tax_id: 'CF123',
    preferred_currency_code: 'USD',
    ...overrides,
  } as customers;
}

describe('ClientesService', () => {
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let clienteExistente: customers | null;
  let clienteRepository: ClienteRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;

  beforeEach(() => {
    empresaValida = true;
    sucursalValida = true;
    clienteExistente = null;

    clienteRepository = {
      create: jest.fn(async () => buildCliente()),
      findById: jest.fn(async () => clienteExistente),
      findMany: jest.fn(async () => ({
        data: clienteExistente ? [clienteExistente] : [],
        meta: { page: 1, pageSize: 20, total: clienteExistente ? 1 : 0 },
      })),
      update: jest.fn(async () => buildCliente({ legal_name: 'Actualizado' })),
    } as unknown as ClienteRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;
  });

  function buildService(): ClientesService {
    return new ClientesService(clienteRepository, empresaSucursalLookupRepository);
  }

  function baseInput(overrides: Partial<CrearClienteInput> = {}): CrearClienteInput {
    return {
      companyId: 'company-1',
      legalName: 'Juan Pérez',
      taxId: 'CF123',
      preferredCurrencyCode: 'USD',
      ...overrides,
    };
  }

  it('crear: rechaza una empresa inexistente', async () => {
    empresaValida = false;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      EmpresaInvalidaException,
    );
  });

  it('crear: rechaza una sucursal que no pertenece a la empresa', async () => {
    sucursalValida = false;
    await expect(
      buildService().crear(CONTEXT, baseInput({ branchId: 'branch-x' })),
    ).rejects.toThrow(SucursalInvalidaException);
  });

  it('crear: caso feliz', async () => {
    const cliente = await buildService().crear(CONTEXT, baseInput());
    expect(cliente.legal_name).toBe('Juan Pérez');
  });

  it('obtener: cliente inexistente lanza ClienteNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'c-x')).rejects.toThrow(
      ClienteNoEncontradoException,
    );
  });

  it('obtenerOCrearConsumidorFinal: crea el sentinela si no existe', async () => {
    const cliente = await buildService().obtenerOCrearConsumidorFinal(CONTEXT, 'company-1');
    expect(clienteRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ tax_id: 'CF', legal_name: 'Consumidor Final' }),
    );
    expect(cliente).toBeDefined();
  });

  it('obtenerOCrearConsumidorFinal: reutiliza el sentinela si ya existe', async () => {
    clienteExistente = buildCliente({ tax_id: 'CF', legal_name: 'Consumidor Final' });
    const cliente = await buildService().obtenerOCrearConsumidorFinal(CONTEXT, 'company-1');
    expect(clienteRepository.create).not.toHaveBeenCalled();
    expect(cliente.tax_id).toBe('CF');
  });
});
