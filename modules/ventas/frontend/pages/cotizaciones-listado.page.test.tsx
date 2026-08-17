import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient, useAppStore } from '@gorazus/ui-kit';
import { renderConProviders } from '../test/test-utils';
import { CotizacionesListadoPage } from './cotizaciones-listado.page';

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

const COTIZACION_ROW = {
  id: 'cot-1',
  document_number: 'COT-0001',
  customer_id: 'cust-1',
  branch_id: 'branch-1',
  status_id: 'st-draft',
  currency_code: 'USD',
  total_amount: '150.0000',
  valid_until: '2026-12-31T00:00:00.000Z',
  created_at: '2026-08-01T10:00:00.000Z',
};

function mockGet(respuestas: Record<string, { data: unknown; meta?: unknown }>) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    for (const [prefix, respuesta] of Object.entries(respuestas)) {
      if (path.startsWith(prefix)) return Promise.resolve(respuesta);
    }
    return Promise.reject(new Error(`GET no mockeado: ${path}`));
  });
}

describe('CotizacionesListadoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
  });

  it('muestra el título mientras llegan las cotizaciones (estado de carga)', () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderConProviders(<CotizacionesListadoPage />);
    expect(screen.getByText('Cotizaciones')).toBeInTheDocument();
  });

  it('muestra un mensaje vacío cuando no hay cotizaciones', async () => {
    mockGet({
      '/ventas/cotizaciones/estados': ESTADOS,
      '/ventas/cotizaciones': { data: [], meta: { page: 1, pageSize: 20, total: 0 } },
    });
    renderConProviders(<CotizacionesListadoPage />);
    expect(
      await screen.findByText('No hay cotizaciones registradas con estos filtros.'),
    ).toBeInTheDocument();
  });

  it('renderiza documento, total y estado de cada cotización', async () => {
    mockGet({
      '/ventas/cotizaciones/estados': ESTADOS,
      '/ventas/cotizaciones': { data: [COTIZACION_ROW], meta: { page: 1, pageSize: 20, total: 1 } },
    });
    renderConProviders(<CotizacionesListadoPage />);

    expect(await screen.findByText('COT-0001')).toBeInTheDocument();
    expect(screen.getByText('150,00 US$')).toBeInTheDocument();
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0);
  });

  it('la fila de una cotización es interactiva (navega al detalle vía onRowClick)', async () => {
    mockGet({
      '/ventas/cotizaciones/estados': ESTADOS,
      '/ventas/cotizaciones': { data: [COTIZACION_ROW], meta: { page: 1, pageSize: 20, total: 1 } },
    });
    renderConProviders(<CotizacionesListadoPage />, {
      ruta: '/ventas/cotizaciones',
      path: '/ventas/cotizaciones',
      rutasDestino: ['/ventas/cotizaciones/:id'],
    });

    const usuario = userEvent.setup();
    const fila = await screen.findByText('COT-0001');
    expect(fila.closest('tr')).toHaveClass('cursor-pointer');
    await usuario.click(fila);
  });

  it('el botón "Nueva cotización" existe como botón accesible', async () => {
    mockGet({
      '/ventas/cotizaciones/estados': ESTADOS,
      '/ventas/cotizaciones': { data: [], meta: { page: 1, pageSize: 20, total: 0 } },
    });
    renderConProviders(<CotizacionesListadoPage />);
    expect(await screen.findByRole('button', { name: 'Nueva cotización' })).toBeInTheDocument();
  });
});
