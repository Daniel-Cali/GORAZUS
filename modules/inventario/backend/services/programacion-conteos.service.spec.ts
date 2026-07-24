import type { UserContext } from '@gorazus/contracts';
import type { cycle_count_schedules, warehouse_zones } from '@gorazus/core-database';
import { ProgramaConteoCiclicoRepository } from '../repositories/programa-conteo-ciclico.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { ConteosService } from './conteos.service';
import {
  ProgramacionConteosService,
  ProgramaConteoNoEncontradoException,
  ZonaProgramaInvalidaException,
} from './programacion-conteos.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

const ZONA = { id: 'z-1', warehouse_id: 'w-1' } as warehouse_zones;

function buildPrograma(overrides: Partial<cycle_count_schedules> = {}): cycle_count_schedules {
  return {
    id: 's-1',
    zone_id: 'z-1',
    frequency_days: 7,
    next_run_date: null,
    ...overrides,
  } as cycle_count_schedules;
}

describe('ProgramacionConteosService', () => {
  let zona: warehouse_zones | null;
  let programas: Map<string, cycle_count_schedules>;
  let programaRepository: ProgramaConteoCiclicoRepository;
  let zonaAlmacenRepository: ZonaAlmacenRepository;
  let conteosService: ConteosService;

  beforeEach(() => {
    zona = ZONA;
    programas = new Map([['s-1', buildPrograma()]]);

    programaRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => programas.get(where.id) ?? null,
      ),
      findMany: jest.fn(async () => {
        const data = [...programas.values()];
        return { data, meta: { page: 1, pageSize: 20, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<cycle_count_schedules>) => {
        const nuevo = buildPrograma({ id: 's-nuevo', ...data });
        programas.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(
        async (_ctx: unknown, where: { id: string }, data: Partial<cycle_count_schedules>) => {
          const actual = programas.get(where.id);
          if (!actual) throw new Error('no existe');
          const actualizado = { ...actual, ...data };
          programas.set(where.id, actualizado);
          return actualizado;
        },
      ),
    } as unknown as ProgramaConteoCiclicoRepository;

    zonaAlmacenRepository = {
      findById: jest.fn(async () => zona),
    } as unknown as ZonaAlmacenRepository;

    conteosService = {
      crear: jest.fn(async () => ({ id: 'c-1' })),
    } as unknown as ConteosService;
  });

  function buildService(): ProgramacionConteosService {
    return new ProgramacionConteosService(
      programaRepository,
      zonaAlmacenRepository,
      conteosService,
    );
  }

  it('crear: rechaza frecuencia inválida (defensa en profundidad de la entidad)', async () => {
    await expect(
      buildService().crear(CONTEXT, { zoneId: 'z-1', frequencyDays: 0 }),
    ).rejects.toThrow('frecuencia en días debe ser mayor que cero');
  });

  it('crear: rechaza una zona inexistente', async () => {
    zona = null;
    await expect(
      buildService().crear(CONTEXT, { zoneId: 'z-x', frequencyDays: 7 }),
    ).rejects.toThrow(ZonaProgramaInvalidaException);
  });

  it('crear: caso feliz', async () => {
    const programa = await buildService().crear(CONTEXT, { zoneId: 'z-1', frequencyDays: 30 });
    expect(programa.frequency_days).toBe(30);
  });

  it('obtener: programación inexistente lanza ProgramaConteoNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 's-x')).rejects.toThrow(
      ProgramaConteoNoEncontradoException,
    );
  });

  it('actualizar: cambia la frecuencia', async () => {
    const actualizado = await buildService().actualizar(CONTEXT, 's-1', { frequencyDays: 15 });
    expect(actualizado.frequency_days).toBe(15);
  });

  it('generar: crea el conteo con warehouseId/zoneId resueltos de la zona', async () => {
    await buildService().generar(CONTEXT, 's-1');
    expect(conteosService.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ warehouseId: 'w-1', zoneId: 'z-1' }),
    );
  });

  it('generar: avanza next_run_date en frequency_days desde hoy si no había fecha previa', async () => {
    const antes = new Date();
    const resultado = await buildService().generar(CONTEXT, 's-1');
    const proxima = new Date(resultado.programa.next_run_date!);
    const diffDias = Math.round((proxima.getTime() - antes.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(7);
  });

  it('generar: avanza next_run_date en frequency_days desde la fecha ya programada', async () => {
    programas.set('s-1', buildPrograma({ next_run_date: new Date('2026-01-01') }));
    const resultado = await buildService().generar(CONTEXT, 's-1');
    expect(new Date(resultado.programa.next_run_date!).toISOString().slice(0, 10)).toBe(
      '2026-01-08',
    );
  });
});
