import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiClient, useAppStore } from '@gorazus/ui-kit';
import { renderConProviders } from '../test/test-utils';
import { CajaPage } from './caja.page';

vi.mock('@gorazus/ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gorazus/ui-kit')>();
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const EMPRESAS = {
  data: [{ id: 'company-1', functional_currency_code: 'USD' }],
  meta: { page: 1, pageSize: 50, total: 1 },
};
const UNA_CAJA = {
  data: [
    {
      id: 'caja-1',
      company_id: 'company-1',
      branch_id: 'branch-1',
      name: 'Caja Principal',
      register_type: 'pos',
    },
  ],
  meta: { page: 1, pageSize: 50, total: 1 },
};
const DOS_CAJAS = {
  data: [
    {
      id: 'caja-1',
      company_id: 'company-1',
      branch_id: 'branch-1',
      name: 'Caja Principal',
      register_type: 'pos',
    },
    {
      id: 'caja-2',
      company_id: 'company-1',
      branch_id: 'branch-1',
      name: 'Caja Secundaria',
      register_type: 'pos',
    },
  ],
  meta: { page: 1, pageSize: 50, total: 2 },
};
const SIN_APERTURA = { data: null };
const APERTURA_ABIERTA = {
  data: {
    id: 'ap-1',
    register_id: 'caja-1',
    opening_amount: '100.0000',
    is_open: true,
    opened_by_user_id: 'user-1',
    created_at: '2026-08-10T08:00:00.000Z',
  },
};
const TIPOS_MOVIMIENTO = {
  data: [
    { id: 'tm-venta', code: 'cobro_venta_pos', direction: 'in' },
    { id: 'tm-in', code: 'ingreso_manual', direction: 'in' },
    { id: 'tm-out', code: 'egreso_manual', direction: 'out' },
  ],
  meta: { page: 1, pageSize: 50, total: 3 },
};
const MOVIMIENTOS = {
  data: [
    {
      id: 'mov-1',
      register_id: 'caja-1',
      opening_id: 'ap-1',
      movement_type_id: 'tm-venta',
      amount: '80.0000',
      source_module: 'pos',
      observations: null,
      created_by: 'user-1',
      created_at: '2026-08-10T09:00:00.000Z',
    },
    {
      id: 'mov-2',
      register_id: 'caja-1',
      opening_id: 'ap-1',
      movement_type_id: 'tm-out',
      amount: '-20.0000',
      source_module: 'caja_manual',
      observations: 'Compra de insumos',
      created_by: 'user-1',
      created_at: '2026-08-10T09:30:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 200, total: 2 },
};

function mockGet(overrides: Record<string, unknown> = {}) {
  const respuestas: Record<string, unknown> = {
    '/configuracion/empresas': EMPRESAS,
    '/caja/registros': UNA_CAJA,
    '/caja/registros/caja-1/apertura-activa': SIN_APERTURA,
    '/caja/tipos-movimiento': TIPOS_MOVIMIENTO,
    '/caja/movimientos': MOVIMIENTOS,
    ...overrides,
  };
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    // Prefijo mas largo (mas especifico) primero — "/caja/registros/:id/apertura-activa"
    // tambien empieza con "/caja/registros", así que el orden de chequeo importa.
    const prefijos = Object.keys(respuestas).sort((a, b) => b.length - a.length);
    for (const prefix of prefijos) {
      if (path.startsWith(prefix)) return Promise.resolve(respuestas[prefix]);
    }
    return Promise.reject(new Error('GET no mockeado: ' + path));
  });
}

function renderCaja() {
  return renderConProviders(<CajaPage />);
}

describe('CajaPage — seleccion y estado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
  });

  it('sin sucursal activa muestra el mensaje correspondiente', () => {
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: null });
    mockGet();
    renderCaja();
    expect(screen.getByText('No hay sucursal activa en la sesión.')).toBeInTheDocument();
  });

  it('con una sola caja, la auto-selecciona y muestra el estado CERRADA', async () => {
    mockGet();
    renderCaja();
    // La auto-seleccion depende de dos actualizaciones de estado encadenadas
    // (useQuery resuelve -> useEffect corre). waitFor reintenta hasta que las
    // tres aserciones pasan a la vez, evitando afirmar sobre un estado
    // intermedio mientras sigue manteniendo cada actualizacion envuelta en
    // act(...).
    await waitFor(() => {
      expect(screen.getByText('Caja Principal')).toBeInTheDocument();
      expect(screen.getByText('CERRADA')).toBeInTheDocument();
      expect(screen.getByText('No hay una caja abierta en este registro.')).toBeInTheDocument();
    });
  });

  it('con varias cajas, muestra un selector y permite elegir una', async () => {
    mockGet({ '/caja/registros': DOS_CAJAS });
    renderCaja();
    expect(await screen.findByText('Elegí una caja para continuar.')).toBeInTheDocument();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole('button', { name: 'Caja Secundaria' }));
    expect(await screen.findByRole('heading', { name: 'Caja Secundaria' })).toBeInTheDocument();
  });

  it('con apertura activa, muestra ABIERTA y la informacion de apertura', async () => {
    mockGet({ '/caja/registros/caja-1/apertura-activa': APERTURA_ABIERTA });
    renderCaja();
    expect(await screen.findByText('ABIERTA')).toBeInTheDocument();
    expect(screen.getByText(/Por USER-1/)).toBeInTheDocument();
  });
});

describe('CajaPage — abrir caja', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
  });

  it('abre el dialogo y llama al endpoint real de apertura con el monto ingresado', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: APERTURA_ABIERTA.data });
    renderCaja();

    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Abrir caja' }));
    const inputMonto = await screen.findByLabelText('Monto de apertura');
    await usuario.clear(inputMonto);
    await usuario.type(inputMonto, '500');
    await usuario.click(screen.getByRole('button', { name: 'Abrir caja' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/caja/aperturas', {
        registerId: 'caja-1',
        openingAmount: 500,
      });
    });
  });
});

describe('CajaPage — movimientos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
    mockGet({ '/caja/registros/caja-1/apertura-activa': APERTURA_ABIERTA });
  });

  it('renderiza la lista de movimientos con tipo, descripcion y monto', async () => {
    renderCaja();
    expect(await screen.findByText('cobro_venta_pos')).toBeInTheDocument();
    expect(screen.getByText('Compra de insumos')).toBeInTheDocument();
    expect(screen.getAllByText('80,00 US$').length).toBeGreaterThan(0);
  });

  it('Agregar efectivo envia direction "in" al endpoint real de movimientos', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: MOVIMIENTOS.data[0] });
    renderCaja();
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Agregar efectivo' }));
    const inputMonto = await screen.findByLabelText('Monto');
    await usuario.type(inputMonto, '50');
    await usuario.click(screen.getByRole('button', { name: 'Agregar efectivo' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/caja/movimientos', {
        registerId: 'caja-1',
        direction: 'in',
        amount: 50,
        observations: undefined,
      });
    });
  });

  it('Retirar efectivo envia direction "out" al endpoint real de movimientos', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: MOVIMIENTOS.data[1] });
    renderCaja();
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Retirar efectivo' }));
    const inputMonto = await screen.findByLabelText('Monto');
    await usuario.type(inputMonto, '20');
    await usuario.click(screen.getByRole('button', { name: 'Retirar efectivo' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/caja/movimientos', {
        registerId: 'caja-1',
        direction: 'out',
        amount: 20,
        observations: undefined,
      });
    });
  });
});

describe('CajaPage — cierre de caja', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({ activeCompanyId: 'company-1', activeBranchId: 'branch-1' });
    mockGet({ '/caja/registros/caja-1/apertura-activa': APERTURA_ABIERTA });
  });

  it('usa expected_amount/counted_amount/difference_amount tal como los devuelve el backend, sin recalcularlos', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        apertura: { ...APERTURA_ABIERTA.data, is_open: false },
        cierre: {
          id: 'cl-1',
          opening_id: 'ap-1',
          expected_amount: '160.0000',
          counted_amount: '150.0000',
          difference_amount: '-10.0000',
        },
      },
    });
    renderCaja();

    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar caja' }));
    const inputContado = await screen.findByLabelText('Efectivo contado');
    await usuario.type(inputContado, '150');
    await usuario.click(screen.getByRole('button', { name: 'Cerrar caja' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/caja/cierres', {
        openingId: 'ap-1',
        countedAmount: 150,
      });
    });

    expect(await screen.findByText('Último cierre')).toBeInTheDocument();
    // El texto final viene literal de la respuesta del backend (-10.00), NO de una resta hecha en React.
    expect(screen.getByText(/Esperado: 160,00 US\$/)).toBeInTheDocument();
    expect(screen.getByText(/Contado: 150,00 US\$/)).toBeInTheDocument();
    expect(screen.getByText(/Diferencia: -10,00 US\$/)).toBeInTheDocument();
  });

  it('si el cierre falla, no muestra un resultado de cierre falso', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('cierre rechazado'));
    renderCaja();

    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar caja' }));
    const inputContado = await screen.findByLabelText('Efectivo contado');
    await usuario.type(inputContado, '150');
    await usuario.click(screen.getByRole('button', { name: 'Cerrar caja' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(screen.queryByText('Último cierre')).not.toBeInTheDocument();
    expect(screen.getByText('ABIERTA')).toBeInTheDocument();
  });
});
