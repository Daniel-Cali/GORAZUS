import type { UserContext } from '@gorazus/contracts';
import type { opportunities, leads } from '@gorazus/core-database';
import { OpportunityRepository } from '../repositories/opportunity.repository';
import { SalesFunnelRepository } from '../repositories/sales-funnel.repository';
import { OpportunityLossReasonRepository } from '../repositories/opportunity-loss-reason.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { LeadRepository } from '../repositories/lead.repository';
import {
  OportunidadesService,
  OportunidadNoEncontradaException,
  EtapaInvalidaException,
  LeadInvalidoException,
  ClienteInvalidoException,
  ProductoInvalidoException,
  MotivoPerdidaInvalidoException,
} from './oportunidades.service';
import type { CrearOpportunityInput } from '../validators/opportunities.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildOpportunity(overrides: Partial<opportunities> = {}): opportunities {
  return {
    id: 'o-1',
    company_id: 'company-1',
    branch_id: null,
    funnel_stage_id: 'stage-1',
    lead_id: 'lead-1',
    customer_id: null,
    estimated_amount: 0,
    status: 'open',
    loss_reason_id: null,
    resulting_sales_order_id: null,
    ...overrides,
  } as opportunities;
}

describe('OportunidadesService', () => {
  let etapaValida: boolean;
  let clienteValido: boolean;
  let productoValido: boolean;
  let motivoValido: boolean;
  let leadExistente: leads | null;
  let opportunityExistente: opportunities | null;
  let opportunityRepository: OpportunityRepository;
  let salesFunnelRepository: SalesFunnelRepository;
  let opportunityLossReasonRepository: OpportunityLossReasonRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let clienteLookupRepository: ClienteLookupRepository;
  let leadRepository: LeadRepository;

  beforeEach(() => {
    etapaValida = true;
    clienteValido = true;
    productoValido = true;
    motivoValido = true;
    leadExistente = { id: 'lead-1' } as leads;
    opportunityExistente = buildOpportunity();

    opportunityRepository = {
      crear: jest.fn(async () => buildOpportunity()),
      findById: jest.fn(async () => opportunityExistente),
      findMany: jest.fn(async () => ({
        data: opportunityExistente ? [opportunityExistente] : [],
        meta: { page: 1, pageSize: 20, total: opportunityExistente ? 1 : 0 },
      })),
      moverDeEtapa: jest.fn(async () => buildOpportunity({ funnel_stage_id: 'stage-2' })),
      ganar: jest.fn(async () =>
        buildOpportunity({ status: 'won', resulting_sales_order_id: 'so-1' }),
      ),
      perder: jest.fn(async () => buildOpportunity({ status: 'lost', loss_reason_id: 'reason-1' })),
    } as unknown as OpportunityRepository;

    salesFunnelRepository = {
      existeEtapa: jest.fn(async () => etapaValida),
    } as unknown as SalesFunnelRepository;

    opportunityLossReasonRepository = {
      existe: jest.fn(async () => motivoValido),
    } as unknown as OpportunityLossReasonRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    clienteLookupRepository = {
      existeCliente: jest.fn(async () => clienteValido),
    } as unknown as ClienteLookupRepository;

    leadRepository = {
      findById: jest.fn(async () => leadExistente),
    } as unknown as LeadRepository;
  });

  function buildService(): OportunidadesService {
    return new OportunidadesService(
      opportunityRepository,
      salesFunnelRepository,
      opportunityLossReasonRepository,
      productoLookupRepository,
      clienteLookupRepository,
      leadRepository,
    );
  }

  function baseInput(overrides: Partial<CrearOpportunityInput> = {}): CrearOpportunityInput {
    return {
      companyId: 'company-1',
      funnelStageId: 'stage-1',
      leadId: 'lead-1',
      estimatedAmount: 0,
      lines: [],
      ...overrides,
    };
  }

  it('crear: rechaza una etapa de embudo inexistente', async () => {
    etapaValida = false;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(
      EtapaInvalidaException,
    );
  });

  it('crear: rechaza un lead inexistente', async () => {
    leadExistente = null;
    await expect(buildService().crear(CONTEXT, baseInput())).rejects.toThrow(LeadInvalidoException);
  });

  it('crear: rechaza un cliente inexistente', async () => {
    clienteValido = false;
    await expect(
      buildService().crear(CONTEXT, baseInput({ leadId: undefined, customerId: 'customer-x' })),
    ).rejects.toThrow(ClienteInvalidoException);
  });

  it('crear: rechaza un producto inexistente en las líneas', async () => {
    productoValido = false;
    await expect(
      buildService().crear(
        CONTEXT,
        baseInput({ lines: [{ productId: 'p-x', estimatedQuantity: 1 }] }),
      ),
    ).rejects.toThrow(ProductoInvalidoException);
  });

  it('crear: caso feliz', async () => {
    const oportunidad = await buildService().crear(CONTEXT, baseInput());
    expect(oportunidad.id).toBe('o-1');
  });

  it('obtener: oportunidad inexistente lanza OportunidadNoEncontradaException', async () => {
    opportunityExistente = null;
    await expect(buildService().obtener(CONTEXT, 'o-x')).rejects.toThrow(
      OportunidadNoEncontradaException,
    );
  });

  it('moverDeEtapa: rechaza una etapa inexistente', async () => {
    etapaValida = false;
    await expect(
      buildService().moverDeEtapa(CONTEXT, 'o-1', { funnelStageId: 'stage-x' }),
    ).rejects.toThrow(EtapaInvalidaException);
  });

  it('ganar: caso feliz registra el pedido resultante', async () => {
    const oportunidad = await buildService().ganar(CONTEXT, 'o-1', {
      resultingSalesOrderId: 'so-1',
    });
    expect(oportunidad.status).toBe('won');
    expect(opportunityRepository.ganar).toHaveBeenCalledWith(CONTEXT, 'o-1', 'so-1');
  });

  it('perder: rechaza un motivo de pérdida inexistente', async () => {
    motivoValido = false;
    await expect(
      buildService().perder(CONTEXT, 'o-1', { lossReasonId: 'reason-x' }),
    ).rejects.toThrow(MotivoPerdidaInvalidoException);
  });

  it('perder: caso feliz', async () => {
    const oportunidad = await buildService().perder(CONTEXT, 'o-1', { lossReasonId: 'reason-1' });
    expect(oportunidad.status).toBe('lost');
  });
});
