import type { UserContext } from '@gorazus/contracts';
import type { brands, PaginatedResult } from '@gorazus/core-database';
import { MarcaRepository } from '../repositories/marca.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import {
  MarcasService,
  MarcaNoEncontradaException,
  EmpresaInvalidaException,
} from './marcas.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildMarca(overrides: Partial<brands> = {}): brands {
  return {
    id: 'm1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    name: 'Stanley',
    ...overrides,
  } as brands;
}

describe('MarcasService', () => {
  let marcas: Map<string, brands>;
  let empresaValida: boolean;
  let marcaRepository: MarcaRepository;
  let empresaLookupRepository: EmpresaLookupRepository;

  beforeEach(() => {
    marcas = new Map([['m1', buildMarca()]]);
    empresaValida = true;

    marcaRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => marcas.get(where.id) ?? null,
      ),
      findMany: jest.fn(async () => {
        const data = [...marcas.values()];
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<brands>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<brands>) => {
        const nueva = buildMarca({ id: 'm-nueva', ...data });
        marcas.set(nueva.id, nueva);
        return nueva;
      }),
      update: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<brands>) => {
        const actual = marcas.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizada = { ...actual, ...data };
        marcas.set(where.id, actualizada);
        return actualizada;
      }),
    } as unknown as MarcaRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;
  });

  function buildService(): MarcasService {
    return new MarcasService(marcaRepository, empresaLookupRepository);
  }

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(
      buildService().crear(CONTEXT, { companyId: 'company-x', name: 'Bosch' }),
    ).rejects.toThrow(EmpresaInvalidaException);
  });

  it('crear: caso feliz', async () => {
    const marca = await buildService().crear(CONTEXT, { companyId: 'company-1', name: 'Bosch' });
    expect(marca.name).toBe('Bosch');
  });

  it('obtener: marca inexistente lanza MarcaNoEncontradaException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      MarcaNoEncontradaException,
    );
  });

  it('actualizar: PATCH parcial', async () => {
    const marca = await buildService().actualizar(CONTEXT, 'm1', { name: 'Stanley Renombrada' });
    expect(marca.name).toBe('Stanley Renombrada');
  });
});
