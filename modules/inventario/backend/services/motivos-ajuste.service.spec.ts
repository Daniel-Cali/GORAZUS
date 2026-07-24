import type { UserContext } from '@gorazus/contracts';
import type { stock_adjustment_reasons, PaginatedResult } from '@gorazus/core-database';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { MotivosAjusteService, MotivoAjusteNoEncontradoException } from './motivos-ajuste.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildMotivo(overrides: Partial<stock_adjustment_reasons> = {}): stock_adjustment_reasons {
  return {
    id: 'm-1',
    tenant_id: 'tenant-1',
    name: 'Daño',
    ...overrides,
  } as stock_adjustment_reasons;
}

describe('MotivosAjusteService', () => {
  let motivos: Map<string, stock_adjustment_reasons>;
  let repository: MotivoAjusteRepository;

  beforeEach(() => {
    motivos = new Map([['m-1', buildMotivo()]]);
    repository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => motivos.get(where.id) ?? null,
      ),
      findMany: jest.fn(async () => {
        const data = [...motivos.values()];
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<stock_adjustment_reasons>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<stock_adjustment_reasons>) => {
        const nuevo = buildMotivo({ id: 'm-nuevo', ...data });
        motivos.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<stock_adjustment_reasons>) => {
          const actual = motivos.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizado = { ...actual, ...data };
          motivos.set(where.id, actualizado);
          return actualizado;
        },
      ),
    } as unknown as MotivoAjusteRepository;
  });

  function buildService(): MotivosAjusteService {
    return new MotivosAjusteService(repository);
  }

  it('crear: rechaza un nombre vacío (defensa en profundidad de la entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { name: '   ' })).rejects.toThrow(
      'nombre del motivo de ajuste no puede estar vacío',
    );
  });

  it('crear: caso feliz crea el motivo', async () => {
    const motivo = await buildService().crear(CONTEXT, { name: 'Robo' });
    expect(motivo.name).toBe('Robo');
  });

  it('obtener: motivo inexistente lanza MotivoAjusteNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      MotivoAjusteNoEncontradoException,
    );
  });

  it('actualizar: renombra el motivo', async () => {
    const actualizado = await buildService().actualizar(CONTEXT, 'm-1', { name: 'Daño físico' });
    expect(actualizado.name).toBe('Daño físico');
  });
});
