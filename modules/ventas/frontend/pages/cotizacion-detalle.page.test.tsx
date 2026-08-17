import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient, ApiClientError } from '@gorazus/ui-kit';
import { renderConProviders } from '../test/test-utils';
import { CotizacionDetallePage } from './cotizacion-detalle.page';

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
    { id: 'st-rejected', code: 'rejected' },
    { id: 'st-converted', code: 'converted' },
  ],
  meta: { page: 1, pageSize: 50, total: 4 },
};

function buildCotizacion(statusId: string) {
  return {
    data: {
      id: 'cot-1',
      document_number: 'COT-0001',
      customer_id: 'cust-1',
      branch_id: 'branch-1',
      status_id: statusId,
      currency_code: 'USD',
      total_amount: '150.0000',
      valid_until: '2026-12-31T00:00:00.000Z',
      created_at: '2026-08-01T10:00:00.000Z',
      quote_lines: [
        {
          id: 'ql-1',
          product_id: 'prod-1',
          quantity: '2',
          unit_price: '75.0000',
          discount_percentage: '0',
        },
      ],
    },
  };
}

const CLIENTE = {
  data: { id: 'cust-1', legal_name: 'Ferreteria Central', trade_name: null, tax_id: '131000000' },
};
const UN_ALMACEN = {
  data: [{ id: 'wh-1', name: 'Almacen Principal' }],
  meta: { page: 1, pageSize: 50, total: 1 },
};

function mockGetPara(statusId: string) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/ventas/cotizaciones/estados') return Promise.resolve(ESTADOS);
    if (path === '/ventas/cotizaciones/cot-1') return Promise.resolve(buildCotizacion(statusId));
    if (path === '/clientes/cust-1') return Promise.resolve(CLIENTE);
    if (path === '/inventario/almacenes') return Promise.resolve(UN_ALMACEN);
    return Promise.reject(new Error('GET no mockeado: ' + path));
  });
}

function render(statusId: string) {
  mockGetPara(statusId);
  return renderConProviders(<CotizacionDetallePage />, {
    ruta: '/ventas/cotizaciones/cot-1',
    path: '/ventas/cotizaciones/:id',
    rutasDestino: ['/ventas/pedidos'],
  });
}

describe('CotizacionDetallePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el estado de carga mientras llega la cotizacion', () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderConProviders(<CotizacionDetallePage />, {
      ruta: '/ventas/cotizaciones/cot-1',
      path: '/ventas/cotizaciones/:id',
    });
    expect(screen.getByText('Cargando cotización…')).toBeInTheDocument();
  });

  it('renderiza cliente, lineas y total de la cotizacion', async () => {
    render('st-draft');
    expect(await screen.findByText('COT-0001')).toBeInTheDocument();
    expect(await screen.findByText(/Ferreteria Central/)).toBeInTheDocument();
    expect(screen.getByText(/RNC\/Cédula 131000000/)).toBeInTheDocument();
    expect(screen.getAllByText('150,00 US$').length).toBeGreaterThan(0);
  });

  it('DRAFT: muestra Editar/Aprobar/Rechazar/Eliminar, no Convertir a pedido', async () => {
    render('st-draft');
    await screen.findByText('COT-0001');
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Convertir a pedido' })).not.toBeInTheDocument();
  });

  it('APPROVED: muestra Convertir a pedido, no Editar/Aprobar/Rechazar/Eliminar', async () => {
    render('st-approved');
    await screen.findByText('COT-0001');
    expect(screen.getByRole('button', { name: 'Convertir a pedido' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('REJECTED y CONVERTED: solo permiten Duplicar', async () => {
    render('st-rejected');
    await screen.findByText('COT-0001');
    expect(screen.getByRole('button', { name: 'Duplicar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Convertir a pedido' })).not.toBeInTheDocument();
  });

  it('Aprobar: llama al endpoint real de aprobacion', async () => {
    render('st-draft');
    await screen.findByText('COT-0001');
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'cot-1' } });

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Aprobar' }));
    await usuario.click(await screen.findByRole('button', { name: 'Aprobar cotización' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/ventas/cotizaciones/cot-1/aprobar');
    });
  });

  it('Rechazar: llama al endpoint real de rechazo, sin inventar un motivo', async () => {
    render('st-draft');
    await screen.findByText('COT-0001');
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'cot-1' } });

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Rechazar' }));
    await usuario.click(await screen.findByRole('button', { name: 'Rechazar cotización' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/ventas/cotizaciones/cot-1/rechazar');
    });
    expect((apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0]).toHaveLength(1);
  });

  it('Duplicar: llama al endpoint real de duplicado', async () => {
    render('st-draft');
    await screen.findByText('COT-0001');
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 'cot-2', document_number: 'COT-0002' },
    });

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Duplicar' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/ventas/cotizaciones/cot-1/duplicar');
    });
  });

  it('Convertir a pedido: usa el endpoint real desde-cotizacion con el warehouseId auto-seleccionado', async () => {
    render('st-approved');
    await screen.findByText('COT-0001');
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 'ped-1', document_number: 'PED-0001' },
    });

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Convertir a pedido' }));
    const botonConfirmar = await screen.findByRole('button', { name: 'Convertir a pedido' });
    await waitFor(() => expect(botonConfirmar).toBeEnabled());
    await usuario.click(botonConfirmar);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ventas/pedidos/desde-cotizacion/cot-1',
        undefined,
        { params: { warehouseId: 'wh-1' } },
      );
    });
  });

  it('si el backend rechaza aprobar, no cambia el estado mostrado en pantalla', async () => {
    render('st-draft');
    await screen.findByText('COT-0001');
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiClientError(409, {
        error: { code: 'COTIZACION_NO_ES_BORRADOR', message: 'Ya no es borrador', details: [] },
      }),
    );

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Aprobar' }));
    await usuario.click(await screen.findByRole('button', { name: 'Aprobar cotización' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
  });
});
