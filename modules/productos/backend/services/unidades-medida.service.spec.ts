import type { UserContext } from '@gorazus/contracts';
import type { units_of_measure, PaginatedResult } from '@gorazus/core-database';
import { UnidadMedidaRepository } from '../repositories/unidad-medida.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import {
  UnidadesMedidaService,
  UnidadMedidaNoEncontradaException,
  EmpresaInvalidaException,
} from './unidades-medida.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildUnidad(overrides: Partial<units_of_measure> = {}): units_of_measure {
  return {
    id: 'u1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    code: 'UND',
    ...overrides,
  } as units_of_measure;
}

describe('UnidadesMedidaService', () => {
  let unidades: Map<string, units_of_measure>;
  let empresaValida: boolean;
  let unidadMedidaRepository: UnidadMedidaRepository;
  let empresaLookupRepository: EmpresaLookupRepository;

  beforeEach(() => {
    unidades = new Map([['u1', buildUnidad()]]);
    empresaValida = true;

    unidadMedidaRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => unidades.get(where.id) ?? null,
      ),
      findMany: jest.fn(async () => {
        const data = [...unidades.values()];
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<units_of_measure>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<units_of_measure>) => {
        const nueva = buildUnidad({ id: 'u-nueva', ...data });
        unidades.set(nueva.id, nueva);
        return nueva;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<units_of_measure>) => {
          const actual = unidades.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizada = { ...actual, ...data };
          unidades.set(where.id, actualizada);
          return actualizada;
        },
      ),
    } as unknown as UnidadMedidaRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;
  });

  function buildService(): UnidadesMedidaService {
    return new UnidadesMedidaService(unidadMedidaRepository, empresaLookupRepository);
  }

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(
      buildService().crear(CONTEXT, { companyId: 'company-x', code: 'KG' }),
    ).rejects.toThrow(EmpresaInvalidaException);
  });

  it('crear: caso feliz', async () => {
    const unidad = await buildService().crear(CONTEXT, { companyId: 'company-1', code: 'KG' });
    expect(unidad.code).toBe('KG');
  });

  it('obtener: unidad inexistente lanza UnidadMedidaNoEncontradaException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      UnidadMedidaNoEncontradaException,
    );
  });

  it('actualizar: PATCH parcial', async () => {
    const unidad = await buildService().actualizar(CONTEXT, 'u1', { code: 'PZA' });
    expect(unidad.code).toBe('PZA');
  });
});
