import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient, useAppStore } from '@gorazus/ui-kit';
import { renderConProviders } from '../test/test-utils';
import { CotizacionFormPage } from './cotizacion-form.page';

vi.mock('@gorazus/ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gorazus/ui-kit')>();
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const ESTADOS = {
  data: [
    { id: 'st-draft', code: 'draft' },
    { id: 'st-approved', code: 'approved' },
  ],
  meta: { page: 1, pageSize: 50, total: 2 },
};

const PRODUCTOS = {
  data: [{ id: 'prod-1', sku: 'TORNILLO-1', list_price: '25.0000', base_unit_id: 'u-1' }],
  meta: { page: 1, pageSize: 100, total: 1 },
};

const MONEDAS = {
  data: [{ id: 'mon-1', iso_code: 'USD', symbol: '$' }],
  meta: { page: 1, pageSize: 50, total: 1 },
};

const CLIENTES_BUSQUEDA = {
  data: [{ id: 'cust-1', legal_name: 'Ferreteria Central', tax_id: '131000000' }],
  meta: { page: 1, pageSize: 20, total: 1 },
};

function mockGetComun() {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/ventas/cotizaciones/estados') return Promise.resolve(ESTADOS);
    if (path === '/productos') return Promise.resolve(PRODUCTOS);
    if (path === '/configuracion/monedas') return Promise.resolve(MONEDAS);
    if (path === '/clientes') return Promise.resolve(CLIENTES_BUSQUEDA);
    return Promise.reject(new Error('GET no mockeado: ' + path));
  });
}

describe('CotizacionFormPage — crear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
    mockGetComun();
  });

  it('crea una cotizacion nueva: cliente + producto + moneda -> POST con el payload correcto', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 'cot-nueva', document_number: 'COT-0099' },
    });

    renderConProviders(<CotizacionFormPage />, {
      ruta: '/ventas/cotizaciones/nueva',
      path: '/ventas/cotizaciones/nueva',
      rutasDestino: ['/ventas/cotizaciones/:id'],
    });

    const usuario = userEvent.setup();

    const buscadorCliente = await screen.findByLabelText('Cliente');
    await usuario.type(buscadorCliente, 'Ferre');
    const opcionCliente = await screen.findByText('Ferreteria Central');
    await usuario.click(opcionCliente);

    const selectMoneda = screen.getByLabelText('Moneda');
    await usuario.selectOptions(selectMoneda, 'USD');

    const botonProducto = await screen.findByText('TORNILLO-1');
    await usuario.click(botonProducto);

    expect(await screen.findByText('25.00')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Guardar cotización' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ventas/cotizaciones',
        expect.objectContaining({
          companyId: 'company-1',
          branchId: 'branch-1',
          customerId: 'cust-1',
          currencyCode: 'USD',
          lines: [expect.objectContaining({ productId: 'prod-1', quantity: 1, unitPrice: 25 })],
        }),
      );
    });
  });

  it('no permite guardar sin cliente ni productos', async () => {
    renderConProviders(<CotizacionFormPage />, {
      ruta: '/ventas/cotizaciones/nueva',
      path: '/ventas/cotizaciones/nueva',
    });
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Guardar cotización' }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});

const COTIZACION_DRAFT = {
  data: {
    id: 'cot-1',
    document_number: 'COT-0001',
    customer_id: 'cust-1',
    branch_id: 'branch-1',
    status_id: 'st-draft',
    currency_code: 'USD',
    total_amount: '50.0000',
    valid_until: null,
    created_at: '2026-08-01T10:00:00.000Z',
    quote_lines: [
      {
        id: 'ql-1',
        product_id: 'prod-1',
        quantity: '2',
        unit_price: '25.0000',
        discount_percentage: '0',
      },
    ],
  },
};

const COTIZACION_APROBADA = {
  ...COTIZACION_DRAFT,
  data: { ...COTIZACION_DRAFT.data, status_id: 'st-approved' },
};
const CLIENTE_UNO = {
  data: { id: 'cust-1', legal_name: 'Ferreteria Central', trade_name: null, tax_id: '131000000' },
};

describe('CotizacionFormPage — editar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
  });

  it('permite editar y guardar una cotizacion en borrador (PUT con salespersonId/validUntil/lines)', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/ventas/cotizaciones/estados') return Promise.resolve(ESTADOS);
      if (path === '/ventas/cotizaciones/cot-1') return Promise.resolve(COTIZACION_DRAFT);
      if (path === '/clientes/cust-1') return Promise.resolve(CLIENTE_UNO);
      if (path === '/productos') return Promise.resolve(PRODUCTOS);
      return Promise.reject(new Error('GET no mockeado: ' + path));
    });
    (apiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: COTIZACION_DRAFT.data });

    renderConProviders(<CotizacionFormPage />, {
      ruta: '/ventas/cotizaciones/cot-1/editar',
      path: '/ventas/cotizaciones/:id/editar',
      rutasDestino: ['/ventas/cotizaciones/:id'],
    });

    expect(await screen.findByText('Editar cotización')).toBeInTheDocument();
    await screen.findByText('TORNILLO-1');

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Guardar cotización' }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(
        '/ventas/cotizaciones/cot-1',
        expect.objectContaining({
          lines: [expect.objectContaining({ productId: 'prod-1', quantity: 2, unitPrice: 25 })],
        }),
      );
    });
  });

  it('bloquea la edicion cuando la cotizacion ya no esta en borrador', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/ventas/cotizaciones/estados') return Promise.resolve(ESTADOS);
      if (path === '/ventas/cotizaciones/cot-1') return Promise.resolve(COTIZACION_APROBADA);
      if (path === '/clientes/cust-1') return Promise.resolve(CLIENTE_UNO);
      if (path === '/productos') return Promise.resolve(PRODUCTOS);
      return Promise.reject(new Error('GET no mockeado: ' + path));
    });

    renderConProviders(<CotizacionFormPage />, {
      ruta: '/ventas/cotizaciones/cot-1/editar',
      path: '/ventas/cotizaciones/:id/editar',
    });

    expect(await screen.findByText(/ya no es un borrador/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar cotización' })).not.toBeInTheDocument();
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});
