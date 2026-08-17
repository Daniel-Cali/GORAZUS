import type { UserContext } from '@gorazus/contracts';
import type {
  cash_registers,
  cash_register_openings,
  cash_register_closings,
  cash_movement_types,
  cash_movements,
} from '@gorazus/core-database';
import { CajaRegistroRepository } from '../repositories/caja-registro.repository';
import { AperturaCajaRepository } from '../repositories/apertura-caja.repository';
import { CierreCajaRepository } from '../repositories/cierre-caja.repository';
import { TipoMovimientoCajaRepository } from '../repositories/tipo-movimiento-caja.repository';
import { MovimientoCajaRepository } from '../repositories/movimiento-caja.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import {
  CajaService,
  CajaNoEncontradaException,
  CajaYaAbiertaException,
  CajaNoAbiertaException,
  RegistroNoPerteneceASucursalException,
} from './caja.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildRegistro(overrides: Partial<cash_registers> = {}): cash_registers {
  return {
    id: 'r-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    name: 'Caja 1',
    register_type: 'pos',
    ...overrides,
  } as cash_registers;
}

function buildApertura(overrides: Partial<cash_register_openings> = {}): cash_register_openings {
  return {
    id: 'ap-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    register_id: 'r-1',
    opening_amount: 100,
    is_open: true,
    ...overrides,
  } as cash_register_openings;
}

describe('CajaService', () => {
  let registro: cash_registers | null;
  let aperturaActiva: cash_register_openings | null;
  let tiposExistentes: cash_movement_types[];
  let movimientosRegistrados: cash_movements[];
  let crearAperturaFalla: boolean;
  let cajaRegistroRepository: CajaRegistroRepository;
  let aperturaCajaRepository: AperturaCajaRepository;
  let cierreCajaRepository: CierreCajaRepository;
  let tipoMovimientoCajaRepository: TipoMovimientoCajaRepository;
  let movimientoCajaRepository: MovimientoCajaRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;

  beforeEach(() => {
    registro = buildRegistro();
    aperturaActiva = null;
    tiposExistentes = [];
    movimientosRegistrados = [];
    crearAperturaFalla = false;

    cajaRegistroRepository = {
      create: jest.fn(async () => buildRegistro()),
      findById: jest.fn(async () => registro),
      findMany: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
    } as unknown as CajaRegistroRepository;

    aperturaCajaRepository = {
      create: jest.fn(async () => {
        if (crearAperturaFalla) throw { code: 'P2002' };
        aperturaActiva = buildApertura();
        return aperturaActiva;
      }),
      findById: jest.fn(async () => aperturaActiva),
      findMany: jest.fn(async () => ({
        data: aperturaActiva ? [aperturaActiva] : [],
        meta: { page: 1, pageSize: 1, total: aperturaActiva ? 1 : 0 },
      })),
      update: jest.fn(async (_ctx: unknown, _where: unknown, data: { is_open: boolean }) => {
        aperturaActiva = aperturaActiva ? { ...aperturaActiva, ...data } : null;
        return { ...buildApertura(), ...data };
      }),
    } as unknown as AperturaCajaRepository;

    cierreCajaRepository = {
      create: jest.fn(
        async () =>
          ({
            id: 'cl-1',
            opening_id: 'ap-1',
            expected_amount: 150,
            counted_amount: 150,
          }) as unknown as cash_register_closings,
      ),
    } as unknown as CierreCajaRepository;

    tipoMovimientoCajaRepository = {
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = tiposExistentes.filter((t) => !filter.code || t.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string; direction: string }) => {
        const nuevo = { id: 't-1', ...data } as cash_movement_types;
        tiposExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as TipoMovimientoCajaRepository;

    movimientoCajaRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: { amount: number }) => {
        const mov = {
          id: `m-${movimientosRegistrados.length + 1}`,
          ...params,
        } as unknown as cash_movements;
        movimientosRegistrados.push(mov);
        return mov;
      }),
      listar: jest.fn(async () => ({
        data: movimientosRegistrados,
        meta: { page: 1, pageSize: 10000, total: movimientosRegistrados.length },
      })),
    } as unknown as MovimientoCajaRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => true),
      existeSucursalDeEmpresa: jest.fn(async () => true),
    } as unknown as EmpresaSucursalLookupRepository;
  });

  function buildService(): CajaService {
    return new CajaService(
      cajaRegistroRepository,
      aperturaCajaRepository,
      cierreCajaRepository,
      tipoMovimientoCajaRepository,
      movimientoCajaRepository,
      empresaSucursalLookupRepository,
    );
  }

  it('obtenerRegistro: caja inexistente lanza CajaNoEncontradaException', async () => {
    registro = null;
    await expect(buildService().obtenerRegistro(CONTEXT, 'r-x')).rejects.toThrow(
      CajaNoEncontradaException,
    );
  });

  it('obtenerRegistroDeSucursal: acepta cuando registerId realmente pertenece a branchId/companyId', async () => {
    const caja = await buildService().obtenerRegistroDeSucursal(
      CONTEXT,
      'r-1',
      'branch-1',
      'company-1',
    );
    expect(caja.id).toBe('r-1');
  });

  it('obtenerRegistroDeSucursal: rechaza si la caja pertenece a otra sucursal (P0-3)', async () => {
    registro = buildRegistro({ branch_id: 'branch-ajena' });
    await expect(
      buildService().obtenerRegistroDeSucursal(CONTEXT, 'r-1', 'branch-1', 'company-1'),
    ).rejects.toThrow(RegistroNoPerteneceASucursalException);
  });

  it('obtenerRegistroDeSucursal: rechaza si la caja pertenece a otra empresa (P0-3)', async () => {
    registro = buildRegistro({ company_id: 'company-ajena' });
    await expect(
      buildService().obtenerRegistroDeSucursal(CONTEXT, 'r-1', 'branch-1', 'company-1'),
    ).rejects.toThrow(RegistroNoPerteneceASucursalException);
  });

  it('abrir: caso feliz crea la apertura', async () => {
    const apertura = await buildService().abrir(CONTEXT, { registerId: 'r-1', openingAmount: 100 });
    expect(apertura.is_open).toBe(true);
  });

  it('abrir: rechaza si ya hay una apertura activa (violación de unicidad)', async () => {
    crearAperturaFalla = true;
    await expect(
      buildService().abrir(CONTEXT, { registerId: 'r-1', openingAmount: 100 }),
    ).rejects.toThrow(CajaYaAbiertaException);
  });

  it('registrarMovimiento: rechaza si la caja no está abierta', async () => {
    await expect(
      buildService().registrarMovimiento(CONTEXT, {
        registerId: 'r-1',
        movementTypeCode: 'venta_pos',
        direction: 'in',
        amount: 50,
      }),
    ).rejects.toThrow(CajaNoAbiertaException);
  });

  it('registrarMovimiento: caso feliz crea el tipo si no existe y registra el movimiento', async () => {
    aperturaActiva = buildApertura();
    const movimiento = await buildService().registrarMovimiento(CONTEXT, {
      registerId: 'r-1',
      movementTypeCode: 'venta_pos',
      direction: 'in',
      amount: 50,
    });
    expect(tipoMovimientoCajaRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ code: 'venta_pos', direction: 'in' }),
    );
    expect(movimiento.amount).toBe(50);
  });

  it('registrarMovimiento: un egreso se registra en negativo', async () => {
    aperturaActiva = buildApertura();
    const movimiento = await buildService().registrarMovimiento(CONTEXT, {
      registerId: 'r-1',
      movementTypeCode: 'retiro',
      direction: 'out',
      amount: 30,
    });
    expect(movimiento.amount).toBe(-30);
  });

  it('cerrar: calcula expected_amount = apertura + movimientos y desactiva la apertura', async () => {
    aperturaActiva = buildApertura();
    movimientosRegistrados = [
      { amount: 50 } as unknown as cash_movements,
      { amount: -10 } as unknown as cash_movements,
    ];
    const resultado = await buildService().cerrar(CONTEXT, {
      openingId: 'ap-1',
      countedAmount: 140,
    });
    expect(cierreCajaRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ expected_amount: 140, counted_amount: 140 }),
    );
    expect(resultado.apertura.is_open).toBe(false);
  });

  it('listarMovimientos: delega en el repositorio filtrando por openingId', async () => {
    movimientosRegistrados = [{ id: 'm-1', amount: 50 } as unknown as cash_movements];
    const resultado = await buildService().listarMovimientos(
      CONTEXT,
      { openingId: 'ap-1' },
      { page: 1, pageSize: 50 },
    );
    expect(movimientoCajaRepository.listar).toHaveBeenCalledWith(
      CONTEXT,
      { opening_id: 'ap-1' },
      { page: 1, pageSize: 50 },
    );
    expect(resultado.data).toHaveLength(1);
  });

  it('listarTiposMovimiento: delega en el repositorio de tipos', async () => {
    tiposExistentes = [{ id: 't-1', code: 'venta_pos', direction: 'in' } as cash_movement_types];
    const resultado = await buildService().listarTiposMovimiento(CONTEXT);
    expect(resultado.data).toHaveLength(1);
  });

  it('registrarMovimientoManual: ingreso usa el código ingreso_manual', async () => {
    aperturaActiva = buildApertura();
    await buildService().registrarMovimientoManual(CONTEXT, {
      registerId: 'r-1',
      direction: 'in',
      amount: 200,
      observations: 'Depósito inicial',
    });
    expect(tipoMovimientoCajaRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ code: 'ingreso_manual', direction: 'in' }),
    );
    expect(movimientoCajaRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ amount: 200, sourceModule: 'caja_manual' }),
    );
  });

  it('registrarMovimientoManual: egreso usa el código egreso_manual y monto negativo', async () => {
    aperturaActiva = buildApertura();
    const movimiento = await buildService().registrarMovimientoManual(CONTEXT, {
      registerId: 'r-1',
      direction: 'out',
      amount: 75,
    });
    expect(tipoMovimientoCajaRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ code: 'egreso_manual', direction: 'out' }),
    );
    expect(movimiento.amount).toBe(-75);
  });

  it('registrarMovimientoManual: rechaza si la caja no está abierta (reutiliza la misma validación)', async () => {
    await expect(
      buildService().registrarMovimientoManual(CONTEXT, {
        registerId: 'r-1',
        direction: 'in',
        amount: 100,
      }),
    ).rejects.toThrow(CajaNoAbiertaException);
  });
});
