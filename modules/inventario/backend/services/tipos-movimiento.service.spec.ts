import type { UserContext } from '@gorazus/contracts';
import type { stock_movement_types, PaginatedResult } from '@gorazus/core-database';
import { TipoMovimientoStockRepository } from '../repositories/tipo-movimiento-stock.repository';
import {
  TiposMovimientoService,
  TipoMovimientoNoEncontradoException,
  TipoMovimientoDuplicadoException,
  TipoMovimientoConMovimientosException,
} from './tipos-movimiento.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildTipo(overrides: Partial<stock_movement_types> = {}): stock_movement_types {
  return {
    id: 'mt-1',
    tenant_id: 'tenant-1',
    code: 'receipt',
    direction: 'in',
    ...overrides,
  } as stock_movement_types;
}

describe('TiposMovimientoService', () => {
  let tipos: Map<string, stock_movement_types>;
  let codigosExistentes: Set<string>;
  let movimientosPorTipo: Set<string>;
  let repository: TipoMovimientoStockRepository;

  beforeEach(() => {
    tipos = new Map([['mt-1', buildTipo()]]);
    codigosExistentes = new Set(['receipt']);
    movimientosPorTipo = new Set();

    repository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => tipos.get(where.id) ?? null,
      ),
      findMany: jest.fn(async () => {
        const data = [...tipos.values()];
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<stock_movement_types>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<stock_movement_types>) => {
        const nuevo = buildTipo({ id: 'mt-nuevo', ...data });
        tipos.set(nuevo.id, nuevo);
        codigosExistentes.add(nuevo.code);
        return nuevo;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<stock_movement_types>) => {
          const actual = tipos.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizado = { ...actual, ...data };
          tipos.set(where.id, actualizado);
          return actualizado;
        },
      ),
      existeCodigo: jest.fn(async (_ctx: unknown, code: string) => codigosExistentes.has(code)),
      tieneMovimientos: jest.fn(async (_ctx: unknown, id: string) => movimientosPorTipo.has(id)),
    } as unknown as TipoMovimientoStockRepository;
  });

  function buildService(): TiposMovimientoService {
    return new TiposMovimientoService(repository);
  }

  it('crear: rechaza un código duplicado', async () => {
    await expect(
      buildService().crear(CONTEXT, { code: 'receipt', direction: 'in' }),
    ).rejects.toThrow(TipoMovimientoDuplicadoException);
  });

  it('crear: caso feliz crea el tipo', async () => {
    const tipo = await buildService().crear(CONTEXT, { code: 'issue', direction: 'out' });
    expect(tipo.code).toBe('issue');
    expect(tipo.direction).toBe('out');
  });

  it('obtener: tipo inexistente lanza TipoMovimientoNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      TipoMovimientoNoEncontradoException,
    );
  });

  it('actualizar: cambiar direction sin movimientos registrados es permitido', async () => {
    const actualizado = await buildService().actualizar(CONTEXT, 'mt-1', { direction: 'out' });
    expect(actualizado.direction).toBe('out');
  });

  it('actualizar: rechaza cambiar direction si ya tiene movimientos registrados', async () => {
    movimientosPorTipo.add('mt-1');
    await expect(buildService().actualizar(CONTEXT, 'mt-1', { direction: 'out' })).rejects.toThrow(
      TipoMovimientoConMovimientosException,
    );
  });

  it('actualizar: rechaza un code duplicado', async () => {
    tipos.set('mt-2', buildTipo({ id: 'mt-2', code: 'issue' }));
    codigosExistentes.add('issue');
    await expect(buildService().actualizar(CONTEXT, 'mt-1', { code: 'issue' })).rejects.toThrow(
      TipoMovimientoDuplicadoException,
    );
  });

  it('actualizar: mantener el mismo code no dispara la validación de duplicado', async () => {
    const actualizado = await buildService().actualizar(CONTEXT, 'mt-1', { code: 'receipt' });
    expect(actualizado.code).toBe('receipt');
  });
});
