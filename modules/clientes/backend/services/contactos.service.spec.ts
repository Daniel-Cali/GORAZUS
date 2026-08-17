import type { UserContext } from '@gorazus/contracts';
import type { customer_contacts, customers } from '@gorazus/core-database';
import { ContactoClienteRepository } from '../repositories/contacto-cliente.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import {
  ContactosService,
  ClienteNoEncontradoParaContactoException,
  ContactoNoEncontradoException,
} from './contactos.service';
import type { CrearContactoInput } from '../validators/contactos.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildContacto(overrides: Partial<customer_contacts> = {}): customer_contacts {
  return {
    id: 'k-1',
    customer_id: 'c-1',
    full_name: 'Ana López',
    job_title: null,
    email: null,
    phone: null,
    is_primary: false,
    ...overrides,
  } as customer_contacts;
}

describe('ContactosService', () => {
  let clienteExiste: boolean;
  let contactoExistente: customer_contacts | null;
  let contactosPrincipales: customer_contacts[];
  let contactoRepository: ContactoClienteRepository;
  let clienteRepository: ClienteRepository;

  beforeEach(() => {
    clienteExiste = true;
    contactoExistente = buildContacto();
    contactosPrincipales = [];

    contactoRepository = {
      create: jest.fn(async () => buildContacto()),
      findById: jest.fn(async () => contactoExistente),
      findMany: jest.fn(async () => ({
        data: contactosPrincipales,
        meta: { page: 1, pageSize: 100, total: contactosPrincipales.length },
      })),
      update: jest.fn(async () => buildContacto({ is_primary: true })),
      softDelete: jest.fn(async () => buildContacto({ deleted_at: new Date() })),
    } as unknown as ContactoClienteRepository;

    clienteRepository = {
      findById: jest.fn(async () => (clienteExiste ? ({ id: 'c-1' } as customers) : null)),
    } as unknown as ClienteRepository;
  });

  function buildService(): ContactosService {
    return new ContactosService(contactoRepository, clienteRepository);
  }

  function baseInput(overrides: Partial<CrearContactoInput> = {}): CrearContactoInput {
    return { fullName: 'Ana López', isPrimary: false, ...overrides };
  }

  it('crear: rechaza un cliente inexistente', async () => {
    clienteExiste = false;
    await expect(buildService().crear(CONTEXT, 'c-1', baseInput())).rejects.toThrow(
      ClienteNoEncontradoParaContactoException,
    );
  });

  it('crear: caso feliz', async () => {
    const contacto = await buildService().crear(CONTEXT, 'c-1', baseInput());
    expect(contacto.full_name).toBe('Ana López');
  });

  it('crear: al marcar isPrimary desmarca los contactos principales existentes', async () => {
    contactosPrincipales = [buildContacto({ id: 'k-0', is_primary: true })];
    await buildService().crear(CONTEXT, 'c-1', baseInput({ isPrimary: true }));
    expect(contactoRepository.update).toHaveBeenCalledWith(
      CONTEXT,
      { id: 'k-0' },
      { is_primary: false },
    );
  });

  it('obtener: contacto inexistente lanza ContactoNoEncontradoException', async () => {
    contactoExistente = null;
    await expect(buildService().obtener(CONTEXT, 'c-1', 'k-x')).rejects.toThrow(
      ContactoNoEncontradoException,
    );
  });

  it('obtener: contacto de otro cliente lanza ContactoNoEncontradoException', async () => {
    contactoExistente = buildContacto({ customer_id: 'otro-cliente' });
    await expect(buildService().obtener(CONTEXT, 'c-1', 'k-1')).rejects.toThrow(
      ContactoNoEncontradoException,
    );
  });

  it('eliminar: hace baja lógica', async () => {
    const contacto = await buildService().eliminar(CONTEXT, 'c-1', 'k-1');
    expect(contactoRepository.softDelete).toHaveBeenCalled();
    expect(contacto.deleted_at).toBeDefined();
  });
});
