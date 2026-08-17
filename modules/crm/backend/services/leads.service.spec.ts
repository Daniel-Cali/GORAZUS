import type { UserContext } from '@gorazus/contracts';
import type { leads } from '@gorazus/core-database';
import type { ClientesService } from '@gorazus/modules/clientes';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadStatusRepository } from '../repositories/lead-status.repository';
import { LeadSourceRepository } from '../repositories/lead-source.repository';
import {
  LeadsService,
  LeadNoEncontradoException,
  EstadoInvalidoException,
  OrigenInvalidoException,
} from './leads.service';
import type { CrearLeadInput } from '../validators/leads.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildLead(overrides: Partial<leads> = {}): leads {
  return {
    id: 'l-1',
    company_id: 'company-1',
    branch_id: null,
    full_name: 'Juan Pérez',
    email: 'a@b.com',
    phone: null,
    status_id: 'status-nuevo',
    source_id: null,
    converted_customer_id: null,
    ...overrides,
  } as leads;
}

describe('LeadsService', () => {
  let estadoNuevo: { id: string } | null;
  let origenValido: boolean;
  let leadExistente: leads | null;
  let leadRepository: LeadRepository;
  let leadStatusRepository: LeadStatusRepository;
  let leadSourceRepository: LeadSourceRepository;
  let clientesService: ClientesService;

  beforeEach(() => {
    estadoNuevo = { id: 'status-nuevo' };
    origenValido = true;
    leadExistente = buildLead();

    leadRepository = {
      create: jest.fn(async () => buildLead()),
      findById: jest.fn(async () => leadExistente),
      findMany: jest.fn(async () => ({
        data: leadExistente ? [leadExistente] : [],
        meta: { page: 1, pageSize: 20, total: leadExistente ? 1 : 0 },
      })),
      update: jest.fn(async () => buildLead({ converted_customer_id: 'cliente-1' })),
      cambiarEstado: jest.fn(async () => buildLead({ status_id: 'status-nuevo-target' })),
    } as unknown as LeadRepository;

    leadStatusRepository = {
      buscarPorCodigo: jest.fn(async (_ctx: UserContext, code: string) =>
        code === 'inexistente' ? null : estadoNuevo,
      ),
    } as unknown as LeadStatusRepository;

    leadSourceRepository = {
      existe: jest.fn(async () => origenValido),
    } as unknown as LeadSourceRepository;

    clientesService = {
      crear: jest.fn(async () => ({ id: 'cliente-1', legal_name: 'Juan Pérez' })),
    } as unknown as ClientesService;
  });

  function buildService(): LeadsService {
    return new LeadsService(
      leadRepository,
      leadStatusRepository,
      leadSourceRepository,
      clientesService,
    );
  }

  function baseInput(overrides: Partial<CrearLeadInput> = {}): CrearLeadInput {
    return { companyId: 'company-1', fullName: 'Juan Pérez', email: 'a@b.com', ...overrides };
  }

  it('crear: rechaza un origen inexistente', async () => {
    origenValido = false;
    await expect(
      buildService().crear(CONTEXT, baseInput({ sourceId: 'source-x' })),
    ).rejects.toThrow(OrigenInvalidoException);
  });

  it('crear: caso feliz', async () => {
    const lead = await buildService().crear(CONTEXT, baseInput());
    expect(lead.full_name).toBe('Juan Pérez');
    expect(leadRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ status_id: 'status-nuevo' }),
    );
  });

  it('obtener: lead inexistente lanza LeadNoEncontradoException', async () => {
    leadExistente = null;
    await expect(buildService().obtener(CONTEXT, 'l-x')).rejects.toThrow(LeadNoEncontradoException);
  });

  it('cambiarEstado: rechaza un código de estado inexistente', async () => {
    await expect(
      buildService().cambiarEstado(CONTEXT, 'l-1', { statusCode: 'inexistente' }),
    ).rejects.toThrow(EstadoInvalidoException);
  });

  it('cambiarEstado: caso feliz registra el cambio', async () => {
    await buildService().cambiarEstado(CONTEXT, 'l-1', { statusCode: 'contactado' });
    expect(leadRepository.cambiarEstado).toHaveBeenCalledWith(CONTEXT, 'l-1', 'status-nuevo');
  });

  it('convertir: invoca a ClientesService.crear() y actualiza el lead', async () => {
    const input = { legalName: 'Juan Pérez', taxId: 'TAX-1', preferredCurrencyCode: 'USD' };
    await buildService().convertir(CONTEXT, 'l-1', input);
    expect(clientesService.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ legalName: 'Juan Pérez', taxId: 'TAX-1' }),
    );
    expect(leadRepository.update).toHaveBeenCalledWith(
      CONTEXT,
      { id: 'l-1' },
      { converted_customer_id: 'cliente-1' },
    );
  });

  it('convertir: idempotente si el lead ya fue convertido', async () => {
    leadExistente = buildLead({ converted_customer_id: 'cliente-ya-existente' });
    const input = { legalName: 'Juan Pérez', taxId: 'TAX-1', preferredCurrencyCode: 'USD' };
    const lead = await buildService().convertir(CONTEXT, 'l-1', input);
    expect(clientesService.crear).not.toHaveBeenCalled();
    expect(lead.converted_customer_id).toBe('cliente-ya-existente');
  });
});
