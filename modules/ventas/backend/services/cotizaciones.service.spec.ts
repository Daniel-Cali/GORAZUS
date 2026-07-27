import type { UserContext } from '@gorazus/contracts';
import type { quote_status } from '@gorazus/core-database';
import {
  CotizacionRepository,
  type CotizacionConLineas,
} from '../repositories/cotizacion.repository';
import { EstadoCotizacionRepository } from '../repositories/estado-cotizacion.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import {
  CotizacionesService,
  CotizacionInvalidaException,
  CotizacionNoEsBorradorException,
  CotizacionVencidaException,
  CotizacionYaConvertidaException,
} from './cotizaciones.service';
import type { CrearCotizacionInput } from '../validators/cotizaciones.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildCotizacion(overrides: Partial<CotizacionConLineas> = {}): CotizacionConLineas {
  return {
    id: 'cot-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    salesperson_id: null,
    status_id: 'st-draft',
    currency_code: 'USD',
    total_amount: 100,
    valid_until: null,
    quote_lines: [
      { id: 'l-1', product_id: 'p-1', quantity: 2, unit_price: 50, discount_percentage: 0 },
    ],
    ...overrides,
  } as unknown as CotizacionConLineas;
}

describe('CotizacionesService', () => {
  let cotizacion: CotizacionConLineas;
  let estadosExistentes: quote_status[];
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let clienteValido: boolean;
  let productoValido: boolean;
  let cotizacionRepository: CotizacionRepository;
  let estadoCotizacionRepository: EstadoCotizacionRepository;
  let clienteLookupRepository: ClienteLookupRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;

  beforeEach(() => {
    cotizacion = buildCotizacion();
    empresaValida = true;
    sucursalValida = true;
    clienteValido = true;
    productoValido = true;
    estadosExistentes = [
      { id: 'st-draft', code: 'draft' } as quote_status,
      { id: 'st-approved', code: 'approved' } as quote_status,
      { id: 'st-rejected', code: 'rejected' } as quote_status,
      { id: 'st-converted', code: 'converted' } as quote_status,
    ];

    cotizacionRepository = {
      crear: jest.fn(async () => cotizacion),
      obtener: jest.fn(async () => cotizacion),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        cotizacion = { ...cotizacion, status_id: statusId };
        return cotizacion;
      }),
      actualizar: jest.fn(async () => cotizacion),
      eliminar: jest.fn(async () => ({ ...cotizacion, deleted_at: new Date() })),
    } as unknown as CotizacionRepository;

    estadoCotizacionRepository = {
      findById: jest.fn(
        async (_ctx: unknown, { id }: { id: string }) =>
          estadosExistentes.find((e) => e.id === id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string }) => {
        const nuevo = { id: `st-${data.code}`, ...data } as quote_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoCotizacionRepository;

    clienteLookupRepository = {
      existeCliente: jest.fn(async () => clienteValido),
    } as unknown as ClienteLookupRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;
  });

  function buildService(): CotizacionesService {
    return new CotizacionesService(
      cotizacionRepository,
      estadoCotizacionRepository,
      clienteLookupRepository,
      productoLookupRepository,
      empresaSucursalLookupRepository,
    );
  }

  function baseInput(overrides: Partial<CrearCotizacionInput> = {}): CrearCotizacionInput {
    return {
      companyId: 'company-1',
      branchId: 'branch-1',
      customerId: 'cust-1',
      currencyCode: 'USD',
      lines: [{ productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      ...overrides,
    };
  }

  it('crear: caso feliz arranca en draft', async () => {
    const service = buildService();
    await service.crear(CONTEXT, baseInput());
    expect(cotizacionRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ statusId: 'st-draft', totalAmount: 100 }),
    );
  });

  it('crear: rechaza cliente inválido', async () => {
    clienteValido = false;
    const service = buildService();
    await expect(service.crear(CONTEXT, baseInput())).rejects.toThrow(CotizacionInvalidaException);
  });

  it('crear: rechaza producto inválido', async () => {
    productoValido = false;
    const service = buildService();
    await expect(service.crear(CONTEXT, baseInput())).rejects.toThrow(CotizacionInvalidaException);
  });

  it('aprobar: draft pasa a approved', async () => {
    const service = buildService();
    const resultado = await service.aprobar(CONTEXT, 'cot-1');
    expect(resultado.status_id).toBe('st-approved');
  });

  it('aprobar: rechaza si ya no es borrador', async () => {
    cotizacion = buildCotizacion({ status_id: 'st-approved' });
    const service = buildService();
    await expect(service.aprobar(CONTEXT, 'cot-1')).rejects.toThrow(
      CotizacionNoEsBorradorException,
    );
  });

  it('rechazar: draft pasa a rejected', async () => {
    const service = buildService();
    const resultado = await service.rechazar(CONTEXT, 'cot-1');
    expect(resultado.status_id).toBe('st-rejected');
  });

  it('duplicar: crea una cotización nueva con las mismas líneas', async () => {
    const service = buildService();
    await service.duplicar(CONTEXT, 'cot-1');
    expect(cotizacionRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        customerId: 'cust-1',
        lines: [{ productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      }),
    );
  });

  it('validarConvertible: aprobada y vigente pasa', async () => {
    cotizacion = buildCotizacion({ status_id: 'st-approved' });
    const service = buildService();
    await expect(service.validarConvertible(CONTEXT, 'cot-1')).resolves.toBe(cotizacion);
  });

  it('validarConvertible: rechaza si todavía es borrador', async () => {
    const service = buildService();
    await expect(service.validarConvertible(CONTEXT, 'cot-1')).rejects.toThrow(
      CotizacionInvalidaException,
    );
  });

  it('validarConvertible: rechaza si ya fue convertida', async () => {
    cotizacion = buildCotizacion({ status_id: 'st-converted' });
    const service = buildService();
    await expect(service.validarConvertible(CONTEXT, 'cot-1')).rejects.toThrow(
      CotizacionYaConvertidaException,
    );
  });

  it('validarConvertible: rechaza si venció', async () => {
    cotizacion = buildCotizacion({
      status_id: 'st-approved',
      valid_until: new Date(Date.now() - 86400000),
    });
    const service = buildService();
    await expect(service.validarConvertible(CONTEXT, 'cot-1')).rejects.toThrow(
      CotizacionVencidaException,
    );
  });
});
