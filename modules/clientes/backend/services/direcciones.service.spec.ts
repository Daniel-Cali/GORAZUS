import type { UserContext } from '@gorazus/contracts';
import type { customer_addresses, customers } from '@gorazus/core-database';
import { DireccionClienteRepository } from '../repositories/direccion-cliente.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import {
  DireccionesService,
  ClienteNoEncontradoParaDireccionException,
  DireccionNoEncontradaException,
} from './direcciones.service';
import type { CrearDireccionInput } from '../validators/direcciones.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildDireccion(overrides: Partial<customer_addresses> = {}): customer_addresses {
  return {
    id: 'd-1',
    customer_id: 'c-1',
    address_type: 'billing',
    line1: 'Calle 1 #23',
    line2: null,
    municipality_id: null,
    postal_code: null,
    is_default: false,
    ...overrides,
  } as customer_addresses;
}

describe('DireccionesService', () => {
  let clienteExiste: boolean;
  let direccionExistente: customer_addresses | null;
  let direccionesPredeterminadas: customer_addresses[];
  let direccionRepository: DireccionClienteRepository;
  let clienteRepository: ClienteRepository;

  beforeEach(() => {
    clienteExiste = true;
    direccionExistente = buildDireccion();
    direccionesPredeterminadas = [];

    direccionRepository = {
      create: jest.fn(async () => buildDireccion()),
      findById: jest.fn(async () => direccionExistente),
      findMany: jest.fn(async () => ({
        data: direccionesPredeterminadas,
        meta: { page: 1, pageSize: 100, total: direccionesPredeterminadas.length },
      })),
      update: jest.fn(async () => buildDireccion({ is_default: true })),
      softDelete: jest.fn(async () => buildDireccion({ deleted_at: new Date() })),
    } as unknown as DireccionClienteRepository;

    clienteRepository = {
      findById: jest.fn(async () => (clienteExiste ? ({ id: 'c-1' } as customers) : null)),
    } as unknown as ClienteRepository;
  });

  function buildService(): DireccionesService {
    return new DireccionesService(direccionRepository, clienteRepository);
  }

  function baseInput(overrides: Partial<CrearDireccionInput> = {}): CrearDireccionInput {
    return { addressType: 'billing', line1: 'Calle 1 #23', isDefault: false, ...overrides };
  }

  it('crear: rechaza un cliente inexistente', async () => {
    clienteExiste = false;
    await expect(buildService().crear(CONTEXT, 'c-1', baseInput())).rejects.toThrow(
      ClienteNoEncontradoParaDireccionException,
    );
  });

  it('crear: caso feliz', async () => {
    const direccion = await buildService().crear(CONTEXT, 'c-1', baseInput());
    expect(direccion.line1).toBe('Calle 1 #23');
  });

  it('crear: al marcar isDefault desmarca las direcciones predeterminadas existentes', async () => {
    direccionesPredeterminadas = [buildDireccion({ id: 'd-0', is_default: true })];
    await buildService().crear(CONTEXT, 'c-1', baseInput({ isDefault: true }));
    expect(direccionRepository.update).toHaveBeenCalledWith(
      CONTEXT,
      { id: 'd-0' },
      { is_default: false },
    );
  });

  it('obtener: dirección inexistente lanza DireccionNoEncontradaException', async () => {
    direccionExistente = null;
    await expect(buildService().obtener(CONTEXT, 'c-1', 'd-x')).rejects.toThrow(
      DireccionNoEncontradaException,
    );
  });

  it('obtener: dirección de otro cliente lanza DireccionNoEncontradaException', async () => {
    direccionExistente = buildDireccion({ customer_id: 'otro-cliente' });
    await expect(buildService().obtener(CONTEXT, 'c-1', 'd-1')).rejects.toThrow(
      DireccionNoEncontradaException,
    );
  });

  it('eliminar: hace baja lógica', async () => {
    const direccion = await buildService().eliminar(CONTEXT, 'c-1', 'd-1');
    expect(direccionRepository.softDelete).toHaveBeenCalled();
    expect(direccion.deleted_at).toBeDefined();
  });
});
