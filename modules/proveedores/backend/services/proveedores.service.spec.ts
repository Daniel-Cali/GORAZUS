import type { UserContext } from '@gorazus/contracts';
import type { suppliers, PaginatedResult } from '@gorazus/core-database';
import { ProveedorRepository } from '../repositories/proveedor.repository';
import { EmpresaLookupRepository } from '../repositories/empresa-lookup.repository';
import { SupplierBlockHistoryRepository } from '../repositories/supplier-block-history.repository';
import {
  ProveedoresService,
  ProveedorNoEncontradoException,
  EmpresaInvalidaException,
  ProveedorYaBloqueadoException,
  ProveedorNoBloqueadoException,
} from './proveedores.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildProveedor(overrides: Partial<suppliers> = {}): suppliers {
  return {
    id: 'sup1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: 'branch-1',
    legal_name: 'Ferretería El Tornillo SRL',
    trade_name: null,
    tax_id: 'RNC-001',
    payment_terms_days: 30,
    is_blocked: false,
    block_reason: null,
    classification_id: null,
    ...overrides,
  } as suppliers;
}

describe('ProveedoresService', () => {
  let proveedores: Map<string, suppliers>;
  let empresaValida: boolean;
  let proveedorRepository: ProveedorRepository;
  let empresaLookupRepository: EmpresaLookupRepository;
  let supplierBlockHistoryRepository: SupplierBlockHistoryRepository;

  beforeEach(() => {
    proveedores = new Map([['sup1', buildProveedor()]]);
    empresaValida = true;

    proveedorRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => proveedores.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<suppliers>) => {
        const data = [...proveedores.values()].filter(
          (p) => filter.is_blocked === undefined || p.is_blocked === filter.is_blocked,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<suppliers>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<suppliers>) => {
        const nuevo = buildProveedor({ id: 'sup-nuevo', ...data });
        proveedores.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<suppliers>) => {
        const actual = proveedores.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizado = { ...actual, ...data };
        proveedores.set(where.id, actualizado);
        return actualizado;
      }),
    } as unknown as ProveedorRepository;

    empresaLookupRepository = {
      existeEmpresa: jest.fn(async () => empresaValida),
    } as unknown as EmpresaLookupRepository;

    supplierBlockHistoryRepository = {
      registrar: jest.fn(async (_ctx: unknown, params: unknown) => params),
    } as unknown as SupplierBlockHistoryRepository;
  });

  function buildService(): ProveedoresService {
    return new ProveedoresService(
      proveedorRepository,
      empresaLookupRepository,
      supplierBlockHistoryRepository,
    );
  }

  const inputBase = {
    companyId: 'company-1',
    legalName: 'Nuevo Proveedor SRL',
    taxId: 'RNC-002',
    paymentTermsDays: 15,
  };

  it('crear: rechaza si la empresa no existe', async () => {
    empresaValida = false;
    await expect(buildService().crear(CONTEXT, inputBase)).rejects.toThrow(
      EmpresaInvalidaException,
    );
  });

  it('crear: rechaza razón social vacía (invariante de entidad)', async () => {
    await expect(buildService().crear(CONTEXT, { ...inputBase, legalName: '   ' })).rejects.toThrow(
      'razón social del proveedor no puede estar vacía',
    );
  });

  it('crear: caso feliz', async () => {
    const proveedor = await buildService().crear(CONTEXT, inputBase);
    expect(proveedor.legal_name).toBe('Nuevo Proveedor SRL');
    expect(proveedor.is_blocked).toBe(false);
  });

  it('obtener: proveedor inexistente lanza ProveedorNoEncontradoException', async () => {
    await expect(buildService().obtener(CONTEXT, 'no-existe')).rejects.toThrow(
      ProveedorNoEncontradoException,
    );
  });

  it('listar: filtra por isBlocked', async () => {
    proveedores.set('sup2', buildProveedor({ id: 'sup2', is_blocked: true }));
    const resultado = await buildService().listar(CONTEXT, true, { page: 1, pageSize: 20 });
    expect(resultado.data).toHaveLength(1);
    expect(resultado.data[0]?.id).toBe('sup2');
  });

  it('actualizar: PATCH parcial no reasigna taxId', async () => {
    const proveedor = await buildService().actualizar(CONTEXT, 'sup1', {
      paymentTermsDays: 45,
    });
    expect(proveedor.tax_id).toBe('RNC-001');
    expect(proveedor.payment_terms_days).toBe(45);
  });

  it('actualizar: rechaza dejar la razón social vacía vía PATCH', async () => {
    await expect(buildService().actualizar(CONTEXT, 'sup1', { legalName: '  ' })).rejects.toThrow(
      'razón social del proveedor no puede estar vacía',
    );
  });

  it('bloquear: marca is_blocked y registra el historial', async () => {
    const proveedor = await buildService().bloquear(CONTEXT, 'sup1', 'Incumplimiento de entrega');
    expect(proveedor.is_blocked).toBe(true);
    expect(proveedor.block_reason).toBe('Incumplimiento de entrega');
    expect(supplierBlockHistoryRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        supplierId: 'sup1',
        companyId: 'company-1',
        action: 'blocked',
      }),
    );
  });

  it('bloquear: rechaza si ya está bloqueado', async () => {
    proveedores.set('sup1', buildProveedor({ is_blocked: true }));
    await expect(buildService().bloquear(CONTEXT, 'sup1', null)).rejects.toThrow(
      ProveedorYaBloqueadoException,
    );
  });

  it('desbloquear: limpia is_blocked/block_reason y registra el historial', async () => {
    proveedores.set('sup1', buildProveedor({ is_blocked: true, block_reason: 'motivo previo' }));
    const proveedor = await buildService().desbloquear(CONTEXT, 'sup1', 'Regularizado');
    expect(proveedor.is_blocked).toBe(false);
    expect(proveedor.block_reason).toBeNull();
    expect(supplierBlockHistoryRepository.registrar).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ supplierId: 'sup1', action: 'unblocked' }),
    );
  });

  it('desbloquear: rechaza si no está bloqueado', async () => {
    await expect(buildService().desbloquear(CONTEXT, 'sup1', null)).rejects.toThrow(
      ProveedorNoBloqueadoException,
    );
  });
});
