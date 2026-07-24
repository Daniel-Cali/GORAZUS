import type { UserContext } from '@gorazus/contracts';
import type { invoice_status, PaginatedResult } from '@gorazus/core-database';
import { FacturaRepository, type FacturaConLineas } from '../repositories/factura.repository';
import { EstadoFacturaRepository } from '../repositories/estado-factura.repository';
import { ReciboRepository, type ReciboConAllocations } from '../repositories/recibo.repository';
import { ProductoLookupRepository } from '../repositories/producto-lookup.repository';
import { ClienteLookupRepository } from '../repositories/cliente-lookup.repository';
import { EmpresaSucursalLookupRepository } from '../repositories/empresa-sucursal-lookup.repository';
import { TasaImpuestoLookupRepository } from '../repositories/tasa-impuesto-lookup.repository';
import {
  VentasService,
  EmpresaInvalidaException,
  ClienteInvalidoException,
  ProductoInvalidoException,
  FacturaNoEncontradaException,
} from './ventas.service';
import type { CrearFacturaInput } from '../validators/facturas.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildFactura(overrides: Partial<FacturaConLineas> = {}): FacturaConLineas {
  return {
    id: 'f-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    customer_id: 'cust-1',
    status_id: 's-draft',
    subtotal_amount: 100,
    tax_amount: 0,
    total_amount: 100,
    invoice_lines: [],
    ...overrides,
  } as FacturaConLineas;
}

describe('VentasService', () => {
  let empresaValida: boolean;
  let sucursalValida: boolean;
  let clienteValido: boolean;
  let productoValido: boolean;
  let tasaVigente: number | null;
  let factura: FacturaConLineas;
  let estadosExistentes: invoice_status[];
  let facturaRepository: FacturaRepository;
  let estadoFacturaRepository: EstadoFacturaRepository;
  let reciboRepository: ReciboRepository;
  let productoLookupRepository: ProductoLookupRepository;
  let clienteLookupRepository: ClienteLookupRepository;
  let empresaSucursalLookupRepository: EmpresaSucursalLookupRepository;
  let tasaImpuestoLookupRepository: TasaImpuestoLookupRepository;

  beforeEach(() => {
    empresaValida = true;
    sucursalValida = true;
    clienteValido = true;
    productoValido = true;
    tasaVigente = null;
    factura = buildFactura();
    estadosExistentes = [];

    facturaRepository = {
      crear: jest.fn(async () => factura),
      obtener: jest.fn(async () => factura),
      listar: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
      actualizarEstado: jest.fn(async (_ctx: unknown, _id: string, statusId: string) => {
        factura = { ...factura, status_id: statusId };
        return factura;
      }),
    } as unknown as FacturaRepository;

    estadoFacturaRepository = {
      findMany: jest.fn(async (_ctx: unknown, filter: { code?: string }) => {
        const data = estadosExistentes.filter((e) => !filter.code || e.code === filter.code);
        return { data, meta: { page: 1, pageSize: 1, total: data.length } };
      }),
      create: jest.fn(async (_ctx: unknown, data: { code: string; is_final: boolean }) => {
        const nuevo = { id: `st-${data.code}`, ...data } as invoice_status;
        estadosExistentes.push(nuevo);
        return nuevo;
      }),
    } as unknown as EstadoFacturaRepository;

    reciboRepository = {
      crear: jest.fn(
        async () => ({ id: 'r-1', receipt_allocations: [] }) as unknown as ReciboConAllocations,
      ),
      listarPorFactura: jest.fn(async () => []),
    } as unknown as ReciboRepository;

    productoLookupRepository = {
      existeProducto: jest.fn(async () => productoValido),
    } as unknown as ProductoLookupRepository;

    clienteLookupRepository = {
      existeCliente: jest.fn(async () => clienteValido),
    } as unknown as ClienteLookupRepository;

    empresaSucursalLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
      existeSucursalDeEmpresa: jest.fn(async () => sucursalValida),
    } as unknown as EmpresaSucursalLookupRepository;

    tasaImpuestoLookupRepository = {
      tasaVigente: jest.fn(async () => tasaVigente),
    } as unknown as TasaImpuestoLookupRepository;
  });

  function buildService(): VentasService {
    return new VentasService(
      facturaRepository,
      estadoFacturaRepository,
      reciboRepository,
      productoLookupRepository,
      clienteLookupRepository,
      empresaSucursalLookupRepository,
      tasaImpuestoLookupRepository,
    );
  }

  function baseInput(overrides: Partial<CrearFacturaInput> = {}): CrearFacturaInput {
    return {
      companyId: 'company-1',
      branchId: 'branch-1',
      customerId: 'cust-1',
      salesChannel: 'pos',
      currencyCode: 'USD',
      lines: [{ productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      ...overrides,
    };
  }

  it('crearFactura: rechaza empresa inválida', async () => {
    empresaValida = false;
    await expect(buildService().crearFactura(CONTEXT, baseInput())).rejects.toThrow(
      EmpresaInvalidaException,
    );
  });

  it('crearFactura: rechaza cliente inválido', async () => {
    clienteValido = false;
    await expect(buildService().crearFactura(CONTEXT, baseInput())).rejects.toThrow(
      ClienteInvalidoException,
    );
  });

  it('crearFactura: rechaza producto inválido', async () => {
    productoValido = false;
    await expect(buildService().crearFactura(CONTEXT, baseInput())).rejects.toThrow(
      ProductoInvalidoException,
    );
  });

  it('crearFactura: calcula subtotal/total sin impuesto si la línea no tiene taxId', async () => {
    await buildService().crearFactura(CONTEXT, baseInput());
    expect(facturaRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ subtotalAmount: 100, taxAmount: 0, totalAmount: 100 }),
    );
  });

  it('crearFactura: aplica la tasa vigente cuando la línea tiene taxId', async () => {
    tasaVigente = 15;
    await buildService().crearFactura(
      CONTEXT,
      baseInput({
        lines: [
          { productId: 'p-1', quantity: 2, unitPrice: 50, taxId: 'tax-1', discountPercentage: 0 },
        ],
      }),
    );
    expect(facturaRepository.crear).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ subtotalAmount: 100, taxAmount: 15, totalAmount: 115 }),
    );
  });

  it('obtener: factura inexistente lanza FacturaNoEncontradaException', async () => {
    (facturaRepository.obtener as jest.Mock).mockResolvedValueOnce(null);
    await expect(buildService().obtener(CONTEXT, 'f-x')).rejects.toThrow(
      FacturaNoEncontradaException,
    );
  });

  it('confirmarFactura: pasa a issued', async () => {
    const actualizada = await buildService().confirmarFactura(CONTEXT, 'f-1');
    expect(actualizada.status_id).toBe('st-issued');
  });

  it('registrarRecibo: delega en el repositorio', async () => {
    const recibo = await buildService().registrarRecibo(CONTEXT, {
      companyId: 'company-1',
      branchId: 'branch-1',
      customerId: 'cust-1',
      invoiceId: 'f-1',
      paymentFormId: 'pf-1',
      amount: 100,
    });
    expect(reciboRepository.crear).toHaveBeenCalled();
    expect(recibo.id).toBe('r-1');
  });
});
