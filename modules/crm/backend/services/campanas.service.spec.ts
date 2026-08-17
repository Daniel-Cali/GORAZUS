import type { UserContext } from '@gorazus/contracts';
import type { campaigns, leads } from '@gorazus/core-database';
import { CampaignRepository } from '../repositories/campaign.repository';
import { LeadRepository } from '../repositories/lead.repository';
import {
  CampanasService,
  CampanaNoEncontradaException,
  LeadInvalidoException,
} from './campanas.service';
import type { CrearCampaignInput } from '../validators/campaigns.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildCampaign(overrides: Partial<campaigns> = {}): campaigns {
  return {
    id: 'camp-1',
    company_id: 'company-1',
    branch_id: null,
    name: 'Campaña',
    ...overrides,
  } as campaigns;
}

describe('CampanasService', () => {
  let campanaExistente: campaigns | null;
  let leadExistente: leads | null;
  let campaignRepository: CampaignRepository;
  let leadRepository: LeadRepository;

  beforeEach(() => {
    campanaExistente = buildCampaign();
    leadExistente = { id: 'lead-1' } as leads;

    campaignRepository = {
      crear: jest.fn(async () => buildCampaign()),
      findById: jest.fn(async () => campanaExistente),
      findMany: jest.fn(async () => ({
        data: campanaExistente ? [campanaExistente] : [],
        meta: { page: 1, pageSize: 20, total: campanaExistente ? 1 : 0 },
      })),
      agregarMiembro: jest.fn(async () => undefined),
    } as unknown as CampaignRepository;

    leadRepository = {
      findById: jest.fn(async () => leadExistente),
    } as unknown as LeadRepository;
  });

  function buildService(): CampanasService {
    return new CampanasService(campaignRepository, leadRepository);
  }

  function baseInput(overrides: Partial<CrearCampaignInput> = {}): CrearCampaignInput {
    return { companyId: 'company-1', name: 'Campaña de verano', ...overrides };
  }

  it('crear: caso feliz', async () => {
    const campana = await buildService().crear(CONTEXT, baseInput());
    expect(campana.name).toBe('Campaña');
  });

  it('obtener: campaña inexistente lanza CampanaNoEncontradaException', async () => {
    campanaExistente = null;
    await expect(buildService().obtener(CONTEXT, 'camp-x')).rejects.toThrow(
      CampanaNoEncontradaException,
    );
  });

  it('agregarMiembro: rechaza un lead inexistente', async () => {
    leadExistente = null;
    await expect(
      buildService().agregarMiembro(CONTEXT, 'camp-1', { leadId: 'lead-x' }),
    ).rejects.toThrow(LeadInvalidoException);
  });

  it('agregarMiembro: caso feliz', async () => {
    await buildService().agregarMiembro(CONTEXT, 'camp-1', { leadId: 'lead-1' });
    expect(campaignRepository.agregarMiembro).toHaveBeenCalledWith(CONTEXT, 'camp-1', 'lead-1');
  });
});
